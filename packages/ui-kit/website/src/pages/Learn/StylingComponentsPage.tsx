import { Link } from 'react-router-dom';
import styles from './LessonPage.module.css';

export function StylingComponentsPage() {
  return (
    <article className={styles.lesson}>
      <div className={styles.header}>
        <span className={styles.lessonNumber}>Lesson 3</span>
        <h1 className={styles.title}>Styling Components</h1>
        <p className={styles.subtitle}>
          Practical examples of using tokens to style common UI components.
        </p>
      </div>

      <section className={styles.section}>
        <h2>Buttons</h2>
        <p>Buttons use the control surfaces with hover and pressed states:</p>
        <pre className={styles.code}>{`/* Default button */
.button {
  background: var(--control-bg);
  color: var(--control-text);
  border: 1px solid var(--control-border);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
}

.button:hover {
  background: var(--control-bg-hover);
}

.button:active {
  background: var(--control-bg-pressed);
}

/* Primary button */
.button-primary {
  background: var(--controlPrimary-bg);
  color: var(--controlPrimary-text);
  border-color: var(--controlPrimary-border);
}

.button-primary:hover {
  background: var(--controlPrimary-bg-hover);
}

/* Danger button */
.button-danger {
  background: var(--controlDanger-bg);
  color: var(--controlDanger-text);
  border-color: var(--controlDanger-border);
}

.button-danger:hover {
  background: var(--controlDanger-bg-hover);
}`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Input Fields</h2>
        <p>Inputs use the inset surface for a recessed appearance:</p>
        <pre className={styles.code}>{`.input {
  background: var(--inset-bg);
  color: var(--inset-text);
  border: 1px solid var(--inset-border);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
}

.input:hover {
  background: var(--inset-bg-hover);
}

.input:focus {
  background: var(--inset-bg-focus);
  border-color: var(--inset-border-focus);
  outline: none;
}

.input::placeholder {
  color: var(--inset-text-soft);
}`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Cards</h2>
        <p>Cards use the card surface for elevated containers:</p>
        <pre className={styles.code}>{`.card {
  background: var(--card-bg);
  color: var(--card-text);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--card-shadow);
}

.card-title {
  color: var(--card-text-hard);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  margin-bottom: var(--space-2);
}

.card-description {
  color: var(--card-text-soft);
  font-size: var(--text-sm);
}`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Alerts</h2>
        <p>Alerts use feedback surfaces to communicate status:</p>
        <pre className={styles.code}>{`.alert {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  border-left: 4px solid;
}

.alert-success {
  background: var(--success-bg);
  color: var(--success-text);
  border-color: var(--success-border);
}

.alert-warning {
  background: var(--warning-bg);
  color: var(--warning-text);
  border-color: var(--warning-border);
}

.alert-danger {
  background: var(--danger-bg);
  color: var(--danger-text);
  border-color: var(--danger-border);
}

.alert-info {
  background: var(--info-bg);
  color: var(--info-text);
  border-color: var(--info-border);
}`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Focus States</h2>
        <p>Use the focus ring tokens for keyboard accessibility:</p>
        <pre className={styles.code}>{`.interactive:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}`}</pre>
      </section>

      <div className={styles.nav}>
        <Link to="/learn/surfaces" className={styles.prevLink}>
          &larr; Previous: Understanding Surfaces
        </Link>
        <Link to="/learn/theming" className={styles.nextLink}>
          Next: Theming &rarr;
        </Link>
      </div>
    </article>
  );
}
