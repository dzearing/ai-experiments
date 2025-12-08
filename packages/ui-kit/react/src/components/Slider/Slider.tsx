import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './Slider.module.css';

/**
 * Slider component
 *
 * Surfaces used:
 * - inset (track)
 * - controlPrimary (fill and thumb)
 *
 * Tokens used:
 * - --inset-bg
 * - --controlPrimary-bg
 * - --focus-ring
 */

export type SliderSize = 'sm' | 'md' | 'lg';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Slider size */
  size?: SliderSize;
  /** Full width slider */
  fullWidth?: boolean;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ size = 'md', fullWidth = false, className, ...props }, ref) => {
    const classNames = [
      styles.slider,
      styles[size],
      fullWidth && styles.fullWidth,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <input
        ref={ref}
        type="range"
        className={classNames}
        {...props}
      />
    );
  }
);

Slider.displayName = 'Slider';
