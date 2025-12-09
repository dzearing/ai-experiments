/**
 * useMarkdownEditor hook
 *
 * Creates and configures a TipTap editor with markdown support.
 */

import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';

export interface UseMarkdownEditorOptions {
  /** Initial markdown content */
  initialContent?: string;
  /** Change handler */
  onChange?: (markdown: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Read-only mode */
  readOnly?: boolean;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Focus callback */
  onFocus?: () => void;
  /** Blur callback */
  onBlur?: () => void;
}

export function useMarkdownEditor(options: UseMarkdownEditorOptions = {}) {
  const {
    initialContent = '',
    onChange,
    placeholder = 'Start typing...',
    readOnly = false,
    autoFocus = false,
    onFocus,
    onBlur,
  } = options;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure StarterKit extensions
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'code-block',
          },
        },
      }),
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
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: initialContent,
    editable: !readOnly,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      if (onChange) {
        const markdown = editor.storage.markdown?.getMarkdown?.() || '';
        onChange(markdown);
      }
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

export default useMarkdownEditor;
