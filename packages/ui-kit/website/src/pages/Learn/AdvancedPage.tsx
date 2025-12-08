import { Link } from 'react-router-dom';
import styles from './LessonPage.module.css';

export function AdvancedPage() {
  return (
    <article className={styles.lesson}>
      <div className={styles.header}>
        <span className={styles.lessonNumber}>Lesson 5</span>
        <h1 className={styles.title}>Advanced Topics</h1>
        <p className={styles.subtitle}>
          Custom surfaces, performance optimization, and accessibility best practices.
        </p>
      </div>

      <section className={styles.section}>
        <h2>Custom Surfaces</h2>
        <p>
          While the built-in surfaces cover most use cases, you can create
          custom surfaces for brand-specific needs:
        </p>
        <pre className={styles.code}>{`/* Define a custom brand surface */
:root {
  --brandHero-bg: linear-gradient(135deg, #667eea, #764ba2);
  --brandHero-text: #ffffff;
  --brandHero-text-soft: rgba(255, 255, 255, 0.8);
}

/* Dark mode variant */
[data-mode="dark"] {
  --brandHero-bg: linear-gradient(135deg, #4c51bf, #553c9a);
}

/* Usage */
.hero-section {
  background: var(--brandHero-bg);
  color: var(--brandHero-text);
}`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Performance Optimization</h2>
        <p>UI-Kit is already optimized for performance, but here are some tips:</p>
        <ul className={styles.list}>
          <li>
            <strong>CSS Variables are fast.</strong> Modern browsers handle them
            efficiently. No JavaScript is needed for theme switching.
          </li>
          <li>
            <strong>Avoid @import chains.</strong> Import the tokens CSS once
            at the top level.
          </li>
          <li>
            <strong>Use the bootstrap script.</strong> It prevents expensive
            repaints from theme flashing.
          </li>
          <li>
            <strong>Minimize custom surfaces.</strong> Each surface adds to
            the CSS bundle size.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Accessibility Best Practices</h2>
        <p>UI-Kit ensures accessibility at the architecture level:</p>
        <ul className={styles.list}>
          <li>
            <strong>All color combinations meet WCAG AA.</strong> The theme
            generator validates contrast ratios at build time.
          </li>
          <li>
            <strong>High-contrast theme for AAA.</strong> Users who need
            maximum readability can switch to the high-contrast theme.
          </li>
          <li>
            <strong>Focus indicators are built in.</strong> Use the
            <code>--focus-ring</code> tokens for consistent focus states.
          </li>
          <li>
            <strong>Respects prefers-contrast.</strong> The bootstrap script
            automatically switches to high-contrast when the user has set
            this preference.
          </li>
        </ul>
        <pre className={styles.code}>{`/* Always use focus-visible for keyboard users */
.button:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

/* Never remove focus outlines without providing an alternative */`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Spacing and Typography</h2>
        <p>
          Beyond colors, UI-Kit provides spacing and typography tokens for
          consistent design:
        </p>
        <pre className={styles.code}>{`/* Spacing scale */
--space-1: 4px;    --space-2: 8px;    --space-3: 12px;
--space-4: 16px;   --space-5: 20px;   --space-6: 24px;
--space-8: 32px;   --space-10: 40px;  --space-12: 48px;

/* Typography */
--text-xs: 11px;   --text-sm: 13px;   --text-base: 15px;
--text-lg: 17px;   --text-xl: 20px;   --text-2xl: 24px;

/* Font weights */
--weight-normal: 400;   --weight-medium: 500;
--weight-semibold: 600; --weight-bold: 700;

/* Border radius */
--radius-sm: 2px;  --radius-md: 4px;  --radius-lg: 8px;
--radius-xl: 12px; --radius-full: 9999px;`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Congratulations!</h2>
        <p>
          You&apos;ve completed the UI-Kit learning path. You now understand:
        </p>
        <ul className={styles.list}>
          <li>How to set up zero-flash theme loading</li>
          <li>The surface-based architecture</li>
          <li>How to style common components</li>
          <li>Theme switching and customization</li>
          <li>Performance and accessibility best practices</li>
        </ul>
        <p>
          Explore the <Link to="/reference">Reference</Link> for complete
          token documentation, or browse the <Link to="/themes">Theme Gallery</Link> to
          see all available themes.
        </p>
      </section>

      <div className={styles.nav}>
        <Link to="/learn/theming" className={styles.prevLink}>
          &larr; Previous: Theming
        </Link>
        <Link to="/reference" className={styles.nextLink}>
          Go to Reference &rarr;
        </Link>
      </div>
    </article>
  );
}
