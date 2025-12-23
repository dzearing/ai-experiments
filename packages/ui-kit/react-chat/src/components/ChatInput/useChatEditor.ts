/**
 * useChatEditor hook
 *
 * Creates and configures a TipTap editor for chat input with WYSIWYG support.
 * Uses tiptap-markdown for markdown serialization on submit.
 */

import { useEditor } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { useRef, useEffect } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { Markdown } from 'tiptap-markdown';
import { ImageChipExtension } from './ImageChipExtension';
import { CodeExtension } from './CodeExtension';

export interface UseChatEditorOptions {
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Change handler - called on each edit */
  onChange?: (isEmpty: boolean) => void;
  /** Focus callback */
  onFocus?: () => void;
  /** Blur callback */
  onBlur?: () => void;
  /**
   * Enter key handler - called when Enter is pressed.
   * Return true to prevent default behavior (newline insertion).
   */
  onEnterKey?: (event: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }) => boolean;
}

export function useChatEditor(options: UseChatEditorOptions = {}) {
  const {
    placeholder = 'Type a message...',
    disabled = false,
    onChange,
    onFocus,
    onBlur,
    onEnterKey,
  } = options;

  // Use a ref to hold the current onEnterKey callback
  // This ensures the extension always accesses the latest callback
  // since TipTap extensions are created once and don't get re-created on prop changes
  const onEnterKeyRef = useRef(onEnterKey);

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onEnterKeyRef.current = onEnterKey;
  }, [onEnterKey]);

  // Create a custom extension for handling Enter key at the editor level
  // This runs before TipTap's default behavior, preventing unwanted newlines
  // We register separate shortcuts for each modifier combination since TipTap
  // handles keyboard shortcuts this way and it works reliably in tests
  const EnterKeyExtension = Extension.create({
    name: 'enterKeyHandler',
    addKeyboardShortcuts() {
      return {
        // Regular Enter key (no modifiers)
        Enter: () => {
          const currentOnEnterKey = onEnterKeyRef.current;
          if (currentOnEnterKey) {
            const shouldPreventDefault = currentOnEnterKey({
              shiftKey: false,
              ctrlKey: false,
              metaKey: false,
            });
            if (shouldPreventDefault) {
              return true; // Prevent TipTap from inserting newline
            }
          }
          return false; // Let TipTap handle it normally
        },
        // Shift+Enter
        'Shift-Enter': () => {
          const currentOnEnterKey = onEnterKeyRef.current;
          if (currentOnEnterKey) {
            const shouldPreventDefault = currentOnEnterKey({
              shiftKey: true,
              ctrlKey: false,
              metaKey: false,
            });
            if (shouldPreventDefault) {
              return true;
            }
          }
          return false;
        },
        // Mod-Enter (Ctrl on Windows/Linux, Cmd on Mac)
        'Mod-Enter': ({ editor }) => {
          const currentOnEnterKey = onEnterKeyRef.current;
          if (currentOnEnterKey) {
            // Mod maps to Ctrl on Windows/Linux and Meta on Mac
            // We'll set both to indicate a modifier was pressed
            const shouldPreventDefault = currentOnEnterKey({
              shiftKey: false,
              ctrlKey: true,
              metaKey: true,
            });
            if (shouldPreventDefault) {
              return true;
            }
            // If callback returns false (allow newline), we must manually insert it
            // because Mod-Enter doesn't have default newline behavior in TipTap
            editor.commands.splitBlock();
            return true; // We handled it
          }
          return false;
        },
      };
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'code-block',
          },
        },
        // Disable default code extension, we use our custom one
        code: false,
      }),
      // Custom code extension with better exit behavior
      CodeExtension,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
        },
      }),
      Underline,
      Markdown.configure({
        html: true, // Allow HTML tags like <u> for underline
        transformPastedText: true,
        transformCopiedText: true,
      }),
      ImageChipExtension,
      EnterKeyExtension,
    ],
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange?.(editor.isEmpty);
    },
    onFocus: () => {
      onFocus?.();
    },
    onBlur: () => {
      onBlur?.();
    },
  });

  return editor;
}

export default useChatEditor;
