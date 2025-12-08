import { useState, useRef, type ReactNode } from 'react';
import styles from './Tooltip.module.css';

/**
 * Tooltip component - hover hint for elements
 *
 * Surfaces used:
 * - tooltip
 *
 * Tokens used:
 * - --tooltip-bg
 * - --tooltip-text
 * - --radius-sm
 * - --shadow-sm
 */

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** Tooltip content */
  content: ReactNode;
  /** Position relative to trigger */
  position?: TooltipPosition;
  /** Delay before showing (ms) */
  delay?: number;
  /** The element that triggers the tooltip */
  children: ReactNode;
}

export function Tooltip({
  content,
  position = 'top',
  delay = 200,
  children,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  const showTooltip = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div className={`${styles.tooltip} ${styles[position]}`} role="tooltip">
          {content}
          <span className={styles.arrow} />
        </div>
      )}
    </div>
  );
}
