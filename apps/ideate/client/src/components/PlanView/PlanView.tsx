import { useState, useCallback, useMemo } from 'react';
import { Spinner } from '@ui-kit/react';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';
import { CheckIcon } from '@ui-kit/icons/CheckIcon';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { WarningIcon } from '@ui-kit/icons/WarningIcon';
import type { IdeaPlan, PlanPhase, PlanTask } from '../../types/idea';
import styles from './PlanView.module.css';

export interface PlanViewProps {
  /** The plan to display */
  plan: IdeaPlan | null;
  /** Currently executing phase ID */
  currentPhaseId?: string;
  /** Currently executing task ID */
  currentTaskId?: string;
  /** Whether to show the working directory */
  showWorkingDirectory?: boolean;
  /** Callback when a phase is toggled */
  onPhaseToggle?: (phaseId: string, expanded: boolean) => void;
  /** Callback when a task checkbox is clicked (for manual completion) */
  onTaskClick?: (taskId: string, phaseId: string) => void;
  /** Callback when working directory is clicked to open in VSCode */
  onOpenWorkingDirectory?: (path: string) => void;
  /** Whether tasks are interactive (clickable) */
  interactiveTasks?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * Get the status of a phase based on its tasks
 */
function getPhaseStatus(phase: PlanPhase, currentPhaseId?: string): 'pending' | 'inProgress' | 'completed' {
  const allCompleted = phase.tasks.every(t => t.completed);
  const anyInProgress = phase.tasks.some(t => t.inProgress);
  const isCurrentPhase = phase.id === currentPhaseId;

  if (allCompleted) return 'completed';
  if (anyInProgress || isCurrentPhase) return 'inProgress';
  return 'pending';
}

/**
 * Calculate progress percentage for a phase
 */
function getPhaseProgress(phase: PlanPhase): number {
  if (phase.tasks.length === 0) return 0;
  const completed = phase.tasks.filter(t => t.completed).length;
  return Math.round((completed / phase.tasks.length) * 100);
}

/**
 * Calculate overall plan progress
 */
function getPlanProgress(phases: PlanPhase[]): number {
  const totalTasks = phases.reduce((sum, p) => sum + p.tasks.length, 0);
  if (totalTasks === 0) return 0;
  const completedTasks = phases.reduce((sum, p) => sum + p.tasks.filter(t => t.completed).length, 0);
  return Math.round((completedTasks / totalTasks) * 100);
}

/**
 * PlanView component
 *
 * Displays an implementation plan with collapsible phases and task checkboxes.
 * Shows progress indicators and highlights currently executing items.
 */
export function PlanView({
  plan,
  currentPhaseId,
  currentTaskId,
  showWorkingDirectory = true,
  onPhaseToggle,
  onTaskClick,
  onOpenWorkingDirectory,
  interactiveTasks = false,
  className,
}: PlanViewProps) {
  // Track expanded phases (default: expand current or first phase)
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(() => {
    if (!plan) return new Set();
    const initial = new Set<string>();
    // Expand current phase, or first phase if none specified
    if (currentPhaseId && plan.phases.some(p => p.id === currentPhaseId)) {
      initial.add(currentPhaseId);
    } else if (plan.phases.length > 0) {
      initial.add(plan.phases[0].id);
    }
    return initial;
  });

  const handlePhaseClick = useCallback((phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      const isExpanded = next.has(phaseId);
      if (isExpanded) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      onPhaseToggle?.(phaseId, !isExpanded);
      return next;
    });
  }, [onPhaseToggle]);

  const handleTaskClick = useCallback((taskId: string, phaseId: string) => {
    if (interactiveTasks && onTaskClick) {
      onTaskClick(taskId, phaseId);
    }
  }, [interactiveTasks, onTaskClick]);

  const overallProgress = useMemo(() => {
    if (!plan) return 0;
    return getPlanProgress(plan.phases);
  }, [plan]);

  if (!plan) {
    return (
      <div className={`${styles.planView} ${className || ''}`}>
        <div className={styles.emptyState}>
          <h3>No Tasks Yet</h3>
          <p>Ask the Plan Agent to generate tasks for implementing this idea.</p>
        </div>
      </div>
    );
  }

  if (plan.phases.length === 0) {
    return (
      <div className={`${styles.planView} ${className || ''}`}>
        <div className={styles.emptyState}>
          <h3>No Tasks Yet</h3>
          <p>Ask the Plan Agent to generate tasks for implementing this idea.</p>
        </div>
      </div>
    );
  }

  const handleWorkingDirectoryClick = useCallback(() => {
    if (plan?.workingDirectory && onOpenWorkingDirectory) {
      onOpenWorkingDirectory(plan.workingDirectory);
    }
  }, [plan?.workingDirectory, onOpenWorkingDirectory]);

  return (
    <div className={`${styles.planView} ${className || ''}`}>
      {/* Working Directory - at top for visibility */}
      {showWorkingDirectory && (
        <button
          type="button"
          className={styles.workingDirectoryButton}
          onClick={handleWorkingDirectoryClick}
          title={plan.workingDirectory ? `Open ${plan.workingDirectory} in VS Code` : 'Working directory not set'}
          disabled={!onOpenWorkingDirectory || !plan.workingDirectory}
        >
          <FolderIcon size={16} />
          <span className={styles.workingDirectoryLabel}>Working Directory</span>
          <span className={styles.workingDirectoryPath}>
            {plan.workingDirectory || <em style={{ opacity: 0.5 }}>Not set - ask Plan Agent to set the working directory</em>}
          </span>
        </button>
      )}

      {/* Overall progress */}
      <div className={styles.progressBar}>
        <div
          className={`${styles.progressFill} ${overallProgress === 100 ? styles.completed : ''}`}
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Phases */}
      {plan.phases.map((phase, index) => {
        const isExpanded = expandedPhases.has(phase.id);
        const status = getPhaseStatus(phase, currentPhaseId);
        const progress = getPhaseProgress(phase);
        const isActive = phase.id === currentPhaseId;

        return (
          <div
            key={phase.id}
            className={`${styles.phase} ${isExpanded ? styles.expanded : ''} ${isActive ? styles.isActive : ''}`}
          >
            {/* Phase header */}
            <div
              className={styles.phaseHeader}
              onClick={() => handlePhaseClick(phase.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePhaseClick(phase.id);
                }
              }}
              aria-expanded={isExpanded}
            >
              <div className={styles.expandIcon}>
                <ChevronRightIcon size={16} />
              </div>
              <div className={styles.phaseInfo}>
                <div className={styles.phaseTitle}>
                  <span className={styles.phaseNumber}>{index + 1}</span>
                  <span className={styles.phaseTitleText}>{phase.title}</span>
                </div>
                <div className={styles.phaseProgress}>
                  {progress}% complete ({phase.tasks.filter(t => t.completed).length}/{phase.tasks.length} tasks)
                </div>
              </div>
              <div className={styles.phaseStatus}>
                <span className={`${styles.statusBadge} ${styles[status]}`}>
                  {status === 'pending' && 'Pending'}
                  {status === 'inProgress' && 'In Progress'}
                  {status === 'completed' && 'Completed'}
                </span>
                {status === 'inProgress' && <Spinner size="sm" />}
              </div>
            </div>

            {/* Task list */}
            {isExpanded && (
              <div className={styles.taskList}>
                {phase.tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    phaseId={phase.id}
                    isActive={task.id === currentTaskId}
                    interactive={interactiveTasks}
                    onClick={handleTaskClick}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Repository info (if present) */}
      {showWorkingDirectory && (plan.repositoryUrl || plan.isClone) && (
        <div className={styles.executionContext}>
          {plan.repositoryUrl && (
            <div className={styles.executionContextRow}>
              <span className={styles.executionContextIcon}><LinkIcon size={16} /></span>
              <span className={styles.executionContextLabel}>Repository</span>
              <a
                href={plan.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.executionContextLink}
                title={plan.repositoryUrl}
              >
                {plan.repositoryUrl}
              </a>
            </div>
          )}
          {plan.branch && (
            <div className={styles.executionContextRow}>
              <span className={styles.executionContextIcon}><CodeIcon size={16} /></span>
              <span className={styles.executionContextLabel}>Branch</span>
              <span className={styles.executionContextValue}>
                {plan.branch}
              </span>
            </div>
          )}
          {plan.isClone && (
            <div className={styles.executionContextWarning}>
              <WarningIcon size={14} />
              <span>Repository needs to be cloned before execution</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TaskItemProps {
  task: PlanTask;
  phaseId: string;
  isActive: boolean;
  interactive: boolean;
  onClick: (taskId: string, phaseId: string) => void;
}

function TaskItem({ task, phaseId, isActive, interactive, onClick }: TaskItemProps) {
  const statusClass = task.completed ? styles.completed : task.inProgress ? styles.inProgress : '';

  return (
    <div
      className={`${styles.task} ${statusClass} ${isActive ? styles.isActive : ''}`}
      onClick={interactive ? () => onClick(task.id, phaseId) : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(task.id, phaseId);
        }
      } : undefined}
      style={{ cursor: interactive ? 'pointer' : 'default' }}
    >
      <div className={styles.taskCheckbox}>
        {task.completed && <CheckIcon size={12} />}
      </div>
      <div className={styles.taskContent}>
        <span className={styles.taskTitle}>{task.title}</span>
      </div>
      {(task.inProgress || isActive) && !task.completed && (
        <div className={styles.taskSpinner}>
          <Spinner size="sm" />
        </div>
      )}
    </div>
  );
}

PlanView.displayName = 'PlanView';

export default PlanView;
