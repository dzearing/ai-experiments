import { useCallback, useState, useEffect, type DragEvent, type KeyboardEvent } from 'react';
import { Card, Chip, Progress, RelativeTime, Spinner } from '@ui-kit/react';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import type { IdeaMetadata } from '../../types/idea';
import styles from './IdeaCard.module.css';

/**
 * Format duration from start time to now
 */
function formatDuration(startTime: string): string {
  const start = new Date(startTime).getTime();
  const seconds = Math.floor((Date.now() - start) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

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
    plan,
    updatedAt,
    agentStatus,
  } = idea;

  // Duration timer for executing ideas
  const [duration, setDuration] = useState<string>('');

  useEffect(() => {
    if (status !== 'executing' || !execution?.startedAt) {
      setDuration('');
      return;
    }

    // Update immediately
    setDuration(formatDuration(execution.startedAt));

    // Update every second
    const interval = setInterval(() => {
      setDuration(formatDuration(execution.startedAt!));
    }, 1000);

    return () => clearInterval(interval);
  }, [status, execution?.startedAt]);

  // Filter out priority tags - only show category tags
  const displayTags = tags.filter(t => !t.startsWith('priority:'));
  const visibleTags = displayTags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenTagCount = displayTags.length - MAX_VISIBLE_TAGS;

  const isExecuting = status === 'executing';

  // Agent is running if:
  // - agentStatus === 'running' (from IdeaAgent/PlanAgent broadcasts)
  // - OR execution has a currentTaskId (ExecutionAgent is actively working)
  const isAgentRunning = agentStatus === 'running' || (isExecuting && !!execution?.currentTaskId);

  // Get phase info for display
  const currentPhase = plan?.phases.find(p => p.id === execution?.currentPhaseId);
  const totalPhases = plan?.phases.length || 0;
  const currentPhaseIndex = currentPhase
    ? (plan?.phases.findIndex(p => p.id === currentPhase.id) ?? 0) + 1
    : 0;

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

  // Chip shows Running when agent is active
  const isRunning = isAgentRunning;

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
      draggable
      onDragStart={handleDragStart}
    >
      {/* Status chip in top right corner */}
      <div className={styles.statusChip}>
        <Chip variant={isRunning ? 'success' : 'outline'} size="sm">
          {isRunning ? 'Running' : 'Idle'}
        </Chip>
      </div>

      <div className={styles.cardInner}>
        {/* Title */}
        <h3 className={styles.title}>{title}</h3>

        {/* AI badge - below title, left aligned */}
        {source === 'ai' && (
          <span className={styles.aiBadge} title="AI Generated">
            <StarIcon />
            <span>AI</span>
          </span>
        )}

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
            <div className={styles.progressHeader}>
              <div className={styles.progressBar}>
                <Progress value={execution.progressPercent} size="sm" />
              </div>
              {isRunning && <Spinner size="sm" />}
            </div>
            <div className={styles.executionInfo}>
              {duration && <span className={styles.duration}>{duration}</span>}
              {currentPhaseIndex > 0 && (
                <span className={styles.phaseInfo}>Phase {currentPhaseIndex}/{totalPhases}</span>
              )}
            </div>
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
