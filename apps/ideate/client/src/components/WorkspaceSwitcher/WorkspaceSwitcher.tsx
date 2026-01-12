import { useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from '@ui-kit/router';
import { Button, Menu, type MenuItemType } from '@ui-kit/react';
import { HomeIcon } from '@ui-kit/icons/HomeIcon';
import { UsersIcon } from '@ui-kit/icons/UsersIcon';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { GridViewIcon } from '@ui-kit/icons/GridViewIcon';
import { useWorkspaces } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import styles from './WorkspaceSwitcher.module.css';

// Checkmark character for selected item (Menu doesn't support iconAfter)
const SELECTED_INDICATOR = '✓';

// Special value for "All workspaces" filter
const ALL_WORKSPACES_VALUE = 'all';

type Pivot = 'topics' | 'ideas' | 'documents';

/**
 * Extracts the current pivot (topics, ideas, documents) from the pathname.
 * Returns 'topics' as default if not found.
 */
function getCurrentPivot(pathname: string): Pivot {
  // Match /:workspaceId/:pivot patterns
  const match = pathname.match(/^\/[^/]+\/(topics|ideas|documents)/);

  if (match) {
    return match[1] as Pivot;
  }

  // Default to topics
  return 'topics';
}

/**
 * Extracts the current workspace ID from the pathname.
 * Returns null if not on a workspace-scoped route.
 */
function getCurrentWorkspaceIdFromPath(pathname: string): string | null {
  // Match /:workspaceId/:pivot patterns
  const match = pathname.match(/^\/([^/]+)\/(topics|ideas|documents)/);

  return match ? match[1] : null;
}

const MANAGE_WORKSPACES_VALUE = '__manage__';

export function WorkspaceSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspaces();

  // Get current workspace ID from URL (for highlighting)
  const currentWorkspaceIdFromPath = getCurrentWorkspaceIdFromPath(location.pathname);

  const menuItems = useMemo(() => {
    const items: MenuItemType[] = [];

    // Add "All workspaces" option at the top
    const isAllSelected = currentWorkspaceIdFromPath === ALL_WORKSPACES_VALUE;

    items.push({
      value: ALL_WORKSPACES_VALUE,
      label: 'All workspaces',
      icon: <GridViewIcon />,
      shortcut: isAllSelected ? SELECTED_INDICATOR : undefined,
    });

    items.push({ type: 'divider' });

    // Sort workspaces: personal first, then team workspaces alphabetically
    const sortedWorkspaces = [...workspaces].sort((a, b) => {
      if (a.type === 'personal' && b.type !== 'personal') return -1;
      if (a.type !== 'personal' && b.type === 'personal') return 1;

      return a.name.localeCompare(b.name);
    });

    // Add workspace items
    for (const workspace of sortedWorkspaces) {
      // Check if selected based on URL path (more reliable than context)
      const isSelected = currentWorkspaceIdFromPath === workspace.id;
      const icon = workspace.type === 'personal' ? <HomeIcon /> : <UsersIcon />;

      items.push({
        value: workspace.id,
        label: workspace.name,
        icon,
        shortcut: isSelected ? SELECTED_INDICATOR : undefined,
      });
    }

    // Add separator and manage option
    items.push({ type: 'divider' });

    items.push({
      value: MANAGE_WORKSPACES_VALUE,
      label: 'Manage workspaces...',
      icon: <GearIcon />,
    });

    return items;
  }, [workspaces, currentWorkspaceIdFromPath]);

  const handleSelect = useCallback((value: string) => {
    if (value === MANAGE_WORKSPACES_VALUE) {
      navigate('/workspaces');

      return;
    }

    // Get current pivot and navigate to same pivot in new workspace/all
    const currentPivot = getCurrentPivot(location.pathname);

    if (value === ALL_WORKSPACES_VALUE) {
      setCurrentWorkspace(null);
      navigate(`/all/${currentPivot}`);

      return;
    }

    const workspace = workspaces.find((w) => w.id === value);

    if (workspace) {
      setCurrentWorkspace(workspace);
      navigate(`/${workspace.id}/${currentPivot}`);
    }
  }, [workspaces, setCurrentWorkspace, navigate, location.pathname]);

  // Check if "All workspaces" is selected
  const isAllWorkspaces = currentWorkspaceIdFromPath === ALL_WORKSPACES_VALUE;

  // Determine the display based on URL path
  const displayWorkspace = currentWorkspaceIdFromPath && !isAllWorkspaces
    ? workspaces.find(w => w.id === currentWorkspaceIdFromPath)
    : currentWorkspace;

  // Get the display icon and name for the trigger button
  const getTriggerIcon = () => {
    if (isAllWorkspaces) {
      return <GridViewIcon />;
    }

    if (!displayWorkspace) {
      return <HomeIcon />;
    }

    return displayWorkspace.type === 'personal' ? <HomeIcon /> : <UsersIcon />;
  };

  const getTriggerLabel = () => {
    if (isAllWorkspaces) {
      return 'All workspaces';
    }

    if (displayWorkspace) {
      return displayWorkspace.name;
    }

    // Fallback: construct personal workspace label
    if (user) {
      return 'Personal';
    }

    return 'Select workspace';
  };

  const triggerIcon = getTriggerIcon();
  const triggerLabel = getTriggerLabel();

  return (
    <Menu
      items={menuItems}
      onSelect={handleSelect}
      position="bottom-start"
    >
      <Button
        variant="ghost"
        icon={triggerIcon}
        iconAfter={<ChevronDownIcon className={styles.chevron} />}
        className={styles.trigger}
      >
        {triggerLabel}
      </Button>
    </Menu>
  );
}
