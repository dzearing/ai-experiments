import { useState, useCallback, useMemo } from 'react';
import { Button, Dialog, Input, Select, Text } from '@ui-kit/react';
import { useTopics } from '../../contexts/TopicsContext';
import type { TopicType, CreateTopicInput } from '../../types/topic';
import styles from './NewTopicDialog.module.css';

interface NewTopicDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Optional parent ID to pre-select */
  parentId?: string;
  /** Optional workspace ID for scoping */
  workspaceId?: string;
}

const TOPIC_TYPES: { value: TopicType; label: string }[] = [
  { value: 'folder', label: 'Folder' },
  { value: 'app', label: 'App' },
  { value: 'package', label: 'Package' },
  { value: 'project', label: 'Project' },
  { value: 'subject', label: 'Subject' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'topic', label: 'Topic' },
];

export function NewTopicDialog({
  open,
  onClose,
  parentId,
  workspaceId,
}: NewTopicDialogProps) {
  const { topics, createTopic } = useTopics();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TopicType>('folder');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(parentId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build parent options from existing topics
  const parentOptions = useMemo(() => {
    const options = [{ value: '', label: 'None (root level)' }];
    topics.forEach(topic => {
      options.push({ value: topic.id, label: topic.name });
    });
    return options;
  }, [topics]);

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setType('folder');
    setTagsInput('');
    setSelectedParentId(parentId);
    setError(null);
  }, [parentId]);

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
      // Parse tags from comma-separated input
      const tags = tagsInput
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const input: CreateTopicInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        tags,
        parentIds: selectedParentId ? [selectedParentId] : [],
        workspaceId,
      };

      await createTopic(input);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create topic');
    } finally {
      setIsSubmitting(false);
    }
  }, [name, description, type, tagsInput, selectedParentId, workspaceId, createTopic, handleClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Create a Topic"
      size="md"
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
          <label htmlFor="topic-name" className={styles.label}>
            Name <span className={styles.required}>*</span>
          </label>
          <Input
            id="topic-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., My Project, Learning Path, Book Notes..."
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="topic-description" className={styles.label}>
            Description
          </label>
          <Input
            id="topic-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description (optional)"
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="topic-type" className={styles.label}>
              Type
            </label>
            <Select
              id="topic-type"
              value={type}
              onChange={(e) => setType(e.target.value as TopicType)}
              options={TOPIC_TYPES}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="topic-parent" className={styles.label}>
              Parent
            </label>
            <Select
              id="topic-parent"
              value={selectedParentId || ''}
              onChange={(e) => setSelectedParentId(e.target.value || undefined)}
              options={parentOptions}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="topic-tags" className={styles.label}>
            Tags
          </label>
          <Input
            id="topic-tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Comma-separated: react, typescript, learning"
          />
          <Text size="xs" color="soft" className={styles.hint}>
            Tags help you organize and find topics later
          </Text>
        </div>
      </form>
    </Dialog>
  );
}
