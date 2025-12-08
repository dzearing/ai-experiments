import { forwardRef, type TextareaHTMLAttributes } from 'react';
import styles from './Textarea.module.css';

/**
 * Textarea component
 *
 * Surfaces used:
 * - inset
 *
 * Tokens used:
 * - --inset-bg, --inset-bg-hover, --inset-bg-focus
 * - --inset-text, --inset-text-soft
 * - --inset-border, --inset-border-focus
 * - --space-2, --space-3 (padding)
 * - --radius-md
 * - --focus-ring
 */

export type TextareaSize = 'sm' | 'md' | 'lg';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** Textarea size */
  size?: TextareaSize;
  /** Error state */
  error?: boolean;
  /** Full width textarea */
  fullWidth?: boolean;
  /** Auto-resize based on content */
  autoResize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ size = 'md', error = false, fullWidth = false, autoResize = false, className, ...props }, ref) => {
    const classNames = [
      styles.textarea,
      styles[size],
      error && styles.error,
      fullWidth && styles.fullWidth,
      autoResize && styles.autoResize,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return <textarea ref={ref} className={classNames} {...props} />;
  }
);

Textarea.displayName = 'Textarea';
