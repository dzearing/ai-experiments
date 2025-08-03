import React from 'react';
import styles from './Notification.module.css';

export interface NotificationProps {
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
  /** Additional CSS class */
  className?: string;
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
}) => {
  const notificationClasses = [
    styles.notification,
    styles[variant],
    read && styles.read,
    onClick && styles.clickable,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <div className={styles.iconWrapper}>
        {icon || (
          <>
            {variant === 'success' && (
              <svg className={styles.icon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {variant === 'error' && (
              <svg className={styles.icon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {variant === 'warning' && (
              <svg className={styles.icon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {variant === 'info' && (
              <svg className={styles.icon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
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
      >
        {content}
      </button>
    );
  }

  return (
    <div className={notificationClasses}>
      {content}
    </div>
  );
};