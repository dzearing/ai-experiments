import type { ReactNode } from 'react';
import { Modal, type ModalSize } from '../Modal';
import styles from './Dialog.module.css';

/**
 * Dialog component - Modal with header, content, and footer structure
 *
 * Surfaces used:
 * - panel (inherited from Modal)
 *
 * Tokens used:
 * - --space-4, --space-6 (padding)
 * - --panel-border
 */

export interface DialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Dialog title */
  title?: ReactNode;
  /** Dialog size */
  size?: ModalSize;
  /** Footer content (usually action buttons) */
  footer?: ReactNode;
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
  /** Close on Escape key */
  closeOnEscape?: boolean;
  /** Dialog content */
  children: ReactNode;
}

export function Dialog({
  open,
  onClose,
  title,
  size = 'md',
  footer,
  closeOnBackdrop = true,
  closeOnEscape = true,
  children,
}: DialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size={size}
      closeOnBackdrop={closeOnBackdrop}
      closeOnEscape={closeOnEscape}
    >
      {title && (
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
      <div className={styles.content}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </Modal>
  );
}
