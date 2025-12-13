import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './Popover.module.css';

/**
 * Popover component - floating content panel
 *
 * Surfaces used:
 * - panel
 *
 * Tokens used:
 * - --popout-bg, --popout-border, --popout-shadow
 * - --radius-md
 *
 * Features:
 * - Portal rendering: renders to body for proper layering
 * - Smart positioning: stays within viewport bounds
 * - Click outside to dismiss
 * - Escape key to dismiss
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

const OFFSET = 8; // Distance from target
const VIEWPORT_PADDING = 8; // Minimum distance from viewport edge

interface PopoverState {
  x: number;
  y: number;
  actualPosition: PopoverPosition;
}

function calculatePosition(
  triggerRect: DOMRect,
  popoverRect: DOMRect,
  preferredPosition: PopoverPosition,
): PopoverState {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // Calculate available space in each direction
  const spaceAbove = triggerRect.top - VIEWPORT_PADDING;
  const spaceBelow = viewport.height - triggerRect.bottom - VIEWPORT_PADDING;
  const spaceLeft = triggerRect.left - VIEWPORT_PADDING;
  const spaceRight = viewport.width - triggerRect.right - VIEWPORT_PADDING;

  // Determine actual position based on preferred and available space
  let actualPosition = preferredPosition;
  const totalHeight = popoverRect.height + OFFSET;
  const totalWidth = popoverRect.width + OFFSET;

  // Flip vertical positions if needed
  if (preferredPosition === 'top' && spaceAbove < totalHeight && spaceBelow > spaceAbove) {
    actualPosition = 'bottom';
  } else if (preferredPosition === 'bottom' && spaceBelow < totalHeight && spaceAbove > spaceBelow) {
    actualPosition = 'top';
  }

  // Flip horizontal positions if needed
  if (preferredPosition === 'left' && spaceLeft < totalWidth && spaceRight > spaceLeft) {
    actualPosition = 'right';
  } else if (preferredPosition === 'right' && spaceRight < totalWidth && spaceLeft > spaceRight) {
    actualPosition = 'left';
  }

  // Calculate position coordinates
  let x = 0;
  let y = 0;

  const triggerCenterX = triggerRect.left + triggerRect.width / 2;
  const triggerCenterY = triggerRect.top + triggerRect.height / 2;

  switch (actualPosition) {
    case 'top':
      x = triggerCenterX - popoverRect.width / 2;
      y = triggerRect.top - popoverRect.height - OFFSET;
      break;
    case 'bottom':
      x = triggerCenterX - popoverRect.width / 2;
      y = triggerRect.bottom + OFFSET;
      break;
    case 'left':
      x = triggerRect.left - popoverRect.width - OFFSET;
      y = triggerCenterY - popoverRect.height / 2;
      break;
    case 'right':
      x = triggerRect.right + OFFSET;
      y = triggerCenterY - popoverRect.height / 2;
      break;
  }

  // Constrain horizontal position to viewport
  if (actualPosition === 'top' || actualPosition === 'bottom') {
    const minX = VIEWPORT_PADDING;
    const maxX = viewport.width - popoverRect.width - VIEWPORT_PADDING;
    x = Math.max(minX, Math.min(maxX, x));
  }

  // Constrain vertical position to viewport
  if (actualPosition === 'left' || actualPosition === 'right') {
    const minY = VIEWPORT_PADDING;
    const maxY = viewport.height - popoverRect.height - VIEWPORT_PADDING;
    y = Math.max(minY, Math.min(maxY, y));
  }

  return { x, y, actualPosition };
}

export function Popover({
  content,
  position = 'bottom',
  open: controlledOpen,
  onOpenChange,
  children,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [popoverState, setPopoverState] = useState<PopoverState | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setInternalOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange],
  );

  const togglePopover = () => {
    setOpen(!isOpen);
  };

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const state = calculatePosition(triggerRect, popoverRect, position);
    setPopoverState(state);
  }, [position]);

  // Update position when popover becomes visible
  useLayoutEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        updatePosition();
      });
    }
  }, [isOpen, updatePosition]);

  // Handle click outside and escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = triggerRef.current?.contains(target);
      const clickedPopover = popoverRef.current?.contains(target);

      if (!clickedTrigger && !clickedPopover) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, setOpen]);

  const popoverClasses = [
    styles.popover,
    popoverState ? styles.visible : '',
  ].filter(Boolean).join(' ');

  const popover = isOpen ? (
    <div
      ref={popoverRef}
      className={popoverClasses}
      style={
        popoverState
          ? { transform: `translate(${popoverState.x}px, ${popoverState.y}px)` }
          : undefined
      }
    >
      {content}
    </div>
  ) : null;

  return (
    <>
      <div ref={triggerRef} className={styles.trigger} onClick={togglePopover}>
        {children}
      </div>
      {typeof document !== 'undefined' && popover && createPortal(popover, document.body)}
    </>
  );
}
Popover.displayName = 'Popover';
