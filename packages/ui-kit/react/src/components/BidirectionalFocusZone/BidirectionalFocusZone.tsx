import {
  type ReactNode,
  type HTMLAttributes,
  type KeyboardEvent,
  useRef,
  useCallback,
  useEffect,
} from 'react';

/**
 * BidirectionalFocusZone - A container that enables bidirectional arrow key navigation
 *
 * Wrapping focusable elements in a BidirectionalFocusZone allows users to navigate
 * between them using arrow keys in a grid-like pattern. This is useful for:
 * - Icon grids
 * - Toolbars with multiple buttons
 * - Card grids
 * - Masonry/river layouts with variable-width items
 * - Any 2D layout of focusable elements
 *
 * Features:
 * - Arrow keys (Up/Down/Left/Right) navigate between focusable elements
 * - Uses element positions for navigation (works with variable-width layouts)
 * - Maintains horizontal/vertical anchors for consistent navigation in masonry grids
 * - Home/End move to first/last element
 * - PageUp/PageDown move by larger increments
 * - Tab/Shift+Tab exit the zone to next/previous focusable element
 * - RTL-aware: Left/Right keys are flipped in RTL mode
 * - Maintains focus position when elements change
 *
 * Tokens used: None (behavior-only component)
 */

export type FocusZoneLayout = 'grid' | 'wrap' | 'masonry';

export interface BidirectionalFocusZoneProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of columns (for calculating row navigation). If not provided, uses position-based navigation. */
  columns?: number;
  /** Whether to wrap focus when reaching the end */
  wrap?: boolean;
  /** RTL direction override (auto-detected from document if not provided) */
  dir?: 'ltr' | 'rtl';
  /** Whether the focus zone is disabled */
  disabled?: boolean;
  /** Element to focus initially (index or 'first' | 'last') */
  defaultFocus?: number | 'first' | 'last';
  /** Callback when focus changes */
  onFocusChange?: (index: number, element: HTMLElement) => void;
  /**
   * Layout mode for position-based navigation (when columns is not specified):
   * - 'grid': Standard grid, uses index-based navigation
   * - 'wrap': Flex-wrap layout (horizontal flow) - maintains horizontal anchor for up/down
   * - 'masonry': CSS columns layout (vertical flow) - maintains vertical anchor for left/right
   * @default 'wrap'
   */
  layout?: FocusZoneLayout;
  /** Children to wrap */
  children?: ReactNode;
}

// Selector for all focusable elements
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
].join(', ');

// Get center point of an element
function getElementCenter(el: HTMLElement): { x: number; y: number } {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

// Get horizontal anchor percentage (0-1) for an element within the container
// This represents the "center of gravity" for vertical navigation in flex-wrap layouts
function getHorizontalAnchor(el: HTMLElement, containerRect: DOMRect): number {
  const rect = el.getBoundingClientRect();
  const center = rect.left + rect.width / 2;
  return (center - containerRect.left) / containerRect.width;
}

// Get vertical anchor percentage (0-1) for an element within the container
// This represents the "center of gravity" for horizontal navigation in masonry layouts
function getVerticalAnchor(el: HTMLElement, containerRect: DOMRect): number {
  const rect = el.getBoundingClientRect();
  const center = rect.top + rect.height / 2;
  return (center - containerRect.top) / containerRect.height;
}

// Find element closest to a target X position (horizontal distance only)
// This is used for vertical navigation to maintain horizontal "center of gravity"
function findClosestElementByX(
  elements: HTMLElement[],
  targetX: number
): { element: HTMLElement; index: number } | null {
  let closestElement: HTMLElement | null = null;
  let closestIndex = -1;
  let closestDistance = Infinity;

  elements.forEach((el, index) => {
    const center = getElementCenter(el);
    const distance = Math.abs(center.x - targetX);

    if (distance < closestDistance) {
      closestElement = el;
      closestIndex = index;
      closestDistance = distance;
    }
  });

  return closestElement ? { element: closestElement, index: closestIndex } : null;
}

// Find element closest to a target Y position (vertical distance only)
// This is used for horizontal navigation in masonry layouts to maintain vertical "center of gravity"
function findClosestElementByY(
  elements: HTMLElement[],
  targetY: number
): { element: HTMLElement; index: number } | null {
  let closestElement: HTMLElement | null = null;
  let closestIndex = -1;
  let closestDistance = Infinity;

  elements.forEach((el, index) => {
    const center = getElementCenter(el);
    const distance = Math.abs(center.y - targetY);

    if (distance < closestDistance) {
      closestElement = el;
      closestIndex = index;
      closestDistance = distance;
    }
  });

  return closestElement ? { element: closestElement, index: closestIndex } : null;
}

// Group elements by their visual rows (based on vertical position)
function groupByRows(elements: HTMLElement[]): HTMLElement[][] {
  if (elements.length === 0) return [];

  const rows: HTMLElement[][] = [];
  let currentRow: HTMLElement[] = [];
  let currentRowTop = -Infinity;
  const ROW_THRESHOLD = 10; // pixels - elements within this Y difference are on same row

  // Sort by Y position first, then X position
  const sorted = [...elements].sort((a, b) => {
    const aRect = a.getBoundingClientRect();
    const bRect = b.getBoundingClientRect();
    const yDiff = aRect.top - bRect.top;
    if (Math.abs(yDiff) > ROW_THRESHOLD) return yDiff;
    return aRect.left - bRect.left;
  });

  sorted.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (currentRow.length === 0 || Math.abs(rect.top - currentRowTop) <= ROW_THRESHOLD) {
      currentRow.push(el);
      if (currentRow.length === 1) {
        currentRowTop = rect.top;
      }
    } else {
      rows.push(currentRow);
      currentRow = [el];
      currentRowTop = rect.top;
    }
  });

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return rows;
}

