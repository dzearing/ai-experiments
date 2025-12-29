import { useState, useCallback, useMemo } from 'react';
import { Button, Dialog, Input, Select, Text } from '@ui-kit/react';
import { useThings } from '../../contexts/ThingsContext';
import type { ThingType, CreateThingInput } from '../../types/thing';
import styles from './NewThingDialog.module.css';

interface NewThingDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Optional parent ID to pre-select */
  parentId?: string;
  /** Optional workspace ID for scoping */
  workspaceId?: string;
}

const THING_TYPES: { value: ThingType; label: string }[] = [
  { value: 'category', label: 'Category' },
  { value: 'project', label: 'Project' },
  { value: 'feature', label: 'Feature' },
  { value: 'item', label: 'Item' },
];

export function NewThingDialog({
  open,
  onClose,
  parentId,
  workspaceId,
}: NewThingDialogProps) {
  const { things, createThing } = useThings();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ThingType>('project');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(parentId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build parent options from existing things
  const parentOptions = useMemo(() => {
    const options = [{ value: '', label: 'None (root level)' }];
    things.forEach(thing => {
      // Only categories and projects can be parents
      if (thing.type === 'category' || thing.type === 'project') {
        options.push({ value: thing.id, label: thing.name });
      }
    });
    return options;
  }, [things]);

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setType('project');
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

      const input: CreateThingInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        tags,
        parentIds: selectedParentId ? [selectedParentId] : [],
        workspaceId,
      };

      await createThing(input);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create thing');
    } finally {
      setIsSubmitting(false);
    }
  }, [name, description, type, tagsInput, selectedParentId, workspaceId, createThing, handleClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Create a Thing"
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
          <label htmlFor="thing-name" className={styles.label}>
            Name <span className={styles.required}>*</span>
          </label>
          <Input
            id="thing-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., My Project, Learning Path, Book Notes..."
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="thing-description" className={styles.label}>
            Description
          </label>
          <Input
            id="thing-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description (optional)"
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="thing-type" className={styles.label}>
              Type
            </label>
            <Select
              id="thing-type"
              value={type}
              onChange={(e) => setType(e.target.value as ThingType)}
              options={THING_TYPES}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="thing-parent" className={styles.label}>
              Parent
            </label>
            <Select
              id="thing-parent"
              value={selectedParentId || ''}
              onChange={(e) => setSelectedParentId(e.target.value || undefined)}
              options={parentOptions}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="thing-tags" className={styles.label}>
            Tags
          </label>
          <Input
            id="thing-tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Comma-separated: react, typescript, learning"
          />
          <Text size="xs" color="soft" className={styles.hint}>
            Tags help you organize and find things later
          </Text>
        </div>
      </form>
    </Dialog>
  );
}
