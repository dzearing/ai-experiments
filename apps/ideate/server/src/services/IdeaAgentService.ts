import { query, type SDKAssistantMessage } from '@anthropic-ai/claude-agent-sdk';
import { IdeaAgentChatService, type IdeaAgentMessage } from './IdeaAgentChatService.js';
import { IdeaAgentYjsClient } from './IdeaAgentYjsClient.js';
import type { YjsCollaborationHandler } from '../websocket/YjsCollaborationHandler.js';
import { buildIdeaAgentSystemPrompt } from '../prompts/ideaAgentPrompt.js';

/**
 * Cache entry for pre-generated greetings
 */
interface GreetingCache {
  greetings: string[];
  usedIndices: Set<number>;
}

/**
 * Idea context provided to the agent
 */
export interface IdeaContext {
  id: string;
  title: string;
  summary: string;
  description?: string;
  tags: string[];
  status: string;
}

/**
 * Structured idea update from the agent (for new ideas)
 */
export interface IdeaUpdate {
  title?: string;
  summary?: string;
  description?: string;
  tags?: string[];
}

/**
 * Text-anchored edit operation types for modifying existing documents.
 * Uses text strings to reliably find edit locations (positions are approximate hints).
 *
 * - `start`: Approximate character position (hint for faster search)
 * - `startText`: Unique text string that marks the START of the edit range
 * - `endText`: Text string that marks the END of the edit range (last content before end)
 * - `text`: New content (for replace/insert)
 */
export type DocumentEdit =
  | { action: 'replace'; start: number; startText: string; endText: string; text: string }
  | { action: 'insert'; start: number; afterText: string; text: string }
  | { action: 'delete'; start: number; startText: string; endText: string };

/**
 * Token usage information
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/**
 * Callbacks for streaming agent responses
 */
export interface StreamCallbacks {
  /** Called for each text chunk during streaming */
  onTextChunk: (text: string, messageId: string) => void;
  /** Called when the response is complete */
  onComplete: (message: IdeaAgentMessage) => void;
  /** Called when an error occurs */
  onError: (error: string) => void;
  /** Called when document editing starts */
  onDocumentEditStart?: () => void;
  /** Called when document editing ends */
  onDocumentEditEnd?: () => void;
  /** Called with token usage updates during streaming */
  onTokenUsage?: (usage: TokenUsage) => void;
}

/**
 * Suggestion from the agent for updating the idea
 */
export interface IdeaSuggestion {
  type: 'title' | 'summary' | 'description' | 'tags';
  value: string | string[];
  reason?: string;
}

/**
 * Build markdown content from idea fields
 */
function buildMarkdownContent(update: IdeaUpdate): string {
  const parts: string[] = [];

  // Title as H1
  parts.push(`# ${update.title || 'Untitled Idea'}`);
  parts.push('');

  // Summary as H2
  parts.push('## Summary');
  parts.push(update.summary || '_Add a brief summary of your idea..._');
  parts.push('');

  // Tags
  if (update.tags && update.tags.length > 0) {
    parts.push(`Tags: ${update.tags.join(', ')}`);
  } else {
    parts.push('Tags: _none_');
  }
  parts.push('');

  // Separator and description
  parts.push('---');
  parts.push('');
  parts.push(update.description || '_Describe your idea in detail..._');

  return parts.join('\n');
}

/**
 * Parse idea update from agent response (for new ideas)
 * Chat response comes FIRST (before the tag), update block at END
 */
function parseIdeaUpdate(response: string): { update: IdeaUpdate | null; chatResponse: string } {
  const updateMatch = response.match(/<idea_update>\s*([\s\S]*?)\s*<\/idea_update>/);

  if (!updateMatch) {
    return { update: null, chatResponse: response };
  }

  try {
    const update = JSON.parse(updateMatch[1]) as IdeaUpdate;
    // Chat response is everything BEFORE the update block (new format)
    const chatResponse = response.slice(0, response.indexOf('<idea_update>')).trim() || "I've created the document for you.";
    return { update, chatResponse };
  } catch {
    console.error('[IdeaAgentService] Failed to parse idea update JSON');
    return { update: null, chatResponse: response };
  }
}

/**
 * Parse document edits from agent response (for existing ideas)
 * Chat response comes FIRST (before the tag), edits block at END
 */