// Group elements by their visual columns (based on horizontal position)
// Used for masonry layouts where items flow vertically within columns
function groupByColumns(elements: HTMLElement[]): HTMLElement[][] {
  if (elements.length === 0) return [];

  const cols: HTMLElement[][] = [];
  let currentCol: HTMLElement[] = [];
  let currentColLeft = -Infinity;
  const COL_THRESHOLD = 10; // pixels - elements within this X difference are in same column

  // Sort by X position first, then Y position (column-major order)
  const sorted = [...elements].sort((a, b) => {
    const aRect = a.getBoundingClientRect();
    const bRect = b.getBoundingClientRect();
    const xDiff = aRect.left - bRect.left;
    if (Math.abs(xDiff) > COL_THRESHOLD) return xDiff;
    return aRect.top - bRect.top;
  });

  sorted.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (currentCol.length === 0 || Math.abs(rect.left - currentColLeft) <= COL_THRESHOLD) {
      currentCol.push(el);
      if (currentCol.length === 1) {
        currentColLeft = rect.left;
      }
    } else {
      cols.push(currentCol);
      currentCol = [el];
      currentColLeft = rect.left;
    }
  });

  if (currentCol.length > 0) {
    cols.push(currentCol);
  }

  return cols;
}

export function BidirectionalFocusZone({
  columns,
  wrap: wrapFocus = true,
  dir,
  disabled = false,
  defaultFocus,
  onFocusChange,
  layout = 'wrap',
  className,
  children,
  onKeyDown,
  ...props
}: BidirectionalFocusZoneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const focusedIndexRef = useRef<number>(-1);
  const isInitializedRef = useRef(false);
  // Track the data-focus-id of the currently focused element to detect content changes
  const focusedIdRef = useRef<string | null>(null);
  // Horizontal anchor percentage (0-1) for maintaining "center of gravity" during vertical navigation
  // Used in 'wrap' layout mode
  const horizontalAnchorRef = useRef<number>(0.5);
  // Vertical anchor percentage (0-1) for maintaining "center of gravity" during horizontal navigation
  // Used in 'masonry' layout mode
  const verticalAnchorRef = useRef<number>(0.5);
  // Flag to skip anchor updates during keyboard navigation that should maintain the anchor
  const skipNextAnchorUpdateRef = useRef(false);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
  }, []);

  // Get effective direction (accounting for RTL)
  const getEffectiveDir = useCallback((): 'ltr' | 'rtl' => {
    if (dir) return dir;
    if (typeof document !== 'undefined') {
      return document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr';
    }
    return 'ltr';
  }, [dir]);

  // Focus an element at the given index
  const focusElement = useCallback(
    (index: number, elements?: HTMLElement[]) => {
      const focusable = elements || getFocusableElements();
      if (index >= 0 && index < focusable.length) {
        focusable[index].focus();
        focusedIndexRef.current = index;
        onFocusChange?.(index, focusable[index]);
      }
    },
    [getFocusableElements, onFocusChange]
  );

  // Update anchors when an element receives focus (via click or tab)
  // This sets the "center of gravity" for cross-axis navigation
  const updateAnchors = useCallback((el: HTMLElement) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    horizontalAnchorRef.current = getHorizontalAnchor(el, containerRect);
    verticalAnchorRef.current = getVerticalAnchor(el, containerRect);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) {
        onKeyDown?.(event);
        return;
      }

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        onKeyDown?.(event);
        return;
      }

      // Find current focused element
      const currentIndex = focusable.findIndex((el) => el === document.activeElement);
      if (currentIndex === -1) {
        onKeyDown?.(event);
        return;
      }

      const currentElement = focusable[currentIndex];
      const containerRect = containerRef.current?.getBoundingClientRect();

      if (!containerRect) {
        onKeyDown?.(event);
        return;
      }

      const isRtl = getEffectiveDir() === 'rtl';
      const total = focusable.length;
      let nextIndex = currentIndex;
      let handled = false;
      // Track which anchor should be updated after navigation
      let shouldUpdateAnchors = false;

      // Group elements based on layout mode
      const rows = groupByRows(focusable);
      const cols = layout === 'masonry' ? groupByColumns(focusable) : [];

      // Find current position in rows (for wrap layout)
      const currentRowIndex = rows.findIndex((row) => row.includes(currentElement));
      const currentRow = rows[currentRowIndex];
      const indexInRow = currentRow?.indexOf(currentElement) ?? 0;

      // Find current position in columns (for masonry layout)
      const currentColIndex = cols.findIndex((col) => col.includes(currentElement));
      const currentCol = cols[currentColIndex];
      const indexInCol = currentCol?.indexOf(currentElement) ?? 0;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowLeft': {
          const isForward = event.key === 'ArrowRight' ? !isRtl : isRtl;

          if (columns !== undefined) {
            // Use simple index-based navigation when columns is specified
            const delta = isForward ? 1 : -1;
            nextIndex = currentIndex + delta;
            if (wrapFocus && nextIndex >= total) nextIndex = 0;
            if (wrapFocus && nextIndex < 0) nextIndex = total - 1;
            handled = nextIndex >= 0 && nextIndex < total;
            shouldUpdateAnchors = true;
          } else if (layout === 'masonry') {
            // Masonry layout: left/right moves between columns, maintaining vertical anchor
            const targetColIndex = currentColIndex + (isForward ? 1 : -1);

            if (targetColIndex >= 0 && targetColIndex < cols.length) {
              const targetCol = cols[targetColIndex];
              // Find element in target column closest to our vertical anchor
              const targetY = containerRect.top + verticalAnchorRef.current * containerRect.height;
              const closest = findClosestElementByY(targetCol, targetY);
              if (closest) {
                nextIndex = focusable.indexOf(closest.element);
                handled = true;
              }
            } else if (wrapFocus) {
              // Wrap to first/last column
              const targetCol = isForward ? cols[0] : cols[cols.length - 1];
              const targetY = containerRect.top + verticalAnchorRef.current * containerRect.height;
              const closest = findClosestElementByY(targetCol, targetY);
              if (closest) {
                nextIndex = focusable.indexOf(closest.element);
                handled = true;
              }
            }
            // Don't update anchors - maintain vertical center of gravity
          } else {
            // Wrap layout: left/right moves within current row
            if (currentRow) {
              const nextIndexInRow = indexInRow + (isForward ? 1 : -1);
              if (nextIndexInRow >= 0 && nextIndexInRow < currentRow.length) {
                nextIndex = focusable.indexOf(currentRow[nextIndexInRow]);
                handled = true;
              } else if (wrapFocus) {
                // Wrap within row
                if (nextIndexInRow < 0) {
                  nextIndex = focusable.indexOf(currentRow[currentRow.length - 1]);
                } else {
                  nextIndex = focusable.indexOf(currentRow[0]);
                }
                handled = true;
              }
            }
            // Update anchors on left/right in wrap layout
            shouldUpdateAnchors = true;
          }
          break;
        }

        case 'ArrowDown':
        case 'ArrowUp': {
          const isDown = event.key === 'ArrowDown';

          if (columns !== undefined) {
            // Use column-based navigation when columns is specified
            const currentRowNum = Math.floor(currentIndex / columns);
            const col = currentIndex % columns;
            const maxRows = Math.ceil(total / columns);
            const targetRowNum = currentRowNum + (isDown ? 1 : -1);

            if (targetRowNum >= 0 && targetRowNum < maxRows) {
              nextIndex = targetRowNum * columns + col;
              if (nextIndex >= total) nextIndex = total - 1;
              handled = true;
            } else if (wrapFocus) {
              if (isDown) {
                nextIndex = col;
              } else {
                const lastRow = maxRows - 1;
                nextIndex = lastRow * columns + col;
                if (nextIndex >= total) nextIndex = total - 1;
              }
              handled = true;
            }
          } else if (layout === 'masonry') {
            // Masonry layout: up/down moves within current column
            if (currentCol) {
              const nextIndexInCol = indexInCol + (isDown ? 1 : -1);
              if (nextIndexInCol >= 0 && nextIndexInCol < currentCol.length) {
                nextIndex = focusable.indexOf(currentCol[nextIndexInCol]);
                handled = true;
              } else if (wrapFocus) {
                // Wrap within column
                if (nextIndexInCol < 0) {
                  nextIndex = focusable.indexOf(currentCol[currentCol.length - 1]);
                } else {
                  nextIndex = focusable.indexOf(currentCol[0]);
                }
                handled = true;
              }
            }
            // Update anchors on up/down in masonry layout
            shouldUpdateAnchors = true;
          } else {
            // Wrap layout: up/down moves between rows, maintaining horizontal anchor
            const targetRowIndex = currentRowIndex + (isDown ? 1 : -1);

            if (targetRowIndex >= 0 && targetRowIndex < rows.length) {
              const targetRow = rows[targetRowIndex];
              // Find element in target row closest to our horizontal anchor
              const targetX = containerRect.left + horizontalAnchorRef.current * containerRect.width;
              const closest = findClosestElementByX(targetRow, targetX);
              if (closest) {
                nextIndex = focusable.indexOf(closest.element);
                handled = true;
              }
            } else if (wrapFocus) {
              // Wrap to first/last row
              const targetRow = isDown ? rows[0] : rows[rows.length - 1];
              const targetX = containerRect.left + horizontalAnchorRef.current * containerRect.width;
              const closest = findClosestElementByX(targetRow, targetX);
              if (closest) {
                nextIndex = focusable.indexOf(closest.element);
                handled = true;
              }
            }
            // Don't update anchors - maintain horizontal center of gravity
          }
          break;
        }

        case 'Home':
          nextIndex = 0;
          handled = true;
          shouldUpdateAnchors = true;
          break;

        case 'End':
          nextIndex = total - 1;
          handled = true;
          shouldUpdateAnchors = true;
          break;

        case 'PageDown':
        case 'PageUp': {
          const isPageDown = event.key === 'PageDown';
          const pageJump = 5;

          if (columns !== undefined) {
            // Use column-based navigation
            const delta = columns * pageJump;
            nextIndex = isPageDown
              ? Math.min(currentIndex + delta, total - 1)
              : Math.max(currentIndex - delta, 0);
            handled = true;
          } else if (layout === 'masonry') {
            // Masonry: jump within current column
            if (currentCol) {
              const targetIndexInCol = Math.max(
                0,
                Math.min(currentCol.length - 1, indexInCol + (isPageDown ? pageJump : -pageJump))
              );
              nextIndex = focusable.indexOf(currentCol[targetIndexInCol]);
              handled = true;
            }
          } else {
            // Wrap: jump between rows using anchor
            const targetRowIndex = Math.max(
              0,
              Math.min(rows.length - 1, currentRowIndex + (isPageDown ? pageJump : -pageJump))
            );
            const targetRow = rows[targetRowIndex];
            const targetX = containerRect.left + horizontalAnchorRef.current * containerRect.width;
            const closest = findClosestElementByX(targetRow, targetX);
            if (closest) {
              nextIndex = focusable.indexOf(closest.element);
              handled = true;
            }
          }
          break;
        }

        default:
          break;
      }

      if (handled && nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < total) {
        event.preventDefault();
        event.stopPropagation();

        // Set flag to skip anchor update in focusin handler if we shouldn't update anchors
        if (!shouldUpdateAnchors) {
          skipNextAnchorUpdateRef.current = true;
        }

        focusElement(nextIndex, focusable);

        // Update anchors if needed
        if (shouldUpdateAnchors) {
          const newElement = focusable[nextIndex];
          horizontalAnchorRef.current = getHorizontalAnchor(newElement, containerRect);
          verticalAnchorRef.current = getVerticalAnchor(newElement, containerRect);
        }
      }

      onKeyDown?.(event);
    },
    [disabled, wrapFocus, columns, layout, getFocusableElements, getEffectiveDir, focusElement, onKeyDown]
  );

  // Set up tab index management
  useEffect(() => {
    if (disabled || !containerRef.current) return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) return;

    // Find which element currently has tabindex="0"
    const currentTabIndexZero = focusable.find((el) => el.getAttribute('tabindex') === '0');
    const currentFocusId = currentTabIndexZero?.getAttribute('data-focus-id') ?? null;

    // Determine if we need to reset focus:
    // 1. No element has tabindex="0" (initial mount or element was removed)
    // 2. Element with tabindex="0" has different data-focus-id than what we tracked
    //    (content changed due to React reusing DOM elements)
    const needsReset =
      !currentTabIndexZero ||
      (focusedIdRef.current !== null && currentFocusId !== focusedIdRef.current);

    if (needsReset) {
      // Determine which element should get tabindex="0"
      let targetIndex = 0;

      if (!isInitializedRef.current) {
        // Initial mount - use defaultFocus prop
        if (defaultFocus === 'last') {
          targetIndex = focusable.length - 1;
        } else if (typeof defaultFocus === 'number') {
          targetIndex = Math.max(0, Math.min(defaultFocus, focusable.length - 1));
        }
        isInitializedRef.current = true;
      } else if (focusedIdRef.current !== null) {
        // Content changed - try to find element with the same data-focus-id
        const sameIdIndex = focusable.findIndex(
          (el) => el.getAttribute('data-focus-id') === focusedIdRef.current
        );
        if (sameIdIndex !== -1) {
          // Found the same item at a different position
          targetIndex = sameIdIndex;
        } else {
          // Item no longer exists - reset to first
          targetIndex = 0;
        }
      }

      // Set up roving tabindex
      focusable.forEach((el, index) => {
        el.setAttribute('tabindex', index === targetIndex ? '0' : '-1');
      });
      focusedIndexRef.current = targetIndex;
      focusedIdRef.current = focusable[targetIndex]?.getAttribute('data-focus-id') ?? null;

      // Initialize/update anchors
      if (containerRef.current) {
        updateAnchors(focusable[targetIndex]);
      }
    }
  }, [disabled, defaultFocus, getFocusableElements, updateAnchors, children]);

  // Update roving tabindex when focus changes within the zone
  useEffect(() => {
    if (disabled || !containerRef.current) return;

    const container = containerRef.current;

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      const focusable = getFocusableElements();
      const index = focusable.indexOf(target);

      if (index !== -1) {
        // Update roving tabindex
        focusable.forEach((el, i) => {
          el.setAttribute('tabindex', i === index ? '0' : '-1');
        });
        focusedIndexRef.current = index;
        // Track the data-focus-id of the focused element
        focusedIdRef.current = target.getAttribute('data-focus-id');

        // Update anchors when focus changes via click/tab (sets new center of gravity)
        // Skip if this focus change came from keyboard navigation that should maintain anchor
        if (skipNextAnchorUpdateRef.current) {
          skipNextAnchorUpdateRef.current = false;
        } else {
          updateAnchors(target);
        }
      }
    };

    container.addEventListener('focusin', handleFocusIn);
    return () => container.removeEventListener('focusin', handleFocusIn);
  }, [disabled, getFocusableElements, updateAnchors]);

  return (
    <div ref={containerRef} className={className} onKeyDown={handleKeyDown} {...props}>
      {children}
    </div>
  );
}

BidirectionalFocusZone.displayName = 'BidirectionalFocusZone';
