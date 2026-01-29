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
  ChatMessageComponentPart,
  ChatMessagePart,
} from './components/ChatMessage';

// ContextDisplay component and related types
export { ContextDisplay } from './components/ContextDisplay';
export type {
  ContextDisplayProps,
  ContextDisplayData,
  ContextCategory,
  ContextSession,
  ContextTool,
} from './components/ContextDisplay';

// ChatPanel component and related types
export { ChatPanel, VirtualizedChatPanel } from './components/ChatPanel';
export type { ChatPanelProps, ChatPanelMessage, VirtualizedChatPanelProps, VirtualizedChatPanelMessage } from './components/ChatPanel';

// ThinkingIndicator component and related types
export { ThinkingIndicator } from './components/ThinkingIndicator';
export type { ThinkingIndicatorProps } from './components/ThinkingIndicator';

// ToolGroup component and related types
export { ToolGroup } from './components/ToolGroup';
export type {
  ToolGroupProps,
  ToolCall,
  ToolStatus,
  SummarySegment,
} from './components/ToolGroup';

// MessageQueue component and related types
export { MessageQueue } from './components/MessageQueue';
export type { MessageQueueProps, QueuedMessage } from './components/MessageQueue';

// MessageToolbar component and related types
export { MessageToolbar } from './components/MessageToolbar';
export type { MessageToolbarProps } from './components/MessageToolbar';

// ContextBreakdown component for displaying context usage
export { ContextBreakdown } from './components/ContextBreakdown';
export type { ContextBreakdownProps, ContextUsageStats } from './components/ContextBreakdown';

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
export { useClaudeCodeCommands } from './hooks/useClaudeCodeCommands';
export type { UseClaudeCodeCommandsOptions, UseClaudeCodeCommandsResult } from './hooks/useClaudeCodeCommands';

// Claude Code service types (for advanced usage)
export type {
  DiscoveredCommand,
  ClaudeCodeSettings,
  PluginManifest,
} from './services/claudeCode/types';

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
