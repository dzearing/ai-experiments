import { useCallback, useState, type DragEvent } from 'react';
import { IconButton, FocusZone } from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { IdeaCard } from '../IdeaCard';
import type { IdeaStatus, IdeaMetadata } from '../../types/idea';
import styles from './KanbanBoard.module.css';

interface KanbanLaneProps {
  status: IdeaStatus;
  title: string;
  ideas: IdeaMetadata[];
  onDrop: (ideaId: string, targetStatus: IdeaStatus) => void;
  /** Called when a card is selected (single click or keyboard focus) */
  onCardSelect: (ideaId: string) => void;
  /** Called when a card is opened (double click or Enter) */
  onCardOpen: (ideaId: string) => void;
  selectedIdeaId: string | null;
  showAddButton: boolean;
  onAddIdea?: () => void;
  workspaceId?: string;
}

export function KanbanLane({
  status,
  title,
  ideas,
  onDrop,
  onCardSelect,
  onCardOpen,
  selectedIdeaId,
  showAddButton,
  onAddIdea,
}: KanbanLaneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    // Only set drag over to false if we're leaving the lane entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      const ideaId = e.dataTransfer.getData('text/plain');
      const sourceStatus = e.dataTransfer.getData('application/x-idea-status');

      if (ideaId && sourceStatus !== status) {
        onDrop(ideaId, status);
      }
    },
    [status, onDrop]
  );

  return (
    <div className={styles.lane}>
      <header className={styles.laneHeader}>
        <h2 className={styles.laneTitle}>
          {title}
          <span className={styles.laneCount}>{ideas.length}</span>
        </h2>
        {showAddButton && onAddIdea && (
          <IconButton
            icon={<AddIcon />}
            variant="ghost"
            size="sm"
            aria-label={`Add idea to ${title}`}
            onClick={onAddIdea}
          />
        )}
      </header>

      <FocusZone
        direction="vertical"
        className={`${styles.laneContent} ${isDragOver ? styles.dragOver : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onFocusChange={(element) => {
          // Select the card when it receives focus via keyboard
          const ideaId = element.getAttribute('data-idea-id');
          if (ideaId) {
            onCardSelect(ideaId);
          }
        }}
      >
        {ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            isSelected={idea.id === selectedIdeaId}
            onSelect={() => onCardSelect(idea.id)}
            onOpen={() => onCardOpen(idea.id)}
          />
        ))}

        {ideas.length === 0 && (
          <div className={styles.emptyLane}>
            Drop ideas here
          </div>
        )}
      </FocusZone>
    </div>
  );
}
