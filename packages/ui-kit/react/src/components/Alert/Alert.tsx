import type { HTMLAttributes, ReactNode } from 'react';
import { surfaceClassName, type FeedbackSurface } from '@ui-kit/core';
import styles from './Alert.module.css';

/**
 * Alert component
 *
 * Surfaces used:
 * - success, warning, danger, info (feedback surfaces)
 *
 * Tokens used:
 * - --{surface}-bg, --{surface}-text, --{surface}-border
 * - --space-3, --space-4 (padding)
 * - --radius-md
 */

export type AlertVariant = FeedbackSurface;

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  /** Alert variant */
  variant?: AlertVariant;
  /** Alert content */
  children: ReactNode;
}

export function Alert({
  variant = 'info',
  className,
  children,
  ...props
}: AlertProps) {
  const classNames = [
    styles.alert,
    surfaceClassName(variant),
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} role="alert" {...props}>
      {children}
    </div>
  );
}
Alert.displayName = 'Alert';
