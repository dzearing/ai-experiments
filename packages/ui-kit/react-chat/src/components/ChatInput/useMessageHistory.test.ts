import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMessageHistory } from './useMessageHistory';

describe('useMessageHistory', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getHistory', () => {
    it('returns empty array when no history exists', () => {
      const { result } = renderHook(() => useMessageHistory('test-key'));
      expect(result.current.getHistory()).toEqual([]);
    });

    it('returns empty array when historyKey is undefined', () => {
      const { result } = renderHook(() => useMessageHistory(undefined));
      expect(result.current.getHistory()).toEqual([]);
    });

    it('retrieves history from localStorage', () => {
      const messages = ['message1', 'message2', 'message3'];
      localStorage.setItem('chatinput-history-test-key', JSON.stringify(messages));

      const { result } = renderHook(() => useMessageHistory('test-key'));
      expect(result.current.getHistory()).toEqual(messages);
    });

    it('handles corrupted localStorage data gracefully', () => {
      localStorage.setItem('chatinput-history-test-key', 'not-valid-json');

      const { result } = renderHook(() => useMessageHistory('test-key'));
      expect(result.current.getHistory()).toEqual([]);
    });
  });

  describe('addToHistory', () => {
    it('saves message to localStorage', () => {
      const { result } = renderHook(() => useMessageHistory('test-key'));

      act(() => {
        result.current.addToHistory('Hello world');
      });

      const stored = JSON.parse(localStorage.getItem('chatinput-history-test-key') || '[]');
      expect(stored).toContain('Hello world');
    });

    it('does not save when historyKey is undefined', () => {
      const { result } = renderHook(() => useMessageHistory(undefined));

      act(() => {
        result.current.addToHistory('Hello world');
      });

      expect(localStorage.length).toBe(0);
    });

    it('does not save empty or whitespace-only messages', () => {
      const { result } = renderHook(() => useMessageHistory('test-key'));

      act(() => {
        result.current.addToHistory('');
        result.current.addToHistory('   ');
        result.current.addToHistory('\n\t');
      });

      expect(localStorage.getItem('chatinput-history-test-key')).toBeNull();
    });

    it('adds new messages to the front of history', () => {
      const { result } = renderHook(() => useMessageHistory('test-key'));

      act(() => {
        result.current.addToHistory('first');
        result.current.addToHistory('second');
        result.current.addToHistory('third');
      });

      const history = result.current.getHistory();
      expect(history[0]).toBe('third');
      expect(history[1]).toBe('second');
      expect(history[2]).toBe('first');
    });

    it('deduplicates entries by moving existing to front', () => {
      const { result } = renderHook(() => useMessageHistory('test-key'));

      act(() => {
        result.current.addToHistory('first');
        result.current.addToHistory('second');
        result.current.addToHistory('first'); // duplicate
      });

      const history = result.current.getHistory();
      expect(history).toEqual(['first', 'second']);
      expect(history.length).toBe(2);
    });

    it('limits history to maxItems', () => {
      const maxItems = 3;
      const { result } = renderHook(() => useMessageHistory('test-key', maxItems));

      act(() => {
        result.current.addToHistory('one');
        result.current.addToHistory('two');
        result.current.addToHistory('three');
        result.current.addToHistory('four');
        result.current.addToHistory('five');
      });

      const history = result.current.getHistory();
      expect(history.length).toBe(maxItems);
      expect(history).toEqual(['five', 'four', 'three']);
    });

    it('uses default maxItems of 50', () => {
      const { result } = renderHook(() => useMessageHistory('test-key'));

      // Add 55 messages
      act(() => {
        for (let i = 0; i < 55; i++) {
          result.current.addToHistory(`message-${i}`);
        }
      });

      const history = result.current.getHistory();
      expect(history.length).toBe(50);
      expect(history[0]).toBe('message-54');
    });
  });

  describe('clearHistory', () => {
    it('removes history from localStorage', () => {
      const { result } = renderHook(() => useMessageHistory('test-key'));

      act(() => {
        result.current.addToHistory('message1');
        result.current.addToHistory('message2');
      });

      expect(result.current.getHistory().length).toBe(2);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.getHistory()).toEqual([]);
      expect(localStorage.getItem('chatinput-history-test-key')).toBeNull();
    });

    it('does nothing when historyKey is undefined', () => {
      localStorage.setItem('chatinput-history-other', JSON.stringify(['test']));

      const { result } = renderHook(() => useMessageHistory(undefined));

      act(() => {
        result.current.clearHistory();
      });

      // Other keys should be unaffected
      expect(localStorage.getItem('chatinput-history-other')).not.toBeNull();
    });
  });

  describe('localStorage unavailable', () => {
    it('handles localStorage errors gracefully on read', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      const { result } = renderHook(() => useMessageHistory('test-key'));
      expect(result.current.getHistory()).toEqual([]);

      getItemSpy.mockRestore();
    });

    it('handles localStorage errors gracefully on write', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage full');
      });

      const { result } = renderHook(() => useMessageHistory('test-key'));

      // Should not throw
      act(() => {
        result.current.addToHistory('test message');
      });

      setItemSpy.mockRestore();
    });

    it('handles localStorage errors gracefully on clear', () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      const { result } = renderHook(() => useMessageHistory('test-key'));

      // Should not throw
      act(() => {
        result.current.clearHistory();
      });

      removeItemSpy.mockRestore();
    });
  });

  describe('historyKey isolation', () => {
    it('different keys have separate histories', () => {
      const { result: hook1 } = renderHook(() => useMessageHistory('key1'));
      const { result: hook2 } = renderHook(() => useMessageHistory('key2'));

      act(() => {
        hook1.current.addToHistory('from key1');
        hook2.current.addToHistory('from key2');
      });

      expect(hook1.current.getHistory()).toEqual(['from key1']);
      expect(hook2.current.getHistory()).toEqual(['from key2']);
    });
  });
});
