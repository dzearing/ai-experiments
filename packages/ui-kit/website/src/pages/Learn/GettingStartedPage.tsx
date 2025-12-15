import { Link } from 'react-router-dom';
import styles from './LessonPage.module.css';

export function GettingStartedPage() {
  return (
    <article className={styles.lesson}>
      <div className={styles.header}>
        <span className={styles.lessonNumber}>Lesson 1</span>
        <h1 className={styles.title}>Getting Started</h1>
        <p className={styles.subtitle}>
          Set up UI-Kit in your Vite project with zero-flash theme loading.
        </p>
      </div>

      <section className={styles.section}>
        <h2>Installation</h2>
        <p>
          UI-Kit provides a Vite plugin that handles everything automatically:
          theme detection, CSS loading, persistence, and zero-flash loading.
        </p>
        <pre className={styles.code}>{`npm install @ui-kit/core`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Add the Vite Plugin</h2>
        <p>
          Add the UI-Kit plugin to your Vite config. That&apos;s it!
        </p>
        <pre className={styles.code}>{`// vite.config.ts
import { defineConfig } from 'vite';
import { uikit } from '@ui-kit/core/vite';

export default defineConfig({
  plugins: [uikit()]
});`}</pre>
        <p>The plugin automatically:</p>
        <ul>
          <li>Injects the bootstrap script into your HTML (zero-flash)</li>
          <li>Copies theme CSS files to your public directory</li>
          <li>Detects system light/dark preference</li>
          <li>Persists user preferences to localStorage</li>
          <li>Loads only the CSS needed for the current theme</li>
          <li>Exposes the <code>window.UIKit</code> API for runtime changes</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Plugin Options</h2>
        <p>Customize the plugin behavior with options:</p>
        <pre className={styles.code}>{`uikit({
  // Where themes are served from (default: '/themes')
  themesPath: '/assets/themes',

  // Default theme when no preference stored (default: 'default')
  defaultTheme: 'github',

  // Background colors for flash prevention
  defaultBg: { light: '#ffffff', dark: '#121212' },

  // Whether to copy theme files (default: true)
  // Set false if serving from CDN
  copyThemes: true,

  // Where to copy themes (default: 'public/themes')
  themesOutputDir: 'public/assets/themes',
})`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Using Design Tokens</h2>
        <p>Now you can use the design tokens in your CSS:</p>
        <pre className={styles.code}>{`.my-card {
  background: var(--card-bg);
  color: var(--card-text);
  border: 1px solid var(--card-border);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--card-shadow);
}`}</pre>
        <p>
          The card automatically adapts to light/dark mode and any theme.
          No additional CSS or JavaScript required!
        </p>
      </section>

      <section className={styles.section}>
        <h2>Changing Themes at Runtime</h2>
        <p>
          Use the global <code>UIKit</code> API to change themes programmatically:
        </p>
        <pre className={styles.code}>{`// Change theme (CSS loads on demand)
UIKit.setTheme('github', 'dark', (state) => {
  console.log('Theme loaded:', state);
  // { theme: 'github', mode: 'dark', resolvedMode: 'dark' }
});

// Get current theme
const { theme, mode, resolvedMode } = UIKit.getTheme();

// Subscribe to theme changes
const unsubscribe = UIKit.subscribe((state) => {
  console.log('Theme changed:', state);
});

// Later: unsubscribe when done
unsubscribe();`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Available Modes</h2>
        <p>The <code>mode</code> parameter can be:</p>
        <ul>
          <li><code>&apos;light&apos;</code> - Always use light mode</li>
          <li><code>&apos;dark&apos;</code> - Always use dark mode</li>
          <li><code>&apos;auto&apos;</code> - Follow system preference (default)</li>
        </ul>
        <pre className={styles.code}>{`// Follow system preference
UIKit.setTheme('default', 'auto');

// Force dark mode
UIKit.setTheme('terminal', 'dark');

// Force light mode
UIKit.setTheme('minimal', 'light');`}</pre>
      </section>

      <section className={styles.section}>
        <h2>Without Vite</h2>
        <p>
          If you&apos;re not using Vite, you can import the bootstrap directly in your entry file:
        </p>
        <pre className={styles.code}>{`// main.ts - import at the very top
import '@ui-kit/core/bootstrap.js';

// Rest of your app...`}</pre>
        <p>
          Note: This approach may cause a brief flash on initial load since the script
          runs after the page starts rendering. For true zero-flash loading, see
          the manual inline approach in the Advanced section.
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
