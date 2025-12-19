import { useEffect, useState } from 'react';
import { useNavigate, useParams } from '@ui-kit/router';
import { Button, Input, Modal, Spinner } from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { ArrowLeftIcon } from '@ui-kit/icons/ArrowLeftIcon';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspaces } from '../contexts/WorkspaceContext';
import { useDocuments, type DocumentMetadata } from '../contexts/DocumentContext';
import { DocumentCard } from '../components/DocumentCard';
import styles from './WorkspaceDetail.module.css';

export function WorkspaceDetail() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { getWorkspace } = useWorkspaces();
  const { documents, isLoading, fetchDocuments, createDocument, deleteDocument } = useDocuments();

  const [workspace, setWorkspace] = useState<{
    id: string;
    name: string;
    description: string;
  } | null>(null);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Delete document state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Fetch documents for this workspace
  useEffect(() => {
    if (workspaceId && user) {
      fetchDocuments(workspaceId);
    }
  }, [workspaceId, user, fetchDocuments]);

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim() || !workspaceId) return;

    setIsCreating(true);
    try {
      const doc = await createDocument(newDocTitle.trim(), workspaceId);
      setShowNewDocModal(false);
      setNewDocTitle('');
      navigate(`/doc/${doc.id}`);
    } finally {
      setIsCreating(false);
    }
  };

  const openDeleteModal = (doc: DocumentMetadata) => {
    setSelectedDocument(doc);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedDocument(null);
  };

  const handleDeleteDocument = async () => {
    if (!selectedDocument) return;

    setIsDeleting(true);
    try {
      const success = await deleteDocument(selectedDocument.id);
      if (success) {
        closeDeleteModal();
      }
    } finally {
      setIsDeleting(false);
    }
  };

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
          <button className={styles.backButton} onClick={() => navigate('/workspaces')}>
            <ArrowLeftIcon />
            Back to Workspaces
          </button>
          <div className={styles.headerContent}>
            <div className={styles.headerInfo}>
              <h1>{workspace.name}</h1>
              {workspace.description && (
                <p className={styles.description}>{workspace.description}</p>
              )}
            </div>
            <Button icon={<AddIcon />} onClick={() => setShowNewDocModal(true)}>
              New Document
            </Button>
          </div>
        </header>

        {/* Documents Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <FileIcon />
            Documents
          </h2>

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
                  onDelete={() => openDeleteModal(doc)}
                  showDelete={doc.ownerId === user?.id}
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
              disabled={!newDocTitle.trim() || isCreating}
            >
              {isCreating ? <Spinner size="sm" /> : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Document Modal */}
      <Modal open={showDeleteModal} onClose={closeDeleteModal}>
        <div className={styles.modalContent}>
          <h2>Delete Document</h2>
          <p className={styles.deleteWarning}>
            Are you sure you want to delete <strong>{selectedDocument?.title}</strong>?
            This action cannot be undone.
          </p>
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteDocument}
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
