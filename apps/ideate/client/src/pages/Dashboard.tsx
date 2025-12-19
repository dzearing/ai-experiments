import { useEffect, useState } from 'react';
import { useNavigate } from '@ui-kit/router';
import { Button, Card, Input, Modal, Spinner } from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { useAuth } from '../contexts/AuthContext';
import { useDocuments } from '../contexts/DocumentContext';
import { useNetwork, type NetworkDocument } from '../contexts/NetworkContext';
import { DocumentCard } from '../components/DocumentCard';
import { getTimeAgo } from '../utils/timeAgo';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { documents, isLoading, fetchDocuments, createDocument } = useDocuments();
  const { networkDocuments, isDiscovering, startDiscovery, stopDiscovery } =
    useNetwork();
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Redirect if not authenticated (wait for auth to load first)
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Start network discovery on mount
  useEffect(() => {
    startDiscovery();
    return () => stopDiscovery();
  }, [startDiscovery, stopDiscovery]);

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) return;
    setIsCreating(true);
    try {
      const doc = await createDocument(newDocTitle.trim());
      setShowNewDocModal(false);
      setNewDocTitle('');
      navigate(`/doc/${doc.id}`);
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) return null;

  return (
    <div className={styles.dashboard}>
      <div className={styles.container}>
        {/* Welcome Section */}
        <section className={styles.welcome}>
          <h1>Welcome back, {user.name.split(' ')[0]}</h1>
          <Button icon={<AddIcon />} onClick={() => setShowNewDocModal(true)}>
            New Document
          </Button>
        </section>

        {/* My Documents */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <FileIcon />
            My Documents
          </h2>
          {isLoading ? (
            <div className={styles.loading}>
              <Spinner />
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              icon={<FileIcon />}
              title="No documents yet"
              description="Create your first document to get started"
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
                />
              ))}
            </div>
          )}
        </section>

        {/* Network Documents */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <LinkIcon />
              Shared on Network
              {isDiscovering && (
                <span className={styles.liveIndicator}>
                  <span className={styles.liveDot} />
                  Live
                </span>
              )}
            </h2>
          </div>
          {networkDocuments.length === 0 ? (
            <EmptyState
              icon={<LinkIcon />}
              title="No shared documents found"
              description="Documents shared on your local network will appear here"
            />
          ) : (
            <div className={styles.networkList}>
              {networkDocuments.map((doc) => (
                <NetworkDocumentItem key={doc.id} document={doc} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* New Document Modal */}
      <Modal
        open={showNewDocModal}
        onClose={() => setShowNewDocModal(false)}
      >
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
    </div>
  );
}

interface NetworkDocumentItemProps {
  document: NetworkDocument;
}

function NetworkDocumentItem({ document }: NetworkDocumentItemProps) {
  const startedDate = new Date(document.startedAt);
  const timeAgo = getTimeAgo(startedDate);

  return (
    <Card className={styles.networkItem}>
      <div className={styles.networkItemContent}>
        <div className={styles.networkItemInfo}>
          <h3 className={styles.networkItemTitle}>{document.title}</h3>
          <p className={styles.networkItemMeta}>
            {document.hostName} (Host) &bull; {document.collaboratorCount} collaborators
            &bull; Started {timeAgo}
          </p>
        </div>
        <Button size="sm">Join</Button>
      </div>
    </Card>
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
