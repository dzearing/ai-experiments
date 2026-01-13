import { useState, useEffect, useRef } from 'react';
import { Spinner, ShimmerText } from '@ui-kit/react';
import styles from './ThinkingIndicator.module.css';

// Progress verbs that cycle randomly
const DEFAULT_PROGRESS_VERBS = [
  'Thinking',
  'Puzzling',
  'Pondering',
  'Analyzing',
  'Processing',
  'Considering',
  'Reasoning',
  'Exploring',
  'Examining',
  'Contemplating',
  'Evaluating',
  'Reflecting',
  'Working',
  'Computing',
  'Deliberating',
];

export interface ThinkingIndicatorProps {
  /** Whether the indicator is active */
  isActive: boolean;
  /** Custom progress verbs to cycle through */
  progressVerbs?: string[];
  /** Specific status text that overrides cycling verbs (e.g., "Creating document...") */
  statusText?: string;
  /** Whether to show the escape hint */
  showEscapeHint?: boolean;
  /** Custom escape hint text */
  escapeHintText?: string;
  /** Additional class name */
  className?: string;
}

/**
 * ThinkingIndicator component
 *
 * Shows an animated progress indicator while the AI is thinking.
 * Displays cycling progress verbs, elapsed time, and escape hint.
 */
export function ThinkingIndicator({
  isActive,
  progressVerbs = DEFAULT_PROGRESS_VERBS,
  statusText,
  showEscapeHint = true,
  escapeHintText = '⌘C to interrupt',
  className,
}: ThinkingIndicatorProps) {
  const [currentVerb, setCurrentVerb] = useState(progressVerbs[0]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const verbIndexRef = useRef(0);

  // Reset and start timer when becoming active
  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      setElapsedSeconds(0);
      // Pick a random starting verb
      verbIndexRef.current = Math.floor(Math.random() * progressVerbs.length);
      setCurrentVerb(progressVerbs[verbIndexRef.current]);
    }
  }, [isActive, progressVerbs]);

  // Update elapsed time every second
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  // Cycle through verbs every 2-4 seconds (only when no specific statusText)
  useEffect(() => {
    // Don't cycle when we have specific status text
    if (!isActive || statusText) return;

    const cycleVerb = () => {
      verbIndexRef.current = (verbIndexRef.current + 1) % progressVerbs.length;
      setCurrentVerb(progressVerbs[verbIndexRef.current]);
    };

    // Random interval between 2-4 seconds
    const scheduleNext = () => {
      const delay = 2000 + Math.random() * 2000;
      return setTimeout(() => {
        cycleVerb();
        timeoutRef = scheduleNext();
      }, delay);
    };

    let timeoutRef = scheduleNext();

    return () => clearTimeout(timeoutRef);
  }, [isActive, progressVerbs, statusText]);

  if (!isActive) return null;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const containerClassName = className
    ? `${styles.container} ${className}`
    : styles.container;

  // Use specific statusText if provided, otherwise use cycling verb
  const displayText = statusText || `${currentVerb}...`;

  return (
    <div className={containerClassName}>
      <span className={styles.spinner}>
        <Spinner size="sm" />
      </span>
      <ShimmerText isActive durationRange={[600, 1200]}>
        <span className={styles.verb}>{displayText}</span>
      </ShimmerText>
      <span className={styles.details}>
        ({showEscapeHint && `${escapeHintText} · `}{formatTime(elapsedSeconds)})
      </span>
    </div>
  );
}

ThinkingIndicator.displayName = 'ThinkingIndicator';

export default ThinkingIndicator;
