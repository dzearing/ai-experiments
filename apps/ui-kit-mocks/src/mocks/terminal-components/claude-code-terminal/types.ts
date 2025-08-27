export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  model?: string;
  toolName?: string;
  toolStatus?: 'executing' | 'completed' | 'failed';
  toolOutput?: string;
}

export interface Chat {
  id: string;
  title: string;
  subtitle: string;
  previousSubtitle?: string;
  subtitleInitialized?: boolean;
  isActive: boolean;
  isBusy: boolean;
  messages: Message[];
  lastActivity: Date;
  repoPath?: string;
  branch?: string;
}

export interface ClaudeCodeTerminalProps {
  onCommand?: (command: string) => void;
  onPrompt?: (prompt: string) => void;
}