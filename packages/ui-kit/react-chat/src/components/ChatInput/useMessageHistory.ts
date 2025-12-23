import { useCallback } from 'react';

/**
 * Hook for managing message history in localStorage
 */
export function useMessageHistory(historyKey: string | undefined, maxItems: number = 50) {
  const getStorageKey = useCallback(() => {
    return historyKey ? `chatinput-history-${historyKey}` : null;
  }, [historyKey]);

  const getHistory = useCallback((): string[] => {
    const key = getStorageKey();
    if (!key) return [];

    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [getStorageKey]);

  const addToHistory = useCallback(
    (message: string) => {
      const key = getStorageKey();
      if (!key || !message.trim()) return;

      const history = getHistory();

      // Avoid duplicates (remove if exists, add to front)
      const filtered = history.filter((h) => h !== message);
      const updated = [message, ...filtered].slice(0, maxItems);

      try {
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {
        // localStorage full or unavailable
      }
    },
    [getStorageKey, getHistory, maxItems]
  );

  const clearHistory = useCallback(() => {
    const key = getStorageKey();
    if (!key) return;

    try {
      localStorage.removeItem(key);
    } catch {
      // localStorage unavailable
    }
  }, [getStorageKey]);

  return { getHistory, addToHistory, clearHistory };
}
