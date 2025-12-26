import { useState, useCallback } from 'react';
import { Modal, Button, Textarea, Spinner, ShimmerText } from '@ui-kit/react';
import { useIdeas } from '../../contexts/IdeasContext';
import styles from './NewIdeaModal.module.css';

interface NewIdeaModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId?: string;
  onSuccess?: () => void;
}

export function NewIdeaModal({
  open,
  onClose,
  workspaceId,
  onSuccess,
}: NewIdeaModalProps) {
  const { createIdeaFromText } = useIdeas();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!text.trim()) {
      setError('Please describe your idea');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createIdeaFromText(text.trim(), workspaceId);
      // Success - reset state and close modal
      setText('');
      setIsSubmitting(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create idea');
      setIsSubmitting(false);
    }
  }, [text, workspaceId, createIdeaFromText, onSuccess]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setText('');
      setError(null);
      onClose();
    }
  }, [isSubmitting, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && text.trim() && !isSubmitting) {
      e.preventDefault();
      handleSubmit();
    }
  }, [text, isSubmitting, handleSubmit]);

  return (
    <Modal open={open} onClose={handleClose}>
      <div className={styles.modal}>
        <h2 className={styles.title}>New Idea</h2>

        {isSubmitting ? (
          <div className={styles.processing}>
            <Spinner />
            <ShimmerText>Extracting title, summary, and tags...</ShimmerText>
          </div>
        ) : (
          <div className={styles.formFields}>
            <div className={styles.field}>
              <label htmlFor="idea-text">Describe your idea</label>
              <p className={styles.hint}>
                Include what you want to build, why it matters, and any category info.
                AI will extract the title, summary, and tags automatically.
              </p>
              <Textarea
                id="idea-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Add dark mode support for better accessibility. This is high priority since many users have requested it. Related to UI and theming."
                rows={5}
                autoFocus
              />
            </div>
          </div>
        )}

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        <div className={styles.footer}>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !text.trim()}
            icon={isSubmitting ? <Spinner /> : undefined}
          >
            {isSubmitting ? 'Processing...' : 'Create Idea'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
