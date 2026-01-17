import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from '@ui-kit/router';
import { Button, Text } from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { LightbulbIcon } from '@ui-kit/icons/LightbulbIcon';
import { useResource } from '@claude-flow/data-bus/react';
import { KanbanBoard } from '../KanbanBoard';
import { DelayedSpinner } from '../DelayedSpinner';
import { IdeaDialog, type TopicContext, type WorkspacePhase } from '../IdeaDialog';
import { useIdeasQuery } from '../../hooks/useIdeasQuery';
import { useIdeas } from '../../contexts/IdeasContext';
import { useSession } from '../../contexts/SessionContext';
import { useWorkspaceSocket, type ResourceType } from '../../hooks/useWorkspaceSocket';
import { dataBus, topicIdeasPath } from '../../dataBus';
import { createLogger } from '../../utils/clientLogger';
import type { Idea, IdeaMetadata } from '../../types/idea';
import styles from './TopicIdeas.module.css';

/**
 * Update URL query param without triggering navigation
 */
function updateIdeaQueryParam(ideaId: string | null): void {
  const url = new URL(window.location.href);

  if (ideaId) {
    url.searchParams.set('idea', ideaId);
  } else {
    url.searchParams.delete('idea');
  }

  window.history.replaceState({}, '', url.toString());
}

// Create logger for this component
const log = createLogger('TopicIdeas');

// Debug: track component mount/unmount
let topicIdeasInstanceId = 0;

interface TopicIdeasProps {
  topicId: string;
  topicName: string;
  topicType: string;
  topicDescription?: string;
  /** Local file path if the topic is a folder/repo/package */
  topicLocalPath?: string;
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

export function TopicIdeas({ topicId, topicName, topicType, topicDescription, topicLocalPath, workspaceId, pendingIdeaOpen, onPendingIdeaOpenHandled }: TopicIdeasProps) {
  // Debug: track this instance
  const instanceId = useRef(++topicIdeasInstanceId);

  // Track if we've handled the initial query param
  const initialIdeaHandled = useRef(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    log.log(`#${instanceId.current} MOUNTED for topicId=${topicId}`);

    return () => {
      log.log(`#${instanceId.current} UNMOUNTED`);
    };
  }, []); // Only run on mount/unmount

  const { session } = useSession();

  // Use unified ideas query hook with topic filter
  // Note: We don't filter by workspaceId here - topic membership is the relevant filter.
  // workspaceId is still used for WebSocket connection and creating new ideas.
  const {
    ideasByStatus,
    isLoading,
    error,
    refetch,
    addIdea,
    updateIdea,
    removeIdea,
    moveIdea,
    deleteIdea,
  } = useIdeasQuery({
    topicIds: [topicId],
  });

  const { getIdea } = useIdeas();

  // WebSocket handlers for real-time updates (e.g., agentStatus changes)
  const handleResourceCreated = useCallback((
    _resourceId: string,
    resourceType: ResourceType,
    data: unknown
  ) => {
    if (resourceType === 'idea') {
      const idea = data as IdeaMetadata;

      // Only add if this idea belongs to this Topic
      if (idea.topicIds?.includes(topicId)) {
        addIdea(idea);
      }
    }
  }, [addIdea, topicId]);

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
    workspaceId ? topicIdeasPath(topicId) : null
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

  // Build Topic context for contextual greetings
  const topicContext: TopicContext = useMemo(() => ({
    id: topicId,
    name: topicName,
    type: topicType,
    description: topicDescription,
    localPath: topicLocalPath,
  }), [topicId, topicName, topicType, topicDescription, topicLocalPath]);

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
      // Update URL without navigation
      updateIdeaQueryParam(ideaId);
    }
  }, [getIdea]);

  // Handle creating a new idea
  const handleNewIdea = useCallback((title?: string, prompt?: string, greeting?: string) => {
    log.log(`#${instanceId.current} handleNewIdea called`, { topicId, title, prompt });
    setSelectedIdea(null);
    setIsCreating(true);
    setInitialTitle(title);
    setInitialPrompt(prompt);
    setInitialGreeting(greeting);
    setInitialPhase('ideation'); // New ideas always start in ideation
    setOverlayOpen(true);
  }, [topicId]);

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
    // Remove idea from URL without navigation
    updateIdeaQueryParam(null);
    // Refetch to update kanban with any status changes made while overlay was open
    refetch();
  }, [refetch]);

  // Listen for facilitator:openIdea events (from Facilitator navigation actions)
  useEffect(() => {
    const handleFacilitatorOpenIdea = async (event: Event) => {
      const customEvent = event as CustomEvent<{
        ideaId?: string;
        topicId?: string;
        initialTitle?: string;
        initialPrompt?: string;
        initialGreeting?: string;
        focusInput?: boolean;
      }>;
      const { ideaId, topicId: eventTopicId, initialTitle: eventTitle, initialPrompt: eventPrompt, initialGreeting: eventGreeting } = customEvent.detail;

      // Only handle if this event is for our Topic
      if (eventTopicId && eventTopicId !== topicId) {
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
  }, [topicId, getIdea, handleNewIdea]);

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
    log.log(`#${instanceId.current} handleIdeaCreated called`, {
      ideaId: idea.id,
      ideaTitle: idea.title,
      ideaStatus: idea.status,
      topicIds: idea.topicIds,
      expectedTopicId: topicId,
    });
    setSelectedIdea(idea);
    // Add to kanban immediately without triggering loading state
    addIdea(idea);
    // Update URL with the new idea ID
    updateIdeaQueryParam(idea.id);
  }, [addIdea, topicId]);

  // Handle maximize - navigate to full page view (adds to history stack)
  const handleMaximize = useCallback((ideaId: string) => {
    if (workspaceId) {
      navigate(`/${workspaceId}/ideas/${ideaId}`);
    }
  }, [navigate, workspaceId]);

  // Open idea from URL query param on initial mount
  useEffect(() => {
    if (initialIdeaHandled.current || isLoading) return;

    const ideaIdFromUrl = searchParams.get('idea');

    if (ideaIdFromUrl) {
      initialIdeaHandled.current = true;
      handleOpenIdea(ideaIdFromUrl);
    }
  }, [searchParams, isLoading, handleOpenIdea]);

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
    <div className={styles.topicIdeas}>
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
          initialTopicIds={isCreating ? [topicId] : undefined}
          initialTopicContext={isCreating ? topicContext : undefined}
          initialTitle={isCreating ? initialTitle : undefined}
          initialPrompt={isCreating ? initialPrompt : undefined}
          initialGreeting={isCreating ? initialGreeting : undefined}
          initialPhase={initialPhase}
          onMaximize={handleMaximize}
        />
      )}
    </div>
  );
}
