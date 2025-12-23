import { query, type SDKAssistantMessage } from '@anthropic-ai/claude-code';
import { PersonaService, type Persona } from './PersonaService.js';
import { FacilitatorChatService, type FacilitatorMessage } from './FacilitatorChatService.js';
import { MCPToolsService, type ToolDefinition } from './MCPToolsService.js';

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
  private toolsService: MCPToolsService;
  private persona: Persona | null = null;

  constructor() {
    this.personaService = new PersonaService();
    this.chatService = new FacilitatorChatService();
    this.toolsService = new MCPToolsService();
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
    let fullPrompt = conversationHistory
      ? `${conversationHistory}\n\nUser: ${content}`
      : content;

    // Generate message ID for the assistant response
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    let fullResponse = '';
    const toolCalls: FacilitatorMessage['toolCalls'] = [];

    // Max tool iterations to prevent infinite loops
    const maxToolIterations = 5;
    let toolIteration = 0;

    try {
      while (toolIteration < maxToolIterations) {
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
                }
              }
            } else if (typeof msgContent === 'string') {
              iterationResponse += msgContent;
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
              fullResponse += textBeforeTool + '\n\n';
              callbacks.onTextChunk(textBeforeTool + '\n\n', messageId);
            }

            // Continue conversation with tool result
            fullPrompt = `${fullPrompt}\n\nAssistant: ${iterationResponse}\n\nTool Result:\n\`\`\`json\n${resultOutput}\n\`\`\`\n\nPlease continue your response to the user based on the tool result.`;

          } catch (parseError) {
            console.error('[FacilitatorService] Failed to parse tool request:', parseError);
            // If we can't parse the tool request, just return the response as-is
            fullResponse += iterationResponse;
            callbacks.onTextChunk(iterationResponse, messageId);
            break;
          }
        } else {
          // No tool use, add to full response and we're done
          fullResponse += iterationResponse;
          callbacks.onTextChunk(iterationResponse, messageId);
          break;
        }
      }

      if (toolIteration >= maxToolIterations) {
        const warningMsg = '\n\n*Note: Maximum tool iterations reached.*';
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[FacilitatorService] Error processing message:', error);
      callbacks.onError(errorMessage);
    }
  }

  /**
   * Build the system prompt with persona, user context, and available tools.
   */
  private buildSystemPrompt(persona: Persona, userName: string): string {
    const toolDefinitions = this.toolsService.getToolDefinitions();

    const toolsDescription = toolDefinitions.map((tool) => {
      const params = Object.entries(tool.input_schema.properties || {})
        .map(([name, def]) => `  - ${name}: ${def.description}${tool.input_schema.required?.includes(name) ? ' (required)' : ''}`)
        .join('\n');
      return `**${tool.name}**: ${tool.description}${params ? '\nParameters:\n' + params : ''}`;
    }).join('\n\n');

    return `${persona.systemPrompt}

You are chatting with ${userName}. Address them by name occasionally to make the conversation more personal.

## Available Tools

You have access to the following tools to help users with their workspaces and documents:

${toolsDescription}

## Tool Usage

When you need to use a tool, output a tool request in this exact format:
<tool_use>
{"name": "tool_name", "input": {"param1": "value1", "param2": "value2"}}
</tool_use>

After calling a tool, you will receive the result and can then respond to the user with the information.

## Guidelines

- Be concise but helpful
- Use markdown formatting when appropriate
- Use tools when the user asks about their workspaces, documents, or needs to search/create/modify content
- If asked about the Ideate platform, explain its features
- When presenting document or workspace information, format it nicely with markdown
- If a tool call fails, explain the error to the user and suggest alternatives`;
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
