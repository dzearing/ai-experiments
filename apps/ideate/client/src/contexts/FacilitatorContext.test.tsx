import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  FacilitatorProvider,
  useFacilitator,
  type FacilitatorMessage,
} from './FacilitatorContext';

describe('FacilitatorContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FacilitatorProvider>{children}</FacilitatorProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useFacilitator', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useFacilitator());
      }).toThrow('useFacilitator must be used within a FacilitatorProvider');

      consoleSpy.mockRestore();
    });

    it('returns context value when used within provider', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.isOpen).toBe(false);
      expect(result.current.messages).toEqual([]);
      expect(result.current.connectionState).toBe('disconnected');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('overlay state', () => {
    it('starts with overlay closed', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      expect(result.current.isOpen).toBe(false);
    });

    it('opens overlay with open()', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('closes overlay with close()', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });
      expect(result.current.isOpen).toBe(false);
    });

    it('toggles overlay state with toggle()', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('messages', () => {
    it('starts with empty messages', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      expect(result.current.messages).toEqual([]);
    });

    it('adds a user message with sendMessage()', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      act(() => {
        result.current.sendMessage('Hello, facilitator!');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toMatchObject({
        role: 'user',
        parts: [{ type: 'text', text: 'Hello, facilitator!' }],
      });
      expect(result.current.messages[0].id).toBeDefined();
      expect(result.current.messages[0].timestamp).toBeDefined();
    });

    it('adds a message with addMessage()', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      const message: FacilitatorMessage = {
        id: 'test-1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Hello! How can I help?' }],
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addMessage(message);
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toEqual(message);
    });

    it('updates a message with updateMessage()', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      const message: FacilitatorMessage = {
        id: 'test-1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Hello...' }],
        timestamp: Date.now(),
        isStreaming: true,
      };

      act(() => {
        result.current.addMessage(message);
      });

      act(() => {
        result.current.updateMessage('test-1', {
          parts: [{ type: 'text', text: 'Hello! How can I help?' }],
          isStreaming: false,
        });
      });

      expect(result.current.messages[0]).toMatchObject({
        id: 'test-1',
        parts: [{ type: 'text', text: 'Hello! How can I help?' }],
        isStreaming: false,
      });
    });

    it('does not affect other messages when updating', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      act(() => {
        result.current.addMessage({
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'First' }],
          timestamp: 1000,
        });
        result.current.addMessage({
          id: 'msg-2',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Second' }],
          timestamp: 2000,
        });
      });

      act(() => {
        result.current.updateMessage('msg-1', { parts: [{ type: 'text', text: 'Updated First' }] });
      });

      const msg1TextPart = result.current.messages[0].parts.find(p => p.type === 'text');
      const msg2TextPart = result.current.messages[1].parts.find(p => p.type === 'text');
      expect(msg1TextPart?.type === 'text' && msg1TextPart.text).toBe('Updated First');
      expect(msg2TextPart?.type === 'text' && msg2TextPart.text).toBe('Second');
    });

    it('clears all messages with clearMessages()', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      act(() => {
        result.current.sendMessage('Message 1');
        result.current.sendMessage('Message 2');
      });
      expect(result.current.messages).toHaveLength(2);

      act(() => {
        result.current.clearMessages();
      });
      expect(result.current.messages).toEqual([]);
    });

    it('sets messages with setMessages()', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      const messages: FacilitatorMessage[] = [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hi' }], timestamp: 1000 },
        { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'Hello!' }], timestamp: 2000 },
      ];

      act(() => {
        result.current.setMessages(messages);
      });

      expect(result.current.messages).toEqual(messages);
    });
  });

  describe('connection state', () => {
    it('starts disconnected', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      expect(result.current.connectionState).toBe('disconnected');
    });

    it('updates connection state with setConnectionState()', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      act(() => {
        result.current.setConnectionState('connecting');
      });
      expect(result.current.connectionState).toBe('connecting');

      act(() => {
        result.current.setConnectionState('connected');
      });
      expect(result.current.connectionState).toBe('connected');

      act(() => {
        result.current.setConnectionState('error');
      });
      expect(result.current.connectionState).toBe('error');
    });
  });

  describe('loading state', () => {
    it('starts not loading', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      expect(result.current.isLoading).toBe(false);
    });

    it('updates loading state with setIsLoading()', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      act(() => {
        result.current.setIsLoading(true);
      });
      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setIsLoading(false);
      });
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('error state', () => {
    it('starts with no error', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      expect(result.current.error).toBeNull();
    });

    it('sets error with setError()', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      act(() => {
        result.current.setError('Connection failed');
      });
      expect(result.current.error).toBe('Connection failed');

      act(() => {
        result.current.setError(null);
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('keyboard shortcut', () => {
    it('toggles overlay on Ctrl+. keypress', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      expect(result.current.isOpen).toBe(false);

      // Simulate Ctrl+. keypress
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: '.',
          ctrlKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(result.current.isOpen).toBe(true);

      // Toggle again
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: '.',
          ctrlKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('toggles overlay on Cmd+. keypress (Mac)', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      expect(result.current.isOpen).toBe(false);

      // Simulate Cmd+. keypress (Mac)
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: '.',
          metaKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('message IDs', () => {
    it('generates unique IDs for each message', () => {
      const { result } = renderHook(() => useFacilitator(), { wrapper });

      act(() => {
        result.current.sendMessage('Message 1');
        result.current.sendMessage('Message 2');
        result.current.sendMessage('Message 3');
      });

      const ids = result.current.messages.map((m) => m.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
    });
  });
});
