import {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
  type KeyboardEvent,
  type UIEvent,
  type ComponentType,
} from 'react';
import styles from './TreeView.module.css';

/**
 * TreeView component - virtualized hierarchical tree navigation
 *
 * Features:
 * - Virtualized rendering for 10k+ nodes
 * - Full keyboard navigation (Arrow keys, Home/End, PageUp/PageDown)
 * - Controlled and uncontrolled expansion/selection
 * - Custom icon resolver system
 * - Focus management separate from selection
 *
 * Surfaces used:
 * - controlSubtle (nodes on hover)
 * - controlPrimary (selected nodes)
 *
 * Tokens used:
 * - --controlSubtle-bg-hover
 * - --controlPrimary-bg, --controlPrimary-text
 * - --duration-fast (animation)
 */

export interface TreeNode {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: ReactNode;
  /** Node type (for icon resolution) */
  type?: string;
  /** Icon for the node (overrides iconResolver) */
  icon?: ReactNode;
  /** Child nodes */
  children?: TreeNode[];
  /** Node is disabled */
  disabled?: boolean;
  /** Additional data */
  data?: unknown;
}

/** Icon component type */
export type IconComponent = ComponentType<{ size?: number; className?: string }>;

/** Function to resolve icons based on node type */
export type IconResolver = (type: string, node: TreeNode) => ReactNode | null;

/** Flattened node for virtualization */
interface FlatNode extends TreeNode {
  level: number;
  parentId: string | null;
  hasChildren: boolean;
}

export interface TreeViewProps {
  /** Tree data */
  data: TreeNode[];
  /** Height of the container (required for virtualization) */
  height?: number;
  /** Height of each item */
  itemHeight?: number;
  /** Enable node selection */
  selectable?: boolean;
  /** Controlled selected node ID */
  selectedId?: string | null;
  /** Default selected node ID */
  defaultSelectedId?: string | null;
  /** Callback when selection changes */
  onSelect?: (id: string | null, node: TreeNode | null) => void;
  /** Callback when node is clicked */
  onNodeClick?: (node: TreeNode) => void;
  /** Controlled expanded node IDs */
  expandedIds?: string[];
  /** Default expanded node IDs */
  defaultExpandedIds?: string[];
  /** Callback when expansion changes */
  onExpandedChange?: (ids: string[]) => void;
  /** Callback when a node is expanded */
  onNodeExpand?: (node: TreeNode) => void;
  /** Callback when a node is collapsed */
  onNodeCollapse?: (node: TreeNode) => void;
  /** Expand all nodes by default */
  defaultExpandAll?: boolean;
  /** Custom icon resolver function */
  iconResolver?: IconResolver;
  /** Default icon mapping by type */
  defaultIconMap?: Record<string, ReactNode>;
  /** Additional class name */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
}

// Default chevron icon
const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    className={`${styles.chevron} ${expanded ? styles.expanded : ''}`}
  >
    <path
      d="M6 4L10 8L6 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Default folder icon
const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.379a1.5 1.5 0 0 1 1.06.44L8.061 3.56A.5.5 0 0 0 8.415 3.7H13.5A1.5 1.5 0 0 1 15 5.2v7.3a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z" />
  </svg>
);

// Default file icon
const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 1h5l4 4v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zm5 1v3h3L9 2z" />
  </svg>
);

// Default icon mapping
const DEFAULT_ICON_MAP: Record<string, ReactNode> = {
  folder: <FolderIcon />,
  file: <FileIcon />,
};

// Helper to collect all node IDs
function collectAllIds(nodes: TreeNode[]): string[] {
  const ids: string[] = [];
  const traverse = (items: TreeNode[]) => {
    for (const item of items) {
      if (item.children && item.children.length > 0) {
        ids.push(item.id);
        traverse(item.children);
      }
    }
  };
  traverse(nodes);
  return ids;
}

