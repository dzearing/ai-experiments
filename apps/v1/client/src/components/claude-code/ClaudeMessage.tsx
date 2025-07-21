import { memo, useMemo } from 'react';
import { ChatBubble } from '../chat/ChatBubble';
import { ToolExecution } from '../chat/ToolExecution';
import { SuggestedResponses } from '../chat/SuggestedResponses';
import { DancingBubbles } from '../ui/DancingBubbles';
import { FeedbackLink } from '../FeedbackLink';
import { FeedbackDialog } from '../FeedbackDialog';
import { useFeedback } from '../../hooks/useFeedback';
import { useParams } from 'react-router-dom';
import { parseMarkdown } from '../../utils/markdownUtils';
import type { ClaudeMessage as ClaudeMessageType } from '../../contexts/ClaudeCodeContext';

interface ClaudeMessageProps {
  message: ClaudeMessageType;
  onSuggestedResponse?: (response: string) => void;
  isLatestAssistantMessage?: boolean;
  sessionId: string;
}

export const ClaudeMessage = memo(function ClaudeMessage({
  message,
  onSuggestedResponse,
  isLatestAssistantMessage = false,
  sessionId,
}: ClaudeMessageProps) {
  const { projectId, repoName } = useParams<{ projectId: string; repoName: string }>();

  // Set up feedback for this message
  const { showDialog, isSubmitting, error, openFeedback, closeFeedback, submitFeedback } =
    useFeedback({
      sessionId,
      repoName: repoName || '',
      projectId: projectId || '',
      messageId: message.id,
    });
  // Check if this is an error message
  const isErrorMessage =
    message.content.startsWith('API Error:') || message.content.includes('authentication_error');
  const is401Error =
    message.content.includes('401') && message.content.includes('authentication_error');

  // Handle content that might be an array or object
  let messageContent = message.content;
  if (typeof messageContent !== 'string') {
    if (Array.isArray(messageContent)) {
      messageContent = (messageContent as Array<any>)
        .filter((block) => block?.type === 'text')
        .map((block) => block?.text || '')
        .join('\n');
    } else if (messageContent && typeof messageContent === 'object' && 'text' in messageContent) {
      messageContent = (messageContent as any).text;
    } else {
      messageContent = String(messageContent);
    }
  }

  // Clean up message content to remove artifacts from malformed API responses
  if (typeof messageContent === 'string') {
    // Remove "undefined" at the start of messages
    messageContent = messageContent.replace(/^undefined\s*\n?/i, '');

    // Remove "H:" and "A:" conversation prefixes that shouldn't be visible
    messageContent = messageContent.replace(/^(H|A):\s*(.+?)(?=\n\n(H|A):|$)/gm, '$2');

    // Clean up any remaining leading/trailing whitespace
    messageContent = messageContent.trim();
  }

  const formatContent = useMemo(
    () => (content: string) => {
      const html = parseMarkdown(content);
      return (
        <div
          className="prose prose-sm max-w-none dark:prose-invert markdown-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    },
    []
  );

  // Show thinking indicator for streaming messages
  const isThinking = message.isStreaming && messageContent.startsWith('Claude is thinking');

  const getAvatar = () => {
    switch (message.role) {
      case 'user':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
            U
          </div>
        );
      case 'assistant':
        return (
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">
            C
          </div>
        );
      case 'system':
        return null;
    }
  };

  // System messages get special treatment
  if (message.role === 'system') {
    return (
      <div className="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
        {messageContent}
      </div>
    );
  }

  // Tool messages are rendered as tool executions
  if (message.role === 'tool') {
    // Extract tool name from message ID if name is not provided
    let toolName = message.name;
    if (!toolName && message.id?.includes('-')) {
      // Try to extract from ID pattern like "tool-1752121277934-drvpkpw31"
      const parts = message.id.split('-');
      if (parts[0] === 'tool' && parts.length > 2) {
        toolName = 'Tool execution';
      }
    }

    return (
      <>
        <div className="px-4 py-2" data-testid="tool-execution">
          <ToolExecution
            name={toolName || 'Tool execution'}
            args={message.args || message.content || ''}
            output=""
            status={message.status || 'complete'}
            expandedByDefault={false}
            executionTime={message.executionTime}
            data-testid="tool-execution"
            sessionId={sessionId}
            messageId={message.id}
          />
        </div>

        {/* Feedback dialog for tool execution */}
        <FeedbackDialog
          isOpen={showDialog}
          onClose={closeFeedback}
          onSubmit={submitFeedback}
          isSubmitting={isSubmitting}
          error={error}
        />
      </>
    );
  }

  // Render error messages with special styling
  if (isErrorMessage) {
    return (
      <>
        <div className="mx-4 my-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                {is401Error ? 'Authentication Error' : 'Error'}
              </h3>
              <div className="text-sm text-red-700 dark:text-red-300">
                {is401Error ? (
                  <>
                    <p className="mb-2">Your authentication token is invalid or has expired.</p>
                    <p>Please try logging in again or check your API credentials.</p>
                  </>
                ) : (
                  <p>{messageContent}</p>
                )}
              </div>
              {is401Error && (
                <button
                  onClick={() => (window.location.href = '/login')}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Re-authenticate
                </button>
              )}
            </div>
          </div>

          {/* Feedback link */}
          {!message.isStreaming && (
            <div className="mt-3 border-t border-red-200 dark:border-red-800 pt-3">
              <FeedbackLink onClick={openFeedback} />
            </div>
          )}
        </div>

        {/* Feedback dialog */}
        <FeedbackDialog
          isOpen={showDialog}
          onClose={closeFeedback}
          onSubmit={submitFeedback}
          isSubmitting={isSubmitting}
          error={error}
        />
      </>
    );
  }

  return (
    <>
      <ChatBubble
        variant={message.role === 'user' ? 'sent' : 'received'}
        showAvatar={true}
        avatar={getAvatar()}
        timestamp={message.timestamp}
        className="mx-2 my-2"
        data-testid={`message-${message.isStreaming ? 'streaming' : 'complete'}`}
      >
        {/* Message content */}
        {isThinking || (message.isStreaming && !messageContent) ? (
          <DancingBubbles />
        ) : message.role === 'user' ? (
          // User messages should not be rendered as markdown to avoid issues with special characters
          <div className="whitespace-pre-wrap break-words">{messageContent}</div>
        ) : (
          // Assistant messages get markdown formatting
          formatContent(messageContent)
        )}

        {/* Streaming cursor */}
        {message.isStreaming && !isThinking && messageContent && (
          <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
        )}

        {/* Planning mode indicator for user messages */}
        {message.role === 'user' && message.mode === 'plan' && (
          <div className="absolute bottom-2 right-2">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
              Planning
            </span>
          </div>
        )}

        {/* Suggested responses for the latest assistant message */}
        {isLatestAssistantMessage && message.suggestedResponses && onSuggestedResponse && (
          <SuggestedResponses
            responses={message.suggestedResponses}
            onSelect={onSuggestedResponse}
            disabled={message.isStreaming}
          />
        )}

        {/* Feedback link */}
        {!message.isStreaming && (
          <div className="mt-2">
            <FeedbackLink onClick={openFeedback} />
          </div>
        )}
      </ChatBubble>

      {/* Feedback dialog */}
      <FeedbackDialog
        isOpen={showDialog}
        onClose={closeFeedback}
        onSubmit={submitFeedback}
        isSubmitting={isSubmitting}
        error={error}
      />
    </>
  );
});
