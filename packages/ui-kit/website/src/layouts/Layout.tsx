import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Tabs } from '@ui-kit/react';
import { ThemeSwitcher } from '../components/ThemeSwitcher/ThemeSwitcher';
import { PageTransition } from '../components/PageTransition/PageTransition';
import styles from './Layout.module.css';

const navItems = [
  { value: '/learn', label: 'Learn', content: null },
  { value: '/reference', label: 'Reference', content: null },
  { value: '/themes', label: 'Themes', content: null },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from current path
  const activeTab = navItems.find(item => location.pathname.startsWith(item.value))?.value || '';

  const handleTabChange = (value: string) => {
    navigate(value);
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <NavLink to="/" className={styles.logo}>
            <span className={styles.logoIcon}>◈</span>
            UI-Kit
          </NavLink>

          <nav className={styles.nav}>
            <Tabs
              items={navItems}
              value={activeTab}
              onChange={handleTabChange}
              variant="underline"
            />
          </nav>

          <div className={styles.headerActions}>
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <PageTransition />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>Built with UI-Kit tokens. No external CSS frameworks.</p>
        </div>
      </footer>
    </div>
  );
}
