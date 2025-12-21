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
  /** Custom background color (e.g., for session/collaboration colors) */
  color?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Calculates relative luminance of a hex color and returns
 * an appropriate contrasting text color (black or white).
 */
function getContrastingTextColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Convert to linear RGB (sRGB gamma correction)
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);

  // Calculate relative luminance (WCAG formula)
  const luminance = 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;

  // Return black for light backgrounds, white for dark backgrounds
  // Threshold of 0.179 provides good contrast per WCAG guidelines
  return luminance > 0.179 ? '#000000' : '#ffffff';
}

export function Avatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  rounded = true,
  color,
}: AvatarProps) {
  const displayFallback = typeof fallback === 'string' ? getInitials(fallback) : fallback;

  const style = color
    ? { backgroundColor: color, color: getContrastingTextColor(color), borderColor: 'transparent' }
    : undefined;

  return (
    <div
      className={`${styles.avatar} ${styles[size]} ${rounded ? styles.rounded : ''}`}
      style={style}
    >
      {src ? (
        <img src={src} alt={alt} className={styles.image} />
      ) : (
        <span className={styles.fallback}>{displayFallback}</span>
      )}
    </div>
  );
}
Avatar.displayName = 'Avatar';
