import { Link } from 'react-router-dom';
import styles from './LessonPage.module.css';

export function ColorGroupsPage() {
  return (
    <article className={styles.lesson}>
      <div className={styles.header}>
        <span className={styles.lessonNumber}>Lesson 2</span>
        <h1 className={styles.title}>Color Groups</h1>
        <p className={styles.subtitle}>
          The accessibility-first token system that guarantees WCAG compliance.
        </p>
      </div>

      <section className={styles.section}>
        <h2>The Core Principle</h2>
        <p>
          Color groups solve a fundamental problem: how do you guarantee that
          text is readable on any background, in any theme, in any color mode?
        </p>
        <p>
          The answer is simple: <strong>scope all foreground colors to their background</strong>.
          When you pick a color group for your background, you get foreground tokens that are
          guaranteed to have proper contrast on that background.
        </p>
        <pre className={styles.code}>{`/* The rule: one group, all its tokens */
.button {
  background: var(--primary-bg);
  color: var(--primary-fg);          /* Guaranteed contrast! */
  border: 1px solid var(--primary-border);
}

.button:hover {
  background: var(--primary-bg-hover);
  /* Still use --primary-fg - it works on all primary backgrounds */
}`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Tonal Groups</h2>
        <p>
          Tonal groups create visual hierarchy through lightness variation.
          Use them for layering content:
        </p>
        <ul>
          <li><code>softer</code> - Darkest in light mode. Use for inputs, wells, recessed areas.</li>
          <li><code>soft</code> - Slightly elevated. Use for cards, panels.</li>
          <li><code>base</code> - The page background. Default starting point.</li>
          <li><code>strong</code> - Emphasized. Use for highlights, important sections.</li>
          <li><code>stronger</code> - Maximum emphasis without color.</li>
        </ul>
        <pre className={styles.code}>{`/* Creating depth with tonal groups */
.page {
  background: var(--base-bg);
  color: var(--base-fg);
}

.card {
  background: var(--soft-bg);
  color: var(--soft-fg);
  border: 1px solid var(--soft-border);
}

.input {
  background: var(--softer-bg);
  color: var(--softer-fg);
  border: 1px solid var(--softer-border);
}`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Semantic Groups</h2>
        <p>
          Semantic groups carry meaning through color:
        </p>
        <ul>
          <li><code>primary</code> - Brand color, primary actions, selected states</li>
          <li><code>success</code> - Positive outcomes, confirmations</li>
          <li><code>warning</code> - Caution, attention needed</li>
          <li><code>danger</code> - Errors, destructive actions</li>
          <li><code>info</code> - Informational content</li>
          <li><code>inverted</code> - Opposite scheme (tooltips in light mode are dark)</li>
        </ul>
        <pre className={styles.code}>{`/* Button variants using semantic groups */
.btn-primary {
  background: var(--primary-bg);
  color: var(--primary-fg);
}

.btn-danger {
  background: var(--danger-bg);
  color: var(--danger-fg);
}

/* Status messages */
.alert-success {
  background: var(--success-bg);
  color: var(--success-fg);
  border: 1px solid var(--success-border);
}`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Interactive States</h2>
        <p>
          Each group provides state variants for backgrounds and borders:
        </p>
        <pre className={styles.code}>{`.interactive-element {
  background: var(--strong-bg);
  border: 1px solid var(--strong-border);
}

.interactive-element:hover {
  background: var(--strong-bg-hover);
  border-color: var(--strong-border-hover);
}

.interactive-element:active {
  background: var(--strong-bg-pressed);
  border-color: var(--strong-border-pressed);
}

.interactive-element:disabled {
  background: var(--strong-bg-disabled);
  border-color: var(--strong-border-disabled);
  color: var(--strong-fg-softer);  /* Muted text for disabled */
}`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Foreground Variants</h2>
        <p>
          Each group provides multiple foreground options for text hierarchy:
        </p>
        <pre className={styles.code}>{`.card {
  background: var(--soft-bg);
}

.card-title {
  color: var(--soft-fg-strong);    /* Emphasized */
}

.card-body {
  color: var(--soft-fg);           /* Normal */
}

.card-meta {
  color: var(--soft-fg-soft);      /* De-emphasized */
}

.card-caption {
  color: var(--soft-fg-softer);    /* Very subtle */
}

.card-link {
  color: var(--soft-fg-primary);   /* Accent color, accessible on soft-bg */
}

.card-error {
  color: var(--soft-fg-danger);    /* Error color, accessible on soft-bg */
}`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Why Not Mix Groups?</h2>
        <p>
          You might wonder why you can&apos;t use <code>--primary-fg</code> on a <code>--soft-bg</code>.
          The answer: <strong>contrast isn&apos;t guaranteed</strong>.
        </p>
        <p>
          Each group&apos;s foreground tokens are calculated specifically for that group&apos;s background.
          If you need a primary-colored text on a soft background, use <code>--soft-fg-primary</code>:
        </p>
        <pre className={styles.code}>{`/* WRONG - contrast not guaranteed */
.card {
  background: var(--soft-bg);
  color: var(--primary-fg);  /* This might fail contrast! */
}

/* CORRECT - each group has its own semantic fg tokens */
.card {
  background: var(--soft-bg);
  color: var(--soft-fg-primary);  /* Guaranteed accessible */
}`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Static Tokens</h2>
        <p>
          Some tokens don&apos;t change between themes and can be used anywhere:
        </p>
        <pre className={styles.code}>{`/* Spacing */
--space-1 through --space-24

/* Typography */
--text-xs, --text-sm, --text-base, --text-lg, --text-xl, etc.
--weight-normal, --weight-medium, --weight-semibold, --weight-bold
--leading-tight, --leading-normal, --leading-loose

/* Borders */
--radius-sm, --radius-md, --radius-lg, --radius-xl, --radius-full

/* Animation */
--duration-fast, --duration-normal, --duration-slow
--ease-default, --ease-in, --ease-out, --ease-in-out`}</pre>
      </section>

      <div className={styles.nav}>
        <Link to="/learn/getting-started" className={styles.prevLink}>
          &larr; Getting Started
        </Link>
        <Link to="/learn/surfaces" className={styles.nextLink}>
          Next: Surfaces &rarr;
        </Link>
      </div>
    </article>
  );
}
