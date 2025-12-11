/**
 * Core CodeMirror editor hook
 *
 * Initializes and manages a CodeMirror 6 editor instance with:
 * - Markdown syntax highlighting with nested code block support
 * - Controlled/uncontrolled mode support
 * - All standard extensions (history, search, folding)
 * - Imperative API for programmatic control
 */

import { useEffect, useRef, useMemo, useState } from 'react';
import { EditorState, Transaction, Compartment, type Extension } from '@codemirror/state';
import { EditorView, lineNumbers, drawSelection, placeholder as placeholderExt, keymap } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { indentOnInput, indentUnit, bracketMatching } from '@codemirror/language';

import { theme } from './extensions/theme';
import { baseSearchExtension, createSearchKeybindings } from './extensions/search';
import { foldingExtension, foldAll, unfoldAll } from './extensions/folding';
import { setCoAuthorsEffect, getMappedCoAuthors } from './useCoAuthorDecorations';
import type { MarkdownEditorRef, RemoteEdit, CoAuthor } from './types';

interface UseCodeMirrorEditorOptions {
  /** Initial or controlled value */
  value: string;
  /** Called when content changes (for controlled mode) */
  onChange?: (value: string) => void;
  /** Called when selection changes */
  onSelectionChange?: (start: number, end: number) => void;
  /** Called when editor gains focus */
  onFocus?: () => void;
  /** Called when editor loses focus */
  onBlur?: () => void;
  /** Called when search panel should open (Ctrl+F or Ctrl+H) */
  onOpenSearch?: (showReplace: boolean) => void;
  /** Read-only mode */
  readOnly?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Tab size in spaces */
  tabSize?: number;
  /** Additional extensions */
  extensions?: Extension[];
}

interface UseCodeMirrorEditorResult {
  /** Ref to attach to the container div */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Current EditorView instance */
  view: EditorView | null;
  /** Imperative methods for external control */
  editorRef: MarkdownEditorRef;
}

/**
 * Hook to create and manage a CodeMirror 6 editor.
 */
