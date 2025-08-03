import React, { useState, useEffect } from 'react';
import styles from './Banner.module.css';
import { Button } from '../Button';

export interface BannerProps {
  /** Banner variant */
  variant: 'error' | 'warning' | 'info' | 'success';
  /** Content to display in the banner */
  children: React.ReactNode;
  /** Whether the banner can be dismissed */
  dismissible?: boolean;
  /** Callback when banner is dismissed */
  onDismiss?: () => void;
  /** Custom icon to display */
  icon?: React.ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Position of the banner */
  position?: 'fixed' | 'relative';
  /** Banner ID for accessibility */
  id?: string;
}

export const Banner: React.FC<BannerProps> = ({
  variant,
  children,
  dismissible = false,
  onDismiss,
  icon,
  className = '',
  position = 'fixed',
  id,
}) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation after mount
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setExiting(true);
    // Wait for exit animation to complete
    setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 300); // matches --duration-slideOut
  };

  const ariaProps = variant === 'error' || variant === 'warning' 
    ? { role: 'alert' as const }
    : { 'aria-live': 'polite' as const };

  const classes = [
    styles.banner,
    styles[variant],
    visible && styles.visible,
    exiting && styles.exit,
    position === 'relative' && styles.relative,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      id={id}
      {...ariaProps}
    >
      <div className={styles.contentWrapper}>
        {icon && (
          <div className={styles.icon} aria-hidden="true">
            {icon}
          </div>
        )}
        <div className={styles.content}>
          {children}
        </div>
      </div>
      {dismissible && (
        <Button
          variant="inline"
          size="small"
          shape="square"
          className={styles.dismiss}
          onClick={handleDismiss}
          aria-label="Dismiss banner"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L8 7.293 4.354 3.646a.5.5 0 0 0-.708.708L7.293 8 3.646 11.646a.5.5 0 0 0 .708.708L8 8.707l3.646 3.647a.5.5 0 0 0 .708-.708L8.707 8l3.647-3.646z"/>
          </svg>
        </Button>
      )}
    </div>
  );
};

Banner.displayName = 'Banner';

// Default icons for each variant
export const BannerIcons = {
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path fillRule="evenodd" d="M8 14.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM6.97 5.97a.75.75 0 00-1.061 1.06L6.878 8l-.97.97a.75.75 0 101.061 1.06L8 9.061l1.03.97a.75.75 0 101.061-1.06L9.122 8l.97-.97a.75.75 0 00-1.061-1.06L8 6.939 6.97 5.97z" clipRule="evenodd"/>
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path fillRule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 01-1.299 2.25H2.804a1.5 1.5 0 01-1.298-2.25l5.195-9zM8 4a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 4zm0 7a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd"/>
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path fillRule="evenodd" d="M8 14.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM8 4.75a.75.75 0 100 1.5.75.75 0 000-1.5zM6.75 8.25a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v2.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25v-2h-.25a.75.75 0 01-.75-.75z" clipRule="evenodd"/>
    </svg>
  ),
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path fillRule="evenodd" d="M8 14.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13zm2.78-7.78a.75.75 0 00-1.06 0L7.25 9.19l-.97-.97a.75.75 0 10-1.06 1.06l1.5 1.5a.75.75 0 001.06 0l3-3a.75.75 0 000-1.06z" clipRule="evenodd"/>
    </svg>
  ),
};