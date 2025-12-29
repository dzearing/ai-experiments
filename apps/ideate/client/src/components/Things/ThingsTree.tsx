import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { Button, SearchInput, TreeView, Chip, Segmented, Input, type TreeNode } from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { FilterIcon } from '@ui-kit/icons/FilterIcon';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import { IndentIcon } from '@ui-kit/icons/IndentIcon';
import { ListViewIcon } from '@ui-kit/icons/ListViewIcon';
import { useThings } from '../../contexts/ThingsContext';
import type { PendingThing } from './InlineThingEditor';
import type { ThingMetadata, ThingType } from '../../types/thing';
import styles from './ThingsTree.module.css';

interface ThingsTreeProps {
  onSelect: (thing: ThingMetadata) => void;
  onCreateNew: (parentId?: string) => void;
  selectedId?: string | null;
  /** Called when inline editing is available, provides a function to trigger it */
  onInlineEditReady?: (startEdit: () => void) => void;
}

type ViewType = 'tree' | 'list';

function getThingIcon(type: ThingType) {
  switch (type) {
    case 'category':
      return <FolderIcon className={styles.thingIcon} />;
    case 'project':
      return <CodeIcon className={styles.thingIcon} />;
    case 'feature':
      return <GearIcon className={styles.thingIcon} />;
    case 'item':
    default:
      return <FileIcon className={styles.thingIcon} />;
  }
}

/** Build TreeNode[] from ThingMetadata[] for TreeView component */
function buildTreeNodes(
  things: ThingMetadata[],
  parentId: string | null = null,
  visited: Set<string> = new Set()
): TreeNode[] {
  // Get children of this parent
  const children = parentId === null
    ? things.filter(t => t.parentIds.length === 0) // Root things
    : things.filter(t => t.parentIds.includes(parentId));

  return children
    .filter(thing => !visited.has(thing.id)) // Prevent cycles
    .map((thing): TreeNode => {
      const newVisited = new Set(visited);
      newVisited.add(thing.id);

      const totalIdeas = thing.ideaCounts
        ? thing.ideaCounts.new + thing.ideaCounts.exploring + thing.ideaCounts.ready
        : 0;

      const childNodes = buildTreeNodes(things, thing.id, newVisited);

      return {
        id: thing.id,
        type: thing.type === 'category' || thing.type === 'project' ? 'folder' : 'file',
        icon: getThingIcon(thing.type),
        label: (
          <div className={styles.treeNodeLabel}>
            <span className={styles.thingName}>{thing.name}</span>
            {thing.tags.length > 0 && (
              <span className={styles.tagPreview}>
                {thing.tags.slice(0, 2).map(tag => (
                  <span key={tag} className={styles.miniTag}>#{tag}</span>
                ))}
                {thing.tags.length > 2 && (
                  <span className={styles.moreTag}>+{thing.tags.length - 2}</span>
                )}
              </span>
            )}
            {totalIdeas > 0 && (
              <span className={styles.ideaCountBadge}>{totalIdeas}</span>
            )}
          </div>
        ),
        children: childNodes.length > 0 ? childNodes : undefined,
        data: thing,
      };
    });
}

/** Collect all unique tags from things */
function collectAllTags(things: ThingMetadata[]): string[] {
  const tags = new Set<string>();
  things.forEach(t => t.tags.forEach(tag => tags.add(tag)));
  return Array.from(tags).sort();
}

/** Get depth for a parent ID by counting ancestors */
function getDepthForParent(things: ThingMetadata[], parentId: string): number {
  let depth = 0;
  let currentId: string | undefined = parentId;

  while (currentId) {
    const thing = things.find(t => t.id === currentId);
    if (!thing || thing.parentIds.length === 0) break;
    currentId = thing.parentIds[0];
    depth++;
  }

  return depth;
}

/** Generate a temporary ID for pending things */
let tempIdCounter = 0;
function generateTempId(): string {
  return `temp-${Date.now()}-${++tempIdCounter}`;
}

