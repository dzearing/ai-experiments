import { type HTMLAttributes, type ReactNode } from 'react';
import styles from './Stepper.module.css';

/**
 * Stepper - Visual indicator for multi-step processes with labels
 *
 * Shows a sequence of numbered or labeled steps with connectors. Each step
 * can be completed, current, pending, or in error state. Supports both
 * horizontal and vertical orientations.
 *
 * Surfaces used:
 * - soft (pending steps)
 * - primary (completed and current steps)
 * - danger (error state)
 *
 * Tokens used:
 * - --soft-bg, --soft-fg, --soft-border (pending step)
 * - --primary-bg, --primary-fg (completed/current step)
 * - --danger-bg, --danger-fg (error step)
 * - --base-fg, --base-fg-soft (labels)
 * - --space-1, --space-2, --space-3, --space-4 (spacing)
 * - --radius-full (step indicator shape)
 * - --duration-fast, --ease-default (transitions)
 * - --focus-ring, --focus-ring-width, --focus-ring-offset (focus state)
 */

export type StepperOrientation = 'horizontal' | 'vertical';
export type StepperSize = 'sm' | 'md' | 'lg';
export type StepStatus = 'pending' | 'current' | 'complete' | 'error';

export interface StepItem {
  /** Step label */
  label: string;
  /** Optional description shown below the label */
  description?: string;
  /** Optional icon to show instead of the step number */
  icon?: ReactNode;
  /** Step status override (defaults to auto-calculated based on current) */
  status?: StepStatus;
  /** Whether this step is disabled */
  disabled?: boolean;
}

export interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  /** Array of step items */
  steps: StepItem[];
  /** Current step index (0-based) */
  current: number;
  /** Orientation of the stepper */
  orientation?: StepperOrientation;
  /** Size of the step indicators */
  size?: StepperSize;
  /** Whether steps are clickable for navigation */
  clickable?: boolean;
  /** Callback when a step is clicked (only when clickable) */
  onStepClick?: (stepIndex: number) => void;
  /** Whether to show step numbers */
  showNumbers?: boolean;
  /** Show only completed checkmark, hide numbers */
  showCheckOnComplete?: boolean;
  /** Accessible label for the stepper */
  'aria-label'?: string;
}

export function Stepper({
  steps,
  current,
  orientation = 'horizontal',
  size = 'md',
  clickable = false,
  onStepClick,
  showNumbers = true,
  showCheckOnComplete = true,
  className,
  'aria-label': ariaLabel = 'Progress steps',
  ...props
}: StepperProps) {
  const classNames = [styles.root, styles[orientation], styles[size], className]
    .filter(Boolean)
    .join(' ');

  const getStepStatus = (index: number, step: StepItem): StepStatus => {
    if (step.status) {
      return step.status;
    }

    if (index < current) {
      return 'complete';
    }

    if (index === current) {
      return 'current';
    }

    return 'pending';
  };

  const handleStepClick = (index: number, step: StepItem) => {
    if (clickable && !step.disabled && onStepClick) {
      onStepClick(index);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent,
    index: number,
    step: StepItem
  ) => {
    if (clickable && !step.disabled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onStepClick?.(index);
    }
  };

  return (
    <div
      className={classNames}
      role="list"
      aria-label={ariaLabel}
      {...props}
    >
      {steps.map((step, index) => {
        const status = getStepStatus(index, step);
        const isClickable = clickable && !step.disabled;
        const isFirst = index === 0;
        const isLast = index === steps.length - 1;

        // For horizontal: connector BEFORE this step, colored if previous step is complete
        // For vertical: connector AFTER this step, colored if this step is complete
        const prevStatus = index > 0 ? getStepStatus(index - 1, steps[index - 1]) : null;
        const connectorComplete = orientation === 'vertical'
          ? status === 'complete'
          : prevStatus === 'complete';

        // Determine if this step should show a connector
        // Horizontal: all except first (connector goes left to previous)
        // Vertical: all except last (connector goes down to next)
        const showConnector = orientation === 'vertical' ? !isLast : !isFirst;

        const stepClassNames = [
          styles.step,
          styles[status],
          isClickable && styles.clickable,
          step.disabled && styles.disabled,
        ]
          .filter(Boolean)
          .join(' ');

        const connectorClassNames = [
          styles.connector,
          connectorComplete && styles.connectorComplete,
        ]
          .filter(Boolean)
          .join(' ');

        const indicatorContent = (() => {
          if (step.icon) {
            return step.icon;
          }

          if (showCheckOnComplete && status === 'complete') {
            return (
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2.5 6L5 8.5L9.5 3.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            );
          }

          if (showNumbers) {
            return index + 1;
          }

          return null;
        })();

        return (
          <div
            key={index}
            className={stepClassNames}
            role="listitem"
            aria-current={status === 'current' ? 'step' : undefined}
          >
            {/* Horizontal connector - before indicator (connects to previous step) */}
            {orientation === 'horizontal' && showConnector && (
              <div className={connectorClassNames} aria-hidden="true" />
            )}

            {/* Step indicator */}
            <div
              className={styles.indicator}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onClick={() => handleStepClick(index, step)}
              onKeyDown={(e) => handleKeyDown(e, index, step)}
              aria-disabled={step.disabled || undefined}
            >
              {indicatorContent}
            </div>

            {/* Labels */}
            <div className={styles.labels}>
              <span className={styles.label}>{step.label}</span>
              {step.description && (
                <span className={styles.description}>{step.description}</span>
              )}
            </div>

            {/* Vertical connector - after labels (connects to next step) */}
            {orientation === 'vertical' && showConnector && (
              <div className={connectorClassNames} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}

Stepper.displayName = 'Stepper';
