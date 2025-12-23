import { query, type SDKMessage, type SDKAssistantMessage } from '@anthropic-ai/claude-code';
import { PersonaService, type Persona } from './PersonaService.js';
import { FacilitatorChatService, type FacilitatorMessage } from './FacilitatorChatService.js';

/**
 * Callbacks for streaming Claude responses
 */
export interface StreamCallbacks {
  /** Called for each text chunk during streaming */
  onTextChunk: (text: string, messageId: string) => void;
  /** Called when a tool is being invoked */
  onToolUse: (info: { name: string; input: Record<string, unknown> }) => void;
  /** Called when a tool returns a result */
  onToolResult: (info: { name: string; output: string }) => void;
  /** Called when the response is complete */
  onComplete: (message: FacilitatorMessage) => void;
  /** Called when an error occurs */
  onError: (error: string) => void;
}

/**
 * Service for orchestrating facilitator chat with Claude.
 * Handles message processing, streaming responses, and tool integration.
 */
export class FacilitatorService {
  private personaService: PersonaService;
  private chatService: FacilitatorChatService;
  private persona: Persona | null = null;

  constructor() {
    this.personaService = new PersonaService();
    this.chatService = new FacilitatorChatService();
  }

  /**
   * Initialize the service by loading the facilitator persona.
   */
  async initialize(): Promise<void> {
    this.persona = await this.personaService.getFacilitatorPersona();
    console.log(`[FacilitatorService] Loaded persona: ${this.persona.name}`);
  }

  /**
   * Get the persona (load if not already loaded).
   */
  private async getPersona(): Promise<Persona> {
    if (!this.persona) {
      this.persona = await this.personaService.getFacilitatorPersona();
    }
    return this.persona;
  }

  /**
   * Get message history for a user.
   */
  async getHistory(userId: string): Promise<FacilitatorMessage[]> {
    return this.chatService.getMessages(userId);
  }

  /**
   * Clear message history for a user.
   */
  async clearHistory(userId: string): Promise<void> {
    return this.chatService.clearMessages(userId);
  }

  /**
   * Process a user message and stream the response via callbacks.
   */
  async processMessage(
    userId: string,
    userName: string,
    content: string,
    callbacks: StreamCallbacks
  ): Promise<void> {
    // Save the user message
    await this.chatService.addMessage(userId, 'user', content);

    // Get persona and history
    const persona = await this.getPersona();
    const history = await this.chatService.getMessages(userId);

    // Build the system prompt
    const systemPrompt = this.buildSystemPrompt(persona, userName);

    // Build the full prompt with conversation history
    const conversationHistory = this.buildConversationHistory(history.slice(0, -1)); // Exclude the just-added user message
    const fullPrompt = conversationHistory
      ? `${conversationHistory}\n\nUser: ${content}`
      : content;

    // Generate message ID for the assistant response
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    let fullResponse = '';
    const toolCalls: FacilitatorMessage['toolCalls'] = [];

    try {
      // Use the query function from @anthropic-ai/claude-code
      const response = query({
        prompt: fullPrompt,
        options: {
          customSystemPrompt: systemPrompt,
          model: 'sonnet',
          permissionMode: 'bypassPermissions', // Auto-accept for server-side use
        },
      });

      // Process streaming messages
      for await (const message of response) {
        if (message.type === 'assistant') {
          // Handle assistant message
          const assistantMsg = message as SDKAssistantMessage;
          const msgContent = assistantMsg.message.content;

          // Process content blocks
          if (Array.isArray(msgContent)) {
            for (const block of msgContent) {
              if (block.type === 'text') {
                const text = block.text;
                fullResponse += text;
                callbacks.onTextChunk(text, messageId);
              } else if (block.type === 'tool_use') {
                const toolName = block.name;
                const toolInput = block.input as Record<string, unknown>;

                toolCalls.push({
                  name: toolName,
                  input: toolInput,
                });

                callbacks.onToolUse({ name: toolName, input: toolInput });
              }
            }
          } else if (typeof msgContent === 'string') {
            fullResponse += msgContent;
            callbacks.onTextChunk(msgContent, messageId);
          }
        } else if (message.type === 'result') {
          // Final result message
          if (message.subtype === 'success' && message.result) {
            // If we haven't received streaming content, use the final result
            if (!fullResponse) {
              fullResponse = message.result;
              callbacks.onTextChunk(fullResponse, messageId);
            }
          } else if (message.subtype === 'error_during_execution') {
            callbacks.onError('An error occurred during processing');
            return;
          }
        }
      }

      // Save the assistant message
      const assistantMessage = await this.chatService.addMessage(
        userId,
        'assistant',
        fullResponse || 'I apologize, but I was unable to generate a response.',
        toolCalls.length > 0 ? toolCalls : undefined
      );

      // Call complete callback
      callbacks.onComplete({
        ...assistantMessage,
        id: messageId, // Use the ID we've been streaming to
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[FacilitatorService] Error processing message:', error);
      callbacks.onError(errorMessage);
    }
  }

  /**
   * Build the system prompt with persona and user context.
   */
  private buildSystemPrompt(persona: Persona, userName: string): string {
    return `${persona.systemPrompt}

You are chatting with ${userName}. Address them by name occasionally to make the conversation more personal.

Important guidelines:
- Be concise but helpful
- Use markdown formatting when appropriate
- If asked about the Ideate platform, explain its features
- If asked to do something you can't do, explain what you CAN do instead`;
  }

  /**
   * Build conversation history string from messages.
   */
  private buildConversationHistory(messages: FacilitatorMessage[]): string {
    // Take last 20 messages to keep context manageable
    const recentMessages = messages.slice(-20);

    if (recentMessages.length === 0) {
      return '';
    }

    return recentMessages
      .map((msg) => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');
  }
}
