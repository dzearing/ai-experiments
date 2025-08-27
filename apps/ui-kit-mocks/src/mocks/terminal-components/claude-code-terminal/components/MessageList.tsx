import React from 'react';
import { Spinner } from '@claude-flow/ui-kit-react';
import {
  ChevronRightIcon,
  InfoCircleIcon,
  CheckCircleIcon,
  ErrorCircleIcon,
} from '@claude-flow/ui-kit-icons';
import styles from './MessageList.module.css';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isStreaming,
  messagesEndRef,
}) => {
  const renderMessage = (message: Message) => {
    const iconMap = {
      user: <ChevronRightIcon className={styles.messageIcon} />,
      assistant: '✨',
      system: <InfoCircleIcon className={styles.messageIcon} />,
      tool: message.toolStatus === 'completed' ? <CheckCircleIcon className={styles.messageIcon} /> :
            message.toolStatus === 'failed' ? <ErrorCircleIcon className={styles.messageIcon} /> :
            <Spinner size="small" />,
    };

    return (
      <div key={message.id} className={`${styles.message} ${styles[`message-${message.type}`]}`}>
        <div className={styles.messageHeader}>
          <span className={styles.messageIcon}>{iconMap[message.type]}</span>
          <span className={styles.messageType}>
            {message.type === 'tool' ? message.toolName : message.type}
          </span>
          <span className={styles.messageTime}>
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
        <div className={styles.messageContent}>
          <pre>{message.content}</pre>
          {message.toolOutput && (
            <div className={styles.toolOutput}>
              <span className={styles.toolOutputLabel}>Output:</span> {message.toolOutput}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.messages}>
      {messages.map(renderMessage)}
      {isStreaming && (
        <div className={styles.streamingIndicator}>
          <Spinner size="small" />
          <span>Claude is thinking...</span>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};