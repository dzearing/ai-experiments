import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';

export function HomePage() {
  return (
    <div className={styles.home}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            A design token system that makes
            <br />
            <span className={styles.highlight}>accessible, themeable UIs intuitive</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Surface-based architecture guarantees WCAG compliance. 
            19 themes with light and dark modes. Zero-flash loading.
            Framework agnostic.
          </p>
          <div className={styles.heroCta}>
            <Link to="/learn/getting-started" className={styles.primaryButton}>
              Start Learning
            </Link>
            <Link to="/themes" className={styles.secondaryButton}>
              Browse Themes
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.featuresGrid}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>&#9632;</div>
            <h3 className={styles.featureTitle}>Surface-Based</h3>
            <p className={styles.featureDesc}>
              Components use semantic surfaces (card, control, inset) instead of hardcoded colors.
              Accessibility is built into the architecture.
            </p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>&#9788;</div>
            <h3 className={styles.featureTitle}>19 Themes</h3>
            <p className={styles.featureDesc}>
              From professional (GitHub, Teams) to creative (Cyberpunk, Matrix).
              Each with light and dark modes.
            </p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>&#9889;</div>
            <h3 className={styles.featureTitle}>WCAG AA/AAA</h3>
            <p className={styles.featureDesc}>
              All color combinations meet contrast requirements.
              High-contrast theme for maximum accessibility.
            </p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>&#9733;</div>
            <h3 className={styles.featureTitle}>Zero Flash</h3>
            <p className={styles.featureDesc}>
              Inline bootstrap script prevents theme flash on load.
              Respects system preferences automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className={styles.quickStart}>
        <h2 className={styles.sectionTitle}>30 Seconds to Start</h2>
        <div className={styles.codeBlocks}>
          <div className={styles.codeBlock}>
            <div className={styles.codeHeader}>1. Add the bootstrap script</div>
            <pre className={styles.code}>{`<script>
  (function() {
    var s = JSON.parse(localStorage.getItem('uikit-theme') || '{}');
    var theme = s.theme || 'default';
    var mode = s.mode || 'auto';
    if (mode === 'auto') {
      mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.mode = mode;
  })();
</script>`}</pre>
          </div>
          <div className={styles.codeBlock}>
            <div className={styles.codeHeader}>2. Import the tokens</div>
            <pre className={styles.code}>{`<link rel="stylesheet" href="uikit/tokens.css">`}</pre>
          </div>
          <div className={styles.codeBlock}>
            <div className={styles.codeHeader}>3. Use the tokens</div>
            <pre className={styles.code}>{`.card {
  background: var(--card-bg);
  color: var(--card-text);
  border: 1px solid var(--card-border);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--card-shadow);
}`}</pre>
          </div>
        </div>
        <p className={styles.quickStartNote}>
          Dark mode, accessibility, and theming. Built in.
        </p>
      </section>

      {/* Surface Types */}
      <section className={styles.surfaces}>
        <h2 className={styles.sectionTitle}>Surface Types</h2>
        <div className={styles.surfaceGrid}>
          <div className={styles.surfaceCategory}>
            <h4 className={styles.surfaceCategoryTitle}>Containers</h4>
            <div className={styles.surfaceList}>
              <div className={styles.surfaceItem}>
                <span className={styles.surfaceName}>page</span>
                <span className={styles.surfaceDesc}>Main application background</span>
              </div>
              <div className={styles.surfaceItem}>
                <span className={styles.surfaceName}>card</span>
                <span className={styles.surfaceDesc}>Elevated content containers</span>
              </div>
              <div className={styles.surfaceItem}>
                <span className={styles.surfaceName}>overlay</span>
                <span className={styles.surfaceDesc}>Modals, dialogs, sheets</span>
              </div>
              <div className={styles.surfaceItem}>
                <span className={styles.surfaceName}>popout</span>
                <span className={styles.surfaceDesc}>Dropdowns, menus, tooltips</span>
              </div>
              <div className={styles.surfaceItem}>
                <span className={styles.surfaceName}>inset</span>
                <span className={styles.surfaceDesc}>Input fields, wells</span>
              </div>
            </div>
          </div>
          <div className={styles.surfaceCategory}>
            <h4 className={styles.surfaceCategoryTitle}>Controls</h4>
            <div className={styles.surfaceList}>
              <div className={styles.surfaceItem}>
                <span className={styles.surfaceName}>control</span>
                <span className={styles.surfaceDesc}>Default buttons, list items</span>
              </div>
              <div className={styles.surfaceItem}>
                <span className={styles.surfaceName}>controlPrimary</span>
                <span className={styles.surfaceDesc}>Primary actions, CTAs</span>
              </div>
              <div className={styles.surfaceItem}>
                <span className={styles.surfaceName}>controlDanger</span>
                <span className={styles.surfaceDesc}>Destructive actions</span>
              </div>
              <div className={styles.surfaceItem}>
                <span className={styles.surfaceName}>controlSubtle</span>
                <span className={styles.surfaceDesc}>Ghost buttons, tabs</span>
              </div>
            </div>
          </div>
          <div className={styles.surfaceCategory}>
            <h4 className={styles.surfaceCategoryTitle}>Feedback</h4>
            <div className={styles.surfaceList}>
              <div className={styles.surfaceItem}>
                <span className={styles.surfaceName}>success</span>
                <span className={styles.surfaceDesc}>Positive outcomes</span>
              </div>
              <div className={styles.surfaceItem}>
                <span className={styles.surfaceName}>warning</span>
                <span className={styles.surfaceDesc}>Caution, attention</span>
              </div>
              <div className={styles.surfaceItem}>
                <span className={styles.surfaceName}>danger</span>
                <span className={styles.surfaceDesc}>Errors, destructive</span>
              </div>
              <div className={styles.surfaceItem}>
                <span className={styles.surfaceName}>info</span>
                <span className={styles.surfaceDesc}>Informational status</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <h2 className={styles.ctaTitle}>Ready to build?</h2>
        <p className={styles.ctaDesc}>
          Learn the surface-based architecture in under 30 minutes.
        </p>
        <Link to="/learn" className={styles.primaryButton}>
          Start the Tutorial
        </Link>
      </section>
    </div>
  );
}
