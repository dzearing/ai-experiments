import { type ReactNode } from 'react';
import styles from './Chip.module.css';

/**
 * Chip component - interactive tag with optional actions
 *
 * Tokens used:
 * - --controlSubtle-bg, --controlSubtle-bg-hover
 * - --controlPrimary-bg, --controlPrimary-text
 */

export type ChipVariant = 'default' | 'primary' | 'outline' | 'success' | 'warning' | 'error' | 'info';
export type ChipSize = 'sm' | 'md';

export interface ChipProps {
  /** Chip label */
  children: ReactNode;
  /** Chip variant */
  variant?: ChipVariant;
  /** Chip size */
  size?: ChipSize;
  /** Whether chip is selected */
  selected?: boolean;
  /** Whether chip is disabled */
  disabled?: boolean;
  /** Optional leading icon */
  icon?: ReactNode;
  /** Called when chip is clicked */
  onClick?: () => void;
  /** Called when remove is clicked */
  onRemove?: () => void;
}

const RemoveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export function Chip({
  children,
  variant = 'default',
  size = 'md',
  selected = false,
  disabled = false,
  icon,
  onClick,
  onRemove,
}: ChipProps) {
  const isClickable = onClick && !disabled;
  const Component = isClickable ? 'button' : 'span';

  return (
    <Component
      type={isClickable ? 'button' : undefined}
      className={`${styles.chip} ${styles[variant]} ${styles[size]} ${selected ? styles.selected : ''} ${disabled ? styles.disabled : ''} ${isClickable ? styles.clickable : ''}`}
      onClick={isClickable ? onClick : undefined}
      disabled={disabled}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{children}</span>
      {onRemove && !disabled && (
        <button
          type="button"
          className={styles.remove}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove"
        >
          <RemoveIcon />
        </button>
      )}
    </Component>
  );
}
Chip.displayName = 'Chip';
