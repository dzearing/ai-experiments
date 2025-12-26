/**
 * useDeepLink hook
 *
 * Handles hash-based deep linking for markdown content.
 * Supports line numbers (#L10, #L10-L20) and heading slugs (#heading-slug).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  parseCurrentHash,
  navigateToHash,
} from '../utils/deepLinkParser';
import type { DeepLink, DeepLinkOptions, DeepLinkState } from '../types/deepLink';

const DEFAULT_OPTIONS: Required<DeepLinkOptions> = {
  onHashChange: () => {},
  highlightDuration: 2000,
  scrollOffset: 80,
  smoothScroll: true,
};

export interface UseDeepLinkReturn extends DeepLinkState {
  /** Scroll to a specific line */
  scrollToLine: (line: number) => void;
  /** Scroll to a line range */
  scrollToLineRange: (start: number, end: number) => void;
  /** Scroll to a heading by slug */
  scrollToHeading: (slug: string) => void;
  /** Scroll to any deep link */
  scrollToLink: (link: DeepLink) => void;
  /** Clear current highlight */
  clearHighlight: () => void;
  /** Get current hash */
  getCurrentHash: () => string;
}

export function useDeepLink(
  enabled: boolean = true,
  options: DeepLinkOptions = {}
): UseDeepLinkReturn {
  // Memoize options to prevent infinite re-renders
  const { onHashChange, highlightDuration, scrollOffset, smoothScroll } = options;
  const opts = {
    onHashChange: onHashChange ?? DEFAULT_OPTIONS.onHashChange,
    highlightDuration: highlightDuration ?? DEFAULT_OPTIONS.highlightDuration,
    scrollOffset: scrollOffset ?? DEFAULT_OPTIONS.scrollOffset,
    smoothScroll: smoothScroll ?? DEFAULT_OPTIONS.smoothScroll,
  };
  // Use refs to avoid stale closures while keeping effect dependencies stable
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const [activeLink, setActiveLink] = useState<DeepLink | null>(null);
  const [isHighlighting, setIsHighlighting] = useState(false);

  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear highlight after duration
  const scheduleHighlightClear = useCallback(() => {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }

    setIsHighlighting(true);

    highlightTimeoutRef.current = setTimeout(() => {
      setIsHighlighting(false);
    }, opts.highlightDuration);
  }, [opts.highlightDuration]);

  // Handle hash change events
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleHashChange = () => {
      const link = parseCurrentHash();
      setActiveLink(link);

      if (link) {
        scheduleHighlightClear();
        optsRef.current.onHashChange?.(link);

        // Scroll to target
        scrollToTarget(link, optsRef.current);
      }
    };

    // Handle initial hash on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [enabled, scheduleHighlightClear]);

  // Scroll to line
  const scrollToLine = useCallback((line: number) => {
    const link: DeepLink = {
      type: 'line',
      hash: `L${line}`,
      startLine: line,
      endLine: line,
    };
    navigateToHash(link);
  }, []);

  // Scroll to line range
  const scrollToLineRange = useCallback((start: number, end: number) => {
    const link: DeepLink = {
      type: 'line-range',
      hash: `L${start}-L${end}`,
      startLine: start,
      endLine: end,
    };
    navigateToHash(link);
  }, []);

  // Scroll to heading
  const scrollToHeading = useCallback((slug: string) => {
    const link: DeepLink = {
      type: 'heading',
      hash: slug,
      slug,
    };
    navigateToHash(link);
  }, []);

  // Scroll to any link
  const scrollToLink = useCallback((link: DeepLink) => {
    navigateToHash(link);
  }, []);

  // Clear highlight
  const clearHighlight = useCallback(() => {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    setIsHighlighting(false);
    setActiveLink(null);
  }, []);

  // Get current hash
  const getCurrentHash = useCallback(() => {
    if (typeof window === 'undefined') return '';
    return window.location.hash.slice(1);
  }, []);

  return {
    activeLink,
    isHighlighting,
    scrollToLine,
    scrollToLineRange,
    scrollToHeading,
    scrollToLink,
    clearHighlight,
    getCurrentHash,
  };
}

/**
 * Scroll to a deep link target in the DOM
 */
function scrollToTarget(link: DeepLink, options: Required<DeepLinkOptions>) {
  if (typeof document === 'undefined') return;

  let targetElement: Element | null = null;

  if (link.type === 'heading' && link.slug) {
    // Find heading by ID (slug)
    targetElement = document.getElementById(link.slug);
  } else if (link.type === 'line' || link.type === 'line-range') {
    // Find line element by data attribute
    const lineNumber = link.startLine;
    targetElement = document.querySelector(`[data-line="${lineNumber}"]`);
  }

  if (targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const scrollTop = window.scrollY + rect.top - options.scrollOffset;

    window.scrollTo({
      top: scrollTop,
      behavior: options.smoothScroll ? 'smooth' : 'auto',
    });
  }
}

export default useDeepLink;
