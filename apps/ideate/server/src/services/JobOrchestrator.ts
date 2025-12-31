/**
 * JobOrchestrator - Decompose large jobs into smaller sub-tasks
 *
 * This service provides a pattern for breaking down complex AI tasks
 * into smaller, more manageable sub-tasks that can be executed as
 * separate Claude queries.
 */

import { query, type SDKAssistantMessage } from '@anthropic-ai/claude-code';

/**
 * Context passed to all jobs and sub-tasks
 */
export interface JobContext {
  userId: string;
  workspaceId?: string;
  abortSignal?: AbortSignal;
  [key: string]: unknown;
}

/**
 * A sub-task that can be executed independently
 */
export interface SubTask<TOutput = unknown> {
  id: string;
  name: string;
  /** The prompt to send to Claude for this sub-task */
  prompt: string;
  /** Parse the Claude response into structured output */
  parseResponse: (response: string) => TOutput;
}

/**
 * Callbacks for observing job progress
 */
export interface JobCallbacks<TOutput = unknown> {
  onJobStart?: (totalTasks: number) => void;
  onSubTaskStart?: (task: SubTask<TOutput>, index: number, total: number) => void;
  onSubTaskComplete?: (task: SubTask<TOutput>, output: TOutput, index: number) => void;
  onSubTaskError?: (task: SubTask<TOutput>, error: Error, index: number) => void;
  onJobComplete?: (outputs: TOutput[]) => void;
}

/**
 * Configuration for job execution
 */
export interface JobConfig {
  /** Maximum concurrent sub-tasks (default: 3) */
  concurrency?: number;
  /** Retry failed sub-tasks (default: 1) */
  retries?: number;
  /** Continue on sub-task failure (default: true) */
  continueOnError?: boolean;
  /** Model to use for queries (default: 'sonnet') */
  model?: 'sonnet' | 'opus' | 'haiku';
}

/**
 * Result from executing a sub-task
 */
interface SubTaskResult<TOutput> {
  task: SubTask<TOutput>;
  output?: TOutput;
  error?: Error;
  success: boolean;
}

/**
 * Interface for jobs that can be decomposed
 */
export interface DecomposableJob<TInput, TOutput, TResult> {
  /** Unique job identifier */
  id: string;
  /** Job type for logging/tracking */
  type: string;
  /** Input data for the job */
  input: TInput;
  /** Job context */
  context: JobContext;

  /**
   * Determine if this job should be decomposed into sub-tasks.
   * Called before execution to decide strategy.
   */
  shouldDecompose(): boolean;

  /**
   * Break the job into smaller sub-tasks.
   * Each sub-task will run as a separate Claude query.
   */
  decompose(): SubTask<TOutput>[];

  /**
   * Aggregate outputs from all sub-tasks into final result.
   */
  aggregate(outputs: TOutput[]): TResult;

  /**
   * Execute as a single task (when shouldDecompose returns false).
   * This is the fallback for small jobs.
   */
  executeDirect(): Promise<TResult>;
}

/**
 * Execute a Claude query and extract text response
 */
async function executeQuery(
  prompt: string,
  model: 'sonnet' | 'opus' | 'haiku' = 'sonnet',
  abortSignal?: AbortSignal
): Promise<string> {
  const response = query({
    prompt,
    options: {
      model,
      permissionMode: 'bypassPermissions',
      maxTurns: 1,
    },
  });

  let fullResponse = '';

  for await (const message of response) {
    if (abortSignal?.aborted) {
      throw new Error('Operation cancelled');
    }

    if (message.type === 'assistant') {
      const assistantMsg = message as SDKAssistantMessage;
      const msgContent = assistantMsg.message.content;

      if (Array.isArray(msgContent)) {
        for (const block of msgContent) {
          if (block.type === 'text') {
            fullResponse += block.text;
          }
        }
      } else if (typeof msgContent === 'string') {
        fullResponse += msgContent;
      }
    } else if (message.type === 'result' && message.subtype === 'success' && message.result) {
      if (!fullResponse) {
        fullResponse = message.result;
      }
    }
  }

  return fullResponse;
}

