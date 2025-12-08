import { Link } from 'react-router-dom';
import styles from './LessonPage.module.css';

export function ThemingPage() {
  return (
    <article className={styles.lesson}>
      <div className={styles.header}>
        <span className={styles.lessonNumber}>Lesson 4</span>
        <h1 className={styles.title}>Theming</h1>
        <p className={styles.subtitle}>
          Learn how themes work and how to switch between them at runtime.
        </p>
      </div>

      <section className={styles.section}>
        <h2>How Themes Work</h2>
        <p>
          Themes are implemented using CSS selectors on the root element.
          The <code>data-theme</code> and <code>data-mode</code> attributes
          determine which token values are active.
        </p>
        <pre className={styles.code}>{`/* Default theme, light mode */
[data-theme="default"][data-mode="light"] {
  --page-bg: #fafafa;
  --page-text: #171717;
  --controlPrimary-bg: #2563eb;
  /* ... */
}

/* Default theme, dark mode */
[data-theme="default"][data-mode="dark"] {
  --page-bg: #0a0a0a;
  --page-text: #fafafa;
  --controlPrimary-bg: #3b82f6;
  /* ... */
}

/* GitHub theme */
[data-theme="github"][data-mode="light"] {
  --page-bg: #ffffff;
  --page-text: #1f2328;
  --controlPrimary-bg: #2da44e;
  /* ... */
}`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Switching Themes at Runtime</h2>
        <p>
          To change the theme, update the <code>data-theme</code> and
          <code>data-mode</code> attributes on the document element:
        </p>
        <pre className={styles.code}>{`// Switch to GitHub theme, dark mode
document.documentElement.dataset.theme = 'github';
document.documentElement.dataset.mode = 'dark';

// Persist the selection
localStorage.setItem('uikit-theme', JSON.stringify({
  theme: 'github',
  mode: 'dark'
}));`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Available Themes</h2>
        <p>UI-Kit includes 19 built-in themes:</p>
        <div className={styles.tokenList}>
          <div className={styles.tokenItem}>
            <code>default</code>
            <span>Clean, professional blue</span>
          </div>
          <div className={styles.tokenItem}>
            <code>minimal</code>
            <span>Understated, neutral grays</span>
          </div>
          <div className={styles.tokenItem}>
            <code>high-contrast</code>
            <span>Maximum readability (AAA)</span>
          </div>
          <div className={styles.tokenItem}>
            <code>github</code>
            <span>GitHub design language</span>
          </div>
          <div className={styles.tokenItem}>
            <code>ocean</code>
            <span>Cool blues and aquas</span>
          </div>
          <div className={styles.tokenItem}>
            <code>forest</code>
            <span>Natural greens</span>
          </div>
          <div className={styles.tokenItem}>
            <code>terminal</code>
            <span>Green-on-black hacker aesthetic</span>
          </div>
          <div className={styles.tokenItem}>
            <code>cyberpunk</code>
            <span>Neon pinks and cyans</span>
          </div>
        </div>
        <p>And many more. See the <Link to="/themes">Theme Gallery</Link> for the complete list.</p>
      </section>

      <section className={styles.section}>
        <h2>Respecting System Preferences</h2>
        <p>
          The bootstrap script automatically detects and respects the user&apos;s
          system preferences:
        </p>
        <pre className={styles.code}>{`// Check for dark mode preference
if (matchMedia('(prefers-color-scheme: dark)').matches) {
  mode = 'dark';
}

// Check for high contrast preference
if (matchMedia('(prefers-contrast: more)').matches) {
  theme = 'high-contrast';
}`}</pre>
      </section>

      <div className={styles.nav}>
        <Link to="/learn/styling-components" className={styles.prevLink}>
          &larr; Previous: Styling Components
        </Link>
        <Link to="/learn/advanced" className={styles.nextLink}>
          Next: Advanced Topics &rarr;
        </Link>
      </div>
    </article>
  );
}
