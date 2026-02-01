import { useRef, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks';
import styles from './SidePanel.module.css';

/**
 * SidePanel component - slide-out panel with overlay and push modes
 *
 * Overlay mode: Modal-like with portal, backdrop, and focus trap
 * Push mode: Inline rendering that affects sibling layout
 *
 * Surfaces used:
 * - overlay (backdrop)
 * - panel (content container)
 *
 * Tokens used:
 * - --z-sidebar
 * - --z-modal-backdrop
 * - --soft-bg, --soft-border, --soft-shadow
 */

export type SidePanelMode = 'overlay' | 'push';
export type SidePanelPosition = 'left' | 'right';
export type SidePanelSize = 'sm' | 'md' | 'lg' | 'auto';

export interface SidePanelProps {
  /** Whether panel is open */
  open: boolean;
  /** Close callback */
  onClose: () => void;
  /** Display mode: overlay (modal-like) or push (inline) */
  mode?: SidePanelMode;
  /** Panel position */
  position?: SidePanelPosition;
  /** Panel width */
  size?: SidePanelSize;
  /** Close on backdrop click (overlay mode only) */
  closeOnBackdrop?: boolean;
  /** Close on Escape key */
  closeOnEscape?: boolean;
  /** Panel header content */
  header?: ReactNode;
  /** Panel content */
  children: ReactNode;
  /** Additional className */
  className?: string;
}

export function SidePanel({
  open,
  onClose,
  mode = 'push',
  position = 'left',
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  header,
  children,
  className,
}: SidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus trap for overlay mode only
  useFocusTrap(panelRef, open && mode === 'overlay');

  // Escape key handler
  const handleEscape = useCallback(
    (event: globalThis.KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  // Lock body scroll for overlay mode
  useEffect(() => {
    if (!open || mode !== 'overlay') return;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open, mode]);

  // Escape key listener
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, closeOnEscape, handleEscape]);

  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  const handlePanelClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const panelClassName = [
    styles.panel,
    styles[mode],
    styles[position],
    styles[`size-${size}`],
    open ? styles.open : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  // Push mode - inline rendering
  if (mode === 'push') {
    return (
      <aside
        ref={panelRef}
        className={panelClassName}
        data-state={open ? 'open' : 'closed'}
      >
        {header && <div className={styles.header}>{header}</div>}
        <div className={styles.content}>{children}</div>
      </aside>
    );
  }

  // Overlay mode - portal with backdrop
  if (!open) return null;

  return createPortal(
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <aside
        ref={panelRef}
        className={panelClassName}
        onClick={handlePanelClick}
        role="dialog"
        aria-modal="true"
      >
        {header && <div className={styles.header}>{header}</div>}
        <div className={styles.content}>{children}</div>
      </aside>
    </div>,
    document.body
  );
}

SidePanel.displayName = 'SidePanel';
