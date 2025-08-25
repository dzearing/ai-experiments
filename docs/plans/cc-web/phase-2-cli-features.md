# Phase 2: CLI Feature Parity

## Overview

Phase 2 implements all CLI features including slash commands, keyboard shortcuts, history navigation, and interactive behaviors to achieve complete feature parity with the Claude Code CLI.

## Slash Commands Implementation

### Command Registry

```typescript
// src/commands/command-registry.ts
export interface SlashCommand {
  name: string;
  description: string;
  aliases?: string[];
  execute: (args: string[], context: CommandContext) => Promise<CommandResult>;
  autocomplete?: (partial: string) => string[];
}

export class CommandRegistry {
  private commands = new Map<string, SlashCommand>();
  
  constructor() {
    this.registerBuiltInCommands();
  }
  
  private registerBuiltInCommands(): void {
    // /help
    this.register({
      name: 'help',
      description: 'Show available commands and shortcuts',
      execute: async (args, context) => {
        const help = this.generateHelpText();
        return {
          type: 'display',
          content: help,
          ephemeral: true // Don't save to conversation
        };
      }
    });
    
    // /clear
    this.register({
      name: 'clear',
      description: 'Clear the current conversation',
      execute: async (args, context) => {
        await context.session.clearMessages();
        return {
          type: 'action',
          action: 'clear',
          message: 'Conversation cleared'
        };
      }
    });
    
    // /context
    this.register({
      name: 'context',
      description: 'Show current context usage',
      execute: async (args, context) => {
        const usage = context.session.getContextUsage();
        return {
          type: 'display',
          content: `Context: ${usage.used.toLocaleString()} / ${usage.limit.toLocaleString()} tokens (${Math.round(usage.used / usage.limit * 100)}%)`,
          ephemeral: true
        };
      }
    });
    
    // /bug
    this.register({
      name: 'bug',
      description: 'Report an issue',
      execute: async (args, context) => {
        const description = args.join(' ');
        await this.reportBug(context.session, description);
        return {
          type: 'display',
          content: 'Bug report submitted. Thank you!',
          ephemeral: true
        };
      }
    });
    
    // /todos
    this.register({
      name: 'todos',
      description: 'Show current todo list',
      aliases: ['todo', 'tasks'],
      execute: async (args, context) => {
        const todos = context.session.todos || [];
        if (todos.length === 0) {
          return {
            type: 'display',
            content: 'No todos yet',
            ephemeral: true
          };
        }
        
        const formatted = this.formatTodos(todos);
        return {
          type: 'display',
          content: formatted,
          ephemeral: true
        };
      }
    });
    
    // /bashes
    this.register({
      name: 'bashes',
      description: 'List background shell processes',
      aliases: ['shells', 'processes'],
      execute: async (args, context) => {
        const processes = context.session.backgroundProcesses.filter(
          p => p.type === 'shell' && p.status === 'running'
        );
        
        if (processes.length === 0) {
          return {
            type: 'display',
            content: 'No active background shells',
            ephemeral: true
          };
        }
        
        const formatted = this.formatProcesses(processes);
        return {
          type: 'display',
          content: formatted,
          ephemeral: true
        };
      }
    });
    
    // /compact
    this.register({
      name: 'compact',
      description: 'Compact the current conversation to save tokens',
      execute: async (args, context) => {
        const customInstructions = args.join(' ') || null;
        const result = await this.compactConversation(
          context.session,
          customInstructions
        );
        
        return {
          type: 'action',
          action: 'compact',
          message: `Conversation compacted. Saved ${result.tokensSaved} tokens.`
        };
      }
    });
    
    // /plan
    this.register({
      name: 'plan',
      description: 'Toggle plan mode',
      execute: async (args, context) => {
        const currentMode = context.session.permissionMode;
        const newMode = currentMode === 'plan' ? 'default' : 'plan';
        
        await context.setPermissionMode(newMode);
        
        return {
          type: 'action',
          action: 'modeChange',
          message: `Switched to ${newMode} mode`
        };
      }
    });
    
    // /settings
    this.register({
      name: 'settings',
      description: 'View or modify settings',
      execute: async (args, context) => {
        if (args.length === 0) {
          // Show current settings
          const settings = await this.getSettings(context.userId);
          return {
            type: 'display',
            content: this.formatSettings(settings),
            ephemeral: true
          };
        }
        
        // Parse setting change
        const [key, ...valueParts] = args;
        const value = valueParts.join(' ');
        
        await this.updateSetting(context.userId, key, value);
        
        return {
          type: 'action',
          action: 'settingUpdate',
          message: `Setting '${key}' updated`
        };
      },
      autocomplete: (partial) => {
        const settings = [
          'theme', 'model', 'fontSize', 'keyBindings',
          'autoSave', 'notifications', 'outputStyle'
        ];
        return settings.filter(s => s.startsWith(partial));
      }
    });
    
    // /stop
    this.register({
      name: 'stop',
      description: 'Stop the current operation',
      aliases: ['cancel', 'interrupt'],
      execute: async (args, context) => {
        await context.interrupt();
        return {
          type: 'action',
          action: 'interrupt',
          message: 'Operation stopped'
        };
      }
    });
    
    // /exit
    this.register({
      name: 'exit',
      description: 'Exit the current session',
      aliases: ['quit', 'bye'],
      execute: async (args, context) => {
        await context.session.end();
        return {
          type: 'action',
          action: 'exit',
          message: 'Goodbye!'
        };
      }
    });
    
    // /model
    this.register({
      name: 'model',
      description: 'Switch AI model',
      execute: async (args, context) => {
        if (args.length === 0) {
          return {
            type: 'display',
            content: `Current model: ${context.session.model}`,
            ephemeral: true
          };
        }
        
        const model = args[0];
        const validModels = ['opus', 'sonnet', 'haiku'];
        
        if (!validModels.includes(model)) {
          return {
            type: 'error',
            error: `Invalid model. Choose from: ${validModels.join(', ')}`
          };
        }
        
        context.session.model = model;
        await context.session.save();
        
        return {
          type: 'action',
          action: 'modelChange',
          message: `Switched to ${model} model`
        };
      },
      autocomplete: () => ['opus', 'sonnet', 'haiku']
    });
  }
  
  async execute(
    command: string,
    args: string[],
    context: CommandContext
  ): Promise<CommandResult> {
    const cmd = this.commands.get(command);
    
    if (!cmd) {
      // Check aliases
      for (const [name, c] of this.commands) {
        if (c.aliases?.includes(command)) {
          return c.execute(args, context);
        }
      }
      
      return {
        type: 'error',
        error: `Unknown command: /${command}. Type /help for available commands.`
      };
    }
    
    try {
      return await cmd.execute(args, context);
    } catch (error) {
      return {
        type: 'error',
        error: `Command failed: ${error.message}`
      };
    }
  }
  
  getAutocompletions(partial: string): string[] {
    const commands = Array.from(this.commands.keys());
    const aliases = Array.from(this.commands.values())
      .flatMap(c => c.aliases || []);
    
    return [...commands, ...aliases]
      .filter(c => c.startsWith(partial))
      .sort();
  }
}
```

