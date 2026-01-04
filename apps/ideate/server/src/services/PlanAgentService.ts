import { query, type SDKAssistantMessage } from '@anthropic-ai/claude-agent-sdk';
import { PlanAgentChatService, type PlanAgentMessage } from './PlanAgentChatService.js';
import { PlanAgentYjsClient } from './PlanAgentYjsClient.js';
import { buildPlanAgentSystemPrompt, type PlanIdeaContext } from '../prompts/planAgentPrompt.js';
import type { YjsCollaborationHandler } from '../websocket/YjsCollaborationHandler.js';
import type { IdeaPlan, PlanPhase } from './IdeaService.js';
import type { DocumentEdit } from './IdeaAgentService.js';
import { getClaudeDiagnosticsService } from '../routes/diagnostics.js';
import type { AgentProgressCallbacks } from '../shared/agentProgress.js';
import { createStatusEvent } from '../shared/agentProgressUtils.js';

/**
 * Token usage information
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/**
 * Open question for the user to resolve
 */
export interface OpenQuestion {
  id: string;
  question: string;
  context?: string;
  selectionType: 'single' | 'multiple';
  options: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  allowCustom: boolean;
}

/**
 * Suggested response for quick user replies
 */
export interface SuggestedResponse {
  label: string;
  message: string;
}

/**
 * Callbacks for streaming plan agent responses
 */
export interface PlanStreamCallbacks extends AgentProgressCallbacks {
  /** Called for each text chunk during streaming */
  onTextChunk: (text: string, messageId: string) => void;
  /** Called when a plan update is detected */
  onPlanUpdate: (plan: Partial<IdeaPlan>) => void;
  /** Called when the response is complete */
  onComplete: (message: PlanAgentMessage) => void;
  /** Called when an error occurs */
  onError: (error: string) => void;
  /** Called with token usage updates during streaming */
  onTokenUsage?: (usage: TokenUsage) => void;
  /** Called when document editing starts */
  onDocumentEditStart?: () => void;
  /** Called when document editing ends */
  onDocumentEditEnd?: () => void;
  /** Called when open questions are extracted from the response */
  onOpenQuestions?: (questions: OpenQuestion[]) => void;
  /** Called when suggested responses are extracted from the response */
  onSuggestedResponses?: (suggestions: SuggestedResponse[]) => void;
}

/**
 * Parsed plan update from agent response
 */
interface ParsedPlanUpdate {
  phases?: PlanPhase[];
  workingDirectory?: string;
  repositoryUrl?: string;
  branch?: string;
  isClone?: boolean;
  workspaceId?: string;
}

/**
 * Parse plan update from agent response
 * Chat response comes FIRST (before the tag), plan block at END
 */
function parsePlanUpdate(response: string): { plan: ParsedPlanUpdate | null; chatResponse: string } {
  const planMatch = response.match(/<plan_update>\s*([\s\S]*?)\s*<\/plan_update>/);

  if (!planMatch) {
    return { plan: null, chatResponse: response };
  }

  try {
    const plan = JSON.parse(planMatch[1]) as ParsedPlanUpdate;
    // Chat response is everything BEFORE the plan block
    const chatResponse = response.slice(0, response.indexOf('<plan_update>')).trim() || "I've created the plan for you.";
    return { plan, chatResponse };
  } catch {
    console.error('[PlanAgentService] Failed to parse plan update JSON');
    return { plan: null, chatResponse: response };
  }
}

/**
 * Parse implementation plan document update from agent response
 */
function parseImplPlanUpdate(response: string): { content: string | null; chatResponse: string } {
  const implPlanMatch = response.match(/<impl_plan_update>\s*([\s\S]*?)\s*<\/impl_plan_update>/);

  if (!implPlanMatch) {
    return { content: null, chatResponse: response };
  }

  // The content is the markdown directly (not JSON)
  const content = implPlanMatch[1].trim();
  const chatResponse = response.slice(0, response.indexOf('<impl_plan_update>')).trim() || "I've updated the implementation plan.";
  return { content, chatResponse };
}

/**
 * Parse implementation plan document edits from agent response
 */
function parseImplPlanEdits(response: string): { edits: DocumentEdit[] | null; chatResponse: string } {
  const editsMatch = response.match(/<impl_plan_edits>\s*([\s\S]*?)\s*<\/impl_plan_edits>/);

  if (!editsMatch) {
    return { edits: null, chatResponse: response };
  }

  try {
    const edits = JSON.parse(editsMatch[1]) as DocumentEdit[];
    const chatResponse = response.slice(0, response.indexOf('<impl_plan_edits>')).trim() || "I've made edits to the implementation plan.";
    return { edits, chatResponse };
  } catch {
    console.error('[PlanAgentService] Failed to parse impl plan edits JSON');
    return { edits: null, chatResponse: response };
  }
}