export function useCodeMirrorEditor(options: UseCodeMirrorEditorOptions): UseCodeMirrorEditorResult {
  const {
    value,
    onChange,
    onSelectionChange,
    onFocus,
    onBlur,
    onOpenSearch,
    readOnly = false,
    placeholder,
    showLineNumbers = true,
    tabSize = 2,
    extensions: additionalExtensions = [],
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [view, setView] = useState<EditorView | null>(null);
  const extensionCompartment = useRef(new Compartment());

  // Use a ref for the search callback to avoid recreating extensions
  const onOpenSearchRef = useRef(onOpenSearch);
  onOpenSearchRef.current = onOpenSearch;

  // Track whether the last change came from inside the editor
  const isInternalChange = useRef(false);
  // Track the last value we synchronized to prevent loops
  const lastSyncedValue = useRef(value);

  // Build base extensions (memoized to prevent recreation)
  const baseExtensions = useMemo(() => {
    const exts: Extension[] = [
      // Markdown with nested code block highlighting
      markdown({ codeLanguages: languages }),

      // History (undo/redo)
      history(),
      keymap.of(historyKeymap),

      // Default keybindings
      keymap.of(defaultKeymap),
      keymap.of([indentWithTab]),

      // Indentation
      indentOnInput(),
      indentUnit.of(' '.repeat(tabSize)),

      // Bracket matching
      bracketMatching(),

      // Visual features
      drawSelection(),
      EditorView.lineWrapping,

      // Theme (colors, fonts, etc.)
      theme,

      // Search (base extension + custom keybindings that call onOpenSearch via ref)
      baseSearchExtension,
      createSearchKeybindings(
        (showReplace) => onOpenSearchRef.current?.(showReplace),
        (showReplace) => onOpenSearchRef.current?.(showReplace)
      ),

      // Folding
      foldingExtension,
    ];

    // Optional line numbers
    if (showLineNumbers) {
      exts.push(lineNumbers());
    }

    // Placeholder
    if (placeholder) {
      exts.push(placeholderExt(placeholder));
    }

    // Read-only state
    if (readOnly) {
      exts.push(EditorState.readOnly.of(true));
    }

    return exts;
  // Note: onOpenSearch is accessed via ref to avoid recreating extensions
  }, [showLineNumbers, placeholder, readOnly, tabSize]);

  // Create update listener extension
  const updateListener = useMemo(() => {
    return EditorView.updateListener.of((update) => {
      // Handle document changes
      if (update.docChanged) {
        const newValue = update.state.doc.toString();

        // Mark as internal change and update last synced value
        isInternalChange.current = true;
        lastSyncedValue.current = newValue;

        // Notify parent
        onChange?.(newValue);

        // Reset the flag after React has a chance to process
        requestAnimationFrame(() => {
          isInternalChange.current = false;
        });
      }

      // Handle selection changes
      if (update.selectionSet) {
        const selection = update.state.selection.main;
        onSelectionChange?.(selection.from, selection.to);
      }

      // Handle focus changes
      if (update.focusChanged) {
        if (update.view.hasFocus) {
          onFocus?.();
        } else {
          onBlur?.();
        }
      }
    });
  }, [onChange, onSelectionChange, onFocus, onBlur]);

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    // Create initial state with compartment for dynamic updates
    const state = EditorState.create({
      doc: value,
      extensions: [
        extensionCompartment.current.of([
          ...baseExtensions,
          updateListener,
          ...additionalExtensions,
        ]),
      ],
    });

    // Create view
    const newView = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = newView;
    setView(newView); // Trigger re-render so downstream hooks get the view
    lastSyncedValue.current = value;

    // Cleanup
    return () => {
      newView.destroy();
      viewRef.current = null;
      setView(null);
    };
  }, []); // Only run once on mount

  // Sync external value changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    // Skip if this change originated from inside the editor
    if (isInternalChange.current) return;

    // Skip if value hasn't actually changed
    const currentValue = view.state.doc.toString();
    if (value === currentValue) return;
    if (value === lastSyncedValue.current) return;

    // External change detected - update editor while preserving cursor
    lastSyncedValue.current = value;

    // Get current selection
    const selection = view.state.selection.main;
    const oldLen = currentValue.length;
    const newLen = value.length;

    // Calculate new cursor position
    let newCursorPos = selection.anchor;
    if (oldLen !== newLen) {
      // Simple heuristic: find where the change starts
      let changeStart = 0;
      const minLen = Math.min(oldLen, newLen);
      for (let i = 0; i < minLen; i++) {
        if (currentValue[i] !== value[i]) {
          changeStart = i;
          break;
        }
        changeStart = i + 1;
      }

      // Adjust cursor if it's after the change point
      if (selection.anchor > changeStart) {
        newCursorPos = selection.anchor + (newLen - oldLen);
      }
    }

    // Clamp cursor to valid range
    newCursorPos = Math.max(0, Math.min(newCursorPos, newLen));

    // Dispatch update
    view.dispatch({
      changes: { from: 0, to: oldLen, insert: value },
      selection: { anchor: newCursorPos },
      // Don't add to undo history for external updates
      annotations: Transaction.addToHistory.of(false),
    });
  }, [value]);

  // Update extensions when they change
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: extensionCompartment.current.reconfigure([
        ...baseExtensions,
        updateListener,
        ...additionalExtensions,
      ]),
    });
  }, [baseExtensions, updateListener, additionalExtensions]);

  // Build imperative ref methods
  const editorRef: MarkdownEditorRef = useMemo(() => ({
    getMarkdown: () => {
      return viewRef.current?.state.doc.toString() ?? '';
    },

    setMarkdown: (markdown: string) => {
      const view = viewRef.current;
      if (!view) return;

      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: markdown },
      });
    },

    insertAt: (position: number, text: string) => {
      const view = viewRef.current;
      if (!view) return;

      // Clamp position to valid range
      const docLen = view.state.doc.length;
      const pos = Math.max(0, Math.min(position, docLen));

      view.dispatch({
        changes: { from: pos, to: pos, insert: text },
      });
    },

    deleteRange: (start: number, length: number) => {
      const view = viewRef.current;
      if (!view) return;

      const docLen = view.state.doc.length;
      const from = Math.max(0, Math.min(start, docLen));
      const to = Math.max(from, Math.min(start + length, docLen));

      view.dispatch({
        changes: { from, to },
      });
    },

    focus: () => {
      viewRef.current?.focus();
    },

    blur: () => {
      viewRef.current?.contentDOM.blur();
    },

    getCursorPosition: () => {
      return viewRef.current?.state.selection.main.anchor ?? 0;
    },

    setCursorPosition: (position: number) => {
      const view = viewRef.current;
      if (!view) return;

      const docLen = view.state.doc.length;
      const pos = Math.max(0, Math.min(position, docLen));

      view.dispatch({
        selection: { anchor: pos },
      });
    },

    getSelection: () => {
      const selection = viewRef.current?.state.selection.main;
      return {
        start: selection?.from ?? 0,
        end: selection?.to ?? 0,
      };
    },

    setSelection: (start: number, end: number) => {
      const view = viewRef.current;
      if (!view) return;

      const docLen = view.state.doc.length;
      const from = Math.max(0, Math.min(start, docLen));
      const to = Math.max(from, Math.min(end, docLen));

      view.dispatch({
        selection: { anchor: from, head: to },
      });
    },

    goToLine: (line: number) => {
      const view = viewRef.current;
      if (!view) return;

      const doc = view.state.doc;
      const lineCount = doc.lines;
      const targetLine = Math.max(1, Math.min(line, lineCount));
      const lineInfo = doc.line(targetLine);

      view.dispatch({
        selection: { anchor: lineInfo.from },
        effects: EditorView.scrollIntoView(lineInfo.from, { y: 'center' }),
      });
    },

    scrollToPosition: (position: number) => {
      const view = viewRef.current;
      if (!view) return;

      const docLen = view.state.doc.length;
      const pos = Math.max(0, Math.min(position, docLen));

      view.dispatch({
        effects: EditorView.scrollIntoView(pos, { y: 'center' }),
      });
    },

    foldAll: () => {
      const view = viewRef.current;
      if (view) foldAll(view);
    },

    unfoldAll: () => {
      const view = viewRef.current;
      if (view) unfoldAll(view);
    },

    // Legacy compatibility
    insertText: (text: string) => {
      const view = viewRef.current;
      if (!view) return;

      const selection = view.state.selection.main;
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: text },
        selection: { anchor: selection.from + text.length },
      });
    },

    getElement: () => containerRef.current,

    // Co-authoring API - single entry point for all remote updates
    applyRemoteUpdate: (
      edits: RemoteEdit[],
      coAuthors: CoAuthor[],
      _options?: { preserveSelection?: boolean }
    ) => {
      const view = viewRef.current;
      if (!view) return;

      const docLength = view.state.doc.length;

      // Validate and clamp all edit positions
      const validatedEdits = edits.map(edit => ({
        from: Math.max(0, Math.min(edit.from, docLength)),
        to: Math.max(0, Math.min(edit.to, docLength)),
        insert: edit.insert,
      }));

      // Sort edits by position (apply from end to start to preserve positions)
      const sortedEdits = [...validatedEdits].sort((a, b) => b.from - a.from);

      // Build a single transaction with all edits + coAuthor update
      // Using Transaction.addToHistory.of(false) so remote changes don't pollute undo
      view.dispatch({
        changes: sortedEdits.map(edit => ({
          from: edit.from,
          to: edit.to,
          insert: edit.insert,
        })),
        effects: setCoAuthorsEffect.of(coAuthors),
        annotations: Transaction.addToHistory.of(false),
        // Preserve user's scroll position
        scrollIntoView: false,
      });
    },

    updateCoAuthors: (coAuthors: CoAuthor[]) => {
      const view = viewRef.current;
      if (!view) return;

      view.dispatch({
        effects: setCoAuthorsEffect.of(coAuthors),
      });
    },

    getCoAuthors: (): CoAuthor[] => {
      const view = viewRef.current;
      if (!view) return [];

      return getMappedCoAuthors(view);
    },
  }), []);

  return {
    containerRef,
    view,
    editorRef,
  };
}

export default useCodeMirrorEditor;