### Command Processor Integration

```typescript
// src/commands/command-processor.ts
export class CommandProcessor {
  private registry: CommandRegistry;
  private historyManager: HistoryManager;
  
  constructor(registry: CommandRegistry, historyManager: HistoryManager) {
    this.registry = registry;
    this.historyManager = historyManager;
  }
  
  async processInput(
    input: string,
    session: Session,
    context: ExecutionContext
  ): Promise<ProcessResult> {
    // Add to history
    this.historyManager.add(session.id, input);
    
    // Check for slash command
    if (input.startsWith('/')) {
      return this.processCommand(input, session, context);
    }
    
    // Regular prompt
    return this.processPrompt(input, session, context);
  }
  
  private async processCommand(
    input: string,
    session: Session,
    context: ExecutionContext
  ): Promise<ProcessResult> {
    const parts = input.slice(1).split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);
    
    const commandContext: CommandContext = {
      session,
      userId: session.userId,
      interrupt: () => context.interrupt(),
      setPermissionMode: (mode) => context.setPermissionMode(mode)
    };
    
    const result = await this.registry.execute(command, args, commandContext);
    
    // Handle different result types
    switch (result.type) {
      case 'display':
        return {
          type: 'commandOutput',
          content: result.content,
          save: !result.ephemeral
        };
        
      case 'action':
        return {
          type: 'commandAction',
          action: result.action,
          message: result.message
        };
        
      case 'error':
        return {
          type: 'commandError',
          error: result.error
        };
    }
  }
  
  private async processPrompt(
    input: string,
    session: Session,
    context: ExecutionContext
  ): Promise<ProcessResult> {
    // Submit to Claude SDK
    await context.submitQuery(input);
    
    return {
      type: 'promptSubmitted',
      prompt: input
    };
  }
}
```

