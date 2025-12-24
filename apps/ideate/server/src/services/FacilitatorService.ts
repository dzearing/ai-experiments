import { query, type SDKAssistantMessage } from '@anthropic-ai/claude-code';
import { PersonaService, type Persona } from './PersonaService.js';
import { FacilitatorChatService, type FacilitatorMessage } from './FacilitatorChatService.js';
import { MCPToolsService, type ToolDefinition } from './MCPToolsService.js';
import { buildFacilitatorPrompt, buildContextSection } from '../prompts/facilitatorPrompt.js';

/**
 * Navigation context - where the user is in the app
 */
export interface NavigationContext {
  workspaceId?: string;
  workspaceName?: string;
  documentId?: string;
  documentTitle?: string;
  chatRoomId?: string;
  chatRoomName?: string;
  currentPage?: string;
}

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
/** Diagnostic entry for a request */
interface DiagnosticEntry {
  timestamp: string;
  messageId: string;
  userMessage: string;
  iterations: number;
  toolCalls: Array<{ name: string; input: Record<string, unknown>; output?: string }>;
  responseLength: number;
  durationMs: number;
  error?: string;
}

export class FacilitatorService {
  private personaService: PersonaService;
  private chatService: FacilitatorChatService;
  private toolsService: MCPToolsService;
  private persona: Persona | null = null;

  // Diagnostic tracking (keep last 50 entries)
  private diagnosticLog: DiagnosticEntry[] = [];
  private static MAX_DIAGNOSTIC_ENTRIES = 50;

  constructor() {
    this.personaService = new PersonaService();
    this.chatService = new FacilitatorChatService();
    this.toolsService = new MCPToolsService();
  }

  /**
   * Get diagnostic log for debugging.
   */
  getDiagnostics(): DiagnosticEntry[] {
    return [...this.diagnosticLog];
  }

  private addDiagnosticEntry(entry: DiagnosticEntry): void {
    this.diagnosticLog.push(entry);
    if (this.diagnosticLog.length > FacilitatorService.MAX_DIAGNOSTIC_ENTRIES) {
      this.diagnosticLog.shift();
    }
  }

  /**
   * Get tool definitions for Claude.
   */
  getToolDefinitions(): ToolDefinition[] {
    return this.toolsService.getToolDefinitions();
  }

  /**
   * Initialize the service by loading the facilitator persona.
   */
  initialize(): void {
    this.persona = this.personaService.getFacilitatorPersona();
    console.log(`[FacilitatorService] Loaded persona: ${this.persona.name}`);
  }

