import { useState, useCallback } from 'react';
import { useNavigate } from '@ui-kit/router';
import { Button, Input, Modal, Spinner } from '@ui-kit/react';
import { useDocuments } from '../../contexts/DocumentContext';
import styles from './CreateDocumentDialog.module.css';

export interface CreateDocumentDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Optional workspace ID to associate the document with */
  workspaceId?: string;
  /** Optional thing ID to associate the document with */
  thingId?: string;
  /** Whether to navigate to the document after creation (default: true) */
  navigateOnCreate?: boolean;
  /** Called after document is successfully created */
  onCreated?: (documentId: string) => void;
}

export function CreateDocumentDialog({
  open,
  onClose,
  workspaceId,
  thingId,
  navigateOnCreate = true,
  onCreated,
}: CreateDocumentDialogProps) {
  const navigate = useNavigate();
  const { createDocument } = useDocuments();
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleClose = useCallback(() => {
    setTitle('');
    onClose();
  }, [onClose]);

  const handleCreate = useCallback(async () => {
    if (!title.trim()) return;

    setIsCreating(true);
    try {
      const doc = await createDocument(title.trim(), { workspaceId, thingId });
      handleClose();
      onCreated?.(doc.id);
      if (navigateOnCreate) {
        navigate(`/doc/${doc.id}`);
      }
    } finally {
      setIsCreating(false);
    }
  }, [title, workspaceId, thingId, createDocument, handleClose, onCreated, navigateOnCreate, navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && title.trim()) {
        handleCreate();
      }
    },
    [handleCreate, title]
  );

  return (
    <Modal open={open} onClose={handleClose}>
      <div className={styles.content}>
        <h2 className={styles.title}>Create New Document</h2>
        <Input
          placeholder="Enter a title for your document"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <div className={styles.actions}>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={!title.trim() || isCreating}
          >
            {isCreating ? <Spinner size="sm" /> : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CreateDocumentDialog;
