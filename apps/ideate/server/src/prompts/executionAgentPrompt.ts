import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { IdeaPlan, PlanPhase } from '../services/IdeaService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the execution agent prompt template from markdown file
const EXECUTION_AGENT_PROMPT = fs.readFileSync(
  path.join(__dirname, 'executionAgent.md'),
  'utf-8'
);

/**
 * Idea context provided to the execution agent
 */
export interface ExecutionIdeaContext {
  id: string;
  title: string;
  summary: string;
  description?: string;
}

/**
 * Build the plan overview section
 */
function buildPlanOverview(plan: IdeaPlan): string {
  const lines: string[] = [];

  for (let i = 0; i < plan.phases.length; i++) {
    const phase = plan.phases[i];
    const phaseNum = i + 1;
    const completedTasks = phase.tasks.filter(t => t.completed).length;
    const totalTasks = phase.tasks.length;
    const status = completedTasks === totalTasks
      ? '✓ Complete'
      : completedTasks > 0
        ? `${completedTasks}/${totalTasks} tasks`
        : 'Pending';

    lines.push(`- **Phase ${phaseNum}**: ${phase.title} (${status})`);
  }

  return lines.join('\n');
}

/**
 * Build the current phase tasks section
 * Includes phase ID at the top for reference in progress reporting
 */
function buildPhaseTasks(phase: PlanPhase): string {
  const lines: string[] = [];

  // Include phase ID at the top for easy reference
  lines.push(`**Phase ID:** \`${phase.id}\``);
  lines.push('');
  lines.push('**Tasks:**');

  for (const task of phase.tasks) {
    const status = task.completed
      ? '✓'
      : task.inProgress
        ? '⟳'
        : '☐';
    lines.push(`${status} \`${task.id}\`: ${task.title}`);
  }

  return lines.join('\n');
}

/**
 * Build repository information section
 */
function buildRepositoryInfo(plan: IdeaPlan): string {
  const parts: string[] = [];

  if (plan.repositoryUrl) {
    parts.push(`Repository: ${plan.repositoryUrl}`);
  }
  if (plan.branch) {
    parts.push(`Branch: ${plan.branch}`);
  }
  if (plan.isClone) {
    parts.push('*Working on a cloned copy for safety*');
  }

  return parts.length > 0 ? parts.join('\n') : '';
}

/**
 * Build the system prompt for the Execution Agent.
 *
 * @param ideaContext - The idea being executed
 * @param plan - The implementation plan
 * @param currentPhaseId - The phase currently being executed
 */
export function buildExecutionAgentSystemPrompt(
  ideaContext: ExecutionIdeaContext,
  plan: IdeaPlan,
  currentPhaseId: string
): string {
  let prompt = EXECUTION_AGENT_PROMPT;

  // Find current phase
  const currentPhaseIndex = plan.phases.findIndex(p => p.id === currentPhaseId);
  const currentPhase = plan.phases[currentPhaseIndex];

  if (!currentPhase) {
    throw new Error(`Phase ${currentPhaseId} not found in plan`);
  }

  // Replace idea context placeholders
  prompt = prompt.replace('{{IDEA_TITLE}}', ideaContext.title || 'Untitled Idea');

  prompt = prompt.replace(
    '{{IDEA_SUMMARY}}',
    ideaContext.summary
      ? `> ${ideaContext.summary}`
      : ''
  );

  // Replace plan overview
  prompt = prompt.replace('{{PLAN_OVERVIEW}}', buildPlanOverview(plan));

  // Replace current phase info
  prompt = prompt.replace('{{CURRENT_PHASE_NUMBER}}', String(currentPhaseIndex + 1));
  prompt = prompt.replace('{{CURRENT_PHASE_TITLE}}', currentPhase.title);
  prompt = prompt.replace(
    '{{CURRENT_PHASE_DESCRIPTION}}',
    currentPhase.description || ''
  );
  prompt = prompt.replace('{{CURRENT_PHASE_TASKS}}', buildPhaseTasks(currentPhase));

  // Replace working directory and repository info
  prompt = prompt.replace('{{WORKING_DIRECTORY}}', plan.workingDirectory);
  prompt = prompt.replace('{{REPOSITORY_INFO}}', buildRepositoryInfo(plan));

  return prompt;
}