/**
 * Parse open questions from agent response
 */
function parseOpenQuestions(response: string): { questions: OpenQuestion[] | null; responseWithoutQuestions: string } {
  const questionsMatch = response.match(/<open_questions>\s*([\s\S]*?)\s*<\/open_questions>/);

  if (!questionsMatch) {
    return { questions: null, responseWithoutQuestions: response };
  }

  try {
    const rawQuestions = JSON.parse(questionsMatch[1]) as OpenQuestion[];
    // Default allowCustom to true so users can always provide custom answers
    const questions = rawQuestions.map(q => ({
      ...q,
      allowCustom: q.allowCustom !== false,
    }));
    // Remove the questions block from the response
    const responseWithoutQuestions = response.replace(/<open_questions>[\s\S]*?<\/open_questions>/, '').trim();
    return { questions, responseWithoutQuestions };
  } catch {
    console.error('[PlanAgentService] Failed to parse open questions JSON');
    return { questions: null, responseWithoutQuestions: response };
  }
}

/**
 * Parse suggested responses from agent response
 */
function parseSuggestedResponses(response: string): { suggestions: SuggestedResponse[] | null; responseWithoutSuggestions: string } {
  const suggestionsMatch = response.match(/<suggested_responses>\s*([\s\S]*?)\s*<\/suggested_responses>/);

  if (!suggestionsMatch) {
    return { suggestions: null, responseWithoutSuggestions: response };
  }

  try {
    const suggestions = JSON.parse(suggestionsMatch[1]) as SuggestedResponse[];
    const responseWithoutSuggestions = response.replace(/<suggested_responses>[\s\S]*?<\/suggested_responses>/, '').trim();
    return { suggestions, responseWithoutSuggestions };
  } catch {
    console.error('[PlanAgentService] Failed to parse suggested responses JSON');
    return { suggestions: null, responseWithoutSuggestions: response };
  }
}

/**
 * Check if a partial response contains the start of any special block
 */
function findBlockStart(text: string): number {
  const planStart = text.indexOf('<plan_update>');
  const implPlanStart = text.indexOf('<impl_plan_update>');
  const implEditsStart = text.indexOf('<impl_plan_edits>');
  const openQuestionsStart = text.indexOf('<open_questions>');
  const suggestionsStart = text.indexOf('<suggested_responses>');

  const starts = [planStart, implPlanStart, implEditsStart, openQuestionsStart, suggestionsStart].filter(s => s >= 0);
  return starts.length > 0 ? Math.min(...starts) : -1;
}

/**
 * Service for orchestrating plan agent chat with Claude.
 * Handles message processing and streaming responses for implementation planning.
 * Supports editing the Implementation Plan document via Yjs.
 */
export class PlanAgentService {
  private chatService: PlanAgentChatService;
  private yjsClient: PlanAgentYjsClient | null = null;

  constructor(yjsHandler?: YjsCollaborationHandler) {
    this.chatService = new PlanAgentChatService();
    if (yjsHandler) {
      this.yjsClient = new PlanAgentYjsClient(yjsHandler);
    }
  }

  /**
   * Get message history for an idea's plan chat.
   */
  async getHistory(ideaId: string): Promise<PlanAgentMessage[]> {
    return this.chatService.getMessages(ideaId);
  }

  /**
   * Clear message history for an idea's plan chat.
   */
  async clearHistory(ideaId: string): Promise<void> {
    return this.chatService.clearMessages(ideaId);
  }

  /**
   * Delete all plan chat data for an idea.
   */
  async deleteIdeaChat(ideaId: string): Promise<void> {
    return this.chatService.deleteIdeaChat(ideaId);
  }

  /**
   * Generate an initial greeting for the plan agent.
   */
  async generateGreeting(ideaContext: PlanIdeaContext): Promise<string> {
    const { title, summary, thingContext } = ideaContext;

    // Build a contextual greeting based on what we know
    let greeting = `Let's create an implementation plan for **"${title}"**.`;

    if (summary) {
      greeting += `\n\n> ${summary}`;
    }

    if (thingContext) {
      greeting += `\n\nThis idea is connected to **${thingContext.name}** (${thingContext.type}).`;
    }

    greeting += `\n\nTo create a good plan, I need to understand a few things:

1. **Technology stack** - What languages, frameworks, or tools will we use?
2. **Environment** - Is this for an existing project, or are we starting fresh?
3. **Scope** - What's the minimum viable version look like?

Feel free to share any details, and I'll start building out the phases and tasks.`;

    return greeting;
  }

