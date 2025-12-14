import {
  useRef,
  useCallback,
  useEffect,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react';

/**
 * FocusZone - Simple single-direction keyboard navigation
 *
 * A lightweight focus zone that enables arrow key navigation in one direction.
 * Use for menus, lists, toolbars, and other linear UI patterns.
 *
 * Uses "roving tabindex" pattern - only the active item is tabbable (tabindex=0),
 * all others have tabindex=-1. This allows Tab to exit the zone while arrows navigate within.
 *
 * For grid/wrap/masonry layouts, use BidirectionalFocusZone instead.
 */

export type FocusZoneDirection = 'vertical' | 'horizontal';

export interface FocusZoneProps extends HTMLAttributes<HTMLDivElement> {
  /** Navigation direction: 'vertical' (Up/Down) or 'horizontal' (Left/Right) */
  direction?: FocusZoneDirection;
  /** Wrap focus from last to first item (and vice versa) */
  wrap?: boolean;
  /** CSS selector for focusable elements (default: buttons, links, inputs) */
  selector?: string;
  /** Called when focus moves to a new element */
  onFocusChange?: (element: HTMLElement, index: number) => void;
}

const DEFAULT_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([disabled])';

export function FocusZone({
  direction = 'vertical',
  wrap = false,
  selector = DEFAULT_SELECTOR,
  onFocusChange,
  onKeyDown,
  onFocus,
  children,
  ...props
}: FocusZoneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef<number>(0);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(selector));
  }, [selector]);

  // Update tabindex for roving tabindex pattern
  const updateTabIndices = useCallback(
    (elements: HTMLElement[], activeIndex: number) => {
      elements.forEach((el, i) => {
        el.setAttribute('tabindex', i === activeIndex ? '0' : '-1');
      });
    },
    []
  );

  // Initialize tabindex on mount and when children change
  useEffect(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      // Ensure activeIndex is within bounds
      const validIndex = Math.min(activeIndexRef.current, elements.length - 1);
      activeIndexRef.current = validIndex;
      updateTabIndices(elements, validIndex);
    }
  }, [getFocusableElements, updateTabIndices, children]);

  const focusIndex = useCallback(
    (elements: HTMLElement[], index: number, currentIndex: number) => {
      if (index !== currentIndex && index >= 0 && index < elements.length) {
        activeIndexRef.current = index;
        updateTabIndices(elements, index);
        const nextElement = elements[index];
        nextElement.focus();
        onFocusChange?.(nextElement, index);
      }
    },
    [onFocusChange, updateTabIndices]
  );

  // Handle focus entering the zone
  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      onFocus?.(e);
      if (e.defaultPrevented) return;

      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const target = e.target as HTMLElement;
      const index = elements.indexOf(target);

      if (index !== -1 && index !== activeIndexRef.current) {
        activeIndexRef.current = index;
        updateTabIndices(elements, index);
      }
    },
    [getFocusableElements, updateTabIndices, onFocus]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;

      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const activeElement = document.activeElement as HTMLElement;
      const currentIndex = elements.indexOf(activeElement);
      if (currentIndex === -1) return;

      const isVertical = direction === 'vertical';
      const forwardKey = isVertical ? 'ArrowDown' : 'ArrowRight';
      const backwardKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

      // Determine page size (roughly 10 items or total count, whichever is smaller)
      const pageSize = Math.min(10, Math.max(1, Math.floor(elements.length / 2)));

      let nextIndex: number | null = null;

      switch (e.key) {
        case forwardKey:
          nextIndex = wrap
            ? (currentIndex + 1) % elements.length
            : Math.min(currentIndex + 1, elements.length - 1);
          break;
        case backwardKey:
          nextIndex = wrap
            ? (currentIndex - 1 + elements.length) % elements.length
            : Math.max(currentIndex - 1, 0);
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = elements.length - 1;
          break;
        case 'PageUp':
          nextIndex = Math.max(currentIndex - pageSize, 0);
          break;
        case 'PageDown':
          nextIndex = Math.min(currentIndex + pageSize, elements.length - 1);
          break;
        default:
          return; // Don't prevent default for unhandled keys (including Tab!)
      }

      e.preventDefault();
      focusIndex(elements, nextIndex, currentIndex);
    },
    [direction, wrap, getFocusableElements, focusIndex, onKeyDown]
  );

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      {...props}
    >
      {children}
    </div>
  );
}

FocusZone.displayName = 'FocusZone';
