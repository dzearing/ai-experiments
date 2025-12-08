import { type ReactNode } from 'react';
import styles from './Banner.module.css';

/**
 * Banner component - prominent inline notification
 *
 * Tokens used:
 * - --status-info-bg, --status-success-bg, --status-warning-bg, --status-error-bg
 * - --status-info, --status-success, --status-warning, --status-error
 */

export type BannerVariant = 'default' | 'info' | 'success' | 'warning' | 'error';

export interface BannerProps {
  /** Banner content */
  children: ReactNode;
  /** Banner variant */
  variant?: BannerVariant;
  /** Optional title */
  title?: ReactNode;
  /** Optional icon */
  icon?: ReactNode;
  /** Optional action */
  action?: ReactNode;
  /** Whether banner can be dismissed */
  dismissible?: boolean;
  /** Called when dismissed */
  onDismiss?: () => void;
}

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 9v4M10 6.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SuccessIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const WarningIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 3l8 14H2l8-14z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M10 8v3M10 13.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const defaultIcons: Record<BannerVariant, ReactNode> = {
  default: <InfoIcon />,
  info: <InfoIcon />,
  success: <SuccessIcon />,
  warning: <WarningIcon />,
  error: <ErrorIcon />,
};

export function Banner({
  children,
  variant = 'default',
  title,
  icon,
  action,
  dismissible = false,
  onDismiss,
}: BannerProps) {
  const displayIcon = icon === undefined ? defaultIcons[variant] : icon;

  return (
    <div className={`${styles.banner} ${styles[variant]}`} role="alert">
      {displayIcon && <div className={styles.icon}>{displayIcon}</div>}
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.message}>{children}</div>
      </div>
      {action && <div className={styles.action}>{action}</div>}
      {dismissible && onDismiss && (
        <button type="button" className={styles.close} onClick={onDismiss} aria-label="Dismiss">
          <CloseIcon />
        </button>
      )}
    </div>
  );
}
