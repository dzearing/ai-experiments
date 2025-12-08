import { Link } from 'react-router-dom';
import styles from './Home.module.css';

export function Home() {
  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <h1 className={styles.title}>UI-Kit</h1>
        <p className={styles.subtitle}>
          A design token system that makes
          <br />
          accessible, themeable UIs intuitive.
        </p>
        <div className={styles.actions}>
          <Link to="/learn" className={styles.primaryButton}>
            Start Learning
          </Link>
          <Link to="/themes" className={styles.secondaryButton}>
            Browse Themes
          </Link>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>🎨</div>
          <h3 className={styles.featureTitle}>Surface Based</h3>
          <p className={styles.featureDesc}>
            Components automatically adapt to their visual context
          </p>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>🎭</div>
          <h3 className={styles.featureTitle}>Theme System</h3>
          <p className={styles.featureDesc}>
            20+ built-in themes with light and dark modes
          </p>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>♿</div>
          <h3 className={styles.featureTitle}>WCAG AA/AAA</h3>
          <p className={styles.featureDesc}>
            Accessibility built into the color system
          </p>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>⚡</div>
          <h3 className={styles.featureTitle}>Zero Flash</h3>
          <p className={styles.featureDesc}>
            Inline bootstrap prevents theme flicker
          </p>
        </div>
      </section>

      <section className={styles.quickStart}>
        <h2>30 Seconds to Start</h2>
        <div className={styles.codeBlocks}>
          <pre className={styles.codeBlock}>
            <code>{`<script>/* inline bootstrap */</script>
<link rel="stylesheet" href="uikit/tokens.css">`}</code>
          </pre>
          <pre className={styles.codeBlock}>
            <code>{`.card {
  background: var(--card-bg);
  color: var(--card-text);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
}`}</code>
          </pre>
        </div>
        <p className={styles.tagline}>
          Dark mode, accessibility, and theming — built in.
        </p>
      </section>
    </div>
  );
}
