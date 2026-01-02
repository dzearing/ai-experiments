import { useCallback, useRef } from 'react';
import { Button, Dialog } from '@ui-kit/react';
import { KanbanLane } from './KanbanLane';
import { useIdeaDelete } from '../../hooks/useIdeaDelete';
import type { IdeaStatus, IdeaMetadata } from '../../types/idea';
import styles from './KanbanBoard.module.css';

interface KanbanBoardProps {
  /** Ideas organized by status - pass this in from context or filtered source */
  ideasByStatus: Record<IdeaStatus, IdeaMetadata[]>;
  /** Move an idea to a new status */
  onMoveIdea: (ideaId: string, targetStatus: IdeaStatus) => Promise<unknown>;
  /** Delete an idea */
  onDeleteIdea: (ideaId: string) => Promise<boolean>;
  /** Called when a card is selected (single click or keyboard) */
  onCardSelect: (ideaId: string) => void;
  /** Called when a card is opened (double click or Enter) */
  onCardOpen: (ideaId: string) => void;
  /** Currently selected idea ID */
  selectedIdeaId: string | null;
  /** Clear selection (called after delete) */
  onClearSelection?: () => void;
  /** Called when add button is clicked */
  onAddIdea?: () => void;
  /** Workspace ID for context */
  workspaceId?: string;
  /** Whether delete is disabled (e.g., when overlays are open) */
  deleteDisabled?: boolean;
  /** Variant: 'full' for Ideas page, 'compact' for ThingIdeas */
  variant?: 'full' | 'compact';
}

const LANES: { status: IdeaStatus; title: string; showAddButton: boolean }[] = [
  { status: 'new', title: 'New', showAddButton: true },
  { status: 'exploring', title: 'Planning', showAddButton: true },
  { status: 'executing', title: 'Executing', showAddButton: false },
  { status: 'archived', title: 'Archived', showAddButton: true },
];

export function KanbanBoard({
  ideasByStatus,
  onMoveIdea,
  onDeleteIdea,
  onCardSelect,
  onCardOpen,
  selectedIdeaId,
  onClearSelection,
  onAddIdea,
  workspaceId,
  deleteDisabled = false,
  variant = 'full',
}: KanbanBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Get title for an idea by ID (search across all statuses)
  const getIdeaTitle = useCallback((ideaId: string): string | undefined => {
    for (const ideas of Object.values(ideasByStatus)) {
      const idea = ideas.find(i => i.id === ideaId);
      if (idea) return idea.title;
    }
    return undefined;
  }, [ideasByStatus]);

  // Shared delete hook
  const {
    deleteDialogOpen,
    pendingDeleteTitle,
    confirmDelete,
    cancelDelete,
    handleDeleteKeyDown,
  } = useIdeaDelete({
    deleteIdea: onDeleteIdea,
    onDeleted: (ideaId) => {
      if (selectedIdeaId === ideaId) {
        onClearSelection?.();
      }
      containerRef.current?.focus();
    },
  });

  const handleDrop = useCallback(
    async (ideaId: string, targetStatus: IdeaStatus) => {
      await onMoveIdea(ideaId, targetStatus);
    },
    [onMoveIdea]
  );

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (deleteDisabled) return;
    handleDeleteKeyDown(e, selectedIdeaId, getIdeaTitle);
  }, [deleteDisabled, handleDeleteKeyDown, selectedIdeaId, getIdeaTitle]);

  return (
    <>
      <div
        ref={containerRef}
        className={`${styles.kanbanBoard} ${variant === 'compact' ? styles.compact : ''}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {LANES.map(({ status, title, showAddButton }) => (
          <KanbanLane
            key={status}
            status={status}
            title={title}
            ideas={ideasByStatus[status]}
            onDrop={handleDrop}
            onCardSelect={onCardSelect}
            onCardOpen={onCardOpen}
            selectedIdeaId={selectedIdeaId}
            showAddButton={showAddButton && variant === 'full'}
            onAddIdea={onAddIdea}
            workspaceId={workspaceId}
          />
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
        title="Delete Idea"
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} data-autofocus>
              Delete
            </Button>
          </div>
        }
      >
        <p style={{ margin: 0 }}>
          Are you sure you want to delete "{pendingDeleteTitle}"?
        </p>
      </Dialog>
    </>
  );
}
