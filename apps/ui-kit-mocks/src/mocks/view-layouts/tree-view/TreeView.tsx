import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronRightIcon, FolderIcon, FileIcon } from '@claude-flow/ui-kit-icons';
import styles from './TreeView.module.css';

export interface TreeNode {
  id: string;
  label: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
  isExpanded?: boolean;
  level?: number;
  parentId?: string | null;
}

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
}

interface FlatNode extends TreeNode {
  level: number;
  parentId: string | null;
}

export const TreeView: React.FC<TreeViewProps> = ({
  data,
  height = 400,
  itemHeight = 32,
  onNodeClick,
  onNodeExpand,
  onNodeCollapse,
  selectedNodeId = null,
  className,
  expandedNodes: controlledExpandedNodes,
  onExpandedNodesChange
}) => {
  const [internalExpandedNodes, setInternalExpandedNodes] = useState<Set<string>>(new Set());
  const expandedNodes = controlledExpandedNodes ?? internalExpandedNodes;
  
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
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Flatten the tree structure for virtualization
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
  
  // Create a map for quick parent lookup
  const nodeParentMap = useMemo(() => {
    const map = new Map<string, string | null>();
    flatNodes.forEach(node => {
      map.set(node.id, node.parentId);
    });
    return map;
  }, [flatNodes]);

  // Calculate visible range
  const visibleStartIndex = Math.floor(scrollTop / itemHeight);
  const visibleEndIndex = Math.min(
    Math.ceil((scrollTop + height) / itemHeight),
    flatNodes.length
  );
  
  // Add buffer for smoother scrolling
  const bufferSize = 5;
  const startIndex = Math.max(0, visibleStartIndex - bufferSize);
  const endIndex = Math.min(flatNodes.length, visibleEndIndex + bufferSize);
  
  const visibleNodes = flatNodes.slice(startIndex, endIndex);
  const totalHeight = flatNodes.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const toggleNode = (node: FlatNode) => {
    if (node.type === 'folder') {
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
  };

  // Scroll a node into view
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

  // Focus a specific node and select it
  const focusNode = useCallback((nodeId: string) => {
    setFocusedNodeId(nodeId);
    scrollNodeIntoView(nodeId);
    // Update selection to follow focus
    const node = flatNodes.find(n => n.id === nodeId);
    if (node) {
      onNodeClick?.(node);
    }
    // Focus the actual DOM element
    setTimeout(() => {
      const nodeElement = nodeRefs.current.get(nodeId);
      nodeElement?.focus();
    }, 0);
  }, [scrollNodeIntoView, flatNodes, onNodeClick]);

  // Navigate to adjacent nodes
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
    
    if (targetIndex >= 0 && targetIndex < flatNodes.length) {
      const targetNode = flatNodes[targetIndex];
      focusNode(targetNode.id);
    }
  }, [focusedNodeId, flatNodes, focusNode, height, itemHeight]);

  const handleKeyDown = (e: React.KeyboardEvent, node: FlatNode) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        toggleNode(node);
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
        if (node.type === 'folder' && !expandedNodes.has(node.id)) {
          const newExpanded = new Set(expandedNodes);
          newExpanded.add(node.id);
          setExpandedNodes(newExpanded);
          onNodeExpand?.(node);
        } else if (node.type === 'folder' && expandedNodes.has(node.id)) {
          // If already expanded, move to first child if exists
          const nodeIndex = flatNodes.findIndex(n => n.id === node.id);
          if (nodeIndex < flatNodes.length - 1) {
            const nextNode = flatNodes[nodeIndex + 1];
            if (nextNode.parentId === node.id) {
              focusNode(nextNode.id);
            }
          }
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (node.type === 'folder' && expandedNodes.has(node.id)) {
          // Collapse if expanded
          const newExpanded = new Set(expandedNodes);
          newExpanded.delete(node.id);
          setExpandedNodes(newExpanded);
          onNodeCollapse?.(node);
        } else if (node.parentId) {
          // Move to parent
          const parent = flatNodes.find(n => n.id === node.parentId);
          if (parent) {
            focusNode(parent.id);
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

  // Set initial focus
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
      role="tree"
      aria-label="File tree"
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
            const isFocused = focusedNodeId === node.id;
            const Icon = node.type === 'folder' ? FolderIcon : FileIcon;
            
            return (
              <div
                key={node.id}
                ref={(el) => {
                  if (el) nodeRefs.current.set(node.id, el);
                  else nodeRefs.current.delete(node.id);
                }}
                className={`${styles.node} ${isSelected ? styles.selected : ''}`}
                style={{ 
                  paddingLeft: `calc(${node.level * 20}px + var(--spacing-small10))`,
                  height: itemHeight
                }}
                onClick={() => {
                  toggleNode(node);
                  focusNode(node.id);
                }}
                onFocus={() => {
                  setFocusedNodeId(node.id);
                  // Update selection when focused
                  onNodeClick?.(node);
                }}
                onKeyDown={(e) => handleKeyDown(e, node)}
                role="treeitem"
                aria-expanded={node.type === 'folder' ? isExpanded : undefined}
                aria-selected={isSelected}
                aria-level={node.level + 1}
                tabIndex={isFocused ? 0 : -1}
              >
                {node.type === 'folder' && (
                  <ChevronRightIcon 
                    className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}
                    aria-hidden="true"
                  />
                )}
                <Icon 
                  className={styles.icon}
                  aria-hidden="true"
                />
                <span className={styles.label}>{node.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};