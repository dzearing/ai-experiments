import { useState, useEffect, useCallback, useMemo, type HTMLAttributes } from 'react';
import { Tooltip } from '../Tooltip';
import {
  formatRelativeTime,
  formatDuration,
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
 * - Duration mode for showing elapsed time counters
 *
 * @example
 * // Basic usage - relative time ("5 min ago")
 * <RelativeTime timestamp={message.createdAt} />
 *
 * // Duration mode - elapsed counter ("2m 30s")
 * <RelativeTime timestamp={startTime} mode="duration" />
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
export type RelativeTimeMode = 'relative' | 'duration';

export interface RelativeTimeProps
  extends Omit<HTMLAttributes<HTMLTimeElement>, 'children'> {
  /** Timestamp to display (Date object, Unix timestamp in ms, or ISO string) */
  timestamp: Date | number | string;

  /** HTML element to render */
  as?: 'time' | 'span';

  /** Display mode: 'relative' shows "5 min ago", 'duration' shows "2m 30s" */
  mode?: RelativeTimeMode;

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

// Singleton timer for efficient updates across all instances (10 second tick for relative mode)
let tickCallbacks = new Set<() => void>();
let tickIntervalId: number | null = null;
const TICK_INTERVAL = 10000; // Base tick every 10 seconds

// Fast tick for duration mode (1 second tick)
let fastTickCallbacks = new Set<() => void>();
let fastTickIntervalId: number | null = null;
const FAST_TICK_INTERVAL = 1000; // Fast tick every 1 second

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

function startFastTicking() {
  if (fastTickIntervalId !== null) return;

  fastTickIntervalId = window.setInterval(() => {
    fastTickCallbacks.forEach((callback) => callback());
  }, FAST_TICK_INTERVAL);
}

function stopFastTicking() {
  if (fastTickIntervalId === null) return;

  window.clearInterval(fastTickIntervalId);
  fastTickIntervalId = null;
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

function subscribeFastTick(callback: () => void): () => void {
  fastTickCallbacks.add(callback);

  if (fastTickCallbacks.size === 1) {
    startFastTicking();
  }

  return () => {
    fastTickCallbacks.delete(callback);

    if (fastTickCallbacks.size === 0) {
      stopFastTicking();
    }
  };
}

export function RelativeTime({
  timestamp,
  as: Component = 'time',
  mode = 'relative',
  format = 'short',
  static: isStatic = false,
  showTooltip = true,
  tooltipFormat,
  size = 'base',
  color = 'default',
  className,
  ...props
}: RelativeTimeProps) {
  const isDurationMode = mode === 'duration';

  // Normalize timestamp to Date - memoize to prevent infinite re-renders
  const date = useMemo(() => {
    if (timestamp instanceof Date) return timestamp;

    return typeof timestamp === 'number'
      ? new Date(timestamp)
      : new Date(timestamp);
  }, [timestamp instanceof Date ? timestamp.getTime() : timestamp]);

  // Get the appropriate formatter based on mode
  const formatTime = useCallback(
    () => isDurationMode ? formatDuration(date, { format }) : formatRelativeTime(date, { format }),
    [date, format, isDurationMode]
  );

  // State for the formatted string
  const [formattedTime, setFormattedTime] = useState(formatTime);

  // Track when we should update based on timestamp age (only for relative mode)
  const [nextUpdateAt, setNextUpdateAt] = useState(() =>
    Date.now() + getUpdateInterval(date)
  );

  // Update function for relative mode
  const updateRelative = useCallback(() => {
    const now = Date.now();

    // Only update if enough time has passed
    if (now >= nextUpdateAt) {
      setFormattedTime(formatRelativeTime(date, { format }));
      setNextUpdateAt(now + getUpdateInterval(date));
    }
  }, [date, format, nextUpdateAt]);

  // Update function for duration mode (always update on each tick)
  const updateDuration = useCallback(() => {
    setFormattedTime(formatDuration(date, { format }));
  }, [date, format]);

  // Subscribe to ticks for auto-update
  useEffect(() => {
    if (isStatic) return;

    // Duration mode uses fast tick (1 second), relative mode uses normal tick
    if (isDurationMode) {
      return subscribeFastTick(updateDuration);
    }

    return subscribeTick(updateRelative);
  }, [isStatic, isDurationMode, updateRelative, updateDuration]);

  // Update when timestamp, format, or mode changes
  useEffect(() => {
    setFormattedTime(formatTime());
    if (!isDurationMode) {
      setNextUpdateAt(Date.now() + getUpdateInterval(date));
    }
  }, [date, format, isDurationMode, formatTime]);

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
