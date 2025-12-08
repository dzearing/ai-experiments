import { type ReactNode, type AnchorHTMLAttributes } from 'react';
import styles from './Link.module.css';

/**
 * Link component - styled anchor element
 *
 * Tokens used:
 * - --body-link, --body-link-hover
 */

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Link content */
  children: ReactNode;
  /** Whether link opens in new tab */
  external?: boolean;
  /** Hide underline */
  noUnderline?: boolean;
}

export function Link({
  children,
  external = false,
  noUnderline = false,
  className = '',
  ...props
}: LinkProps) {
  const externalProps = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <a
      className={`${styles.link} ${noUnderline ? styles.noUnderline : ''} ${className}`}
      {...externalProps}
      {...props}
    >
      {children}
      {external && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={styles.externalIcon}
          aria-hidden="true"
        >
          <path
            d="M4.5 2.5h5v5M9.5 2.5l-7 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </a>
  );
}