/**
 * Execute a single sub-task with retries
 */
async function executeSubTask<TOutput>(
  task: SubTask<TOutput>,
  config: JobConfig,
  abortSignal?: AbortSignal
): Promise<SubTaskResult<TOutput>> {
  const maxRetries = config.retries ?? 1;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (abortSignal?.aborted) {
        throw new Error('Operation cancelled');
      }

      const response = await executeQuery(task.prompt, config.model, abortSignal);
      const output = task.parseResponse(response);

      return {
        task,
        output,
        success: true,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if cancelled
      if (abortSignal?.aborted) {
        break;
      }

      // Log retry attempt
      if (attempt < maxRetries) {
        console.log(`[JobOrchestrator] Retrying task "${task.name}" (attempt ${attempt + 2}/${maxRetries + 1})`);
      }
    }
  }

  return {
    task,
    error: lastError,
    success: false,
  };
}

/**
 * JobOrchestrator - Main orchestration class
 */
export class JobOrchestrator {
  private defaultConfig: JobConfig = {
    concurrency: 3,
    retries: 1,
    continueOnError: true,
    model: 'sonnet',
  };

  /**
   * Run a decomposable job
   */
  async run<TInput, TOutput, TResult>(
    job: DecomposableJob<TInput, TOutput, TResult>,
    callbacks?: JobCallbacks<TOutput>,
    config?: JobConfig
  ): Promise<TResult> {
    const effectiveConfig = { ...this.defaultConfig, ...config };

    // Check if we should decompose
    if (!job.shouldDecompose()) {
      console.log(`[JobOrchestrator] Job "${job.id}" running as single task`);
      return job.executeDirect();
    }

    // Decompose into sub-tasks
    const subTasks = job.decompose();
    console.log(`[JobOrchestrator] Job "${job.id}" decomposed into ${subTasks.length} sub-tasks`);

    callbacks?.onJobStart?.(subTasks.length);

    // Execute sub-tasks with controlled concurrency
    const outputs: TOutput[] = [];
    const results = await this.executeWithConcurrency(
      subTasks,
      effectiveConfig,
      job.context.abortSignal,
      callbacks
    );

    // Collect successful outputs
    for (const result of results) {
      if (result.success && result.output !== undefined) {
        outputs.push(result.output);
      } else if (!effectiveConfig.continueOnError && result.error) {
        throw result.error;
      }
    }

    callbacks?.onJobComplete?.(outputs);

    // Aggregate results
    return job.aggregate(outputs);
  }

  /**
   * Execute sub-tasks with controlled concurrency
   */
  private async executeWithConcurrency<TOutput>(
    tasks: SubTask<TOutput>[],
    config: JobConfig,
    abortSignal?: AbortSignal,
    callbacks?: JobCallbacks<TOutput>
  ): Promise<SubTaskResult<TOutput>[]> {
    const concurrency = config.concurrency ?? 3;
    const results: SubTaskResult<TOutput>[] = [];
    let currentIndex = 0;

    // Process tasks in batches
    while (currentIndex < tasks.length) {
      if (abortSignal?.aborted) {
        break;
      }

      // Get next batch
      const batch = tasks.slice(currentIndex, currentIndex + concurrency);
      const batchStartIndex = currentIndex;

      // Execute batch in parallel
      const batchPromises = batch.map(async (task, batchIndex) => {
        const taskIndex = batchStartIndex + batchIndex;

        callbacks?.onSubTaskStart?.(task, taskIndex, tasks.length);

        const result = await executeSubTask(task, config, abortSignal);

        if (result.success && result.output !== undefined) {
          callbacks?.onSubTaskComplete?.(task, result.output, taskIndex);
        } else if (result.error) {
          callbacks?.onSubTaskError?.(task, result.error, taskIndex);
        }

        return result;
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      currentIndex += concurrency;
    }

    return results;
  }
}

// Singleton instance
let orchestratorInstance: JobOrchestrator | null = null;

export function getJobOrchestrator(): JobOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new JobOrchestrator();
  }
  return orchestratorInstance;
}
