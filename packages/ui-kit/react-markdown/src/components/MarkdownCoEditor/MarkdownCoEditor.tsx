/**
 * MarkdownCoEditor component
 *
 * A split-pane collaborative markdown editor inspired by HackMD.
 * Left side: CodeMirror editor with collaborator cursors
 * Right side: Live rendered preview
 *
 * Uses CodeMirror 6 for proper collaborative editing support -
 * unlike a textarea, CodeMirror allows programmatic edits without
 * disrupting the user's cursor position.
 */

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { EditorState, Transaction } from '@codemirror/state';
import { EditorView, keymap, placeholder as placeholderExt, lineNumbers } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { MarkdownRenderer } from '../MarkdownRenderer';
import type { Collaborator, CollaboratorEdit } from '../../types/collaborator';
import styles from './MarkdownCoEditor.module.css';

export interface MarkdownCoEditorProps {
  /** Initial markdown content */
  value?: string;
  /** Controlled markdown content */
  markdown?: string;
  /** Change handler */
  onChange?: (markdown: string) => void;
  /** Show preview pane */
  showPreview?: boolean;
  /** Preview position */
  previewPosition?: 'right' | 'bottom';
  /** Editor height */
  height?: string | number;
  /** Min height */
  minHeight?: string | number;
  /** Read-only mode */
  readOnly?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Initial collaborators */
  collaborators?: Collaborator[];
  /** Additional class name */
  className?: string;
  /** Enable line wrapping (default: true) */
  lineWrapping?: boolean;
  /** Show line numbers */
  showLineNumbers?: boolean;
}

export interface MarkdownCoEditorRef {
  /** Get current markdown */
  getMarkdown: () => string;
  /** Set markdown content */
  setMarkdown: (markdown: string) => void;
  /** Focus editor */
  focus: () => void;
  /** Add a collaborator */
  addCollaborator: (collaborator: Collaborator) => void;
  /** Remove a collaborator */
  removeCollaborator: (id: string) => void;
  /** Start a streaming edit for a collaborator */
  streamEdit: (edit: CollaboratorEdit) => void;
  /** Set cursor position for a collaborator */
  setCursorPosition: (collaboratorId: string, position: number) => void;
  /** Set selection range for a collaborator (anchor is where selection started, head is where cursor is) */
  setSelection: (collaboratorId: string, anchor: number, head: number) => void;
  /** Get all collaborators */
  getCollaborators: () => Collaborator[];
  /** Get EditorView instance */
  getEditorView: () => EditorView | null;
}

// Selection range for a collaborator
interface SelectionRange {
  anchor: number; // Where selection started
  head: number;   // Where cursor is (end of selection)
}

// Collaborator cursor widget for CodeMirror
interface CursorWidget {
  collaborator: Collaborator;
  position: number;
  element: HTMLElement;
  selectionElements?: HTMLElement[]; // Selection highlight elements
}

