import styles from './WelcomeMessage.module.css';

/**
 * WelcomeMessage displays a friendly empty state for the chat interface.
 */
export function WelcomeMessage() {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Claude Code Web</h2>
      <p className={styles.subtitle}>
        Ask me anything about code, files, or projects
      </p>
      <div className={styles.hints}>
        <span className={styles.hint}>
          <kbd className={styles.key}>Enter</kbd> to send
        </span>
        <span className={styles.hint}>
          <kbd className={styles.key}>Shift+Enter</kbd> for newline
        </span>
      </div>
    </div>
  );
}
