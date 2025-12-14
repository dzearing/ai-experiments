import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook for type-to-select behavior (like native HTML select)
 *
 * When the user types characters, this hook builds up a search buffer
 * and finds the first option that starts with those characters.
 * The buffer resets after a period of inactivity.
 *
 * Behavior:
 * - When closed: Type-to-select active, jumps to matching option
 * - When open + searchable: Search input receives keystrokes (this hook disabled)
 * - When open + NOT searchable: Type-to-select active within open dropdown
 */

/** Time to wait before resetting the search buffer (ms) */
const TYPE_BUFFER_TIMEOUT = 1000;

export interface UseTypeToSelectOptions<T> {
  /** List of options to search through */
  options: Array<{ value: T; label: string; disabled?: boolean }>;
  /** Whether the dropdown is currently open */
  isOpen: boolean;
  /** Whether the dropdown is in searchable mode */
  searchable: boolean;
  /** Callback when a match is found */
  onMatch: (index: number) => void;
  /** Whether the hook is enabled */
  enabled?: boolean;
}

export interface UseTypeToSelectReturn {
  /** Handle a key press event */
  handleKeyPress: (key: string) => void;
  /** Current search buffer */
  buffer: string;
  /** Clear the search buffer */
  clearBuffer: () => void;
}

export function useTypeToSelect<T>({
  options,
  isOpen,
  searchable,
  onMatch,
  enabled = true,
}: UseTypeToSelectOptions<T>): UseTypeToSelectReturn {
  const [buffer, setBuffer] = useState('');
  const lastKeyTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear buffer function
  const clearBuffer = useCallback(() => {
    setBuffer('');
  }, []);

  // Handle key press
  const handleKeyPress = useCallback(
    (key: string) => {
      // Only active when:
      // 1. Hook is enabled, AND
      // 2. Either dropdown is closed, OR dropdown is open but NOT in searchable mode
      if (!enabled) return;
      if (isOpen && searchable) return;

      // Only handle printable characters (single characters, no special keys)
      if (key.length !== 1) return;

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;

      // If too much time has passed, start fresh buffer
      const newBuffer =
        timeSinceLastKey > TYPE_BUFFER_TIMEOUT ? key.toLowerCase() : buffer + key.toLowerCase();

      setBuffer(newBuffer);
      lastKeyTimeRef.current = now;

      // Find matching option (case-insensitive, starts-with)
      const matchIndex = options.findIndex(
        (opt) => !opt.disabled && opt.label.toLowerCase().startsWith(newBuffer)
      );

      if (matchIndex >= 0) {
        onMatch(matchIndex);
      }
    },
    [options, isOpen, searchable, onMatch, enabled, buffer]
  );

  // Reset buffer after timeout
  useEffect(() => {
    if (!buffer) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to clear buffer
    timeoutRef.current = setTimeout(() => {
      setBuffer('');
    }, TYPE_BUFFER_TIMEOUT);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [buffer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    handleKeyPress,
    buffer,
    clearBuffer,
  };
}
