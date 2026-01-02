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
import { IdeaWorkspaceOverlay } from '../components/IdeaWorkspaceOverlay';
import { PlanningOverlay } from '../components/PlanningOverlay';
import { ExecutionOverlay } from '../components/ExecutionOverlay';
import type { Idea, IdeaMetadata, IdeaSource, IdeaPlan } from '../types/idea';
import styles from './Ideas.module.css';

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

  // Planning overlay state
  const [showPlanningOverlay, setShowPlanningOverlay] = useState(false);
  const [planningIdea, setPlanningIdea] = useState<Idea | null>(null);

  // Execution overlay state
  const [showExecutionOverlay, setShowExecutionOverlay] = useState(false);
  const [executionIdea, setExecutionIdea] = useState<Idea | null>(null);
  const [executionPlan, setExecutionPlan] = useState<IdeaPlan | null>(null);

  // WebSocket for real-time updates
  const handleResourceCreated = useCallback((
    _resourceId: string,
    resourceType: ResourceType,
    data: unknown
  ) => {
    if (resourceType === 'idea') {
      setIdeas(prev => {
        const idea = data as IdeaMetadata;
        // Avoid duplicates
        if (prev.some(i => i.id === idea.id)) return prev;
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
      const idea = data as IdeaMetadata;
      setIdeas(prev => prev.map(i => i.id === idea.id ? idea : i));
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
        thingId?: string;
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
  const handleCardOpen = useCallback(async (ideaId: string) => {
    setSelectedIdeaId(ideaId);
    setIsLoadingIdea(true);

    try {
      // Fetch full idea with description
      const fullIdea = await getIdea(ideaId);
      if (fullIdea) {
        // Open different overlay based on status
        if (fullIdea.status === 'exploring') {
          // Open planning overlay for ideas in exploring status
          setPlanningIdea(fullIdea);
          setShowPlanningOverlay(true);
        } else {
          // Open idea workspace for new ideas or editing
          setEditingIdea(fullIdea);
          setShowOverlay(true);
        }
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

  // Handle status change from IdeaWorkspaceOverlay (e.g., transitioning to planning)
  const handleStatusChange = useCallback((idea: Idea, newStatus: string) => {
    if (newStatus === 'exploring') {
      // Close the idea overlay and open planning overlay
      setShowOverlay(false);
      setEditingIdea(null);
      setPlanningIdea(idea);
      setShowPlanningOverlay(true);
    }
  }, []);

  // Handle closing planning overlay
  const handleClosePlanningOverlay = useCallback(() => {
    setShowPlanningOverlay(false);
    setPlanningIdea(null);
    setSelectedIdeaId(null);
  }, [setSelectedIdeaId]);

  // Handle starting execution from PlanningOverlay
  const handleStartExecution = useCallback((plan: IdeaPlan) => {
    if (!planningIdea) return;

    // Close planning overlay and open execution overlay
    setShowPlanningOverlay(false);
    setExecutionIdea(planningIdea);
    setExecutionPlan(plan);
    setPlanningIdea(null);
    setShowExecutionOverlay(true);
  }, [planningIdea]);

  // Handle closing execution overlay
  const handleCloseExecutionOverlay = useCallback(() => {
    setShowExecutionOverlay(false);
    setExecutionIdea(null);
    setExecutionPlan(null);
    setSelectedIdeaId(null);
  }, [setSelectedIdeaId]);

  // Handle execution complete
  const handleExecutionComplete = useCallback(() => {
    // TODO: Update idea status to 'completed' or move to next phase
    console.log('[Ideas] Execution complete for idea:', executionIdea?.id);
  }, [executionIdea]);

  // Whether delete is disabled (when overlays are open)
  const deleteDisabled = showOverlay || showPlanningOverlay || showExecutionOverlay;

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

      {/* Idea Workspace Overlay */}
      <IdeaWorkspaceOverlay
        idea={editingIdea}
        open={showOverlay}
        onClose={handleCloseOverlay}
        workspaceId={workspaceId}
        onSuccess={handleIdeaSuccess}
        onStatusChange={handleStatusChange}
      />

      {/* Planning Overlay */}
      {planningIdea && (
        <PlanningOverlay
          idea={planningIdea}
          open={showPlanningOverlay}
          onClose={handleClosePlanningOverlay}
          onStartExecution={handleStartExecution}
        />
      )}

      {/* Execution Overlay */}
      {executionIdea && executionPlan && (
        <ExecutionOverlay
          idea={executionIdea}
          plan={executionPlan}
          open={showExecutionOverlay}
          onClose={handleCloseExecutionOverlay}
          onExecutionComplete={handleExecutionComplete}
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
