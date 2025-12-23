/**
 * useChatEditor hook
 *
 * Creates and configures a TipTap editor for chat input with WYSIWYG support.
 * Uses tiptap-markdown for markdown serialization on submit.
 */

import { useEditor } from '@tiptap/react';
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
}

export function useChatEditor(options: UseChatEditorOptions = {}) {
  const {
    placeholder = 'Type a message...',
    disabled = false,
    onChange,
    onFocus,
    onBlur,
  } = options;

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
