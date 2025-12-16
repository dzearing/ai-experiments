import { Link } from 'react-router-dom';
import {
  Button,
  Checkbox,
  Switch,
  Slider,
  Input,
} from '@ui-kit/react';
import styles from './LessonPage.module.css';
import surfaceStyles from './SurfacesPage.module.css';

/** Reusable component demo that shows various UI components */
function SurfaceDemo({ label, className }: { label: string; className?: string }) {
  return (
    <div className={`surface ${className || ''} ${surfaceStyles.surfaceDemo}`}>
      <span className={surfaceStyles.surfaceLabel}>{label}</span>
      <div className={surfaceStyles.demoControls}>
        <Button>Default</Button>
        <Button variant="primary">Primary</Button>
      </div>
      <div className={surfaceStyles.demoControls}>
        <Checkbox label="Option" defaultChecked />
        <Switch label="Toggle" defaultChecked />
      </div>
      <div className={surfaceStyles.demoControls}>
        <Input placeholder="Input text..." style={{ width: 140 }} />
      </div>
      <div className={surfaceStyles.demoControls}>
        <Slider defaultValue={50} style={{ width: 140 }} />
      </div>
    </div>
  );
}

export function SurfacesPage() {
  return (
    <article className={styles.lesson}>
      <div className={styles.header}>
        <span className={styles.lessonNumber}>Lesson 3</span>
        <h1 className={styles.title}>Understanding Surfaces</h1>
        <p className={styles.subtitle}>
          UI sections that redefine color group tokens for specific contexts.
        </p>
      </div>

      <section className={styles.section}>
        <h2>What is a Surface?</h2>
        <p>
          A surface is a CSS class that creates a distinct visual context for UI
          elements. Surfaces solve a critical accessibility problem:{' '}
          <strong>
            ensuring components remain readable when placed on different
            backgrounds
          </strong>
          .
        </p>
        <p>
          When you place a button on a dark sidebar, or a card on a sunken
          background, the button&apos;s colors might not have enough contrast.
          Surfaces automatically reset and override tokens to ensure all
          components within them have proper contrast.
        </p>
      </section>

      <section className={styles.section}>
        <h2>The Reset/Override Pattern</h2>
        <p>
          Every <code>.surface</code> element resets ALL tokens to page
          defaults, then applies specific overrides. This means:
        </p>
        <ul className={styles.list}>
          <li>
            <strong>Nested surfaces reset automatically</strong> - no
            compounding issues
          </li>
          <li>
            <strong>Components adapt automatically</strong> - buttons, inputs,
            and text all get appropriate colors
          </li>
          <li>
            <strong>Themes work consistently</strong> - surfaces respond to
            theme changes
          </li>
        </ul>
        <pre className={styles.code}>{`<!-- Usage: base class + modifier -->
<div class="surface raised">
  <button>This button has proper contrast</button>
</div>

<!-- Nested surfaces reset properly -->
<div class="surface sunken">
  <div class="surface raised">
    <!-- Inner surface resets, then applies raised overrides -->
  </div>
</div>`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Tonal Surfaces</h2>
        <p>
          Tonal surfaces adjust the visual &quot;elevation&quot; or
          &quot;depth&quot; of content areas. Components automatically adapt
          their colors when placed inside a surface:
        </p>

        <div className={surfaceStyles.surfaceGrid}>
          <SurfaceDemo label="base" />
          <SurfaceDemo label="raised" className="raised" />
          <SurfaceDemo label="sunken" className="sunken" />
          <SurfaceDemo label="soft" className="soft" />
          <SurfaceDemo label="softer" className="softer" />
          <SurfaceDemo label="strong" className="strong" />
          <SurfaceDemo label="stronger" className="stronger" />
          <SurfaceDemo label="inverted" className="inverted" />
          <SurfaceDemo label="primary" className="primary" />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Feedback Surfaces</h2>
        <p>Feedback surfaces provide semantic color contexts for status messages:</p>

        <div className={surfaceStyles.surfaceGrid}>
          <SurfaceDemo label="success" className="success" />
          <SurfaceDemo label="warning" className="warning" />
          <SurfaceDemo label="danger" className="danger" />
          <SurfaceDemo label="info" className="info" />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Nesting Surfaces</h2>
        <p>
          Surfaces can be nested without issues. Each surface resets tokens
          before applying its own overrides:
        </p>

        <div className={surfaceStyles.nestingDemo}>
          <div className={`surface sunken ${surfaceStyles.nestingOuter}`}>
            <span className={surfaceStyles.surfaceLabel}>sunken</span>
            <p>Sunken area (sidebar, well)</p>
            <div className={`surface raised ${surfaceStyles.nestingInner}`}>
              <span className={surfaceStyles.surfaceLabel}>raised</span>
              <p>Raised card inside sunken area</p>
              <div className={surfaceStyles.demoControls}>
                <Button>Action</Button>
                <Button variant="primary">Primary</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>When to Use Each Surface</h2>
        <div className={styles.tokenList}>
          <div className={styles.tokenItem}>
            <code>raised</code>
            <span>Cards, panels, dialogs, modals, dropdowns</span>
          </div>
          <div className={styles.tokenItem}>
            <code>sunken</code>
            <span>Input wells, code blocks, recessed areas</span>
          </div>
          <div className={styles.tokenItem}>
            <code>soft / softer</code>
            <span>Subtle backgrounds, slightly muted areas</span>
          </div>
          <div className={styles.tokenItem}>
            <code>strong / stronger</code>
            <span>Emphasized sections, command areas, region separation</span>
          </div>
          <div className={styles.tokenItem}>
            <code>inverted</code>
            <span>Tooltips, callouts, contrast sections</span>
          </div>
          <div className={styles.tokenItem}>
            <code>primary</code>
            <span>Teaching bubbles, branded hero sections</span>
          </div>
        </div>
      </section>

      <div className={styles.nav}>
        <Link to="/learn/color-groups" className={styles.prevLink}>
          &larr; Color Groups
        </Link>
        <Link to="/learn/styling-components" className={styles.nextLink}>
          Next: Styling Components &rarr;
        </Link>
      </div>
    </article>
  );
}
