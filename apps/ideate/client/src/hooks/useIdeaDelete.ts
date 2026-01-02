import { useState, useCallback } from 'react';

interface UseIdeaDeleteOptions {
  /** Delete function - allows different delete implementations (global vs scoped) */
  deleteIdea: (ideaId: string) => Promise<boolean>;
  /** Called after successful delete */
  onDeleted?: (ideaId: string) => void;
}

interface UseIdeaDeleteReturn {
  /** Whether the delete confirmation dialog is open */
  deleteDialogOpen: boolean;
  /** The ID of the idea pending deletion (for dialog display) */
  pendingDeleteId: string | null;
  /** The title of the idea pending deletion (for dialog display) */
  pendingDeleteTitle: string | null;
  /** Request deletion of an idea (shows confirmation dialog) */
  requestDelete: (ideaId: string, title: string) => void;
  /** Confirm the pending deletion */
  confirmDelete: () => Promise<void>;
  /** Cancel the pending deletion */
  cancelDelete: () => void;
  /** Delete immediately without confirmation */
  deleteImmediate: (ideaId: string) => Promise<void>;
  /** Handle keyboard events for delete (Delete/Backspace key) */
  handleDeleteKeyDown: (e: React.KeyboardEvent, selectedId: string | null, getTitle: (id: string) => string | undefined) => void;
}

/**
 * Hook for handling idea deletion with confirmation dialog support.
 * Shared between Ideas page and ThingIdeas component.
 */
export function useIdeaDelete(options: UseIdeaDeleteOptions): UseIdeaDeleteReturn {
  const { deleteIdea, onDeleted } = options;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteTitle, setPendingDeleteTitle] = useState<string | null>(null);

  const requestDelete = useCallback((ideaId: string, title: string) => {
    setPendingDeleteId(ideaId);
    setPendingDeleteTitle(title);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (pendingDeleteId) {
      await deleteIdea(pendingDeleteId);
      onDeleted?.(pendingDeleteId);
    }
    setDeleteDialogOpen(false);
    setPendingDeleteId(null);
    setPendingDeleteTitle(null);
  }, [pendingDeleteId, deleteIdea, onDeleted]);

  const cancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setPendingDeleteId(null);
    setPendingDeleteTitle(null);
  }, []);

  const deleteImmediate = useCallback(async (ideaId: string) => {
    await deleteIdea(ideaId);
    onDeleted?.(ideaId);
  }, [deleteIdea, onDeleted]);

  const handleDeleteKeyDown = useCallback((
    e: React.KeyboardEvent,
    selectedId: string | null,
    getTitle: (id: string) => string | undefined
  ) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd+Delete: delete immediately without confirmation
        deleteImmediate(selectedId);
      } else {
        // Delete alone: show confirmation dialog
        const title = getTitle(selectedId) || 'this idea';
        requestDelete(selectedId, title);
      }
    }
  }, [deleteImmediate, requestDelete]);

  return {
    deleteDialogOpen,
    pendingDeleteId,
    pendingDeleteTitle,
    requestDelete,
    confirmDelete,
    cancelDelete,
    deleteImmediate,
    handleDeleteKeyDown,
  };
}
