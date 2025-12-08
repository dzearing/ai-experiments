import { useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Drawer.module.css';

/**
 * Drawer component - slide-out panel from edge of screen
 *
 * Surfaces used:
 * - overlay (backdrop)
 * - panel (content container)
 *
 * Tokens used:
 * - --overlay-bg
 * - --panel-bg, --panel-border
 * - --shadow-lg
 */

export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'full';

export interface DrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback when drawer should close */
  onClose: () => void;
  /** Drawer position */
  position?: DrawerPosition;
  /** Drawer size */
  size?: DrawerSize;
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
  /** Close on Escape key */
  closeOnEscape?: boolean;
  /** Drawer content */
  children: ReactNode;
}

export function Drawer({
  open,
  onClose,
  position = 'right',
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  children,
}: DrawerProps) {
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

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  if (!open) return null;

  const drawer = (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div
        className={`${styles.drawer} ${styles[position]} ${styles[`size-${size}`]}`}
        onClick={handleContentClick}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );

  return createPortal(drawer, document.body);
}
