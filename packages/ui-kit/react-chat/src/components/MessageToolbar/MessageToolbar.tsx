import { CopyButton, IconButton } from '@ui-kit/react';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import styles from './MessageToolbar.module.css';

/**
 * Format timestamp for display in toolbar
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Normalize timestamp to Date object
 */
function normalizeTimestamp(timestamp: Date | number | string): Date {
  if (timestamp instanceof Date) {
    return timestamp;
  }

  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }

  return new Date(timestamp);
}

export interface MessageToolbarProps {
  /** Message timestamp for display */
  timestamp: Date | number | string;
  /** Callback to get message content for copy (async supported) */
  getContent: () => string | Promise<string>;
  /** Whether this is the user's own message (affects styling) */
  isOwn?: boolean;
  /** Show edit button (default: false) */
  showEdit?: boolean;
  /** Callback when edit is clicked */
  onEdit?: () => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * MessageToolbar - Hover toolbar for chat messages
 *
 * Displays timestamp, copy button, and optional edit button.
 * Styled differently for user (primary) vs assistant (neutral) messages.
 *
 * Parent container should set position: relative and handle hover visibility.
 */
export function MessageToolbar({
  timestamp,
  getContent,
  isOwn = false,
  showEdit = false,
  onEdit,
  className,
}: MessageToolbarProps) {
  const date = normalizeTimestamp(timestamp);
  const timeString = formatTime(date);

  const toolbarClass = [
    styles.toolbar,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const timeClass = styles.time;

  return (
    <div className={toolbarClass}>
      <span className={timeClass}>{timeString}</span>
      <CopyButton
        getContent={getContent}
        variant="ghost"
        size="sm"
        shape="round"
        aria-label="Copy message"
      />
      {showEdit && onEdit && (
        <IconButton
          icon={<EditIcon size={16} />}
          variant="ghost"
          size="sm"
          shape="round"
          aria-label="Edit message"
          onClick={onEdit}
        />
      )}
    </div>
  );
}

MessageToolbar.displayName = 'MessageToolbar';
