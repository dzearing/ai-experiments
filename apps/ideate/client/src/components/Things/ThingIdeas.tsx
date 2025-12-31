import { useState, useCallback, useMemo, type DragEvent } from 'react';
import { Button, FocusZone, Spinner, Text } from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { LightbulbIcon } from '@ui-kit/icons/LightbulbIcon';
import { IdeaCard } from '../IdeaCard';
import { IdeaWorkspaceOverlay, type ThingContext } from '../IdeaWorkspaceOverlay';
import { useThingIdeas } from '../../hooks/useThingIdeas';
import { useIdeas } from '../../contexts/IdeasContext';
import type { IdeaStatus, Idea } from '../../types/idea';
import styles from './ThingIdeas.module.css';

interface ThingIdeasProps {
  thingId: string;
  thingName: string;
  thingType: string;
  thingDescription?: string;
  workspaceId?: string;
}

const LANES: { status: IdeaStatus; title: string }[] = [
  { status: 'new', title: 'New' },
  { status: 'exploring', title: 'Exploring' },
  { status: 'executing', title: 'Executing' },
  { status: 'archived', title: 'Archived' },
];

export function ThingIdeas({ thingId, thingName, thingType, thingDescription, workspaceId }: ThingIdeasProps) {
  const { ideasByStatus, isLoading, error, moveIdea, refetch } = useThingIdeas(thingId, workspaceId);
  const { getIdea } = useIdeas();

  // Build Thing context for contextual greetings
  const thingContext: ThingContext = useMemo(() => ({
    id: thingId,
    name: thingName,
    type: thingType,
    description: thingDescription,
  }), [thingId, thingName, thingType, thingDescription]);

  // Overlay state
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Selected card for visual feedback
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);

  // Handle opening an idea
  const handleOpenIdea = useCallback(async (ideaId: string) => {
    const idea = await getIdea(ideaId);
    if (idea) {
      setSelectedIdea(idea);
      setIsCreating(false);
      setOverlayOpen(true);
    }
  }, [getIdea]);

  // Handle creating a new idea
  const handleNewIdea = useCallback(() => {
    setSelectedIdea(null);
    setIsCreating(true);
    setOverlayOpen(true);
  }, []);

  // Handle overlay close
  const handleOverlayClose = useCallback(() => {
    setOverlayOpen(false);
    setSelectedIdea(null);
    setIsCreating(false);
  }, []);

  // Handle idea saved (refresh the list)
  const handleIdeaSuccess = useCallback(() => {
    refetch();
    // Keep overlay open - user may continue editing
  }, [refetch]);

  // Total ideas count
  const totalIdeas = Object.values(ideasByStatus).reduce((sum, ideas) => sum + ideas.length, 0);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="sm" />
        <Text size="sm" color="soft">Loading ideas...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <Text size="sm" color="soft">{error}</Text>
        <Button variant="ghost" size="sm" onClick={refetch}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={styles.thingIdeas}>
      {/* Header with count and add button */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <LightbulbIcon className={styles.headerIcon} />
          <Text weight="medium">Ideas</Text>
          {totalIdeas > 0 && (
            <span className={styles.countBadge}>{totalIdeas}</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<AddIcon />}
          onClick={handleNewIdea}
        >
          New Idea
        </Button>
      </div>

      {/* Mini Kanban Board */}
      {totalIdeas === 0 ? (
        <div className={styles.empty}>
          <LightbulbIcon className={styles.emptyIcon} />
          <Text size="sm" color="soft">No ideas linked to this Thing yet.</Text>
          <Button variant="outline" size="sm" icon={<AddIcon />} onClick={handleNewIdea}>
            Create First Idea
          </Button>
        </div>
      ) : (
        <div className={styles.kanban}>
          {LANES.map(({ status, title }) => (
            <MiniLane
              key={status}
              status={status}
              title={title}
              ideas={ideasByStatus[status]}
              onDrop={moveIdea}
              onCardSelect={setSelectedIdeaId}
              onCardOpen={handleOpenIdea}
              selectedIdeaId={selectedIdeaId}
            />
          ))}
        </div>
      )}

      {/* Idea Workspace Overlay - only render when open to ensure fresh context */}
      {overlayOpen && (
        <IdeaWorkspaceOverlay
          idea={selectedIdea}
          open={overlayOpen}
          onClose={handleOverlayClose}
          workspaceId={workspaceId}
          onSuccess={handleIdeaSuccess}
          initialThingIds={isCreating ? [thingId] : undefined}
          initialThingContext={isCreating ? thingContext : undefined}
        />
      )}
    </div>
  );
}

// Mini lane component for compact display
interface MiniLaneProps {
  status: IdeaStatus;
  title: string;
  ideas: import('../../types/idea').IdeaMetadata[];
  onDrop: (ideaId: string, targetStatus: IdeaStatus) => Promise<import('../../types/idea').Idea | null>;
  onCardSelect: (ideaId: string) => void;
  onCardOpen: (ideaId: string) => void;
  selectedIdeaId: string | null;
}

function MiniLane({
  status,
  title,
  ideas,
  onDrop,
  onCardSelect,
  onCardOpen,
  selectedIdeaId,
}: MiniLaneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
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
        <span className={styles.laneTitle}>{title}</span>
        <span className={styles.laneCount}>{ideas.length}</span>
      </header>

      <FocusZone
        direction="vertical"
        className={`${styles.laneContent} ${isDragOver ? styles.dragOver : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onFocusChange={(element) => {
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
            <Text size="xs" color="soft">Drop here</Text>
          </div>
        )}
      </FocusZone>
    </div>
  );
}
