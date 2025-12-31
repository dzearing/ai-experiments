import { useState, useCallback, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Button, type ButtonVariant, type ButtonSize } from '../Button';
import { IconButton } from '../IconButton';
import { Tooltip } from '../Tooltip';
import { CopyIcon } from '@ui-kit/icons/CopyIcon';
import { CheckIcon } from '@ui-kit/icons/CheckIcon';
import styles from './CopyButton.module.css';

/**
 * CopyButton - A button that copies content to clipboard with visual feedback
 *
 * Features:
 * - Supports both icon-only mode (when no children) and labeled mode
 * - Shows "Copied!" tooltip and checkmark icon briefly after copying
 * - Accepts either static content or a callback to get content dynamically
 *
 * Surfaces used:
 * - control (default variant)
 * - controlSubtle (ghost variant)
 *
 * Tokens used:
 * - --duration-normal (feedback animation)
 * - --success-fg (checkmark color)
 */

export type CopyButtonVariant = ButtonVariant;
export type CopyButtonSize = ButtonSize;

export interface CopyButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick' | 'onError'> {
  /** Static content to copy */
  content?: string;
  /** Callback to get content dynamically (called when button is clicked) */
  getContent?: () => string | Promise<string>;
  /** Button variant */
  variant?: CopyButtonVariant;
  /** Button size */
  size?: CopyButtonSize;
  /** Label text (if provided, renders as Button with icon; if omitted, renders as IconButton) */
  children?: ReactNode;
  /** Accessible label for icon-only mode (defaults to "Copy to clipboard") */
  'aria-label'?: string;
  /** Callback when copy succeeds */
  onCopy?: () => void;
  /** Callback when copy fails */
  onError?: (error: Error) => void;
  /** Duration to show "Copied!" feedback in milliseconds (default: 2000) */
  feedbackDuration?: number;
}

export function CopyButton({
  content,
  getContent,
  variant = 'ghost',
  size = 'md',
  children,
  'aria-label': ariaLabel = 'Copy to clipboard',
  onCopy,
  onError,
  feedbackDuration = 2000,
  className,
  disabled,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    try {
      let textToCopy: string;

      if (getContent) {
        textToCopy = await getContent();
      } else if (content !== undefined) {
        textToCopy = content;
      } else {
        throw new Error('CopyButton requires either content or getContent prop');
      }

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      onCopy?.();

      // Reset after feedback duration
      setTimeout(() => {
        setCopied(false);
      }, feedbackDuration);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to copy'));
    }
  }, [content, getContent, onCopy, onError, feedbackDuration]);

  const icon = copied ? (
    <span className={styles.iconWrapper}>
      <CheckIcon className={styles.checkIcon} />
    </span>
  ) : (
    <span className={styles.iconWrapper}>
      <CopyIcon />
    </span>
  );

  const tooltipContent = copied ? 'Copied!' : ariaLabel;

  // Icon-only mode (no children)
  if (!children) {
    return (
      <Tooltip content={tooltipContent} position="top">
        <IconButton
          icon={icon}
          variant={variant}
          size={size}
          aria-label={ariaLabel}
          onClick={handleCopy}
          disabled={disabled}
          hideTooltip
          className={className}
          {...props}
        />
      </Tooltip>
    );
  }

  // Labeled mode (with children)
  return (
    <Tooltip content={tooltipContent} position="top">
      <Button
        icon={icon}
        variant={variant}
        size={size}
        onClick={handleCopy}
        disabled={disabled}
        className={className}
        {...props}
      >
        {children}
      </Button>
    </Tooltip>
  );
}

CopyButton.displayName = 'CopyButton';
