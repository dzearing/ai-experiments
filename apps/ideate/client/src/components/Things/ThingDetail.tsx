import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, IconButton, Input, Chip, Spinner, Dropdown, Tabs, type DropdownOption, type TabItem } from '@ui-kit/react';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';
import { useThings } from '../../contexts/ThingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config';
import { ThingStylePicker } from './ThingStylePicker';
import { ThingLinks, type ThingLinksRef } from './ThingLinks';
import { ThingProperties, type ThingPropertiesRef } from './ThingProperties';
import { ThingDocuments } from './ThingDocuments';
import { ThingIdeas } from './ThingIdeas';
import type { Thing, ThingMetadata, ThingType, ThingLink, ThingIcon, ThingColor } from '../../types/thing';
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

// Predefined type options for the dropdown
const PREDEFINED_TYPE_OPTIONS: DropdownOption<string>[] = [
  { value: 'category', label: 'Category' },
  { value: 'project', label: 'Project' },
  { value: 'feature', label: 'Feature' },
  { value: 'item', label: 'Item' },
];

export function ThingDetail({
  thingId,
  onEdit: _onEdit,
  onDelete,
  onCreateChild,
  onNavigate,
}: ThingDetailProps) {
  const { user } = useAuth();
  const { getThing, getChildren, getBreadcrumb, updateThing } = useThings();
  const [thing, setThing] = useState<Thing | null>(null);
  const [children, setChildren] = useState<ThingMetadata[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<ThingMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Inline title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Refs for child components
  const linksRef = useRef<ThingLinksRef>(null);
  const propertiesRef = useRef<ThingPropertiesRef>(null);

  // Type dropdown with custom values
  const [typeSearchQuery, setTypeSearchQuery] = useState('');

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

  // Icon and color handlers
  const handleIconChange = useCallback(async (icon: ThingIcon | null) => {
    if (!thing) return;
    const updated = await updateThing(thingId, { icon });
    if (updated) {
      setThing(updated);
    }
  }, [thing, thingId, updateThing]);

  const handleColorChange = useCallback(async (color: ThingColor | null) => {
    if (!thing) return;
    const updated = await updateThing(thingId, { color });
    if (updated) {
      setThing(updated);
    }
  }, [thing, thingId, updateThing]);

  // Title inline editing handlers
  const startEditingTitle = useCallback(() => {
    if (!thing) return;
    setEditingTitle(thing.name);
    setIsEditingTitle(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 0);
  }, [thing]);

  const saveTitle = useCallback(async () => {
    if (!thing || !editingTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    const trimmedTitle = editingTitle.trim();
    if (trimmedTitle !== thing.name) {
      const updated = await updateThing(thingId, { name: trimmedTitle });
      if (updated) {
        setThing(updated);
      }
    }
    setIsEditingTitle(false);
  }, [thing, editingTitle, thingId, updateThing]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  }, [saveTitle]);

  // Type change handler
  const handleTypeChange = useCallback(async (value: string | string[]) => {
    if (!thing) return;
    const newType = Array.isArray(value) ? value[0] : value;
    if (newType && newType !== thing.type) {
      const updated = await updateThing(thingId, { type: newType as ThingType });
      if (updated) {
        setThing(updated);
      }
    }
    setTypeSearchQuery('');
  }, [thing, thingId, updateThing]);

  // Build type options including current type and search query
  const typeOptions = (() => {
    const options = [...PREDEFINED_TYPE_OPTIONS];

    // Add current type if it's custom (not in predefined options)
    if (thing?.type && !PREDEFINED_TYPE_OPTIONS.some(opt => opt.value === thing.type)) {
      options.push({ value: thing.type, label: thing.type });
    }

    // Add search query as option if it doesn't match existing options
    if (typeSearchQuery && !options.some(opt =>
      opt.value.toLowerCase() === typeSearchQuery.toLowerCase() ||
      opt.label.toLowerCase() === typeSearchQuery.toLowerCase()
    )) {
      options.push({ value: typeSearchQuery, label: typeSearchQuery });
    }

    return options;
  })();

  // Link handlers
  const handleAddLink = useCallback(async (link: Omit<ThingLink, 'id' | 'createdAt'>) => {
    if (!user) return;
    const response = await fetch(`${API_URL}/api/things/${thingId}/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
      body: JSON.stringify(link),
    });
    if (response.ok) {
      const updated = await getThing(thingId);
      if (updated) setThing(updated);
    }
  }, [user, thingId, getThing]);

  const handleUpdateLink = useCallback(async (linkId: string, updates: Partial<ThingLink>) => {
    if (!user) return;
    const response = await fetch(`${API_URL}/api/things/${thingId}/links/${linkId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
      body: JSON.stringify(updates),
    });
    if (response.ok) {
      const updated = await getThing(thingId);
      if (updated) setThing(updated);
    }
  }, [user, thingId, getThing]);

  const handleRemoveLink = useCallback(async (linkId: string) => {
    if (!user) return;
    const response = await fetch(`${API_URL}/api/things/${thingId}/links/${linkId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': user.id },
    });
    if (response.ok) {
      const updated = await getThing(thingId);
      if (updated) setThing(updated);
    }
  }, [user, thingId, getThing]);

  // Properties handlers
  const handlePropertiesChange = useCallback(async (properties: Record<string, string>) => {
    if (!user) return;
    const response = await fetch(`${API_URL}/api/things/${thingId}/properties`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
      body: JSON.stringify({ properties }),
    });
    if (response.ok) {
      const updated = await getThing(thingId);
      if (updated) setThing(updated);
    }
  }, [user, thingId, getThing]);

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
        <ThingStylePicker
          icon={thing.icon}
          color={thing.color}
          onIconChange={handleIconChange}
          onColorChange={handleColorChange}
        />
        <div className={styles.headerMain}>
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={saveTitle}
              size="lg"
              className={styles.titleInput}
              autoFocus
            />
          ) : (
            <h1
              className={styles.name}
              onClick={startEditingTitle}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && startEditingTitle()}
              title="Click to edit"
            >
              {thing.name}
            </h1>
          )}
          <Dropdown
            options={typeOptions}
            value={thing.type}
            onChange={handleTypeChange}
            searchable
            searchPlaceholder="Search or add type..."
            onSearch={setTypeSearchQuery}
            size="sm"
            placeholder="Select type"
            className={styles.typeDropdown}
          />
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="ghost"
            icon={<TrashIcon />}
            onClick={() => onDelete(thing.id)}
            aria-label="Delete"
          />
        </div>
      </header>

      {/* Description (no label) */}
      {thing.description && (
        <p className={styles.descriptionBlock}>{thing.description}</p>
      )}

      {/* Tags (inline, no label) */}
      <div className={styles.tagsBlock}>
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
        ) : thing.tags.length > 0 ? (
          <IconButton
            icon={<AddIcon />}
            onClick={() => setIsAddingTag(true)}
            aria-label="Add tag"
            size="sm"
            variant="ghost"
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

      {/* Tabbed content */}
      <Tabs
        items={[
          {
            value: 'ideas',
            label: 'Ideas',
            content: (
              <ThingIdeas
                thingId={thingId}
                thingName={thing.name}
                thingType={thing.type}
                thingDescription={thing.description}
                workspaceId={thing.workspaceId}
              />
            ),
          },
          {
            value: 'documents',
            label: 'Documents',
            content: <ThingDocuments thingId={thingId} />,
          },
          {
            value: 'about',
            label: 'About',
            content: (
              <div className={styles.aboutTab}>
                {/* Links and Properties - 2 columns on wide screens */}
                <div className={styles.twoColumnSection}>
                  {/* Links */}
                  <section className={styles.columnSection}>
                    <div className={styles.sectionHeader}>
                      <h2 className={styles.sectionTitle}>Links</h2>
                      <span className={styles.sectionDivider} />
                      <Button
                        variant="ghost"
                        icon={<AddIcon />}
                        onClick={() => linksRef.current?.startAdd()}
                      >
                        Add link
                      </Button>
                    </div>
                    <ThingLinks
                      ref={linksRef}
                      links={thing.links || []}
                      onAdd={handleAddLink}
                      onUpdate={handleUpdateLink}
                      onRemove={handleRemoveLink}
                      hideAddButton
                    />
                  </section>

                  {/* Properties */}
                  <section className={styles.columnSection}>
                    <div className={styles.sectionHeader}>
                      <h2 className={styles.sectionTitle}>Properties</h2>
                      <span className={styles.sectionDivider} />
                      <Button
                        variant="ghost"
                        icon={<AddIcon />}
                        onClick={() => propertiesRef.current?.startAdd()}
                      >
                        Add property
                      </Button>
                    </div>
                    <ThingProperties
                      ref={propertiesRef}
                      properties={thing.properties || {}}
                      onChange={handlePropertiesChange}
                    />
                  </section>
                </div>

                {/* Children */}
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Children</h2>
                    <span className={styles.sectionDivider} />
                    <Button
                      variant="ghost"
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
            ),
          },
        ] satisfies TabItem[]}
        defaultValue="ideas"
        variant="underline"
        className={styles.tabs}
      />
    </div>
  );
}
