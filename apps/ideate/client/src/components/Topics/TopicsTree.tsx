import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { Button, IconButton, SearchInput, TreeView, Chip, Segmented, Input, Menu, type TreeNode, type MenuItemType } from '@ui-kit/react';
import { ConfirmDialog } from '../ConfirmDialog';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { FilterIcon } from '@ui-kit/icons/FilterIcon';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import { IndentIcon } from '@ui-kit/icons/IndentIcon';
import { ListViewIcon } from '@ui-kit/icons/ListViewIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { DownloadIcon } from '@ui-kit/icons/DownloadIcon';
import { useTopics } from '../../contexts/TopicsContext';
import { ImportDialog } from './ImportDialog';
import { getTopicIcon as getCustomIcon } from './IconPicker';
import { getTopicColor } from './ColorPicker';
import type { PendingTopic } from './InlineTopicEditor';
import type { TopicMetadata, TopicType } from '../../types/topic';
import styles from './TopicsTree.module.css';

interface TopicsTreeProps {
  onSelect: (topic: TopicMetadata | null) => void;
  onCreateNew: (parentId?: string) => void;
  selectedId?: string | null;
  /** Called when inline editing is available, provides a function to trigger it */
  onInlineEditReady?: (startEdit: () => void) => void;
  /** Called when a topic is renamed */
  onRename?: (id: string, newName: string) => void;
  /** Workspace ID to assign to newly created topics */
  workspaceId?: string;
}

type ViewType = 'tree' | 'list';

/** Get type-based fallback icon */
function getTypeIcon(type: TopicType) {
  switch (type) {
    case 'category':
      return <FolderIcon className={styles.topicIcon} />;
    case 'project':
      return <CodeIcon className={styles.topicIcon} />;
    case 'feature':
      return <GearIcon className={styles.topicIcon} />;
    case 'item':
    default:
      return <FileIcon className={styles.topicIcon} />;
  }
}

/** Get icon for a topic - custom icon if set, otherwise type-based */
function getTopicIconElement(topic: TopicMetadata) {
  if (topic.icon) {
    return <span className={styles.topicIcon}>{getCustomIcon(topic.icon)}</span>;
  }
  return getTypeIcon(topic.type);
}

/** Options for building tree nodes with editing support */
interface BuildTreeNodesOptions {
  editingId?: string | null;
  editingName?: string;
  onRenameChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRenameKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRenameBlur?: () => void;
  renameInputRef?: React.RefObject<HTMLInputElement | null>;
}

/** Build TreeNode[] from TopicMetadata[] for TreeView component */
function buildTreeNodes(
  topics: TopicMetadata[],
  parentId: string | null = null,
  visited: Set<string> = new Set(),
  options: BuildTreeNodesOptions = {}
): TreeNode[] {
  const { editingId, editingName, onRenameChange, onRenameKeyDown, onRenameBlur, renameInputRef } = options;

  // Get children of this parent
  const children = parentId === null
    ? topics.filter(t => t.parentIds.length === 0) // Root topics
    : topics.filter(t => t.parentIds.includes(parentId));

  return children
    .filter(topic => !visited.has(topic.id)) // Prevent cycles
    .map((topic): TreeNode => {
      const newVisited = new Set(visited);
      newVisited.add(topic.id);

      const totalIdeas = topic.ideaCounts
        ? topic.ideaCounts.new + topic.ideaCounts.exploring + topic.ideaCounts.ready
        : 0;

      const childNodes = buildTreeNodes(topics, topic.id, newVisited, options);
      const isEditing = editingId === topic.id;

      // Get color style if custom color is set
      const colorStyle = topic.color ? { '--topic-color': getTopicColor(topic.color) } as React.CSSProperties : undefined;

      return {
        id: topic.id,
        type: 'folder', // All topics can have children
        icon: getTopicIconElement(topic),
        label: isEditing ? (
          <div className={styles.renameInputWrapper}>
            <Input
              ref={renameInputRef as React.RefObject<HTMLInputElement>}
              value={editingName || ''}
              onChange={onRenameChange}
              onKeyDown={onRenameKeyDown}
              onBlur={onRenameBlur}
              size="sm"
              fullWidth
              autoFocus
              onClick={(e) => e.stopPropagation()}
              className={styles.inlineInput}
            />
          </div>
        ) : (
          <div className={styles.treeNodeLabel} style={colorStyle}>
            {topic.color && <span className={styles.colorDot} />}
            <span className={styles.topicName}>{topic.name}</span>
            {topic.tags.length > 0 && (
              <span className={styles.tagPreview}>
                {topic.tags.slice(0, 2).map(tag => (
                  <span key={tag} className={styles.miniTag}>#{tag}</span>
                ))}
                {topic.tags.length > 2 && (
                  <span className={styles.moreTag}>+{topic.tags.length - 2}</span>
                )}
              </span>
            )}
            {totalIdeas > 0 && (
              <span className={styles.ideaCountBadge}>{totalIdeas}</span>
            )}
          </div>
        ),
        children: childNodes.length > 0 ? childNodes : undefined,
        data: topic,
      };
    });
}

