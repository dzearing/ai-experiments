/**
 * Type definitions for MarkdownEditor
 *
 * Defines all interfaces for the CodeMirror-based markdown editor,
 * including props, ref methods, and co-author structures.
 */

/**
 * Co-author information for collaborative editing.
 * Represents a remote user's cursor/selection in the editor.
 */
export interface CoAuthor {
  /** Unique identifier for the co-author */
  id: string;
  /** Display name shown in cursor label */
  name: string;
  /** Color for cursor and selection (CSS color value) */
  color: string;
  /** Whether this is an AI author */
  isAI?: boolean;
  /** Selection start position (character index) */
  selectionStart: number;
  /** Selection end position (character index) */
  selectionEnd: number;
}

/**
 * A remote edit operation from a co-author.
 * Represents a change that should be applied to the document.
 */
export interface RemoteEdit {
  /** Position to start the edit */
  from: number;
  /** Position to end the edit (same as from for insertions) */
  to: number;
  /** Text to insert (empty string for deletions) */
  insert: string;
}

/**
 * Imperative handle for MarkdownEditor.
 * Provides programmatic control over the editor.
 */
export interface MarkdownEditorRef {
  // Content operations
  /** Get current markdown content */
  getMarkdown: () => string;
  /** Set markdown content (replaces all content) */
  setMarkdown: (markdown: string) => void;

  // Programmatic edits (for AI co-authoring)
  /** Insert text at a specific position */
  insertAt: (position: number, text: string) => void;
  /** Delete a range of text */
  deleteRange: (start: number, length: number) => void;

  /**
   * Apply a remote update from a co-author in a single atomic transaction.
   * This is the ONLY entry point for collaborative edits - all updates from
   * the server should go through this method to ensure proper serialization.
   *
   * @param edits - Array of edit operations to apply (in order)
   * @param coAuthors - Updated co-author positions AFTER edits are applied
   * @param options - Additional options
   *
   * This method:
   * 1. Applies all edits in a single transaction
   * 2. Updates co-author decorations atomically with the edits
   * 3. Does NOT add to undo history (remote changes shouldn't be undoable locally)
   * 4. Does NOT move the local user's cursor or scroll position
   */
  applyRemoteUpdate: (
    edits: RemoteEdit[],
    coAuthors: CoAuthor[],
    options?: {
      /** If true, preserve user's selection even if it overlaps with edits */
      preserveSelection?: boolean;
    }
  ) => void;

  /**
   * Update co-author positions without making document changes.
   * Use this when a co-author moves their cursor but doesn't edit.
   */
  updateCoAuthors: (coAuthors: CoAuthor[]) => void;

  /**
   * Get the current mapped positions of all co-authors.
   * Useful for syncing state after local edits.
   */
  getCoAuthors: () => CoAuthor[];

  // Cursor and selection
  /** Focus the editor */
  focus: () => void;
  /** Blur the editor */
  blur: () => void;
  /** Get current cursor position */
  getCursorPosition: () => number;
  /** Set cursor position */
  setCursorPosition: (position: number) => void;
  /** Get current selection range */
  getSelection: () => { start: number; end: number };
  /** Set selection range */
  setSelection: (start: number, end: number) => void;

  // Navigation
  /** Navigate to a specific line number (moves cursor) */
  goToLine: (line: number) => void;
  /** Scroll to bring a position into view */
  scrollToPosition: (position: number) => void;
  /** Scroll to show a specific line at the top (does not move cursor) */
  scrollToLine: (line: number) => void;
  /** Get the first visible line number in the viewport (1-indexed) */
  getFirstVisibleLine: () => number;
  /** Get the last visible line number in the viewport (1-indexed) */
  getLastVisibleLine: () => number;
  /** Get total number of lines in document */
  getLineCount: () => number;

  // Folding
  /** Fold all foldable regions */
  foldAll: () => void;
  /** Unfold all folded regions */
  unfoldAll: () => void;

  // Legacy compatibility
  /** @deprecated Use insertAt instead */
  insertText: (text: string) => void;
  /** Get the underlying DOM element */
  getElement: () => HTMLDivElement | null;
}

/**
 * Props for MarkdownEditor component
 */
export interface MarkdownEditorProps {
  // Content (controlled/uncontrolled)
  /** Controlled markdown content */
  value?: string;
  /** Initial markdown content (uncontrolled) */
  defaultValue?: string;
  /** Called when content changes */
  onChange?: (markdown: string) => void;

  // Co-authoring
  /** Remote co-authors with their cursor positions */
  coAuthors?: CoAuthor[];

  // Editor options
  /** Make editor read-only */
  readOnly?: boolean;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Show line numbers in gutter */
  showLineNumbers?: boolean;
  /** Tab size in spaces (default: 2) */
  tabSize?: number;
  /**
   * Additional CodeMirror extensions to add to the editor.
   * Useful for collaborative editing (Yjs) or custom functionality.
   */
  extensions?: import('@codemirror/state').Extension[];
  /**
   * Disable built-in history (undo/redo) extension.
   * Set to true when using external undo manager (e.g., Yjs UndoManager).
   */
  disableBuiltInHistory?: boolean;

  // Size
  /** Editor height */
  height?: string | number;
  /** Minimum height */
  minHeight?: string | number;
  /** Maximum height */
  maxHeight?: string | number;

  // Callbacks
  /** Called when editor is fully initialized */
  onEditorReady?: (ref: MarkdownEditorRef) => void;
  /** Called when selection changes */
  onSelectionChange?: (start: number, end: number) => void;
  /** Called when editor gains focus */
  onFocus?: () => void;
  /** Called when editor loses focus */
  onBlur?: () => void;
  /**
   * Called when coAuthor positions need to be updated due to document changes.
   * This callback fires when the user types in the editor and coAuthor positions
   * are mapped to new locations. Parent components MUST update their coAuthors
   * state with these new positions to maintain cursor stability.
   */
  onCoAuthorsChange?: (coAuthors: CoAuthor[]) => void;

  // Styling
  /** Additional CSS class name */
  className?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
}
