import { useCallback } from 'react';

import type { ChatInputSubmitData } from '@ui-kit/react-chat';
import { ChatPanel, ChatInput, ThinkingIndicator } from '@ui-kit/react-chat';

import { useConversation } from '../hooks/useConversation';
import { ContextUsage } from './ContextUsage';
import { ModeSelector } from './ModeSelector';
import { ToolResultDisplay } from './ToolResultDisplay';
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
    permissionRequest,
    questionRequest,
    permissionMode,
    sendMessage,
    changePermissionMode,
  } = useConversation();

  const handleSubmit = useCallback((data: ChatInputSubmitData) => {
    if (data.content.trim()) {
      sendMessage(data.content.trim());
    }
  }, [sendMessage]);

  const renderToolResult = useCallback((props: {
    toolName: string;
    input: Record<string, unknown>;
    output: string;
    isExpanded: boolean;
    onToggleExpand: () => void;
  }) => {
    return (
      <ToolResultDisplay
        toolName={props.toolName}
        input={props.input}
        output={props.output}
        isExpanded={props.isExpanded}
        onToggleExpand={props.onToggleExpand}
        onFileClick={(path) => {
          // TODO: Phase 4 will wire this to FileViewer
          console.log('File clicked:', path);
        }}
      />
    );
  }, []);

  return (
    <div className={styles.chatView}>
      <header className={styles.header}>
        <h1 className={styles.title}>Claude Code Web</h1>
        <div className={styles.headerControls}>
          <ModeSelector
            mode={permissionMode}
            onChange={changePermissionMode}
            disabled={!!permissionRequest || !!questionRequest}
          />
          <ContextUsage usage={contextUsage} />
        </div>
      </header>

      <main className={styles.chatArea}>
        <ChatPanel
          messages={messages}
          isLoading={isStreaming && !isThinking}
          loadingText="Claude is responding..."
          autoScroll={true}
          emptyState={<WelcomeMessage />}
          className={styles.chatPanel}
          renderToolResult={renderToolResult}
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
