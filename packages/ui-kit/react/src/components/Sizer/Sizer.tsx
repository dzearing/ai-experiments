import { useRef, useCallback, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import styles from './Sizer.module.css';

/**
 * Sizer component - drag handle for resizing adjacent elements
 *
 * Surfaces used:
 * - controlSubtle (grip indicator)
 *
 * Tokens used:
 * - --controlSubtle-bg, --controlSubtle-bg-hover
 * - --duration-fast (hover transition)
 */

export type SizerOrientation = 'horizontal' | 'vertical';

export interface SizerProps {
  /** Orientation of the sizer (horizontal = side-by-side panels, vertical = stacked panels) */
  orientation?: SizerOrientation;
  /** Callback when dragging - receives delta in pixels */
  onResize?: (delta: number) => void;
  /** Callback when drag starts */
  onResizeStart?: () => void;
  /** Callback when drag ends */
  onResizeEnd?: () => void;
  /** Callback when double-clicked (typically to collapse/expand) */
  onDoubleClick?: () => void;
  /** Whether the sizer is disabled */
  disabled?: boolean;
  /** Minimum position constraint (in pixels from start) */
  min?: number;
  /** Maximum position constraint (in pixels from start) */
  max?: number;
  /** Size of the sizer handle in pixels (default: 8) */
  size?: number;
  /** Whether to show the grip indicator (default: true) */
  showGrip?: boolean;
  /** Additional class name */
  className?: string;
}

export function Sizer({
  orientation = 'horizontal',
  onResize,
  onResizeStart,
  onResizeEnd,
  onDoubleClick,
  disabled = false,
  size = 8,
  showGrip = true,
  className,
}: SizerProps) {
  const sizerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (disabled) return;

      e.preventDefault();
      isDraggingRef.current = true;
      startPosRef.current = orientation === 'horizontal' ? e.clientX : e.clientY;

      onResizeStart?.();

      // Add dragging class to body
      document.body.classList.add('resizing');
      document.body.style.cursor = orientation === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [disabled, orientation, onResizeStart]
  );

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!isDraggingRef.current) return;

      const currentPos = orientation === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;

      if (delta !== 0) {
        onResize?.(delta);
        startPosRef.current = currentPos;
      }
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;

      isDraggingRef.current = false;
      document.body.classList.remove('resizing');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      onResizeEnd?.();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [orientation, onResize, onResizeEnd]);

  // Keyboard support
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      const step = e.shiftKey ? 50 : 10;
      let delta = 0;

      if (orientation === 'horizontal') {
        if (e.key === 'ArrowLeft') delta = -step;
        else if (e.key === 'ArrowRight') delta = step;
      } else {
        if (e.key === 'ArrowUp') delta = -step;
        else if (e.key === 'ArrowDown') delta = step;
      }

      if (delta !== 0) {
        e.preventDefault();
        onResize?.(delta);
      }
    },
    [disabled, orientation, onResize]
  );

  const classNames = [
    styles.sizer,
    styles[orientation],
    disabled && styles.disabled,
    showGrip && styles.withGrip,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const style = {
    [orientation === 'horizontal' ? 'width' : 'height']: `${size}px`,
  };

  return (
    <div
      ref={sizerRef}
      className={classNames}
      style={style}
      role="separator"
      aria-orientation={orientation}
      aria-valuenow={undefined}
      tabIndex={disabled ? -1 : 0}
      onMouseDown={handleMouseDown}
      onDoubleClick={disabled ? undefined : onDoubleClick}
      onKeyDown={handleKeyDown}
    >
      {showGrip && <div className={styles.grip} />}
    </div>
  );
}
