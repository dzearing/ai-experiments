import { useEffect, useCallback, useState, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks';
import { SurfaceAnimation } from '../Animation';
import styles from './Modal.module.css';

/**
 * Modal component - overlay container for dialogs
 *
 * Surfaces used:
 * - overlay (backdrop)
 * - panel (content container)
 *
 * Tokens used:
 * - --overlay-bg
 * - --panel-bg, --panel-border
 * - --shadow-lg
 * - --radius-lg
 */

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal size */
  size?: ModalSize;
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
  /** Close on Escape key */
  closeOnEscape?: boolean;
  /** Modal content */
  children: ReactNode;
}

export function Modal({
  open,
  onClose,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  children,
}: ModalProps) {
  const [visible, setVisible] = useState(open);
  const [exiting, setExiting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Enable focus trap when modal is visible
  useFocusTrap(modalRef, visible && !exiting);

  const handleEscape = useCallback(
    (event: globalThis.KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  const handleContentClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  // Handle exit animation complete
  const handleExitComplete = useCallback(() => {
    setVisible(false);
    setExiting(false);
  }, []);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setExiting(false);
    } else if (visible) {
      setExiting(true);
      // Note: visible will be set to false in handleExitComplete
    }
  }, [open, visible]);

  useEffect(() => {
    if (visible) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [visible, handleEscape]);

  if (!visible) return null;

  const modal = (
    <div className={`${styles.backdrop} ${exiting ? styles.exiting : ''}`} onClick={handleBackdropClick}>
      <SurfaceAnimation
        isVisible={open && !exiting}
        direction="center"
        duration={200}
        onExitComplete={handleExitComplete}
        className={styles[size]}
      >
        <div
          ref={modalRef}
          className={styles.modal}
          onClick={handleContentClick}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </SurfaceAnimation>
    </div>
  );

  return createPortal(modal, document.body);
}
Modal.displayName = 'Modal';
