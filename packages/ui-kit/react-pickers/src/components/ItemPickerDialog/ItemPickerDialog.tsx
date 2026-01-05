import { useState, useCallback, useEffect, useMemo, useRef, type KeyboardEvent, type ChangeEvent, type ReactNode } from 'react';
import { Dialog, Button, IconButton, TreeView, Input, Spinner, type TreeNode } from '@ui-kit/react';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { FolderPlusIcon } from '@ui-kit/icons/FolderPlusIcon';
import { ArrowLeftIcon } from '@ui-kit/icons/ArrowLeftIcon';
import { HomeIcon } from '@ui-kit/icons/HomeIcon';
import type { ItemProvider, ItemFilter, Item } from '../../providers/types';
import styles from './ItemPickerDialog.module.css';

// Special IDs
const PLACEHOLDER_ID = '__placeholder__';
const PARENT_NODE_ID = '..';
const PENDING_FOLDER_ID = '__pending_new_folder__';

/** Folder entry returned by directory listing */
export interface FolderEntry {
  /** Folder name */
  name: string;
  /** Full path to the folder */
  path: string;
  /** Whether this folder has subfolders */
  hasChildren?: boolean;
  /** Item type (for file support) */
  type?: 'file' | 'folder';
}

export interface ItemPickerDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback when a folder is selected */
  onSelect: (path: string) => void;
  /**
   * Item provider for data source (recommended).
   * When provided, onListDirectory and onCreateFolder are not needed.
   */
  provider?: ItemProvider;
  /**
   * Filter criteria for items (only used with provider).
   * Use to filter by type (file/folder) or extensions.
   */
  filter?: ItemFilter;
  /**
   * Callback to list directory contents - must return list of subfolders.
   * @deprecated Use `provider` prop instead for new implementations.
   */
  onListDirectory?: (path: string) => Promise<FolderEntry[]>;
  /**
   * Callback to create a new folder - returns the created folder entry or null if failed.
   * @deprecated Use `provider` prop instead for new implementations.
   */
  onCreateFolder?: (parentPath: string, name: string) => Promise<FolderEntry | null>;
  /** Initial path to display */
  initialPath?: string;
  /** Root paths to show (e.g., home directory, drives) */
  rootPaths?: FolderEntry[];
  /** Dialog title */
  title?: string;
  /** Select button label */
  selectLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** New folder button label */
  newFolderLabel?: string;
}

/**
 * ItemPickerDialog component
 *
 * A dialog for browsing and selecting files/folders, similar to Windows Explorer's file picker.
 *
 * Features:
 * - Tree view navigation of items
 * - Breadcrumb-style path display
 * - Navigation to parent directory
 * - Home/root quick access
 * - Loading states while fetching directories
 * - Filter by type (files, folders) or extension
 */
