import { useCallback, type ReactNode } from 'react';
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
  /** Callback when dialog should submit (Enter outside inputs, Ctrl/Cmd+Enter in inputs) */
  onSubmit?: () => void;
  /** Dialog title */
  title?: ReactNode;
  /** Dialog size */
  size?: ModalSize;
  /** Fixed height for the dialog (e.g., "50vh", "400px") - prevents content-based sizing */
  height?: string;
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
  onSubmit,
  title,
  size = 'md',
  height,
  footer,
  closeOnBackdrop = true,
  closeOnEscape = true,
  children,
}: DialogProps) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!onSubmit || e.key !== 'Enter') return;

    const target = e.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    const isTextInput = tagName === 'input' || tagName === 'textarea';

    // In text inputs: require Ctrl/Cmd+Enter
    // Outside text inputs: plain Enter submits
    if (isTextInput) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        onSubmit();
      }
    } else {
      // Don't submit if Enter is pressed on a button (let it activate the button)
      if (tagName !== 'button') {
        e.preventDefault();
        onSubmit();
      }
    }
  }, [onSubmit]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size={size}
      height={height}
      closeOnBackdrop={closeOnBackdrop}
      closeOnEscape={closeOnEscape}
    >
      <div className={styles.dialog} onKeyDown={handleKeyDown}>
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
      </div>
    </Modal>
  );
}
Dialog.displayName = 'Dialog';
