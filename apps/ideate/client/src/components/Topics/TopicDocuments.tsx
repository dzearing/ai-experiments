import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@ui-kit/router';
import { Button, Input, Modal, Spinner, Text } from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { useDocuments, type DocumentMetadata } from '../../contexts/DocumentContext';
import { useAuth } from '../../contexts/AuthContext';
import { DocumentCard } from '../DocumentCard';
import { CreateDocumentDialog } from '../CreateDocumentDialog';
import { DelayedSpinner } from '../DelayedSpinner';
import styles from './TopicDocuments.module.css';

export interface TopicDocumentsProps {
  /** The Topic ID to show documents for */
  topicId: string;
}

export function TopicDocuments({ topicId }: TopicDocumentsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { documents, isLoading, fetchDocuments, updateDocument, deleteDocument } = useDocuments();

  // Create dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Rename modal state
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch documents for this Topic on mount and when topicId changes
  useEffect(() => {
    fetchDocuments({ topicId });
  }, [topicId, fetchDocuments]);

  // Rename handlers
  const openRenameModal = useCallback((doc: DocumentMetadata) => {
    setSelectedDocument(doc);
    setRenameTitle(doc.title);
    setShowRenameModal(true);
  }, []);

  const closeRenameModal = useCallback(() => {
    setShowRenameModal(false);
    setSelectedDocument(null);
    setRenameTitle('');
  }, []);

  const handleRename = useCallback(async () => {
    if (!selectedDocument || !renameTitle.trim()) return;

    setIsRenaming(true);
    try {
      const result = await updateDocument(selectedDocument.id, { title: renameTitle.trim() });
      if (result) {
        closeRenameModal();
        // Refresh documents list
        fetchDocuments({ topicId });
      }
    } finally {
      setIsRenaming(false);
    }
  }, [selectedDocument, renameTitle, updateDocument, closeRenameModal, fetchDocuments, topicId]);

  // Delete handlers
  const openDeleteModal = useCallback((doc: DocumentMetadata) => {
    setSelectedDocument(doc);
    setShowDeleteModal(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setSelectedDocument(null);
  }, []);

  const handleDelete = useCallback(async () => {
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
  }, [selectedDocument, deleteDocument, closeDeleteModal]);

  // Handle document created - refresh the list
  const handleDocumentCreated = useCallback(() => {
    fetchDocuments({ topicId });
  }, [fetchDocuments, topicId]);

  return (
    <div className={styles.container}>
      {/* Loading state */}
      <DelayedSpinner loading={isLoading} className={styles.loading} />

      {/* Documents grid */}
      {!isLoading && documents.length > 0 && (
        <div className={styles.grid}>
          {/* Create new document card */}
          <button
            className={styles.createCard}
            onClick={() => setShowCreateDialog(true)}
          >
            <AddIcon className={styles.createIcon} />
            <span>New Document</span>
          </button>
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onClick={() => navigate(`/doc/${doc.id}`)}
              onEdit={() => openRenameModal(doc)}
              onDelete={() => openDeleteModal(doc)}
              showActions={doc.ownerId === user?.id}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && documents.length === 0 && (
        <div className={styles.emptyState}>
          <FileIcon className={styles.emptyIcon} />
          <Text color="soft">No documents yet!</Text>
          <Button variant="primary" size="lg" icon={<AddIcon />} onClick={() => setShowCreateDialog(true)}>
            Create your first Document
          </Button>
        </div>
      )}

      {/* Create Document Dialog */}
      <CreateDocumentDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        topicId={topicId}
        navigateOnCreate={true}
        onCreated={handleDocumentCreated}
      />

      {/* Rename Modal */}
      <Modal open={showRenameModal} onClose={closeRenameModal}>
        <div className={styles.modalContent}>
          <h2>Rename Document</h2>
          <Input
            placeholder="Enter new title"
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
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
              disabled={!renameTitle.trim() || isRenaming}
            >
              {isRenaming ? <Spinner size="sm" /> : 'Rename'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
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
