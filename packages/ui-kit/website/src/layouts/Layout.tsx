import { NavLink } from 'react-router-dom';
import { ThemeSwitcher } from '../components/ThemeSwitcher/ThemeSwitcher';
import { PageTransition } from '../components/PageTransition/PageTransition';
import styles from './Layout.module.css';

export function Layout() {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <NavLink to="/" className={styles.logo}>
            <span className={styles.logoIcon}>◈</span>
            UI-Kit
          </NavLink>

          <nav className={styles.nav}>
            <NavLink
              to="/learn"
              className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
            >
              Learn
            </NavLink>
            <NavLink
              to="/reference"
              className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
            >
              Reference
            </NavLink>
            <NavLink
              to="/themes"
              className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
            >
              Themes
            </NavLink>
          </nav>

          <div className={styles.headerActions}>
            <ThemeSwitcher />
            <a
              href="https://github.com"
              className={styles.githubLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
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