## History Management

### History Manager

```typescript
// src/features/history-manager.ts
export class HistoryManager {
  private histories = new Map<string, CommandHistory>();
  private maxHistorySize = 1000;
  
  add(sessionId: string, command: string): void {
    let history = this.histories.get(sessionId);
    
    if (!history) {
      history = new CommandHistory(this.maxHistorySize);
      this.histories.set(sessionId, history);
    }
    
    history.add(command);
  }
  
  getPrevious(sessionId: string): string | null {
    const history = this.histories.get(sessionId);
    return history?.getPrevious() || null;
  }
  
  getNext(sessionId: string): string | null {
    const history = this.histories.get(sessionId);
    return history?.getNext() || null;
  }
  
  search(sessionId: string, prefix: string): string[] {
    const history = this.histories.get(sessionId);
    return history?.search(prefix) || [];
  }
  
  async persist(sessionId: string): Promise<void> {
    const history = this.histories.get(sessionId);
    if (history) {
      await this.saveToDatabase(sessionId, history.getAll());
    }
  }
  
  async restore(sessionId: string): Promise<void> {
    const items = await this.loadFromDatabase(sessionId);
    const history = new CommandHistory(this.maxHistorySize);
    
    for (const item of items) {
      history.add(item);
    }
    
    this.histories.set(sessionId, history);
  }
}

class CommandHistory {
  private items: string[] = [];
  private position = -1;
  private tempItem: string | null = null;
  
  constructor(private maxSize: number) {}
  
  add(command: string): void {
    // Don't add duplicates of the last command
    if (this.items[this.items.length - 1] === command) {
      return;
    }
    
    this.items.push(command);
    
    // Trim if exceeds max size
    if (this.items.length > this.maxSize) {
      this.items.shift();
    }
    
    // Reset position
    this.position = this.items.length;
    this.tempItem = null;
  }
  
  getPrevious(current?: string): string | null {
    if (this.items.length === 0) return null;
    
    // Save current input if at the end
    if (this.position === this.items.length && current !== undefined) {
      this.tempItem = current;
    }
    
    if (this.position > 0) {
      this.position--;
      return this.items[this.position];
    }
    
    return this.items[0];
  }
  
  getNext(): string | null {
    if (this.position < this.items.length - 1) {
      this.position++;
      return this.items[this.position];
    }
    
    if (this.position === this.items.length - 1) {
      this.position++;
      return this.tempItem;
    }
    
    return null;
  }
  
  search(prefix: string): string[] {
    return this.items
      .filter(item => item.startsWith(prefix))
      .reverse()
      .slice(0, 10);
  }
  
  getAll(): string[] {
    return [...this.items];
  }
}
```

## Keyboard Shortcuts

### Shortcut Handler

