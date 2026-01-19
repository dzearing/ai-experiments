/**
 * FileBrowser component - TreeView-based file browser for workspace exploration.
 * Loads directory contents lazily from the server.
 */

import { useState, useCallback, useEffect } from 'react';
import { TreeView } from '@ui-kit/react';
import type { TreeNode } from '@ui-kit/react';
import { fileIconResolver } from '../utils/fileIcons';
import styles from './FileBrowser.module.css';

/**
 * Directory entry returned from the server.
 */
interface DirectoryEntry {
  name: string;
  type: 'file' | 'directory';
  size?: number;
}

export interface FileBrowserProps {
  /** Root path to start browsing from (defaults to ".") */
  rootPath?: string;
  /** Callback when a file is selected */
  onFileSelect: (path: string) => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Transforms server directory entries to TreeView nodes.
 *
 * @param entries - Directory entries from server
 * @param parentPath - Parent directory path
 * @returns TreeNode array for TreeView
 */
function entriesToTreeNodes(entries: DirectoryEntry[], parentPath: string): TreeNode[] {
  return entries.map((entry) => {
    const fullPath = parentPath === '.' ? entry.name : `${parentPath}/${entry.name}`;

    return {
      id: fullPath,
      label: entry.name,
      type: entry.type,
      // For directories, set children to empty array to indicate expandable
      // The actual children will be loaded lazily on expand
      children: entry.type === 'directory' ? [] : undefined,
      data: { size: entry.size },
    };
  });
}

/**
 * FileBrowser displays workspace files in a TreeView with lazy directory loading.
 *
 * @example
 * ```tsx
 * <FileBrowser
 *   onFileSelect={(path) => console.log('Selected:', path)}
 * />
 * ```
 */
export function FileBrowser({ rootPath = '.', onFileSelect, className }: FileBrowserProps) {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [loadingDirs, setLoadingDirs] = useState<Set<string>>(new Set());

  /**
   * Loads directory contents from the server.
   */
  const loadDirectory = useCallback(async (path: string): Promise<DirectoryEntry[]> => {
    const response = await fetch(`/api/files/list?path=${encodeURIComponent(path)}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      throw new Error(errorData.error || `Failed to load directory: ${response.status}`);
    }

    return response.json();
  }, []);

  /**
   * Loads the root directory on mount.
   */
  useEffect(() => {
    async function loadRoot() {
      setIsLoading(true);
      setError(null);

      try {
        const entries = await loadDirectory(rootPath);
        const nodes = entriesToTreeNodes(entries, rootPath);

        setTreeData(nodes);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load directory';

        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadRoot();
  }, [rootPath, loadDirectory]);

  /**
   * Handles node expansion - loads children lazily if needed.
   */
  const handleNodeExpand = useCallback(
    async (node: TreeNode) => {
      // Skip if not a directory or already has loaded children
      if (node.type !== 'directory') return;

      // Check if children are already loaded (more than empty array placeholder)
      const existingNode = findNodeById(treeData, node.id);

      if (existingNode?.children && existingNode.children.length > 0) {
        return;
      }

      // Mark as loading
      setLoadingDirs((prev) => new Set(prev).add(node.id));

      try {
        const entries = await loadDirectory(node.id);
        const children = entriesToTreeNodes(entries, node.id);

        // Update tree data with loaded children
        setTreeData((prev) => updateNodeChildren(prev, node.id, children));
      } catch (err) {
        console.error('Failed to load directory:', node.id, err);
      } finally {
        setLoadingDirs((prev) => {
          const next = new Set(prev);

          next.delete(node.id);

          return next;
        });
      }
    },
    [treeData, loadDirectory]
  );

  /**
   * Handles expansion state changes.
   */
  const handleExpandedChange = useCallback((ids: string[]) => {
    setExpandedIds(ids);
  }, []);

  /**
   * Handles node selection - triggers onFileSelect for files.
   */
  const handleNodeClick = useCallback(
    (node: TreeNode) => {
      if (node.type === 'file' || node.type !== 'directory') {
        onFileSelect(node.id);
      }
    },
    [onFileSelect]
  );

  if (isLoading) {
    return (
      <div className={`${styles.fileBrowser} ${className || ''}`}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.fileBrowser} ${className || ''}`}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={`${styles.fileBrowser} ${className || ''}`}>
      <TreeView
        data={treeData}
        selectable={true}
        expandedIds={expandedIds}
        onExpandedChange={handleExpandedChange}
        onNodeExpand={handleNodeExpand}
        onNodeClick={handleNodeClick}
        iconResolver={fileIconResolver}
        aria-label="File browser"
      />
      {loadingDirs.size > 0 && (
        <div className={styles.loadingOverlay}>Loading...</div>
      )}
    </div>
  );
}

/**
 * Finds a node by ID in the tree.
 */
function findNodeById(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);

      if (found) return found;
    }
  }

  return null;
}

/**
 * Updates a node's children in the tree immutably.
 */
function updateNodeChildren(nodes: TreeNode[], targetId: string, children: TreeNode[]): TreeNode[] {
  return nodes.map((node) => {
    if (node.id === targetId) {
      return { ...node, children };
    }
    if (node.children) {
      return { ...node, children: updateNodeChildren(node.children, targetId, children) };
    }

    return node;
  });
}
