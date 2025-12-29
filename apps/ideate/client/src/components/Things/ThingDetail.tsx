import { useState, useEffect, useCallback } from 'react';
import { Button, Input, Chip, Spinner } from '@ui-kit/react';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';
import { useThings } from '../../contexts/ThingsContext';
import type { Thing, ThingMetadata, ThingType } from '../../types/thing';
import styles from './ThingDetail.module.css';

interface ThingDetailProps {
  thingId: string;
  onEdit: (thing: Thing) => void;
  onDelete: (thingId: string) => void;
  onCreateChild: (parentId: string) => void;
  onNavigate: (thingId: string) => void;
}

const TYPE_LABELS: Record<ThingType, string> = {
  category: 'Category',
  project: 'Project',
  feature: 'Feature',
  item: 'Item',
};

export function ThingDetail({
  thingId,
  onEdit,
  onDelete,
  onCreateChild,
  onNavigate,
}: ThingDetailProps) {
  const { getThing, getChildren, getBreadcrumb, updateThing } = useThings();
  const [thing, setThing] = useState<Thing | null>(null);
  const [children, setChildren] = useState<ThingMetadata[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<ThingMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Load thing details
  useEffect(() => {
    let mounted = true;

    async function loadThing() {
      setIsLoading(true);
      try {
        const loaded = await getThing(thingId);
        if (mounted && loaded) {
          setThing(loaded);
          setChildren(getChildren(thingId));
          setBreadcrumb(getBreadcrumb(thingId));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadThing();

    return () => {
      mounted = false;
    };
  }, [thingId, getThing, getChildren, getBreadcrumb]);

  const handleAddTag = useCallback(async () => {
    if (!thing || !newTag.trim()) return;

    const updatedTags = [...thing.tags, newTag.trim().toLowerCase()];
    const updated = await updateThing(thingId, { tags: updatedTags });
    if (updated) {
      setThing(updated);
    }
    setNewTag('');
    setIsAddingTag(false);
  }, [thing, newTag, thingId, updateThing]);

  const handleRemoveTag = useCallback(async (tagToRemove: string) => {
    if (!thing) return;

    const updatedTags = thing.tags.filter(t => t !== tagToRemove);
    const updated = await updateThing(thingId, { tags: updatedTags });
    if (updated) {
      setThing(updated);
    }
  }, [thing, thingId, updateThing]);

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Escape') {
      setNewTag('');
      setIsAddingTag(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!thing) {
    return (
      <div className={styles.notFound}>
        <p>Thing not found</p>
      </div>
    );
  }

  return (
    <div className={styles.detail}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        {breadcrumb.map((item, index) => (
          <span key={item.id} className={styles.breadcrumbItem}>
            {index > 0 && <ChevronRightIcon className={styles.breadcrumbSeparator} />}
            <button
              className={styles.breadcrumbLink}
              onClick={() => onNavigate(item.id)}
              aria-current={index === breadcrumb.length - 1 ? 'page' : undefined}
            >
              {item.name}
            </button>
          </span>
        ))}
      </nav>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <h1 className={styles.name}>{thing.name}</h1>
          <span className={styles.type}>{TYPE_LABELS[thing.type]}</span>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="ghost"
            size="sm"
            icon={<EditIcon />}
            onClick={() => onEdit(thing)}
            aria-label="Edit"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<TrashIcon />}
            onClick={() => onDelete(thing.id)}
            aria-label="Delete"
          />
        </div>
      </header>

      {/* Description */}
      {thing.description && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Description</h2>
          <p className={styles.description}>{thing.description}</p>
        </section>
      )}

      {/* Tags */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Tags</h2>
        <div className={styles.tags}>
          {thing.tags.map((tag) => (
            <Chip
              key={tag}
              size="sm"
              onRemove={() => handleRemoveTag(tag)}
            >
              #{tag}
            </Chip>
          ))}
          {isAddingTag ? (
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => {
                if (!newTag.trim()) {
                  setIsAddingTag(false);
                }
              }}
              placeholder="New tag..."
              size="sm"
              autoFocus
              className={styles.tagInput}
            />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              icon={<AddIcon />}
              onClick={() => setIsAddingTag(true)}
            >
              Add tag
            </Button>
          )}
        </div>
      </section>

      {/* Idea Counts */}
      {thing.ideaCounts && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Ideas</h2>
          <div className={styles.ideaCounts}>
            <div className={styles.ideaCountItem}>
              <span className={styles.ideaCountValue}>{thing.ideaCounts.new}</span>
              <span className={styles.ideaCountLabel}>New</span>
            </div>
            <div className={styles.ideaCountItem}>
              <span className={styles.ideaCountValue}>{thing.ideaCounts.exploring}</span>
              <span className={styles.ideaCountLabel}>Exploring</span>
            </div>
            <div className={styles.ideaCountItem}>
              <span className={styles.ideaCountValue}>{thing.ideaCounts.ready}</span>
              <span className={styles.ideaCountLabel}>Ready</span>
            </div>
            <div className={styles.ideaCountItem}>
              <span className={styles.ideaCountValue}>{thing.ideaCounts.archived}</span>
              <span className={styles.ideaCountLabel}>Archived</span>
            </div>
          </div>
        </section>
      )}

      {/* Children */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Children</h2>
          <Button
            variant="ghost"
            size="sm"
            icon={<AddIcon />}
            onClick={() => onCreateChild(thing.id)}
          >
            Add child
          </Button>
        </div>
        {children.length > 0 ? (
          <ul className={styles.childrenList}>
            {children.map((child) => (
              <li key={child.id}>
                <button
                  className={styles.childItem}
                  onClick={() => onNavigate(child.id)}
                >
                  <span className={styles.childName}>{child.name}</span>
                  <span className={styles.childType}>{TYPE_LABELS[child.type]}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noChildren}>No children yet</p>
        )}
      </section>

      {/* Content */}
      {thing.content && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Content</h2>
          <div className={styles.content}>{thing.content}</div>
        </section>
      )}
    </div>
  );
}
