import { forwardRef, type InputHTMLAttributes, type HTMLAttributes } from 'react';
import { SearchIcon } from '@ui-kit/icons/SearchIcon';
import styles from './SearchInput.module.css';

/**
 * SearchInput - Pill-shaped input with integrated search icon
 *
 * A specialized input variant designed for search functionality.
 * Features a pill shape (fully rounded) and an integrated search icon.
 *
 * Surfaces used:
 * - softer (for input background)
 *
 * Tokens used:
 * - --softer-bg, --softer-bg-hover, --softer-bg-pressed
 * - --softer-fg, --softer-fg-soft
 * - --softer-border
 * - --radius-full (pill shape)
 * - --space-2, --space-3, --space-4 (padding)
 * - --control-height-sm, --control-height-md, --control-height-lg
 * - --focus-ring, --focus-ring-width, --focus-ring-offset
 * - --duration-fast, --ease-default
 */

export type SearchInputSize = 'sm' | 'md' | 'lg';

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /** Input size - matches control height standards (28px/36px/44px) */
  size?: SearchInputSize;
  /** Whether the input should take full width of its container */
  fullWidth?: boolean;
  /** Additional class name for the wrapper element */
  wrapperClassName?: string;
  /** Additional props for the wrapper element */
  wrapperProps?: Omit<HTMLAttributes<HTMLDivElement>, 'className'>;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      size = 'md',
      fullWidth = false,
      className,
      wrapperClassName,
      wrapperProps,
      ...props
    },
    ref
  ) => {
    const wrapperClassNames = [
      styles.wrapper,
      styles[size],
      fullWidth && styles.fullWidth,
      wrapperClassName,
    ]
      .filter(Boolean)
      .join(' ');

    const inputClassNames = [styles.input, className].filter(Boolean).join(' ');

    return (
      <div className={wrapperClassNames} {...wrapperProps}>
        <SearchIcon className={styles.icon} aria-hidden="true" />
        <input
          ref={ref}
          type="search"
          className={inputClassNames}
          {...props}
        />
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
