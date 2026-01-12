import { useCallback, useEffect, useRef } from 'react';
import type { DragEvent, KeyboardEvent } from 'react';
import { Card, Chip, Progress, RelativeTime, Spinner } from '@ui-kit/react';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { useResource } from '@claude-flow/data-bus/react';
import { dataBus, ideaPath } from '../../dataBus';
import { createLogger } from '../../utils/clientLogger';
import type { IdeaMetadata } from '../../types/idea';
import styles from './IdeaCard.module.css';

const log = createLogger('IdeaCard');

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
    title: propTitle,
    summary: propSummary,
    tags: propTags,
    source,
    status,
    execution,
    plan,
    updatedAt,
    agentStatus: propAgentStatus,
  } = idea;

  // Subscribe to real-time metadata updates via data bus
  // This includes agentStatus since resource_updated messages merge into this path
  const { data: realtimeMetadata } = useResource(dataBus, ideaPath(id));

  // Extract agent fields from real-time metadata (server sends them as string properties)
  const realtimeAgentStatus = (realtimeMetadata as { agentStatus?: string } | undefined)?.agentStatus as 'idle' | 'running' | 'error' | undefined;
  const realtimeAgentStartedAt = (realtimeMetadata as { agentStartedAt?: string } | undefined)?.agentStartedAt;
  const realtimeAgentFinishedAt = (realtimeMetadata as { agentFinishedAt?: string } | undefined)?.agentFinishedAt;

  // Use real-time values if available, otherwise fall back to props
  const agentStatus = realtimeAgentStatus ?? propAgentStatus;
  const agentStartedAt = realtimeAgentStartedAt ?? idea.agentStartedAt;
  const agentFinishedAt = realtimeAgentFinishedAt ?? idea.agentFinishedAt;

  // Track previous status to log changes
  const prevAgentStatusRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (prevAgentStatusRef.current !== agentStatus) {
      log.log(`Status changed for idea ${id}`, {
        from: prevAgentStatusRef.current,
        to: agentStatus,
        realtimeStatus: realtimeAgentStatus,
        propStatus: propAgentStatus,
        hasRealtimeMetadata: !!realtimeMetadata,
      });
      prevAgentStatusRef.current = agentStatus;
    }
  }, [id, agentStatus, realtimeAgentStatus, propAgentStatus, realtimeMetadata]);

  // Use real-time metadata if available, otherwise fall back to props
  const rawTitle = realtimeMetadata?.title ?? propTitle;
  const rawSummary = realtimeMetadata?.summary ?? propSummary;
  const tags = realtimeMetadata?.tags ?? propTags;

  // Filter out placeholder title - show "New Idea" instead
  const isPlaceholderTitle = !rawTitle ||
    rawTitle === 'Untitled Idea' ||
    rawTitle.trim() === '';
  const title = isPlaceholderTitle ? 'New Idea' : rawTitle;

  // Filter out placeholder summaries - don't display these
  const isPlaceholderSummary = !rawSummary ||
    rawSummary === 'Processing...' ||
    rawSummary === '_Add a brief summary of your idea..._' ||
    rawSummary.trim() === '';
  const summary = isPlaceholderSummary ? null : rawSummary;

  // Filter out priority tags - only show category tags
  const displayTags = tags.filter(t => !t.startsWith('priority:'));
  const visibleTags = displayTags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenTagCount = displayTags.length - MAX_VISIBLE_TAGS;

  const isExecuting = status === 'executing';

  // Agent is running if:
  // - agentStatus === 'running' (from IdeaAgent/PlanAgent broadcasts)
  // - OR execution has a currentTaskId (ExecutionAgent is actively working)
  const isAgentRunning = agentStatus === 'running' || (isExecuting && !!execution?.currentTaskId);
  const isAgentError = agentStatus === 'error';

  // Get phase info for display
  const currentPhase = plan?.phases.find(p => p.id === execution?.currentPhaseId);
  const totalPhases = plan?.phases.length || 0;
  const currentPhaseIndex = currentPhase
    ? (plan?.phases.findIndex(p => p.id === currentPhase.id) ?? 0) + 1
    : 0;

  // Calculate progress: use stored value, or calculate from phase data as fallback
  // This handles legacy ideas where progressPercent was never updated
  const calculatedProgress = (() => {
    // If we have a stored progress value, use it
    if (execution?.progressPercent && execution.progressPercent > 0) {
      return execution.progressPercent;
    }

    // Fallback: calculate from phase data
    // If idle and on a phase, assume that phase is complete
    if (totalPhases > 0 && currentPhaseIndex > 0) {
      return Math.round((currentPhaseIndex / totalPhases) * 100);
    }

    return 0;
  })();

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

  // Determine status chip display
  const getStatusChip = () => {
    if (isAgentError) {
      return { variant: 'error' as const, label: 'Error' };
    }
    if (isAgentRunning) {
      return { variant: 'success' as const, label: 'Running' };
    }

    return { variant: 'outline' as const, label: 'Idle' };
  };

  const statusChip = getStatusChip();

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
      <div className={styles.cardInner}>
        {/* Header row with title and status chip */}
        <div className={styles.cardHeader}>
          <h3 className={styles.title}>{title}</h3>
          <Chip variant={statusChip.variant} size="sm">
            {statusChip.label}
          </Chip>
        </div>

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

        {/* Time display - duration when running, relative time when idle */}
        {/* Skip duration here for executing ideas - the progress section shows it */}
        {agentStatus === 'running' && agentStartedAt && !isExecuting ? (
          <RelativeTime
            timestamp={agentStartedAt}
            mode="duration"
            size="xs"
            color="soft"
            format="short"
            className={styles.updatedAt}
          />
        ) : agentFinishedAt && !isExecuting ? (
          <RelativeTime
            timestamp={agentFinishedAt}
            size="xs"
            color="soft"
            format="short"
            className={styles.updatedAt}
          />
        ) : (
          <RelativeTime
            timestamp={updatedAt}
            size="xs"
            color="soft"
            format="short"
            className={styles.updatedAt}
          />
        )}

        {/* Progress (for executing ideas) */}
        {isExecuting && execution && (
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <div className={styles.progressBar}>
                <Progress value={calculatedProgress} size="sm" />
              </div>
              {isAgentRunning && <Spinner size="sm" />}
            </div>
            <div className={styles.executionInfo}>
              {/* Only show live duration counter when agent is actively running */}
              {isAgentRunning && execution.startedAt && (
                <RelativeTime
                  timestamp={execution.startedAt}
                  mode="duration"
                  size="xs"
                  color="soft"
                  format="short"
                />
              )}
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
