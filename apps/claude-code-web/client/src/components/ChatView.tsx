import { useState, useEffect } from 'react';
import { Button, Input } from '@ui-kit/react';

import { useAgentStream } from '../hooks/useAgentStream';
import styles from './ChatView.module.css';

interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
}

export function ChatView() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const {
    messages,
    isStreaming,
    isConnected,
    error: streamError,
    startStream,
    clearMessages
  } = useAgentStream();

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
      startStream(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className={styles.chatView}>
      <div className={styles.statusPanel}>
        <div className={styles.statusHeader}>
          <h2>Server Status</h2>
          <div className={styles.connectionIndicator}>
            <span
              className={`${styles.connectionDot} ${isConnected ? styles.connected : ''}`}
            />
            {isConnected ? 'Connected' : 'Disconnected'}
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
            messages.map((msg, index) => (
              <div
                key={index}
                className={`${styles.message} ${styles[msg.type] || ''}`}
              >
                <span className={styles.messageType}>{msg.type}</span>
                {msg.subtype && (
                  <span className={styles.messageSubtype}>({msg.subtype})</span>
                )}
                {msg.text && <p className={styles.messageText}>{msg.text}</p>}
                {msg.connectionId && (
                  <p className={styles.messageMeta}>ID: {msg.connectionId}</p>
                )}
              </div>
            ))
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
            onClick={clearMessages}
            disabled={messages.length === 0}
          >
            Clear
          </Button>
        </form>
      </div>
    </div>
  );
}
