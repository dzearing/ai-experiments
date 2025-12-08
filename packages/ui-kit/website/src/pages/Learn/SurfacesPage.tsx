import { Link } from 'react-router-dom';
import styles from './LessonPage.module.css';

export function SurfacesPage() {
  return (
    <article className={styles.lesson}>
      <div className={styles.header}>
        <span className={styles.lessonNumber}>Lesson 2</span>
        <h1 className={styles.title}>Understanding Surfaces</h1>
        <p className={styles.subtitle}>
          The core concept that makes UI-Kit work: semantic surface types.
        </p>
      </div>

      <section className={styles.section}>
        <h2>What is a Surface?</h2>
        <p>
          A surface is a semantic context for UI elements. Instead of using colors
          directly (like &quot;blue button&quot; or &quot;gray background&quot;), you use surfaces
          that describe the <em>purpose</em> of the element.
        </p>
        <p>
          For example, a card uses the <code>card</code> surface, which provides
          appropriate background, text, and border colors. When the user switches
          themes, all cards update automatically because they reference the same
          semantic surface.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Container Surfaces</h2>
        <p>These surfaces are for static backgrounds and layout containers:</p>
        <div className={styles.tokenList}>
          <div className={styles.tokenItem}>
            <code>page</code>
            <span>The main application background</span>
          </div>
          <div className={styles.tokenItem}>
            <code>card</code>
            <span>Elevated content containers</span>
          </div>
          <div className={styles.tokenItem}>
            <code>overlay</code>
            <span>Modals, dialogs, sheets, popovers</span>
          </div>
          <div className={styles.tokenItem}>
            <code>popout</code>
            <span>Dropdowns, menus, tooltips (highest elevation)</span>
          </div>
          <div className={styles.tokenItem}>
            <code>inset</code>
            <span>Recessed areas like input fields and wells</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Control Surfaces</h2>
        <p>These surfaces are for interactive elements:</p>
        <div className={styles.tokenList}>
          <div className={styles.tokenItem}>
            <code>control</code>
            <span>Default interactive elements (buttons, list items)</span>
          </div>
          <div className={styles.tokenItem}>
            <code>controlPrimary</code>
            <span>Primary actions (CTA buttons, selected states)</span>
          </div>
          <div className={styles.tokenItem}>
            <code>controlDanger</code>
            <span>Destructive actions (delete, remove)</span>
          </div>
          <div className={styles.tokenItem}>
            <code>controlSubtle</code>
            <span>Ghost/minimal buttons, tabs</span>
          </div>
          <div className={styles.tokenItem}>
            <code>controlDisabled</code>
            <span>Non-interactive state</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Feedback Surfaces</h2>
        <p>These surfaces communicate status:</p>
        <div className={styles.tokenList}>
          <div className={styles.tokenItem}>
            <code>success</code>
            <span>Positive outcomes, confirmations</span>
          </div>
          <div className={styles.tokenItem}>
            <code>warning</code>
            <span>Caution, attention needed</span>
          </div>
          <div className={styles.tokenItem}>
            <code>danger</code>
            <span>Errors, destructive states</span>
          </div>
          <div className={styles.tokenItem}>
            <code>info</code>
            <span>Informational, neutral status</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Surface Token Anatomy</h2>
        <p>Each surface provides a set of tokens:</p>
        <pre className={styles.code}>{`/* For any surface, you get: */
--{surface}-bg           /* background color */
--{surface}-bg-hover     /* background on hover (controls only) */
--{surface}-bg-pressed   /* background when pressed (controls only) */
--{surface}-text         /* text/icon color */
--{surface}-text-soft    /* muted text (some surfaces) */
--{surface}-text-hard    /* emphasized text (some surfaces) */
--{surface}-border       /* border color */
--{surface}-shadow       /* box-shadow value */

/* Examples: */
--card-bg
--control-bg-hover
--success-text
--inset-border`}</pre>
      </section>

      <div className={styles.nav}>
        <Link to="/learn/getting-started" className={styles.prevLink}>
          &larr; Previous: Getting Started
        </Link>
        <Link to="/learn/styling-components" className={styles.nextLink}>
          Next: Styling Components &rarr;
        </Link>
      </div>
    </article>
  );
}
