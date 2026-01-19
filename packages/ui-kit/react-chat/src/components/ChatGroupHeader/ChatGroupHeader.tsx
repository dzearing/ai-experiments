import { type ReactNode } from 'react';

import { type ChatParticipant } from '../../context';
import styles from './ChatGroupHeader.module.css';

/**
 * Props for the ChatGroupHeader component
 */
export interface ChatGroupHeaderProps {
  /** Array of participants to display (excludes current user typically) */
  participants: ChatParticipant[];

  /** Maximum number of avatars to show before "+N others" (default: 3) */
  maxAvatars?: number;

  /** Optional custom title override (default: derives from participants) */
  title?: string;

  /** Optional action buttons (settings, close, etc.) */
  actions?: ReactNode;

  /** Additional CSS class */
  className?: string;
}

/**
 * ChatGroupHeader component
 *
 * Displays a header for group chat with stacked participant avatars.
 * Use with ChatLayout's `header` prop.
 *
 * @example
 * ```tsx
 * const otherParticipants = participants.filter(p => !p.isCurrentUser);
 *
 * <ChatLayout
 *   mode="group"
 *   participants={participants}
 *   header={
 *     <ChatGroupHeader
 *       participants={otherParticipants}
 *       actions={<IconButton icon={<CloseIcon />} aria-label="Close" />}
 *     />
 *   }
 * >
 *   {children}
 * </ChatLayout>
 * ```
 */
export function ChatGroupHeader({
  participants,
  maxAvatars = 3,
  title,
  actions,
  className,
}: ChatGroupHeaderProps) {
  // Display up to maxAvatars
  const displayedParticipants = participants.slice(0, maxAvatars);
  const remainingCount = participants.length - maxAvatars;

  // Generate title from participants if not provided
  const headerTitle = title ?? (
    participants.length === 0
      ? 'Group Chat'
      : participants.length === 1
        ? participants[0].name
        : `${participants[0].name} + ${participants.length - 1} others`
  );

  const headerClassName = className
    ? `${styles.header} ${className}`
    : styles.header;

  return (
    <header className={headerClassName}>
      <div className={styles.headerLeft}>
        {participants.length > 0 && (
          <div className={styles.avatars}>
            {displayedParticipants.map((participant) => (
              <div
                key={participant.id}
                className={styles.avatar}
                style={{ background: participant.color }}
                title={participant.name}
              >
                {participant.initials}
              </div>
            ))}
            {remainingCount > 0 && (
              <div
                className={styles.avatar}
                style={{ background: 'var(--base-fg-soft)' }}
                title={`${remainingCount} more participants`}
              >
                +{remainingCount}
              </div>
            )}
          </div>
        )}
        <h4 className={styles.headerTitle}>{headerTitle}</h4>
      </div>

      {actions && (
        <div className={styles.headerActions}>
          {actions}
        </div>
      )}
    </header>
  );
}

ChatGroupHeader.displayName = 'ChatGroupHeader';

export default ChatGroupHeader;
