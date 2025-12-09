/**
 * CollaborativeEditor component
 *
 * A markdown editor that supports multiple collaborators editing simultaneously.
 * Each collaborator has their own colored cursor and can stream edits in real-time.
 *
 * Key features:
 * - Multiple virtual cursors with name labels
 * - Streaming text insertion (character-by-character)
 * - Non-disruptive collaboration (your edits don't conflict)
 * - Visual feedback for who's typing where
 */

import {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import { MarkdownToolbar, type MarkdownToolbarProps } from '../MarkdownToolbar';
import type { Editor } from '@tiptap/react';
import type {
  Collaborator,
  CollaboratorEdit,
} from '../../types/collaborator';
import styles from './CollaborativeEditor.module.css';

export interface CollaborativeEditorProps {
  /** Initial markdown content */
  value?: string;
  /** Controlled markdown content */
  markdown?: string;
  /** Change handler */
  onChange?: (markdown: string) => void;
  /** Show toolbar */
  showToolbar?: boolean;
  /** Toolbar props */
  toolbarProps?: Partial<MarkdownToolbarProps>;
  /** Editor height */
  height?: string | number;
  /** Min height */
  minHeight?: string | number;
  /** Max height */
  maxHeight?: string | number;
  /** Read-only mode */
  readOnly?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Initial collaborators */
  collaborators?: Collaborator[];
  /** Called when editor is ready */
  onEditorReady?: (editor: Editor) => void;
  /** Additional class name */
  className?: string;
}

export interface CollaborativeEditorRef {
  /** Get editor instance */
  getEditor: () => Editor | null;
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
  /** Get all collaborators */
  getCollaborators: () => Collaborator[];
}

export const CollaborativeEditor = forwardRef<
  CollaborativeEditorRef,
  CollaborativeEditorProps
>(function CollaborativeEditor(
  {
    value,
    markdown,
    onChange,
    showToolbar = true,
    toolbarProps,
    height,
    minHeight = '200px',
    maxHeight,
    readOnly = false,
    placeholder = 'Start typing...',
    collaborators: initialCollaborators = [],
    onEditorReady,
    className,
  },
  ref
) {
  // Collaborator state
  const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(
    () => new Map(initialCollaborators.map((c) => [c.id, c]))
  );
  const [cursorPositions, setCursorPositions] = useState<Map<string, number>>(
    () => new Map()
  );

  // Track cursor positions in a ref for accurate streaming updates
  const cursorPositionsRef = useRef<Map<string, number>>(new Map());

  // Refs
  const streamingTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Force re-render trigger for cursor position updates
  const [cursorUpdateTrigger, setCursorUpdateTrigger] = useState(0);

  // Create editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: false,
        autolink: false, // Disable auto-linking during typing to prevent "real-time" from becoming a link
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value || markdown || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (onChange) {
        const md = editor.storage.markdown?.getMarkdown?.() || '';
        onChange(md);
      }
    },
  });

  // Notify when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Sync controlled markdown
  useEffect(() => {
    if (editor && markdown !== undefined) {
      const currentContent = editor.storage.markdown?.getMarkdown?.() || '';
      if (markdown !== currentContent) {
        editor.commands.setContent(markdown);
      }
    }
  }, [editor, markdown]);

  // Cleanup streaming timers
  useEffect(() => {
    return () => {
      streamingTimersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

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
    const timer = streamingTimersRef.current.get(id);
    if (timer) clearTimeout(timer);
    streamingTimersRef.current.delete(id);
    cursorPositionsRef.current.delete(id);

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
    setCursorUpdateTrigger((t) => t + 1);
  }, []);

  // Set cursor position - update both ref and state
  const setCursorPosition = useCallback(
    (collaboratorId: string, position: number) => {
      cursorPositionsRef.current.set(collaboratorId, position);
      setCursorPositions((prev) => {
        const next = new Map(prev);
        next.set(collaboratorId, position);
        return next;
      });
      // Trigger re-render for cursor position update
      setCursorUpdateTrigger((t) => t + 1);
    },
    []
  );

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

  // Stream edit
  const streamEdit = useCallback(
    (edit: CollaboratorEdit) => {
      if (!editor) return;

      const collaborator = collaborators.get(edit.collaboratorId);
      if (!collaborator) return;

      const content = edit.content || '';
      const streamSpeed = edit.streamSpeed || 25;

      // Non-streaming: insert all at once
      if (!edit.stream) {
        // Store current selection to restore after
        const { from: userFrom, to: userTo } = editor.state.selection;

        // Get current doc size and clamp position
        const docSize = editor.state.doc.content.size;
        const safePosition = Math.min(Math.max(1, edit.position), docSize);

        // Insert content at position using transaction for proper text handling
        const { tr } = editor.state;
        tr.insertText(content, safePosition);
        editor.view.dispatch(tr);

        // Calculate offset if user selection was after the insertion
        const insertedLength = content.length;
        let newFrom = userFrom;
        let newTo = userTo;

        if (userFrom >= safePosition) {
          newFrom += insertedLength;
          newTo += insertedLength;
        } else if (userTo > safePosition) {
          newTo += insertedLength;
        }

        // Restore user selection (clamped to new doc size)
        const newDocSize = editor.state.doc.content.size;
        editor.commands.setTextSelection({
          from: Math.min(newFrom, newDocSize),
          to: Math.min(newTo, newDocSize),
        });

        setCursorPosition(edit.collaboratorId, safePosition + content.length);
        return;
      }

      // Streaming edit - for concurrent edits, we need to track position
      // relative to a marker in the document, not an absolute position

      // Get initial position - clamp to valid range
      const initialDocSize = editor.state.doc.content.size;
      const initialPosition = Math.min(Math.max(1, edit.position), initialDocSize);

      // Start position is the initial position
      const startPosition = initialPosition;

      // Store initial position
      cursorPositionsRef.current.set(edit.collaboratorId, startPosition);
      let charIndex = 0;

      updateCollaboratorStatus(edit.collaboratorId, 'typing');
      setCursorPosition(edit.collaboratorId, startPosition);

      // Stream the FULL content including leading newlines
      // When we encounter \n, we'll handle it specially to create actual line breaks
      const streamContent = content;

      // Stream characters
      const streamNextChar = () => {
        if (charIndex >= streamContent.length) {
          // Streaming complete - the content was inserted character by character
          // with proper paragraph breaks for newlines, so no need to re-parse

          // Get final cursor position
          const finalPos = cursorPositionsRef.current.get(edit.collaboratorId) ?? startPosition;
          setCursorPosition(edit.collaboratorId, finalPos);

          setTimeout(() => {
            updateCollaboratorStatus(edit.collaboratorId, 'idle');
          }, 300);
          return;
        }

        const nextChar = streamContent[charIndex];

        // Get current insert position from ref
        const currentInsertPos = cursorPositionsRef.current.get(edit.collaboratorId) ?? initialPosition;

        // Save user selection
        const { from: userFrom, to: userTo } = editor.state.selection;

        // Clamp insert position to valid range
        const currentDocSize = editor.state.doc.content.size;
        const safeInsertPos = Math.min(Math.max(1, currentInsertPos), currentDocSize);

        let newInsertPos: number;
        let positionDelta: number;

        // For newlines, we need to create actual paragraph/line breaks in the DOM
        // NOT just insert \n as text, because TipTap doesn't render \n as line breaks
        if (nextChar === '\n') {
          // Position cursor at the insert point first
          editor.commands.setTextSelection(safeInsertPos);

          // Use splitBlock to create a new paragraph (like pressing Enter)
          // This creates an actual visual line break in TipTap
          editor.commands.splitBlock();

          // Get new position after the split
          const newDocSize = editor.state.doc.content.size;
          newInsertPos = editor.state.selection.from;
          positionDelta = newDocSize - currentDocSize;
        } else {
          // For all other characters (including spaces), use tr.insertText
          // which correctly preserves whitespace
          const { tr } = editor.state;
          tr.insertText(nextChar, safeInsertPos);
          editor.view.dispatch(tr);
          // Position advances by 1 for each character
          newInsertPos = safeInsertPos + 1;
          positionDelta = 1;
        }

        // Update our tracked position
        cursorPositionsRef.current.set(edit.collaboratorId, newInsertPos);
        charIndex++;

        // Adjust other collaborators' positions that are at or after our insertion
        cursorPositionsRef.current.forEach((pos, id) => {
          if (id !== edit.collaboratorId && pos >= safeInsertPos) {
            cursorPositionsRef.current.set(id, pos + positionDelta);
          }
        });

        // Restore user selection (adjusted for the insertion)
        const newDocSize = editor.state.doc.content.size;
        let newFrom = userFrom;
        let newTo = userTo;
        if (userFrom >= safeInsertPos) {
          newFrom += positionDelta;
          newTo += positionDelta;
        } else if (userTo > safeInsertPos) {
          newTo += positionDelta;
        }
        editor.commands.setTextSelection({
          from: Math.min(newFrom, newDocSize),
          to: Math.min(newTo, newDocSize),
        });

        // Update visual cursor position
        setCursorPosition(edit.collaboratorId, newInsertPos);

        // Schedule next character
        const timer = setTimeout(streamNextChar, streamSpeed);
        streamingTimersRef.current.set(edit.collaboratorId, timer);
      };

      // Start streaming
      const timer = setTimeout(streamNextChar, streamSpeed);
      streamingTimersRef.current.set(edit.collaboratorId, timer);
    },
    [editor, collaborators, setCursorPosition, updateCollaboratorStatus]
  );

  // Calculate cursor pixel positions - recalculate on trigger updates
  const [cursorElements, setCursorElements] = useState<Array<{
    collaborator: Collaborator;
    position: number;
    top: number;
    left: number;
    height: number;
  }>>([]);

  // Update cursor elements when positions change
  useEffect(() => {
    if (!editor || !editorContainerRef.current) {
      setCursorElements([]);
      return;
    }

    // Use requestAnimationFrame to ensure DOM is updated
    const frameId = requestAnimationFrame(() => {
      const wrapper = editorContainerRef.current;
      if (!wrapper) return;

      // Get the wrapper rect - this is what we position cursors relative to
      const wrapperRect = wrapper.getBoundingClientRect();
      // Account for scroll position since cursor is positioned absolute within scrollable wrapper
      const scrollTop = wrapper.scrollTop;
      const scrollLeft = wrapper.scrollLeft;

      // Use ref for positions to get the most up-to-date values
      const elements = Array.from(cursorPositionsRef.current.entries())
        .map(([collaboratorId, position]) => {
          const collaborator = collaborators.get(collaboratorId);
          if (!collaborator) return null;

          try {
            const docSize = editor.state.doc.content.size;
            const safePos = Math.min(Math.max(1, position), docSize - 1);
            const editorDom = editor.view.dom;

            // For positions near the end of document, use DOM walking
            // to find the actual last text node - coordsAtPos returns
            // incorrect values at document boundaries
            if (position >= docSize - 2) {
              // Use an object to hold the reference so TypeScript can track assignment
              const result: { node: Text | null } = { node: null };

              const walkNode = (node: Node) => {
                if (node.nodeType === Node.TEXT_NODE && (node as Text).length > 0) {
                  result.node = node as Text;
                } else {
                  for (let i = 0; i < node.childNodes.length; i++) {
                    walkNode(node.childNodes[i]);
                  }
                }
              };
              walkNode(editorDom);

              const lastTextNode = result.node;
              if (lastTextNode) {
                // Create a range that spans the last character (not collapsed)
                // This gives us the actual bounding box of that character
                const range = document.createRange();
                const textLength = lastTextNode.length;
                if (textLength > 0) {
                  // Select the last character to get its bounding box
                  range.setStart(lastTextNode, textLength - 1);
                  range.setEnd(lastTextNode, textLength);
                  const charRect = range.getBoundingClientRect();

                  // Use the character's rect - position cursor after the last char
                  // Position relative to the wrapper (where cursor is rendered)
                  // Add scrollTop/scrollLeft to account for scroll position
                  if (charRect.height > 0) {
                    return {
                      collaborator,
                      position: safePos,
                      top: charRect.top - wrapperRect.top + scrollTop,
                      left: charRect.right - wrapperRect.left + scrollLeft, // Use right edge (after the char)
                      height: charRect.height,
                    };
                  }
                }
              }
            }

            // Fall back to calculating from position using coordsAtPos
            const coords = editor.view.coordsAtPos(safePos);
            // coordsAtPos returns top and bottom, calculate height from the difference
            const lineHeight = coords.bottom - coords.top;

            return {
              collaborator,
              position: safePos,
              top: coords.top - wrapperRect.top + scrollTop,
              left: coords.left - wrapperRect.left + scrollLeft,
              height: lineHeight > 0 ? lineHeight : 20, // Default to 20px if height is 0
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean) as Array<{
        collaborator: Collaborator;
        position: number;
        top: number;
        left: number;
        height: number;
      }>;

      setCursorElements(elements);
    });

    return () => cancelAnimationFrame(frameId);
  }, [editor, cursorPositions, collaborators, cursorUpdateTrigger]);

  // Imperative handle
  useImperativeHandle(
    ref,
    () => ({
      getEditor: () => editor,
      getMarkdown: () => editor?.storage.markdown?.getMarkdown?.() || '',
      setMarkdown: (md: string) => editor?.commands.setContent(md),
      focus: () => editor?.commands.focus(),
      addCollaborator,
      removeCollaborator,
      streamEdit,
      setCursorPosition,
      getCollaborators: () => Array.from(collaborators.values()),
    }),
    [
      editor,
      addCollaborator,
      removeCollaborator,
      streamEdit,
      setCursorPosition,
      collaborators,
    ]
  );

  const wrapperStyle: React.CSSProperties = {
    height,
    minHeight,
    maxHeight,
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {showToolbar && <MarkdownToolbar editor={editor} {...toolbarProps} />}

      <div
        ref={editorContainerRef}
        className={styles.editorWrapper}
        style={wrapperStyle}
      >
        <EditorContent editor={editor} className={styles.editor} />

        {/* Render collaborator cursors */}
        {cursorElements.map(({ collaborator, top, left, height }) => (
          <div
            key={collaborator.id}
            className={`${styles.cursor} ${
              collaborator.status === 'typing' ? styles.typing : styles.idle
            }`}
            style={
              {
                '--cursor-color': collaborator.color,
                '--cursor-height': `${height}px`,
                top: `${top}px`,
                left: `${left}px`,
              } as React.CSSProperties
            }
          >
            <div className={styles.cursorLine} />
            <div
              className={styles.cursorLabel}
              style={{ backgroundColor: collaborator.color }}
            >
              {collaborator.isAI && <span className={styles.aiIcon}>✨</span>}
              <span className={styles.cursorName}>{collaborator.name}</span>
              {collaborator.status === 'typing' && (
                <span className={styles.typingDots}>
                  <span />
                  <span />
                  <span />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Collaborator presence bar */}
      {collaborators.size > 0 && (
        <div className={styles.presenceBar}>
          {Array.from(collaborators.values()).map((c) => (
            <div
              key={c.id}
              className={`${styles.presenceAvatar} ${
                c.status === 'typing' ? styles.typing : ''
              }`}
              style={{ backgroundColor: c.color }}
              title={`${c.name}${c.status === 'typing' ? ' (typing...)' : ''}`}
            >
              {c.isAI ? '✨' : c.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default CollaborativeEditor;
