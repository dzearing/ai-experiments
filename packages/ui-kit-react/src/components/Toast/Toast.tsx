import React from 'react';
import { CheckCircleIcon, ErrorCircleIcon, WarningTriangleIcon, InfoCircleIcon, CloseIcon } from '@claude-flow/ui-kit-icons';
import styles from './Toast.module.css';
import cx from 'clsx';

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Toast variant */
  variant?: 'info' | 'success' | 'warning' | 'error';
  /** Toast title */
  title?: string;
  /** Toast message */
  message: string;
  /** Show close button */
  closable?: boolean;
  /** Close handler */
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  variant = 'info',
  title,
  message,
  closable = true,
  onClose,
  className,
  ...props
}) => {
  const toastClasses = cx(
    styles.root,
    styles[variant],
    className
  );

  return (
    <div className={toastClasses} role="alert" {...props}>
      <div className={styles.iconWrapper}>
        {variant === 'success' && <CheckCircleIcon className={styles.icon} size={20} />}
        {variant === 'error' && <ErrorCircleIcon className={styles.icon} size={20} />}
        {variant === 'warning' && <WarningTriangleIcon className={styles.icon} size={20} />}
        {variant === 'info' && <InfoCircleIcon className={styles.icon} size={20} />}
      </div>
      <div className={styles.content}>
        {title && <h4 className={styles.title}>{title}</h4>}
        <p className={styles.message}>{message}</p>
      </div>
      {closable && (
        <button 
          className={styles.closeButton} 
          onClick={onClose}
          aria-label="Close toast"
        >
          <CloseIcon className={styles.closeIcon} size={20} />
        </button>
      )}
    </div>
  );
};