/** Collect all unique tags from topics */
function collectAllTags(topics: TopicMetadata[]): string[] {
  const tags = new Set<string>();
  topics.forEach(t => t.tags.forEach(tag => tags.add(tag)));
  return Array.from(tags).sort();
}

/** Get depth for a parent ID by counting ancestors */
function getDepthForParent(topics: TopicMetadata[], parentId: string): number {
  let depth = 0;
  let currentId: string | undefined = parentId;

  while (currentId) {
    const topic = topics.find(t => t.id === currentId);
    if (!topic || topic.parentIds.length === 0) break;
    currentId = topic.parentIds[0];
    depth++;
  }

  return depth;
}

/** Generate a temporary ID for pending topics */
let tempIdCounter = 0;
function generateTempId(): string {
  return `temp-${Date.now()}-${++tempIdCounter}`;
}

export function TopicsTree({ onSelect, onCreateNew: _onCreateNew, selectedId, onInlineEditReady, onRename, workspaceId }: TopicsTreeProps) {
  const { topics, expandedIds, setExpandedIds, isLoading, filter, setFilter, createTopic, updateTopic, deleteTopic } = useTopics();
  const [viewType, setViewType] = useState<ViewType>('tree');
  const [searchValue, setSearchValue] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Inline editing state (for creating new topics)
  const [pendingTopic, setPendingTopic] = useState<PendingTopic | null>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [insertAfterId, setInsertAfterId] = useState<string | null>(null);
  const [indentLevel, setIndentLevel] = useState(0);
  const pendingInputRef = useRef<HTMLInputElement>(null);

  // Rename editing state (for existing topics)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Context menu state
  const [contextMenuTargetId, setContextMenuTargetId] = useState<string | null>(null);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importTargetTopic, setImportTargetTopic] = useState<TopicMetadata | null>(null);

  // Filter topics by search query and tag
  const filteredTopics = useMemo(() => {
    if (!searchValue && !tagFilter) return topics;

    const lowerQuery = searchValue.toLowerCase();
    return topics.filter(topic => {
      const matchesQuery = !searchValue ||
        topic.name.toLowerCase().includes(lowerQuery) ||
        topic.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
      const matchesTag = !tagFilter || topic.tags.includes(tagFilter);
      return matchesQuery && matchesTag;
    });
  }, [topics, searchValue, tagFilter]);

  const allTags = useMemo(() => collectAllTags(topics), [topics]);

  // Helper to refocus the TreeView for keyboard navigation
  const refocusTree = useCallback(() => {
    // Use a longer timeout to ensure dialogs/modals have fully closed
    // and their focus trap cleanup has completed
    setTimeout(() => {
      // Focus the TreeView's container (the element with role="tree")
      const treeElement = treeContainerRef.current?.querySelector('[role="tree"]') as HTMLElement;
      treeElement?.focus();
    }, 50);
  }, []);

  // Handle pending input keydown
  const handlePendingKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!pendingTopic) return;

    // Tab: Indent (create as child of item above)
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      // Can only indent if there's an item above to become the parent
      if (insertAfterId) {
        // Check if we can indent (insertAfterId must not already be our parent)
        if (pendingTopic.parentId !== insertAfterId) {
          setIndentLevel(prev => prev + 1);
          setPendingTopic({
            ...pendingTopic,
            parentId: insertAfterId,
            depth: pendingTopic.depth + 1,
          });
          // Auto-expand the new parent
          setExpandedIds(new Set([...expandedIds, insertAfterId]));
        }
      }
      return;
    }

    // Shift+Tab: Unindent (go up to parent's parent)
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      if (pendingTopic.parentId && indentLevel > 0) {
        // Find the parent's parent
        const currentParent = topics.find(t => t.id === pendingTopic.parentId);
        const grandparentId = currentParent?.parentIds[0] || null;
        setIndentLevel(prev => Math.max(0, prev - 1));
        setPendingTopic({
          ...pendingTopic,
          parentId: grandparentId,
          depth: Math.max(0, pendingTopic.depth - 1),
        });
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (pendingTopic.name.trim()) {
        const parentId = pendingTopic.parentId;
        // Commit and create another - pass insertAfterId for correct positioning
        createTopic({
          name: pendingTopic.name.trim(),
          type: 'folder',
          parentIds: parentId ? [parentId] : [],
          insertAfterId: insertAfterId || undefined,
          workspaceId,
        }).then(created => {
          if (created) {
            setLastCreatedId(created.id);
            // Insert next input AFTER the just-created item
            setInsertAfterId(created.id);
            // Auto-expand parent so child is visible
            if (parentId) {
              setExpandedIds(new Set([...expandedIds, parentId]));
            }
            // Keep same parentId - next item will be a SIBLING of just-created
            // (same parent, same indent level)
            setPendingTopic({
              tempId: generateTempId(),
              name: '',
              parentId: parentId,
              depth: pendingTopic.depth,
            });
            // indentLevel stays the same
          }
        });
      } else {
        // Empty - cancel and refocus tree for keyboard navigation
        setPendingTopic(null);
        setInsertAfterId(null);
        setIndentLevel(0);
        if (lastCreatedId) {
          const lastCreated = topics.find(t => t.id === lastCreatedId);
          if (lastCreated) onSelect(lastCreated);
          setLastCreatedId(null);
        }
        refocusTree();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setPendingTopic(null);
      setInsertAfterId(null);
      setIndentLevel(0);
      if (lastCreatedId) {
        const lastCreated = topics.find(t => t.id === lastCreatedId);
        if (lastCreated) onSelect(lastCreated);
        setLastCreatedId(null);
      }
      refocusTree();
    }
  }, [pendingTopic, createTopic, topics, onSelect, lastCreatedId, insertAfterId, indentLevel, setExpandedIds, expandedIds, refocusTree, workspaceId]);

  // Handle pending input change
  const handlePendingChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!pendingTopic) return;
    setPendingTopic({ ...pendingTopic, name: e.target.value });
  }, [pendingTopic]);

  // Start renaming a topic
  const startRename = useCallback((topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (topic) {
      setEditingId(topicId);
      setEditingName(topic.name);
      // Focus the input after render
      setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      }, 0);
    }
  }, [topics]);

  // Save rename
  const saveRename = useCallback(async () => {
    if (!editingId || !editingName.trim()) {
      setEditingId(null);
      setEditingName('');
      refocusTree();
      return;
    }

    const trimmedName = editingName.trim();
    const topic = topics.find(t => t.id === editingId);

    // Only update if name changed
    if (topic && topic.name !== trimmedName) {
      await updateTopic(editingId, { name: trimmedName });
      onRename?.(editingId, trimmedName);
    }

    setEditingId(null);
    setEditingName('');
    refocusTree();
  }, [editingId, editingName, topics, updateTopic, onRename, refocusTree]);

  // Cancel rename
  const cancelRename = useCallback(() => {
    setEditingId(null);
    setEditingName('');
    refocusTree();
  }, [refocusTree]);

  // Handle rename input keydown
  const handleRenameKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Always stop propagation to prevent TreeView from handling arrow keys etc.
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      saveRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRename();
    }
  }, [saveRename, cancelRename]);

  // Handle rename input change
  const handleRenameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingName(e.target.value);
  }, []);

  // Handle rename input blur
  const handleRenameBlur = useCallback(() => {
    saveRename();
  }, [saveRename]);

  // Handle delete confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (pendingDeleteId) {
      // Find the index of the deleted topic to select the next one
      const currentIndex = topics.findIndex(t => t.id === pendingDeleteId);

      await deleteTopic(pendingDeleteId);

      // Select the next topic (or previous if we deleted the last one)
      const remainingTopics = topics.filter(t => t.id !== pendingDeleteId);
      if (remainingTopics.length > 0) {
        // Try to select the item at the same index, or the last item if we were at the end
        const nextIndex = Math.min(currentIndex, remainingTopics.length - 1);
        const nextTopic = remainingTopics[nextIndex];
        if (nextTopic) {
          onSelect(nextTopic);
        }
      } else {
        // No remaining items - clear selection to show empty state
        onSelect(null);
      }
    }
    setDeleteDialogOpen(false);
    setPendingDeleteId(null);
    refocusTree();
  }, [pendingDeleteId, deleteTopic, topics, onSelect, refocusTree]);

  // Handle delete cancel
  const handleCancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setPendingDeleteId(null);
    refocusTree();
  }, [refocusTree]);

  // Handle immediate delete (Ctrl/Cmd+Delete, no confirmation)
  const handleConfirmDeleteImmediate = useCallback(async (topicId: string) => {
    // Find the index of the deleted topic to select the next one
    const currentIndex = topics.findIndex(t => t.id === topicId);

    await deleteTopic(topicId);

    // Select the next topic (or previous if we deleted the last one)
    const remainingTopics = topics.filter(t => t.id !== topicId);
    if (remainingTopics.length > 0) {
      const nextIndex = Math.min(currentIndex, remainingTopics.length - 1);
      const nextTopic = remainingTopics[nextIndex];
      if (nextTopic) {
        onSelect(nextTopic);
      }
    } else {
      // No remaining items - clear selection to show empty state
      onSelect(null);
    }
    refocusTree();
  }, [topics, deleteTopic, onSelect, refocusTree]);

  // Context menu items
  const contextMenuItems: MenuItemType[] = useMemo(() => [
    {
      value: 'rename',
      label: 'Rename',
      icon: <EditIcon />,
      shortcut: 'F2',
    },
    {
      value: 'delete',
      label: 'Delete',
      icon: <TrashIcon />,
      shortcut: '⌫',
      danger: true,
    },
    { type: 'divider' },
    {
      value: 'import',
      label: 'Import...',
      icon: <DownloadIcon />,
    },
  ], []);

  // Handle context menu selection
  const handleContextMenuSelect = useCallback((value: string) => {
    if (!contextMenuTargetId) return;

    switch (value) {
      case 'rename':
        startRename(contextMenuTargetId);
        break;
      case 'delete':
        setPendingDeleteId(contextMenuTargetId);
        setDeleteDialogOpen(true);
        break;
      case 'import': {
        const topic = topics.find(t => t.id === contextMenuTargetId);
        if (topic) {
          setImportTargetTopic(topic);
          setImportDialogOpen(true);
        }
        break;
      }
    }
    setContextMenuTargetId(null);
    setContextMenuOpen(false);
  }, [contextMenuTargetId, startRename, topics]);

  // Handle right-click on tree to capture target and open menu
  const handleTreeContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Find the clicked tree item
    const target = e.target as HTMLElement;
    const treeItem = target.closest('[role="treeitem"]');
    if (treeItem) {
      const itemId = treeItem.getAttribute('data-id');
      if (itemId) {
        setContextMenuTargetId(itemId);
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setContextMenuOpen(true);
      }
    }
  }, []);

  // Handle context menu close
  const handleContextMenuClose = useCallback(() => {
    setContextMenuOpen(false);
    setContextMenuTargetId(null);
  }, []);

  // Build tree data for TreeView - include pending item after insertAfterId
  const treeData = useMemo(() => {
    let nodes: TreeNode[];

    // Options for inline rename editing
    const editOptions: BuildTreeNodesOptions = {
      editingId,
      editingName,
      onRenameChange: handleRenameChange,
      onRenameKeyDown: handleRenameKeyDown,
      onRenameBlur: handleRenameBlur,
      renameInputRef,
    };

    if (searchValue || tagFilter) {
      // When filtering, show matching items as roots
      const matchingIds = filteredTopics.map(t => t.id);
      nodes = buildTreeNodes(topics, null, new Set(), editOptions).filter(node =>
        matchingIds.includes(node.id) || hasMatchingDescendant(node, matchingIds)
      );
    } else {
      nodes = buildTreeNodes(topics, null, new Set(), editOptions);
    }

    // Add pending item if exists
    if (pendingTopic) {
      const pendingNode: TreeNode = {
        id: pendingTopic.tempId,
        type: 'file',
        icon: <FileIcon className={styles.topicIcon} />,
        label: (
          <div className={styles.pendingInputWrapper}>
            <Input
              ref={pendingInputRef}
              value={pendingTopic.name}
              onChange={handlePendingChange}
              onKeyDown={handlePendingKeyDown}
              placeholder={pendingTopic.parentId ? "New child..." : "New topic..."}
              size="sm"
              fullWidth
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              className={styles.inlineInput}
            />
          </div>
        ),
        data: { isPending: true },
      };

      // Determine where to insert the pending node
      if (pendingTopic.parentId) {
        // Insert as the LAST child of the parent (avoids race condition with insertAfterId)
        const result = insertNodeIntoParent(nodes, pendingTopic.parentId, pendingNode, null);
        if (result.inserted) {
          nodes = result.nodes;
        } else {
          // Fallback: insert at end of root if parent not found
          nodes = [...nodes, pendingNode];
        }
      } else if (insertAfterId) {
        // Root-level insertion after a specific node
        const result = insertNodeAfterTarget(nodes, insertAfterId, pendingNode, null);
        if (result.inserted) {
          nodes = result.nodes;
        } else {
          // Fallback: insert at end
          nodes = [...nodes, pendingNode];
        }
      } else {
        // No parent, no insertAfterId - insert at beginning (first creation)
        nodes = [pendingNode, ...nodes];
      }
    }

    // For list view, flatten the tree into a single-level list
    if (viewType === 'list') {
      return flattenTreeNodes(nodes);
    }

    return nodes;
  }, [topics, filteredTopics, searchValue, tagFilter, pendingTopic, handlePendingChange, handlePendingKeyDown, insertAfterId, editingId, editingName, handleRenameChange, handleRenameKeyDown, handleRenameBlur, viewType]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setFilter({ ...filter, searchQuery: value || undefined });
  }, [filter, setFilter]);

  const handleNodeSelect = useCallback((_id: string | null, node: TreeNode | null) => {
    // Don't select pending items
    if (node?.data && !(node.data as { isPending?: boolean }).isPending) {
      onSelect(node.data as TopicMetadata);
      // Keep focus on the tree after selection completes
      // Use setTimeout to ensure focus happens after React updates and any side effects
      setTimeout(() => {
        const treeElement = treeContainerRef.current?.querySelector('[role="tree"]') as HTMLElement;
        if (treeElement && !treeContainerRef.current?.contains(document.activeElement)) {
          treeElement.focus();
        }
      }, 50);
    }
  }, [onSelect]);

  const handleExpandedChange = useCallback((ids: string[]) => {
    setExpandedIds(new Set(ids));
  }, [setExpandedIds]);

  // Start inline editing by adding a new pending topic
  const startInlineEdit = useCallback((parentId?: string) => {
    const tempId = generateTempId();
    const depth = parentId ? getDepthForParent(topics, parentId) + 1 : 0;

    setPendingTopic({ tempId, name: '', parentId: parentId || null, depth });

    // Focus input after render
    setTimeout(() => {
      pendingInputRef.current?.focus();
    }, 0);
  }, [topics]);

  // Start inline editing after a specific topic (as a sibling)
  const startInlineEditAfter = useCallback((afterTopicId: string) => {
    const afterTopic = topics.find(t => t.id === afterTopicId);
    if (!afterTopic) return;

    const tempId = generateTempId();
    // Use same parent as the topic we're inserting after (sibling)
    const parentId = afterTopic.parentIds[0] || null;
    const depth = parentId ? getDepthForParent(topics, parentId) + 1 : 0;

    setInsertAfterId(afterTopicId);
    setPendingTopic({ tempId, name: '', parentId, depth });

    // Focus input after render
    setTimeout(() => {
      pendingInputRef.current?.focus();
    }, 0);
  }, [topics]);

  // Handle button click - start inline editing instead of opening modal
  const handleCreateClick = useCallback(() => {
    startInlineEdit();
  }, [startInlineEdit]);

  // Expose startInlineEdit to parent via callback
  useEffect(() => {
    if (onInlineEditReady) {
      onInlineEditReady(startInlineEdit);
    }
  }, [onInlineEditReady, startInlineEdit]);

  return (
    <div className={styles.tree}>
      <div className={styles.header}>
        <h2 className={styles.title}>Topics</h2>
        <Segmented
          value={viewType}
          onChange={(val) => setViewType(val as ViewType)}
          options={[
            { value: 'tree', label: <IndentIcon />, 'aria-label': 'Tree view' },
            { value: 'list', label: <ListViewIcon />, 'aria-label': 'List view' },
          ]}
        />
      </div>

      <div className={styles.searchRow}>
        <SearchInput
          placeholder="Search by name or #tag..."
          value={searchValue}
          onChange={handleSearchChange}
          aria-label="Search topics"
          fullWidth
          wrapperClassName={styles.searchWrapper}
        />
        <IconButton
          variant={tagFilter ? 'primary' : 'ghost'}
          icon={<FilterIcon />}
          aria-label="Filter by tag"
          onClick={() => setFilterOpen(!filterOpen)}
        />
      </div>

      <div className={styles.newButtonRow}>
        <Button
          variant="primary"
          icon={<AddIcon />}
          onClick={handleCreateClick}
          className={styles.newButton}
        >
          Create a Topic
        </Button>
      </div>

      {/* Tag filter dropdown */}
      {filterOpen && allTags.length > 0 && (
        <div className={styles.tagFilterDropdown}>
          <div className={styles.tagFilterList}>
            {allTags.map(tag => (
              <button
                key={tag}
                className={`${styles.tagFilterItem} ${tagFilter === tag ? styles.tagFilterActive : ''}`}
                onClick={() => {
                  setTagFilter(tagFilter === tag ? null : tag);
                  setFilterOpen(false);
                }}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active filter indicator */}
      {tagFilter && (
        <div className={styles.activeFilter}>
          <Chip size="sm" variant="primary" onRemove={() => setTagFilter(null)}>
            #{tagFilter}
          </Chip>
        </div>
      )}

      <div
        ref={treeContainerRef}
        className={styles.treeContent}
        tabIndex={0}
        onKeyDown={(e) => {
          // F2 to rename selected topic
          if (e.key === 'F2' && selectedId && !editingId && !pendingTopic) {
            e.preventDefault();
            startRename(selectedId);
          }
          // Ctrl/Cmd+Enter to create new topic after selected item
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && selectedId && !editingId && !pendingTopic) {
            e.preventDefault();
            startInlineEditAfter(selectedId);
          }
          // Delete/Backspace to delete selected topic
          if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !editingId && !pendingTopic) {
            e.preventDefault();
            if (e.ctrlKey || e.metaKey) {
              // Ctrl/Cmd+Delete: delete immediately without confirmation
              handleConfirmDeleteImmediate(selectedId);
            } else {
              // Delete alone: show confirmation dialog
              setPendingDeleteId(selectedId);
              setDeleteDialogOpen(true);
            }
          }
        }}
      >
        {isLoading ? (
          <div className={styles.loading}>Loading...</div>
        ) : treeData.length === 0 ? (
          <div className={styles.empty}>
            {searchValue || tagFilter ? (
              <>
                <FolderIcon className={styles.emptyIcon} />
                <p>No topics match your search</p>
              </>
            ) : (
              <>
                <FolderIcon className={styles.emptyIcon} />
                <p>No topics yet</p>
              </>
            )}
          </div>
        ) : (
          <div onContextMenu={handleTreeContextMenu}>
            <TreeView
              data={treeData}
              selectable
              selectedId={selectedId || undefined}
              onSelect={handleNodeSelect}
              expandedIds={Array.from(expandedIds)}
              onExpandedChange={handleExpandedChange}
              defaultExpandAll
              aria-label="Topics hierarchy"
            />
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Topic?"
        message={`Are you sure you want to delete "${topics.find(t => t.id === pendingDeleteId)?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Context menu - positioned at click location */}
      <Menu
        items={contextMenuItems}
        onSelect={handleContextMenuSelect}
        isOpen={contextMenuOpen}
        onOpenChange={(open) => !open && handleContextMenuClose()}
        anchorPosition={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}
      >
        <span style={{ display: 'none' }} />
      </Menu>

      {/* Import dialog */}
      {importTargetTopic && (
        <ImportDialog
          open={importDialogOpen}
          onClose={() => {
            setImportDialogOpen(false);
            setImportTargetTopic(null);
          }}
          targetTopic={importTargetTopic}
        />
      )}
    </div>
  );
}

/** Helper to check if a node has any matching descendants */
function hasMatchingDescendant(node: TreeNode, matchingIds: string[]): boolean {
  if (!node.children) return false;
  return node.children.some(child =>
    matchingIds.includes(child.id) || hasMatchingDescendant(child, matchingIds)
  );
}

/** Flatten tree nodes into a single-level list (remove children/nesting) */
function flattenTreeNodes(nodes: TreeNode[]): TreeNode[] {
  const flattened: TreeNode[] = [];
  const flatten = (nodeList: TreeNode[]) => {
    for (const node of nodeList) {
      // Add node without children for flat list view
      flattened.push({ ...node, children: undefined });
      if (node.children) {
        flatten(node.children);
      }
    }
  };
  flatten(nodes);
  return flattened;
}

/** Recursively insert a node after a target ID in the tree */
function insertNodeAfterTarget(
  nodes: TreeNode[],
  targetId: string,
  nodeToInsert: TreeNode,
  parentId: string | null
): { nodes: TreeNode[]; inserted: boolean } {
  // First, check if target is at this level
  const targetIndex = nodes.findIndex(n => n.id === targetId);
  if (targetIndex !== -1) {
    // Found it - insert after this node
    const newNodes = [
      ...nodes.slice(0, targetIndex + 1),
      nodeToInsert,
      ...nodes.slice(targetIndex + 1),
    ];
    return { nodes: newNodes, inserted: true };
  }

  // Target not at this level - search in children
  // If we have a parentId, we need to insert into that parent's children
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.children && node.children.length > 0) {
      const result = insertNodeAfterTarget(node.children, targetId, nodeToInsert, parentId);
      if (result.inserted) {
        // Update this node's children with the modified array
        const newNodes = [...nodes];
        newNodes[i] = {
          ...node,
          children: result.nodes,
        };
        return { nodes: newNodes, inserted: true };
      }
    }
  }

  return { nodes, inserted: false };
}

/** Insert a node as a child of a parent node (at the end of children or after a sibling) */
function insertNodeIntoParent(
  nodes: TreeNode[],
  parentId: string,
  nodeToInsert: TreeNode,
  afterSiblingId?: string | null
): { nodes: TreeNode[]; inserted: boolean } {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (node.id === parentId) {
      // Found the parent - insert into its children
      const children = node.children || [];
      let newChildren: TreeNode[];

      if (afterSiblingId) {
        const siblingIndex = children.findIndex(c => c.id === afterSiblingId);
        if (siblingIndex !== -1) {
          newChildren = [
            ...children.slice(0, siblingIndex + 1),
            nodeToInsert,
            ...children.slice(siblingIndex + 1),
          ];
        } else {
          // Sibling not found, append at end
          newChildren = [...children, nodeToInsert];
        }
      } else {
        // No sibling specified, append at end
        newChildren = [...children, nodeToInsert];
      }

      const newNodes = [...nodes];
      newNodes[i] = {
        ...node,
        children: newChildren,
      };
      return { nodes: newNodes, inserted: true };
    }

    // Recurse into children
    if (node.children && node.children.length > 0) {
      const result = insertNodeIntoParent(node.children, parentId, nodeToInsert, afterSiblingId);
      if (result.inserted) {
        const newNodes = [...nodes];
        newNodes[i] = {
          ...node,
          children: result.nodes,
        };
        return { nodes: newNodes, inserted: true };
      }
    }
  }

  return { nodes, inserted: false };
}
