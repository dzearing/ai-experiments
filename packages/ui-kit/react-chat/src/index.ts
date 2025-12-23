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

// Slash command types
export type {
  SlashCommand,
  SlashCommandResult,
  SlashCommandProps,
} from './components/ChatInput/SlashCommand.types';

// Hooks
export { useMessageHistory } from './components/ChatInput/useMessageHistory';
