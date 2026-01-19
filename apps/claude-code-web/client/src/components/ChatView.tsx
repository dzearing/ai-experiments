import { useState, useEffect } from 'react';
import { Button, Input } from '@ui-kit/react';

import type { ChatPanelMessage, ChatMessagePart } from '@ui-kit/react-chat';
import { useConversation } from '../hooks/useConversation';
import styles from './ChatView.module.css';

interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
}

/**
 * Extracts text content from message parts.
 */
function getMessageText(parts?: ChatMessagePart[]): string {
  if (!parts) {
    return '';
  }

  return parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map(p => p.text)
    .join('\n');
}

export function ChatView() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const {
    messages,
    isStreaming,
    isThinking,
    sessionId,
    error: streamError,
    sendMessage,
    clearConversation,
  } = useConversation();

  const checkHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);

    try {
      const response = await fetch('/api/health');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      setHealthStatus(data);
    } catch (err) {
      setHealthError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (inputValue.trim() && !isStreaming) {
      sendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const renderMessage = (msg: ChatPanelMessage, index: number) => {
    const text = getMessageText(msg.parts);
    const messageType = msg.isOwn ? 'user' : 'assistant';

    return (
      <div
        key={msg.id || index}
        className={`${styles.message} ${styles[messageType] || ''}`}
      >
        <span className={styles.messageType}>{messageType}</span>
        {msg.isStreaming && (
          <span className={styles.messageSubtype}>(streaming)</span>
        )}
        {text && <p className={styles.messageText}>{text}</p>}
        {msg.senderName && (
          <p className={styles.messageMeta}>From: {msg.senderName}</p>
        )}
      </div>
    );
  };

  return (
    <div className={styles.chatView}>
      <div className={styles.statusPanel}>
        <div className={styles.statusHeader}>
          <h2>Server Status</h2>
          <div className={styles.connectionIndicator}>
            <span
              className={`${styles.connectionDot} ${sessionId ? styles.connected : ''}`}
            />
            {sessionId ? 'Session Active' : 'No Session'}
          </div>
        </div>
        {healthLoading && <p className={styles.loading}>Checking connection...</p>}
        {healthError && (
          <p className={styles.error}>
            Connection error: {healthError}
          </p>
        )}
        {healthStatus && (
          <div className={styles.status}>
            <p>
              <strong>Status:</strong> {healthStatus.status}
            </p>
            <p>
              <strong>Version:</strong> {healthStatus.version}
            </p>
          </div>
        )}
        {sessionId && (
          <p className={styles.sessionInfo}>
            <strong>Session:</strong> {sessionId.slice(0, 8)}...
          </p>
        )}
        {isThinking && (
          <p className={styles.thinkingIndicator}>
            Claude is thinking...
          </p>
        )}
        <Button onClick={checkHealth} disabled={healthLoading}>
          Refresh Status
        </Button>
      </div>

      <div className={styles.chatArea}>
        <div className={styles.messageList}>
          {messages.length === 0 ? (
            <p className={styles.placeholder}>
              Send a message to test the SSE connection
            </p>
          ) : (
            messages.map(renderMessage)
          )}
          {isStreaming && (
            <div className={styles.streamingIndicator}>
              Receiving messages...
            </div>
          )}
          {streamError && (
            <div className={styles.streamError}>
              Stream error: {streamError}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message to test SSE..."
            disabled={isStreaming}
          />
          <Button type="submit" disabled={isStreaming || !inputValue.trim()}>
            Send
          </Button>
          <Button
            type="button"
            onClick={clearConversation}
            disabled={messages.length === 0}
          >
            Clear
          </Button>
        </form>
      </div>
    </div>
  );
}
