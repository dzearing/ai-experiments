import { useState, useCallback } from 'react';
import { Button, Dialog, Input, Text } from '@ui-kit/react';
import styles from './CreateWorkspaceDialog.module.css';

interface CreateWorkspaceDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback when workspace is submitted */
  onSubmit: (name: string, description?: string) => Promise<void>;
}

export function CreateWorkspaceDialog({
  open,
  onClose,
  onSubmit,
}: CreateWorkspaceDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Name is required');

      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(name.trim(), description.trim() || undefined);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
    } finally {
      setIsSubmitting(false);
    }
  }, [name, description, onSubmit, resetForm]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Create Workspace"
      size="sm"
      footer={
        <div className={styles.footer}>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && (
          <div className={styles.error}>
            <Text size="sm">{error}</Text>
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="workspace-name" className={styles.label}>
            Name <span className={styles.required}>*</span>
          </label>
          <Input
            id="workspace-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Team Project, Research Notes..."
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="workspace-description" className={styles.label}>
            Description
          </label>
          <Input
            id="workspace-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description (optional)"
          />
        </div>
      </form>
    </Dialog>
  );
}
