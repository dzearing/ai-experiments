import styles from './Skeleton.module.css';

/**
 * Skeleton component - loading placeholder
 *
 * Tokens used:
 * - --controlSubtle-bg
 */

export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

export interface SkeletonProps {
  /** Skeleton variant */
  variant?: SkeletonVariant;
  /** Width (number for px, string for any unit) */
  width?: number | string;
  /** Height (number for px, string for any unit) */
  height?: number | string;
  /** Disable animation */
  animation?: boolean;
  /** Number of text lines (only for text variant) */
  lines?: number;
  /** Custom border radius */
  borderRadius?: number | string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  animation = true,
  lines = 1,
  borderRadius,
}: SkeletonProps) {
  const style: React.CSSProperties = {};

  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  if (height !== undefined) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }
  if (borderRadius !== undefined) {
    style.borderRadius = typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={styles.container}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${styles.skeleton} ${styles.text} ${animation ? styles.animated : ''}`}
            style={{
              ...style,
              width: i === lines - 1 ? '80%' : style.width,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${animation ? styles.animated : ''}`}
      style={style}
      aria-hidden="true"
    />
  );
}
Skeleton.displayName = 'Skeleton';
