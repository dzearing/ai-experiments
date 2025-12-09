import { useState, useCallback, useRef, useEffect, type ReactNode, type CSSProperties } from 'react';
import { Sizer } from '../Sizer';
import styles from './SplitPane.module.css';

/**
 * SplitPane component - resizable panel layout
 *
 * Surfaces used:
 * - panel (panes)
 *
 * Tokens used:
 * - --panel-border
 * - --duration-normal (collapse animation)
 */

export type SplitPaneOrientation = 'horizontal' | 'vertical';

export interface SplitPaneProps {
  /** First pane content */
  first: ReactNode;
  /** Second pane content */
  second: ReactNode;
  /** Orientation (horizontal = side-by-side, vertical = stacked) */
  orientation?: SplitPaneOrientation;
  /** Default size of first pane (in pixels or percentage) */
  defaultSize?: number | string;
  /** Controlled size of first pane */
  size?: number | string;
  /** Callback when size changes */
  onSizeChange?: (size: number) => void;
  /** Minimum size of first pane in pixels */
  minSize?: number;
  /** Maximum size of first pane in pixels */
  maxSize?: number;
  /** Whether first pane can be collapsed */
  collapsible?: boolean;
  /** Whether first pane is collapsed */
  collapsed?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Callback when collapsed state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Size of the sizer handle */
  sizerSize?: number;
  /** Additional class name */
  className?: string;
  /** Style for the container */
  style?: CSSProperties;
}

export function SplitPane({
  first,
  second,
  orientation = 'horizontal',
  defaultSize = '50%',
  size: controlledSize,
  onSizeChange,
  minSize = 50,
  maxSize,
  collapsible = false,
  collapsed: controlledCollapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  sizerSize = 8,
  className,
  style,
}: SplitPaneProps) {
  // Parse initial size
  const parseSize = (value: number | string): number => {
    if (typeof value === 'number') return value;
    if (value.endsWith('%')) {
      // Can't know container size yet, use a reasonable default
      return 200;
    }
    return parseInt(value, 10) || 200;
  };

  const [internalSize, setInternalSize] = useState<number>(parseSize(defaultSize));
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const [sizeBeforeCollapse, setSizeBeforeCollapse] = useState<number>(parseSize(defaultSize));

  const containerRef = useRef<HTMLDivElement>(null);

  const isSizeControlled = controlledSize !== undefined;
  const isCollapsedControlled = controlledCollapsed !== undefined;

  const currentSize = isSizeControlled ? parseSize(controlledSize) : internalSize;
  const isCollapsed = isCollapsedControlled ? controlledCollapsed : internalCollapsed;

  // Initialize size based on percentage
  useEffect(() => {
    if (typeof defaultSize === 'string' && defaultSize.endsWith('%') && containerRef.current) {
      const container = containerRef.current;
      const containerSize = orientation === 'horizontal'
        ? container.clientWidth
        : container.clientHeight;
      const percentage = parseInt(defaultSize, 10) / 100;
      const calculatedSize = Math.round(containerSize * percentage);
      setInternalSize(calculatedSize);
      setSizeBeforeCollapse(calculatedSize);
    }
  }, [defaultSize, orientation]);

  const handleResize = useCallback(
    (delta: number) => {
      if (isCollapsed) return;

      const container = containerRef.current;
      if (!container) return;

      const containerSize = orientation === 'horizontal'
        ? container.clientWidth
        : container.clientHeight;

      const effectiveMaxSize = maxSize ?? containerSize - minSize;

      const newSize = Math.max(minSize, Math.min(effectiveMaxSize, currentSize + delta));

      if (!isSizeControlled) {
        setInternalSize(newSize);
      }
      onSizeChange?.(newSize);
    },
    [isCollapsed, orientation, currentSize, minSize, maxSize, isSizeControlled, onSizeChange]
  );

  const handleDoubleClick = useCallback(() => {
    if (!collapsible) return;

    const newCollapsed = !isCollapsed;

    if (newCollapsed) {
      // Save size before collapsing
      setSizeBeforeCollapse(currentSize);
    }

    if (!isCollapsedControlled) {
      setInternalCollapsed(newCollapsed);
      if (!newCollapsed) {
        setInternalSize(sizeBeforeCollapse);
      }
    }
    onCollapsedChange?.(newCollapsed);
  }, [collapsible, isCollapsed, currentSize, sizeBeforeCollapse, isCollapsedControlled, onCollapsedChange]);

  const containerClassNames = [
    styles.container,
    styles[orientation],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const firstPaneStyle: CSSProperties = {
    [orientation === 'horizontal' ? 'width' : 'height']: isCollapsed ? 0 : `${currentSize}px`,
    flexShrink: 0,
    overflow: isCollapsed ? 'hidden' : undefined,
  };

  return (
    <div ref={containerRef} className={containerClassNames} style={style}>
      <div className={styles.pane} style={firstPaneStyle}>
        {first}
      </div>
      <Sizer
        orientation={orientation}
        onResize={handleResize}
        onDoubleClick={collapsible ? handleDoubleClick : undefined}
        size={sizerSize}
      />
      <div className={`${styles.pane} ${styles.flexible}`}>
        {second}
      </div>
    </div>
  );
}
