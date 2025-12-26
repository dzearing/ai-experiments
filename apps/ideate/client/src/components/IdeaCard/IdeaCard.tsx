import { useCallback, type DragEvent } from 'react';
import { Card, Chip, Progress } from '@ui-kit/react';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { ClockIcon } from '@ui-kit/icons/ClockIcon';
import type { IdeaMetadata } from '../../types/idea';
import styles from './IdeaCard.module.css';

interface IdeaCardProps {
  idea: IdeaMetadata;
  isSelected: boolean;
  onClick: () => void;
}

const MAX_VISIBLE_TAGS = 3;

export function IdeaCard({
  idea,
  isSelected,
  onClick,
}: IdeaCardProps) {
  const {
    id,
    title,
    summary,
    tags,
    source,
    rating,
    status,
    execution,
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

  return (
    <Card
      className={`${styles.ideaCard} ${isSelected ? `${styles.selected} surface primary` : ''}`}
      onClick={onClick}
      selected={isSelected}
      data-testid="idea-card"
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
              <Chip key={tag} variant="default" size="sm">
                {tag}
              </Chip>
            ))}
            {hiddenTagCount > 0 && (
              <span className={styles.tagOverflow}>+{hiddenTagCount}</span>
            )}
          </div>
        )}

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

        {/* Footer */}
        <div className={styles.footer}>
          {/* Rating Dots */}
          <div className={styles.rating}>
            {[1, 2, 3, 4].map((dot) => (
              <span
                key={dot}
                className={`${styles.ratingDot} ${dot <= rating ? styles.filled : ''}`}
              />
            ))}
          </div>

          {/* Badges */}
          <div className={styles.badges}>
            {isExecuting && execution?.chatRoomId && (
              <span className={styles.chatBadge} title="Has Chat Room">
                <ChatIcon />
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
