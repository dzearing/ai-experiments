import { query, type SDKAssistantMessage } from '@anthropic-ai/claude-code';
import { createHash } from 'crypto';
import { PersonaService, type Persona } from './PersonaService.js';
import { FacilitatorChatService, type FacilitatorMessage } from './FacilitatorChatService.js';
import { MCPToolsService, type ToolDefinition } from './MCPToolsService.js';
import { buildFacilitatorPrompt, buildContextSection } from '../prompts/facilitatorPrompt.js';

/**
 * Cache entry for pre-generated greetings
 */
interface GreetingCache {
  greetings: string[];
  usedIndices: Set<number>;
}

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
  /** Active Thing ID (if viewing/selected a Thing) */
  activeThingId?: string;
  /** Active Thing name */
  activeThingName?: string;
  /** Referenced Thing IDs from ^thing-name references in message */
  referencedThingIds?: string[];
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

  // Greeting cache: key = hash of (displayName + persona systemPrompt)
  private greetingCache: Map<string, GreetingCache> = new Map();
  private static GREETINGS_PER_PERSONA = 20;

  constructor() {
    this.personaService = new PersonaService();
    this.chatService = new FacilitatorChatService();
    this.toolsService = new MCPToolsService();
  }

  /**
   * Generate a cache key for greetings based on display name and persona.
   */
  private getGreetingCacheKey(displayName: string, persona: Persona): string {
    const hash = createHash('sha256')
      .update(displayName + persona.systemPrompt)
      .digest('hex')
      .slice(0, 16);
    return `${displayName}-${hash}`;
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
   * Reload the persona from disk/settings.
   * Call this when the user changes their persona selection.
   */
  reloadPersona(): Persona {
    this.personaService.reloadPersona();
    this.persona = this.personaService.getFacilitatorPersona();
    console.log(`[FacilitatorService] Reloaded persona: ${this.persona.name}`);
    return this.persona;
  }

  /**
   * Set the persona by preset ID.
   * This loads the preset directly without requiring a user file.
   */
  setPersonaByPreset(presetId: string): Persona {
    const preset = this.personaService.getPreset(presetId);
    if (preset) {
      this.persona = preset;
      console.log(`[FacilitatorService] Set persona from preset: ${this.persona.name} (${presetId})`);
    } else {
      // Fallback to default facilitator persona
      this.persona = this.personaService.getFacilitatorPersona();
      console.log(`[FacilitatorService] Preset "${presetId}" not found, using default: ${this.persona.name}`);
    }
    return this.persona;
  }

  /**
   * Set a custom persona (from user file).
   */
  setCustomPersona(): Persona {
    const userPersona = this.personaService.getUserPersona();
    if (userPersona) {
      this.persona = userPersona;
      console.log(`[FacilitatorService] Set custom user persona: ${this.persona.name}`);
    } else {
      this.persona = this.personaService.getFacilitatorPersona();
      console.log(`[FacilitatorService] No custom persona found, using default: ${this.persona.name}`);
    }
    return this.persona;
  }

  /**
   * Get the current persona name.
   */
  getPersonaName(): string {
    return this.getPersona().name;
  }

  /**
   * Generate a greeting message using the current persona.
   * Uses cached greetings when available for instant response.
   * On first request for a persona, generates 20 greetings in batch and caches them.
   * @param userName - The user's name
   * @param displayName - Optional display name to use instead of persona.name (from settings)
   */
  async generateGreeting(userName: string, displayName?: string): Promise<string> {
    const persona = this.getPersona();
    const botName = displayName || persona.name;
    const cacheKey = this.getGreetingCacheKey(botName, persona);

    console.log(`[FacilitatorService] generateGreeting: botName="${botName}", persona="${persona.name}", cacheKey="${cacheKey}"`);
    console.log(`[FacilitatorService] Cache has ${this.greetingCache.size} entries, keys: [${Array.from(this.greetingCache.keys()).join(', ')}]`);

    // Check cache first
    const cached = this.greetingCache.get(cacheKey);
    if (cached && cached.greetings.length > 0) {
      const greeting = this.pickRandomGreeting(cached);
      if (greeting) {
        console.log(`[FacilitatorService] CACHE HIT! Using cached greeting (${cached.greetings.length - cached.usedIndices.size} remaining)`);
        return greeting;
      }
    }

    // No cache or all greetings used - generate batch and return first one
    console.log(`[FacilitatorService] CACHE MISS - Generating ${FacilitatorService.GREETINGS_PER_PERSONA} greetings for cache...`);
    const greetings = await this.generateGreetingBatch(userName, botName, persona);

    if (greetings.length > 0) {
      // Cache the greetings
      const newCache: GreetingCache = {
        greetings,
        usedIndices: new Set([0]), // Mark first one as used
      };
      this.greetingCache.set(cacheKey, newCache);
      console.log(`[FacilitatorService] Cached ${greetings.length} greetings for key: ${cacheKey}`);
      return greetings[0];
    }

    // Fallback if batch generation fails
    return `Hello ${userName}! I'm ${botName}. How can I help you today?`;
  }

  /**
   * Get a random greeting from the cache without making an API call.
   * Used for /clear command to show a new greeting instantly.
   * @param _userName - The user's name (unused, kept for API consistency)
   * @param displayName - Optional display name to use instead of persona.name
   * @returns A greeting from cache, or null if no cached greetings available
   */
  getRandomCachedGreeting(_userName: string, displayName?: string): string | null {
    const persona = this.getPersona();
    const botName = displayName || persona.name;
    const cacheKey = this.getGreetingCacheKey(botName, persona);

    const cached = this.greetingCache.get(cacheKey);
    if (!cached || cached.greetings.length === 0) {
      return null;
    }

    return this.pickRandomGreeting(cached);
  }

  /**
   * Pick a random greeting from the cache that hasn't been used yet.
   * If all greetings have been used, resets the used indices and picks again.
   */
  private pickRandomGreeting(cache: GreetingCache): string | null {
    if (cache.greetings.length === 0) return null;

    // If all greetings used, reset
    if (cache.usedIndices.size >= cache.greetings.length) {
      console.log('[FacilitatorService] All greetings used, resetting cache');
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
  private async generateGreetingBatch(userName: string, botName: string, persona: Persona): Promise<string[]> {
    const count = FacilitatorService.GREETINGS_PER_PERSONA;

    // Prompt that asks for multiple greetings in a structured format
    const batchPrompt = `You are "${botName}", an AI assistant. Here is your personality:

${persona.systemPrompt}

A user named "${userName}" will open a chat with you. Generate ${count} different greeting messages, each 1-2 sentences. Stay fully in character. Each greeting should:
- Introduce yourself by name ("${botName}")
- Be warm and welcoming
- Offer to help
- Be unique and varied (different wording, tone variations)

Output ONLY the greetings, one per line, numbered 1-${count}. No other text.

Example format:
1. Hello ${userName}! I'm ${botName}, ready to assist you today.
2. Welcome, ${userName}! ${botName} here - what can I help you with?
...and so on`;

    try {
      const response = query({
        prompt: batchPrompt,
        options: {
          permissionMode: 'bypassPermissions',
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
      console.log(`[FacilitatorService] Parsed ${greetings.length} greetings from batch response`);
      return greetings;
    } catch (error) {
      console.error('[FacilitatorService] Error generating greeting batch:', error);
      return [];
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
        if (greeting.length > 10) { // Sanity check for valid greeting
          greetings.push(greeting);
        }
      }
    }

    return greetings;
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
   * @param displayName - Optional display name to use instead of persona.name (from settings)
   */
  async processMessage(
    userId: string,
    userName: string,
    content: string,
    navigationContext: NavigationContext,
    callbacks: StreamCallbacks,
    displayName?: string
  ): Promise<void> {
    // Save the user message
    await this.chatService.addMessage(userId, 'user', content);

    // Start timing for diagnostics
    const startTime = Date.now();

    // Get persona and history
    const persona = this.getPersona();
    const history = await this.chatService.getMessages(userId);

    // Build the system prompt with navigation context
    const systemPrompt = this.buildSystemPrompt(persona, userName, navigationContext, displayName);

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
   * @param displayName - Optional display name to use instead of persona.name (from settings)
   */
  private buildSystemPrompt(persona: Persona, userName: string, navigationContext: NavigationContext, displayName?: string): string {
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
    if (navigationContext.activeThingName && navigationContext.activeThingId) {
      contextParts.push(`Active Thing: "${navigationContext.activeThingName}" (ID: ${navigationContext.activeThingId})`);
    }
    if (navigationContext.referencedThingIds && navigationContext.referencedThingIds.length > 0) {
      contextParts.push(`Referenced Things (from ^thing-name mentions): ${navigationContext.referencedThingIds.join(', ')}`);
    }

    // Add display name instruction to persona prompt if different from persona name
    let personaPrompt = persona.systemPrompt;
    if (displayName && displayName !== persona.name) {
      personaPrompt = `Your name is "${displayName}". Always refer to yourself as "${displayName}". ${personaPrompt}`;
    }

    return buildFacilitatorPrompt({
      personaPrompt,
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