  /**
   * Save a greeting message to plan chat history.
   */
  async saveGreeting(ideaId: string, greeting: string): Promise<void> {
    await this.chatService.addMessage(ideaId, 'system', 'assistant', greeting);
  }

  /**
   * Process a user message and stream the response via callbacks.
   * Streams chat text in real-time, buffers plan blocks, then calls onPlanUpdate.
   * Handles Implementation Plan document edits via Yjs if documentRoomName provided.
   * @param isAutoStart - If true, skip saving the user message (used for server-initiated auto-start)
   */
  async processMessage(
    ideaId: string,
    userId: string,
    content: string,
    ideaContext: PlanIdeaContext,
    callbacks: PlanStreamCallbacks,
    documentRoomName?: string,
    isAutoStart = false
  ): Promise<void> {
    // Save the user message (unless this is an auto-start)
    if (!isAutoStart) {
      await this.chatService.addMessage(ideaId, userId, 'user', content);
    }

    // Get history for context
    const history = await this.chatService.getMessages(ideaId);

    // Connect to Yjs room if document editing is enabled
    if (this.yjsClient && documentRoomName) {
      try {
        await this.yjsClient.connect(documentRoomName);
      } catch (error) {
        console.error('[PlanAgentService] Failed to connect to Yjs room:', error);
      }
    }

    // Build the system prompt with idea context
    const systemPrompt = buildPlanAgentSystemPrompt(ideaContext);

    // Build the full prompt with conversation history
    const conversationHistory = this.buildConversationHistory(history.slice(0, -1));
    const fullPrompt = conversationHistory
      ? `${conversationHistory}\n\nUser: ${content}`
      : content;

    // Generate message ID for the assistant response
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Streaming state
    let fullResponse = '';
    let streamedChatLength = 0;
    let foundBlockStart = false;
    let questionsSent = false;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // Track this request for diagnostics
    const diagnosticsService = getClaudeDiagnosticsService();
    const requestId = diagnosticsService.startRequest('planagent', ideaId, content.slice(0, 100));

    try {
      console.log(`[PlanAgentService] Processing message for idea ${ideaId}: "${content.slice(0, 50)}..."`);

      // Use the query function from @anthropic-ai/claude-agent-sdk
      console.log(`[PlanAgentService] Starting query with model claude-sonnet-4-5-20250929...`);
      const response = query({
        prompt: fullPrompt,
        options: {
          systemPrompt,
          model: 'claude-sonnet-4-5-20250929',
          tools: [],
          permissionMode: 'bypassPermissions',
          allowDangerouslySkipPermissions: true,
          maxTurns: 1,
        },
      });

      console.log(`[PlanAgentService] Query created, starting stream...`);
      // Mark as streaming once we start receiving
      let hasStartedStreaming = false;

      // Stream response in real-time
      for await (const message of response) {
        console.log(`[PlanAgentService] Received message type: ${message.type}`);
        if (message.type === 'assistant') {
          // Update diagnostics to streaming status on first content
          if (!hasStartedStreaming) {
            hasStartedStreaming = true;
            diagnosticsService.updateRequest(requestId, { status: 'streaming' });
          }
          const assistantMsg = message as SDKAssistantMessage;
          const msgContent = assistantMsg.message.content;

          // Extract usage info if available
          const usage = (assistantMsg.message as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;
          if (usage) {
            if (usage.input_tokens) totalInputTokens = usage.input_tokens;
            if (usage.output_tokens) {
              totalOutputTokens = usage.output_tokens;
              callbacks.onTokenUsage?.({
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
              });
            }
          }

          // Extract text from message
          let newText = '';
          if (Array.isArray(msgContent)) {
            for (const block of msgContent) {
              if (block.type === 'text') {
                newText += block.text;
              }
            }
          } else if (typeof msgContent === 'string') {
            newText = msgContent;
          }

          if (newText) {
            fullResponse += newText;

            // Check for open questions block and send immediately when found
            if (!questionsSent && fullResponse.includes('</open_questions>')) {
              callbacks.onProgressEvent?.(createStatusEvent('Extracting clarifying questions...'));
              const { questions, responseWithoutQuestions } = parseOpenQuestions(fullResponse);
              if (questions && questions.length > 0) {
                console.log(`[PlanAgentService] Found ${questions.length} open questions, sending to client`);
                callbacks.onOpenQuestions?.(questions);
                questionsSent = true;
                // Update fullResponse to exclude the questions block
                fullResponse = responseWithoutQuestions;
              }
            }

            // Stream chat text until we hit any special block
            if (!foundBlockStart) {
              const blockStartPos = findBlockStart(fullResponse);

              if (blockStartPos >= 0) {
                // Found start of special block - stream up to it, then stop streaming
                foundBlockStart = true;
                const chatPortion = fullResponse.slice(streamedChatLength, blockStartPos).trim();
                if (chatPortion) {
                  callbacks.onTextChunk(chatPortion, messageId);
                  streamedChatLength = blockStartPos;
                }
              } else {
                // No special block yet - stream new content
                // But be careful: don't stream partial tags
                const safeEnd = this.findSafeStreamEnd(fullResponse);
                if (safeEnd > streamedChatLength) {
                  const newChunk = fullResponse.slice(streamedChatLength, safeEnd);
                  callbacks.onTextChunk(newChunk, messageId);
                  streamedChatLength = safeEnd;
                }
              }
            }
          }
        } else if (message.type === 'result') {
          if (message.subtype === 'success' && message.result) {
            if (!fullResponse) {
              fullResponse = message.result;
            }
            // Extract final usage from result if available
            const resultUsage = (message as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;
            if (resultUsage) {
              if (resultUsage.input_tokens) totalInputTokens = resultUsage.input_tokens;
              if (resultUsage.output_tokens) totalOutputTokens = resultUsage.output_tokens;
              callbacks.onTokenUsage?.({
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
              });
            }
          } else if (message.subtype === 'error_during_execution') {
            callbacks.onError('An error occurred during processing');
            return;
          }
        }
      }

      // Log full response for debugging document streaming issues
      console.log(`[PlanAgentService] Full response length: ${fullResponse.length}`);
      console.log(`[PlanAgentService] Has impl_plan_update tag: ${fullResponse.includes('<impl_plan_update>')}`);
      console.log(`[PlanAgentService] Has plan_update tag: ${fullResponse.includes('<plan_update>')}`);
      console.log(`[PlanAgentService] Response preview (last 500 chars): ${fullResponse.slice(-500)}`);

      // Parse suggested responses FIRST (before any streaming of remaining content)
      // This ensures the <suggested_responses> block never gets streamed to the client
      const { suggestions, responseWithoutSuggestions: fullResponseClean } = parseSuggestedResponses(fullResponse);
      const suggestionsToSend = suggestions;

      // Final parse to get chat response and handle various block types
      // All block types are processed independently (not mutually exclusive)
      let chatResponse = fullResponseClean;

      // 1. Check for execution plan update (phases/tasks)
      callbacks.onProgressEvent?.(createStatusEvent('Parsing implementation plan...'));
      const { plan, chatResponse: planChatResponse } = parsePlanUpdate(chatResponse);
      if (plan) {
        chatResponse = planChatResponse;

        // Notify about plan update
        callbacks.onProgressEvent?.(createStatusEvent(`Creating ${plan.phases?.length || 0} phases...`));
        console.log(`[PlanAgentService] Plan update detected with ${plan.phases?.length || 0} phases`);
        callbacks.onPlanUpdate({
          phases: plan.phases,
          workingDirectory: plan.workingDirectory || '',
          repositoryUrl: plan.repositoryUrl,
          branch: plan.branch,
          isClone: plan.isClone,
          workspaceId: plan.workspaceId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // 2. Check for Implementation Plan document update (full replacement)
      // Process independently - can have both plan_update AND impl_plan_update
      console.log(`[PlanAgentService] Checking for impl_plan_update. yjsClient: ${!!this.yjsClient}, documentRoomName: ${documentRoomName}`);
      if (this.yjsClient && documentRoomName) {
        const { content: implPlanContent, chatResponse: implPlanChatResponse } = parseImplPlanUpdate(chatResponse);
        console.log(`[PlanAgentService] parseImplPlanUpdate result: found=${!!implPlanContent}, contentLength=${implPlanContent?.length ?? 0}`);
        if (implPlanContent) {
          chatResponse = implPlanChatResponse;

          try {
            callbacks.onProgressEvent?.(createStatusEvent('Writing design document...'));
            callbacks.onDocumentEditStart?.();
            console.log(`[PlanAgentService] Creating/replacing Implementation Plan document in room ${documentRoomName}, content length: ${implPlanContent.length}`);

            await this.yjsClient.streamReplaceContent(documentRoomName, implPlanContent);
            this.yjsClient.clearCursor(documentRoomName);

            callbacks.onDocumentEditEnd?.();
            console.log(`[PlanAgentService] Implementation Plan document updated successfully`);
          } catch (error) {
            console.error('[PlanAgentService] Error updating Implementation Plan document:', error);
            callbacks.onDocumentEditEnd?.();
          }
        } else {
          console.log(`[PlanAgentService] No impl_plan_update found in response. Response snippet: ${chatResponse.slice(0, 200)}`);
        }
      } else {
        console.log(`[PlanAgentService] Skipping impl_plan_update: yjsClient=${!!this.yjsClient}, documentRoomName=${documentRoomName}`);
      }

      // 3. Check for Implementation Plan document edits (targeted changes)
      // Process independently - impl_plan_edits and impl_plan_update are mutually exclusive
      if (this.yjsClient && documentRoomName) {
        const { edits, chatResponse: editsChatResponse } = parseImplPlanEdits(chatResponse);
        if (edits && edits.length > 0) {
          chatResponse = editsChatResponse;

          try {
            callbacks.onProgressEvent?.(createStatusEvent(`Applying ${edits.length} document edits...`));
            callbacks.onDocumentEditStart?.();
            console.log(`[PlanAgentService] Applying ${edits.length} edits to Implementation Plan in room ${documentRoomName}`);

            const results = await this.yjsClient.applyEdits(documentRoomName, edits);
            const failedEdits = results.filter(r => !r.success);
            if (failedEdits.length > 0) {
              console.warn('[PlanAgentService] Some edits failed:', failedEdits);
            }

            callbacks.onDocumentEditEnd?.();
            console.log(`[PlanAgentService] Edits applied: ${results.filter(r => r.success).length}/${edits.length} successful`);
          } catch (error) {
            console.error('[PlanAgentService] Error applying edits:', error);
            callbacks.onDocumentEditEnd?.();
          }
        }
      }

      // Stream any remaining chat content not yet sent
      if (chatResponse.length > streamedChatLength) {
        callbacks.onTextChunk(chatResponse.slice(streamedChatLength), messageId);
      }

      // Send suggested responses (already parsed at start of final processing)
      if (suggestionsToSend && suggestionsToSend.length > 0) {
        console.log(`[PlanAgentService] Found ${suggestionsToSend.length} suggested responses`);
        callbacks.onSuggestedResponses?.(suggestionsToSend);
      }

      // Save the assistant message (chat portion only)
      const assistantMessage = await this.chatService.addMessage(
        ideaId,
        userId,
        'assistant',
        chatResponse || 'I apologize, but I was unable to generate a response.'
      );

      // Call complete callback
      callbacks.onComplete({
        ...assistantMessage,
        id: messageId,
      });

      // Mark diagnostics request as complete
      diagnosticsService.completeRequest(requestId);

      console.log(`[PlanAgentService] Completed response for idea ${ideaId} (${chatResponse.length} chars streamed)`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[PlanAgentService] Error processing message:', error);

      // Mark diagnostics request as failed
      diagnosticsService.completeRequest(requestId, errorMessage);

      callbacks.onError(errorMessage);
    }
  }

  /**
   * Find a safe point to stream up to, avoiding partial XML tags.
   */
  private findSafeStreamEnd(text: string): number {
    const potentialTagStarts = [
      '<plan_update',
      '<impl_plan_update',
      '<impl_plan_edits',
      '<open_questions',
      '<suggested_responses',
      '<plan',
      '<impl',
      '<open',
      '<suggested'
    ];
    let safeEnd = text.length;

    for (const tagStart of potentialTagStarts) {
      for (let i = 1; i <= tagStart.length; i++) {
        const partial = tagStart.slice(0, i);
        if (text.endsWith(partial)) {
          safeEnd = Math.min(safeEnd, text.length - partial.length);
          break;
        }
      }
    }

    return safeEnd;
  }

  /**
   * Build conversation history string from messages.
   */
  private buildConversationHistory(messages: PlanAgentMessage[]): string {
    // Take last 20 messages to keep context manageable
    const recentMessages = messages.slice(-20);

    return recentMessages
      .map((msg) => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');
  }
}
