import { Link } from 'react-router-dom';
import { ThemeSwitcher } from '../ThemeSwitcher';
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          UI-Kit
        </Link>

        <nav className={styles.nav}>
          <Link to="/learn" className={styles.navLink}>
            Learn
          </Link>
          <Link to="/reference" className={styles.navLink}>
            Reference
          </Link>
          <Link to="/themes" className={styles.navLink}>
            Themes
          </Link>
        </nav>

        <ThemeSwitcher />
      </div>
    </header>
  );
}
