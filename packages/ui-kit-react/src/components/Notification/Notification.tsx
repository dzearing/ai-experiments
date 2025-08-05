import React from 'react';
import { CheckCircleIcon, ErrorCircleIcon, WarningTriangleIcon, InfoCircleIcon } from '@claude-flow/ui-kit-icons';
import styles from './Notification.module.css';
import cx from 'clsx';

export interface NotificationProps extends React.HTMLAttributes<HTMLDivElement | HTMLButtonElement> {
  /** Notification variant */
  variant?: 'info' | 'success' | 'warning' | 'error';
  /** Notification title */
  title: string;
  /** Notification description */
  description?: string;
  /** Action buttons */
  actions?: React.ReactNode;
  /** Show timestamp */
  timestamp?: string;
  /** Icon override */
  icon?: React.ReactNode;
  /** Mark as read */
  read?: boolean;
  /** Click handler */
  onClick?: () => void;
}

export const Notification: React.FC<NotificationProps> = ({
  variant = 'info',
  title,
  description,
  actions,
  timestamp,
  icon,
  read = false,
  onClick,
  className,
  ...props
}) => {
  const notificationClasses = cx(
    styles.root,
    styles[variant],
    read && styles.read,
    onClick && styles.clickable,
    className
  );

  const content = (
    <>
      <div className={styles.iconWrapper}>
        {icon || (
          <>
            {variant === 'success' && <CheckCircleIcon className={styles.icon} size={20} />}
            {variant === 'error' && <ErrorCircleIcon className={styles.icon} size={20} />}
            {variant === 'warning' && <WarningTriangleIcon className={styles.icon} size={20} />}
            {variant === 'info' && <InfoCircleIcon className={styles.icon} size={20} />}
          </>
        )}
        {!read && <span className={styles.unreadDot} />}
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <h4 className={styles.title}>{title}</h4>
          {timestamp && <span className={styles.timestamp}>{timestamp}</span>}
        </div>
        {description && <p className={styles.description}>{description}</p>}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button 
        className={notificationClasses}
        onClick={onClick}
        type="button"
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={notificationClasses} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
      {content}
    </div>
  );
};