import { useMemo } from 'react';
import { Outlet, useNavigate, useLocation, useNavigationType } from '@ui-kit/router';
import { Avatar, Button, IconButton, Menu, PageTransition, useHistoryIndex, useTheme } from '@ui-kit/react';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import { LogoutIcon } from '@ui-kit/icons/LogoutIcon';
import { SunIcon } from '@ui-kit/icons/SunIcon';
import { MoonIcon } from '@ui-kit/icons/MoonIcon';
import { SunMoonIcon } from '@ui-kit/icons/SunMoonIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { BoardIcon } from '@ui-kit/icons/BoardIcon';
import { TreeIcon } from '@ui-kit/icons/TreeIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { useAuth } from '../../contexts/AuthContext';
import { useSession } from '../../contexts/SessionContext';
import { WorkspaceSwitcher } from '../WorkspaceSwitcher';
import { parseWorkspacePath } from '../../utils/workspacePath';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const { user, signOut } = useAuth();
  const { session } = useSession();
  const { mode, setMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const historyIndex = useHistoryIndex({
    locationKey: location.key,
    navigationType,
  });

  // Parse current workspace and pivot from URL
  const { workspaceId, pivot } = useMemo(
    () => parseWorkspacePath(location.pathname),
    [location.pathname]
  );

  // Determine the effective workspace ID for nav links
  // Falls back to personal workspace if not on a workspace route
  const effectiveWorkspaceId = workspaceId || (user ? `personal-${user.id}` : null);

  // Active state for nav buttons based on current pivot
  const isTopicsActive = pivot === 'topics';
  const isIdeasActive = pivot === 'ideas';
  const isDocumentsActive = pivot === 'documents';
  const isChatActive = pivot === 'chat';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Navigate to default workspace/pivot (for logo click)
  const handleLogoClick = () => {
    if (effectiveWorkspaceId) {
      navigate(`/${effectiveWorkspaceId}/topics`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.logo} onClick={handleLogoClick}>
            <span className={styles.logoIcon}>I</span>
            <span className={styles.logoText}>Ideate</span>
          </button>
          <WorkspaceSwitcher />
          <nav className={styles.nav}>
            <Button
              href={effectiveWorkspaceId ? `/${effectiveWorkspaceId}/topics` : '/'}
              variant={isTopicsActive ? 'primary' : 'ghost'}
              icon={<TreeIcon />}
            >
              Topics
            </Button>
            <Button
              href={effectiveWorkspaceId ? `/${effectiveWorkspaceId}/ideas` : '/'}
              variant={isIdeasActive ? 'primary' : 'ghost'}
              icon={<BoardIcon />}
            >
              Ideas
            </Button>
            <Button
              href={effectiveWorkspaceId ? `/${effectiveWorkspaceId}/documents` : '/'}
              variant={isDocumentsActive ? 'primary' : 'ghost'}
              icon={<FileIcon />}
            >
              Documents
            </Button>
            <Button
              href={effectiveWorkspaceId ? `/${effectiveWorkspaceId}/chat` : '/'}
              variant={isChatActive ? 'primary' : 'ghost'}
              icon={<ChatIcon />}
            >
              Chat
            </Button>
          </nav>
        </div>

        <div className={styles.headerRight}>
          {/* Theme Toggle */}
          <Menu
            items={[
              { value: 'light', label: 'Light', icon: <SunIcon /> },
              { value: 'dark', label: 'Dark', icon: <MoonIcon /> },
              { value: 'auto', label: 'System', icon: <SunMoonIcon /> },
            ]}
            onSelect={(value) => setMode(value as 'light' | 'dark' | 'auto')}
            position="bottom-end"
          >
            <IconButton
              icon={mode === 'light' ? <SunIcon /> : mode === 'dark' ? <MoonIcon /> : <SunMoonIcon />}
              variant="ghost"
              aria-label="Change theme"
            />
          </Menu>

          {/* Settings */}
          <IconButton
            icon={<GearIcon />}
            variant="ghost"
            aria-label="Settings"
            onClick={() => navigate('/settings')}
          />

          {/* User Menu */}
          {user && (
            <Menu
              items={[
                { value: 'signout', label: 'Sign Out', icon: <LogoutIcon /> },
              ]}
              onSelect={(value) => {
                if (value === 'signout') {
                  handleSignOut();
                }
              }}
              position="bottom-end"
            >
              <IconButton
                icon={<Avatar fallback={user.name} size="sm" color={session?.color} />}
                variant="ghost"
                shape="round"
                aria-label="User menu"
              />
            </Menu>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <PageTransition
          transitionKey={location.key}
          historyIndex={historyIndex}
        >
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