```typescript
// src/features/shortcut-handler.ts
export interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  description: string;
  action: (context: ShortcutContext) => Promise<void>;
}

export class ShortcutHandler {
  private shortcuts = new Map<string, KeyboardShortcut>();
  
  constructor() {
    this.registerDefaultShortcuts();
  }
  
  private registerDefaultShortcuts(): void {
    // Shift+Tab: Toggle plan mode
    this.register({
      key: 'Tab',
      modifiers: ['shift'],
      description: 'Toggle plan mode',
      action: async (context) => {
        const currentMode = context.session.permissionMode;
        const newMode = currentMode === 'plan' ? 'default' : 'plan';
        await context.setPermissionMode(newMode);
        context.showNotification(`Switched to ${newMode} mode`);
      }
    });
    
    // Ctrl+C: Interrupt
    this.register({
      key: 'c',
      modifiers: ['ctrl'],
      description: 'Stop current operation',
      action: async (context) => {
        await context.interrupt();
        context.showNotification('Operation stopped');
      }
    });
    
    // Ctrl+L: Clear screen
    this.register({
      key: 'l',
      modifiers: ['ctrl'],
      description: 'Clear screen',
      action: async (context) => {
        context.clearScreen();
      }
    });
    
    // Ctrl+R: Search history
    this.register({
      key: 'r',
      modifiers: ['ctrl'],
      description: 'Search command history',
      action: async (context) => {
        context.enterHistorySearch();
      }
    });
    
    // Ctrl+D: Exit (on empty line)
    this.register({
      key: 'd',
      modifiers: ['ctrl'],
      description: 'Exit session (on empty line)',
      action: async (context) => {
        if (context.getCurrentInput() === '') {
          await context.session.end();
          context.showNotification('Goodbye!');
        }
      }
    });
    
    // Ctrl+A: Move to start of line
    this.register({
      key: 'a',
      modifiers: ['ctrl'],
      description: 'Move cursor to start of line',
      action: async (context) => {
        context.moveCursorToStart();
      }
    });
    
    // Ctrl+E: Move to end of line
    this.register({
      key: 'e',
      modifiers: ['ctrl'],
      description: 'Move cursor to end of line',
      action: async (context) => {
        context.moveCursorToEnd();
      }
    });
    
    // Ctrl+K: Kill line after cursor
    this.register({
      key: 'k',
      modifiers: ['ctrl'],
      description: 'Delete from cursor to end of line',
      action: async (context) => {
        context.killLineAfterCursor();
      }
    });
    
    // Ctrl+U: Kill line before cursor
    this.register({
      key: 'u',
      modifiers: ['ctrl'],
      description: 'Delete from start of line to cursor',
      action: async (context) => {
        context.killLineBeforeCursor();
      }
    });
    
    // Ctrl+W: Delete word before cursor
    this.register({
      key: 'w',
      modifiers: ['ctrl'],
      description: 'Delete word before cursor',
      action: async (context) => {
        context.deleteWordBefore();
      }
    });
    
    // Alt+B: Move back one word
    this.register({
      key: 'b',
      modifiers: ['alt'],
      description: 'Move cursor back one word',
      action: async (context) => {
        context.moveWordBackward();
      }
    });
    
    // Alt+F: Move forward one word
    this.register({
      key: 'f',
      modifiers: ['alt'],
      description: 'Move cursor forward one word',
      action: async (context) => {
        context.moveWordForward();
      }
    });
  }
  
  async handleKeyPress(
    event: KeyPressEvent,
    context: ShortcutContext
  ): Promise<boolean> {
    const shortcutKey = this.buildShortcutKey(event);
    const shortcut = this.shortcuts.get(shortcutKey);
    
    if (shortcut) {
      await shortcut.action(context);
      return true; // Handled
    }
    
    return false; // Not handled
  }
  
  private buildShortcutKey(event: KeyPressEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    if (event.metaKey) parts.push('meta');
    
    parts.push(event.key.toLowerCase());
    
    return parts.join('+');
  }
  
  register(shortcut: KeyboardShortcut): void {
    const key = this.buildShortcutKeyFromDef(shortcut);
    this.shortcuts.set(key, shortcut);
  }
  
  private buildShortcutKeyFromDef(shortcut: KeyboardShortcut): string {
    const parts = [...(shortcut.modifiers || [])];
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }
  
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }
}
```

## Interactive Features

### Auto-completion

