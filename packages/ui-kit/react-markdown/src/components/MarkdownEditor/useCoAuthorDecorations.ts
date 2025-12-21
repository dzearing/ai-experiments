/**
 * Co-author cursor and selection decorations
 *
 * Provides visual indicators for remote co-authors:
 * - Cursor line with label showing author name
 * - Selection highlight in author's color
 * - Proper handling of cursor vs selection states
 *
 * Position mapping:
 * When the document changes, coAuthor positions are automatically mapped
 * to their new locations. The onCoAuthorsChange callback notifies the parent
 * so it can update its state with the new positions.
 */

import { useMemo, useEffect, useRef, useCallback } from 'react';
import {
  StateField,
  StateEffect,
  type Extension,
  RangeSetBuilder,
} from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  EditorView,
  WidgetType,
} from '@codemirror/view';
import type { CoAuthor } from './types';

/**
 * Effect to update co-author positions
 */
export const setCoAuthorsEffect = StateEffect.define<CoAuthor[]>();

/**
 * Widget for rendering a co-author cursor with label
 */
class CoAuthorCursorWidget extends WidgetType {
  constructor(
    private name: string,
    private color: string
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const cursor = document.createElement('span');
    cursor.className = 'cm-coauthor-cursor';
    cursor.setAttribute('data-coauthor', this.name);

    // Cursor line
    const line = document.createElement('span');
    line.className = 'cm-coauthor-cursor-line';
    line.style.backgroundColor = this.color;
    cursor.appendChild(line);

    // Label
    const label = document.createElement('span');
    label.className = 'cm-coauthor-cursor-label';
    label.textContent = this.name;
    label.style.backgroundColor = this.color;
    cursor.appendChild(label);

    return cursor;
  }

  eq(other: CoAuthorCursorWidget): boolean {
    return this.name === other.name && this.color === other.color;
  }

  // Tell CodeMirror this widget doesn't affect line height
  get estimatedHeight(): number {
    return -1; // -1 means inline, doesn't affect line height
  }

  ignoreEvent(): boolean {
    return true;
  }

  // Prevent widget from being destroyed/recreated unnecessarily
  updateDOM(): boolean {
    return false;
  }
}

/**
 * Build decorations for all co-authors
 */
function buildCoAuthorDecorations(
  coAuthors: CoAuthor[],
  docLength: number
): DecorationSet {
  // Handle empty case
  if (coAuthors.length === 0 || docLength < 0) {
    return Decoration.none;
  }

  // Collect all decorations with their positions and type for sorting
  // type: 0 = mark (has extent), 1 = widget (point decoration)
  const decorations: Array<{
    from: number;
    to: number;
    decoration: Decoration;
    type: number;
    authorIndex: number;
  }> = [];

  coAuthors.forEach((author, authorIndex) => {
    // Clamp positions to document length
    const start = Math.max(0, Math.min(author.selectionStart, docLength));
    const end = Math.max(start, Math.min(author.selectionEnd, docLength));

    if (start === end) {
      // Cursor only (no selection)
      const cursorWidget = Decoration.widget({
        widget: new CoAuthorCursorWidget(author.name, author.color),
        side: 1, // After the character
      });
      decorations.push({
        from: start,
        to: start,
        decoration: cursorWidget,
        type: 1,
        authorIndex,
      });
    } else {
      // Selection mark first (marks should come before widgets at same position)
      const selectionMark = Decoration.mark({
        class: 'cm-coauthor-selection',
        attributes: {
          style: `background-color: ${author.color}30;`,
          'data-coauthor': author.name,
        },
      });
      decorations.push({
        from: start,
        to: end,
        decoration: selectionMark,
        type: 0,
        authorIndex,
      });

      // Cursor at end of selection
      const cursorWidget = Decoration.widget({
        widget: new CoAuthorCursorWidget(author.name, author.color),
        side: 1,
      });
      decorations.push({
        from: end,
        to: end,
        decoration: cursorWidget,
        type: 1,
        authorIndex,
      });
    }
  });

  // Sort decorations: by from position, then by to position (marks before widgets),
  // then by type (marks=0 before widgets=1), then by author index for stability
  decorations.sort((a, b) => {
    if (a.from !== b.from) return a.from - b.from;
    if (a.to !== b.to) return a.to - b.to;
    if (a.type !== b.type) return a.type - b.type;
    return a.authorIndex - b.authorIndex;
  });

  // Build the decoration set in sorted order
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to, decoration } of decorations) {
    builder.add(from, to, decoration);
  }

  return builder.finish();
}

