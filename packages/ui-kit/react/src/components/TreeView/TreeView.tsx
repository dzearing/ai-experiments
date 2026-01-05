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
  /** Callback when empty space (background) is clicked */
  onBackgroundClick?: () => void;
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

// Helper to get ancestor IDs for a node (path from root to parent)
function getAncestorIds(nodes: TreeNode[], targetId: string, path: string[] = []): string[] | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return path; // Found it - return path to parent (not including target)
    }
    if (node.children && node.children.length > 0) {
      const result = getAncestorIds(node.children, targetId, [...path, node.id]);
      if (result) return result;
    }
  }
  return null; // Not found in this branch
}

export function TreeView({
  data,
  height,
  itemHeight = 32,
  selectable = false,
  selectedId: controlledSelectedId,
  defaultSelectedId = null,
  onSelect,
  onNodeClick,
  onBackgroundClick,
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
  const [measuredHeight, setMeasuredHeight] = useState<number>(400);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container height when not provided
  useEffect(() => {
    if (height !== undefined) return;

    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setMeasuredHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    // Initial measurement
    setMeasuredHeight(container.clientHeight || 400);

    return () => resizeObserver.disconnect();
  }, [height]);

  // Use provided height or measured height
  const effectiveHeight = height ?? measuredHeight;

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
    Math.ceil((scrollTop + effectiveHeight) / itemHeight),
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
      const viewportBottom = scrollTop + effectiveHeight;

      if (nodeTop < viewportTop) {
        containerRef.current?.scrollTo({ top: nodeTop, behavior: 'instant' });
      } else if (nodeBottom > viewportBottom) {
        containerRef.current?.scrollTo({ top: nodeBottom - effectiveHeight, behavior: 'instant' });
      }
    },
    [flatNodes, itemHeight, scrollTop, effectiveHeight]
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
          targetIndex = Math.max(0, currentIndex - Math.floor(effectiveHeight / itemHeight));
          break;
        case 'pageDown':
          targetIndex = Math.min(
            flatNodes.length - 1,
            currentIndex + Math.floor(effectiveHeight / itemHeight)
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
      effectiveHeight,
      itemHeight,
      scrollNodeIntoView,
      selectable,
      isSelectionControlled,
      onSelect,
      onNodeClick,
    ]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Don't handle keyboard events when focus is on an input/textarea
    // This allows inline editing to work without TreeView intercepting keys
    const target = e.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
      return;
    }

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

  // Sync focusedNodeId with selectedId when selection changes externally
  // This ensures keyboard navigation works after programmatic selection
  useEffect(() => {
    if (selectedId && selectedId !== focusedNodeId) {
      setFocusedNodeId(selectedId);
    }
  }, [selectedId, focusedNodeId]);

  // Auto-expand ancestors when selectedId changes to show nested items
  const prevSelectedIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    // Only run when selectedId actually changes (not on initial mount with undefined)
    if (prevSelectedIdRef.current === selectedId) return;
    prevSelectedIdRef.current = selectedId;

    if (!selectedId) return;

    // Find ancestors of the selected node
    const ancestors = getAncestorIds(data, selectedId);
    if (!ancestors || ancestors.length === 0) return;

    // Check if any ancestors need to be expanded
    const needsExpansion = ancestors.some((id) => !expandedIds.includes(id));
    if (!needsExpansion) return;

    // Expand all ancestors
    const newExpandedIds = [...new Set([...expandedIds, ...ancestors])];
    setExpandedIds(newExpandedIds);
  }, [selectedId, data, expandedIds, setExpandedIds]);

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

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if click was on empty space (not on a node)
    const target = e.target as HTMLElement;
    // If the click was on the container, content, or virtualList (not a node), trigger background click
    if (
      target === containerRef.current ||
      target.classList.contains(styles.content) ||
      target.classList.contains(styles.virtualList)
    ) {
      onBackgroundClick?.();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className || ''}`}
      style={height !== undefined ? { height } : undefined}
      onScroll={handleScroll}
      onClick={handleContainerClick}
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
                data-id={node.id}
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
TreeView.displayName = 'TreeView';
