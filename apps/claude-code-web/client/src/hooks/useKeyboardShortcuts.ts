import { useEffect, useCallback } from 'react';

/**
 * useKeyboardShortcuts - Global keyboard shortcuts for Claude Code Web
 *
 * Shortcuts handled by this hook (global):
 * - Ctrl+L / Cmd+L: Clear conversation
 * - Ctrl+C / Cmd+C: Cancel current operation (when no text selected)
 * - Shift+Tab: Cycle through permission modes
 *
 * Shortcuts handled by ChatInput (see react-chat):
 * - Enter: Submit message (single-line mode)
 * - Ctrl+Enter / Cmd+Enter: Submit message (multiline mode)
 * - Shift+Enter: Insert newline
 * - Up/Down: Navigate message history
 * - Escape+Escape: Clear input
 * - /: Show command palette
 * - Arrow keys: Navigate command palette
 * - Tab: Select command in palette
 *
 * Future (not yet implemented):
 * - Ctrl+R: Search message history
 * - @: File path mention
 */

/**
 * Options for the useKeyboardShortcuts hook.
 */
export interface UseKeyboardShortcutsOptions {
  /** Callback when Ctrl+L / Cmd+L is pressed (clear conversation) */
  onClear: () => void;
  /** Callback when Ctrl+C / Cmd+C is pressed with no text selected (cancel operation) */
  onCancel: () => void;
  /** Callback when Shift+Tab is pressed outside input fields (cycle mode) */
  onCycleMode: () => void;
  /** Whether shortcuts are enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook for handling global keyboard shortcuts in Claude Code Web.
 *
 * This hook registers document-level keydown listeners for:
 * - Ctrl+L / Cmd+L: Clear conversation
 * - Ctrl+C / Cmd+C: Cancel operation (only when no text is selected)
 * - Shift+Tab: Cycle permission modes (only when not focused in an input)
 *
 * @param options - Callbacks and configuration for the shortcuts
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): void {
  const { onClear, onCancel, onCycleMode, enabled = true } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const isModKey = event.ctrlKey || event.metaKey;

    // Ctrl+L / Cmd+L: Clear conversation
    if (isModKey && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      onClear();

      return;
    }

    // Ctrl+C / Cmd+C: Cancel operation (only when no text is selected)
    if (isModKey && event.key.toLowerCase() === 'c') {
      const selection = window.getSelection();
      const hasSelection = selection && selection.toString().length > 0;

      if (!hasSelection) {
        event.preventDefault();
        onCancel();
      }
      // If text is selected, let the default copy behavior happen

      return;
    }

    // Shift+Tab: Cycle permission modes (only when not in an input element)
    if (event.shiftKey && event.key === 'Tab') {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInInput = activeTag === 'input' ||
                        activeTag === 'textarea' ||
                        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (!isInInput) {
        event.preventDefault();
        onCycleMode();
      }
      // If in an input, let the default Shift+Tab (reverse focus) behavior happen
    }
  }, [enabled, onClear, onCancel, onCycleMode]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}
