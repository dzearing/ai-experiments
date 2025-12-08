import { Link } from 'react-router-dom';
import styles from './LessonPage.module.css';

export function GettingStartedPage() {
  return (
    <article className={styles.lesson}>
      <div className={styles.header}>
        <span className={styles.lessonNumber}>Lesson 1</span>
        <h1 className={styles.title}>Getting Started</h1>
        <p className={styles.subtitle}>
          Set up UI-Kit in your project with zero-flash theme loading.
        </p>
      </div>

      <section className={styles.section}>
        <h2>Installation</h2>
        <p>
          UI-Kit is a CSS-based design token system. You can use it with any framework
          or vanilla HTML/CSS. The tokens are provided as CSS custom properties.
        </p>
        <pre className={styles.code}>{`npm install @ui-kit/core`}</pre>
        <p>Or copy the tokens.css file directly into your project.</p>
      </section>

      <section className={styles.section}>
        <h2>Zero-Flash Theme Loading</h2>
        <p>
          The most common issue with theming is a &quot;flash&quot; when the page loads - 
          where users briefly see the wrong theme before JavaScript hydrates. 
          UI-Kit solves this with an inline bootstrap script.
        </p>
        <p>Add this script to your HTML &lt;head&gt;, before any stylesheets:</p>
        <pre className={styles.code}>{`<script>
  (function() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem('uikit-theme')); } catch(e) {}

    var theme = (s && s.theme) || 'default';
    var mode = (s && s.mode) || 'auto';

    if (mode === 'auto') {
      mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Check for high-contrast preference
    if (!s && matchMedia('(prefers-contrast: more)').matches) {
      theme = 'high-contrast';
    }

    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.mode = mode;
  })();
</script>`}</pre>
        <p>
          This script runs synchronously before the page renders, setting the correct
          theme attributes on the HTML element. The CSS then uses these attributes
          to apply the right colors.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Import the Tokens</h2>
        <p>After the bootstrap script, import the tokens stylesheet:</p>
        <pre className={styles.code}>{`<link rel="stylesheet" href="@ui-kit/core/tokens.css">`}</pre>
        <p>Or in your CSS/JS:</p>
        <pre className={styles.code}>{`@import '@ui-kit/core/tokens.css';

// or in JavaScript
import '@ui-kit/core/tokens.css';`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Your First Tokens</h2>
        <p>Now you can use the design tokens in your CSS:</p>
        <pre className={styles.code}>{`.my-card {
  background: var(--card-bg);
  color: var(--card-text);
  border: 1px solid var(--card-border);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
}`}</pre>
        <p>
          The card will automatically adapt to light/dark mode and any theme the user selects.
          No additional CSS or JavaScript required!
        </p>
      </section>

      <div className={styles.nav}>
        <div></div>
        <Link to="/learn/surfaces" className={styles.nextLink}>
          Next: Understanding Surfaces &rarr;
        </Link>
      </div>
    </article>
  );
}
