import { useState, useCallback, forwardRef, useImperativeHandle, type ReactNode } from 'react';
import { Button, Input, IconButton } from '@ui-kit/react';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { PackageIcon } from '@ui-kit/icons/PackageIcon';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config';
import type { ThingLink, ThingLinkType } from '../../types/thing';
import styles from './ThingLinks.module.css';

export interface ThingLinksRef {
  startAdd: () => void;
}

interface ThingLinksProps {
  links: ThingLink[];
  onAdd: (link: Omit<ThingLink, 'id' | 'createdAt'>) => Promise<void>;
  onUpdate: (linkId: string, updates: Partial<ThingLink>) => Promise<void>;
  onRemove: (linkId: string) => Promise<void>;
  disabled?: boolean;
  hideAddButton?: boolean;
}

const LINK_TYPE_ICONS: Record<ThingLinkType, ReactNode> = {
  file: <FileIcon />,
  url: <LinkIcon />,
  github: <CodeIcon />,
  package: <PackageIcon />,
};

const LINK_TYPE_LABELS: Record<ThingLinkType, string> = {
  file: 'Local File',
  url: 'URL',
  github: 'GitHub',
  package: 'Package',
};

interface LinkFormState {
  type: ThingLinkType;
  label: string;
  target: string;
  description: string;
}

const INITIAL_FORM: LinkFormState = {
  type: 'url',
  label: '',
  target: '',
  description: '',
};

export const ThingLinks = forwardRef<ThingLinksRef, ThingLinksProps>(function ThingLinks(
  { links, onAdd, onUpdate, onRemove, disabled, hideAddButton: _hideAddButton },
  ref
) {
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<LinkFormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartAdd = useCallback(() => {
    setIsAdding(true);
    setEditingId(null);
    setFormState(INITIAL_FORM);
  }, []);

  // Expose startAdd method via ref
  useImperativeHandle(ref, () => ({
    startAdd: handleStartAdd,
  }), [handleStartAdd]);

  // Open file/folder via server (browsers block file:// protocol)
  const handleOpenFile = useCallback(async (path: string) => {
    if (!user) return;
    try {
      await fetch(`${API_URL}/api/things/open-path`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ path }),
      });
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  }, [user]);

  const handleStartEdit = useCallback((link: ThingLink) => {
    setIsAdding(false);
    setEditingId(link.id);
    setFormState({
      type: link.type,
      label: link.label,
      target: link.target,
      description: link.description || '',
    });
  }, []);

  const handleCancel = useCallback(() => {
    setIsAdding(false);
    setEditingId(null);
    setFormState(INITIAL_FORM);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formState.label.trim() || !formState.target.trim()) return;

    setIsSubmitting(true);
    try {
      if (isAdding) {
        await onAdd({
          type: formState.type,
          label: formState.label.trim(),
          target: formState.target.trim(),
          description: formState.description.trim() || undefined,
        });
      } else if (editingId) {
        await onUpdate(editingId, {
          type: formState.type,
          label: formState.label.trim(),
          target: formState.target.trim(),
          description: formState.description.trim() || undefined,
        });
      }
      handleCancel();
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, isAdding, editingId, onAdd, onUpdate, handleCancel]);

  const handleRemove = useCallback(async (linkId: string) => {
    await onRemove(linkId);
    if (editingId === linkId) {
      handleCancel();
    }
  }, [onRemove, editingId, handleCancel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const showForm = isAdding || editingId !== null;

  return (
    <div className={styles.container}>
      {/* Link list */}
      {links.length > 0 && (
        <ul className={styles.list}>
          {links.map((link) => (
            <li key={link.id} className={styles.item}>
              <span className={styles.icon}>{LINK_TYPE_ICONS[link.type]}</span>
              <div className={styles.content}>
                {link.type === 'file' ? (
                  <button
                    type="button"
                    className={styles.label}
                    onClick={() => handleOpenFile(link.target)}
                  >
                    {link.label}
                  </button>
                ) : (
                  <a
                    href={link.target}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.label}
                  >
                    {link.label}
                  </a>
                )}
                {link.description && (
                  <span className={styles.description}>{link.description}</span>
                )}
              </div>
              <div className={styles.actions}>
                <IconButton
                  icon={<EditIcon />}
                  variant="ghost"
                  onClick={() => handleStartEdit(link)}
                  disabled={disabled || isSubmitting}
                  aria-label="Edit link"
                />
                <IconButton
                  icon={<TrashIcon />}
                  variant="ghost"
                  onClick={() => handleRemove(link.id)}
                  disabled={disabled || isSubmitting}
                  aria-label="Remove link"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <div className={styles.form}>
          <div className={styles.formField}>
            <label className={styles.label}>Type</label>
            <div className={styles.typeSelector}>
              {(Object.keys(LINK_TYPE_LABELS) as ThingLinkType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`${styles.typeButton} ${formState.type === type ? styles.selected : ''}`}
                  onClick={() => setFormState(s => ({ ...s, type }))}
                  disabled={isSubmitting}
                >
                  {LINK_TYPE_ICONS[type]}
                  <span>{LINK_TYPE_LABELS[type]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className={styles.formField}>
            <label className={styles.label} htmlFor="link-label">Label</label>
            <Input
              id="link-label"
              value={formState.label}
              onChange={(e) => setFormState(s => ({ ...s, label: e.target.value }))}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Project Repository"
              disabled={isSubmitting}
              autoFocus
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.label} htmlFor="link-target">
              {formState.type === 'file' ? 'Path' : 'URL'}
            </label>
            <Input
              id="link-target"
              value={formState.target}
              onChange={(e) => setFormState(s => ({ ...s, target: e.target.value }))}
              onKeyDown={handleKeyDown}
              placeholder={formState.type === 'file' ? '/path/to/file' : 'https://...'}
              disabled={isSubmitting}
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.label} htmlFor="link-description">Description (optional)</label>
            <Input
              id="link-description"
              value={formState.description}
              onChange={(e) => setFormState(s => ({ ...s, description: e.target.value }))}
              onKeyDown={handleKeyDown}
              placeholder="Brief description of this link"
              disabled={isSubmitting}
            />
          </div>
          <div className={styles.formActions}>
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !formState.label.trim() || !formState.target.trim()}
            >
              {isAdding ? 'Add' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
