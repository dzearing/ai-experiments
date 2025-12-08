import React from 'react';
import styles from './Link.module.css';
import cx from 'clsx';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Visual style variant */
  variant?: 'primary' | 'subtle' | 'inline';
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Shows external link icon */
  external?: boolean;
  /** Whether the link is in active state */
  active?: boolean;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ 
    variant = 'primary',
    size = 'medium',
    external = false,
    active = false,
    className,
    children,
    target,
    rel,
    ...props 
  }, ref) => {
    const classes = cx(
      styles.root,
      styles[variant],
      styles[size],
      external && styles.external,
      active && styles.active,
      className
    );

    // Ensure security for external links
    const finalRel = external 
      ? `${rel || ''} noopener noreferrer`.trim()
      : rel;

    const finalTarget = external && !target ? '_blank' : target;

    return (
      <a
        ref={ref}
        className={classes}
        target={finalTarget}
        rel={finalRel}
        {...props}
      >
        {children}
        {external && (
          <span className={styles.externalIcon} aria-label="Opens in new window">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M10.5 1.5v4h-1v-2.293L5.354 7.354l-.708-.708L8.793 2.5H6.5v-1h4z"/>
              <path d="M9.5 7.5v3a.5.5 0 01-.5.5H1.5a.5.5 0 01-.5-.5V3a.5.5 0 01.5-.5h3v1h-2.5v6h6v-2h1z"/>
            </svg>
          </span>
        )}
      </a>
    );
  }
);

Link.displayName = 'Link';