export function ThingsTree({ onSelect, onCreateNew: _onCreateNew, selectedId, onInlineEditReady }: ThingsTreeProps) {
  const { things, expandedIds, setExpandedIds, isLoading, filter, setFilter, createThing } = useThings();
  const [viewType, setViewType] = useState<ViewType>('tree');
  const [searchValue, setSearchValue] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Inline editing state
  const [pendingThing, setPendingThing] = useState<PendingThing | null>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [insertAfterId, setInsertAfterId] = useState<string | null>(null);
  const [indentLevel, setIndentLevel] = useState(0);
  const pendingInputRef = useRef<HTMLInputElement>(null);

  // Filter things by search query and tag
  const filteredThings = useMemo(() => {
    if (!searchValue && !tagFilter) return things;

    const lowerQuery = searchValue.toLowerCase();
    return things.filter(thing => {
      const matchesQuery = !searchValue ||
        thing.name.toLowerCase().includes(lowerQuery) ||
        thing.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
      const matchesTag = !tagFilter || thing.tags.includes(tagFilter);
      return matchesQuery && matchesTag;
    });
  }, [things, searchValue, tagFilter]);

  const allTags = useMemo(() => collectAllTags(things), [things]);

  // Handle pending input keydown
  const handlePendingKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!pendingThing) return;

    // Tab: Indent (create as child of item above)
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      // Can only indent if there's an item above to become the parent
      if (insertAfterId) {
        // Check if we can indent (insertAfterId must not already be our parent)
        if (pendingThing.parentId !== insertAfterId) {
          setIndentLevel(prev => prev + 1);
          setPendingThing({
            ...pendingThing,
            parentId: insertAfterId,
            depth: pendingThing.depth + 1,
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
      if (pendingThing.parentId && indentLevel > 0) {
        // Find the parent's parent
        const currentParent = things.find(t => t.id === pendingThing.parentId);
        const grandparentId = currentParent?.parentIds[0] || null;
        setIndentLevel(prev => Math.max(0, prev - 1));
        setPendingThing({
          ...pendingThing,
          parentId: grandparentId,
          depth: Math.max(0, pendingThing.depth - 1),
        });
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (pendingThing.name.trim()) {
        const parentId = pendingThing.parentId;
        // Commit and create another
        createThing({
          name: pendingThing.name.trim(),
          type: 'item',
          parentIds: parentId ? [parentId] : [],
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
            setPendingThing({
              tempId: generateTempId(),
              name: '',
              parentId: parentId,
              depth: pendingThing.depth,
            });
            // indentLevel stays the same
          }
        });
      } else {
        // Empty - cancel
        setPendingThing(null);
        setInsertAfterId(null);
        setIndentLevel(0);
        if (lastCreatedId) {
          const lastCreated = things.find(t => t.id === lastCreatedId);
          if (lastCreated) onSelect(lastCreated);
          setLastCreatedId(null);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setPendingThing(null);
      setInsertAfterId(null);
      setIndentLevel(0);
      if (lastCreatedId) {
        const lastCreated = things.find(t => t.id === lastCreatedId);
        if (lastCreated) onSelect(lastCreated);
        setLastCreatedId(null);
      }
    }
  }, [pendingThing, createThing, things, onSelect, lastCreatedId, insertAfterId, indentLevel, setExpandedIds, expandedIds]);

  // Handle pending input change
  const handlePendingChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!pendingThing) return;
    setPendingThing({ ...pendingThing, name: e.target.value });
  }, [pendingThing]);

  // Build tree data for TreeView - include pending item after insertAfterId
  const treeData = useMemo(() => {
    let nodes: TreeNode[];

    if (searchValue || tagFilter) {
      // When filtering, show matching items as roots
      const matchingIds = filteredThings.map(t => t.id);
      nodes = buildTreeNodes(things, null).filter(node =>
        matchingIds.includes(node.id) || hasMatchingDescendant(node, matchingIds)
      );
    } else {
      nodes = buildTreeNodes(things);
    }

    // Add pending item if exists
    if (pendingThing) {
      const pendingNode: TreeNode = {
        id: pendingThing.tempId,
        type: 'file',
        icon: <FileIcon className={styles.thingIcon} />,
        label: (
          <div className={styles.pendingInputWrapper}>
            <Input
              ref={pendingInputRef}
              value={pendingThing.name}
              onChange={handlePendingChange}
              onKeyDown={handlePendingKeyDown}
              placeholder={pendingThing.parentId ? "New child..." : "New thing..."}
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
      if (pendingThing.parentId) {
        // Insert as the LAST child of the parent (avoids race condition with insertAfterId)
        const result = insertNodeIntoParent(nodes, pendingThing.parentId, pendingNode, null);
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

    return nodes;
  }, [things, filteredThings, searchValue, tagFilter, pendingThing, handlePendingChange, handlePendingKeyDown, insertAfterId]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setFilter({ ...filter, searchQuery: value || undefined });
  }, [filter, setFilter]);

  const handleNodeSelect = useCallback((_id: string | null, node: TreeNode | null) => {
    // Don't select pending items
    if (node?.data && !(node.data as { isPending?: boolean }).isPending) {
      onSelect(node.data as ThingMetadata);
    }
  }, [onSelect]);

  const handleExpandedChange = useCallback((ids: string[]) => {
    setExpandedIds(new Set(ids));
  }, [setExpandedIds]);

  // Start inline editing by adding a new pending thing
  const startInlineEdit = useCallback((parentId?: string) => {
    const tempId = generateTempId();
    const depth = parentId ? getDepthForParent(things, parentId) + 1 : 0;

    setPendingThing({ tempId, name: '', parentId: parentId || null, depth });

    // Focus input after render
    setTimeout(() => {
      pendingInputRef.current?.focus();
    }, 0);
  }, [things]);

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
        <h2 className={styles.title}>Things</h2>
        <Segmented
          value={viewType}
          onChange={(val) => setViewType(val as ViewType)}
          options={[
            { value: 'tree', label: <IndentIcon />, 'aria-label': 'Tree view' },
            { value: 'list', label: <ListViewIcon />, 'aria-label': 'List view' },
          ]}
          size="sm"
        />
      </div>

      <div className={styles.searchRow}>
        <SearchInput
          placeholder="Search by name or #tag..."
          value={searchValue}
          onChange={handleSearchChange}
          aria-label="Search things"
          fullWidth
          wrapperClassName={styles.searchWrapper}
        />
        <Button
          variant={tagFilter ? 'primary' : 'ghost'}
          icon={<FilterIcon />}
          aria-label="Filter by tag"
          onClick={() => setFilterOpen(!filterOpen)}
          size="sm"
        />
      </div>

      <div className={styles.newButtonRow}>
        <Button
          variant="primary"
          icon={<AddIcon />}
          onClick={handleCreateClick}
          className={styles.newButton}
        >
          Create a Thing
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

      <div className={styles.treeContent}>
        {isLoading ? (
          <div className={styles.loading}>Loading...</div>
        ) : treeData.length === 0 ? (
          <div className={styles.empty}>
            {searchValue || tagFilter ? (
              <>
                <FolderIcon className={styles.emptyIcon} />
                <p>No things match your search</p>
              </>
            ) : (
              <>
                <FolderIcon className={styles.emptyIcon} />
                <p>No things yet</p>
              </>
            )}
          </div>
        ) : (
          <TreeView
            data={treeData}
            selectable
            selectedId={selectedId || undefined}
            onSelect={handleNodeSelect}
            expandedIds={Array.from(expandedIds)}
            onExpandedChange={handleExpandedChange}
            defaultExpandAll
            aria-label="Things hierarchy"
          />
        )}
      </div>
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
