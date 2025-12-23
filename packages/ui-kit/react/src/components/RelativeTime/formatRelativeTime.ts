/**
 * Format relative time utility
 *
 * Converts timestamps to human-readable relative time strings.
 */

export type RelativeTimeFormat = 'narrow' | 'short' | 'long';

interface FormatOptions {
  /** Format style */
  format?: RelativeTimeFormat;
  /** Reference time for calculating relative time (default: now) */
  now?: Date | number;
}

/**
 * Format a timestamp as a relative time string.
 *
 * @param timestamp - Date object, Unix timestamp (ms), or ISO string
 * @param options - Formatting options
 * @returns Human-readable relative time string
 *
 * @example
 * formatRelativeTime(Date.now() - 30000) // "just now"
 * formatRelativeTime(Date.now() - 300000) // "5 minutes ago"
 * formatRelativeTime(Date.now() - 7200000) // "2 hours ago"
 */
export function formatRelativeTime(
  timestamp: Date | number | string,
  options: FormatOptions = {}
): string {
  const { format = 'short', now = Date.now() } = options;

  const date = normalizeDate(timestamp);
  const nowMs = typeof now === 'number' ? now : now.getTime();
  const diff = nowMs - date.getTime();

  // Handle future dates
  if (diff < 0) {
    return formatFuture(-diff, format);
  }

  return formatPast(diff, format);
}

/**
 * Normalize various timestamp formats to a Date object.
 */
function normalizeDate(timestamp: Date | number | string): Date {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  return new Date(timestamp);
}

/**
 * Format past time differences.
 */
function formatPast(diffMs: number, format: RelativeTimeFormat): string {
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  // Just now (< 1 minute)
  if (seconds < 60) {
    return format === 'narrow' ? 'now' : 'just now';
  }

  // Minutes (< 1 hour)
  if (minutes < 60) {
    return formatUnit(minutes, 'minute', format, 'ago');
  }

  // Hours (< 1 day)
  if (hours < 24) {
    return formatUnit(hours, 'hour', format, 'ago');
  }

  // Yesterday
  if (days === 1) {
    return 'yesterday';
  }

  // Days (< 1 week)
  if (days < 7) {
    return formatUnit(days, 'day', format, 'ago');
  }

  // Weeks (< 1 month)
  if (weeks < 4) {
    return formatUnit(weeks, 'week', format, 'ago');
  }

  // Months (< 1 year)
  if (months < 12) {
    return formatUnit(months, 'month', format, 'ago');
  }

  // Years
  return formatUnit(years, 'year', format, 'ago');
}

/**
 * Format future time differences.
 */
function formatFuture(diffMs: number, format: RelativeTimeFormat): string {
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  // Very soon (< 1 minute)
  if (seconds < 60) {
    return format === 'narrow' ? 'soon' : 'in a moment';
  }

  // Minutes
  if (minutes < 60) {
    return formatUnit(minutes, 'minute', format, 'in');
  }

  // Hours
  if (hours < 24) {
    return formatUnit(hours, 'hour', format, 'in');
  }

  // Tomorrow
  if (days === 1) {
    return 'tomorrow';
  }

  // Days
  if (days < 7) {
    return formatUnit(days, 'day', format, 'in');
  }

  // Weeks
  if (weeks < 4) {
    return formatUnit(weeks, 'week', format, 'in');
  }

  // Months
  if (months < 12) {
    return formatUnit(months, 'month', format, 'in');
  }

  // Years
  return formatUnit(years, 'year', format, 'in');
}

/**
 * Format a time unit with the appropriate suffix/prefix.
 */
function formatUnit(
  value: number,
  unit: string,
  format: RelativeTimeFormat,
  direction: 'ago' | 'in'
): string {
  const unitAbbreviations: Record<string, string> = {
    minute: 'm',
    hour: 'h',
    day: 'd',
    week: 'w',
    month: 'mo',
    year: 'y',
  };

  const unitShort: Record<string, string> = {
    minute: 'min',
    hour: 'hr',
    day: 'day',
    week: 'wk',
    month: 'mo',
    year: 'yr',
  };

  const plural = value !== 1 ? 's' : '';

  if (format === 'narrow') {
    const abbr = unitAbbreviations[unit] || unit[0];
    return direction === 'ago' ? `${value}${abbr}` : `${value}${abbr}`;
  }

  if (format === 'short') {
    const short = unitShort[unit] || unit;
    return direction === 'ago'
      ? `${value} ${short}${plural} ago`
      : `in ${value} ${short}${plural}`;
  }

  // Long format
  return direction === 'ago'
    ? `${value} ${unit}${plural} ago`
    : `in ${value} ${unit}${plural}`;
}

/**
 * Get the recommended update interval based on timestamp age.
 *
 * @param timestamp - The timestamp to check
 * @returns Recommended update interval in milliseconds
 */
export function getUpdateInterval(timestamp: Date | number | string): number {
  const date = normalizeDate(timestamp);
  const diff = Date.now() - date.getTime();

  // Under 1 minute: update every 10 seconds
  if (diff < 60 * 1000) {
    return 10 * 1000;
  }

  // Under 1 hour: update every minute
  if (diff < 60 * 60 * 1000) {
    return 60 * 1000;
  }

  // Under 1 day: update every 5 minutes
  if (diff < 24 * 60 * 60 * 1000) {
    return 5 * 60 * 1000;
  }

  // Older: update every hour
  return 60 * 60 * 1000;
}

/**
 * Format a date as a full locale string for tooltips.
 */
export function formatFullDate(timestamp: Date | number | string): string {
  const date = normalizeDate(timestamp);
  return date.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
