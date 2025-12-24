import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from '@ui-kit/router';
import { Breadcrumb, Button, Input, Modal, Spinner } from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspaces, type Workspace } from '../contexts/WorkspaceContext';
import { useDocuments, type DocumentMetadata } from '../contexts/DocumentContext';
import { useChat, type ChatRoomMetadata } from '../contexts/ChatContext';
import { useSession } from '../contexts/SessionContext';
import { useFacilitator } from '../contexts/FacilitatorContext';
import { useWorkspaceSocket, type ResourcePresence } from '../hooks/useWorkspaceSocket';
import { DocumentCard } from '../components/DocumentCard';
import { ChatRoomCard } from '../components/ChatRoomCard';
import styles from './WorkspaceDetail.module.css';

export function WorkspaceDetail() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { getWorkspace, generateShareLink } = useWorkspaces();
  const { documents, isLoading, fetchDocuments, createDocument, updateDocument, deleteDocument, setDocuments } = useDocuments();
  const { chatRooms, isLoading: isLoadingChatRooms, fetchChatRooms, createChatRoom, updateChatRoom, deleteChatRoom, setChatRooms } = useChat();
  const { session } = useSession();
  const { setNavigationContext } = useFacilitator();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);

  // Presence tracking for resources
  const [resourcePresence, setResourcePresence] = useState<Map<string, ResourcePresence[]>>(new Map());

  // Handle real-time resource events
  const handleResourceCreated = useCallback((resourceId: string, resourceType: 'document' | 'chatroom', data: unknown) => {
    if (resourceType === 'document') {
      const doc = data as DocumentMetadata;
      setDocuments?.(prev => {
        // Avoid duplicates
        if (prev.some(d => d.id === resourceId)) return prev;
        return [doc, ...prev];
      });
    } else {
      const chatRoom = data as ChatRoomMetadata;
      setChatRooms?.(prev => {
        if (prev.some(c => c.id === resourceId)) return prev;
        return [chatRoom, ...prev];
      });
    }
  }, [setDocuments, setChatRooms]);

  const handleResourceUpdated = useCallback((resourceId: string, resourceType: 'document' | 'chatroom', data: unknown) => {
    if (resourceType === 'document') {
      const doc = data as DocumentMetadata;
      setDocuments?.(prev => prev.map(d => d.id === resourceId ? doc : d));
    } else {
      const chatRoom = data as ChatRoomMetadata;
      setChatRooms?.(prev => prev.map(c => c.id === resourceId ? chatRoom : c));
    }
  }, [setDocuments, setChatRooms]);

  const handleResourceDeleted = useCallback((resourceId: string, resourceType: 'document' | 'chatroom') => {
    if (resourceType === 'document') {
      setDocuments?.(prev => prev.filter(d => d.id !== resourceId));
    } else {
      setChatRooms?.(prev => prev.filter(c => c.id !== resourceId));
    }
  }, [setDocuments, setChatRooms]);

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

  // Document modal states
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);

  // Delete document state
  const [showDeleteDocModal, setShowDeleteDocModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  // Rename document state
  const [showRenameDocModal, setShowRenameDocModal] = useState(false);
  const [renameDocTitle, setRenameDocTitle] = useState('');
  const [isRenamingDoc, setIsRenamingDoc] = useState(false);

  // Chat room modal states
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Delete chat room state
  const [showDeleteChatModal, setShowDeleteChatModal] = useState(false);
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoomMetadata | null>(null);
  const [isDeletingChat, setIsDeletingChat] = useState(false);

  // Rename chat room state
  const [showRenameChatModal, setShowRenameChatModal] = useState(false);
  const [renameChatName, setRenameChatName] = useState('');
  const [isRenamingChat, setIsRenamingChat] = useState(false);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Check if current user is the owner
  const isOwner = workspace?.ownerId === user?.id;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  // Load workspace details
  useEffect(() => {
    async function loadWorkspace() {
      if (!workspaceId || !user) return;

      setIsLoadingWorkspace(true);
      const ws = await getWorkspace(workspaceId);
      setWorkspace(ws);
      setIsLoadingWorkspace(false);
    }

    loadWorkspace();
  }, [workspaceId, user, getWorkspace]);

  // Update facilitator navigation context when workspace changes
  useEffect(() => {
    setNavigationContext({
      currentPage: 'Workspace Detail',
      workspaceId: workspaceId,
      workspaceName: workspace?.name,
    });

    // Clear context when leaving the page
    return () => {
      setNavigationContext({});
    };
  }, [workspaceId, workspace?.name, setNavigationContext]);

  // Fetch documents and chat rooms for this workspace
  useEffect(() => {
    if (workspaceId && user) {
      fetchDocuments(workspaceId);
      fetchChatRooms(workspaceId);
    }
  }, [workspaceId, user, fetchDocuments, fetchChatRooms]);

  // Document handlers
  const handleCreateDocument = async () => {
    if (!newDocTitle.trim() || !workspaceId) return;

    setIsCreatingDoc(true);
    try {
      const doc = await createDocument(newDocTitle.trim(), workspaceId);
      setShowNewDocModal(false);
      setNewDocTitle('');
      navigate(`/doc/${doc.id}`);
    } finally {
      setIsCreatingDoc(false);
    }
  };

  const openDeleteDocModal = (doc: DocumentMetadata) => {
    setSelectedDocument(doc);
    setShowDeleteDocModal(true);
  };

  const closeDeleteDocModal = () => {
    setShowDeleteDocModal(false);
    setSelectedDocument(null);
  };

  const handleDeleteDocument = async () => {
    if (!selectedDocument) return;

    setIsDeletingDoc(true);
    try {
      const success = await deleteDocument(selectedDocument.id);
      if (success) {
        closeDeleteDocModal();
      }
    } finally {
      setIsDeletingDoc(false);
    }
  };

  const openRenameDocModal = (doc: DocumentMetadata) => {
    setSelectedDocument(doc);
    setRenameDocTitle(doc.title);
    setShowRenameDocModal(true);
  };

  const closeRenameDocModal = () => {
    setShowRenameDocModal(false);
    setSelectedDocument(null);
    setRenameDocTitle('');
  };

  const handleRenameDocument = async () => {
    if (!selectedDocument || !renameDocTitle.trim()) return;

    setIsRenamingDoc(true);
    try {
      const result = await updateDocument(selectedDocument.id, { title: renameDocTitle.trim() });
      if (result) {
        closeRenameDocModal();
      }
    } finally {
      setIsRenamingDoc(false);
    }
  };

  // Chat room handlers
  const handleCreateChatRoom = async () => {
    if (!newChatName.trim() || !workspaceId) return;

    setIsCreatingChat(true);
    try {
      const chatRoom = await createChatRoom(newChatName.trim(), workspaceId);
      setShowNewChatModal(false);
      setNewChatName('');
      navigate(`/chat/${chatRoom.id}`);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const openDeleteChatModal = (chatRoom: ChatRoomMetadata) => {
    setSelectedChatRoom(chatRoom);
    setShowDeleteChatModal(true);
  };

  const closeDeleteChatModal = () => {
    setShowDeleteChatModal(false);
    setSelectedChatRoom(null);
  };

  const handleDeleteChatRoom = async () => {
    if (!selectedChatRoom) return;

    setIsDeletingChat(true);
    try {
      const success = await deleteChatRoom(selectedChatRoom.id);
      if (success) {
        closeDeleteChatModal();
      }
    } finally {
      setIsDeletingChat(false);
    }
  };

  const openRenameChatModal = (chatRoom: ChatRoomMetadata) => {
    setSelectedChatRoom(chatRoom);
    setRenameChatName(chatRoom.name);
    setShowRenameChatModal(true);
  };

  const closeRenameChatModal = () => {
    setShowRenameChatModal(false);
    setSelectedChatRoom(null);
    setRenameChatName('');
  };

  const handleRenameChatRoom = async () => {
    if (!selectedChatRoom || !renameChatName.trim()) return;

    setIsRenamingChat(true);
    try {
      const result = await updateChatRoom(selectedChatRoom.id, { name: renameChatName.trim() });
      if (result) {
        closeRenameChatModal();
      }
    } finally {
      setIsRenamingChat(false);
    }
  };

  // Share handlers
  const handleOpenShareModal = useCallback(async () => {
    if (!workspaceId) return;

    setShowShareModal(true);
    setIsGeneratingLink(true);
    setLinkCopied(false);

    try {
      const token = await generateShareLink(workspaceId);
      if (token) {
        const link = `${window.location.origin}/join/${token}`;
        setShareLink(link);
      }
    } finally {
      setIsGeneratingLink(false);
    }
  }, [workspaceId, generateShareLink]);

  const handleRegenerateLink = useCallback(async () => {
    if (!workspaceId) return;

    setIsGeneratingLink(true);
    setLinkCopied(false);

    try {
      const token = await generateShareLink(workspaceId, true);
      if (token) {
        const link = `${window.location.origin}/join/${token}`;
        setShareLink(link);
      }
    } finally {
      setIsGeneratingLink(false);
    }
  }, [workspaceId, generateShareLink]);

  const handleCopyLink = useCallback(async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }, [shareLink]);

  const closeShareModal = useCallback(() => {
    setShowShareModal(false);
    setShareLink(null);
    setLinkCopied(false);
  }, []);

  if (!user || isLoadingWorkspace) {
    return (
      <div className={styles.loading}>
        <Spinner />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className={styles.notFound}>
        <h2>Workspace not found</h2>
        <p>The workspace you're looking for doesn't exist or you don't have access.</p>
        <Button onClick={() => navigate('/workspaces')}>
          Back to Workspaces
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.workspaceDetail}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <Breadcrumb
              items={[
                { label: 'Workspaces', href: '/workspaces' },
                { label: workspace.name },
              ]}
              linkComponent={Link}
            />
            {isOwner && (
              <Button
                size="sm"
                variant="ghost"
                icon={<ShareIcon />}
                onClick={handleOpenShareModal}
              >
                Share
              </Button>
            )}
          </div>
          {workspace.description && (
            <p className={styles.description}>{workspace.description}</p>
          )}
        </header>

        {/* Documents Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <FileIcon />
              Documents
            </h2>
            <Button size="sm" icon={<AddIcon />} onClick={() => setShowNewDocModal(true)}>
              New Document
            </Button>
          </div>

          {isLoading ? (
            <div className={styles.loadingSection}>
              <Spinner />
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              icon={<FileIcon />}
              title="No documents yet"
              description="Create your first document in this workspace"
              action={
                <Button icon={<AddIcon />} onClick={() => setShowNewDocModal(true)}>
                  Create Document
                </Button>
              }
            />
          ) : (
            <div className={styles.documentGrid}>
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onClick={() => navigate(`/doc/${doc.id}`)}
                  onEdit={() => openRenameDocModal(doc)}
                  onDelete={() => openDeleteDocModal(doc)}
                  showActions={doc.ownerId === user?.id}
                  presence={resourcePresence.get(doc.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Chats Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <ChatIcon />
              Chats
            </h2>
            <Button size="sm" icon={<AddIcon />} onClick={() => setShowNewChatModal(true)}>
              New Chat Room
            </Button>
          </div>

          {isLoadingChatRooms ? (
            <div className={styles.loadingSection}>
              <Spinner />
            </div>
          ) : chatRooms.length === 0 ? (
            <EmptyState
              icon={<ChatIcon />}
              title="No chat rooms yet"
              description="Create your first chat room in this workspace"
              action={
                <Button icon={<AddIcon />} onClick={() => setShowNewChatModal(true)}>
                  Create Chat Room
                </Button>
              }
            />
          ) : (
            <div className={styles.documentGrid}>
              {chatRooms.map((chatRoom) => (
                <ChatRoomCard
                  key={chatRoom.id}
                  chatRoom={chatRoom}
                  onClick={() => navigate(`/chat/${chatRoom.id}`)}
                  onEdit={() => openRenameChatModal(chatRoom)}
                  onDelete={() => openDeleteChatModal(chatRoom)}
                  showActions={chatRoom.ownerId === user?.id}
                  presence={resourcePresence.get(chatRoom.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* New Document Modal */}
      <Modal open={showNewDocModal} onClose={() => setShowNewDocModal(false)}>
        <div className={styles.modalContent}>
          <h2>Create New Document</h2>
          <Input
            placeholder="Enter a title for your document"
            value={newDocTitle}
            onChange={(e) => setNewDocTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateDocument()}
            autoFocus
          />
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => setShowNewDocModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateDocument}
              disabled={!newDocTitle.trim() || isCreatingDoc}
            >
              {isCreatingDoc ? <Spinner size="sm" /> : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rename Document Modal */}
      <Modal open={showRenameDocModal} onClose={closeRenameDocModal}>
        <div className={styles.modalContent}>
          <h2>Rename Document</h2>
          <Input
            placeholder="Enter new title"
            value={renameDocTitle}
            onChange={(e) => setRenameDocTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameDocument()}
            autoFocus
          />
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={closeRenameDocModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRenameDocument}
              disabled={!renameDocTitle.trim() || isRenamingDoc}
            >
              {isRenamingDoc ? <Spinner size="sm" /> : 'Rename'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Document Modal */}
      <Modal open={showDeleteDocModal} onClose={closeDeleteDocModal}>
        <div className={styles.modalContent}>
          <h2>Delete Document</h2>
          <p className={styles.deleteWarning}>
            Are you sure you want to delete <strong>{selectedDocument?.title}</strong>?
            This action cannot be undone.
          </p>
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={closeDeleteDocModal}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteDocument}
              disabled={isDeletingDoc}
            >
              {isDeletingDoc ? <Spinner size="sm" /> : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Chat Room Modal */}
      <Modal open={showNewChatModal} onClose={() => setShowNewChatModal(false)}>
        <div className={styles.modalContent}>
          <h2>Create New Chat Room</h2>
          <Input
            placeholder="Enter a name for your chat room"
            value={newChatName}
            onChange={(e) => setNewChatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateChatRoom()}
            autoFocus
          />
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => setShowNewChatModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateChatRoom}
              disabled={!newChatName.trim() || isCreatingChat}
            >
              {isCreatingChat ? <Spinner size="sm" /> : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rename Chat Room Modal */}
      <Modal open={showRenameChatModal} onClose={closeRenameChatModal}>
        <div className={styles.modalContent}>
          <h2>Rename Chat Room</h2>
          <Input
            placeholder="Enter new name"
            value={renameChatName}
            onChange={(e) => setRenameChatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameChatRoom()}
            autoFocus
          />
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={closeRenameChatModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRenameChatRoom}
              disabled={!renameChatName.trim() || isRenamingChat}
            >
              {isRenamingChat ? <Spinner size="sm" /> : 'Rename'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Chat Room Modal */}
      <Modal open={showDeleteChatModal} onClose={closeDeleteChatModal}>
        <div className={styles.modalContent}>
          <h2>Delete Chat Room</h2>
          <p className={styles.deleteWarning}>
            Are you sure you want to delete <strong>{selectedChatRoom?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={closeDeleteChatModal}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteChatRoom}
              disabled={isDeletingChat}
            >
              {isDeletingChat ? <Spinner size="sm" /> : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal open={showShareModal} onClose={closeShareModal}>
        <div className={styles.modalContent}>
          <h2>Share Workspace</h2>
          <p className={styles.shareDescription}>
            Anyone with this link can join your workspace.
          </p>

          {isGeneratingLink ? (
            <div className={styles.shareLinkLoading}>
              <Spinner size="sm" />
              <span>Generating link...</span>
            </div>
          ) : shareLink ? (
            <div className={styles.shareLinkContainer}>
              <div className={styles.shareLinkBox}>
                <LinkIcon />
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className={styles.shareLinkInput}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>
              <div className={styles.shareLinkActions}>
                <Button
                  variant="primary"
                  onClick={handleCopyLink}
                >
                  {linkCopied ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleRegenerateLink}
                  disabled={isGeneratingLink}
                >
                  Regenerate
                </Button>
              </div>
            </div>
          ) : (
            <p className={styles.shareError}>Failed to generate share link.</p>
          )}

          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={closeShareModal}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateIcon}>{icon}</div>
      <h3 className={styles.emptyStateTitle}>{title}</h3>
      <p className={styles.emptyStateDescription}>{description}</p>
      {action && <div className={styles.emptyStateAction}>{action}</div>}
    </div>
  );
}