export const MarkdownCoEditor = forwardRef<MarkdownCoEditorRef, MarkdownCoEditorProps>(
  function MarkdownCoEditor(
    {
      value = '',
      markdown: controlledMarkdown,
      onChange,
      showPreview = true,
      previewPosition = 'right',
      height,
      minHeight = '300px',
      readOnly = false,
      placeholder = 'Write markdown here...',
      collaborators: initialCollaborators = [],
      className,
      lineWrapping = true,
      showLineNumbers = false,
    },
    ref
  ) {
    // State
    const [content, setContent] = useState(controlledMarkdown ?? value);
    const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(
      () => new Map(initialCollaborators.map((c) => [c.id, c]))
    );
    const [cursorPositions, setCursorPositions] = useState<Map<string, number>>(
      () => new Map()
    );
    const [selections, setSelections] = useState<Map<string, SelectionRange>>(
      () => new Map()
    );

    // Refs
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const editorViewRef = useRef<EditorView | null>(null);
    const streamingTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const cursorPositionsRef = useRef<Map<string, number>>(new Map());
    const selectionsRef = useRef<Map<string, SelectionRange>>(new Map());
    const cursorWidgetsRef = useRef<Map<string, CursorWidget>>(new Map());
    const isInternalUpdate = useRef(false);

    // Initialize CodeMirror
    useEffect(() => {
      if (!editorContainerRef.current || editorViewRef.current) return;

      const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged && !isInternalUpdate.current) {
          const newContent = update.state.doc.toString();
          setContent(newContent);
          onChange?.(newContent);

          // Adjust collaborator cursors based on the changes
          update.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
            const deletedLength = toA - fromA;
            const insertedLength = inserted.length;
            const delta = insertedLength - deletedLength;

            if (delta !== 0) {
              cursorPositionsRef.current.forEach((pos, id) => {
                if (pos >= toA) {
                  // Cursor is after the change - shift it
                  const newPos = Math.max(fromA, pos + delta);
                  cursorPositionsRef.current.set(id, newPos);
                  setCursorPositions((prev) => {
                    const next = new Map(prev);
                    next.set(id, newPos);
                    return next;
                  });
                } else if (pos > fromA && pos < toA) {
                  // Cursor was inside deleted range - move to start of change
                  cursorPositionsRef.current.set(id, fromA);
                  setCursorPositions((prev) => {
                    const next = new Map(prev);
                    next.set(id, fromA);
                    return next;
                  });
                }
              });
            }
          });
        }
      });

      // Build extensions array based on props
      const extensions = [
        markdown(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        placeholderExt(placeholder),
        updateListener,
        EditorView.editable.of(!readOnly),
      ];

      // Add line wrapping if enabled
      if (lineWrapping) {
        extensions.push(EditorView.lineWrapping);
      }

      // Add line numbers if enabled
      if (showLineNumbers) {
        extensions.push(lineNumbers());
      }

      // Add theme
      extensions.push(EditorView.theme({
        '&': {
          height: '100%',
          flex: '1',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: "'SF Mono', 'Consolas', 'Monaco', monospace",
          fontSize: '14px',
          lineHeight: '1.5',
        },
        '.cm-content': {
          padding: '12px',
          minHeight: '100%',
        },
        '.cm-focused': {
          outline: 'none',
        },
        '.cm-line': {
          padding: '0',
        },
      }));

      const state = EditorState.create({
        doc: controlledMarkdown ?? value,
        extensions,
      });

      const view = new EditorView({
        state,
        parent: editorContainerRef.current,
      });

      editorViewRef.current = view;

      return () => {
        view.destroy();
        editorViewRef.current = null;
      };
    }, []);

    // Sync controlled content
    useEffect(() => {
      if (
        controlledMarkdown !== undefined &&
        editorViewRef.current &&
        controlledMarkdown !== editorViewRef.current.state.doc.toString()
      ) {
        isInternalUpdate.current = true;
        const view = editorViewRef.current;
        view.dispatch({
          changes: {
            from: 0,
            to: view.state.doc.length,
            insert: controlledMarkdown,
          },
        });
        setContent(controlledMarkdown);
        isInternalUpdate.current = false;
      }
    }, [controlledMarkdown]);

    // Helper to render selection rectangles for a range
    // Handles wrapped lines by creating multiple rectangles per visual row
    const renderSelectionRects = useCallback((
      view: EditorView,
      scroller: HTMLElement,
      scrollerRect: DOMRect,
      widget: CursorWidget,
      selection: SelectionRange
    ) => {
      // Remove old selection elements
      widget.selectionElements?.forEach(el => el.remove());
      widget.selectionElements = [];

      const from = Math.min(selection.anchor, selection.head);
      const to = Math.max(selection.anchor, selection.head);

      if (from === to) return; // No selection, just cursor

      // Get document length to clamp positions
      const docLength = view.state.doc.length;
      const clampedFrom = Math.min(from, docLength);
      const clampedTo = Math.min(to, docLength);

      // Get line info for the selection range
      const fromLine = view.state.doc.lineAt(clampedFrom);
      const toLine = view.state.doc.lineAt(clampedTo);

      // Render selection for each document line
      for (let lineNum = fromLine.number; lineNum <= toLine.number; lineNum++) {
        const line = view.state.doc.line(lineNum);
        const lineSelStart = lineNum === fromLine.number ? clampedFrom : line.from;
        const lineSelEnd = lineNum === toLine.number ? clampedTo : line.to;

        // For wrapped lines, we need to handle each visual row separately
        // Walk through the selection and detect when we move to a new visual row
        let currentRowStart = lineSelStart;
        let lastTop: number | null = null;

        for (let pos = lineSelStart; pos <= lineSelEnd; pos++) {
          const coords = view.coordsAtPos(pos);
          if (!coords) continue;

          const isNewRow = lastTop !== null && Math.abs(coords.top - lastTop) > 2;
          const isEnd = pos === lineSelEnd;

          if (isNewRow || isEnd) {
            // End of current visual row or end of selection
            const rowEnd = isNewRow ? pos - 1 : pos;
            const startCoords = view.coordsAtPos(currentRowStart);
            const endCoords = view.coordsAtPos(rowEnd);

            if (startCoords && endCoords) {
              const selEl = document.createElement('div');
              selEl.className = styles.selectionHighlight;
              selEl.style.backgroundColor = widget.collaborator.color;

              const top = startCoords.top - scrollerRect.top + scroller.scrollTop;
              const left = startCoords.left - scrollerRect.left + scroller.scrollLeft;
              const width = endCoords.left - startCoords.left;
              const height = startCoords.bottom - startCoords.top;

              selEl.style.top = `${top}px`;
              selEl.style.left = `${left}px`;
              selEl.style.width = `${Math.max(width, 2)}px`;
              selEl.style.height = `${height}px`;

              scroller.appendChild(selEl);
              widget.selectionElements!.push(selEl);
            }

            if (isNewRow) {
              currentRowStart = pos;
            }
          }

          lastTop = coords.top;
        }
      }
    }, []);

    // Function to update cursor widget positions
    const updateCursorPositions = useCallback(() => {
      const view = editorViewRef.current;
      if (!view) return;

      // Get the scroller element for proper coordinate calculation
      const scroller = view.scrollDOM;
      const scrollerRect = scroller.getBoundingClientRect();
      const maxLeft = scroller.clientWidth - 20; // Leave room for cursor label

      cursorWidgetsRef.current.forEach((widget, collaboratorId) => {
        const position = cursorPositionsRef.current.get(collaboratorId);
        if (position === undefined) return;

        // Get pixel coordinates for position
        const coords = view.coordsAtPos(Math.min(position, view.state.doc.length));
        if (!coords) {
          widget.element.style.display = 'none';
          // Also hide selection elements
          widget.selectionElements?.forEach(el => el.style.display = 'none');
          return;
        }

        widget.element.style.display = '';
        // Position relative to scroller, accounting for scroll
        const top = coords.top - scrollerRect.top + scroller.scrollTop;
        let left = coords.left - scrollerRect.left + scroller.scrollLeft;

        // Clamp left position to stay within editor bounds
        left = Math.max(0, Math.min(left, maxLeft));

        widget.element.style.top = `${top}px`;
        widget.element.style.left = `${left}px`;

        // Render selection highlight if there's a selection
        const selection = selectionsRef.current.get(collaboratorId);
        if (selection) {
          renderSelectionRects(view, scroller, scrollerRect, widget, selection);
        } else {
          // Clear selection elements if no selection
          widget.selectionElements?.forEach(el => el.remove());
          widget.selectionElements = [];
        }
      });
    }, [renderSelectionRects]);

    // Update cursor widgets when positions change
    useEffect(() => {
      const view = editorViewRef.current;
      if (!view) return;

      // Remove old widgets that no longer have positions
      cursorWidgetsRef.current.forEach((widget, id) => {
        if (!cursorPositions.has(id)) {
          widget.element.remove();
          cursorWidgetsRef.current.delete(id);
        }
      });

      // Create or update widgets
      cursorPositions.forEach((position, collaboratorId) => {
        const collaborator = collaborators.get(collaboratorId);
        if (!collaborator) return;

        // Check if widget already exists
        let widget = cursorWidgetsRef.current.get(collaboratorId);

        if (!widget) {
          // Create cursor element
          const cursorEl = document.createElement('div');
          cursorEl.className = `${styles.cursor} ${
            collaborator.status === 'typing' ? styles.cursorTyping : styles.cursorIdle
          }`;
          cursorEl.style.setProperty('--cursor-color', collaborator.color);

          // Create cursor line
          const cursorLine = document.createElement('div');
          cursorLine.className = styles.cursorLine;
          cursorEl.appendChild(cursorLine);

          // Create label
          const label = document.createElement('div');
          label.className = styles.cursorLabel;
          label.style.backgroundColor = collaborator.color;

          if (collaborator.isAI) {
            const aiIcon = document.createElement('span');
            aiIcon.className = styles.aiIcon;
            aiIcon.textContent = '✨';
            label.appendChild(aiIcon);
          }

          const nameSpan = document.createElement('span');
          nameSpan.className = styles.cursorName;
          nameSpan.textContent = collaborator.name;
          label.appendChild(nameSpan);

          cursorEl.appendChild(label);

          // Add to the scroller element so it scrolls with content
          view.scrollDOM.appendChild(cursorEl);

          widget = {
            collaborator,
            position,
            element: cursorEl,
          };
          cursorWidgetsRef.current.set(collaboratorId, widget);
        }

        // Update typing status class and dots
        const cursorEl = widget.element;
        cursorEl.className = `${styles.cursor} ${
          collaborator.status === 'typing' ? styles.cursorTyping : styles.cursorIdle
        }`;

        // Update or add typing dots
        const label = cursorEl.querySelector(`.${styles.cursorLabel}`) as HTMLElement;
        if (label) {
          const existingDots = label.querySelector(`.${styles.typingDots}`);
          if (collaborator.status === 'typing' && !existingDots) {
            const dots = document.createElement('span');
            dots.className = styles.typingDots;
            dots.innerHTML = '<span></span><span></span><span></span>';
            label.appendChild(dots);
          } else if (collaborator.status !== 'typing' && existingDots) {
            existingDots.remove();
          }
        }

        widget.position = position;
      });

      // Update all cursor positions
      updateCursorPositions();
    }, [cursorPositions, collaborators, selections, updateCursorPositions]);

    // Update cursor positions on scroll
    useEffect(() => {
      const view = editorViewRef.current;
      if (!view) return;

      const scroller = view.scrollDOM;
      const handleScroll = () => updateCursorPositions();

      scroller.addEventListener('scroll', handleScroll);
      return () => scroller.removeEventListener('scroll', handleScroll);
    }, [updateCursorPositions]);

    // Add collaborator
    const addCollaborator = useCallback((collaborator: Collaborator) => {
      setCollaborators((prev) => {
        const next = new Map(prev);
        next.set(collaborator.id, collaborator);
        return next;
      });
    }, []);

    // Remove collaborator
    const removeCollaborator = useCallback((id: string) => {
      // Clear any streaming timer
      const timer = streamingTimersRef.current.get(id);
      if (timer) clearTimeout(timer);
      streamingTimersRef.current.delete(id);
      cursorPositionsRef.current.delete(id);
      selectionsRef.current.delete(id);

      // Remove cursor widget and selection elements
      const widget = cursorWidgetsRef.current.get(id);
      if (widget) {
        widget.element.remove();
        widget.selectionElements?.forEach(el => el.remove());
        cursorWidgetsRef.current.delete(id);
      }

      setCollaborators((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      setCursorPositions((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      setSelections((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    }, []);

    // Set cursor position
    const setCursorPosition = useCallback((collaboratorId: string, position: number) => {
      cursorPositionsRef.current.set(collaboratorId, position);
      setCursorPositions((prev) => {
        const next = new Map(prev);
        next.set(collaboratorId, position);
        return next;
      });
      // Clear selection when just setting cursor position
      selectionsRef.current.delete(collaboratorId);
      setSelections((prev) => {
        const next = new Map(prev);
        next.delete(collaboratorId);
        return next;
      });
    }, []);

    // Set selection range
    const setSelection = useCallback((collaboratorId: string, anchor: number, head: number) => {
      // Set cursor to head position
      cursorPositionsRef.current.set(collaboratorId, head);
      setCursorPositions((prev) => {
        const next = new Map(prev);
        next.set(collaboratorId, head);
        return next;
      });
      // Set selection range
      const range = { anchor, head };
      selectionsRef.current.set(collaboratorId, range);
      setSelections((prev) => {
        const next = new Map(prev);
        next.set(collaboratorId, range);
        return next;
      });
    }, []);

    // Update collaborator status
    const updateCollaboratorStatus = useCallback(
      (collaboratorId: string, status: Collaborator['status']) => {
        setCollaborators((prev) => {
          const collaborator = prev.get(collaboratorId);
          if (!collaborator) return prev;
          const next = new Map(prev);
          next.set(collaboratorId, { ...collaborator, status });
          return next;
        });
      },
      []
    );

    // Stream edit - insert text character by character
    const streamEdit = useCallback(
      (edit: CollaboratorEdit) => {
        const collaborator = collaborators.get(edit.collaboratorId);
        if (!collaborator) return;

        const view = editorViewRef.current;
        if (!view) return;

        const textContent = edit.content || '';
        const streamSpeed = edit.streamSpeed || 25;
        const startPosition = Math.min(edit.position, view.state.doc.length);

        // For non-streaming, insert all at once
        if (!edit.stream) {
          isInternalUpdate.current = true;
          view.dispatch({
            changes: { from: startPosition, insert: textContent },
          });
          const newContent = view.state.doc.toString();
          setContent(newContent);
          onChange?.(newContent);
          isInternalUpdate.current = false;

          setCursorPosition(edit.collaboratorId, startPosition + textContent.length);

          // Adjust other cursors
          cursorPositionsRef.current.forEach((pos, id) => {
            if (id !== edit.collaboratorId && pos >= startPosition) {
              setCursorPosition(id, pos + textContent.length);
            }
          });
          return;
        }

        // Streaming edit
        let charIndex = 0;
        cursorPositionsRef.current.set(edit.collaboratorId, startPosition);
        updateCollaboratorStatus(edit.collaboratorId, 'typing');
        setCursorPosition(edit.collaboratorId, startPosition);

        const streamNextChar = () => {
          if (charIndex >= textContent.length) {
            // Done streaming
            updateCollaboratorStatus(edit.collaboratorId, 'idle');
            return;
          }

          const currentView = editorViewRef.current;
          if (!currentView) return;

          const nextChar = textContent[charIndex];
          const insertPos = cursorPositionsRef.current.get(edit.collaboratorId) ?? startPosition;

          // Insert character using CodeMirror's dispatch
          // This preserves the user's cursor position!
          isInternalUpdate.current = true;
          currentView.dispatch({
            changes: { from: insertPos, insert: nextChar },
            // Don't move the user's selection - key to collaborative editing
            annotations: Transaction.userEvent.of('input.collab'),
          });
          const newContent = currentView.state.doc.toString();
          setContent(newContent);
          onChange?.(newContent);
          isInternalUpdate.current = false;

          // Update collaborator cursor position
          const newPos = insertPos + 1;
          cursorPositionsRef.current.set(edit.collaboratorId, newPos);
          setCursorPosition(edit.collaboratorId, newPos);

          // Adjust other collaborators' positions (not the user's - CodeMirror handles that)
          cursorPositionsRef.current.forEach((pos, id) => {
            if (id !== edit.collaboratorId && pos >= insertPos) {
              const adjustedPos = pos + 1;
              cursorPositionsRef.current.set(id, adjustedPos);
              setCursorPosition(id, adjustedPos);
            }
          });

          charIndex++;

          // Schedule next character
          const timer = setTimeout(streamNextChar, streamSpeed);
          streamingTimersRef.current.set(edit.collaboratorId, timer);
        };

        // Start streaming
        const timer = setTimeout(streamNextChar, streamSpeed);
        streamingTimersRef.current.set(edit.collaboratorId, timer);
      },
      [collaborators, onChange, setCursorPosition, updateCollaboratorStatus]
    );

    // Cleanup streaming timers
    useEffect(() => {
      return () => {
        streamingTimersRef.current.forEach((timer) => clearTimeout(timer));
      };
    }, []);

    // Imperative handle
    useImperativeHandle(
      ref,
      () => ({
        getMarkdown: () => editorViewRef.current?.state.doc.toString() ?? content,
        setMarkdown: (md: string) => {
          const view = editorViewRef.current;
          if (view) {
            isInternalUpdate.current = true;
            view.dispatch({
              changes: { from: 0, to: view.state.doc.length, insert: md },
            });
            setContent(md);
            onChange?.(md);
            isInternalUpdate.current = false;
          }
        },
        focus: () => editorViewRef.current?.focus(),
        addCollaborator,
        removeCollaborator,
        streamEdit,
        setCursorPosition,
        setSelection,
        getCollaborators: () => Array.from(collaborators.values()),
        getEditorView: () => editorViewRef.current,
      }),
      [content, onChange, addCollaborator, removeCollaborator, streamEdit, setCursorPosition, setSelection, collaborators]
    );

    const containerStyle: React.CSSProperties = {
      height,
      minHeight,
    };

    return (
      <div
        className={`${styles.container} ${
          previewPosition === 'bottom' ? styles.vertical : styles.horizontal
        } ${className || ''}`}
        style={containerStyle}
      >
        {/* Editor pane */}
        <div className={styles.editorPane}>
          <div className={styles.editorHeader}>
            <span className={styles.editorLabel}>Markdown</span>
            {collaborators.size > 0 && (
              <div className={styles.collaboratorAvatars}>
                {Array.from(collaborators.values()).map((c) => (
                  <div
                    key={c.id}
                    className={`${styles.avatar} ${c.status === 'typing' ? styles.typing : ''}`}
                    style={{ backgroundColor: c.color }}
                    title={`${c.name}${c.status === 'typing' ? ' (typing...)' : ''}`}
                  >
                    {c.isAI ? '✨' : c.name.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.editorWrapper} ref={editorContainerRef} />
        </div>

        {/* Preview pane */}
        {showPreview && (
          <div className={styles.previewPane}>
            <div className={styles.previewHeader}>
              <span className={styles.previewLabel}>Preview</span>
            </div>
            <div className={styles.previewContent}>
              <MarkdownRenderer content={content} />
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default MarkdownCoEditor;
