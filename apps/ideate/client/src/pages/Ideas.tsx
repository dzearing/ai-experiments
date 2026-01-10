import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from '@ui-kit/router';
import { Button, Segmented, Spinner } from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { FilterIcon } from '@ui-kit/icons/FilterIcon';
import { SearchIcon } from '@ui-kit/icons/SearchIcon';
import { useAuth } from '../contexts/AuthContext';
import { useIdeas } from '../contexts/IdeasContext';
import { useFacilitator } from '../contexts/FacilitatorContext';
import { useSession } from '../contexts/SessionContext';
import { useWorkspaceSocket, type ResourceType } from '../hooks/useWorkspaceSocket';
import { KanbanBoard } from '../components/KanbanBoard';
import { IdeaDialog } from '../components/IdeaDialog';
import { createLogger } from '../utils/clientLogger';
import type { Idea, IdeaMetadata, IdeaSource, IdeaPlan } from '../types/idea';
import styles from './Ideas.module.css';

const log = createLogger('Ideas');

export function Ideas() {
  const { workspaceId } = useParams<{ workspaceId?: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { session } = useSession();
  const {
    isLoading,
    filter,
    setFilter,
    counts,
    ideasByStatus,
    selectedIdeaId,
    setSelectedIdeaId,
    getIdea,
    fetchIdeasByLane,
    setIdeas,
    moveIdea,
    deleteIdea,
  } = useIdeas();
  const { setNavigationContext } = useFacilitator();

  const [showOverlay, setShowOverlay] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [isLoadingIdea, setIsLoadingIdea] = useState(false);

  // WebSocket for real-time updates
  const handleResourceCreated = useCallback((
    _resourceId: string,
    resourceType: ResourceType,
    data: unknown
  ) => {
    if (resourceType === 'idea') {
      const idea = data as IdeaMetadata;
      log.log('Idea created via WebSocket', { id: idea.id, title: idea.title, agentStatus: idea.agentStatus });
      setIdeas(prev => {
        // Avoid duplicates
        if (prev.some(i => i.id === idea.id)) {
          log.log('Idea already exists, skipping', { id: idea.id });
          return prev;
        }
        return [idea, ...prev];
      });
    }
  }, [setIdeas]);

  const handleResourceUpdated = useCallback((
    _resourceId: string,
    resourceType: ResourceType,
    data: unknown
  ) => {
    if (resourceType === 'idea') {
      const update = data as Partial<IdeaMetadata> & { id: string };
      log.log('Idea updated via WebSocket', { id: update.id, agentStatus: update.agentStatus, keys: Object.keys(update) });
      // Merge the update with existing idea data to preserve fields
      // This is important for partial updates like agentStatus changes
      setIdeas(prev => prev.map(i => i.id === update.id ? { ...i, ...update } : i));
    }
  }, [setIdeas]);

  const handleResourceDeleted = useCallback((
    resourceId: string,
    resourceType: ResourceType
  ) => {
    if (resourceType === 'idea') {
      setIdeas(prev => prev.filter(i => i.id !== resourceId));
    }
  }, [setIdeas]);

  useWorkspaceSocket({
    workspaceId,
    sessionColor: session?.color,
    onResourceCreated: handleResourceCreated,
    onResourceUpdated: handleResourceUpdated,
    onResourceDeleted: handleResourceDeleted,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  // Fetch ideas on mount
  useEffect(() => {
    if (user) {
      fetchIdeasByLane(workspaceId);
    }
  }, [workspaceId, user, fetchIdeasByLane]);

  // Update navigation context for Facilitator
  useEffect(() => {
    setNavigationContext({
      currentPage: 'Ideas Kanban',
      workspaceId,
    });
    return () => setNavigationContext({});
  }, [workspaceId, setNavigationContext]);

  // Listen for facilitator:openIdea events (from Facilitator navigation actions)
  useEffect(() => {
    const handleOpenIdea = async (event: Event) => {
      const customEvent = event as CustomEvent<{
        ideaId: string;
        topicId?: string;
        focusInput?: boolean;
      }>;
      const { ideaId } = customEvent.detail;

      if (!ideaId) return;

      setIsLoadingIdea(true);
      try {
        const idea = await getIdea(ideaId);
        if (idea) {
          setEditingIdea(idea);
          setShowOverlay(true);
          setSelectedIdeaId(ideaId);
        }
      } catch (err) {
        console.error('[Ideas] Failed to open idea from facilitator:', err);
      } finally {
        setIsLoadingIdea(false);
      }
    };

    window.addEventListener('facilitator:openIdea', handleOpenIdea);
    return () => window.removeEventListener('facilitator:openIdea', handleOpenIdea);
  }, [getIdea, setSelectedIdeaId]);

  // Listen for facilitator:ideasChanged events (refetch when ideas are created/updated via Facilitator)
  useEffect(() => {
    const handleIdeasChanged = () => {
      fetchIdeasByLane(workspaceId);
    };
    window.addEventListener('facilitator:ideasChanged', handleIdeasChanged);
    return () => window.removeEventListener('facilitator:ideasChanged', handleIdeasChanged);
  }, [fetchIdeasByLane, workspaceId]);

  // Filter options for Segmented control
  const filterOptions = [
    { value: 'all', label: `All (${counts.total})` },
    { value: 'user', label: `User (${counts.user})` },
    { value: 'ai', label: `AI (${counts.ai})` },
  ];

  const handleFilterChange = (value: string) => {
    setFilter({ ...filter, source: value as IdeaSource | 'all' });
  };

  // Select a card (single click or keyboard navigation)
  const handleCardSelect = useCallback((ideaId: string) => {
    setSelectedIdeaId(ideaId);
  }, [setSelectedIdeaId]);

  // Open a card (double click or Enter key)
  // Always uses IdeaDialog which auto-detects the phase from idea status
  const handleCardOpen = useCallback(async (ideaId: string) => {
    setSelectedIdeaId(ideaId);
    setIsLoadingIdea(true);

    try {
      // Fetch full idea with description
      const fullIdea = await getIdea(ideaId);
      if (fullIdea) {
        // Open in IdeaDialog - it auto-detects phase based on idea.status
        // (ideation for 'new'/'draft', planning for 'exploring')
        setEditingIdea(fullIdea);
        setShowOverlay(true);
      }
    } catch (err) {
      console.error('Failed to load idea:', err);
    } finally {
      setIsLoadingIdea(false);
    }
  }, [getIdea, setSelectedIdeaId]);

  const handleNewIdea = useCallback(() => {
    setEditingIdea(null);
    setShowOverlay(true);
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setShowOverlay(false);
    setEditingIdea(null);
    setSelectedIdeaId(null);
  }, [setSelectedIdeaId]);

  const handleIdeaSuccess = useCallback((_idea: Idea) => {
    handleCloseOverlay();
  }, [handleCloseOverlay]);

  // Handle status change from IdeaDialog (e.g., transitioning to planning)
  // The IdeaDialog handles phase transitions internally.
  // We intentionally do NOT update state here to avoid triggering a re-render cascade
  // that could cause the overlay to reset. The idea will be refetched when the overlay closes.
  const handleStatusChange = useCallback((_idea: Idea, _newStatus: string) => {
    // No-op: IdeaDialog handles the transition internally
  }, []);

  // Handle starting execution from IdeaDialog - just call the server API
  // IdeaDialog handles the phase transition internally
  const handleStartExecution = useCallback(async (plan: IdeaPlan) => {
    // The IdeaDialog handles starting execution - this callback allows kanban to update
    console.log('[Ideas] Execution started for plan:', plan);
  }, []);

  // Handle idea created immediately (for background processing)
  // This updates editingIdea so that if user closes and reopens, we reconnect to the same idea
  const handleIdeaCreated = useCallback((idea: Idea) => {
    log.log('Idea created immediately', { id: idea.id, title: idea.title });
    setEditingIdea(idea);
  }, []);

  // Whether delete is disabled (when overlay is open)
  const deleteDisabled = showOverlay;

  if (!user) return null;

  return (
    <div className={styles.ideasPage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            Ideas
            <span className={styles.countBadge}>{counts.total} total</span>
          </h1>
        </div>
        <div className={styles.headerCenter}>
          <Segmented
            options={filterOptions}
            value={filter.source || 'all'}
            onChange={handleFilterChange}
            size="sm"
          />
        </div>
        <div className={styles.headerRight}>
          <Button variant="ghost" icon={<FilterIcon />} aria-label="Filter" />
          <Button variant="ghost" icon={<SearchIcon />} aria-label="Search" />
          <Button
            variant="primary"
            icon={<AddIcon />}
            onClick={handleNewIdea}
          >
            New Idea
          </Button>
        </div>
      </header>

      {/* Kanban Board */}
      {isLoading ? (
        <div className={styles.loading}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div className={styles.boardContainer}>
          <KanbanBoard
            ideasByStatus={ideasByStatus}
            onMoveIdea={moveIdea}
            onDeleteIdea={deleteIdea}
            onCardSelect={handleCardSelect}
            onCardOpen={handleCardOpen}
            selectedIdeaId={selectedIdeaId}
            onClearSelection={() => setSelectedIdeaId(null)}
            onAddIdea={handleNewIdea}
            workspaceId={workspaceId}
            deleteDisabled={deleteDisabled}
          />
        </div>
      )}

      {/* Idea Dialog - only render when open to ensure fresh context for new ideas */}
      {showOverlay && (
        <IdeaDialog
          idea={editingIdea}
          open={showOverlay}
          onClose={handleCloseOverlay}
          workspaceId={workspaceId}
          onSuccess={handleIdeaSuccess}
          onStatusChange={handleStatusChange}
          onStartExecution={handleStartExecution}
          onIdeaCreated={handleIdeaCreated}
        />
      )}

      {/* Loading indicator for idea fetch */}
      {isLoadingIdea && (
        <div className={styles.loadingOverlay}>
          <Spinner size="lg" />
        </div>
      )}
    </div>
  );
}
