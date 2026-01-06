import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Button, Text } from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { LightbulbIcon } from '@ui-kit/icons/LightbulbIcon';
import { KanbanBoard } from '../KanbanBoard';
import { DelayedSpinner } from '../DelayedSpinner';
import { IdeaDialog, type ThingContext, type WorkspacePhase } from '../IdeaDialog';
import { useThingIdeas } from '../../hooks/useThingIdeas';
import { useIdeas } from '../../contexts/IdeasContext';
import type { Idea } from '../../types/idea';
import styles from './ThingIdeas.module.css';

// Debug: track component mount/unmount
let thingIdeasInstanceId = 0;

interface ThingIdeasProps {
  thingId: string;
  thingName: string;
  thingType: string;
  thingDescription?: string;
  workspaceId?: string;
}

export function ThingIdeas({ thingId, thingName, thingType, thingDescription, workspaceId }: ThingIdeasProps) {
  // Debug: track this instance
  const instanceId = useRef(++thingIdeasInstanceId);
  useEffect(() => {
    console.log(`[ThingIdeas #${instanceId.current}] MOUNTED for thingId=${thingId}`);
    return () => {
      console.log(`[ThingIdeas #${instanceId.current}] UNMOUNTED`);
    };
  }, []); // Only run on mount/unmount

  const { ideasByStatus, isLoading, error, moveIdea, deleteIdea, refetch } = useThingIdeas(thingId, workspaceId);
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
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>();
  const [initialGreeting, setInitialGreeting] = useState<string | undefined>();
  const [initialPhase, setInitialPhase] = useState<WorkspacePhase | undefined>();

  // Selected card for visual feedback
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);

  // Handle opening an idea
  const handleOpenIdea = useCallback(async (ideaId: string) => {
    const idea = await getIdea(ideaId);
    if (idea) {
      setSelectedIdea(idea);
      setIsCreating(false);
      // Set initial phase based on idea status
      setInitialPhase(idea.status === 'exploring' ? 'planning' : 'ideation');
      setOverlayOpen(true);
    }
  }, [getIdea]);

  // Handle creating a new idea
  const handleNewIdea = useCallback((prompt?: string, greeting?: string) => {
    setSelectedIdea(null);
    setIsCreating(true);
    setInitialPrompt(prompt);
    setInitialGreeting(greeting);
    setInitialPhase('ideation'); // New ideas always start in ideation
    setOverlayOpen(true);
  }, []);

  // Handle overlay close
  const handleOverlayClose = useCallback(() => {
    setOverlayOpen(false);
    setSelectedIdea(null);
    setIsCreating(false);
    setInitialPrompt(undefined);
    setInitialGreeting(undefined);
    setInitialPhase(undefined);
    // Refetch to update kanban with any status changes made while overlay was open
    refetch();
  }, [refetch]);

  // Listen for facilitator:openIdea events (from Facilitator navigation actions)
  useEffect(() => {
    const handleFacilitatorOpenIdea = async (event: Event) => {
      const customEvent = event as CustomEvent<{
        ideaId?: string;
        thingId?: string;
        initialPrompt?: string;
        initialGreeting?: string;
        focusInput?: boolean;
      }>;
      const { ideaId, thingId: eventThingId, initialPrompt: eventPrompt, initialGreeting: eventGreeting } = customEvent.detail;

      // Only handle if this event is for our Thing
      if (eventThingId && eventThingId !== thingId) {
        return;
      }

      if (ideaId) {
        // Open existing idea
        const idea = await getIdea(ideaId);
        if (idea) {
          setSelectedIdea(idea);
          setIsCreating(false);
          setInitialPrompt(undefined);
          setInitialGreeting(undefined);
          setOverlayOpen(true);
        }
      } else {
        // Create new idea with optional prompt and greeting
        handleNewIdea(eventPrompt, eventGreeting);
      }
    };

    window.addEventListener('facilitator:openIdea', handleFacilitatorOpenIdea);
    return () => window.removeEventListener('facilitator:openIdea', handleFacilitatorOpenIdea);
  }, [thingId, getIdea, handleNewIdea]);

  // Handle idea saved (refresh the list)
  const handleIdeaSuccess = useCallback(() => {
    refetch();
    // Keep overlay open - user may continue editing
  }, [refetch]);

  // Handle idea status change (e.g., moving to planning)
  // IMPORTANT: Do NOT call refetch() here as it sets isLoading=true which causes
  // the early return at line 142-144, unmounting the overlay and losing state.
  // The IdeaDialog handles the phase transition internally.
  // The kanban board will be updated when the overlay closes.
  const handleStatusChange = useCallback(() => {
    console.log(`[ThingIdeas #${instanceId.current}] handleStatusChange called, overlayOpen=${overlayOpen}`);
    // No-op: IdeaDialog handles the transition internally
    // Kanban will be updated via WebSocket or when overlay closes
  }, [overlayOpen]);

  // Total ideas count
  const totalIdeas = Object.values(ideasByStatus).reduce((sum, ideas) => sum + ideas.length, 0);

  if (isLoading) {
    return <DelayedSpinner loading={isLoading} message="Loading ideas..." className={styles.loading} />;
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
      {/* Kanban Board */}
      {totalIdeas === 0 ? (
        <div className={styles.empty}>
          <LightbulbIcon className={styles.emptyIcon} />
          <Text color="soft">No ideas yet!</Text>
          <Button variant="primary" size="lg" icon={<AddIcon />} onClick={() => handleNewIdea()}>
            Create your first Idea
          </Button>
        </div>
      ) : (
        <KanbanBoard
          ideasByStatus={ideasByStatus}
          onMoveIdea={moveIdea}
          onDeleteIdea={deleteIdea}
          onCardSelect={setSelectedIdeaId}
          onCardOpen={handleOpenIdea}
          selectedIdeaId={selectedIdeaId}
          onClearSelection={() => setSelectedIdeaId(null)}
          onAddIdea={() => handleNewIdea()}
          workspaceId={workspaceId}
          deleteDisabled={overlayOpen}
          variant="compact"
        />
      )}

      {/* Idea Dialog - only render when open to ensure fresh context */}
      {overlayOpen && (
        <IdeaDialog
          idea={selectedIdea}
          open={overlayOpen}
          onClose={handleOverlayClose}
          workspaceId={workspaceId}
          onSuccess={handleIdeaSuccess}
          onStatusChange={handleStatusChange}
          initialThingIds={isCreating ? [thingId] : undefined}
          initialThingContext={isCreating ? thingContext : undefined}
          initialPrompt={isCreating ? initialPrompt : undefined}
          initialGreeting={isCreating ? initialGreeting : undefined}
          initialPhase={initialPhase}
        />
      )}
    </div>
  );
}
