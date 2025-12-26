import { useCallback } from 'react';
import { useIdeas } from '../../contexts/IdeasContext';
import { KanbanLane } from './KanbanLane';
import type { IdeaStatus } from '../../types/idea';
import styles from './KanbanBoard.module.css';

interface KanbanBoardProps {
  workspaceId?: string;
  /** Called when a card is selected (single click or keyboard) */
  onCardSelect: (ideaId: string) => void;
  /** Called when a card is opened (double click or Enter) */
  onCardOpen: (ideaId: string) => void;
  selectedIdeaId: string | null;
  onAddIdea?: () => void;
}

const LANES: { status: IdeaStatus; title: string; showAddButton: boolean }[] = [
  { status: 'new', title: 'New', showAddButton: true },
  { status: 'exploring', title: 'Exploring', showAddButton: true },
  { status: 'executing', title: 'Executing', showAddButton: false },
  { status: 'archived', title: 'Archived', showAddButton: true },
];

export function KanbanBoard({
  workspaceId,
  onCardSelect,
  onCardOpen,
  selectedIdeaId,
  onAddIdea,
}: KanbanBoardProps) {
  const { ideasByStatus, moveIdea } = useIdeas();

  const handleDrop = useCallback(
    async (ideaId: string, targetStatus: IdeaStatus) => {
      await moveIdea(ideaId, targetStatus);
    },
    [moveIdea]
  );

  return (
    <div className={styles.kanbanBoard}>
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
          showAddButton={showAddButton}
          onAddIdea={onAddIdea}
          workspaceId={workspaceId}
        />
      ))}
    </div>
  );
}
