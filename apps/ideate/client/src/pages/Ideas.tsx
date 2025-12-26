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
import type { Idea, IdeaMetadata, IdeaSource } from '../types/idea';
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
    selectedIdeaId,
    setSelectedIdeaId,
    getIdea,
    fetchIdeasByLane,
    setIdeas,
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

  // Filter options for Segmented control
  const filterOptions = [
    { value: 'all', label: `All (${counts.total})` },
    { value: 'user', label: `User (${counts.user})` },
    { value: 'ai', label: `AI (${counts.ai})` },
  ];

  const handleFilterChange = (value: string) => {
    setFilter({ ...filter, source: value as IdeaSource | 'all' });
  };

  const handleCardClick = useCallback(async (ideaId: string) => {
    setSelectedIdeaId(ideaId);
    setIsLoadingIdea(true);

    try {
      // Fetch full idea with description
      const fullIdea = await getIdea(ideaId);
      if (fullIdea) {
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
            workspaceId={workspaceId}
            onCardClick={handleCardClick}
            selectedIdeaId={selectedIdeaId}
            onAddIdea={handleNewIdea}
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
      />

      {/* Loading indicator for idea fetch */}
      {isLoadingIdea && (
        <div className={styles.loadingOverlay}>
          <Spinner size="lg" />
        </div>
      )}
    </div>
  );
}
