import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useRef, useEffect } from 'react';
import { ChatInput, type ChatInputRef } from './ChatInput';

describe('ChatInput focus', () => {
  it('should expose focus method via ref', async () => {
    const focusCalled = vi.fn();

    function TestComponent() {
      const inputRef = useRef<ChatInputRef>(null);

      useEffect(() => {
        // Try to focus after mount
        const timer = setTimeout(() => {
          console.log('Ref current:', inputRef.current);
          console.log('Focus method:', inputRef.current?.focus);
          if (inputRef.current?.focus) {
            focusCalled();
            inputRef.current.focus();
          }
        }, 100);
        return () => clearTimeout(timer);
      }, []);

      return <ChatInput ref={inputRef} placeholder="Test input" />;
    }

    render(<TestComponent />);

    // Wait for the ref to be available and focus to be called
    await waitFor(() => {
      expect(focusCalled).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('should focus the editor when focus() is called', async () => {
    let chatInputRef: ChatInputRef | null = null;

    function TestComponent() {
      const inputRef = useRef<ChatInputRef>(null);

      useEffect(() => {
        chatInputRef = inputRef.current;
      });

      return <ChatInput ref={inputRef} placeholder="Test input" />;
    }

    render(<TestComponent />);

    // Wait for component to mount and ref to be set
    await waitFor(() => {
      expect(chatInputRef).not.toBeNull();
    }, { timeout: 500 });

    // Call focus
    chatInputRef?.focus();

    // Wait for focus to be applied (with retries)
    await waitFor(() => {
      // Check if the editor contenteditable has focus
      const editor = document.querySelector('[contenteditable="true"]');
      expect(editor).not.toBeNull();
      expect(document.activeElement).toBe(editor);
    }, { timeout: 1000 });
  });

  it('ref should be defined immediately after render', async () => {
    let refValue: ChatInputRef | null = null;

    function TestComponent() {
      const inputRef = useRef<ChatInputRef>(null);

      useEffect(() => {
        console.log('=== REF DEBUG ===');
        console.log('inputRef:', inputRef);
        console.log('inputRef.current:', inputRef.current);
        if (inputRef.current) {
          console.log('focus method:', inputRef.current.focus);
          console.log('clear method:', inputRef.current.clear);
        }
        refValue = inputRef.current;
      }, []);

      return <ChatInput ref={inputRef} placeholder="Test input" />;
    }

    render(<TestComponent />);

    await waitFor(() => {
      expect(refValue).not.toBeNull();
      expect(refValue?.focus).toBeDefined();
      expect(typeof refValue?.focus).toBe('function');
    }, { timeout: 500 });
  });
});
