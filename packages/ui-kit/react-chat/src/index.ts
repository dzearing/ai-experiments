// ChatInput component and related types
export { ChatInput } from './components/ChatInput';
export type {
  ChatInputProps,
  ChatInputRef,
  ChatInputSize,
  ChatInputImage,
  ChatInputSubmitData,
} from './components/ChatInput';

// ChatMessage component and related types
export { ChatMessage } from './components/ChatMessage';
export type { ChatMessageProps, ChatMessageToolCall } from './components/ChatMessage';

// ChatPanel component and related types
export { ChatPanel } from './components/ChatPanel';
export type { ChatPanelProps, ChatPanelMessage } from './components/ChatPanel';

// ThinkingIndicator component and related types
export { ThinkingIndicator } from './components/ThinkingIndicator';
export type { ThinkingIndicatorProps } from './components/ThinkingIndicator';

// Slash command types
export type {
  SlashCommand,
  SlashCommandResult,
  SlashCommandProps,
} from './components/ChatInput/SlashCommand.types';

// Hooks
export { useMessageHistory } from './components/ChatInput/useMessageHistory';