```typescript
// src/features/autocomplete.ts
export class AutoCompleteProvider {
  private commandRegistry: CommandRegistry;
  private fileSystem: FileSystemProvider;
  private contextAnalyzer: ContextAnalyzer;
  
  async getSuggestions(
    input: string,
    cursorPosition: number,
    session: Session
  ): Promise<Suggestion[]> {
    const beforeCursor = input.substring(0, cursorPosition);
    const currentWord = this.getCurrentWord(beforeCursor);
    
    // Slash commands
    if (beforeCursor.startsWith('/')) {
      return this.getCommandSuggestions(currentWord.substring(1));
    }
    
    // File paths
    if (this.looksLikeFilePath(currentWord)) {
      return this.getFileSuggestions(currentWord);
    }
    
    // Context-aware suggestions
    return this.getContextSuggestions(currentWord, session);
  }
  
  private getCommandSuggestions(partial: string): Suggestion[] {
    const commands = this.commandRegistry.getAutocompletions(partial);
    
    return commands.map(cmd => ({
      text: `/${cmd}`,
      displayText: `/${cmd}`,
      type: 'command',
      description: this.commandRegistry.getDescription(cmd)
    }));
  }
  
  private async getFileSuggestions(partial: string): Promise<Suggestion[]> {
    const suggestions = await this.fileSystem.getCompletions(partial);
    
    return suggestions.map(file => ({
      text: file.path,
      displayText: file.name,
      type: file.isDirectory ? 'directory' : 'file',
      icon: file.isDirectory ? '📁' : '📄'
    }));
  }
  
  private async getContextSuggestions(
    partial: string,
    session: Session
  ): Promise<Suggestion[]> {
    // Analyze recent messages for context
    const context = this.contextAnalyzer.analyze(session.messages);
    
    const suggestions: Suggestion[] = [];
    
    // Tool names mentioned in conversation
    if (context.mentionedTools.length > 0) {
      suggestions.push(...context.mentionedTools
        .filter(tool => tool.startsWith(partial))
        .map(tool => ({
          text: tool,
          type: 'tool',
          priority: 1
        })));
    }
    
    // Recent file paths
    if (context.recentFiles.length > 0) {
      suggestions.push(...context.recentFiles
        .filter(file => file.includes(partial))
        .map(file => ({
          text: file,
          type: 'file',
          priority: 2
        })));
    }
    
    return suggestions.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }
  
  private getCurrentWord(text: string): string {
    const match = text.match(/[^\s]*$/);
    return match ? match[0] : '';
  }
  
  private looksLikeFilePath(text: string): boolean {
    return text.includes('/') || text.includes('\\') || text.startsWith('.');
  }
}
```

### Multi-line Input

```typescript
// src/features/multiline-input.ts
export class MultiLineInputHandler {
  private buffer: string[] = [];
  private isMultiLineMode = false;
  private bracketStack: string[] = [];
  
  processInput(line: string): InputResult {
    // Check for line continuation
    if (this.endsWithBackslash(line)) {
      this.buffer.push(line.slice(0, -1));
      this.isMultiLineMode = true;
      return { type: 'continue', prompt: '> ' };
    }
    
    // Check for unclosed brackets/quotes
    this.updateBracketStack(line);
    
    if (this.bracketStack.length > 0) {
      this.buffer.push(line);
      this.isMultiLineMode = true;
      return { type: 'continue', prompt: this.getPromptForStack() };
    }
    
    // Check if we're in multi-line mode
    if (this.isMultiLineMode) {
      this.buffer.push(line);
      
      // Check if input is complete
      if (this.isInputComplete()) {
        const fullInput = this.buffer.join('\n');
        this.reset();
        return { type: 'complete', input: fullInput };
      }
      
      return { type: 'continue', prompt: this.getPromptForStack() };
    }
    
    // Single line input
    return { type: 'complete', input: line };
  }
  
  private endsWithBackslash(line: string): boolean {
    return line.endsWith('\\') && !line.endsWith('\\\\');
  }
  
  private updateBracketStack(line: string): void {
    const pairs = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
      '`': '`',
      '"""': '"""',
      "'''": "'''"
    };
    
    let inString: string | null = null;
    let escaped = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      // Handle strings
      if (inString) {
        if (char === inString) {
          inString = null;
          const last = this.bracketStack[this.bracketStack.length - 1];
          if (last === char) {
            this.bracketStack.pop();
          }
        }
        continue;
      }
      
      // Check for triple quotes
      if (i + 2 < line.length) {
        const triple = line.substring(i, i + 3);
        if (triple === '"""' || triple === "'''") {
          if (this.bracketStack[this.bracketStack.length - 1] === triple) {
            this.bracketStack.pop();
          } else {
            this.bracketStack.push(triple);
            inString = triple;
          }
          i += 2;
          continue;
        }
      }
      
      // Check for quotes
      if (char === '"' || char === "'" || char === '`') {
        this.bracketStack.push(char);
        inString = char;
        continue;
      }
      
      // Check for opening brackets
      if (char in pairs && ![')', ']', '}'].includes(char)) {
        this.bracketStack.push(char);
        continue;
      }
      
      // Check for closing brackets
      const expectedClosing = pairs[this.bracketStack[this.bracketStack.length - 1]];
      if (char === expectedClosing) {
        this.bracketStack.pop();
      }
    }
  }
  
  private isInputComplete(): boolean {
    return this.bracketStack.length === 0;
  }
  
  private getPromptForStack(): string {
    const last = this.bracketStack[this.bracketStack.length - 1];
    
    switch (last) {
      case '(': return '... ';
      case '[': return '... ';
      case '{': return '... ';
      case '"':
      case "'":
      case '`': return `${last}> `;
      case '"""':
      case "'''": return '"""> ';
      default: return '> ';
    }
  }
  
  private reset(): void {
    this.buffer = [];
    this.isMultiLineMode = false;
    this.bracketStack = [];
  }
  
  cancel(): void {
    this.reset();
  }
}
```

## Context Features

### Context Tracker

```typescript
// src/features/context-tracker.ts
export class ContextTracker {
  private tokenCounter: TokenCounter;
  