function parseDocumentEdits(response: string): { edits: DocumentEdit[] | null; chatResponse: string } {
  const editsMatch = response.match(/<document_edits>\s*([\s\S]*?)\s*<\/document_edits>/);

  if (!editsMatch) {
    return { edits: null, chatResponse: response };
  }

  try {
    const edits = JSON.parse(editsMatch[1]) as DocumentEdit[];
    // Chat response is everything BEFORE the edits block (new format)
    const chatResponse = response.slice(0, response.indexOf('<document_edits>')).trim() || "I've made the changes to your document.";
    return { edits, chatResponse };
  } catch {
    console.error('[IdeaAgentService] Failed to parse document edits JSON');
    return { edits: null, chatResponse: response };
  }
}

/**
 * Check if a partial response contains the start of an edit block
 */
function findEditBlockStart(text: string): number {
  const ideaUpdateStart = text.indexOf('<idea_update>');
  const docEditsStart = text.indexOf('<document_edits>');

  if (ideaUpdateStart >= 0 && docEditsStart >= 0) {
    return Math.min(ideaUpdateStart, docEditsStart);
  }
  return ideaUpdateStart >= 0 ? ideaUpdateStart : docEditsStart;
}

/**
 * Service for orchestrating idea agent chat with Claude.
 * Handles message processing and streaming responses for idea development.
 */
export class IdeaAgentService {
  private chatService: IdeaAgentChatService;
  private yjsClient: IdeaAgentYjsClient | null = null;

  // Greeting cache for new ideas
  private newIdeaGreetingCache: GreetingCache | null = null;
  private static GREETINGS_COUNT = 20;
  private isGeneratingGreetings = false;

  constructor(yjsHandler?: YjsCollaborationHandler) {
    this.chatService = new IdeaAgentChatService();
    if (yjsHandler) {
      this.yjsClient = new IdeaAgentYjsClient(yjsHandler);
    }
  }

  /**
   * Initialize the service by pre-generating greetings.
   * Call this on server startup for instant greetings.
   */
  async initialize(): Promise<void> {
    console.log('[IdeaAgentService] Initializing greeting cache...');
    await this.ensureGreetingsGenerated();
    console.log('[IdeaAgentService] Greeting cache ready');
  }

  /**
   * Get message history for an idea.
   */
  async getHistory(ideaId: string): Promise<IdeaAgentMessage[]> {
    return this.chatService.getMessages(ideaId);
  }

  /**
   * Clear message history for an idea.
   */
  async clearHistory(ideaId: string): Promise<void> {
    return this.chatService.clearMessages(ideaId);
  }

  /**
   * Delete all chat data for an idea.
   */
  async deleteIdeaChat(ideaId: string): Promise<void> {
    return this.chatService.deleteIdeaChat(ideaId);
  }

  /**
   * Save a greeting message to chat history.
   * Used to prevent duplicate greetings from race conditions.
   */
  async saveGreeting(ideaId: string, greeting: string): Promise<void> {
    await this.chatService.addMessage(ideaId, 'system', 'assistant', greeting);
  }

