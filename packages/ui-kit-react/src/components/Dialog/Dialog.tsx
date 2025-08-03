import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Dialog.module.css';

export interface DialogProps {
  /** Dialog open state */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Dialog title */
  title?: string;
  /** Dialog description */
  description?: string;
  /** Dialog content */
  children: React.ReactNode;
  /** Dialog footer actions */
  actions?: React.ReactNode;
  /** Dialog size */
  size?: 'small' | 'medium' | 'large';
  /** Show close button */
  showCloseButton?: boolean;
  /** Additional CSS class */
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  size = 'medium',
  showCloseButton = true,
  className,
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const dialogClasses = [
    styles.dialog,
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div className={styles.container}>
        <div 
          className={dialogClasses}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'dialog-title' : undefined}
          aria-describedby={description ? 'dialog-description' : undefined}
        >
          {(title || showCloseButton) && (
            <div className={styles.header}>
              {title && <h2 id="dialog-title" className={styles.title}>{title}</h2>}
              {showCloseButton && (
                <button 
                  className={styles.closeButton} 
                  onClick={onClose}
                  aria-label="Close dialog"
                >
                  <svg className={styles.closeIcon} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          )}
          
          {description && (
            <p id="dialog-description" className={styles.description}>
              {description}
            </p>
          )}
          
          <div className={styles.content}>
            {children}
          </div>
          
          {actions && (
            <div className={styles.actions}>
              {actions}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};