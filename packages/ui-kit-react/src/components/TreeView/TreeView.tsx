import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronRightIcon, FolderIcon, FileIcon } from '@claude-flow/ui-kit-icons';
import styles from './TreeView.module.css';

export interface TreeNode {
  id: string;
  label: string;
  type: string; // Changed from 'folder' | 'file' to string for flexibility
  children?: TreeNode[];
  isExpanded?: boolean;
  level?: number;
  parentId?: string | null;
}

export type IconResolver = (type: string, node: TreeNode) => React.ComponentType<{ size?: number; className?: string }> | null;

export interface TreeViewProps {
  data: TreeNode[];
  height?: number;
  itemHeight?: number;
  onNodeClick?: (node: TreeNode) => void;
  onNodeExpand?: (node: TreeNode) => void;
  onNodeCollapse?: (node: TreeNode) => void;
  selectedNodeId?: string | null;
  className?: string;
  expandedNodes?: Set<string>;
  onExpandedNodesChange?: (nodes: Set<string>) => void;
  iconResolver?: IconResolver;
  defaultIconMap?: Record<string, React.ComponentType<{ size?: number; className?: string }>>;
}

interface FlatNode extends TreeNode {
  level: number;
  parentId: string | null;
}

// Default icon mapping
const DEFAULT_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  folder: FolderIcon,
  file: FileIcon,
};

// Default icon resolver
const defaultIconResolver: IconResolver = (type: string, _node: TreeNode) => {
  return DEFAULT_ICON_MAP[type] || DEFAULT_ICON_MAP.file || null;
};

