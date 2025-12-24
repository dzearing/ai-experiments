import { useState, useEffect, useRef } from 'react';
import { Spinner, ShimmerText } from '@ui-kit/react';
import styles from './ThinkingIndicator.module.css';

// Progress verbs that cycle randomly
const PROGRESS_VERBS = [
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

interface ThinkingIndicatorProps {
  /** Whether the indicator is active */
  isActive: boolean;
}

/**
 * ThinkingIndicator component
 *
 * Shows an animated progress indicator while the AI is thinking.
 * Displays cycling progress verbs, elapsed time, and escape hint.
 */
export function ThinkingIndicator({ isActive }: ThinkingIndicatorProps) {
  const [currentVerb, setCurrentVerb] = useState(PROGRESS_VERBS[0]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const verbIndexRef = useRef(0);

  // Reset and start timer when becoming active
  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      setElapsedSeconds(0);
      // Pick a random starting verb
      verbIndexRef.current = Math.floor(Math.random() * PROGRESS_VERBS.length);
      setCurrentVerb(PROGRESS_VERBS[verbIndexRef.current]);
    }
  }, [isActive]);

  // Update elapsed time every second
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  // Cycle through verbs every 2-4 seconds
  useEffect(() => {
    if (!isActive) return;

    const cycleVerb = () => {
      verbIndexRef.current = (verbIndexRef.current + 1) % PROGRESS_VERBS.length;
      setCurrentVerb(PROGRESS_VERBS[verbIndexRef.current]);
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
  }, [isActive]);

  if (!isActive) return null;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className={styles.container}>
      <span className={styles.spinner}>
        <Spinner size="sm" />
      </span>
      <ShimmerText isActive durationRange={[600, 1200]}>
        <span className={styles.verb}>{currentVerb}...</span>
      </ShimmerText>
      <span className={styles.details}>
        (esc to interrupt · {formatTime(elapsedSeconds)})
      </span>
    </div>
  );
}

export default ThinkingIndicator;