/**
 * StateField that manages co-author decorations.
 * Decorations are rebuilt when:
 * 1. Document changes (positions need to be mapped)
 * 2. Co-authors effect is dispatched
 */
const coAuthorField = StateField.define<{
  decorations: DecorationSet;
  coAuthors: CoAuthor[];
}>({
  create() {
    return {
      decorations: Decoration.none,
      coAuthors: [],
    };
  },

  update(state, tr) {
    let { coAuthors } = state;

    try {
      // Check for co-author update effect
      let hasNewCoAuthors = false;
      for (const effect of tr.effects) {
        if (effect.is(setCoAuthorsEffect)) {
          coAuthors = effect.value;
          hasNewCoAuthors = true;
          break; // Only process one effect
        }
      }

      // If we have NEW coAuthors from effect, use them directly WITHOUT mapping
      // The caller (applyRemoteUpdate) already calculated post-change positions
      if (hasNewCoAuthors) {
        const docLength = tr.state.doc.length;
        // Just clamp to valid bounds, don't map
        const clampedAuthors = coAuthors.map((author) => {
          let start = Math.max(0, Math.min(author.selectionStart, docLength));
          let end = Math.max(0, Math.min(author.selectionEnd, docLength));
          if (start > end) {
            [start, end] = [end, start];
          }
          return { ...author, selectionStart: start, selectionEnd: end };
        });
        const decorations = buildCoAuthorDecorations(clampedAuthors, docLength);
        return { decorations, coAuthors: clampedAuthors };
      }

      // If doc changed but NO effect, map existing positions through changes
      // This handles user typing (local edits) that need to shift coAuthor positions
      if (tr.docChanged && coAuthors.length > 0) {
        const docLength = tr.state.doc.length;
        const mappedAuthors = coAuthors.map((author) => {
          // Map positions through the document changes
          // Use assoc=1 (forward bias) for positions after insertions
          let start = tr.changes.mapPos(author.selectionStart, 1);
          let end = tr.changes.mapPos(author.selectionEnd, 1);

          // Ensure positions are within document bounds
          start = Math.max(0, Math.min(start, docLength));
          end = Math.max(0, Math.min(end, docLength));

          // Ensure start <= end
          if (start > end) {
            [start, end] = [end, start];
          }

          return {
            ...author,
            selectionStart: start,
            selectionEnd: end,
          };
        });
        const decorations = buildCoAuthorDecorations(mappedAuthors, docLength);
        return { decorations, coAuthors: mappedAuthors };
      }

      return state;
    } catch (e) {
      // If decoration building fails, return empty decorations to avoid crash
      console.warn('Failed to build coAuthor decorations:', e);
      return { decorations: Decoration.none, coAuthors };
    }
  },

  provide: (field) => EditorView.decorations.from(field, (state) => state.decorations),
});

/**
 * Theme for co-author cursor styling
 */
const coAuthorTheme = EditorView.theme({
  '.cm-coauthor-cursor': {
    position: 'relative',
    display: 'inline',
    width: '0',
    height: '1em',
    verticalAlign: 'text-bottom',
    pointerEvents: 'none',
  },

  '.cm-coauthor-cursor-line': {
    position: 'absolute',
    top: '-0.15em',
    left: '0',
    width: '2px',
    height: '1.3em',
    borderRadius: '1px',
    animation: 'coauthor-cursor-blink 1s ease-in-out infinite',
  },

  '.cm-coauthor-cursor-label': {
    position: 'absolute',
    bottom: '100%',
    left: '0',
    marginBottom: '2px',
    padding: '2px 6px',
    fontSize: '11px',
    fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
    fontWeight: '600',
    lineHeight: '1.2',
    color: 'white',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
    transform: 'translateX(-2px)',
    zIndex: '10',
  },

  '.cm-coauthor-selection': {
    borderRadius: '2px',
  },

  '@keyframes coauthor-cursor-blink': {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.3' },
  },
});

