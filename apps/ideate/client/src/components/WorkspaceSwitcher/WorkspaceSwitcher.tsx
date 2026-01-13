import { useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from '@ui-kit/router';
import { Button, Menu, type MenuItemType, type MenuItem } from '@ui-kit/react';
import { HomeIcon } from '@ui-kit/icons/HomeIcon';
import { UsersIcon } from '@ui-kit/icons/UsersIcon';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { GridViewIcon } from '@ui-kit/icons/GridViewIcon';
import { useWorkspaces } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { getCurrentPivot, getCurrentWorkspaceId } from '../../utils/workspacePath';
import styles from './WorkspaceSwitcher.module.css';

// Special value for "All workspaces" filter
const ALL_WORKSPACES_VALUE = 'all';

const MANAGE_WORKSPACES_VALUE = '__manage__';

export function WorkspaceSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspaces();

  // Get current workspace ID from URL (for highlighting)
  const currentWorkspaceIdFromUrl = getCurrentWorkspaceId(location.pathname);

  const menuItems = useMemo(() => {
    const items: MenuItemType[] = [];

    // Add "All workspaces" option at the top
    const isAllSelected = currentWorkspaceIdFromUrl === ALL_WORKSPACES_VALUE;

    items.push({
      value: ALL_WORKSPACES_VALUE,
      label: 'All workspaces',
      icon: <GridViewIcon />,
      selected: isAllSelected,
    } as MenuItem);

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
      const isSelected = currentWorkspaceIdFromUrl === workspace.id;
      const icon = workspace.type === 'personal' ? <HomeIcon /> : <UsersIcon />;

      items.push({
        value: workspace.id,
        label: workspace.name,
        icon,
        selected: isSelected,
      } as MenuItem);
    }

    // Add separator and manage option
    items.push({ type: 'divider' });

    items.push({
      value: MANAGE_WORKSPACES_VALUE,
      label: 'Manage workspaces...',
      icon: <GearIcon />,
    });

    return items;
  }, [workspaces, currentWorkspaceIdFromUrl]);

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
  const isAllWorkspaces = currentWorkspaceIdFromUrl === ALL_WORKSPACES_VALUE;

  // Determine the display based on URL path
  const displayWorkspace = currentWorkspaceIdFromUrl && !isAllWorkspaces
    ? workspaces.find(w => w.id === currentWorkspaceIdFromUrl)
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
