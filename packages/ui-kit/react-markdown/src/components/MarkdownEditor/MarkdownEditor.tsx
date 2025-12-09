/**
 * MarkdownEditor component
 *
 * TipTap-based WYSIWYG markdown editor with bi-directional
 * markdown/rich-text editing and AI co-authoring support.
 *
 * Surfaces used:
 * - inset (editor background)
 * - popout (toolbar)
 *
 * Tokens used:
 * - --inset-bg, --inset-border, --inset-text
 * - --font-sans, --font-mono
 * - --space-*, --radius-*
 */

import { useEffect, forwardRef, useImperativeHandle } from 'react';
import { EditorContent } from '@tiptap/react';
import { useMarkdownEditor } from './useMarkdownEditor';
import { MarkdownToolbar, type MarkdownToolbarProps } from '../MarkdownToolbar';
import type { Editor } from '@tiptap/react';
import type { DeepLinkOptions } from '../../types/deepLink';
import styles from './MarkdownEditor.module.css';

export interface MarkdownEditorProps {
  /** Initial markdown content (uncontrolled) */
  value?: string;
  /** Controlled markdown content */
  markdown?: string;
  /** Change handler for markdown output */
  onChange?: (markdown: string) => void;
  /** Show built-in toolbar */
  showToolbar?: boolean;
  /** Toolbar configuration */
  toolbarProps?: Partial<MarkdownToolbarProps>;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Enable deep linking */
  enableDeepLink?: boolean;
  /** Deep link options */
  deepLinkOptions?: DeepLinkOptions;
  /** Editor height */
  height?: string | number;
  /** Min height */
  minHeight?: string | number;
  /** Max height */
  maxHeight?: string | number;
  /** Read-only mode */
  readOnly?: boolean;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Editor ready callback */
  onEditorReady?: (editor: Editor) => void;
  /** Focus callback */
  onFocus?: () => void;
  /** Blur callback */
  onBlur?: () => void;
  /** Additional class name */
  className?: string;
}

export interface MarkdownEditorRef {
  /** Get editor instance */
  getEditor: () => Editor | null;
  /** Get current markdown */
  getMarkdown: () => string;
  /** Set markdown content */
  setMarkdown: (markdown: string) => void;
  /** Focus editor */
  focus: () => void;
  /** Blur editor */
  blur: () => void;
}

export const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(
  function MarkdownEditor(
    {
      value,
      markdown,
      onChange,
      showToolbar = true,
      toolbarProps,
      showLineNumbers: _showLineNumbers = false,
      enableDeepLink: _enableDeepLink = true,
      deepLinkOptions: _deepLinkOptions,
      height,
      minHeight = '200px',
      maxHeight,
      readOnly = false,
      autoFocus = false,
      placeholder = 'Start typing...',
      onEditorReady,
      onFocus,
      onBlur,
      className,
    },
    ref
  ) {
    // Initialize editor
    const editor = useMarkdownEditor({
      initialContent: value || markdown || '',
      onChange,
      placeholder,
      readOnly,
      autoFocus,
      onFocus,
      onBlur,
    });

    // Sync controlled markdown prop
    useEffect(() => {
      if (editor && markdown !== undefined) {
        const currentContent = editor.storage.markdown?.getMarkdown?.() || '';
        if (markdown !== currentContent) {
          editor.commands.setContent(markdown);
        }
      }
    }, [editor, markdown]);

    // Notify when editor is ready
    useEffect(() => {
      if (editor && onEditorReady) {
        onEditorReady(editor);
      }
    }, [editor, onEditorReady]);

    // Imperative handle
    useImperativeHandle(ref, () => ({
      getEditor: () => editor,
      getMarkdown: () => editor?.storage.markdown?.getMarkdown?.() || '',
      setMarkdown: (md: string) => editor?.commands.setContent(md),
      focus: () => editor?.commands.focus(),
      blur: () => editor?.commands.blur(),
    }), [editor]);

    // Calculate style
    const wrapperStyle: React.CSSProperties = {
      height: height,
      minHeight: minHeight,
      maxHeight: maxHeight,
    };

    return (
      <div className={`${styles.editorContainer} ${className || ''}`}>
        {showToolbar && (
          <MarkdownToolbar
            editor={editor}
            {...toolbarProps}
          />
        )}

        <div className={styles.editorWrapper} style={wrapperStyle}>
          <EditorContent
            editor={editor}
            className={styles.editor}
          />
        </div>
      </div>
    );
  }
);

export default MarkdownEditor;