/**
 * Combined extension for co-author decorations.
 * Use this as the main extension and dispatch setCoAuthorsEffect to update.
 */
export const coAuthorExtension: Extension = [
  coAuthorField,
  coAuthorTheme,
];

/**
 * Get the current mapped coAuthor positions from the editor state.
 * This reads the positions that have been mapped through document changes.
 */
export function getMappedCoAuthors(view: EditorView): CoAuthor[] {
  const fieldState = view.state.field(coAuthorField, false);
  return fieldState?.coAuthors ?? [];
}

/**
 * Hook to manage co-author decorations in an EditorView.
 *
 * @param view - The CodeMirror EditorView instance
 * @param coAuthors - Co-author positions from parent component
 * @param onCoAuthorsChange - Callback when positions change due to document edits
 * @param disabled - Skip all logic (used when yCollab handles cursors instead)
 */
export function useCoAuthorDecorations(
  view: EditorView | null,
  coAuthors: CoAuthor[],
  onCoAuthorsChange?: (coAuthors: CoAuthor[]) => void,
  disabled?: boolean
): Extension {
  // Track the last positions we sent to parent to avoid infinite loops
  const lastReportedPositionsRef = useRef<string>('');
  // Track whether we've done the initial dispatch
  const initialDispatchDoneRef = useRef(false);

  // When disabled (e.g., yCollab handles cursors), skip all logic but maintain hook call order
  const isDisabled = disabled ?? false;
  // Stable callback ref
  const onCoAuthorsChangeRef = useRef(onCoAuthorsChange);
  onCoAuthorsChangeRef.current = onCoAuthorsChange;

  // Serialize positions for comparison
  const serializePositions = useCallback((authors: CoAuthor[]): string => {
    return authors
      .map((a) => `${a.id}:${a.selectionStart}:${a.selectionEnd}`)
      .sort()
      .join('|');
  }, []);

  // Initial coAuthor setup - only dispatch ONCE when view becomes available
  // After initial setup, all updates should go through the imperative API
  // (applyRemoteUpdate or updateCoAuthors)
  useEffect(() => {
    if (isDisabled) return; // Skip when yCollab handles cursors
    if (!view || initialDispatchDoneRef.current) return;
    if (coAuthors.length === 0) return;

    // Mark as done before dispatch to prevent race conditions
    initialDispatchDoneRef.current = true;

    const docLength = view.state.doc.length;
    const validatedCoAuthors = coAuthors.map((author) => {
      const start = Math.max(0, Math.min(author.selectionStart, docLength));
      const end = Math.max(0, Math.min(author.selectionEnd, docLength));
      if (start === author.selectionStart && end === author.selectionEnd) {
        return author;
      }
      return { ...author, selectionStart: start, selectionEnd: end };
    });

    try {
      view.dispatch({
        effects: setCoAuthorsEffect.of(validatedCoAuthors),
      });
      lastReportedPositionsRef.current = serializePositions(validatedCoAuthors);
    } catch (e) {
      console.warn('Failed to dispatch initial coAuthors:', e);
      initialDispatchDoneRef.current = false; // Allow retry
    }
  }, [view, coAuthors, serializePositions, isDisabled]);

  // Monitor for position changes from document edits and report to parent
  useEffect(() => {
    if (isDisabled) return; // Skip when yCollab handles cursors
    if (!view || !onCoAuthorsChangeRef.current) return;

    // Use MutationObserver to detect document changes and check position updates
    let frameId: number | null = null;

    const checkPositions = () => {
      if (!view) return;

      const mappedAuthors = getMappedCoAuthors(view);
      if (mappedAuthors.length === 0) return;

      const mappedPositions = serializePositions(mappedAuthors);

      if (mappedPositions !== lastReportedPositionsRef.current) {
        lastReportedPositionsRef.current = mappedPositions;
        onCoAuthorsChangeRef.current?.(mappedAuthors);
      }
    };

    // Use MutationObserver on editor content as a proxy for document changes
    const observer = new MutationObserver(() => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(checkPositions);
    });

    observer.observe(view.contentDOM, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [view, serializePositions, isDisabled]);

  // Return the extension (memoized)
  return useMemo(() => coAuthorExtension, []);
}

export default useCoAuthorDecorations;
