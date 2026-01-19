import { createContext, useContext, type ReactNode } from 'react';

/**
 * Chat mode determines rendering behavior.
 * - '1on1': Two-party conversation (user + assistant)
 * - 'group': Multi-party conversation with multiple participants
 */
export type ChatMode = '1on1' | 'group';

/**
 * Represents a participant in a chat conversation.
 * Matches the Participant interface from mock-pages for consistency.
 */
export interface ChatParticipant {
  /** Unique identifier for the participant */
  id: string;
  /** Display name */
  name: string;
  /** Short initials for avatar display */
  initials: string;
  /** Color for participant's avatar/accent */
  color: string;
  /** Whether this participant is the current user */
  isCurrentUser?: boolean;
}

/**
 * Value provided by ChatContext to descendant components.
 */
export interface ChatContextValue {
  /** The current chat mode */
  mode: ChatMode;
  /** Participants in the chat (relevant for group mode) */
  participants?: ChatParticipant[];
}

/**
 * Props for the ChatProvider component.
 */
export interface ChatProviderProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Chat mode - determines rendering behavior */
  mode: ChatMode;
  /** Participants in the chat (optional, used for group mode) */
  participants?: ChatParticipant[];
}

const ChatContext = createContext<ChatContextValue | null>(null);

/**
 * Provides chat context to descendant components.
 * Wrap your chat UI in this provider to enable mode-aware rendering.
 *
 * @example
 * ```tsx
 * <ChatProvider mode="1on1">
 *   <ChatLayout messages={messages} />
 * </ChatProvider>
 * ```
 *
 * @example
 * ```tsx
 * <ChatProvider mode="group" participants={participants}>
 *   <ChatLayout messages={messages} />
 * </ChatProvider>
 * ```
 */
export function ChatProvider({
  children,
  mode,
  participants,
}: ChatProviderProps) {
  const value: ChatContextValue = {
    mode,
    participants,
  };

  return (
    <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
  );
}

/**
 * Hook to access chat context values.
 * Must be used within a ChatProvider.
 *
 * @throws Error if used outside of a ChatProvider
 *
 * @example
 * ```tsx
 * function ChatMessage() {
 *   const { mode, participants } = useChatContext();
 *   // Adapt rendering based on mode
 * }
 * ```
 */
export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }

  return context;
}
