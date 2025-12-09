/**
 * useCollaborators hook
 *
 * Manages multiple collaborators editing the same document,
 * including cursor positions and streaming edits.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import type {
  Collaborator,
  CollaboratorCursor,
  CollaboratorEdit,
  StreamingEdit,
  UseCollaboratorsOptions,
  UseCollaboratorsReturn,
  CollaboratorStatus,
} from '../types/collaborator';

export function useCollaborators(
  editor: Editor | null,
  options: UseCollaboratorsOptions = {}
): UseCollaboratorsReturn {
  const {
    initialCollaborators = [],
    onCursorMove,
    onStatusChange,
    onEditComplete,
  } = options;

  // State
  const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(
    () => new Map(initialCollaborators.map((c) => [c.id, c]))
  );
  const [cursors, setCursors] = useState<Map<string, CollaboratorCursor>>(
    () => new Map()
  );
  const [streamingEdits, setStreamingEdits] = useState<Map<string, StreamingEdit>>(
    () => new Map()
  );

  // Refs for animation frames
  const streamingTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup streaming timers on unmount
  useEffect(() => {
    return () => {
      streamingTimersRef.current.forEach((timer) => clearTimeout(timer));
      streamingTimersRef.current.clear();
    };
  }, []);

  // Add a collaborator
  const addCollaborator = useCallback((collaborator: Collaborator) => {
    setCollaborators((prev) => {
      const next = new Map(prev);
      next.set(collaborator.id, collaborator);
      return next;
    });
  }, []);

  // Remove a collaborator
  const removeCollaborator = useCallback((id: string) => {
    // Clear any active streaming
    const timer = streamingTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      streamingTimersRef.current.delete(id);
    }

    setCollaborators((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });

    setCursors((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });

    setStreamingEdits((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // Set cursor position
  const setCursorPosition = useCallback(
    (collaboratorId: string, position: number) => {
      setCursors((prev) => {
        const next = new Map(prev);
        next.set(collaboratorId, {
          collaboratorId,
          position,
        });
        return next;
      });

      onCursorMove?.(collaboratorId, position);
    },
    [onCursorMove]
  );

  // Update collaborator status
  const updateStatus = useCallback(
    (collaboratorId: string, status: CollaboratorStatus) => {
      setCollaborators((prev) => {
        const collaborator = prev.get(collaboratorId);
        if (!collaborator || collaborator.status === status) return prev;

        const next = new Map(prev);
        next.set(collaboratorId, { ...collaborator, status });
        return next;
      });

      onStatusChange?.(collaboratorId, status);
    },
    [onStatusChange]
  );

  // Start a streaming edit
  const startStreamingEdit = useCallback(
    (edit: CollaboratorEdit) => {
      if (!editor) return;

      const collaborator = collaborators.get(edit.collaboratorId);
      if (!collaborator) return;

      const content = edit.content || '';
      const streamSpeed = edit.streamSpeed || 30; // Default 30ms per char

      // If not streaming, insert all at once
      if (!edit.stream) {
        editor
          .chain()
          .focus()
          .insertContentAt(edit.position, content)
          .run();

        // Update cursor position
        setCursorPosition(edit.collaboratorId, edit.position + content.length);
        onEditComplete?.(edit.collaboratorId, content);
        return;
      }

      // Set up streaming edit state
      const streamingEdit: StreamingEdit = {
        collaborator,
        fullContent: content,
        displayedContent: '',
        currentIndex: 0,
        startPosition: edit.position,
        isComplete: false,
      };

      setStreamingEdits((prev) => {
        const next = new Map(prev);
        next.set(edit.collaboratorId, streamingEdit);
        return next;
      });

      // Update status to typing
      updateStatus(edit.collaboratorId, 'typing');

      // Stream characters one by one
      const streamNextChar = () => {
        setStreamingEdits((prev) => {
          const current = prev.get(edit.collaboratorId);
          if (!current || current.currentIndex >= current.fullContent.length) {
            // Streaming complete
            if (current) {
              const finalEdit = { ...current, isComplete: true };
              const next = new Map(prev);
              next.set(edit.collaboratorId, finalEdit);

              // Update status to idle after a short delay
              setTimeout(() => {
                updateStatus(edit.collaboratorId, 'idle');
                setStreamingEdits((p) => {
                  const n = new Map(p);
                  n.delete(edit.collaboratorId);
                  return n;
                });
              }, 500);

              onEditComplete?.(edit.collaboratorId, current.fullContent);
              return next;
            }
            return prev;
          }

          // Insert next character
          const nextChar = current.fullContent[current.currentIndex];
          const insertPos = current.startPosition + current.currentIndex;

          // Use editor to insert - this preserves undo history
          editor.chain().insertContentAt(insertPos, nextChar).run();

          // Update streaming state
          const next = new Map(prev);
          next.set(edit.collaboratorId, {
            ...current,
            displayedContent: current.displayedContent + nextChar,
            currentIndex: current.currentIndex + 1,
          });

          // Update cursor position
          setCursorPosition(edit.collaboratorId, insertPos + 1);

          // Schedule next character
          const timer = setTimeout(streamNextChar, streamSpeed);
          streamingTimersRef.current.set(edit.collaboratorId, timer);

          return next;
        });
      };

      // Start streaming
      const timer = setTimeout(streamNextChar, streamSpeed);
      streamingTimersRef.current.set(edit.collaboratorId, timer);
    },
    [editor, collaborators, setCursorPosition, updateStatus, onEditComplete]
  );

  // Get cursor position
  const getCursorPosition = useCallback(
    (collaboratorId: string): number | null => {
      const cursor = cursors.get(collaboratorId);
      return cursor?.position ?? null;
    },
    [cursors]
  );

  // Get all cursors
  const getAllCursors = useCallback(() => {
    return new Map(cursors);
  }, [cursors]);

  // Check if streaming
  const isStreaming = useCallback(
    (collaboratorId: string): boolean => {
      const edit = streamingEdits.get(collaboratorId);
      return edit ? !edit.isComplete : false;
    },
    [streamingEdits]
  );

  // Get streaming progress
  const getStreamingProgress = useCallback(
    (collaboratorId: string): StreamingEdit | null => {
      return streamingEdits.get(collaboratorId) || null;
    },
    [streamingEdits]
  );

  return {
    collaborators: Array.from(collaborators.values()),
    addCollaborator,
    removeCollaborator,
    setCursorPosition,
    startStreamingEdit,
    getCursorPosition,
    getAllCursors,
    isStreaming,
    getStreamingProgress,
  };
}

export default useCollaborators;
