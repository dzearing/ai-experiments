import { useCallback } from 'react';

import type { ChatInputSubmitData } from '@ui-kit/react-chat';
import { ChatPanel, ChatInput, ThinkingIndicator } from '@ui-kit/react-chat';

import { useConversation } from '../hooks/useConversation';
import { ContextUsage } from './ContextUsage';
import { WelcomeMessage } from './WelcomeMessage';
import styles from './ChatView.module.css';

/**
 * ChatView is the main chat interface for Claude Code Web.
 * It displays streaming conversations with Claude using the ui-kit components.
 */
export function ChatView() {
  const {
    messages,
    isStreaming,
    isThinking,
    thinkingContent,
    contextUsage,
    error,
    sendMessage,
  } = useConversation();

  const handleSubmit = useCallback((data: ChatInputSubmitData) => {
    if (data.content.trim()) {
      sendMessage(data.content.trim());
    }
  }, [sendMessage]);

  return (
    <div className={styles.chatView}>
      <header className={styles.header}>
        <h1 className={styles.title}>Claude Code Web</h1>
        <ContextUsage usage={contextUsage} />
      </header>

      <main className={styles.chatArea}>
        <ChatPanel
          messages={messages}
          isLoading={isStreaming && !isThinking}
          loadingText="Claude is responding..."
          autoScroll={true}
          emptyState={<WelcomeMessage />}
          className={styles.chatPanel}
        />

        {isThinking && (
          <div className={styles.thinkingArea}>
            <ThinkingIndicator
              isActive={true}
              statusText={thinkingContent ? 'Deep thinking...' : undefined}
              showEscapeHint={true}
            />
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
      </main>

      <footer className={styles.inputArea}>
        <ChatInput
          onSubmit={handleSubmit}
          disabled={isStreaming}
          placeholder="Message Claude..."
          autoFocus={true}
          fullWidth={true}
        />
      </footer>
    </div>
  );
}
