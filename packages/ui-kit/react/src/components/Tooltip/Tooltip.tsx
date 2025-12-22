import {
  useState,
  useRef,
  useId,
  useLayoutEffect,
  useCallback,
  useEffect,
  type ReactNode,
  type ReactElement,
  cloneElement,
  isValidElement,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

/**
 * Tooltip component - contextual hover hint for elements
 *
 * Surfaces used:
 * - inverted (dark in light mode, light in dark mode)
 *
 * Tokens used:
 * - --surface-bg, --surface-text (via surface.inverted)
 * - --radius-sm
 * - --shadow-md
 * - --space-1, --space-2
 * - --duration-fast, --ease-default
 *
 * Features:
 * - Smart positioning: defaults to top, flips to stay on screen
 * - Singleton: only one tooltip visible at a time
 * - Scroll dismiss: hides when scrolling
 * - Portal rendering: renders to body for proper layering
 * - Beak/arrow pointing to target
 *
 * Accessibility:
 * - Uses aria-describedby to link trigger to tooltip content
 * - Supports keyboard focus (onFocus/onBlur)
 * - role="tooltip" on the tooltip element
 */

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** Tooltip content */
  content: ReactNode;
  /** Preferred position relative to trigger (will flip if needed) */
  position?: TooltipPosition;
  /** Delay before showing (ms) */
  delay?: number;
  /** The element that triggers the tooltip */
  children: ReactElement;
  /** Disable the tooltip */
  disabled?: boolean;
  /** Enable multiline/rich content mode (allows text wrapping) */
  multiline?: boolean;
  /** Max width of tooltip in multiline mode (default: 280px) */
  maxWidth?: number;
}

// Singleton management - only one tooltip visible at a time
let activeTooltipId: string | null = null;
const tooltipListeners = new Set<(id: string | null) => void>();

function setActiveTooltip(id: string | null) {
  activeTooltipId = id;
  tooltipListeners.forEach((listener) => listener(id));
}

function useActiveTooltip(id: string) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const listener = (activeId: string | null) => {
      setIsActive(activeId === id);
    };
    tooltipListeners.add(listener);
    // Check initial state
    setIsActive(activeTooltipId === id);
    return () => {
      tooltipListeners.delete(listener);
    };
  }, [id]);

  return isActive;
}

interface TooltipState {
  x: number;
  y: number;
  actualPosition: TooltipPosition;
  beakX: number;
  beakY: number;
}

const OFFSET = 8; // Distance from target
const BEAK_SIZE = 8; // Size of the beak/arrow
const VIEWPORT_PADDING = 8; // Minimum distance from viewport edge

function calculatePosition(
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  preferredPosition: TooltipPosition,
): TooltipState {
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
  const totalHeight = tooltipRect.height + OFFSET + BEAK_SIZE;
  const totalWidth = tooltipRect.width + OFFSET + BEAK_SIZE;

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
  let beakX = 0;
  let beakY = 0;

  const triggerCenterX = triggerRect.left + triggerRect.width / 2;
  const triggerCenterY = triggerRect.top + triggerRect.height / 2;

  switch (actualPosition) {
    case 'top':
      x = triggerCenterX - tooltipRect.width / 2;
      y = triggerRect.top - tooltipRect.height - OFFSET - BEAK_SIZE;
      beakX = tooltipRect.width / 2 - BEAK_SIZE;
      beakY = tooltipRect.height;
      break;
    case 'bottom':
      x = triggerCenterX - tooltipRect.width / 2;
      y = triggerRect.bottom + OFFSET + BEAK_SIZE;
      beakX = tooltipRect.width / 2 - BEAK_SIZE;
      beakY = -BEAK_SIZE;
      break;
    case 'left':
      x = triggerRect.left - tooltipRect.width - OFFSET - BEAK_SIZE;
      y = triggerCenterY - tooltipRect.height / 2;
      beakX = tooltipRect.width;
      beakY = tooltipRect.height / 2 - BEAK_SIZE;
      break;
    case 'right':
      x = triggerRect.right + OFFSET + BEAK_SIZE;
      y = triggerCenterY - tooltipRect.height / 2;
      beakX = -BEAK_SIZE;
      beakY = tooltipRect.height / 2 - BEAK_SIZE;
      break;
  }

  // Constrain horizontal position to viewport
  if (actualPosition === 'top' || actualPosition === 'bottom') {
    const minX = VIEWPORT_PADDING;
    const maxX = viewport.width - tooltipRect.width - VIEWPORT_PADDING;

    if (x < minX) {
      const shift = minX - x;
      x = minX;
      beakX = Math.max(BEAK_SIZE, beakX - shift);
    } else if (x > maxX) {
      const shift = x - maxX;
      x = maxX;
      beakX = Math.min(tooltipRect.width - BEAK_SIZE * 2, beakX + shift);
    }
  }

  // Constrain vertical position to viewport
  if (actualPosition === 'left' || actualPosition === 'right') {
    const minY = VIEWPORT_PADDING;
    const maxY = viewport.height - tooltipRect.height - VIEWPORT_PADDING;

    if (y < minY) {
      const shift = minY - y;
      y = minY;
      beakY = Math.max(BEAK_SIZE, beakY - shift);
    } else if (y > maxY) {
      const shift = y - maxY;
      y = maxY;
      beakY = Math.min(tooltipRect.height - BEAK_SIZE * 2, beakY + shift);
    }
  }

  return { x, y, actualPosition, beakX, beakY };
}

