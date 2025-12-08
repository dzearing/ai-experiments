import { type ReactNode } from 'react';
import styles from './Avatar.module.css';

/**
 * Avatar component - user or entity representation
 *
 * Tokens used:
 * - --controlSubtle-bg
 * - --body-text-soft
 */

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  /** Image source */
  src?: string;
  /** Alt text for image */
  alt?: string;
  /** Fallback initials or icon */
  fallback?: ReactNode;
  /** Avatar size */
  size?: AvatarSize;
  /** Whether avatar is rounded square or circle */
  rounded?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  rounded = true,
}: AvatarProps) {
  const displayFallback = typeof fallback === 'string' ? getInitials(fallback) : fallback;

  return (
    <div className={`${styles.avatar} ${styles[size]} ${rounded ? styles.rounded : ''}`}>
      {src ? (
        <img src={src} alt={alt} className={styles.image} />
      ) : (
        <span className={styles.fallback}>{displayFallback}</span>
      )}
    </div>
  );
}
