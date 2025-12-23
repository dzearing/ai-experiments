import { useEffect, useCallback } from 'react';

/**
 * Options for the useGlobalKeyboard hook
 */
export interface UseGlobalKeyboardOptions {
  /** The key to listen for (e.g., '`' for tilde/backtick) */
  key: string;
  /** Require Ctrl (Windows/Linux) or Cmd (Mac) modifier */
  ctrlOrMeta?: boolean;
  /** Require Shift modifier */
  shift?: boolean;
  /** Callback when the shortcut is triggered */
  onTrigger: () => void;
  /** Disable the keyboard listener */
  disabled?: boolean;
}

/**
 * Hook for listening to global keyboard shortcuts.
 *
 * @example
 * ```tsx
 * useGlobalKeyboard({
 *   key: '`',
 *   ctrlOrMeta: true,
 *   onTrigger: () => console.log('Ctrl/Cmd + ` pressed!'),
 * });
 * ```
 */
export function useGlobalKeyboard({
  key,
  ctrlOrMeta = false,
  shift = false,
  onTrigger,
  disabled = false,
}: UseGlobalKeyboardOptions): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if disabled
      if (disabled) return;

      // Check if the key matches
      if (event.key !== key) return;

      // Check modifier requirements
      const hasCtrlOrMeta = event.ctrlKey || event.metaKey;
      if (ctrlOrMeta && !hasCtrlOrMeta) return;
      if (!ctrlOrMeta && hasCtrlOrMeta) return;

      if (shift && !event.shiftKey) return;
      if (!shift && event.shiftKey) return;

      // Don't trigger if user is typing in an input/textarea/contenteditable
      const target = event.target as HTMLElement;
      const isEditable =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // For global shortcuts with modifiers, we still want to trigger
      // even in editable fields (like VS Code's Cmd+K)
      if (isEditable && !ctrlOrMeta) return;

      // Prevent default and trigger callback
      event.preventDefault();
      event.stopPropagation();
      onTrigger();
    },
    [key, ctrlOrMeta, shift, onTrigger, disabled]
  );

  useEffect(() => {
    if (disabled) return;

    // Use capture phase to catch the event before it reaches other handlers
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [handleKeyDown, disabled]);
}

export default useGlobalKeyboard;
