import { IconButton } from '@ui-kit/react';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import styles from './MessageQueue.module.css';

/**
 * Queued message item
 */
export interface QueuedMessage {
  /** Unique ID */
  id: string;
  /** Message content */
  content: string;
  /** Timestamp when queued */
  timestamp: number;
}

/**
 * Props for MessageQueue component
 */
export interface MessageQueueProps {
  /** Array of queued messages */
  messages: QueuedMessage[];
  /** Called when a message is removed from queue */
  onRemove: (id: string) => void;
  /** Optional label (defaults to "Queued") */
  label?: string;
  /** Additional CSS class */
  className?: string;
}

/**
 * MessageQueue component
 *
 * Displays queued messages as compact bars that stack above the chat input.
 * Each message can be removed by clicking the X button.
 */
export function MessageQueue({
  messages,
  onRemove,
  label = 'Queued',
  className = '',
}: MessageQueueProps) {
  if (messages.length === 0) {
    return null;
  }

  const containerClasses = [styles.container, className].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {messages.map((msg) => (
        <div key={msg.id} className={styles.item}>
          <span className={styles.content}>{msg.content}</span>
          <IconButton
            icon={<CloseIcon />}
            variant="ghost"
            size="sm"
            onClick={() => onRemove(msg.id)}
            aria-label="Remove from queue"
          />
        </div>
      ))}
    </div>
  );
}

MessageQueue.displayName = 'MessageQueue';

export default MessageQueue;
