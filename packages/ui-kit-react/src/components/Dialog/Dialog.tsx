import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '@claude-flow/ui-kit-icons';
import styles from './Dialog.module.css';
import cx from 'clsx';

export interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
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
  ...props
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

  const dialogClasses = cx(
    styles.root,
    styles[size],
    className
  );

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
          {...props}
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
                  <CloseIcon className={styles.closeIcon} />
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