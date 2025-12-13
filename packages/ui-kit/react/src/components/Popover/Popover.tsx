import { useState, useRef, useEffect, type ReactNode } from 'react';
import styles from './Popover.module.css';

/**
 * Popover component - floating content panel
 *
 * Surfaces used:
 * - panel
 *
 * Tokens used:
 * - --panel-bg, --panel-border
 * - --shadow-md
 * - --radius-md
 */

export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right';

export interface PopoverProps {
  /** Popover content */
  content: ReactNode;
  /** Position relative to trigger */
  position?: PopoverPosition;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** The element that triggers the popover */
  children: ReactNode;
}

export function Popover({
  content,
  position = 'bottom',
  open: controlledOpen,
  onOpenChange,
  children,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setOpen = (value: boolean) => {
    if (!isControlled) {
      setInternalOpen(value);
    }
    onOpenChange?.(value);
  };

  const togglePopover = () => {
    setOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div onClick={togglePopover}>{children}</div>
      {isOpen && (
        <div className={`${styles.popover} ${styles[position]}`}>
          {content}
        </div>
      )}
    </div>
  );
}
Popover.displayName = 'Popover';
