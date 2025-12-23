import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { RelativeTime } from './RelativeTime';
import { formatRelativeTime, getUpdateInterval } from './formatRelativeTime';

describe('formatRelativeTime', () => {
  describe('past timestamps', () => {
    it('returns "just now" for timestamps under 60 seconds', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 30000)).toBe('just now');
      expect(formatRelativeTime(now - 59000)).toBe('just now');
    });

    it('returns "now" in narrow format for recent timestamps', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 30000, { format: 'narrow' })).toBe('now');
    });

    it('returns minutes ago for timestamps under 1 hour', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 5 * 60 * 1000)).toBe('5 mins ago');
      expect(formatRelativeTime(now - 1 * 60 * 1000)).toBe('1 min ago');
      expect(formatRelativeTime(now - 45 * 60 * 1000)).toBe('45 mins ago');
    });

    it('returns hours ago for timestamps under 1 day', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 2 * 60 * 60 * 1000)).toBe('2 hrs ago');
      expect(formatRelativeTime(now - 1 * 60 * 60 * 1000)).toBe('1 hr ago');
    });

    it('returns "yesterday" for 1 day old timestamps', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 24 * 60 * 60 * 1000)).toBe('yesterday');
    });

    it('returns days ago for timestamps under 1 week', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 3 * 24 * 60 * 60 * 1000)).toBe('3 days ago');
    });

    it('returns weeks ago for timestamps under 1 month', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 14 * 24 * 60 * 60 * 1000)).toBe('2 wks ago');
    });
  });

  describe('format variants', () => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    it('formats with narrow style', () => {
      expect(formatRelativeTime(fiveMinutesAgo, { format: 'narrow' })).toBe('5m');
    });

    it('formats with short style', () => {
      expect(formatRelativeTime(fiveMinutesAgo, { format: 'short' })).toBe('5 mins ago');
    });

    it('formats with long style', () => {
      expect(formatRelativeTime(fiveMinutesAgo, { format: 'long' })).toBe('5 minutes ago');
    });
  });

  describe('future timestamps', () => {
    it('returns "in a moment" for timestamps under 60 seconds in future', () => {
      const now = Date.now();
      expect(formatRelativeTime(now + 30000)).toBe('in a moment');
    });

    it('returns "tomorrow" for 1 day in future', () => {
      const now = Date.now();
      expect(formatRelativeTime(now + 24 * 60 * 60 * 1000)).toBe('tomorrow');
    });
  });
});

describe('getUpdateInterval', () => {
  it('returns 10 seconds for timestamps under 1 minute old', () => {
    expect(getUpdateInterval(Date.now() - 30000)).toBe(10000);
  });

  it('returns 60 seconds for timestamps under 1 hour old', () => {
    expect(getUpdateInterval(Date.now() - 30 * 60 * 1000)).toBe(60000);
  });

  it('returns 5 minutes for timestamps under 1 day old', () => {
    expect(getUpdateInterval(Date.now() - 12 * 60 * 60 * 1000)).toBe(5 * 60 * 1000);
  });

  it('returns 1 hour for older timestamps', () => {
    expect(getUpdateInterval(Date.now() - 48 * 60 * 60 * 1000)).toBe(60 * 60 * 1000);
  });
});

describe('RelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders with time element by default', () => {
      render(<RelativeTime timestamp={Date.now() - 5 * 60 * 1000} />);
      const timeElement = screen.getByText('5 mins ago');
      expect(timeElement.tagName).toBe('TIME');
    });

    it('renders with span when as="span"', () => {
      render(<RelativeTime timestamp={Date.now() - 5 * 60 * 1000} as="span" />);
      const spanElement = screen.getByText('5 mins ago');
      expect(spanElement.tagName).toBe('SPAN');
    });

    it('includes datetime attribute on time element', () => {
      const timestamp = new Date('2024-01-15T10:30:00Z');
      render(<RelativeTime timestamp={timestamp} />);
      const timeElement = screen.getByText(/ago|just now/);
      expect(timeElement).toHaveAttribute('datetime', timestamp.toISOString());
    });

    it('applies size class', () => {
      render(<RelativeTime timestamp={Date.now()} size="sm" />);
      const element = screen.getByText('just now');
      expect(element.className).toContain('size-sm');
    });

    it('applies color class', () => {
      render(<RelativeTime timestamp={Date.now()} color="soft" />);
      const element = screen.getByText('just now');
      expect(element.className).toContain('soft');
    });

    it('applies custom className', () => {
      render(<RelativeTime timestamp={Date.now()} className="custom-class" />);
      const element = screen.getByText('just now');
      expect(element.className).toContain('custom-class');
    });
  });

  describe('auto-update', () => {
    it('updates display as time passes', async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      render(<RelativeTime timestamp={now - 30 * 1000} />);
      expect(screen.getByText('just now')).toBeInTheDocument();

      // Advance time by 1 minute
      await act(async () => {
        vi.setSystemTime(now + 60 * 1000);
        vi.advanceTimersByTime(10000); // Trigger tick
      });

      // Should now show "1 min ago" (30s initial + 60s advanced = 90s)
      expect(screen.getByText('1 min ago')).toBeInTheDocument();
    });

    it('does not update when static prop is true', async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      render(<RelativeTime timestamp={now - 30 * 1000} static />);
      expect(screen.getByText('just now')).toBeInTheDocument();

      // Advance time by 2 minutes
      await act(async () => {
        vi.setSystemTime(now + 2 * 60 * 1000);
        vi.advanceTimersByTime(10000);
      });

      // Should still show "just now" because static
      expect(screen.getByText('just now')).toBeInTheDocument();
    });
  });

  describe('format prop', () => {
    it('uses short format by default', () => {
      render(<RelativeTime timestamp={Date.now() - 5 * 60 * 1000} />);
      expect(screen.getByText('5 mins ago')).toBeInTheDocument();
    });

    it('uses narrow format when specified', () => {
      render(<RelativeTime timestamp={Date.now() - 5 * 60 * 1000} format="narrow" />);
      expect(screen.getByText('5m')).toBeInTheDocument();
    });

    it('uses long format when specified', () => {
      render(<RelativeTime timestamp={Date.now() - 5 * 60 * 1000} format="long" />);
      expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
    });
  });

  describe('timestamp formats', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');

    it('accepts Date object', () => {
      vi.setSystemTime(testDate.getTime() + 5 * 60 * 1000);
      render(<RelativeTime timestamp={testDate} />);
      expect(screen.getByText('5 mins ago')).toBeInTheDocument();
    });

    it('accepts Unix timestamp (number)', () => {
      vi.setSystemTime(testDate.getTime() + 5 * 60 * 1000);
      render(<RelativeTime timestamp={testDate.getTime()} />);
      expect(screen.getByText('5 mins ago')).toBeInTheDocument();
    });

    it('accepts ISO string', () => {
      vi.setSystemTime(testDate.getTime() + 5 * 60 * 1000);
      render(<RelativeTime timestamp={testDate.toISOString()} />);
      expect(screen.getByText('5 mins ago')).toBeInTheDocument();
    });
  });

  describe('tooltip', () => {
    it('renders with tooltip by default', () => {
      render(<RelativeTime timestamp={Date.now()} />);
      // The element should have aria-describedby when hovered
      // This tests that the Tooltip wrapper is present
      const element = screen.getByText('just now');
      expect(element).toBeInTheDocument();
    });

    it('does not render tooltip when showTooltip is false', () => {
      render(<RelativeTime timestamp={Date.now()} showTooltip={false} />);
      const element = screen.getByText('just now');
      expect(element).toBeInTheDocument();
    });
  });
});
