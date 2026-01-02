import { useState, useEffect } from 'react';
import { Spinner, Text } from '@ui-kit/react';
import styles from './DelayedSpinner.module.css';

export interface DelayedSpinnerProps {
  /** Whether loading is in progress */
  loading: boolean;
  /** Delay in ms before showing spinner (default: 200) */
  delay?: number;
  /** Optional loading message */
  message?: string;
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

/**
 * A spinner that only appears after a delay, preventing flash for fast operations.
 */
export function DelayedSpinner({
  loading,
  delay = 200,
  message,
  size = 'sm',
  className,
}: DelayedSpinnerProps) {
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShowSpinner(true), delay);
      return () => clearTimeout(timer);
    }
    setShowSpinner(false);
  }, [loading, delay]);

  if (!loading || !showSpinner) {
    return null;
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <Spinner size={size} />
      {message && <Text size="sm" color="soft">{message}</Text>}
    </div>
  );
}
