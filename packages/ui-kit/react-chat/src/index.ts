// ChatLayout component - standard layout for chat interfaces
export { ChatLayout } from './components/ChatLayout';
export type { ChatLayoutProps } from './components/ChatLayout';

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
export type {
  ChatMessageProps,
  ChatMessageToolCall,
  ChatMessageTextPart,
  ChatMessageToolCallsPart,
  ChatMessagePart,
} from './components/ChatMessage';

// ChatPanel component and related types
export { ChatPanel, VirtualizedChatPanel } from './components/ChatPanel';
export type { ChatPanelProps, ChatPanelMessage, VirtualizedChatPanelProps, VirtualizedChatPanelMessage } from './components/ChatPanel';

// ThinkingIndicator component and related types
export { ThinkingIndicator } from './components/ThinkingIndicator';
export type { ThinkingIndicatorProps } from './components/ThinkingIndicator';

// MessageQueue component and related types
export { MessageQueue } from './components/MessageQueue';
export type { MessageQueueProps, QueuedMessage } from './components/MessageQueue';

// MessageToolbar component and related types
export { MessageToolbar } from './components/MessageToolbar';
export type { MessageToolbarProps } from './components/MessageToolbar';

// Slash command types
export type {
  SlashCommand,
  SlashCommandResult,
  SlashCommandProps,
} from './components/ChatInput/SlashCommand.types';

// Topic reference types (for ^ autocomplete)
export type { TopicReference } from './components/ChatInput/TopicReferencePopover';

// Hooks
export { useMessageHistory } from './components/ChatInput/useMessageHistory';
export { useScrollLock, type ScrollLockState, type UseScrollLockOptions, type UseScrollLockResult } from './hooks';

// OpenQuestionsResolver component and related types
export { OpenQuestionsResolver } from './components/OpenQuestionsResolver';
export type {
  OpenQuestionsResolverProps,
  OpenQuestionsResolverLabels,
  SelectionType,
  QuestionOption,
  OpenQuestion,
  QuestionAnswer,
  OpenQuestionsResult,
} from './components/OpenQuestionsResolver';

// Chat context for mode-aware rendering
export { ChatProvider, useChatContext } from './context';
export type { ChatMode, ChatParticipant, ChatContextValue, ChatProviderProps } from './context';
