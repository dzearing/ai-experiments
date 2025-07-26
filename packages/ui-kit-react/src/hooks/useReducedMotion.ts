import { useMediaQuery } from './useMediaQuery';

/**
 * Hook to check if the user prefers reduced motion
 * @returns Whether the user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}