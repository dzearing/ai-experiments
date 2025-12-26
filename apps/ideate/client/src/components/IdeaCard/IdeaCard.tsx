import { useCallback, type DragEvent, type KeyboardEvent } from 'react';
import { Card, Chip, Progress, RelativeTime } from '@ui-kit/react';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { ClockIcon } from '@ui-kit/icons/ClockIcon';
import type { IdeaMetadata } from '../../types/idea';
import styles from './IdeaCard.module.css';

interface IdeaCardProps {
  idea: IdeaMetadata;
  isSelected: boolean;
  /** Called on single click - selects the card */
  onSelect: () => void;
  /** Called on double click or Enter - opens the card */
  onOpen: () => void;
}

const MAX_VISIBLE_TAGS = 3;

export function IdeaCard({
  idea,
  isSelected,
  onSelect,
  onOpen,
}: IdeaCardProps) {
  const {
    id,
    title,
    summary,
    tags,
    source,
    status,
    execution,
    updatedAt,
  } = idea;

  // Filter out priority tags - only show category tags
  const displayTags = tags.filter(t => !t.startsWith('priority:'));
  const visibleTags = displayTags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenTagCount = displayTags.length - MAX_VISIBLE_TAGS;

  const isExecuting = status === 'executing';

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.setData('application/x-idea-status', status);
    e.dataTransfer.effectAllowed = 'move';
  }, [id, status]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  }, [onOpen]);

  return (
    <Card
      className={`${styles.ideaCard} ${isSelected ? `${styles.selected} surface primary` : ''}`}
      onClick={onSelect}
      onDoubleClick={onOpen}
      onKeyDown={handleKeyDown}
      selected={isSelected}
      tabIndex={0}
      data-testid="idea-card"
      data-idea-id={id}
    >
      <div
        className={styles.cardInner}
        draggable
        onDragStart={handleDragStart}
      >
        {/* Header with title and AI badge */}
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          {source === 'ai' && (
            <span className={styles.aiBadge} title="AI Generated">
              <StarIcon />
              <span>AI</span>
            </span>
          )}
        </div>

        {/* Summary */}
        {summary && (
          <p className={styles.summary}>{summary}</p>
        )}

        {/* Tags Row - only show category tags, not priority */}
        {visibleTags.length > 0 && (
          <div className={styles.tags}>
            {visibleTags.map((tag) => (
              <Chip key={tag} variant="default" size="xs">
                {tag}
              </Chip>
            ))}
            {hiddenTagCount > 0 && (
              <span className={styles.tagOverflow}>+{hiddenTagCount}</span>
            )}
          </div>
        )}

        {/* Last modified time */}
        <RelativeTime
          timestamp={updatedAt}
          size="xs"
          color="soft"
          format="short"
          className={styles.updatedAt}
        />

        {/* Progress (for executing ideas) */}
        {isExecuting && execution && (
          <div className={styles.progressSection}>
            <Progress value={execution.progressPercent} size="sm" />
            {execution.waitingForFeedback && (
              <div className={styles.waitState}>
                <ClockIcon />
                <span>Waiting for feedback</span>
              </div>
            )}
          </div>
        )}

        {/* Footer - only show if there are badges */}
        {isExecuting && execution?.chatRoomId && (
          <div className={styles.footer}>
            <span className={styles.chatBadge} title="Has Chat Room">
              <ChatIcon />
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