  calculateUsage(messages: Message[]): ContextUsage {
    let totalTokens = 0;
    
    for (const message of messages) {
      totalTokens += this.tokenCounter.count(message.content);
      
      // Add tool use tokens
      if (message.metadata?.toolUses) {
        for (const tool of message.metadata.toolUses) {
          totalTokens += this.tokenCounter.count(JSON.stringify(tool.input));
          if (tool.output) {
            totalTokens += this.tokenCounter.count(JSON.stringify(tool.output));
          }
        }
      }
    }
    
    return {
      used: totalTokens,
      limit: 200000, // Claude's context limit
      percentage: (totalTokens / 200000) * 100
    };
  }
  
  async compact(
    messages: Message[],
    customInstructions?: string
  ): Promise<CompactResult> {
    const originalUsage = this.calculateUsage(messages);
    
    // Build summary of older messages
    const cutoffIndex = Math.floor(messages.length * 0.3); // Keep last 70%
    const toSummarize = messages.slice(0, cutoffIndex);
    const toKeep = messages.slice(cutoffIndex);
    
    // Generate summary
    const summary = await this.generateSummary(toSummarize, customInstructions);
    
    // Create compacted conversation
    const compacted: Message[] = [
      {
        id: uuidv4(),
        type: 'system',
        content: `Previous conversation summary:\n${summary}`,
        metadata: { isCompacted: true }
      },
      ...toKeep
    ];
    
    const newUsage = this.calculateUsage(compacted);
    
    return {
      messages: compacted,
      originalTokens: originalUsage.used,
      newTokens: newUsage.used,
      tokensSaved: originalUsage.used - newUsage.used
    };
  }
  
  private async generateSummary(
    messages: Message[],
    instructions?: string
  ): Promise<string> {
    // Use Claude to summarize
    const prompt = `
Summarize the following conversation, preserving key information, 
decisions made, and important context. ${instructions || ''}

${this.formatMessagesForSummary(messages)}
`;
    
    // This would call Claude API to generate summary
    return 'Summary of previous conversation...';
  }
}
```

## Background Process Management

### Process Manager

```typescript
// src/features/process-manager.ts
export class ProcessManager {
  private processes = new Map<string, ManagedProcess>();
  
  async startBackgroundShell(
    sessionId: string,
    command: string,
    options?: ShellOptions
  ): Promise<string> {
    const processId = uuidv4();
    
    const process: ManagedProcess = {
      id: processId,
      sessionId,
      type: 'shell',
      command,
      status: 'running',
      output: [],
      startedAt: new Date(),
      process: spawn(command, {
        shell: true,
        cwd: options?.cwd,
        env: { ...process.env, ...options?.env }
      })
    };
    
    // Capture output
    process.process.stdout?.on('data', (data) => {
      process.output.push(data.toString());
      this.emitOutput(processId, data.toString());
    });
    
    process.process.stderr?.on('data', (data) => {
      process.output.push(`[stderr] ${data}`);
      this.emitOutput(processId, data.toString(), 'stderr');
    });
    
    process.process.on('exit', (code) => {
      process.status = code === 0 ? 'completed' : 'failed';
      process.exitCode = code;
      process.completedAt = new Date();
      this.emitExit(processId, code);
    });
    
    this.processes.set(processId, process);
    
    return processId;
  }
  
