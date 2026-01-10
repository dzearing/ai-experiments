import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from '@ui-kit/router';
import { Button, IconButton, Input, Chip, Spinner, Dropdown, Tabs, type DropdownOption, type TabItem } from '@ui-kit/react';
import { ItemPickerDialog, DiskItemProvider } from '@ui-kit/react-pickers';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { useTopics } from '../../contexts/TopicsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useDocuments } from '../../contexts/DocumentContext';
import { useTopicIdeas } from '../../hooks/useTopicIdeas';
import { API_URL } from '../../config';
import { TopicStylePicker } from './TopicStylePicker';
import { TopicLinks, type TopicLinksRef } from './TopicLinks';
import { TopicProperties, type TopicPropertiesRef } from './TopicProperties';
import { TopicDocuments } from './TopicDocuments';
import { TopicIdeas } from './TopicIdeas';
import type { Topic, TopicMetadata, TopicType, TopicLink, TopicIcon, TopicColor, PropertyDef } from '../../types/topic';
import { TOPIC_TYPE_SCHEMAS } from '../../types/topic';
import styles from './TopicDetail.module.css';

interface TopicDetailProps {
  topicId: string;
  onEdit: (topic: Topic) => void;
  onDelete: (topicId: string) => void;
  onCreateChild: (parentId: string) => void;
  onNavigate: (topicId: string) => void;
}

// Predefined type options for the dropdown
const PREDEFINED_TYPE_OPTIONS: DropdownOption<string>[] = [
  { value: 'folder', label: 'Folder' },
  { value: 'app', label: 'App' },
  { value: 'package', label: 'Package' },
  { value: 'project', label: 'Project' },
  { value: 'subject', label: 'Subject' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'topic', label: 'Topic' },
];

/**
 * Get icon component for a property type
 */
function getPropertyIcon(propDef: PropertyDef) {
  switch (propDef.type) {
    case 'path':
      return <FolderIcon size={16} />;
    case 'url':
      return <LinkIcon size={16} />;
    case 'topic-ref':
      return <CodeIcon size={16} />;
    default:
      return null;
  }
}

/**
 * Path property picker component - shows a button that opens ItemPickerDialog
 */
