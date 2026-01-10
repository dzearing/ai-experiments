import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Button, Text } from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { LightbulbIcon } from '@ui-kit/icons/LightbulbIcon';
import { useResource } from '@claude-flow/data-bus/react';
import { KanbanBoard } from '../KanbanBoard';
import { DelayedSpinner } from '../DelayedSpinner';
import { IdeaDialog, type ThingContext, type WorkspacePhase } from '../IdeaDialog';
import { useThingIdeas } from '../../hooks/useThingIdeas';
import { useIdeas } from '../../contexts/IdeasContext';
import { useSession } from '../../contexts/SessionContext';
import { useWorkspaceSocket, type ResourceType } from '../../hooks/useWorkspaceSocket';
import { dataBus, thingIdeasPath } from '../../dataBus';
import { createLogger } from '../../utils/clientLogger';
import type { Idea, IdeaMetadata } from '../../types/idea';
import styles from './ThingIdeas.module.css';

// Create logger for this component
const log = createLogger('ThingIdeas');

// Debug: track component mount/unmount
let thingIdeasInstanceId = 0;

interface ThingIdeasProps {
  thingId: string;
  thingName: string;
  thingType: string;
  thingDescription?: string;
  workspaceId?: string;
  /** Pending idea open request from parent (when tab was switched) */
  pendingIdeaOpen?: {
    ideaId?: string;
    initialTitle?: string;
    initialPrompt?: string;
    initialGreeting?: string;
  } | null;
  /** Callback to clear the pending open after handling */
  onPendingIdeaOpenHandled?: () => void;
}

export function ThingIdeas({ thingId, thingName, thingType, thingDescription, workspaceId, pendingIdeaOpen, onPendingIdeaOpenHandled }: ThingIdeasProps) {
  // Debug: track this instance
  const instanceId = useRef(++thingIdeasInstanceId);
  useEffect(() => {
    log.log(`#${instanceId.current} MOUNTED for thingId=${thingId}`);
    return () => {
      log.log(`#${instanceId.current} UNMOUNTED`);
    };
  }, []); // Only run on mount/unmount

  const { session } = useSession();
  const { ideasByStatus, isLoading, error, moveIdea, deleteIdea, refetch, updateIdea, addIdea, removeIdea } = useThingIdeas(thingId, workspaceId);
  const { getIdea } = useIdeas();

  // WebSocket handlers for real-time updates (e.g., agentStatus changes)
  const handleResourceCreated = useCallback((
    _resourceId: string,
    resourceType: ResourceType,
    data: unknown
  ) => {
    if (resourceType === 'idea') {
      const idea = data as IdeaMetadata;
      // Only add if this idea belongs to this Thing
      if (idea.thingIds?.includes(thingId)) {
        addIdea(idea);
      }
    }
  }, [addIdea, thingId]);

  const handleResourceUpdated = useCallback((
    _resourceId: string,
    resourceType: ResourceType,
    data: unknown
  ) => {
    if (resourceType === 'idea') {
      const update = data as Partial<IdeaMetadata> & { id: string };
      // Merge the update (handles agentStatus, summary, title changes, etc.)
      updateIdea(update.id, update);
    }
  }, [updateIdea]);

  const handleResourceDeleted = useCallback((
    resourceId: string,
    resourceType: ResourceType
  ) => {
    if (resourceType === 'idea') {
      removeIdea(resourceId);
    }
  }, [removeIdea]);

  // Connect to workspace WebSocket for real-time updates
  useWorkspaceSocket({
    workspaceId,
    sessionColor: session?.color,
    onResourceCreated: handleResourceCreated,
    onResourceUpdated: handleResourceUpdated,
    onResourceDeleted: handleResourceDeleted,
  });

  // Subscribe to real-time idea updates via data bus
  // This complements the WebSocket handlers and provides typed, declarative access
  const { data: realtimeIdeas } = useResource(
    dataBus,
    workspaceId ? thingIdeasPath(thingId) : null
  );

  // Sync real-time idea updates from data bus to local state
  // This handles background agent processing updates (title, summary, status)
  useEffect(() => {
    if (!realtimeIdeas || realtimeIdeas.length === 0) return;

    // Merge real-time updates with local state
    realtimeIdeas.forEach(ideaMetadata => {
      updateIdea(ideaMetadata.id, ideaMetadata);
    });
  }, [realtimeIdeas, updateIdea]);

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
  const [initialTitle, setInitialTitle] = useState<string | undefined>();
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
  const handleNewIdea = useCallback((title?: string, prompt?: string, greeting?: string) => {
    setSelectedIdea(null);
    setIsCreating(true);
    setInitialTitle(title);
    setInitialPrompt(prompt);
    setInitialGreeting(greeting);
    setInitialPhase('ideation'); // New ideas always start in ideation
    setOverlayOpen(true);
  }, []);

  // Handle pending idea open from parent (when tab was switched)
  useEffect(() => {
    if (pendingIdeaOpen) {
      const { ideaId, initialTitle: title, initialPrompt: prompt, initialGreeting: greeting } = pendingIdeaOpen;

      if (ideaId) {
        // Open existing idea
        handleOpenIdea(ideaId);
      } else {
        // Create new idea with optional title, prompt and greeting
        handleNewIdea(title, prompt, greeting);
      }

      // Clear the pending request
      onPendingIdeaOpenHandled?.();
    }
  }, [pendingIdeaOpen, handleOpenIdea, handleNewIdea, onPendingIdeaOpenHandled]);

  // Handle overlay close
  const handleOverlayClose = useCallback(() => {
    setOverlayOpen(false);
    setSelectedIdea(null);
    setIsCreating(false);
    setInitialTitle(undefined);
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
        initialTitle?: string;
        initialPrompt?: string;
        initialGreeting?: string;
        focusInput?: boolean;
      }>;
      const { ideaId, thingId: eventThingId, initialTitle: eventTitle, initialPrompt: eventPrompt, initialGreeting: eventGreeting } = customEvent.detail;

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
          setInitialTitle(undefined);
          setInitialPrompt(undefined);
          setInitialGreeting(undefined);
          setOverlayOpen(true);
        }
      } else {
        // Create new idea with optional title, prompt and greeting
        handleNewIdea(eventTitle, eventPrompt, eventGreeting);
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
    log.log(`#${instanceId.current} handleStatusChange called, overlayOpen=${overlayOpen}`);
    // No-op: IdeaDialog handles the transition internally
    // Kanban will be updated via WebSocket or when overlay closes
  }, [overlayOpen]);

  // Handle idea created immediately (for background processing tracking)
  // IMPORTANT: Do NOT call refetch() here - it sets isLoading=true which causes
  // the early return and unmounts the dialog. Use addIdea() instead.
  const handleIdeaCreated = useCallback((idea: Idea) => {
    log.log(`#${instanceId.current} Idea created immediately:`, idea.id);
    setSelectedIdea(idea);
    // Add to kanban immediately without triggering loading state
    addIdea(idea);
  }, [addIdea]);

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
          onIdeaCreated={handleIdeaCreated}
          initialThingIds={isCreating ? [thingId] : undefined}
          initialThingContext={isCreating ? thingContext : undefined}
          initialTitle={isCreating ? initialTitle : undefined}
          initialPrompt={isCreating ? initialPrompt : undefined}
          initialGreeting={isCreating ? initialGreeting : undefined}
          initialPhase={initialPhase}
        />
      )}
    </div>
  );
}
