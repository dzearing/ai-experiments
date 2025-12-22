import { Avatar } from '@ui-kit/react';
import type { ResourcePresence } from '../../hooks/useWorkspaceSocket';
import styles from './AvatarGroup.module.css';

export interface AvatarGroupProps {
  /** Array of presence info for users viewing this resource */
  presence: ResourcePresence[];
  /** Maximum number of individual avatars to show (default: 3) */
  maxVisible?: number;
  /** Size of the avatars */
  size?: 'xs' | 'sm';
}

/**
 * Displays a group of overlapping avatars for users viewing a resource.
 * Shows up to maxVisible avatars, with a "+N" indicator for additional users.
 */
export function AvatarGroup({ presence, maxVisible = 3, size = 'xs' }: AvatarGroupProps) {
  if (presence.length === 0) {
    return null;
  }

  // Dedupe by userId
  const uniquePresence = presence.reduce<ResourcePresence[]>((acc, p) => {
    if (!acc.some(existing => existing.userId === p.userId)) {
      acc.push(p);
    }
    return acc;
  }, []);

  const visibleUsers = uniquePresence.slice(0, maxVisible);
  const remainingCount = uniquePresence.length - maxVisible;

  return (
    <div className={styles.avatarGroup} data-testid="avatar-group">
      {visibleUsers.map((user, index) => (
        <div
          key={user.userId}
          className={styles.avatarWrapper}
          style={{ zIndex: visibleUsers.length - index }}
          title={user.userName}
        >
          <Avatar
            size={size}
            fallback={user.userName}
            color={user.userColor}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div className={styles.overflow} title={`${remainingCount} more`}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