function PathPropertyPicker({
  value,
  onChange,
  provider,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
  provider: DiskItemProvider;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSelect = useCallback((path: string) => {
    onChange(path);
    setIsDialogOpen(false);
  }, [onChange]);

  return (
    <>
      {value ? (
        <Button
          variant="ghost"
          size="sm"
          icon={<FolderIcon />}
          onClick={() => setIsDialogOpen(true)}
          className={styles.pathButton}
        >
          {value}
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          icon={<AddIcon />}
          onClick={() => setIsDialogOpen(true)}
        >
          Select path
        </Button>
      )}
      <ItemPickerDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSelect={handleSelect}
        provider={provider}
        filter={{ types: ['folder'] }}
        title="Select Folder"
        initialPath={value || ''}
      />
    </>
  );
}

/**
 * Key property row component - renders label and input as grid children
 * Parent uses CSS grid, so this returns a fragment with two children
 */
function KeyPropertyRow({
  propName,
  propDef,
  value,
  onSave,
  diskProvider,
}: {
  propName: string;
  propDef: PropertyDef;
  value: string | undefined;
  onSave: (propName: string, value: string) => void;
  diskProvider: DiskItemProvider;
}) {
  const icon = getPropertyIcon(propDef);

  const handleChange = useCallback((newValue: string) => {
    onSave(propName, newValue);
  }, [propName, onSave]);

  return (
    <>
      <div className={styles.keyPropertyLabelGroup}>
        {icon && <span className={styles.keyPropertyIcon}>{icon}</span>}
        <span className={styles.keyPropertyLabel}>{propDef.label}</span>
      </div>
      <div className={styles.keyPropertyPicker}>
        {propDef.type === 'path' ? (
          <PathPropertyPicker
            value={value}
            onChange={handleChange}
            provider={diskProvider}
          />
        ) : propDef.type === 'url' ? (
          <Input
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="https://..."
            size="sm"
          />
        ) : (
          <Input
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Enter value..."
            size="sm"
          />
        )}
      </div>
    </>
  );
}

export function TopicDetail({
  topicId,
  onEdit: _onEdit,
  onDelete,
  onCreateChild,
  onNavigate,
}: TopicDetailProps) {
  const { user } = useAuth();
  const { getTopic, getChildren, updateTopic } = useTopics();
  const { ideas } = useTopicIdeas(topicId);
  const { documents, fetchDocuments } = useDocuments();
  const [searchParams, setSearchParams] = useSearchParams();
  const [topic, setTopic] = useState<Topic | null>(null);

  // Create disk provider for file/folder browsing
  const diskProvider = useMemo(() => new DiskItemProvider({ baseUrl: '/api/fs' }), []);

  // Get tab from URL params
  const currentTab = searchParams.get('tab') || 'ideas';

  // Track pending idea open request when TopicIdeas isn't mounted
  const [pendingIdeaOpen, setPendingIdeaOpen] = useState<{
    ideaId?: string;
    initialPrompt?: string;
    initialGreeting?: string;
  } | null>(null);

  // Handle tab change - update URL without triggering router re-render
  const handleTabChange = useCallback((tab: string) => {
    setSearchParams(params => {
      if (tab === 'ideas') {
        params.delete('tab');
      } else {
        params.set('tab', tab);
      }
      return params;
    });
  }, [setSearchParams]);
  const [children, setChildren] = useState<TopicMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Inline title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Inline description editing
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editingDescription, setEditingDescription] = useState('');
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  // Refs for child components
  const linksRef = useRef<TopicLinksRef>(null);
  const propertiesRef = useRef<TopicPropertiesRef>(null);

  // Type dropdown with custom values
  const [typeSearchQuery, setTypeSearchQuery] = useState('');

  // Load topic details
  useEffect(() => {
    let mounted = true;

    async function loadTopic() {
      setIsLoading(true);
      try {
        const loaded = await getTopic(topicId);
        if (mounted && loaded) {
          setTopic(loaded);
          setChildren(getChildren(topicId));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadTopic();

    return () => {
      mounted = false;
    };
  }, [topicId, getTopic, getChildren]);

  // Fetch documents for tab count
  useEffect(() => {
    fetchDocuments({ topicId });
  }, [topicId, fetchDocuments]);

  // Listen for facilitator:openIdea events and switch to Ideas tab if needed
  useEffect(() => {
    const handleFacilitatorOpenIdea = (event: Event) => {
      const customEvent = event as CustomEvent<{
        ideaId?: string;
        topicId?: string;
        initialPrompt?: string;
        initialGreeting?: string;
      }>;
      const { topicId: eventTopicId, ideaId, initialPrompt, initialGreeting } = customEvent.detail;

      // Only handle if this event is for our Topic
      if (eventTopicId && eventTopicId !== topicId) {
        // Store the event for later if we switch to this topic
        // Use sessionStorage to persist across navigation
        sessionStorage.setItem('pendingOpenIdea', JSON.stringify({
          topicId: eventTopicId,
          ideaId,
          initialPrompt,
          initialGreeting,
          timestamp: Date.now(),
        }));
        return;
      }

      // If not on ideas tab, store the pending open request and switch tabs
      // TopicIdeas will pick this up when it mounts
      if (currentTab !== 'ideas') {
        setPendingIdeaOpen({ ideaId, initialPrompt, initialGreeting });
        handleTabChange('ideas');
      }
      // If already on ideas tab, TopicIdeas will handle the event directly
    };

    window.addEventListener('facilitator:openIdea', handleFacilitatorOpenIdea);
    return () => window.removeEventListener('facilitator:openIdea', handleFacilitatorOpenIdea);
  }, [topicId, currentTab, handleTabChange]);

  // Check for pending openIdea events when topicId changes
  useEffect(() => {
    const stored = sessionStorage.getItem('pendingOpenIdea');
    if (!stored) return;

    try {
      const pending = JSON.parse(stored) as {
        topicId: string;
        ideaId?: string;
        initialPrompt?: string;
        initialGreeting?: string;
        timestamp: number;
      };

      // Only process if it's for this topic and less than 10 seconds old
      if (pending.topicId === topicId && Date.now() - pending.timestamp < 10000) {
        console.log('[TopicDetail] Processing pending openIdea from sessionStorage');
        sessionStorage.removeItem('pendingOpenIdea');

        // If not on ideas tab, store and switch
        if (currentTab !== 'ideas') {
          setPendingIdeaOpen({
            ideaId: pending.ideaId,
            initialPrompt: pending.initialPrompt,
            initialGreeting: pending.initialGreeting,
          });
          handleTabChange('ideas');
        } else {
          // Dispatch event for TopicIdeas to handle
          window.dispatchEvent(new CustomEvent('facilitator:openIdea', {
            detail: {
              topicId: pending.topicId,
              ideaId: pending.ideaId,
              initialPrompt: pending.initialPrompt,
              initialGreeting: pending.initialGreeting,
            }
          }));
        }
      } else if (Date.now() - pending.timestamp >= 10000) {
        // Clear stale entries
        sessionStorage.removeItem('pendingOpenIdea');
      }
    } catch {
      sessionStorage.removeItem('pendingOpenIdea');
    }
  }, [topicId, currentTab, handleTabChange]);

  // Clear pending idea open request (called by TopicIdeas after it processes it)
  const clearPendingIdeaOpen = useCallback(() => {
    setPendingIdeaOpen(null);
  }, []);

  // Calculate counts for tab labels
  const ideasCount = ideas.length;
  const documentsCount = documents.length;

  const handleAddTag = useCallback(async () => {
    if (!topic || !newTag.trim()) return;

    const updatedTags = [...topic.tags, newTag.trim().toLowerCase()];
    const updated = await updateTopic(topicId, { tags: updatedTags });
    if (updated) {
      setTopic(updated);
    }
    setNewTag('');
    setIsAddingTag(false);
  }, [topic, newTag, topicId, updateTopic]);

  const handleRemoveTag = useCallback(async (tagToRemove: string) => {
    if (!topic) return;

    const updatedTags = topic.tags.filter(t => t !== tagToRemove);
    const updated = await updateTopic(topicId, { tags: updatedTags });
    if (updated) {
      setTopic(updated);
    }
  }, [topic, topicId, updateTopic]);

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
  const handleIconChange = useCallback(async (icon: TopicIcon | null) => {
    if (!topic) return;
    const updated = await updateTopic(topicId, { icon });
    if (updated) {
      setTopic(updated);
    }
  }, [topic, topicId, updateTopic]);

  const handleColorChange = useCallback(async (color: TopicColor | null) => {
    if (!topic) return;
    const updated = await updateTopic(topicId, { color });
    if (updated) {
      setTopic(updated);
    }
  }, [topic, topicId, updateTopic]);

  // Title inline editing handlers
  const startEditingTitle = useCallback(() => {
    if (!topic) return;
    setEditingTitle(topic.name);
    setIsEditingTitle(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 0);
  }, [topic]);

  const saveTitle = useCallback(async () => {
    if (!topic || !editingTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    const trimmedTitle = editingTitle.trim();
    if (trimmedTitle !== topic.name) {
      const updated = await updateTopic(topicId, { name: trimmedTitle });
      if (updated) {
        setTopic(updated);
      }
    }
    setIsEditingTitle(false);
  }, [topic, editingTitle, topicId, updateTopic]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  }, [saveTitle]);

  // Description inline editing handlers
  const startEditingDescription = useCallback(() => {
    if (!topic) return;
    setEditingDescription(topic.description || '');
    setIsEditingDescription(true);
    setTimeout(() => {
      descriptionInputRef.current?.focus();
    }, 0);
  }, [topic]);

  const saveDescription = useCallback(async () => {
    if (!topic) {
      setIsEditingDescription(false);
      return;
    }
    const trimmedDesc = editingDescription.trim();
    if (trimmedDesc !== (topic.description || '')) {
      const updated = await updateTopic(topicId, { description: trimmedDesc || undefined });
      if (updated) {
        setTopic(updated);
      }
    }
    setIsEditingDescription(false);
  }, [topic, editingDescription, topicId, updateTopic]);

  const handleDescriptionKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditingDescription(false);
    }
    // Allow Enter for newlines in description (use blur to save)
  }, []);

  // Type change handler
  const handleTypeChange = useCallback(async (value: string | string[]) => {
    if (!topic) return;
    const newType = Array.isArray(value) ? value[0] : value;
    if (newType && newType !== topic.type) {
      const updated = await updateTopic(topicId, { type: newType as TopicType });
      if (updated) {
        setTopic(updated);
      }
    }
    setTypeSearchQuery('');
  }, [topic, topicId, updateTopic]);

  // Build type options including current type and search query
  const typeOptions = (() => {
    const options = [...PREDEFINED_TYPE_OPTIONS];

    // Add current type if it's custom (not in predefined options)
    if (topic?.type && !PREDEFINED_TYPE_OPTIONS.some(opt => opt.value === topic.type)) {
      options.push({ value: topic.type, label: topic.type });
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
  const handleAddLink = useCallback(async (link: Omit<TopicLink, 'id' | 'createdAt'>) => {
    if (!user) return;
    const response = await fetch(`${API_URL}/api/topics/${topicId}/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
      body: JSON.stringify(link),
    });
    if (response.ok) {
      const updated = await getTopic(topicId);
      if (updated) setTopic(updated);
    }
  }, [user, topicId, getTopic]);

  const handleUpdateLink = useCallback(async (linkId: string, updates: Partial<TopicLink>) => {
    if (!user) return;
    const response = await fetch(`${API_URL}/api/topics/${topicId}/links/${linkId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
      body: JSON.stringify(updates),
    });
    if (response.ok) {
      const updated = await getTopic(topicId);
      if (updated) setTopic(updated);
    }
  }, [user, topicId, getTopic]);

  const handleRemoveLink = useCallback(async (linkId: string) => {
    if (!user) return;
    const response = await fetch(`${API_URL}/api/topics/${topicId}/links/${linkId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': user.id },
    });
    if (response.ok) {
      const updated = await getTopic(topicId);
      if (updated) setTopic(updated);
    }
  }, [user, topicId, getTopic]);

  // Properties handlers
  const handlePropertiesChange = useCallback(async (properties: Record<string, string>) => {
    if (!user) return;
    const response = await fetch(`${API_URL}/api/topics/${topicId}/properties`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
      body: JSON.stringify({ properties }),
    });
    if (response.ok) {
      const updated = await getTopic(topicId);
      if (updated) setTopic(updated);
    }
  }, [user, topicId, getTopic]);

  // Handler for saving a single key property
  const handleKeyPropertySave = useCallback((propName: string, value: string) => {
    const currentProps = topic?.properties || {};
    const newProps = { ...currentProps };
    if (value) {
      newProps[propName] = value;
    } else {
      delete newProps[propName];
    }
    handlePropertiesChange(newProps);
  }, [topic?.properties, handlePropertiesChange]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className={styles.notFound}>
        <p>Topic not found</p>
      </div>
    );
  }

  return (
    <div className={styles.detail}>
      {/* Header - Grid: Icon | Content | Actions */}
      <header className={styles.header}>
        {/* Icon cell - spans all rows */}
        <div className={styles.iconCell}>
          <TopicStylePicker
            icon={topic.icon}
            color={topic.color}
            onIconChange={handleIconChange}
            onColorChange={handleColorChange}
          />
        </div>

        {/* Title row */}
        <div className={styles.titleRow}>
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
              {topic.name}
            </h1>
          )}
          <Dropdown
            options={typeOptions}
            value={topic.type}
            onChange={handleTypeChange}
            searchable
            searchPlaceholder="Search or add type..."
            onSearch={setTypeSearchQuery}
            size="sm"
            placeholder="Select type"
            className={styles.typeDropdown}
          />
        </div>

        {/* Actions cell */}
        <div className={styles.headerActions}>
          <IconButton
            icon={<TrashIcon />}
            onClick={() => onDelete(topic.id)}
            aria-label="Delete"
            variant="ghost"
          />
        </div>

        {/* Description row */}
        <div className={styles.descriptionRow}>
          {isEditingDescription ? (
            <textarea
              ref={descriptionInputRef}
              value={editingDescription}
              onChange={(e) => setEditingDescription(e.target.value)}
              onKeyDown={handleDescriptionKeyDown}
              onBlur={saveDescription}
              placeholder="Add a description..."
              className={styles.descriptionInput}
              rows={3}
              autoFocus
            />
          ) : topic.description ? (
            <p
              className={styles.descriptionBlock}
              onClick={startEditingDescription}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && startEditingDescription()}
              title="Click to edit"
            >
              {topic.description}
            </p>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              icon={<AddIcon />}
              onClick={startEditingDescription}
              className={styles.addDescriptionButton}
            >
              Add description
            </Button>
          )}
        </div>

        {/* Tags row */}
        <div className={styles.tagsRow}>
          <div className={styles.tagsBlock}>
            {topic.tags.map((tag) => (
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
        </div>
      </header>

      {/* Key Properties (schema-driven, editable) */}
      {(() => {
        const schema = TOPIC_TYPE_SCHEMAS[topic.type];
        if (!schema || Object.keys(schema.keyProperties).length === 0) {
          return null;
        }

        // Filter out inherited/derived properties (they have inheritPath)
        const displayableProps = Object.entries(schema.keyProperties).filter(
          ([, propDef]) => !propDef.inheritPath
        );

        if (displayableProps.length === 0) {
          return null;
        }

        return (
          <div className={styles.keyPropertiesBlock}>
            {displayableProps.map(([propName, propDef]) => (
              <KeyPropertyRow
                key={propName}
                propName={propName}
                propDef={propDef}
                value={topic.properties?.[propName]}
                onSave={handleKeyPropertySave}
                diskProvider={diskProvider}
              />
            ))}
          </div>
        );
      })()}

      {/* Tabbed content */}
      <Tabs
        items={[
          {
            value: 'ideas',
            label: `Ideas (${ideasCount})`,
            content: (
              <TopicIdeas
                topicId={topicId}
                topicName={topic.name}
                topicType={topic.type}
                topicDescription={topic.description}
                workspaceId={topic.workspaceId}
                pendingIdeaOpen={pendingIdeaOpen}
                onPendingIdeaOpenHandled={clearPendingIdeaOpen}
              />
            ),
          },
          {
            value: 'documents',
            label: `Documents (${documentsCount})`,
            content: <TopicDocuments topicId={topicId} />,
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
                    <TopicLinks
                      ref={linksRef}
                      links={topic.links || []}
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
                    <TopicProperties
                      ref={propertiesRef}
                      properties={topic.properties || {}}
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
                      onClick={() => onCreateChild(topic.id)}
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
                            <span className={styles.childType}>{child.type.charAt(0).toUpperCase() + child.type.slice(1)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.noChildren}>No children yet</p>
                  )}
                </section>

                {/* Content */}
                {topic.content && (
                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Content</h2>
                    <div className={styles.content}>{topic.content}</div>
                  </section>
                )}
              </div>
            ),
          },
        ] satisfies TabItem[]}
        value={currentTab}
        onChange={handleTabChange}
        variant="underline"
        className={styles.tabs}
      />
    </div>
  );
}
