import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from '@ui-kit/router';
import { Spinner, SplitPane } from '@ui-kit/react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { useTopics } from '../contexts/TopicsContext';
import { useFacilitator } from '../contexts/FacilitatorContext';
import { useWorkspaces } from '../contexts/WorkspaceContext';
import { useSession } from '../contexts/SessionContext';
import { useWorkspaceSocket, type ResourceType } from '../hooks/useWorkspaceSocket';
import { TopicsTree } from '../components/Topics/TopicsTree';
import { TopicDetail } from '../components/Topics/TopicDetail';
import { TopicsEmptyState } from '../components/Topics/TopicsEmptyState';
import { NewTopicDialog } from '../components/Topics/NewTopicDialog';
import type { Topic, TopicMetadata } from '../types/topic';
import styles from './Topics.module.css';

export function Topics() {
  const { workspaceId, topicId: urlTopicId } = useParams<{ workspaceId?: string; topicId?: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { session } = useSession();
  const {
    topics,
    isLoading,
    selectedTopicId,
    setSelectedTopicId,
    fetchTopicsGraph,
    setTopics,
    deleteTopic,
  } = useTopics();
  const { setNavigationContext, open: openFacilitator } = useFacilitator();
  const { workspaces } = useWorkspaces();

  // Get the current workspace name for navigation context
  const currentWorkspace = workspaceId && workspaceId !== 'all'
    ? workspaces.find(w => w.id === workspaceId)
    : null;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | undefined>();
  const [startInlineEdit, setStartInlineEdit] = useState<(() => void) | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; topicId: string | null }>({
    open: false,
    topicId: null,
  });

  // WebSocket for real-time updates
  const handleResourceCreated = useCallback((
    _resourceId: string,
    resourceType: ResourceType,
    data: unknown
  ) => {
    if (resourceType === 'topic') {
      setTopics(prev => {
        const topic = data as TopicMetadata;
        if (prev.some(t => t.id === topic.id)) return prev;
        return [topic, ...prev];
      });
    }
  }, [setTopics]);

  const handleResourceUpdated = useCallback((
    _resourceId: string,
    resourceType: ResourceType,
    data: unknown
  ) => {
    if (resourceType === 'topic') {
      const topic = data as TopicMetadata;
      setTopics(prev => prev.map(t => t.id === topic.id ? topic : t));
    }
  }, [setTopics]);

  const handleResourceDeleted = useCallback((
    resourceId: string,
    resourceType: ResourceType
  ) => {
    if (resourceType === 'topic') {
      setTopics(prev => prev.filter(t => t.id !== resourceId));
      if (selectedTopicId === resourceId) {
        setSelectedTopicId(null);
      }
    }
  }, [setTopics, selectedTopicId, setSelectedTopicId]);

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

  // Fetch topics on mount
  // Pass undefined when "all" to fetch from all workspaces
  useEffect(() => {
    if (user) {
      const effectiveWorkspaceId = workspaceId === 'all' ? undefined : workspaceId;

      fetchTopicsGraph(effectiveWorkspaceId);
    }
  }, [workspaceId, user, fetchTopicsGraph]);

  // Clear selection when workspace changes and there's no topic in the URL
  // This prevents the old topic ID from being added back to the URL
  const prevWorkspaceIdRef = useRef<string | undefined>(workspaceId);
  useEffect(() => {
    if (prevWorkspaceIdRef.current !== workspaceId) {
      prevWorkspaceIdRef.current = workspaceId;
      // If we switched workspaces and there's no topic ID in the URL, clear selection
      if (!urlTopicId) {
        setSelectedTopicId(null);
      }
    }
  }, [workspaceId, urlTopicId, setSelectedTopicId]);

  // Sync selectedTopicId from URL on mount/URL change only
  // Using a ref to track the last URL we synced from, to avoid re-syncing
  // when selectedTopicId changes from user interaction
  const lastSyncedUrlTopicId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (urlTopicId && urlTopicId !== lastSyncedUrlTopicId.current) {
      lastSyncedUrlTopicId.current = urlTopicId;
      setSelectedTopicId(urlTopicId);
    }
  }, [urlTopicId, setSelectedTopicId]);

  // Get the selected topic's name from the topics array for navigation context
  const selectedTopicName = selectedTopicId
    ? topics.find(t => t.id === selectedTopicId)?.name
    : undefined;

  // Update navigation context for Facilitator
  useEffect(() => {
    // Don't pass workspaceId when in "all" mode - it's not a real workspace
    const effectiveWorkspaceId = workspaceId === 'all' ? undefined : workspaceId;

    setNavigationContext({
      currentPage: workspaceId === 'all' ? 'Topics (All Workspaces)' : 'Topics',
      workspaceId: effectiveWorkspaceId,
      workspaceName: currentWorkspace?.name,
      activeTopicId: selectedTopicId || undefined,
      activeTopicName: selectedTopicName,
    });

    return () => setNavigationContext({});
  }, [workspaceId, currentWorkspace?.name, selectedTopicId, selectedTopicName, setNavigationContext]);

  // Update URL when selectedTopicId changes (e.g., from auto-select on create)
  // Use replaceState to avoid triggering router navigation
  // Track workspace to skip URL update when workspace just changed
  const prevWorkspaceForUrlRef = useRef<string | undefined>(workspaceId);
  useEffect(() => {
    const workspaceJustChanged = prevWorkspaceForUrlRef.current !== workspaceId;
    prevWorkspaceForUrlRef.current = workspaceId;

    // Don't update URL if workspace just changed - wait for selection to be cleared
    if (workspaceJustChanged) {
      return;
    }

    // Only update URL if selectedTopicId exists
    if (selectedTopicId) {
      const basePath = workspaceId ? `/${workspaceId}/topics` : '/topics';
      const expectedUrl = `${basePath}/${selectedTopicId}`;
      // Only update if URL doesn't already match (avoid unnecessary history entries)
      if (!window.location.pathname.endsWith(selectedTopicId)) {
        window.history.replaceState(null, '', expectedUrl);
      }
    }
  }, [selectedTopicId, workspaceId]);

  // Listen for facilitator:navigateToTopic events (from Facilitator navigation actions)
  // This is rarely needed now since topic_create auto-selects
  useEffect(() => {
    const handleNavigateToTopic = (event: Event) => {
      const customEvent = event as CustomEvent<{ topicId: string }>;
      const { topicId } = customEvent.detail;
      if (topicId && topicId !== selectedTopicId) {
        setSelectedTopicId(topicId);
        // URL will be updated by the selectedTopicId effect above
      }
    };

    window.addEventListener('facilitator:navigateToTopic', handleNavigateToTopic);
    return () => window.removeEventListener('facilitator:navigateToTopic', handleNavigateToTopic);
  }, [setSelectedTopicId, selectedTopicId]);

  const handleSelect = useCallback((topic: TopicMetadata | null) => {
    const topicId = topic?.id ?? null;
    setSelectedTopicId(topicId);
    // Update URL without triggering router navigation (avoids re-renders/focus loss)
    const basePath = workspaceId ? `/${workspaceId}/topics` : '/topics';
    const newUrl = topicId ? `${basePath}/${topicId}` : basePath;
    window.history.replaceState(null, '', newUrl);
  }, [setSelectedTopicId, workspaceId]);

  const handleCreateNew = useCallback((parentId?: string) => {
    setCreateParentId(parentId);
    setShowCreateModal(true);
  }, []);

  const handleEdit = useCallback((_topic: Topic) => {
    // TODO: Open edit modal
    console.log('Edit topic:', _topic);
  }, []);

  const handleDelete = useCallback((topicId: string) => {
    setDeleteConfirm({ open: true, topicId });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const topicId = deleteConfirm.topicId;
    setDeleteConfirm({ open: false, topicId: null });

    if (!topicId) return;

    const deleted = await deleteTopic(topicId);
    if (deleted && selectedTopicId === topicId) {
      setSelectedTopicId(null);
    }
  }, [deleteConfirm.topicId, deleteTopic, selectedTopicId, setSelectedTopicId]);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirm({ open: false, topicId: null });
  }, []);

  const handleNavigate = useCallback((topicId: string) => {
    setSelectedTopicId(topicId);
    // Update URL to reflect navigation
    const basePath = workspaceId ? `/${workspaceId}/topics` : '/topics';
    navigate(`${basePath}/${topicId}`);
  }, [setSelectedTopicId, navigate, workspaceId]);

  const handleInlineEditReady = useCallback((startEdit: () => void) => {
    setStartInlineEdit(() => startEdit);
  }, []);

  const handleCreateFromFRE = useCallback(() => {
    if (startInlineEdit) {
      startInlineEdit();
    }
  }, [startInlineEdit]);

  if (!user) return null;

  return (
    <div className={styles.topicsPage}>
      <SplitPane
        orientation="horizontal"
        defaultSize={360}
        minSize={280}
        maxSize={500}
        collapsible
        first={
          <TopicsTree
            onSelect={handleSelect}
            onCreateNew={handleCreateNew}
            selectedId={selectedTopicId}
            onInlineEditReady={handleInlineEditReady}
          />
        }
        second={
          <div className={styles.detailPanel}>
            {isLoading ? (
              <div className={styles.loading}>
                <Spinner size="lg" />
              </div>
            ) : selectedTopicId ? (
              <TopicDetail
                topicId={selectedTopicId}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCreateChild={handleCreateNew}
                onNavigate={handleNavigate}
              />
            ) : (
              <TopicsEmptyState
                hasTopics={topics.length > 0}
                onCreateTopic={handleCreateFromFRE}
                onStartChat={openFacilitator}
              />
            )}
          </div>
        }
      />

      {/* Create Topic Dialog */}
      {/* When in "all" mode, default new topics to personal workspace */}
      <NewTopicDialog
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateParentId(undefined);
        }}
        parentId={createParentId}
        workspaceId={workspaceId === 'all' ? `personal-${user?.id}` : workspaceId}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Topic?"
        message="Are you sure you want to delete this topic? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