export function ItemPickerDialog({
  open,
  onClose,
  onSelect,
  provider,
  filter,
  onListDirectory,
  onCreateFolder,
  initialPath = '',
  rootPaths = [],
  title = 'Select Item',
  selectLabel = 'Select',
  cancelLabel = 'Cancel',
  newFolderLabel = 'New Folder',
}: ItemPickerDialogProps) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pathInput, setPathInput] = useState(initialPath);

  // New folder inline editing state
  const [pendingFolder, setPendingFolder] = useState<{ parentPath: string; name: string } | null>(null);
  const pendingInputRef = useRef<HTMLInputElement>(null);

  // Convert Item to FolderEntry for internal use
  const itemToFolderEntry = useCallback((item: Item): FolderEntry => ({
    name: item.name,
    path: item.path,
    hasChildren: item.type === 'folder' ? item.hasChildren : false,
    type: item.type,
  }), []);

  // Create adapter callbacks from provider
  const listDirectoryAdapter = useCallback(async (path: string): Promise<FolderEntry[]> => {
    if (provider) {
      const result = await provider.listItems(path, { filter });
      return result.items.map(itemToFolderEntry);
    }
    if (onListDirectory) {
      return onListDirectory(path);
    }
    return [];
  }, [provider, filter, onListDirectory, itemToFolderEntry]);

  const createFolderAdapter = useCallback(async (parentPath: string, name: string): Promise<FolderEntry | null> => {
    if (provider?.createFolder) {
      const item = await provider.createFolder(parentPath, name);
      return item ? itemToFolderEntry(item) : null;
    }
    if (onCreateFolder) {
      return onCreateFolder(parentPath, name);
    }
    return null;
  }, [provider, onCreateFolder, itemToFolderEntry]);

  // Determine if folder creation is available
  const canCreateFolder = !!(provider?.createFolder || onCreateFolder);

  // Get root paths from provider or props
  const getRootPathsAdapter = useCallback(async (): Promise<FolderEntry[]> => {
    if (provider?.getRoots) {
      const roots = await provider.getRoots();
      return roots.map(itemToFolderEntry);
    }
    return rootPaths;
  }, [provider, rootPaths, itemToFolderEntry]);

  // Use refs to avoid dependency issues in useEffect
  const listDirectoryRef = useRef(listDirectoryAdapter);
  const rootPathsRef = useRef(rootPaths);
  const getRootPathsRef = useRef(getRootPathsAdapter);
  listDirectoryRef.current = listDirectoryAdapter;
  rootPathsRef.current = rootPaths;
  getRootPathsRef.current = getRootPathsAdapter;

  // Convert FolderEntry to TreeNode
  // Only add placeholder child if hasChildren is true or unknown (undefined)
  // If hasChildren is explicitly false, don't show a chevron
  const folderToTreeNode = useCallback((entry: FolderEntry): TreeNode => ({
    id: entry.path,
    label: entry.name,
    type: entry.type || 'folder',
    children: entry.type === 'file' || entry.hasChildren === false
      ? undefined
      : [{ id: `${entry.path}/${PLACEHOLDER_ID}`, label: 'Loading...', type: 'placeholder' }],
    data: entry,
  }), []);

  // Load children of a path and set them as root nodes of the tree
  const loadCurrentDirectory = useCallback(async (path: string) => {
    // Clear tree immediately for instant feedback
    setTreeData([]);
    setExpandedIds([]);
    setIsLoading(true);
    setError(null);

    try {
      // For empty path, try to get roots from provider or use rootPaths
      if (!path) {
        const roots = await getRootPathsRef.current();
        if (roots.length > 0) {
          setTreeData(roots.map(folderToTreeNode));
          return;
        }
      }

      const entries = await listDirectoryRef.current(path);
      setTreeData(entries.map(folderToTreeNode));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load directory');
    } finally {
      setIsLoading(false);
    }
  }, [folderToTreeNode]);

  // Load children for an expanded node (doesn't change root)
  const loadNodeChildren = useCallback(async (path: string) => {
    try {
      const entries = await listDirectoryRef.current(path);
      setTreeData(prevData => {
        const updateNodeChildren = (nodes: TreeNode[]): TreeNode[] => {
          return nodes.map(node => {
            if (node.id === path) {
              return {
                ...node,
                // If no children, set undefined to hide chevron
                children: entries.length > 0
                  ? entries.map(entry => folderToTreeNode(entry))
                  : undefined,
              };
            }
            if (node.children && node.children.length > 0) {
              return {
                ...node,
                children: updateNodeChildren(node.children),
              };
            }
            return node;
          });
        };
        return updateNodeChildren(prevData);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load directory');
    }
  }, [folderToTreeNode]);

  // Navigate to a new path (changes root nodes)
  const navigateTo = useCallback((path: string) => {
    setCurrentPath(path);
    setPathInput(path);
    setSelectedPath(null);
    loadCurrentDirectory(path);
  }, [loadCurrentDirectory]);

  // Initial load - only run when dialog opens
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (open && !hasInitialized.current) {
      hasInitialized.current = true;

      const initialize = async () => {
        // If no initial path provided, try to get home directory from provider
        let startPath = initialPath;
        if (!startPath && provider?.getRoots) {
          try {
            const roots = await provider.getRoots();
            // First root is typically home directory
            if (roots.length > 0) {
              startPath = roots[0].path;
            }
          } catch {
            // Ignore errors, fall back to empty path
          }
        }

        setCurrentPath(startPath);
        setPathInput(startPath);
        setSelectedPath(null);
        setExpandedIds([]);
        loadCurrentDirectory(startPath);
      };

      initialize();
    } else if (!open) {
      hasInitialized.current = false;
    }
  }, [open, initialPath, loadCurrentDirectory, provider]);

  // Handle node expansion (peek at children without navigating)
  const handleNodeExpand = useCallback((node: TreeNode) => {
    // Expand immediately for instant feedback
    setExpandedIds(prev => [...prev, node.id]);

    // Load children if they haven't been loaded yet (still have placeholder)
    const hasOnlyPlaceholder = node.children?.length === 1 &&
      node.children[0]?.id.endsWith(PLACEHOLDER_ID);
    if (hasOnlyPlaceholder) {
      loadNodeChildren(node.id);
    }
  }, [loadNodeChildren]);

  // Handle node collapse
  const handleNodeCollapse = useCallback((node: TreeNode) => {
    setExpandedIds(prev => prev.filter(id => id !== node.id));
  }, []);

  // Handle node selection
  const handleNodeSelect = useCallback((id: string | null, node: TreeNode | null) => {
    // Don't select ".." - just clear selection
    if (id === PARENT_NODE_ID || !id || !node) {
      setSelectedPath(null);
      return;
    }
    setSelectedPath(id);
    setPathInput(id);
  }, []);

  // Track last click for double-click detection
  const lastClickRef = useRef<{ id: string; time: number } | null>(null);

  // Handle click on node - single click selects, double click navigates into folder
  const handleNodeClick = useCallback((node: TreeNode) => {
    const now = Date.now();
    const lastClick = lastClickRef.current;

    // Check for double-click (same node within 300ms)
    if (lastClick && lastClick.id === node.id && now - lastClick.time < 300) {
      // Double-click on ".." navigates up
      if (node.id === PARENT_NODE_ID) {
        const parts = currentPath.split('/').filter(Boolean);
        if (parts.length > 1) {
          parts.pop();
          navigateTo('/' + parts.join('/'));
        } else {
          navigateTo('');
        }
      } else {
        // Double-click: navigate into this folder (make it the current path)
        navigateTo(node.id);
      }
      lastClickRef.current = null;
    } else {
      // Single click: select the node (but not for ".." - clear selection instead)
      if (node.id === PARENT_NODE_ID) {
        setSelectedPath(null);
      } else {
        setSelectedPath(node.id);
        setPathInput(node.id);
      }
      lastClickRef.current = { id: node.id, time: now };
    }
  }, [navigateTo, currentPath]);

  // Navigate to home/root
  const navigateHome = useCallback(() => {
    navigateTo('');
  }, [navigateTo]);

  // Handle path input change
  const handlePathInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPathInput(e.target.value);
  }, []);

  // Handle path input submit
  const handlePathInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigateTo(pathInput);
    }
  }, [pathInput, navigateTo]);

  // Handle select button click
  const handleSelect = useCallback(() => {
    const pathToSelect = selectedPath || pathInput || currentPath;
    if (pathToSelect) {
      onSelect(pathToSelect);
      onClose();
    }
  }, [selectedPath, pathInput, currentPath, onSelect, onClose]);

  // Start creating a new folder - insert pending node in tree
  const handleNewFolder = useCallback(() => {
    if (!canCreateFolder) return;

    // Determine parent path: selected node or current path
    const parentPath = selectedPath || currentPath;
    setPendingFolder({ parentPath, name: '' });

    // Expand the parent if it's in the tree and not already expanded
    if (parentPath && !expandedIds.includes(parentPath)) {
      setExpandedIds(prev => [...prev, parentPath]);
    }

    // Focus will be set by effect when input renders
  }, [canCreateFolder, selectedPath, currentPath, expandedIds]);

  // Confirm new folder creation
  const handlePendingFolderConfirm = useCallback(async () => {
    if (!canCreateFolder || !pendingFolder || !pendingFolder.name.trim()) {
      setPendingFolder(null);
      return;
    }

    const { parentPath, name } = pendingFolder;

    try {
      const createdFolder = await createFolderAdapter(parentPath, name.trim());
      if (createdFolder) {
        // Add the new folder to the tree under its parent
        setTreeData(prevData => {
          const addChildToParent = (nodes: TreeNode[]): TreeNode[] => {
            // If parent is current root (empty parent path), add to root level
            if (!parentPath) {
              return [...nodes, folderToTreeNode(createdFolder)];
            }

            return nodes.map(node => {
              if (node.id === parentPath) {
                const existingChildren = node.children?.filter(
                  c => !c.id.endsWith(PLACEHOLDER_ID)
                ) || [];
                return {
                  ...node,
                  children: [...existingChildren, folderToTreeNode(createdFolder)],
                };
              }
              if (node.children && node.children.length > 0) {
                return {
                  ...node,
                  children: addChildToParent(node.children),
                };
              }
              return node;
            });
          };
          return addChildToParent(prevData);
        });

        // Select the new folder
        setSelectedPath(createdFolder.path);
        setPathInput(createdFolder.path);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setPendingFolder(null);
    }
  }, [canCreateFolder, createFolderAdapter, pendingFolder, folderToTreeNode]);

  // Cancel new folder creation and return focus to selected item
  const handlePendingFolderCancel = useCallback(() => {
    setPendingFolder(null);
    // Focus returns to tree naturally
  }, []);

  // Handle pending folder input key events
  const handlePendingKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handlePendingFolderConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation(); // Prevent dialog from closing
      handlePendingFolderCancel();
    }
  }, [handlePendingFolderConfirm, handlePendingFolderCancel]);

  // Handle pending folder input change
  const handlePendingChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (pendingFolder) {
      setPendingFolder({ ...pendingFolder, name: e.target.value });
    }
  }, [pendingFolder]);

  // Focus the pending input when it appears
  useEffect(() => {
    if (pendingFolder && pendingInputRef.current) {
      // Use setTimeout to ensure the input is rendered
      setTimeout(() => {
        pendingInputRef.current?.focus();
      }, 0);
    }
  }, [pendingFolder]);

  // Build tree data with ".." at the top when not at root, and pending folder node
  const treeDataWithParent = useMemo(() => {
    let nodes = [...treeData];

    // Insert pending folder node if creating
    if (pendingFolder) {
      const pendingInputElement: ReactNode = (
        <input
          ref={pendingInputRef}
          type="text"
          value={pendingFolder.name}
          onChange={handlePendingChange}
          onKeyDown={handlePendingKeyDown}
          onBlur={handlePendingFolderCancel}
          placeholder="New folder name"
          className={styles.inlineInput}
          onClick={(e) => e.stopPropagation()}
        />
      );

      const pendingNode: TreeNode = {
        id: PENDING_FOLDER_ID,
        label: pendingInputElement,
        type: 'pending',
        data: { isPending: true },
      };

      if (pendingFolder.parentPath) {
        // Insert as child of parent - recursively find and add
        const insertPendingIntoParent = (nodeList: TreeNode[]): TreeNode[] => {
          return nodeList.map(node => {
            if (node.id === pendingFolder.parentPath) {
              const existingChildren = node.children?.filter(
                c => !c.id.endsWith(PLACEHOLDER_ID)
              ) || [];
              return {
                ...node,
                children: [pendingNode, ...existingChildren],
              };
            }
            if (node.children && node.children.length > 0) {
              return {
                ...node,
                children: insertPendingIntoParent(node.children),
              };
            }
            return node;
          });
        };
        nodes = insertPendingIntoParent(nodes);
      } else {
        // Insert at root level (first position)
        nodes = [pendingNode, ...nodes];
      }
    }

    // Add ".." node at top if not at root
    if (currentPath) {
      const parentNode: TreeNode = {
        id: PARENT_NODE_ID,
        label: '..',
        type: 'parent',
      };
      nodes = [parentNode, ...nodes];
    }

    return nodes;
  }, [currentPath, treeData, pendingFolder, handlePendingChange, handlePendingKeyDown, handlePendingFolderCancel]);

  // Icon resolver for tree nodes
  const iconResolver = useCallback((type: string) => {
    if (type === 'parent') {
      return <ArrowLeftIcon size={16} />;
    }
    if (type === 'pending') {
      return <FolderPlusIcon size={16} />;
    }
    if (type === 'file') {
      return <FileIcon size={16} />;
    }
    return <FolderIcon size={16} />;
  }, []);

  // Current path breadcrumbs
  const breadcrumbs = useMemo(() => {
    if (!currentPath) return [];
    const parts = currentPath.split('/').filter(Boolean);
    const crumbs: { label: string; path: string }[] = [];

    parts.forEach((part, index) => {
      const path = '/' + parts.slice(0, index + 1).join('/');
      crumbs.push({ label: part, path });
    });

    return crumbs;
  }, [currentPath]);

  const footer = (
    <div className={styles.footer}>
      {canCreateFolder && (
        <Button
          variant="ghost"
          icon={<FolderPlusIcon />}
          onClick={handleNewFolder}
          disabled={!!pendingFolder}
        >
          {newFolderLabel}
        </Button>
      )}
      <div className={styles.footerSpacer} />
      <Button variant="ghost" onClick={onClose}>
        {cancelLabel}
      </Button>
      <Button
        variant="primary"
        onClick={handleSelect}
        disabled={!selectedPath && !pathInput && !currentPath}
      >
        {selectLabel}
      </Button>
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      height="60vh"
      footer={footer}
      closeOnEscape={!pendingFolder}
    >
      <div className={styles.container}>
        {/* Navigation toolbar */}
        <div className={styles.toolbar}>
          <IconButton
            variant="ghost"
            icon={<HomeIcon />}
            onClick={navigateHome}
            aria-label="Go to root"
          />
          <div className={styles.pathInputWrapper}>
            <Input
              value={pathInput}
              onChange={handlePathInputChange}
              onKeyDown={handlePathInputKeyDown}
              className={styles.pathInput}
            />
          </div>
        </div>

        {/* Breadcrumbs - always visible */}
        <div className={styles.breadcrumbs}>
          <button
            className={styles.breadcrumbLink}
            onClick={navigateHome}
          >
            /
          </button>
          {breadcrumbs.map((crumb) => (
            <span key={crumb.path} className={styles.breadcrumbItem}>
              <button
                className={styles.breadcrumbLink}
                onClick={() => navigateTo(crumb.path)}
              >
                {crumb.label}
              </button>
              <span className={styles.breadcrumbSeparator}>/</span>
            </span>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {/* Tree view */}
        <div className={styles.treeContainer}>
          {isLoading && treeData.length === 0 ? (
            <div className={styles.loading}>
              <Spinner size="md" />
              <span>Loading folders...</span>
            </div>
          ) : treeDataWithParent.length === 0 ? (
            <div className={styles.empty}>
              No folders found
            </div>
          ) : (
            <TreeView
              data={treeDataWithParent}
              itemHeight={32}
              selectable
              selectedId={selectedPath}
              onSelect={handleNodeSelect}
              onNodeClick={handleNodeClick}
              onBackgroundClick={() => setSelectedPath(null)}
              expandedIds={expandedIds}
              onNodeExpand={handleNodeExpand}
              onNodeCollapse={handleNodeCollapse}
              iconResolver={iconResolver}
              aria-label="Folder tree"
            />
          )}
        </div>
      </div>
    </Dialog>
  );
}

ItemPickerDialog.displayName = 'ItemPickerDialog';
