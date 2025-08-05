import React, { useState, useEffect } from 'react';
import { CloseIcon, ErrorCircleIcon, WarningTriangleIcon, InfoCircleIcon, CheckCircleIcon } from '@claude-flow/ui-kit-icons';
import styles from './Banner.module.css';
import { Button } from '../Button';
import cx from 'clsx';

export interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
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
  /** Position of the banner */
  position?: 'fixed' | 'relative';
}

export const Banner: React.FC<BannerProps> = ({
  variant,
  children,
  dismissible = false,
  onDismiss,
  icon,
  className,
  position = 'fixed',
  id,
  ...props
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

  const classes = cx(
    styles.root,
    styles[variant],
    visible && styles.visible,
    exiting && styles.exit,
    position === 'relative' && styles.relative,
    className
  );

  return (
    <div
      className={classes}
      id={id}
      {...ariaProps}
      {...props}
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
          <CloseIcon />
        </Button>
      )}
    </div>
  );
};

Banner.displayName = 'Banner';

// Default icons for each variant
export const BannerIcons = {
  error: <ErrorCircleIcon />,
  warning: <WarningTriangleIcon />,
  info: <InfoCircleIcon />,
  success: <CheckCircleIcon />,
};