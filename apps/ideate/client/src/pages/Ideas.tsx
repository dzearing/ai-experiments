import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from '@ui-kit/router';
import { Button, Segmented, Spinner } from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { FilterIcon } from '@ui-kit/icons/FilterIcon';
import { SearchIcon } from '@ui-kit/icons/SearchIcon';
import { useAuth } from '../contexts/AuthContext';
import { useIdeas } from '../contexts/IdeasContext';
import { useFacilitator } from '../contexts/FacilitatorContext';
import { useWorkspaces } from '../contexts/WorkspaceContext';
import { useSession } from '../contexts/SessionContext';
import { useWorkspaceSocket, type ResourceType } from '../hooks/useWorkspaceSocket';
import { useIdeasQuery } from '../hooks/useIdeasQuery';
import { KanbanBoard } from '../components/KanbanBoard';
import { IdeaDialog } from '../components/IdeaDialog';
import { createLogger } from '../utils/clientLogger';
import type { Idea, IdeaMetadata, IdeaSource, IdeaPlan, IdeaStatus } from '../types/idea';
import styles from './Ideas.module.css';

const log = createLogger('Ideas');

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

export function Ideas() {
  const { workspaceId: routeWorkspaceId } = useParams<{ workspaceId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Track if we've handled the initial query param
  const initialIdeaHandled = useRef(false);
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { session } = useSession();
  const { setNavigationContext } = useFacilitator();
  const { workspaces } = useWorkspaces();

  // Get getIdea from context (for fetching full idea details)
  const { getIdea } = useIdeas();

  // Compute effective workspace ID (undefined for "all" workspaces)
  const effectiveWorkspaceId = routeWorkspaceId === 'all' ? undefined : routeWorkspaceId;

  // Use unified ideas query hook
  const {
    ideasByStatus,
    counts,
    isLoading,
    refetch,
    addIdea,
    updateIdea,
    removeIdea,
    moveIdea,
    deleteIdea,
  } = useIdeasQuery({
    workspaceId: effectiveWorkspaceId,
  });

  // Local state for selection and filtering
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<IdeaSource | 'all'>('all');

  // Get the current workspace name for navigation context
  const currentWorkspace = routeWorkspaceId && routeWorkspaceId !== 'all'
    ? workspaces.find(w => w.id === routeWorkspaceId)
    : null;

  const [showOverlay, setShowOverlay] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [isLoadingIdea, setIsLoadingIdea] = useState(false);

  // Apply source filter to ideasByStatus
  const filteredIdeasByStatus = useMemo(() => {
    if (sourceFilter === 'all') {
      return ideasByStatus;
    }

    const filtered: Record<IdeaStatus, IdeaMetadata[]> = {
      new: [],
      exploring: [],
      executing: [],
      archived: [],
    };

    for (const status of Object.keys(ideasByStatus) as IdeaStatus[]) {
      filtered[status] = ideasByStatus[status].filter(idea => idea.source === sourceFilter);
    }

    return filtered;
  }, [ideasByStatus, sourceFilter]);

  // WebSocket for real-time updates
  const handleResourceCreated = useCallback((
    _resourceId: string,
    resourceType: ResourceType,
    data: unknown
  ) => {
    if (resourceType === 'idea') {
      const idea = data as IdeaMetadata;

      log.log('Idea created via WebSocket', { id: idea.id, title: idea.title, agentStatus: idea.agentStatus });
      addIdea(idea);
    }
  }, [addIdea]);

  const handleResourceUpdated = useCallback((
    _resourceId: string,
    resourceType: ResourceType,
    data: unknown
  ) => {
    if (resourceType === 'idea') {
      const update = data as Partial<IdeaMetadata> & { id: string };

      log.log('Idea updated via WebSocket', { id: update.id, agentStatus: update.agentStatus, keys: Object.keys(update) });
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

  useWorkspaceSocket({
    workspaceId: routeWorkspaceId,
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

  // Update navigation context for Facilitator
  useEffect(() => {
    setNavigationContext({
      currentPage: routeWorkspaceId === 'all' ? 'Ideas Kanban (All Workspaces)' : 'Ideas Kanban',
      workspaceId: effectiveWorkspaceId,
      workspaceName: currentWorkspace?.name,
    });

    return () => setNavigationContext({});
  }, [routeWorkspaceId, effectiveWorkspaceId, currentWorkspace?.name, setNavigationContext]);

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
  }, [getIdea]);

  // Listen for facilitator:ideasChanged events (refetch when ideas are created/updated via Facilitator)
  useEffect(() => {
    const handleIdeasChanged = () => {
      refetch();
    };

    window.addEventListener('facilitator:ideasChanged', handleIdeasChanged);

    return () => window.removeEventListener('facilitator:ideasChanged', handleIdeasChanged);
  }, [refetch]);

  // Filter options for Segmented control
  const filterOptions = [
    { value: 'all', label: `All (${counts.total})` },
    { value: 'user', label: `User (${counts.user})` },
    { value: 'ai', label: `AI (${counts.ai})` },
  ];

  const handleFilterChange = (value: string) => {
    setSourceFilter(value as IdeaSource | 'all');
  };

  // Select a card (single click or keyboard navigation)
  const handleCardSelect = useCallback((ideaId: string) => {
    setSelectedIdeaId(ideaId);
  }, []);

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
        // Update URL without navigation
        updateIdeaQueryParam(ideaId);
      }
    } catch (err) {
      console.error('Failed to load idea:', err);
    } finally {
      setIsLoadingIdea(false);
    }
  }, [getIdea]);

  const handleNewIdea = useCallback(() => {
    setEditingIdea(null);
    setShowOverlay(true);
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setShowOverlay(false);
    setEditingIdea(null);
    setSelectedIdeaId(null);
    // Remove idea from URL without navigation
    updateIdeaQueryParam(null);
  }, []);

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
    // Update URL with the new idea ID
    updateIdeaQueryParam(idea.id);
  }, []);

  // Handle maximize - navigate to full page view (adds to history stack)
  const handleMaximize = useCallback((ideaId: string) => {
    navigate(`/${routeWorkspaceId}/ideas/${ideaId}`);
  }, [navigate, routeWorkspaceId]);

  // Open idea from URL query param on initial mount
  useEffect(() => {
    if (initialIdeaHandled.current || isLoading) return;

    const ideaIdFromUrl = searchParams.get('idea');

    if (ideaIdFromUrl) {
      initialIdeaHandled.current = true;
      handleCardOpen(ideaIdFromUrl);
    }
  }, [searchParams, isLoading, handleCardOpen]);

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
            value={sourceFilter}
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
            ideasByStatus={filteredIdeasByStatus}
            onMoveIdea={moveIdea}
            onDeleteIdea={deleteIdea}
            onCardSelect={handleCardSelect}
            onCardOpen={handleCardOpen}
            selectedIdeaId={selectedIdeaId}
            onClearSelection={() => setSelectedIdeaId(null)}
            onAddIdea={handleNewIdea}
            workspaceId={routeWorkspaceId}
            deleteDisabled={deleteDisabled}
          />
        </div>
      )}

      {/* Idea Dialog - only render when open to ensure fresh context for new ideas */}
      {/* When in "all" mode, default new ideas to personal workspace */}
      {showOverlay && (
        <IdeaDialog
          idea={editingIdea}
          open={showOverlay}
          onClose={handleCloseOverlay}
          workspaceId={routeWorkspaceId === 'all' ? `personal-${user?.id}` : routeWorkspaceId}
          onSuccess={handleIdeaSuccess}
          onStatusChange={handleStatusChange}
          onStartExecution={handleStartExecution}
          onIdeaCreated={handleIdeaCreated}
          onMaximize={handleMaximize}
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
