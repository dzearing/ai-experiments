import { useRef, useState, useEffect, type ReactNode, type CSSProperties } from 'react';
import styles from './Animation.module.css';

/**
 * Collapse component - animates height for expand/collapse effects
 *
 * Surfaces used: None (wrapper component)
 *
 * Tokens used:
 * - --duration-normal (default duration)
 * - --ease-default (default easing)
 */

export interface CollapseProps {
  /** Whether the content is expanded */
  isOpen: boolean;
  /** Content to show/hide */
  children: ReactNode;
  /** Animation duration in ms (default: 200) */
  duration?: number;
  /** Custom easing function */
  easing?: string;
  /** Callback when expand animation completes */
  onExpandComplete?: () => void;
  /** Callback when collapse animation completes */
  onCollapseComplete?: () => void;
  /** Additional class name */
  className?: string;
  /** Whether to unmount children when collapsed (default: false) */
  unmountOnCollapse?: boolean;
}

export function Collapse({
  isOpen,
  children,
  duration = 200,
  easing,
  onExpandComplete,
  onCollapseComplete,
  className,
  unmountOnCollapse = false,
}: CollapseProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(isOpen ? 'auto' : 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const prevOpenRef = useRef(isOpen);
  const animationFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen === prevOpenRef.current) return;
    prevOpenRef.current = isOpen;

    // Clear any existing animation
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const contentEl = contentRef.current;
    if (!contentEl) return;

    if (isOpen) {
      // Expanding
      setShouldRender(true);
      setIsAnimating(true);

      // Get the full height
      const fullHeight = contentEl.scrollHeight;

      // Start from 0
      setHeight(0);

      // Force a reflow, then animate to full height
      animationFrameRef.current = requestAnimationFrame(() => {
        animationFrameRef.current = requestAnimationFrame(() => {
          setHeight(fullHeight);

          // After animation, set to auto for responsive behavior
          timeoutRef.current = setTimeout(() => {
            setHeight('auto');
            setIsAnimating(false);
            onExpandComplete?.();
          }, duration);
        });
      });
    } else {
      // Collapsing
      setIsAnimating(true);

      // Set explicit height first (from auto to px)
      const currentHeight = contentEl.scrollHeight;
      setHeight(currentHeight);

      // Force a reflow, then animate to 0
      animationFrameRef.current = requestAnimationFrame(() => {
        animationFrameRef.current = requestAnimationFrame(() => {
          setHeight(0);

          timeoutRef.current = setTimeout(() => {
            setIsAnimating(false);
            if (unmountOnCollapse) {
              setShouldRender(false);
            }
            onCollapseComplete?.();
          }, duration);
        });
      });
    }
  }, [isOpen, duration, unmountOnCollapse, onExpandComplete, onCollapseComplete]);

  // Don't render if collapsed and unmountOnCollapse is true
  if (!shouldRender && unmountOnCollapse) {
    return null;
  }

  const style: CSSProperties = {
    height: height === 'auto' ? 'auto' : `${height}px`,
    overflow: isAnimating || !isOpen ? 'hidden' : undefined,
    transition: isAnimating
      ? `height ${duration}ms ${easing || 'var(--ease-default)'}`
      : undefined,
  };

  return (
    <div
      className={`${styles.collapse} ${className || ''}`}
      style={style}
      aria-hidden={!isOpen}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
