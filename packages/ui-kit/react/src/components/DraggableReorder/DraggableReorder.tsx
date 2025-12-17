import { useRef, useState, useEffect, useCallback, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { GripperIcon } from '@ui-kit/icons';
import styles from './DraggableReorder.module.css';

/**
 * DraggableReorder - A reusable component for drag-and-drop list reordering
 *
 * Features:
 * - Smooth CSS transform animations
 * - GripperIcon drag handle
 * - Keyboard accessibility
 * - Reduced motion support
 */

export interface DraggableReorderProps<T> {
  /** Array of items to render */
  items: T[];
  /** Called when items are reordered */
  onReorder: (items: T[]) => void;
  /** Render function for each item content (excluding drag handle) */
  renderItem: (item: T, index: number) => ReactNode;
  /** Extract unique key for each item */
  keyExtractor: (item: T, index: number) => string;
  /** Disable all dragging */
  disabled?: boolean;
  /** Additional class name for container */
  className?: string;
  /** Gap between items in pixels */
  gap?: number;
}

interface DragState {
  isDragging: boolean;
  dragIndex: number;
  startY: number;
  currentY: number;
  itemHeights: number[];
  targetIndex: number;
}

export function DraggableReorder<T>({
  items,
  onReorder,
  renderItem,
  keyExtractor,
  disabled = false,
  className,
  gap = 4,
}: DraggableReorderProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    dragIndex: -1,
    startY: 0,
    currentY: 0,
    itemHeights: [],
    targetIndex: -1,
  });

  const [dragIndex, setDragIndex] = useState<number>(-1);
  const [targetIndex, setTargetIndex] = useState<number>(-1);
  const [dragOffset, setDragOffset] = useState<number>(0);

  // Keyboard drag state
  const [keyboardDragIndex, setKeyboardDragIndex] = useState<number>(-1);

  // Calculate item heights and positions
  const getItemHeights = useCallback(() => {
    return itemRefs.current.map(ref => ref?.offsetHeight || 0);
  }, []);

  // Calculate which index the dragged item should drop at
  const calculateTargetIndex = useCallback((currentDragIndex: number, deltaY: number, heights: number[]) => {
    if (heights.length === 0) return currentDragIndex;

    // Calculate cumulative positions
    let accumulated = 0;
    const positions: number[] = [];
    for (let i = 0; i < heights.length; i++) {
      positions.push(accumulated);
      accumulated += heights[i] + gap;
    }

    // Current drag position
    const draggedItemCenter = positions[currentDragIndex] + heights[currentDragIndex] / 2 + deltaY;

    // Find target index based on center position
    let newIndex = currentDragIndex;
    for (let i = 0; i < heights.length; i++) {
      const itemCenter = positions[i] + heights[i] / 2;
      if (deltaY < 0 && i < currentDragIndex) {
        // Moving up
        if (draggedItemCenter < itemCenter) {
          newIndex = i;
          break;
        }
      } else if (deltaY > 0 && i > currentDragIndex) {
        // Moving down
        if (draggedItemCenter > itemCenter) {
          newIndex = i;
        }
      }
    }

    return newIndex;
  }, [gap]);

  // Handle pointer down on drag handle
  const handlePointerDown = useCallback((e: ReactPointerEvent, index: number) => {
    if (disabled) return;

    e.preventDefault();
    e.stopPropagation();

    const heights = getItemHeights();
    dragStateRef.current = {
      isDragging: true,
      dragIndex: index,
      startY: e.clientY,
      currentY: e.clientY,
      itemHeights: heights,
      targetIndex: index,
    };

    setDragIndex(index);
    setTargetIndex(index);
    setDragOffset(0);

    // Set grabbing cursor on body
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, [disabled, getItemHeights]);

  // Handle pointer move (attached to document)
  useEffect(() => {
    const handlePointerMove = (e: globalThis.PointerEvent) => {
      if (!dragStateRef.current.isDragging) return;

      const { startY, dragIndex: currentDragIndex, itemHeights } = dragStateRef.current;
      const deltaY = e.clientY - startY;
      const newTargetIndex = calculateTargetIndex(currentDragIndex, deltaY, itemHeights);

      dragStateRef.current.currentY = e.clientY;
      dragStateRef.current.targetIndex = newTargetIndex;

      setDragOffset(deltaY);
      setTargetIndex(newTargetIndex);
    };

    const handlePointerUp = () => {
      if (!dragStateRef.current.isDragging) return;

      const { dragIndex: fromIndex, targetIndex: toIndex } = dragStateRef.current;

      // Reset drag state
      dragStateRef.current.isDragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      // Commit reorder if position changed
      if (fromIndex !== toIndex && fromIndex >= 0 && toIndex >= 0) {
        const newItems = [...items];
        const [movedItem] = newItems.splice(fromIndex, 1);
        newItems.splice(toIndex, 0, movedItem);
        onReorder(newItems);
      }

      setDragIndex(-1);
      setTargetIndex(-1);
      setDragOffset(0);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [items, onReorder, calculateTargetIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (disabled) return;

    // Start keyboard drag with Space or Enter
    if ((e.key === ' ' || e.key === 'Enter') && keyboardDragIndex === -1) {
      e.preventDefault();
      setKeyboardDragIndex(index);
      return;
    }

    // While in keyboard drag mode
    if (keyboardDragIndex >= 0) {
      if (e.key === 'ArrowUp' && keyboardDragIndex > 0) {
        e.preventDefault();
        const newItems = [...items];
        const [movedItem] = newItems.splice(keyboardDragIndex, 1);
        newItems.splice(keyboardDragIndex - 1, 0, movedItem);
        onReorder(newItems);
        setKeyboardDragIndex(keyboardDragIndex - 1);
      } else if (e.key === 'ArrowDown' && keyboardDragIndex < items.length - 1) {
        e.preventDefault();
        const newItems = [...items];
        const [movedItem] = newItems.splice(keyboardDragIndex, 1);
        newItems.splice(keyboardDragIndex + 1, 0, movedItem);
        onReorder(newItems);
        setKeyboardDragIndex(keyboardDragIndex + 1);
      } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        setKeyboardDragIndex(-1);
      }
    }
  }, [disabled, items, onReorder, keyboardDragIndex]);

  // Calculate transform for each item
  const getItemStyle = (index: number): React.CSSProperties => {
    if (dragIndex === -1) return {};

    const heights = dragStateRef.current.itemHeights;
    if (heights.length === 0) return {};

    // Dragged item follows cursor
    if (index === dragIndex) {
      return {
        transform: `translateY(${dragOffset}px)`,
        zIndex: 10,
      };
    }

    // Items between old and new position shift
    if (targetIndex > dragIndex) {
      // Dragging down: items between shift up
      if (index > dragIndex && index <= targetIndex) {
        return {
          transform: `translateY(-${heights[dragIndex] + gap}px)`,
        };
      }
    } else if (targetIndex < dragIndex) {
      // Dragging up: items between shift down
      if (index < dragIndex && index >= targetIndex) {
        return {
          transform: `translateY(${heights[dragIndex] + gap}px)`,
        };
      }
    }

    return {};
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className || ''}`}
      role="listbox"
      aria-label="Reorderable list"
      style={{ gap }}
    >
      {items.map((item, index) => {
        const isDragging = index === dragIndex;
        const isKeyboardDragging = index === keyboardDragIndex;
        const key = keyExtractor(item, index);

        return (
          <div
            key={key}
            ref={el => { itemRefs.current[index] = el; }}
            className={`${styles.item} ${isDragging ? styles.dragging : ''} ${isKeyboardDragging ? styles.keyboardDragging : ''}`}
            style={getItemStyle(index)}
            role="option"
            aria-selected={isDragging || isKeyboardDragging}
            aria-grabbed={isDragging || isKeyboardDragging}
          >
            <div
              className={`${styles.dragHandle} ${disabled ? styles.disabled : ''}`}
              onPointerDown={(e) => handlePointerDown(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              tabIndex={disabled ? -1 : 0}
              role="button"
              aria-label={`Drag to reorder item ${index + 1}`}
              aria-describedby={isKeyboardDragging ? 'drag-instructions' : undefined}
            >
              <GripperIcon />
            </div>
            <div className={styles.content}>
              {renderItem(item, index)}
            </div>
          </div>
        );
      })}
      {keyboardDragIndex >= 0 && (
        <div id="drag-instructions" className={styles.srOnly}>
          Use arrow keys to move, Space or Enter to drop, Escape to cancel
        </div>
      )}
    </div>
  );
}

DraggableReorder.displayName = 'DraggableReorder';
