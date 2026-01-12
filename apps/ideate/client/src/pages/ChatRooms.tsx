import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from '@ui-kit/router';
import { Button, Input, Modal, Spinner } from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { useAuth } from '../contexts/AuthContext';
import { useChat, type ChatRoomMetadata } from '../contexts/ChatContext';
import { useWorkspaces } from '../contexts/WorkspaceContext';
import { useSession } from '../contexts/SessionContext';
import { useFacilitator } from '../contexts/FacilitatorContext';
import { useWorkspaceSocket, type ResourcePresence, type ResourceType } from '../hooks/useWorkspaceSocket';
import { ChatRoomCard } from '../components/ChatRoomCard';
import styles from './ChatRooms.module.css';

export function ChatRooms() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { workspaces } = useWorkspaces();
  const {
    chatRooms,
    isLoading,
    fetchChatRooms,
    createChatRoom,
    updateChatRoom,
    deleteChatRoom,
    setChatRooms,
  } = useChat();
  const { session } = useSession();
  const { setNavigationContext } = useFacilitator();

  // Get the current workspace name for navigation context
  const currentWorkspace = workspaceId
    ? workspaces.find(w => w.id === workspaceId)
    : null;

  // Presence tracking for resources
  const [resourcePresence, setResourcePresence] = useState<Map<string, ResourcePresence[]>>(new Map());

  // Modal states
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoomMetadata | null>(null);
  const [renameName, setRenameName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle real-time resource events
  const handleResourceCreated = useCallback((resourceId: string, resourceType: ResourceType, data: unknown) => {
    if (resourceType === 'chatroom') {
      const chatRoom = data as ChatRoomMetadata;

      setChatRooms?.(prev => {
        if (prev.some(c => c.id === resourceId)) return prev;

        return [chatRoom, ...prev];
      });
    }
  }, [setChatRooms]);

  const handleResourceUpdated = useCallback((resourceId: string, resourceType: ResourceType, data: unknown) => {
    if (resourceType === 'chatroom') {
      const chatRoom = data as ChatRoomMetadata;

      setChatRooms?.(prev => prev.map(c => c.id === resourceId ? chatRoom : c));
    }
  }, [setChatRooms]);

  const handleResourceDeleted = useCallback((resourceId: string, resourceType: ResourceType) => {
    if (resourceType === 'chatroom') {
      setChatRooms?.(prev => prev.filter(c => c.id !== resourceId));
    }
  }, [setChatRooms]);

  const handlePresenceUpdate = useCallback((presence: Map<string, ResourcePresence[]>) => {
    setResourcePresence(new Map(presence));
  }, []);

  // Connect to workspace WebSocket for real-time updates
  useWorkspaceSocket({
    workspaceId,
    sessionColor: session?.color,
    onResourceCreated: handleResourceCreated,
    onResourceUpdated: handleResourceUpdated,
    onResourceDeleted: handleResourceDeleted,
    onPresenceUpdate: handlePresenceUpdate,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  // Fetch chat rooms on mount
  useEffect(() => {
    if (user && workspaceId) {
      fetchChatRooms(workspaceId);
    }
  }, [workspaceId, user, fetchChatRooms]);

  // Update navigation context for Facilitator
  useEffect(() => {
    setNavigationContext({
      currentPage: 'Chat',
      workspaceId,
      workspaceName: currentWorkspace?.name,
    });

    return () => {
      setNavigationContext({
        currentPage: undefined,
        workspaceId: undefined,
        workspaceName: undefined,
      });
    };
  }, [workspaceId, currentWorkspace?.name, setNavigationContext]);

  // Create chat room
  const handleCreate = async () => {
    if (!newName.trim() || !workspaceId) return;

    setIsCreating(true);
    try {
      await createChatRoom(newName.trim(), workspaceId);
      setNewName('');
      setShowNewModal(false);
    } finally {
      setIsCreating(false);
    }
  };

  // Rename chat room
  const openRenameModal = (chatRoom: ChatRoomMetadata) => {
    setSelectedChatRoom(chatRoom);
    setRenameName(chatRoom.name);
    setShowRenameModal(true);
  };

  const closeRenameModal = () => {
    setShowRenameModal(false);
    setSelectedChatRoom(null);
    setRenameName('');
  };

  const handleRename = async () => {
    if (!renameName.trim() || !selectedChatRoom) return;

    setIsRenaming(true);
    try {
      await updateChatRoom(selectedChatRoom.id, { name: renameName.trim() });
      closeRenameModal();
    } finally {
      setIsRenaming(false);
    }
  };

  // Delete chat room
  const openDeleteModal = (chatRoom: ChatRoomMetadata) => {
    setSelectedChatRoom(chatRoom);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedChatRoom(null);
  };

  const handleDelete = async () => {
    if (!selectedChatRoom) return;

    setIsDeleting(true);
    try {
      await deleteChatRoom(selectedChatRoom.id);
      closeDeleteModal();
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading state
  if (isAuthLoading) {
    return (
      <div className={styles.loading}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            <ChatIcon />
            Chat Rooms
          </h1>
          <Button icon={<AddIcon />} onClick={() => setShowNewModal(true)}>
            New Chat Room
          </Button>
        </header>

        {isLoading ? (
          <div className={styles.loading}>
            <Spinner />
          </div>
        ) : chatRooms.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <ChatIcon />
            </div>
            <h3 className={styles.emptyStateTitle}>No chat rooms yet</h3>
            <p className={styles.emptyStateDescription}>
              Create your first chat room to start collaborating
            </p>
            <div className={styles.emptyStateAction}>
              <Button icon={<AddIcon />} onClick={() => setShowNewModal(true)}>
                Create Chat Room
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {chatRooms.map((chatRoom) => (
              <ChatRoomCard
                key={chatRoom.id}
                chatRoom={chatRoom}
                onClick={() => navigate(`/${workspaceId}/chat/${chatRoom.id}`)}
                onEdit={() => openRenameModal(chatRoom)}
                onDelete={() => openDeleteModal(chatRoom)}
                showActions={chatRoom.ownerId === user?.id}
                presence={resourcePresence.get(chatRoom.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Chat Room Modal */}
      <Modal open={showNewModal} onClose={() => setShowNewModal(false)}>
        <div className={styles.modalContent}>
          <h2>Create New Chat Room</h2>
          <Input
            placeholder="Enter a name for your chat room"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => setShowNewModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={!newName.trim() || isCreating}
            >
              {isCreating ? <Spinner size="sm" /> : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rename Chat Room Modal */}
      <Modal open={showRenameModal} onClose={closeRenameModal}>
        <div className={styles.modalContent}>
          <h2>Rename Chat Room</h2>
          <Input
            placeholder="Enter new name"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            autoFocus
          />
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={closeRenameModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRename}
              disabled={!renameName.trim() || isRenaming}
            >
              {isRenaming ? <Spinner size="sm" /> : 'Rename'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Chat Room Modal */}
      <Modal open={showDeleteModal} onClose={closeDeleteModal}>
        <div className={styles.modalContent}>
          <h2>Delete Chat Room</h2>
          <p className={styles.deleteWarning}>
            Are you sure you want to delete <strong>{selectedChatRoom?.name}</strong>?
            This action cannot be undone and all messages will be lost.
          </p>
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Spinner size="sm" /> : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
