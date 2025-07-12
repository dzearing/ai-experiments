// ProgressComponents.tsx - Example implementations of missing components

import { useEffect, useState, useRef } from 'react';
import styles from './ProgressComponents.module.css';

// ============================================
// ProgressSpinner Component
// ============================================
interface ProgressSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  label?: string;
}

export function ProgressSpinner({ 
  size = 'md', 
  color = 'currentColor',
  className = '',
  label = 'Loading'
}: ProgressSpinnerProps) {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32
  };
  
  const dimension = sizeMap[size];
  
  return (
    <div 
      className={`${styles.spinner} ${styles[size]} ${className}`}
      role="progressbar"
      aria-label={label}
    >
      <svg 
        width={dimension} 
        height={dimension} 
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className={styles.track}
          cx="12"
          cy="12"
          r="10"
          strokeWidth="2"
        />
        <circle
          className={styles.progress}
          cx="12"
          cy="12"
          r="10"
          strokeWidth="2"
          stroke={color}
        />
      </svg>
    </div>
  );
}

// ============================================
// DurationCounter Component
// ============================================
interface DurationCounterProps {
  startTime: Date | number | string;
  endTime?: Date | number | string;
  format?: 'human' | 'mm:ss' | 'hh:mm:ss';
  prefix?: string;
  suffix?: string;
  live?: boolean;
  className?: string;
}

export function DurationCounter({
  startTime,
  endTime,
  format = 'human',
  prefix = '',
  suffix = '',
  live = true,
  className = ''
}: DurationCounterProps) {
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timer>();

  useEffect(() => {
    const calculateDuration = () => {
      const start = new Date(startTime).getTime();
      const end = endTime ? new Date(endTime).getTime() : Date.now();
      return Math.max(0, end - start);
    };

    // Set initial duration
    setDuration(calculateDuration());

    // Update live if needed
    if (live && !endTime) {
      intervalRef.current = setInterval(() => {
        setDuration(calculateDuration());
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startTime, endTime, live]);

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    switch (format) {
      case 'mm:ss':
        return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
      
      case 'hh:mm:ss':
        return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
      
      case 'human':
      default:
        if (hours > 0) {
          return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
          return `${minutes}m ${seconds % 60}s`;
        } else {
          return `${seconds}s`;
        }
    }
  };

  return (
    <span 
      className={`${styles.counter} ${className}`}
      role="timer"
      aria-live={live ? 'polite' : 'off'}
    >
      {prefix}{formatDuration(duration)}{suffix}
    </span>
  );
}

// ============================================
// ProgressBar Component
// ============================================
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  indeterminate?: boolean;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  size = 'md',
  variant = 'default',
  indeterminate = false,
  showPercentage = false,
  className = ''
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div 
      className={`${styles.progressBar} ${styles[size]} ${className}`}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div className={styles.track}>
        <div 
          className={`${styles.fill} ${styles[variant]} ${indeterminate ? styles.indeterminate : ''}`}
          style={!indeterminate ? { width: `${percentage}%` } : undefined}
        />
      </div>
      {showPercentage && !indeterminate && (
        <span className={styles.percentage}>{Math.round(percentage)}%</span>
      )}
    </div>
  );
}

// ============================================
// Toast Component
// ============================================
interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  closable?: boolean;
  onClose?: () => void;
}

export function Toast({
  title,
  description,
  variant = 'default',
  action,
  closable = true,
  onClose
}: ToastProps) {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i',
    default: null
  };

  return (
    <div className={`${styles.toast} ${styles[variant]}`}>
      {icons[variant] && (
        <div className={styles.icon}>
          {icons[variant]}
        </div>
      )}
      
      <div className={styles.content}>
        <div className={styles.title}>{title}</div>
        {description && (
          <div className={styles.description}>{description}</div>
        )}
      </div>
      
      {action && (
        <button
          className={styles.action}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
      
      {closable && (
        <button
          className={styles.close}
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ============================================
// Example Usage
// ============================================
export function ExampleUsage() {
  const [progress, setProgress] = useState(0);
  const startTime = new Date();

  // Simulate progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.min(100, p + 10));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 p-4">
      {/* Progress Spinner Examples */}
      <div>
        <h3>Progress Spinners</h3>
        <div className="flex gap-4">
          <ProgressSpinner size="sm" />
          <ProgressSpinner size="md" />
          <ProgressSpinner size="lg" color="#3b82f6" />
        </div>
      </div>

      {/* Duration Counter Examples */}
      <div>
        <h3>Duration Counters</h3>
        <div className="flex flex-col gap-2">
          <DurationCounter 
            startTime={startTime} 
            format="human" 
            prefix="Elapsed: "
          />
          <DurationCounter 
            startTime={startTime} 
            format="mm:ss"
            prefix="Timer: "
          />
          <DurationCounter 
            startTime={startTime} 
            format="hh:mm:ss"
          />
        </div>
      </div>

      {/* Progress Bar Examples */}
      <div>
        <h3>Progress Bars</h3>
        <div className="space-y-2">
          <ProgressBar 
            value={progress} 
            showPercentage 
            label="Upload progress"
          />
          <ProgressBar 
            value={75} 
            variant="success" 
            size="sm"
          />
          <ProgressBar 
            value={50} 
            variant="warning" 
            size="lg"
          />
          <ProgressBar 
            indeterminate 
            variant="default"
            label="Loading..."
          />
        </div>
      </div>

      {/* Toast Examples */}
      <div>
        <h3>Toast Notifications</h3>
        <div className="space-y-2">
          <Toast
            id="1"
            title="Changes saved"
            variant="success"
          />
          <Toast
            id="2"
            title="Error occurred"
            description="Failed to save changes. Please try again."
            variant="error"
            action={{
              label: "Retry",
              onClick: () => console.log('Retry')
            }}
          />
        </div>
      </div>
    </div>
  );
}