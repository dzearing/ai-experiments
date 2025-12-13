/**
 * MarkdownEditor component
 *
 * CodeMirror 6-based markdown editor with:
 * - Full markdown syntax highlighting
 * - Nested code block highlighting (JS, Python, etc.)
 * - Search/replace (Ctrl+F, Ctrl+H)
 * - Code folding for blocks and sections
 * - Co-author cursor visibility
 * - Design token theming
 *
 * Surfaces used:
 * - inset (editor background)
 *
 * Tokens used:
 * - --color-inset-background, --color-inset-border, --color-inset-text
 * - --font-mono
 * - --spacing-*, --radius-*
 */

import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useCallback,
} from 'react';
import styles from './MarkdownEditor.module.css';
import { useCodeMirrorEditor } from './useCodeMirrorEditor';
import { coAuthorExtension, useCoAuthorDecorations } from './useCoAuthorDecorations';
import { SearchPanel } from './SearchPanel';
import type { MarkdownEditorProps, MarkdownEditorRef, CoAuthor } from './types';

// Re-export types for backwards compatibility
export type { MarkdownEditorProps, MarkdownEditorRef, CoAuthor };

export const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(
  function MarkdownEditor(
    {
      defaultValue = '',
      value,
      onChange,
      height,
      minHeight = '200px',
      maxHeight,
      readOnly = false,
      autoFocus = false,
      placeholder = 'Enter markdown...',
      onEditorReady,
      onFocus,
      onBlur,
      onSelectionChange,
      onCoAuthorsChange,
      showLineNumbers = true,
      tabSize = 2,
      coAuthors = [],
      className,
    },
    ref
  ) {
    // Track internal value for uncontrolled mode
    const [internalValue, setInternalValue] = useState(defaultValue);

    // Search panel state
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchShowReplace, setSearchShowReplace] = useState(false);
    const [searchFocusTrigger, setSearchFocusTrigger] = useState(0);

    // Determine if controlled
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    // Handle changes
    const handleChange = useMemo(() => {
      return (newValue: string) => {
        if (!isControlled) {
          setInternalValue(newValue);
        }
        onChange?.(newValue);
      };
    }, [isControlled, onChange]);

    // Handle search panel open (called by Ctrl+F or Ctrl+H keybinding)
    const handleOpenSearch = useCallback((showReplace: boolean) => {
      setSearchShowReplace(showReplace);
      setIsSearchOpen(true);
      // Always increment focus trigger to re-focus input even if already open
      setSearchFocusTrigger((prev) => prev + 1);
    }, []);

    // Handle search panel close
    const handleCloseSearch = useCallback(() => {
      setIsSearchOpen(false);
    }, []);

    // Additional extensions for co-authors (must be included in initial state)
    const additionalExtensions = useMemo(() => [coAuthorExtension], []);

    // Initialize CodeMirror
    const { containerRef, view, editorRef } = useCodeMirrorEditor({
      value: currentValue,
      onChange: handleChange,
      onSelectionChange,
      onFocus,
      onBlur,
      onOpenSearch: handleOpenSearch,
      readOnly,
      placeholder,
      showLineNumbers,
      tabSize,
      extensions: additionalExtensions,
    });

    // Set up co-author decorations with position change tracking
    // This hook manages:
    // 1. Dispatching coAuthor position updates to the editor
    // 2. Detecting when positions change due to document edits
    // 3. Notifying parent via onCoAuthorsChange callback
    useCoAuthorDecorations(view, coAuthors, onCoAuthorsChange);

    // Expose imperative handle
    useImperativeHandle(ref, () => editorRef, [editorRef]);

    // Auto-focus
    useEffect(() => {
      if (autoFocus && view) {
        view.focus();
      }
    }, [autoFocus, view]);

    // Notify when editor is ready
    useEffect(() => {
      if (view && onEditorReady) {
        onEditorReady(editorRef);
      }
    }, [view, onEditorReady, editorRef]);

    // Build container styles
    const containerStyle: React.CSSProperties = useMemo(() => ({
      height,
      minHeight,
      maxHeight,
    }), [height, minHeight, maxHeight]);

    // Build class names
    const containerClasses = [
      styles.editorContainer,
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className={styles.editorWrapper}>
        <div
          className={containerClasses}
          style={containerStyle}
          ref={containerRef}
        />
        <SearchPanel
          view={view}
          isOpen={isSearchOpen}
          onClose={handleCloseSearch}
          showReplace={searchShowReplace}
          focusTrigger={searchFocusTrigger}
        />
      </div>
    );
  }
);

export default MarkdownEditor;