// Helper to find a node by ID
function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function TreeView({
  data,
  height = 400,
  itemHeight = 32,
  selectable = false,
  selectedId: controlledSelectedId,
  defaultSelectedId = null,
  onSelect,
  onNodeClick,
  expandedIds: controlledExpandedIds,
  defaultExpandedIds,
  onExpandedChange,
  onNodeExpand,
  onNodeCollapse,
  defaultExpandAll = false,
  iconResolver,
  defaultIconMap,
  className,
  'aria-label': ariaLabel,
}: TreeViewProps) {
  // Initialize expanded IDs
  const initialExpandedIds = defaultExpandAll
    ? collectAllIds(data)
    : defaultExpandedIds ?? [];

  // State
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(defaultSelectedId);
  const [internalExpandedIds, setInternalExpandedIds] = useState<string[]>(initialExpandedIds);
  const [scrollTop, setScrollTop] = useState(0);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [isTreeFocused, setIsTreeFocused] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);

  // Controlled vs uncontrolled
  const isSelectionControlled = controlledSelectedId !== undefined;
  const isExpansionControlled = controlledExpandedIds !== undefined;
  const selectedId = isSelectionControlled ? controlledSelectedId : internalSelectedId;
  const expandedIds = isExpansionControlled ? controlledExpandedIds : internalExpandedIds;

  // Merge icon maps
  const iconMap = useMemo(() => {
    return { ...DEFAULT_ICON_MAP, ...defaultIconMap };
  }, [defaultIconMap]);

  // Resolve icon for a node
  const resolveIcon = useCallback(
    (node: TreeNode): ReactNode => {
      // Direct icon takes precedence
      if (node.icon) return node.icon;

      const nodeType = node.type || (node.children && node.children.length > 0 ? 'folder' : 'file');

      // Try custom resolver first
      if (iconResolver) {
        const customIcon = iconResolver(nodeType, node);
        if (customIcon) {
          return customIcon;
        }
      }

      // Fall back to icon map
      return iconMap[nodeType] || iconMap.file || null;
    },
    [iconResolver, iconMap]
  );

  // Flatten tree for virtualization
  const flattenTree = useCallback(
    (nodes: TreeNode[], level = 0, parentId: string | null = null): FlatNode[] => {
      const result: FlatNode[] = [];

      for (const node of nodes) {
        const hasChildren = !!(node.children && node.children.length > 0);
        result.push({ ...node, level, parentId, hasChildren });

        if (hasChildren && expandedIds.includes(node.id)) {
          result.push(...flattenTree(node.children!, level + 1, node.id));
        }
      }

      return result;
    },
    [expandedIds]
  );

  const flatNodes = useMemo(() => flattenTree(data), [data, flattenTree]);

  // Virtualization calculations
  const visibleStartIndex = Math.floor(scrollTop / itemHeight);
  const visibleEndIndex = Math.min(
    Math.ceil((scrollTop + height) / itemHeight),
    flatNodes.length
  );

  const bufferSize = 5;
  const startIndex = Math.max(0, visibleStartIndex - bufferSize);
  const endIndex = Math.min(flatNodes.length, visibleEndIndex + bufferSize);

  const visibleNodes = flatNodes.slice(startIndex, endIndex);
  const totalHeight = flatNodes.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  // Handlers
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const setExpandedIds = useCallback(
    (newIds: string[]) => {
      if (!isExpansionControlled) {
        setInternalExpandedIds(newIds);
      }
      onExpandedChange?.(newIds);
    },
    [isExpansionControlled, onExpandedChange]
  );

  const toggleExpand = useCallback(
    (node: FlatNode) => {
      if (!node.hasChildren || node.disabled) return;

      const isExpanded = expandedIds.includes(node.id);
      const newIds = isExpanded
        ? expandedIds.filter((id) => id !== node.id)
        : [...expandedIds, node.id];

      setExpandedIds(newIds);

      if (isExpanded) {
        onNodeCollapse?.(node);
      } else {
        onNodeExpand?.(node);
      }
    },
    [expandedIds, setExpandedIds, onNodeExpand, onNodeCollapse]
  );

  const handleSelect = useCallback(
    (node: FlatNode) => {
      if (node.disabled) return;

      if (selectable) {
        const newId = selectedId === node.id ? null : node.id;
        const foundNode = newId ? findNode(data, newId) : null;

        if (!isSelectionControlled) {
          setInternalSelectedId(newId);
        }
        onSelect?.(newId, foundNode);
      }

      onNodeClick?.(node);
    },
    [data, selectable, selectedId, isSelectionControlled, onSelect, onNodeClick]
  );

  const scrollNodeIntoView = useCallback(
    (nodeId: string) => {
      const nodeIndex = flatNodes.findIndex((n) => n.id === nodeId);
      if (nodeIndex === -1) return;

      const nodeTop = nodeIndex * itemHeight;
      const nodeBottom = nodeTop + itemHeight;
      const viewportTop = scrollTop;
      const viewportBottom = scrollTop + height;

      if (nodeTop < viewportTop) {
        containerRef.current?.scrollTo({ top: nodeTop, behavior: 'smooth' });
      } else if (nodeBottom > viewportBottom) {
        containerRef.current?.scrollTo({ top: nodeBottom - height, behavior: 'smooth' });
      }
    },
    [flatNodes, itemHeight, scrollTop, height]
  );

  // Keyboard navigation
  const navigateToNode = useCallback(
    (direction: 'up' | 'down' | 'first' | 'last' | 'pageUp' | 'pageDown') => {
      const currentIndex = focusedNodeId
        ? flatNodes.findIndex((n) => n.id === focusedNodeId)
        : -1;
      let targetIndex = currentIndex;

      switch (direction) {
        case 'up':
          targetIndex = Math.max(0, currentIndex - 1);
          break;
        case 'down':
          targetIndex = Math.min(flatNodes.length - 1, currentIndex + 1);
          break;
        case 'first':
          targetIndex = 0;
          break;
        case 'last':
          targetIndex = flatNodes.length - 1;
          break;
        case 'pageUp':
          targetIndex = Math.max(0, currentIndex - Math.floor(height / itemHeight));
          break;
        case 'pageDown':
          targetIndex = Math.min(
            flatNodes.length - 1,
            currentIndex + Math.floor(height / itemHeight)
          );
          break;
      }

      if (targetIndex !== currentIndex && targetIndex >= 0 && targetIndex < flatNodes.length) {
        const targetNode = flatNodes[targetIndex];
        if (targetNode) {
          setFocusedNodeId(targetNode.id);
          scrollNodeIntoView(targetNode.id);

          // Also select on keyboard navigation if selectable
          if (selectable && !isSelectionControlled) {
            setInternalSelectedId(targetNode.id);
          }
          if (selectable) {
            onSelect?.(targetNode.id, targetNode);
          }
          onNodeClick?.(targetNode);
        }
      }
    },
    [
      focusedNodeId,
      flatNodes,
      height,
      itemHeight,
      scrollNodeIntoView,
      selectable,
      isSelectionControlled,
      onSelect,
      onNodeClick,
    ]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Initialize focus if not set
    let currentFocusedId = focusedNodeId;
    if (!currentFocusedId && flatNodes.length > 0) {
      currentFocusedId = flatNodes[0]?.id || '';
      setFocusedNodeId(currentFocusedId);
    }

    const node = flatNodes.find((n) => n.id === currentFocusedId);
    if (!node) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        navigateToNode('up');
        break;

      case 'ArrowDown':
        e.preventDefault();
        navigateToNode('down');
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (node.hasChildren) {
          if (!expandedIds.includes(node.id)) {
            // Expand the node
            toggleExpand(node);
          } else {
            // Move to first child
            const nodeIndex = flatNodes.findIndex((n) => n.id === node.id);
            if (nodeIndex < flatNodes.length - 1) {
              const nextNode = flatNodes[nodeIndex + 1];
              if (nextNode && nextNode.parentId === node.id) {
                setFocusedNodeId(nextNode.id);
                scrollNodeIntoView(nextNode.id);
                if (selectable && !isSelectionControlled) {
                  setInternalSelectedId(nextNode.id);
                }
                if (selectable) {
                  onSelect?.(nextNode.id, nextNode);
                }
                onNodeClick?.(nextNode);
              }
            }
          }
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (node.hasChildren && expandedIds.includes(node.id)) {
          // Collapse the node
          toggleExpand(node);
        } else if (node.parentId) {
          // Move to parent
          const parent = flatNodes.find((n) => n.id === node.parentId);
          if (parent) {
            setFocusedNodeId(parent.id);
            scrollNodeIntoView(parent.id);
            if (selectable && !isSelectionControlled) {
              setInternalSelectedId(parent.id);
            }
            if (selectable) {
              onSelect?.(parent.id, parent);
            }
            onNodeClick?.(parent);
          }
        }
        break;

      case 'Home':
        e.preventDefault();
        navigateToNode('first');
        break;

      case 'End':
        e.preventDefault();
        navigateToNode('last');
        break;

      case 'PageUp':
        e.preventDefault();
        navigateToNode('pageUp');
        break;

      case 'PageDown':
        e.preventDefault();
        navigateToNode('pageDown');
        break;

      case 'Enter':
        e.preventDefault();
        // Select and toggle if has children
        handleSelect(node);
        if (node.hasChildren) {
          toggleExpand(node);
        }
        break;

      case ' ':
        e.preventDefault();
        // Just select, don't toggle
        handleSelect(node);
        break;
    }
  };

  // Initialize focused node
  useEffect(() => {
    if (!focusedNodeId && flatNodes.length > 0) {
      setFocusedNodeId(flatNodes[0]?.id || '');
    }
  }, [focusedNodeId, flatNodes]);

  const handleNodeClick = (node: FlatNode) => {
    setFocusedNodeId(node.id);
    handleSelect(node);
    // Focus the container to enable keyboard navigation
    containerRef.current?.focus();
  };

  const handleToggleClick = (e: React.MouseEvent, node: FlatNode) => {
    e.stopPropagation();
    toggleExpand(node);
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className || ''}`}
      style={{ height }}
      onScroll={handleScroll}
      onFocus={() => {
        setIsTreeFocused(true);
        if (!focusedNodeId && flatNodes.length > 0) {
          const initialFocusId = selectedId || flatNodes[0]?.id || '';
          setFocusedNodeId(initialFocusId);
        }
      }}
      onBlur={() => setIsTreeFocused(false)}
      onKeyDown={handleKeyDown}
      role="tree"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <div className={styles.content} style={{ height: totalHeight }}>
        <div className={styles.virtualList} style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleNodes.map((node) => {
            const isExpanded = expandedIds.includes(node.id);
            const isSelected = selectedId === node.id;
            const isFocused = focusedNodeId === node.id && isTreeFocused;

            const nodeClassNames = [
              styles.node,
              isSelected && styles.selected,
              isFocused && styles.focused,
              node.disabled && styles.disabled,
              selectable && styles.selectable,
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={node.id}
                className={nodeClassNames}
                style={{
                  height: itemHeight,
                  paddingLeft: `${node.level * 16 + 8}px`,
                }}
                onClick={() => handleNodeClick(node)}
                role="treeitem"
                aria-expanded={node.hasChildren ? isExpanded : undefined}
                aria-selected={selectable ? isSelected : undefined}
                aria-disabled={node.disabled || undefined}
                aria-level={node.level + 1}
                tabIndex={-1}
              >
                {/* Toggle */}
                <span
                  className={`${styles.toggle} ${node.hasChildren ? '' : styles.hidden}`}
                  onClick={(e) => handleToggleClick(e, node)}
                >
                  <ChevronIcon expanded={isExpanded} />
                </span>

                {/* Icon */}
                <span className={styles.icon}>{resolveIcon(node)}</span>

                {/* Label */}
                <span className={styles.label}>{node.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