export function Tooltip({
  content,
  position = 'top',
  delay = 200,
  children,
  disabled = false,
  multiline = false,
  maxWidth,
}: TooltipProps) {
  const [shouldShow, setShouldShow] = useState(false);
  const [tooltipState, setTooltipState] = useState<TooltipState | null>(null);
  const timeoutRef = useRef<number | undefined>(undefined);
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();
  const isActive = useActiveTooltip(tooltipId);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const state = calculatePosition(triggerRect, tooltipRect, position);
    setTooltipState(state);
  }, [position]);

  // Update position when tooltip becomes visible
  useLayoutEffect(() => {
    if (shouldShow && isActive) {
      // Need a frame for the tooltip to render and get its dimensions
      requestAnimationFrame(() => {
        updatePosition();
      });
    }
  }, [shouldShow, isActive, updatePosition]);

  // Handle scroll dismiss
  useEffect(() => {
    if (!shouldShow || !isActive) return;

    const handleScroll = () => {
      setShouldShow(false);
      setActiveTooltip(null);
    };

    // Listen on capture phase to catch all scroll events
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [shouldShow, isActive]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showTooltip = useCallback(() => {
    if (disabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setShouldShow(true);
      setActiveTooltip(tooltipId);
    }, delay);
  }, [delay, disabled, tooltipId]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShouldShow(false);
    if (activeTooltipId === tooltipId) {
      setActiveTooltip(null);
    }
  }, [tooltipId]);

  // Clone children to attach ref and event handlers
  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        ref: (node: HTMLElement | null) => {
          triggerRef.current = node;
          // Forward ref if children has one (React 19: ref is now in props)
          const childProps = children.props as { ref?: React.Ref<HTMLElement> };
          const childRef = childProps.ref;
          if (typeof childRef === 'function') {
            childRef(node);
          } else if (childRef && typeof childRef === 'object') {
            (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
          }
        },
        onMouseEnter: (e: React.MouseEvent) => {
          showTooltip();
          const childProps = children.props as { onMouseEnter?: (e: React.MouseEvent) => void };
          childProps.onMouseEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent) => {
          hideTooltip();
          const childProps = children.props as { onMouseLeave?: (e: React.MouseEvent) => void };
          childProps.onMouseLeave?.(e);
        },
        onFocus: (e: React.FocusEvent) => {
          showTooltip();
          const childProps = children.props as { onFocus?: (e: React.FocusEvent) => void };
          childProps.onFocus?.(e);
        },
        onBlur: (e: React.FocusEvent) => {
          hideTooltip();
          const childProps = children.props as { onBlur?: (e: React.FocusEvent) => void };
          childProps.onBlur?.(e);
        },
        'aria-describedby': shouldShow && isActive ? tooltipId : undefined,
      })
    : children;

  const isVisible = shouldShow && isActive;

  const tooltipClasses = [
    styles.tooltip,
    tooltipState ? styles.visible : '',
    multiline ? styles.multiline : '',
  ].filter(Boolean).join(' ');

  const tooltip = isVisible ? (
    <div
      ref={tooltipRef}
      id={tooltipId}
      className={tooltipClasses}
      role="tooltip"
      style={{
        ...(tooltipState && {
          transform: `translate(${tooltipState.x}px, ${tooltipState.y}px)`,
        }),
        ...(maxWidth && { maxWidth: `${maxWidth}px` }),
      }}
    >
      {content}
      {tooltipState && (
        <span
          className={`${styles.beak} ${styles[`beak-${tooltipState.actualPosition}`]}`}
          style={{
            left: tooltipState.actualPosition === 'left' || tooltipState.actualPosition === 'right'
              ? undefined
              : tooltipState.beakX,
            top: tooltipState.actualPosition === 'top' || tooltipState.actualPosition === 'bottom'
              ? undefined
              : tooltipState.beakY,
          }}
        />
      )}
    </div>
  ) : null;

  return (
    <>
      {trigger}
      {typeof document !== 'undefined' && tooltip && createPortal(tooltip, document.body)}
    </>
  );
}

Tooltip.displayName = 'Tooltip';
