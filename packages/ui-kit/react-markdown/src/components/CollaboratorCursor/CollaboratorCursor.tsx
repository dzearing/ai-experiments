/**
 * CollaboratorCursor component
 *
 * Renders a visual cursor for a remote collaborator with their name label.
 * The cursor blinks when the collaborator is idle and shows a typing indicator
 * when they're actively editing.
 */

import { useMemo } from 'react';
import type { Collaborator, CollaboratorStatus } from '../../types/collaborator';
import styles from './CollaboratorCursor.module.css';

export interface CollaboratorCursorProps {
  /** The collaborator this cursor represents */
  collaborator: Collaborator;
  /** CSS position (top in pixels) */
  top: number;
  /** CSS position (left in pixels) */
  left: number;
  /** Whether to show the name label */
  showLabel?: boolean;
  /** Label position */
  labelPosition?: 'top' | 'bottom';
}

export function CollaboratorCursor({
  collaborator,
  top,
  left,
  showLabel = true,
  labelPosition = 'top',
}: CollaboratorCursorProps) {
  const { name, color, status, isAI } = collaborator;

  const cursorStyle = useMemo(
    () => ({
      '--cursor-color': color,
      top: `${top}px`,
      left: `${left}px`,
    } as React.CSSProperties),
    [color, top, left]
  );

  const statusClass = getStatusClass(status);

  return (
    <div
      className={`${styles.cursor} ${statusClass}`}
      style={cursorStyle}
      aria-label={`${name}'s cursor`}
      role="presentation"
    >
      {/* The cursor line */}
      <div className={styles.cursorLine} />

      {/* Name label */}
      {showLabel && (
        <div
          className={`${styles.label} ${styles[labelPosition]}`}
          style={{ backgroundColor: color }}
        >
          {isAI && <span className={styles.aiIcon}>✨</span>}
          <span className={styles.name}>{name}</span>
          {status === 'typing' && (
            <span className={styles.typingIndicator}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function getStatusClass(status: CollaboratorStatus): string {
  switch (status) {
    case 'typing':
      return styles.typing;
    case 'selecting':
      return styles.selecting;
    case 'disconnected':
      return styles.disconnected;
    default:
      return styles.idle;
  }
}

export default CollaboratorCursor;