export const TreeView: React.FC<TreeViewProps> = ({
  data,
  height = 400,
  itemHeight = 32,
  onNodeClick,
  onNodeExpand,
  onNodeCollapse,
  selectedNodeId: controlledSelectedNodeId,
  className,
  expandedNodes: controlledExpandedNodes,
  onExpandedNodesChange,
  iconResolver = defaultIconResolver,
  defaultIconMap
}) => {
  const [internalExpandedNodes, setInternalExpandedNodes] = useState<Set<string>>(new Set());
  const [internalSelectedNodeId, setInternalSelectedNodeId] = useState<string | null>(null);
  const expandedNodes = controlledExpandedNodes ?? internalExpandedNodes;
  const selectedNodeId = controlledSelectedNodeId !== undefined ? controlledSelectedNodeId : internalSelectedNodeId;
  
  // Merge default icon map with custom map if provided
  const resolveIcon = useMemo(() => {
    if (defaultIconMap) {
      const mergedMap = { ...DEFAULT_ICON_MAP, ...defaultIconMap };
      return (type: string, node: TreeNode) => {
        const customIcon = iconResolver(type, node);
        if (customIcon) return customIcon;
        return mergedMap[type] || mergedMap.file || null;
      };
    }
    return iconResolver;
  }, [iconResolver, defaultIconMap]);
  
  const setExpandedNodes = useCallback((nodes: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    if (onExpandedNodesChange) {
      const newNodes = typeof nodes === 'function' ? nodes(expandedNodes) : nodes;
      onExpandedNodesChange(newNodes);
    } else {
      setInternalExpandedNodes(nodes);
    }
  }, [expandedNodes, onExpandedNodesChange]);

  const [scrollTop, setScrollTop] = useState(0);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [isTreeFocused, setIsTreeFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const flattenTree = useCallback((nodes: TreeNode[], level = 0, parentId: string | null = null): FlatNode[] => {
    const result: FlatNode[] = [];
    
    nodes.forEach(node => {
      result.push({ ...node, level, parentId });
      
      if (node.children && expandedNodes.has(node.id)) {
        result.push(...flattenTree(node.children, level + 1, node.id));
      }
    });
    
    return result;
  }, [expandedNodes]);

  const flatNodes = useMemo(() => flattenTree(data), [data, flattenTree]);
  

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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };


  const scrollNodeIntoView = useCallback((nodeId: string) => {
    const nodeIndex = flatNodes.findIndex(n => n.id === nodeId);
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
  }, [flatNodes, itemHeight, scrollTop, height]);

  const focusNode = useCallback((nodeId: string) => {
    setFocusedNodeId(nodeId);
    scrollNodeIntoView(nodeId);
  }, [scrollNodeIntoView]);

  const navigateToNode = useCallback((direction: 'up' | 'down' | 'first' | 'last' | 'pageUp' | 'pageDown') => {
    const currentIndex = focusedNodeId ? flatNodes.findIndex(n => n.id === focusedNodeId) : -1;
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
        targetIndex = Math.min(flatNodes.length - 1, currentIndex + Math.floor(height / itemHeight));
        break;
    }
    
    if (targetIndex !== currentIndex && targetIndex >= 0 && targetIndex < flatNodes.length) {
      const targetNode = flatNodes[targetIndex];
      if (targetNode) {
        setFocusedNodeId(targetNode.id);
        // Also update selection when navigating with keyboard
        if (controlledSelectedNodeId === undefined) {
          setInternalSelectedNodeId(targetNode.id);
        }
        scrollNodeIntoView(targetNode.id);
        onNodeClick?.(targetNode);
      }
    }
  }, [focusedNodeId, flatNodes, scrollNodeIntoView, height, itemHeight, controlledSelectedNodeId, onNodeClick]);

  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
    // If no node is focused, set focus to the first node
    let currentFocusedId = focusedNodeId;
    if (!currentFocusedId && flatNodes.length > 0) {
      currentFocusedId = flatNodes[0].id;
      setFocusedNodeId(currentFocusedId);
    }
    
    const node = flatNodes.find(n => n.id === currentFocusedId);
    if (!node) return;
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        // Enter selects the node
        if (controlledSelectedNodeId === undefined) {
          setInternalSelectedNodeId(node.id);
        }
        // For nodes with children, also toggle expansion
        if (node.children && node.children.length > 0) {
          const newExpanded = new Set(expandedNodes);
          if (newExpanded.has(node.id)) {
            newExpanded.delete(node.id);
            onNodeCollapse?.(node);
          } else {
            newExpanded.add(node.id);
            onNodeExpand?.(node);
          }
          setExpandedNodes(newExpanded);
        }
        onNodeClick?.(node);
        break;
      case ' ':
        e.preventDefault();
        // Space only selects, doesn't expand
        if (controlledSelectedNodeId === undefined) {
          setInternalSelectedNodeId(node.id);
        }
        onNodeClick?.(node);
        break;
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
        if (node.children && node.children.length > 0) {
          if (!expandedNodes.has(node.id)) {
            // Expand the folder
            const newExpanded = new Set(expandedNodes);
            newExpanded.add(node.id);
            setExpandedNodes(newExpanded);
            onNodeExpand?.(node);
          } else {
            // If already expanded, move to first child
            const nodeIndex = flatNodes.findIndex(n => n.id === node.id);
            if (nodeIndex < flatNodes.length - 1) {
              const nextNode = flatNodes[nodeIndex + 1];
              if (nextNode && nextNode.parentId === node.id) {
                setFocusedNodeId(nextNode.id);
                if (controlledSelectedNodeId === undefined) {
                  setInternalSelectedNodeId(nextNode.id);
                }
                scrollNodeIntoView(nextNode.id);
                onNodeClick?.(nextNode);
              }
            }
          }
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (node.children && node.children.length > 0 && expandedNodes.has(node.id)) {
          // Collapse the folder
          const newExpanded = new Set(expandedNodes);
          newExpanded.delete(node.id);
          setExpandedNodes(newExpanded);
          onNodeCollapse?.(node);
        } else if (node.parentId) {
          // Move to parent
          const parent = flatNodes.find(n => n.id === node.parentId);
          if (parent) {
            setFocusedNodeId(parent.id);
            if (controlledSelectedNodeId === undefined) {
              setInternalSelectedNodeId(parent.id);
            }
            scrollNodeIntoView(parent.id);
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
    }
  };

  // Initialize focused node on mount if not set
  useEffect(() => {
    if (!focusedNodeId && flatNodes.length > 0) {
      setFocusedNodeId(flatNodes[0].id);
    }
  }, [focusedNodeId, flatNodes]);

  return (
    <div 
      className={`${styles.container} ${className || ''}`}
      ref={containerRef}
      style={{ height }}
      onScroll={handleScroll}
      onFocus={() => {
        setIsTreeFocused(true);
        // Initialize focused node if not set
        if (!focusedNodeId && flatNodes.length > 0) {
          const initialFocusId = selectedNodeId || flatNodes[0].id;
          setFocusedNodeId(initialFocusId);
        }
      }}
      onBlur={() => setIsTreeFocused(false)}
      onKeyDown={handleContainerKeyDown}
      role="tree"
      aria-label="File tree"
      tabIndex={0}
    >
      <div 
        className={styles.content}
        style={{ height: totalHeight }}
        ref={contentRef}
      >
        <div 
          className={styles.virtualList}
          style={{ transform: `translateY(${offsetY}px)` }}
        >
          {visibleNodes.map((node) => {
            const isExpanded = expandedNodes.has(node.id);
            const isSelected = selectedNodeId === node.id;
            const isFocused = focusedNodeId === node.id && isTreeFocused;
            const Icon = resolveIcon(node.type, node);
            const hasChildren = node.children && node.children.length > 0;
            
            return (
              <div
                key={node.id}
                ref={(el) => {
                  if (el) nodeRefs.current.set(node.id, el);
                  else nodeRefs.current.delete(node.id);
                }}
                className={`${styles.node} ${isSelected ? styles.selected : ''} ${isFocused ? styles.focused : ''}`}
                style={{ 
                  paddingLeft: `calc(${node.level * 20}px + var(--spacing-small10))`,
                  height: itemHeight
                }}
                onClick={() => {
                  // Set selection and focus
                  if (controlledSelectedNodeId === undefined) {
                    setInternalSelectedNodeId(node.id);
                  }
                  setFocusedNodeId(node.id);
                  onNodeClick?.(node);
                  // Focus the container to enable keyboard navigation
                  containerRef.current?.focus();
                }}
                role="treeitem"
                aria-expanded={hasChildren ? isExpanded : undefined}
                aria-selected={isSelected}
                aria-level={node.level + 1}
                tabIndex={-1}
              >
                {hasChildren && (
                  <ChevronRightIcon 
                    className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}
                    size={16}
                    aria-hidden="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newExpanded = new Set(expandedNodes);
                      if (newExpanded.has(node.id)) {
                        newExpanded.delete(node.id);
                        onNodeCollapse?.(node);
                      } else {
                        newExpanded.add(node.id);
                        onNodeExpand?.(node);
                      }
                      setExpandedNodes(newExpanded);
                    }}
                  />
                )}
                {Icon && (
                  <Icon 
                    className={styles.icon}
                    size={16}
                    aria-hidden="true"
                  />
                )}
                <span className={styles.label}>{node.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};