  /**
   * Process a user message and stream the response via callbacks.
   * Streams chat text in real-time, buffers edit blocks, then applies edits.
   */
  async processMessage(
    ideaId: string,
    userId: string,
    content: string,
    _ideaContext: IdeaContext,
    callbacks: StreamCallbacks,
    documentRoomName?: string
  ): Promise<void> {
    // Save the user message
    await this.chatService.addMessage(ideaId, userId, 'user', content);

    // Get history for context
    const history = await this.chatService.getMessages(ideaId);

    // Get current document content first (we need this to determine if it's a new idea)
    let documentContent: string | null = null;
    if (this.yjsClient && documentRoomName) {
      try {
        await this.yjsClient.connect(documentRoomName);
        documentContent = this.yjsClient.getContent(documentRoomName);
      } catch (error) {
        console.error('[IdeaAgentService] Error fetching document content:', error);
      }
    }

    // Determine if this is a new idea based on DOCUMENT CONTENT, not just ideaContext.id
    // The document is "new" if it has no content or only has placeholder content
    const placeholderContent = '# Untitled Idea\n\n## Summary\n_Add a brief summary of your idea..._\n\nTags: _none_\n\n---\n\n_Describe your idea in detail..._';
    const hasRealContent = documentContent &&
                           documentContent.trim().length > 0 &&
                           documentContent.trim() !== placeholderContent.trim() &&
                           !documentContent.includes('_Add a brief summary of your idea..._');

    const isNewIdea = !hasRealContent;

    console.log(`[IdeaAgentService] isNewIdea=${isNewIdea}, hasRealContent=${hasRealContent}, docLength=${documentContent?.length || 0}`);

    // Build the system prompt with idea context and document content
    const systemPrompt = buildIdeaAgentSystemPrompt(isNewIdea, documentContent);

    // Build the full prompt with conversation history
    const conversationHistory = this.buildConversationHistory(history.slice(0, -1));
    const fullPrompt = conversationHistory
      ? `${conversationHistory}\n\nUser: ${content}`
      : content;

    // Generate message ID for the assistant response
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Streaming state
    let fullResponse = '';
    let streamedChatLength = 0; // How much we've already streamed to the client
    let foundEditBlock = false; // Have we hit an edit block?
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    try {
      console.log(`[IdeaAgentService] Processing message for idea ${ideaId} (new: ${isNewIdea}): "${content.slice(0, 50)}..."`);

      // Use the query function from @anthropic-ai/claude-agent-sdk
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

      // Stream response in real-time
      for await (const message of response) {
        if (message.type === 'assistant') {
          const assistantMsg = message as SDKAssistantMessage;
          const msgContent = assistantMsg.message.content;

          // Extract usage info if available
          const usage = (assistantMsg.message as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;
          if (usage) {
            if (usage.input_tokens) totalInputTokens = usage.input_tokens;
            if (usage.output_tokens) {
              totalOutputTokens = usage.output_tokens;
              // Report token usage during streaming
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

            // Stream chat text until we hit an edit block
            if (!foundEditBlock) {
              const editBlockStart = findEditBlockStart(fullResponse);

              if (editBlockStart >= 0) {
                // Found start of edit block - stream up to it, then stop streaming
                foundEditBlock = true;
                const chatPortion = fullResponse.slice(streamedChatLength, editBlockStart).trim();
                if (chatPortion) {
                  callbacks.onTextChunk(chatPortion, messageId);
                  streamedChatLength = editBlockStart;
                }
              } else {
                // No edit block yet - stream new content
                // But be careful: don't stream partial tags like "<idea" or "<doc"
                // Stream up to the last safe point (before any potential tag start)
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

      // Final parse to get chat response and handle document updates
      let chatResponse = fullResponse;

      if (this.yjsClient && documentRoomName) {
        if (isNewIdea) {
          // For new ideas: parse <idea_update> and create full document
          const { update, chatResponse: updateChatResponse } = parseIdeaUpdate(fullResponse);
          if (update) {
            chatResponse = updateChatResponse;

            // Stream any remaining chat content not yet sent
            if (chatResponse.length > streamedChatLength) {
              callbacks.onTextChunk(chatResponse.slice(streamedChatLength), messageId);
            }

            try {
              callbacks.onDocumentEditStart?.();
              console.log(`[IdeaAgentService] Creating new document in room ${documentRoomName}`);

              const markdownContent = buildMarkdownContent(update);
              await this.yjsClient.streamReplaceContent(documentRoomName, markdownContent);

              this.yjsClient.clearCursor(documentRoomName);
              callbacks.onDocumentEditEnd?.();
              console.log(`[IdeaAgentService] New document created`);
            } catch (error) {
              console.error('[IdeaAgentService] Error creating document:', error);
            }
          } else {
            // No update block - stream any remaining content
            if (fullResponse.length > streamedChatLength) {
              callbacks.onTextChunk(fullResponse.slice(streamedChatLength), messageId);
            }
          }
        } else {
          // For existing ideas: parse <document_edits> and apply targeted edits
          const { edits, chatResponse: editsChatResponse } = parseDocumentEdits(fullResponse);
          if (edits && edits.length > 0) {
            chatResponse = editsChatResponse;

            // Stream any remaining chat content not yet sent
            if (chatResponse.length > streamedChatLength) {
              callbacks.onTextChunk(chatResponse.slice(streamedChatLength), messageId);
            }

            try {
              callbacks.onDocumentEditStart?.();
              console.log(`[IdeaAgentService] Applying ${edits.length} position-based edits to room ${documentRoomName}`);

              const results = await this.yjsClient.applyEdits(documentRoomName, edits);
              const failedEdits = results.filter(r => !r.success);
              if (failedEdits.length > 0) {
                console.warn('[IdeaAgentService] Some edits failed:', failedEdits);
              }

              callbacks.onDocumentEditEnd?.();
              console.log(`[IdeaAgentService] Edits applied: ${results.filter(r => r.success).length}/${edits.length} successful`);
            } catch (error) {
              console.error('[IdeaAgentService] Error applying edits:', error);
            }
          } else {
            // No edits - stream any remaining content
            if (fullResponse.length > streamedChatLength) {
              callbacks.onTextChunk(fullResponse.slice(streamedChatLength), messageId);
            }
          }
        }
      } else {
        // No Yjs client - just stream remaining content
        if (fullResponse.length > streamedChatLength) {
          callbacks.onTextChunk(fullResponse.slice(streamedChatLength), messageId);
        }
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

      console.log(`[IdeaAgentService] Completed response for idea ${ideaId} (${chatResponse.length} chars streamed)`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[IdeaAgentService] Error processing message:', error);
      callbacks.onError(errorMessage);
    }
  }

  /**
   * Find a safe point to stream up to, avoiding partial XML tags.
   * Returns the index up to which it's safe to stream.
   */
  private findSafeStreamEnd(text: string): number {
    // Look for potential partial tags at the end
    const potentialTagStarts = ['<idea_update', '<document_edits', '<idea', '<doc'];
    let safeEnd = text.length;

    for (const tagStart of potentialTagStarts) {
      // Check if we might be in the middle of typing this tag
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
   * Generate an initial greeting/prompt for a new idea chat.
   * For new ideas (no real content yet), uses cached general greetings.
   * For existing ideas with content, generates a context-specific greeting.
   */
  async generateGreeting(ideaContext: IdeaContext | null): Promise<string> {
    // For new ideas or ideas without meaningful content, use cached greetings
    if (!ideaContext ||
        ideaContext.id === 'new' ||
        !ideaContext.title.trim() ||
        ideaContext.title === 'Untitled Idea') {
      return this.getNewIdeaGreeting();
    }

    const hasDescription = ideaContext.description && ideaContext.description.trim().length > 0;

    if (hasDescription) {
      return `I see you're working on **"${ideaContext.title}"**. I've read through your description and I'm ready to help you develop this idea further.\n\nWhat would you like to explore? I can help you:\n- Brainstorm features or variations\n- Refine the concept\n- Identify potential challenges\n- Suggest improvements to the title, summary, or tags`;
    } else {
      return `I see you're working on **"${ideaContext.title}"**.\n\n> ${ideaContext.summary}\n\nLet's develop this idea together! You can start by telling me more about what you have in mind, or I can help you:\n- Expand on the concept\n- Explore different angles\n- Add a detailed description\n- Refine the title or summary`;
    }
  }

  /**
   * Get a greeting for a new idea.
   * Uses cached greetings for instant response.
   */
  async getNewIdeaGreeting(): Promise<string> {
    await this.ensureGreetingsGenerated();

    if (this.newIdeaGreetingCache && this.newIdeaGreetingCache.greetings.length > 0) {
      const greeting = this.pickRandomGreeting(this.newIdeaGreetingCache);
      if (greeting) {
        console.log(`[IdeaAgentService] Using cached greeting (${this.newIdeaGreetingCache.greetings.length - this.newIdeaGreetingCache.usedIndices.size} remaining)`);
        return greeting;
      }
    }

    // Fallback greeting
    return `What's your idea? Share it with me here and I'll draft the full document for you - title, summary, description, and tags. Or type directly in the editor if you prefer.`;
  }

  /**
   * Get a random cached greeting without API call.
   * Returns null if no cached greetings available.
   */
  getRandomCachedGreeting(): string | null {
    if (!this.newIdeaGreetingCache || this.newIdeaGreetingCache.greetings.length === 0) {
      return null;
    }
    return this.pickRandomGreeting(this.newIdeaGreetingCache);
  }

  /**
   * Ensure greetings have been generated.
   */
  private async ensureGreetingsGenerated(): Promise<void> {
    if (this.newIdeaGreetingCache && this.newIdeaGreetingCache.greetings.length > 0) {
      return;
    }

    if (this.isGeneratingGreetings) {
      // Wait for in-progress generation
      while (this.isGeneratingGreetings) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.isGeneratingGreetings = true;
    try {
      const greetings = await this.generateGreetingBatch();
      this.newIdeaGreetingCache = {
        greetings,
        usedIndices: new Set(),
      };
      console.log(`[IdeaAgentService] Generated ${greetings.length} greetings`);
    } finally {
      this.isGeneratingGreetings = false;
    }
  }

  /**
   * Pick a random greeting from the cache that hasn't been used yet.
   */
  private pickRandomGreeting(cache: GreetingCache): string | null {
    if (cache.greetings.length === 0) return null;

    // If all greetings used, reset
    if (cache.usedIndices.size >= cache.greetings.length) {
      console.log('[IdeaAgentService] All greetings used, resetting cache');
      cache.usedIndices.clear();
    }

    // Find unused indices
    const unusedIndices: number[] = [];
    for (let i = 0; i < cache.greetings.length; i++) {
      if (!cache.usedIndices.has(i)) {
        unusedIndices.push(i);
      }
    }

    if (unusedIndices.length === 0) return null;

    // Pick random unused index
    const randomIdx = unusedIndices[Math.floor(Math.random() * unusedIndices.length)];
    cache.usedIndices.add(randomIdx);
    return cache.greetings[randomIdx];
  }

  /**
   * Generate a batch of greetings for caching.
   */
  private async generateGreetingBatch(): Promise<string[]> {
    const count = IdeaAgentService.GREETINGS_COUNT;

    const batchPrompt = `You are an "Idea Agent" - a creative AI assistant that helps users develop and refine their ideas.

Generate ${count} different greeting messages for when a user opens the idea workspace to create a NEW idea. Each greeting should:
1. Be warm, brief, and encouraging (1-2 sentences)
2. PRIORITIZE asking the user to describe their idea briefly in chat (this is primary!)
3. Mention you'll help extrapolate and fill in the document (title, summary, description, tags)
4. Optionally mention they can also type directly in the editor (secondary option)
5. Be unique and varied in tone and wording

The workflow: User briefly describes idea in chat → Agent extrapolates and writes the document.

Output ONLY the greetings, one per line, numbered 1-${count}. No other text.

Example format:
1. What's your idea? Give me a quick description here and I'll draft the full document for you.
2. Share your idea with me! I'll turn your brief into a complete title, summary, and description.
...and so on`;

    try {
      console.log(`[IdeaAgentService] Generating ${count} greetings...`);
      const response = query({
        prompt: batchPrompt,
        options: {
          model: 'claude-sonnet-4-5-20250929',
          tools: [], // Empty array disables all built-in tools
          permissionMode: 'bypassPermissions',
          allowDangerouslySkipPermissions: true,
          maxTurns: 1,
        },
      });

      let fullResponse = '';
      for await (const message of response) {
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

      // Parse the numbered list
      const greetings = this.parseGreetingBatch(fullResponse);
      console.log(`[IdeaAgentService] Parsed ${greetings.length} greetings from batch response`);
      return greetings;
    } catch (error) {
      console.error('[IdeaAgentService] Error generating greeting batch:', error);
      return this.getFallbackGreetings();
    }
  }

  /**
   * Parse numbered greetings from the batch response.
   */
  private parseGreetingBatch(response: string): string[] {
    const greetings: string[] = [];
    const lines = response.split('\n');

    for (const line of lines) {
      // Match lines starting with number + period or number + parenthesis
      const match = line.match(/^\s*\d+[\.\)]\s*(.+)/);
      if (match && match[1]) {
        const greeting = match[1].trim();
        if (greeting.length > 20) { // Sanity check for valid greeting
          greetings.push(greeting);
        }
      }
    }

    return greetings.length > 0 ? greetings : this.getFallbackGreetings();
  }

  /**
   * Get fallback greetings if batch generation fails.
   */
  private getFallbackGreetings(): string[] {
    return [
      "What's your idea? Give me a quick description and I'll draft the full document for you.",
      "Share your idea with me! I'll turn your brief into a complete title, summary, and description.",
      "Tell me about your idea! I'll extrapolate it into a full document with all the details.",
      "Got an idea? Describe it briefly and I'll flesh it out in the document for you.",
      "What are you thinking? Share your concept and I'll write up the title, summary, and tags.",
      "Drop your idea here! I'll expand it into a complete document you can refine.",
      "Pitch me your idea! I'll turn it into a structured document with all the pieces.",
      "What's on your mind? Tell me your idea and I'll draft the details for you.",
      "Share your concept! I'll extrapolate it into a full idea document.",
      "Let's capture your idea! Describe it briefly and I'll write it up for you.",
    ];
  }

  /**
   * Build conversation history string from messages.
   */
  private buildConversationHistory(messages: IdeaAgentMessage[]): string {
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
