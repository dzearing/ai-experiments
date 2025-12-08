import styles from './Spinner.module.css';

/**
 * Spinner component - loading indicator
 *
 * Tokens used:
 * - --controlPrimary-bg
 * - --body-text-soft
 */

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface SpinnerProps {
  /** Spinner size */
  size?: SpinnerSize;
  /** Accessible label */
  label?: string;
  /** Use current text color */
  inherit?: boolean;
}

export function Spinner({ size = 'md', label = 'Loading', inherit = false }: SpinnerProps) {
  return (
    <div className={`${styles.spinner} ${styles[size]} ${inherit ? styles.inherit : ''}`} role="status" aria-label={label}>
      <svg viewBox="0 0 24 24" fill="none" className={styles.svg}>
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          className={styles.track}
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className={styles.arc}
        />
      </svg>
      <span className={styles.srOnly}>{label}</span>
    </div>
  );
}
