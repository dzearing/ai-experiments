import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from '@ui-kit/router';
import { Spinner, SplitPane } from '@ui-kit/react';
import { useAuth } from '../contexts/AuthContext';
import { useThings } from '../contexts/ThingsContext';
import { useFacilitator } from '../contexts/FacilitatorContext';
import { useSession } from '../contexts/SessionContext';
import { useWorkspaceSocket, type ResourceType } from '../hooks/useWorkspaceSocket';
import { ThingsTree } from '../components/Things/ThingsTree';
import { ThingDetail } from '../components/Things/ThingDetail';
import { ThingsEmptyState } from '../components/Things/ThingsEmptyState';
import { NewThingDialog } from '../components/Things/NewThingDialog';
import type { Thing, ThingMetadata } from '../types/thing';
import styles from './Things.module.css';

export function Things() {
  const { workspaceId } = useParams<{ workspaceId?: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { session } = useSession();
  const {
    things,
    isLoading,
    selectedThingId,
    setSelectedThingId,
    fetchThingsGraph,
    setThings,
    getThing,
    deleteThing,
  } = useThings();
  const { setNavigationContext, open: openFacilitator } = useFacilitator();

  const [selectedThing, setSelectedThing] = useState<Thing | null>(null);
  const [isLoadingThing, setIsLoadingThing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | undefined>();
  const [startInlineEdit, setStartInlineEdit] = useState<(() => void) | null>(null);

  // WebSocket for real-time updates
  const handleResourceCreated = useCallback((
    _resourceId: string,
    resourceType: ResourceType,
    data: unknown
  ) => {
    if (resourceType === 'thing') {
      setThings(prev => {
        const thing = data as ThingMetadata;
        if (prev.some(t => t.id === thing.id)) return prev;
        return [thing, ...prev];
      });
    }
  }, [setThings]);

  const handleResourceUpdated = useCallback((
    _resourceId: string,
    resourceType: ResourceType,
    data: unknown
  ) => {
    if (resourceType === 'thing') {
      const thing = data as ThingMetadata;
      setThings(prev => prev.map(t => t.id === thing.id ? thing : t));
      // Update selected thing if it's the one being updated
      if (selectedThingId === thing.id) {
        setSelectedThing(prev => prev ? { ...prev, ...thing } : null);
      }
    }
  }, [setThings, selectedThingId]);

  const handleResourceDeleted = useCallback((
    resourceId: string,
    resourceType: ResourceType
  ) => {
    if (resourceType === 'thing') {
      setThings(prev => prev.filter(t => t.id !== resourceId));
      if (selectedThingId === resourceId) {
        setSelectedThingId(null);
        setSelectedThing(null);
      }
    }
  }, [setThings, selectedThingId, setSelectedThingId]);

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

  // Fetch things on mount
  useEffect(() => {
    if (user) {
      fetchThingsGraph(workspaceId);
    }
  }, [workspaceId, user, fetchThingsGraph]);

  // Update navigation context for Facilitator
  useEffect(() => {
    setNavigationContext({
      currentPage: 'Things',
      workspaceId,
      activeThingId: selectedThingId || undefined,
      activeThingName: selectedThing?.name,
    });
    return () => setNavigationContext({});
  }, [workspaceId, selectedThingId, selectedThing?.name, setNavigationContext]);

  // Load selected thing details
  useEffect(() => {
    if (!selectedThingId) {
      setSelectedThing(null);
      return;
    }

    let mounted = true;
    setIsLoadingThing(true);

    getThing(selectedThingId).then(thing => {
      if (mounted) {
        setSelectedThing(thing);
        setIsLoadingThing(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [selectedThingId, getThing]);

  const handleSelect = useCallback((thing: ThingMetadata | null) => {
    setSelectedThingId(thing?.id ?? null);
  }, [setSelectedThingId]);

  const handleCreateNew = useCallback((parentId?: string) => {
    setCreateParentId(parentId);
    setShowCreateModal(true);
  }, []);

  const handleEdit = useCallback((_thing: Thing) => {
    // TODO: Open edit modal
    console.log('Edit thing:', _thing);
  }, []);

  const handleDelete = useCallback(async (thingId: string) => {
    if (!confirm('Are you sure you want to delete this thing?')) {
      return;
    }
    const deleted = await deleteThing(thingId);
    if (deleted && selectedThingId === thingId) {
      setSelectedThingId(null);
      setSelectedThing(null);
    }
  }, [deleteThing, selectedThingId, setSelectedThingId]);

  const handleNavigate = useCallback((thingId: string) => {
    setSelectedThingId(thingId);
  }, [setSelectedThingId]);

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
    <div className={styles.thingsPage}>
      <SplitPane
        orientation="horizontal"
        defaultSize={360}
        minSize={280}
        maxSize={500}
        collapsible
        first={
          <ThingsTree
            onSelect={handleSelect}
            onCreateNew={handleCreateNew}
            selectedId={selectedThingId}
            onInlineEditReady={handleInlineEditReady}
          />
        }
        second={
          <div className={styles.detailPanel}>
            {isLoading || isLoadingThing ? (
              <div className={styles.loading}>
                <Spinner size="lg" />
              </div>
            ) : selectedThingId && selectedThing ? (
              <ThingDetail
                thingId={selectedThingId}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCreateChild={handleCreateNew}
                onNavigate={handleNavigate}
              />
            ) : (
              <ThingsEmptyState
                hasThings={things.length > 0}
                onCreateThing={handleCreateFromFRE}
                onStartChat={openFacilitator}
              />
            )}
          </div>
        }
      />

      {/* Create Thing Dialog */}
      <NewThingDialog
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateParentId(undefined);
        }}
        parentId={createParentId}
        workspaceId={workspaceId}
      />
    </div>
  );
}