  /**
   * Get the persona (load if not already loaded).
   */
  private getPersona(): Persona {
    if (!this.persona) {
      this.persona = this.personaService.getFacilitatorPersona();
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
    navigationContext: NavigationContext,
    callbacks: StreamCallbacks
  ): Promise<void> {
    // Save the user message
    await this.chatService.addMessage(userId, 'user', content);

    // Start timing for diagnostics
    const startTime = Date.now();

    // Get persona and history
    const persona = this.getPersona();
    const history = await this.chatService.getMessages(userId);

    // Build the system prompt with navigation context
    const systemPrompt = this.buildSystemPrompt(persona, userName, navigationContext);

    // Build the full prompt with conversation history
    const conversationHistory = this.buildConversationHistory(history.slice(0, -1)); // Exclude the just-added user message
    let fullPrompt = conversationHistory
      ? `${conversationHistory}\n\nUser: ${content}`
      : content;

    // Generate message ID for the assistant response
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    let fullResponse = '';
    const toolCalls: FacilitatorMessage['toolCalls'] = [];

    // Max tool iterations to prevent infinite loops
    const maxToolIterations = 20;
    let toolIteration = 0;

    // Diagnostic logging for debugging
    console.log(`[FacilitatorService] Starting response for message: "${content.slice(0, 50)}..."`);

    try {
      while (toolIteration < maxToolIterations) {
        console.log(`[FacilitatorService] Iteration ${toolIteration + 1}/${maxToolIterations}`);
        // Use the query function from @anthropic-ai/claude-code
        const response = query({
          prompt: fullPrompt,
          options: {
            customSystemPrompt: systemPrompt,
            model: 'sonnet',
            permissionMode: 'bypassPermissions', // Auto-accept for server-side use
          },
        });

        let iterationResponse = '';

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
                  iterationResponse += text;
                } else if (block.type === 'tool_use') {
                  // SDK native tool use (Read, Write, Bash, etc.)
                  const sdkToolCall = block as { type: 'tool_use'; name: string; input: Record<string, unknown> };
                  callbacks.onToolUse({
                    name: sdkToolCall.name,
                    input: sdkToolCall.input || {},
                  });
                  toolCalls.push({
                    name: sdkToolCall.name,
                    input: sdkToolCall.input || {},
                  });
                }
              }
            } else if (typeof msgContent === 'string') {
              iterationResponse += msgContent;
            }
          } else if (message.type === 'user') {
            // User message (tool result from SDK)
            const userMsg = message as { type: 'user'; message: { content: unknown[] } };
            if (Array.isArray(userMsg.message?.content)) {
              for (const block of userMsg.message.content) {
                if ((block as { type?: string }).type === 'tool_result') {
                  const toolResult = block as { type: 'tool_result'; tool_use_id?: string; content?: string };
                  // Find matching tool call and mark complete
                  const lastPendingTool = toolCalls.find(tc => !tc.output);
                  if (lastPendingTool) {
                    lastPendingTool.output = toolResult.content || 'completed';
                    callbacks.onToolResult({
                      name: lastPendingTool.name,
                      output: lastPendingTool.output,
                    });
                  }
                }
              }
            }
          } else if (message.type === 'result') {
            // Final result message
            if (message.subtype === 'success' && message.result) {
              // If we haven't received streaming content, use the final result
              if (!iterationResponse) {
                iterationResponse = message.result;
              }
            } else if (message.subtype === 'error_during_execution') {
              callbacks.onError('An error occurred during processing');
              return;
            }
          }
        }

        // Check for tool use in the response
        const toolUseMatch = iterationResponse.match(/<tool_use>\s*([\s\S]*?)\s*<\/tool_use>/);

        if (toolUseMatch) {
          toolIteration++;

          // Parse the tool request
          try {
            const toolRequest = JSON.parse(toolUseMatch[1]);
            const toolName = toolRequest.name;
            const toolInput = toolRequest.input || {};

            // Record the tool call
            toolCalls.push({
              name: toolName,
              input: toolInput,
            });

            // Notify about tool use
            callbacks.onToolUse({ name: toolName, input: toolInput });

            // Execute the tool
            console.log(`[FacilitatorService] Executing tool: ${toolName}`, toolInput);
            const toolResult = await this.toolsService.executeTool(toolName, toolInput, userId);

            // Notify about tool result
            const resultOutput = JSON.stringify(toolResult.data || { error: toolResult.error }, null, 2);
            callbacks.onToolResult({ name: toolName, output: resultOutput });

            // Update the tool call with output
            toolCalls[toolCalls.length - 1].output = resultOutput;

            // Add the text before tool use to the response (if any)
            const textBeforeTool = iterationResponse.slice(0, iterationResponse.indexOf('<tool_use>')).trim();
            if (textBeforeTool) {
              console.log(`[FacilitatorService] Streaming text before tool (${textBeforeTool.length} chars): "${textBeforeTool.slice(0, 50)}..."`);
              fullResponse += textBeforeTool + '\n\n';
              callbacks.onTextChunk(textBeforeTool + '\n\n', messageId);
            }

            // Continue conversation with tool result - tell AI not to repeat previous text
            fullPrompt = `${fullPrompt}\n\nAssistant: ${iterationResponse}\n\nTool Result:\n\`\`\`json\n${resultOutput}\n\`\`\`\n\nIMPORTANT: Do NOT repeat any text you've already said. Continue with NEW content only based on the tool result. If the task is complete, simply acknowledge with a brief response.`;

          } catch (parseError) {
            console.error('[FacilitatorService] Failed to parse tool request:', parseError);
            // If we can't parse the tool request, just return the response as-is
            fullResponse += iterationResponse;
            callbacks.onTextChunk(iterationResponse, messageId);
            break;
          }
        } else {
          // No tool use, add to full response and we're done
          console.log(`[FacilitatorService] Final response (${iterationResponse.length} chars): "${iterationResponse.slice(0, 100)}..."`);
          fullResponse += iterationResponse;
          callbacks.onTextChunk(iterationResponse, messageId);
          break;
        }
      }

      if (toolIteration >= maxToolIterations) {
        const warningMsg = '\n\n*I\'ve reached my action limit for this request. Let me know if you need me to continue.*';
        fullResponse += warningMsg;
        callbacks.onTextChunk(warningMsg, messageId);
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

      // Add diagnostic entry
      this.addDiagnosticEntry({
        timestamp: new Date().toISOString(),
        messageId,
        userMessage: content.slice(0, 200),
        iterations: toolIteration + 1,
        toolCalls: toolCalls.map(tc => ({ name: tc.name, input: tc.input || {}, output: tc.output })),
        responseLength: fullResponse.length,
        durationMs: Date.now() - startTime,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[FacilitatorService] Error processing message:', error);
      callbacks.onError(errorMessage);

      // Add diagnostic entry for error
      this.addDiagnosticEntry({
        timestamp: new Date().toISOString(),
        messageId,
        userMessage: content.slice(0, 200),
        iterations: toolIteration + 1,
        toolCalls: toolCalls.map(tc => ({ name: tc.name, input: tc.input || {}, output: tc.output })),
        responseLength: fullResponse.length,
        durationMs: Date.now() - startTime,
        error: errorMessage,
      });
    }
  }

  /**
   * Build the system prompt with persona, user context, and available tools.
   */
  private buildSystemPrompt(persona: Persona, userName: string, navigationContext: NavigationContext): string {
    const toolDefinitions = this.toolsService.getToolDefinitions();

    const toolsDescription = toolDefinitions.map((tool) => {
      const params = Object.entries(tool.input_schema.properties || {})
        .map(([name, def]) => `  - ${name}: ${def.description}${tool.input_schema.required?.includes(name) ? ' (required)' : ''}`)
        .join('\n');
      return `**${tool.name}**: ${tool.description}${params ? '\nParameters:\n' + params : ''}`;
    }).join('\n\n');

    // Build current context description
    const contextParts: string[] = [];
    if (navigationContext.currentPage) {
      contextParts.push(`Current page: ${navigationContext.currentPage}`);
    }
    if (navigationContext.workspaceName && navigationContext.workspaceId) {
      contextParts.push(`Current workspace: "${navigationContext.workspaceName}" (ID: ${navigationContext.workspaceId})`);
    }
    if (navigationContext.documentTitle && navigationContext.documentId) {
      contextParts.push(`Current document: "${navigationContext.documentTitle}" (ID: ${navigationContext.documentId})`);
    }
    if (navigationContext.chatRoomName && navigationContext.chatRoomId) {
      contextParts.push(`Current chat room: "${navigationContext.chatRoomName}" (ID: ${navigationContext.chatRoomId})`);
    }

    return buildFacilitatorPrompt({
      personaPrompt: persona.systemPrompt,
      userName,
      contextSection: buildContextSection(contextParts),
      toolsDescription,
    });
  }

  /**
   * Build conversation history string from messages.
   */
  private buildConversationHistory(messages: FacilitatorMessage[]): string {
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