  async killProcess(processId: string): Promise<void> {
    const process = this.processes.get(processId);
    
    if (!process || process.status !== 'running') {
      throw new Error('Process not found or not running');
    }
    
    process.process.kill('SIGTERM');
    process.status = 'killed';
    process.completedAt = new Date();
  }
  
  getProcessOutput(processId: string, since?: number): string[] {
    const process = this.processes.get(processId);
    
    if (!process) {
      throw new Error('Process not found');
    }
    
    if (since !== undefined) {
      return process.output.slice(since);
    }
    
    return process.output;
  }
  
  listProcesses(sessionId?: string): ProcessInfo[] {
    const processes = Array.from(this.processes.values());
    
    const filtered = sessionId 
      ? processes.filter(p => p.sessionId === sessionId)
      : processes;
    
    return filtered.map(p => ({
      id: p.id,
      type: p.type,
      command: p.command,
      status: p.status,
      startedAt: p.startedAt,
      completedAt: p.completedAt,
      exitCode: p.exitCode
    }));
  }
}
```

## Testing CLI Features

### Integration Tests

```typescript
// tests/cli-features.test.ts
describe('CLI Features', () => {
  describe('Slash Commands', () => {
    it('should execute /help command', async () => {
      const result = await executeCommand('/help');
      expect(result.content).toContain('Available commands:');
    });
    
    it('should handle /model switching', async () => {
      await executeCommand('/model opus');
      const session = await getSession();
      expect(session.model).toBe('opus');
    });
    
    it('should compact conversation with /compact', async () => {
      // Add many messages
      for (let i = 0; i < 50; i++) {
        await submitPrompt(`Message ${i}`);
      }
      
      const before = await getContextUsage();
      await executeCommand('/compact');
      const after = await getContextUsage();
      
      expect(after.used).toBeLessThan(before.used);
    });
  });
  
  describe('History Navigation', () => {
    it('should navigate command history with arrows', async () => {
      await submitPrompt('first command');
      await submitPrompt('second command');
      
      const previous = await pressKey('ArrowUp');
      expect(previous).toBe('second command');
      
      const older = await pressKey('ArrowUp');
      expect(older).toBe('first command');
      
      const newer = await pressKey('ArrowDown');
      expect(newer).toBe('second command');
    });
  });
  
  describe('Keyboard Shortcuts', () => {
    it('should toggle plan mode with Shift+Tab', async () => {
      await pressKey('Tab', { shift: true });
      const session = await getSession();
      expect(session.permissionMode).toBe('plan');
      
      await pressKey('Tab', { shift: true });
      const updated = await getSession();
      expect(updated.permissionMode).toBe('default');
    });
    
    it('should interrupt with Ctrl+C', async () => {
      const queryPromise = submitPrompt('long running task');
      await wait(100);
      
      await pressKey('c', { ctrl: true });
      
      const result = await queryPromise;
      expect(result.status).toBe('interrupted');
    });
  });
  
  describe('Auto-completion', () => {
    it('should suggest slash commands', async () => {
      const suggestions = await getSuggestions('/he');
      expect(suggestions).toContain('/help');
    });
    
    it('should suggest file paths', async () => {
      const suggestions = await getSuggestions('./src/');
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });
});
```

## Performance Optimizations

### Command Caching

```typescript
// src/optimizations/command-cache.ts
export class CommandCache {
  private cache = new Map<string, CachedResult>();
  private maxAge = 60000; // 1 minute
  
  get(command: string): CachedResult | null {
    const cached = this.cache.get(command);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(command);
      return null;
    }
    
    return cached;
  }
  
  set(command: string, result: any): void {
    this.cache.set(command, {
      result,
      timestamp: Date.now()
    });
  }
}
```

## Next Steps

After implementing CLI features:
1. Test all slash commands thoroughly
2. Verify keyboard shortcuts work correctly
3. Test history navigation
4. Implement auto-completion
5. Add performance monitoring
6. Proceed to Phase 3 (Web UI)