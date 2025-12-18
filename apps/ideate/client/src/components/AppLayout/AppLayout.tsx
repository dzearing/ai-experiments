import { Outlet, useNavigate } from 'react-router-dom';
import { Avatar, IconButton, Menu, useTheme } from '@ui-kit/react';
import { GearIcon, LogoutIcon, SunIcon, MoonIcon, SunMoonIcon } from '@ui-kit/icons';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const { user, signOut } = useAuth();
  const { mode, setMode } = useTheme();
  const navigate = useNavigate();

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
                icon={<Avatar src={user.avatarUrl} fallback={user.name} size="sm" />}
                variant="ghost"
                shape="round"
                aria-label="User menu"
              />
            </Menu>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
