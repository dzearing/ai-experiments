import { useState, useEffect, useCallback, type HTMLAttributes } from 'react';
import { Tooltip } from '../Tooltip';
import {
  formatRelativeTime,
  formatFullDate,
  getUpdateInterval,
  type RelativeTimeFormat,
} from './formatRelativeTime';
import styles from './RelativeTime.module.css';

/**
 * RelativeTime component - displays timestamps as human-readable relative time
 *
 * Features:
 * - Auto-updates as time passes
 * - Smart update intervals based on timestamp age
 * - Tooltip with full date on hover
 * - Semantic `<time>` element with datetime attribute
 *
 * @example
 * // Basic usage
 * <RelativeTime timestamp={message.createdAt} />
 *
 * // With format options
 * <RelativeTime timestamp={date} format="long" />
 *
 * // Static (no auto-update)
 * <RelativeTime timestamp={date} static />
 */

export type { RelativeTimeFormat } from './formatRelativeTime';

export type RelativeTimeSize = 'xs' | 'sm' | 'base' | 'lg';
export type RelativeTimeColor = 'default' | 'soft' | 'inherit';

export interface RelativeTimeProps
  extends Omit<HTMLAttributes<HTMLTimeElement>, 'children'> {
  /** Timestamp to display (Date object, Unix timestamp in ms, or ISO string) */
  timestamp: Date | number | string;

  /** HTML element to render */
  as?: 'time' | 'span';

  /** Format style: 'narrow' ("5m"), 'short' ("5 min ago"), 'long' ("5 minutes ago") */
  format?: RelativeTimeFormat;

  /** Disable auto-updates (useful for static content) */
  static?: boolean;

  /** Show tooltip with full timestamp on hover */
  showTooltip?: boolean;

  /** Custom tooltip content formatter */
  tooltipFormat?: (date: Date) => string;

  /** Text size */
  size?: RelativeTimeSize;

  /** Text color */
  color?: RelativeTimeColor;
}

// Singleton timer for efficient updates across all instances
let tickCallbacks = new Set<() => void>();
let tickIntervalId: number | null = null;
const TICK_INTERVAL = 10000; // Base tick every 10 seconds

function startTicking() {
  if (tickIntervalId !== null) return;

  tickIntervalId = window.setInterval(() => {
    tickCallbacks.forEach((callback) => callback());
  }, TICK_INTERVAL);
}

function stopTicking() {
  if (tickIntervalId === null) return;

  window.clearInterval(tickIntervalId);
  tickIntervalId = null;
}

function subscribeTick(callback: () => void): () => void {
  tickCallbacks.add(callback);

  if (tickCallbacks.size === 1) {
    startTicking();
  }

  return () => {
    tickCallbacks.delete(callback);

    if (tickCallbacks.size === 0) {
      stopTicking();
    }
  };
}

export function RelativeTime({
  timestamp,
  as: Component = 'time',
  format = 'short',
  static: isStatic = false,
  showTooltip = true,
  tooltipFormat,
  size = 'base',
  color = 'default',
  className,
  ...props
}: RelativeTimeProps) {
  // Normalize timestamp to Date
  const date =
    timestamp instanceof Date
      ? timestamp
      : typeof timestamp === 'number'
        ? new Date(timestamp)
        : new Date(timestamp);

  // State for the formatted string
  const [formattedTime, setFormattedTime] = useState(() =>
    formatRelativeTime(date, { format })
  );

  // Track when we should update based on timestamp age
  const [nextUpdateAt, setNextUpdateAt] = useState(() =>
    Date.now() + getUpdateInterval(date)
  );

  // Update function
  const update = useCallback(() => {
    const now = Date.now();

    // Only update if enough time has passed
    if (now >= nextUpdateAt) {
      setFormattedTime(formatRelativeTime(date, { format }));
      setNextUpdateAt(now + getUpdateInterval(date));
    }
  }, [date, format, nextUpdateAt]);

  // Subscribe to ticks for auto-update
  useEffect(() => {
    if (isStatic) return;

    return subscribeTick(update);
  }, [isStatic, update]);

  // Update when timestamp or format changes
  useEffect(() => {
    setFormattedTime(formatRelativeTime(date, { format }));
    setNextUpdateAt(Date.now() + getUpdateInterval(date));
  }, [date, format]);

  // Build class names
  const classNames = [
    styles.relativeTime,
    styles[`size-${size}`],
    styles[color],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Tooltip content
  const tooltipContent = tooltipFormat
    ? tooltipFormat(date)
    : formatFullDate(date);

  // ISO string for datetime attribute
  const isoString = date.toISOString();

  // The time element
  const timeElement = (
    <Component
      className={classNames}
      {...(Component === 'time' ? { dateTime: isoString } : {})}
      {...props}
    >
      {formattedTime}
    </Component>
  );

  // Wrap with tooltip if enabled
  if (showTooltip) {
    return (
      <Tooltip content={tooltipContent} position="top" delay={300}>
        {timeElement}
      </Tooltip>
    );
  }

  return timeElement;
}

RelativeTime.displayName = 'RelativeTime';
