import { useState, useEffect } from 'react';

// Design system breakpoints
const BREAKPOINTS = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
} as const;

type BreakpointKey = keyof typeof BREAKPOINTS;

/**
 * Hook to check if a media query matches
 * @param query - Either a breakpoint key or a custom media query string
 * @returns Whether the media query matches
 */
export function useMediaQuery(query: BreakpointKey | string): boolean {
  const mediaQuery = query in BREAKPOINTS ? BREAKPOINTS[query as BreakpointKey] : query;
  
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(mediaQuery).matches;
  });

  useEffect(() => {
    const mediaQueryList = window.matchMedia(mediaQuery);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Set initial value
    setMatches(mediaQueryList.matches);

    // Modern browsers
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
      return () => mediaQueryList.removeEventListener('change', handleChange);
    } 
    // Legacy browsers
    else {
      mediaQueryList.addListener(handleChange);
      return () => mediaQueryList.removeListener(handleChange);
    }
  }, [mediaQuery]);

  return matches;
}