import { useCallback, useState } from 'react';

import type { ChatInputSubmitData, ChatPanelMessage } from '@ui-kit/react-chat';
import { ChatPanel, ChatInput, ThinkingIndicator } from '@ui-kit/react-chat';

import { useConversation } from '../hooks/useConversation';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useSlashCommands } from '../hooks/useSlashCommands';
import type { PermissionMode } from '../types/agent';
import { AskUserDialog } from './AskUserDialog';
import { ContextUsage } from './ContextUsage';
import { ModeSelector } from './ModeSelector';
import { PermissionDeniedNotice } from './PermissionDeniedNotice';
import { PermissionDialog } from './PermissionDialog';
import { ToolResultDisplay } from './ToolResultDisplay';
import { WelcomeMessage } from './WelcomeMessage';
import styles from './ChatView.module.css';

/**
 * ChatView is the main chat interface for Claude Code Web.
 * It displays streaming conversations with Claude using the ui-kit components.
 */
export function ChatView() {
  const {
    messages: conversationMessages,
    isStreaming,
    isThinking,
    thinkingContent,
    sessionId,
    contextUsage,
    error,
    permissionRequest,
    questionRequest,
    permissionMode,
    deniedPermissions,
    sendMessage,
    clearConversation,
    interrupt,
    changePermissionMode,
    respondToPermission,
    respondToQuestion,
  } = useConversation();

  // System messages from commands (separate from conversation)
  const [systemMessages, setSystemMessages] = useState<ChatPanelMessage[]>([]);

  // Add a system message to the chat (for command output)
  const addSystemMessage = useCallback((content: string) => {
    const msg: ChatPanelMessage = {
      id: `system-${Date.now()}`,
      content,
      parts: [{ type: 'text', text: content }],
      timestamp: new Date(),
      senderName: 'System',
      isOwn: false,
      renderMarkdown: true,
    };

    setSystemMessages((prev) => [...prev, msg]);
  }, []);

  // Handle clearing conversation (also clear system messages)
  const handleClearConversation = useCallback(() => {
    clearConversation();
    setSystemMessages([]);
  }, [clearConversation]);

  // Slash commands
  const { commands, handleCommand } = useSlashCommands({
    clearConversation: handleClearConversation,
    addSystemMessage,
    sendMessage,
    contextUsage,
    permissionMode,
    sessionId,
  });

  // Cycle through permission modes for keyboard shortcut
  const cycleMode = useCallback(() => {
    const modes: PermissionMode[] = ['default', 'plan', 'acceptEdits', 'bypassPermissions'];
    const currentIndex = modes.indexOf(permissionMode);
    const nextIndex = (currentIndex + 1) % modes.length;

    changePermissionMode(modes[nextIndex]);
  }, [permissionMode, changePermissionMode]);

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    onClear: handleClearConversation,
    onCancel: interrupt,
    onCycleMode: cycleMode,
    enabled: true,
  });

  // Combine conversation and system messages
  const messages = [...conversationMessages, ...systemMessages].sort((a, b) => {
    const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
    const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();

    return timeA - timeB;
  });

  const handleSubmit = useCallback((data: ChatInputSubmitData) => {
    if (data.content.trim()) {
      sendMessage(data.content.trim());
    }
  }, [sendMessage]);

  const handlePermissionApprove = useCallback(() => {
    if (permissionRequest) {
      respondToPermission(permissionRequest.requestId, 'allow');
    }
  }, [permissionRequest, respondToPermission]);

  const handlePermissionDeny = useCallback(() => {
    if (permissionRequest) {
      respondToPermission(permissionRequest.requestId, 'deny', 'User denied this action');
    }
  }, [permissionRequest, respondToPermission]);

  const handlePermissionAlwaysAllow = useCallback(() => {
    // For now, just approve. Rule persistence is Phase 5.
    if (permissionRequest) {
      respondToPermission(permissionRequest.requestId, 'allow');
    }
  }, [permissionRequest, respondToPermission]);

  const handleQuestionComplete = useCallback((answers: Record<string, string>) => {
    if (questionRequest) {
      respondToQuestion(questionRequest.requestId, answers);
    }
  }, [questionRequest, respondToQuestion]);

  const handleQuestionDismiss = useCallback(() => {
    if (questionRequest) {
      respondToQuestion(questionRequest.requestId, {});
    }
  }, [questionRequest, respondToQuestion]);

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

        {deniedPermissions.length > 0 && (
          <div className={styles.deniedPermissions}>
            {deniedPermissions.map((denied, index) => (
              <PermissionDeniedNotice
                key={`${denied.toolName}-${denied.timestamp}-${index}`}
                toolName={denied.toolName}
                reason={denied.reason}
              />
            ))}
          </div>
        )}
      </main>

      <footer className={styles.inputArea}>
        <ChatInput
          onSubmit={handleSubmit}
          commands={commands}
          onCommand={handleCommand}
          disabled={isStreaming}
          placeholder="Message Claude..."
          autoFocus={true}
          fullWidth={true}
        />
      </footer>

      <PermissionDialog
        open={!!permissionRequest}
        toolName={permissionRequest?.toolName ?? ''}
        input={permissionRequest?.input ?? {}}
        onApprove={handlePermissionApprove}
        onDeny={handlePermissionDeny}
        onApproveAlways={handlePermissionAlwaysAllow}
      />

      <AskUserDialog
        open={!!questionRequest}
        questions={questionRequest?.questions ?? []}
        onComplete={handleQuestionComplete}
        onDismiss={handleQuestionDismiss}
      />
    </div>
  );
}
