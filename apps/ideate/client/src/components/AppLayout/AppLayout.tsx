import { Outlet, useNavigate, useLocation, useNavigationType, useIsActive } from '@ui-kit/router';
import { Avatar, Button, IconButton, Menu, PageTransition, useHistoryIndex, useTheme } from '@ui-kit/react';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import { LogoutIcon } from '@ui-kit/icons/LogoutIcon';
import { SunIcon } from '@ui-kit/icons/SunIcon';
import { MoonIcon } from '@ui-kit/icons/MoonIcon';
import { SunMoonIcon } from '@ui-kit/icons/SunMoonIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { BoardIcon } from '@ui-kit/icons/BoardIcon';
import { TreeIcon } from '@ui-kit/icons/TreeIcon';
import { useAuth } from '../../contexts/AuthContext';
import { useSession } from '../../contexts/SessionContext';
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

  // Active state for nav buttons
  const isDashboardActive = useIsActive('/dashboard');
  const isThingsActive = useIsActive('/things');
  const isIdeasActive = useIsActive('/ideas');
  const isWorkspacesActive = useIsActive('/workspaces');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.logo} onClick={() => navigate('/dashboard')}>
            <span className={styles.logoIcon}>I</span>
            <span className={styles.logoText}>Ideate</span>
          </button>
          <nav className={styles.nav}>
            <Button
              href="/things"
              variant={isThingsActive ? 'primary' : 'ghost'}
              icon={<TreeIcon />}
            >
              Things
            </Button>
            <Button
              href="/ideas"
              variant={isIdeasActive ? 'primary' : 'ghost'}
              icon={<BoardIcon />}
            >
              Ideas
            </Button>
            <Button
              href="/dashboard"
              variant={isDashboardActive ? 'primary' : 'ghost'}
              icon={<FileIcon />}
            >
              Documents
            </Button>
            <Button
              href="/workspaces"
              variant={isWorkspacesActive ? 'primary' : 'ghost'}
              icon={<FolderIcon />}
            >
              Workspaces
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

          {/* User Menu */}
          {user && (
            <Menu
              items={[
                { value: 'settings', label: 'Settings', icon: <GearIcon /> },
                { value: 'signout', label: 'Sign Out', icon: <LogoutIcon /> },
              ]}
              onSelect={(value) => {
                if (value === 'settings') {
                  navigate('/settings');
                } else if (value === 'signout') {
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
