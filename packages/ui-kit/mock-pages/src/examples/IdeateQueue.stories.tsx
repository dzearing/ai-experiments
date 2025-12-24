import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Button,
  Card,
  Chip,
  Divider,
  Heading,
  IconButton,
  Progress,
  Segmented,
  Select,
  Text,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionContent,
  Spinner,
  ShimmerText,
  RelativeTime,
} from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { ChevronUpIcon } from '@ui-kit/icons/ChevronUpIcon';
import { ClockIcon } from '@ui-kit/icons/ClockIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { ErrorCircleIcon } from '@ui-kit/icons/ErrorCircleIcon';
import { ExpandIcon } from '@ui-kit/icons/ExpandIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { PauseIcon } from '@ui-kit/icons/PauseIcon';
import { PlayIcon } from '@ui-kit/icons/PlayIcon';
import { RefreshIcon } from '@ui-kit/icons/RefreshIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { UserIcon } from '@ui-kit/icons/UserIcon';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import { HourglassIcon } from '@ui-kit/icons/HourglassIcon';
import styles from './IdeateQueue.module.css';

/**
 * # Ideate Queue
 *
 * Execution queue for AI and human tasks in the Ideate project management app.
 * Tasks can come from plans or be created directly. Clear visual distinction
 * between AI-executable tasks and human tasks.
 *
 * ## Component Gap Analysis
 *
 * Components that would improve this implementation:
 *
 * 1. **ExecutionProgress** - Specialized progress with elapsed time, ETA, and live output preview
 * 2. **TaskTypeBadge** - Consistent AI/Human visual badge with icon
 * 3. **PrioritySlider** - Visual priority control with color coding
 * 4. **QueueItemCard** - Standardized queue item with all metadata
 * 5. **LiveOutput** - Streaming code/log output display
 */

// ============================================
// DATA TYPES
// ============================================

type QueueItemStatus = 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
type TaskType = 'ai-task' | 'human-task';

interface QueueItem {
  id: string;
  planId?: string;
  planTitle?: string;
  stepNumber?: number;
  totalSteps?: number;
  title: string;
  description?: string;
  type: TaskType;
  status: QueueItemStatus;
  priority: number;
  estimatedMinutes?: number;
  startedAt?: Date;
  completedAt?: Date;
  elapsedSeconds?: number;
  output?: string;
  result?: {
    success: boolean;
    filesChanged?: string[];
    error?: string;
  };
  createdAt: Date;
}

// ============================================
// SAMPLE DATA
// ============================================

const sampleQueueItems: QueueItem[] = [
  {
    id: '1',
    planId: 'plan-1',
    planTitle: 'Backend Authentication',
    stepNumber: 2,
    totalSteps: 5,
    title: 'Set up database migrations',
    description: 'Create migration scripts for user and session tables based on the schema defined in the plan.',
    type: 'ai-task',
    status: 'queued',
    priority: 85,
    estimatedMinutes: 15,
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    planId: 'plan-2',
    planTitle: 'API Design',
    stepNumber: 1,
    totalSteps: 3,
    title: 'Review API design document',
    description: 'Review the proposed API endpoints and provide feedback on naming conventions and response formats.',
    type: 'human-task',
    status: 'queued',
    priority: 72,
    estimatedMinutes: 30,
    createdAt: new Date(Date.now() - 7200000),
  },
  {
    id: '3',
    title: 'Generate test fixtures',
    description: 'Create mock data fixtures for unit and integration tests.',
    type: 'ai-task',
    status: 'queued',
    priority: 45,
    estimatedMinutes: 10,
    createdAt: new Date(Date.now() - 1800000),
  },
  {
    id: '4',
    planId: 'plan-1',
    planTitle: 'Backend Authentication',
    stepNumber: 3,
    totalSteps: 5,
    title: 'Implement JWT token handling',
    description: 'Add JWT generation, validation, and refresh token logic.',
    type: 'ai-task',
    status: 'queued',
    priority: 60,
    estimatedMinutes: 20,
    createdAt: new Date(Date.now() - 900000),
  },
  {
    id: '5',
    title: 'Update README with setup instructions',
    description: 'Document the new authentication setup process for developers.',
    type: 'human-task',
    status: 'queued',
    priority: 30,
    estimatedMinutes: 15,
    createdAt: new Date(Date.now() - 600000),
  },
];

const runningItem: QueueItem = {
  id: 'running-1',
  planId: 'plan-1',
  planTitle: 'Backend Authentication',
  stepNumber: 1,
  totalSteps: 5,
  title: 'Set up auth routes and middleware',
  description: 'Create Express routes for login, logout, and registration. Add authentication middleware.',
  type: 'ai-task',
  status: 'running',
  priority: 90,
  estimatedMinutes: 12,
  startedAt: new Date(Date.now() - 180000),
  elapsedSeconds: 180,
  output: `Creating auth routes...
✓ Created /api/auth/login
✓ Created /api/auth/logout
✓ Created /api/auth/register
Setting up middleware...`,
  createdAt: new Date(Date.now() - 3600000),
};

const completedItems: QueueItem[] = [
  {
    id: 'completed-1',
    title: 'Initialize project structure',
    type: 'ai-task',
    status: 'completed',
    priority: 100,
    completedAt: new Date(Date.now() - 7200000),
    result: { success: true, filesChanged: ['src/index.ts', 'package.json'] },
    createdAt: new Date(Date.now() - 10800000),
  },
  {
    id: 'completed-2',
    title: 'Set up ESLint configuration',
    type: 'ai-task',
    status: 'completed',
    priority: 80,
    completedAt: new Date(Date.now() - 5400000),
    result: { success: true, filesChanged: ['.eslintrc.js'] },
    createdAt: new Date(Date.now() - 9000000),
  },
  {
    id: 'completed-3',
    title: 'Review project requirements',
    type: 'human-task',
    status: 'completed',
    priority: 90,
    completedAt: new Date(Date.now() - 3600000),
    result: { success: true },
    createdAt: new Date(Date.now() - 7200000),
  },
  {
    id: 'failed-1',
    title: 'Connect to legacy API',
    type: 'ai-task',
    status: 'failed',
    priority: 70,
    completedAt: new Date(Date.now() - 1800000),
    result: { success: false, error: 'Connection timeout after 30s' },
    createdAt: new Date(Date.now() - 5400000),
  },
];

// ============================================
// HELPER COMPONENTS
// ============================================

function TaskTypeBadge({ type }: { type: TaskType }) {
  const isAI = type === 'ai-task';
  return (
    <span className={`${styles.taskTypeBadge} ${isAI ? styles.ai : styles.human}`}>
      {isAI ? <StarIcon /> : <UserIcon />}
      {isAI ? 'AI' : 'Human'}
    </span>
  );
}

function PriorityIndicator({ priority }: { priority: number }) {
  const level = priority >= 70 ? 'high' : priority >= 40 ? 'medium' : 'low';
  return (
    <div className={styles.priorityIndicator}>
      <div className={styles.priorityBar}>
        <div
          className={`${styles.priorityFill} ${styles[level]}`}
          style={{ width: `${priority}%` }}
        />
      </div>
      <Text size="small" color="secondary">{priority}</Text>
    </div>
  );
}

function formatElapsedTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function QueueItemCard({
  item,
  position,
  onStart,
  onPause,
  onEdit,
  onRemove,
}: {
  item: QueueItem;
  position?: number;
  onStart?: () => void;
  onPause?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  const isRunning = item.status === 'running';
  const isPaused = item.status === 'paused';

  return (
    <div
      className={`${styles.queueItem} ${isRunning ? styles.queueItemRunning : ''} ${isPaused ? styles.queueItemPaused : ''}`}
    >
      {position && (
        <div className={`${styles.queuePosition} ${isRunning ? styles.queuePositionRunning : ''}`}>
          {isRunning ? <Spinner size="sm" /> : `#${position}`}
        </div>
      )}

      <div className={styles.queueItemContent}>
        <div className={styles.queueItemHeader}>
          <div className={styles.queueItemTitle}>
            <TaskTypeBadge type={item.type} />
            <Text weight="medium">{item.title}</Text>
          </div>
          <Chip size="sm" variant={isRunning ? 'primary' : isPaused ? 'warning' : 'default'}>
            {item.status}
          </Chip>
        </div>

        {item.description && (
          <Text size="small" color="secondary" className={styles.queueItemDescription}>
            {item.description}
          </Text>
        )}

        <div className={styles.queueItemMeta}>
          {item.planTitle && (
            <span className={styles.queueItemSource}>
              <FileIcon />
              <Text size="small" color="secondary">
                {item.planTitle} {item.stepNumber && `(${item.stepNumber}/${item.totalSteps})`}
              </Text>
            </span>
          )}
          {item.estimatedMinutes && (
            <span className={styles.queueItemEstimate}>
              <ClockIcon />
              <Text size="small" color="secondary">{item.estimatedMinutes} min</Text>
            </span>
          )}
          <PriorityIndicator priority={item.priority} />
        </div>
      </div>

      <div className={styles.queueItemActions}>
        <RelativeTime timestamp={item.createdAt} size="sm" color="soft" />
        <div className={styles.queueItemButtons}>
          {item.status === 'queued' && item.type === 'ai-task' && (
            <IconButton
              variant="primary"
              size="sm"
              icon={<PlayIcon />}
              onClick={onStart}
              aria-label="Start task"
            />
          )}
          {item.status === 'queued' && item.type === 'human-task' && (
            <Button variant="primary" size="sm" onClick={onStart}>
              Mark Complete
            </Button>
          )}
          {isRunning && (
            <IconButton
              variant="default"
              size="sm"
              icon={<PauseIcon />}
              onClick={onPause}
              aria-label="Pause task"
            />
          )}
          <IconButton
            variant="ghost"
            size="sm"
            icon={<EditIcon />}
            onClick={onEdit}
            aria-label="Edit task"
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<TrashIcon />}
            onClick={onRemove}
            aria-label="Remove task"
          />
        </div>
      </div>
    </div>
  );
}

function ExecutionBanner({ item }: { item: QueueItem }) {
  const progressPercent = item.estimatedMinutes && item.elapsedSeconds
    ? Math.min((item.elapsedSeconds / (item.estimatedMinutes * 60)) * 100, 95)
    : 50;

  return (
    <div className={styles.executionBanner}>
      <div className={styles.executionContent}>
        <div className={styles.executionInfo}>
          <div className={styles.executionTitle}>
            <Spinner size="sm" />
            <span>Running: {item.title}</span>
          </div>
          <div className={styles.executionProgress}>
            <div className={styles.progressBar}>
              <Progress value={progressPercent} size="sm" />
            </div>
            <span className={styles.executionTime}>
              {item.elapsedSeconds ? formatElapsedTime(item.elapsedSeconds) : '0s'}
              {item.estimatedMinutes && ` / ~${item.estimatedMinutes}m`}
            </span>
          </div>
          {item.output && (
            <div className={styles.executionOutput}>
              <code>{item.output.split('\n').slice(-3).join('\n')}</code>
            </div>
          )}
        </div>
        <div className={styles.executionActions}>
          <IconButton variant="ghost" icon={<ExpandIcon />} aria-label="Expand output" />
          <IconButton variant="ghost" icon={<PauseIcon />} aria-label="Pause execution" />
          <IconButton variant="ghost" icon={<CloseIcon />} aria-label="Cancel execution" />
        </div>
      </div>
    </div>
  );
}

function CompletedItem({ item }: { item: QueueItem }) {
  const success = item.result?.success ?? false;
  return (
    <div className={`${styles.completedItem} ${success ? styles.completedItemSuccess : styles.completedItemFailed}`}>
      {success ? <CheckCircleIcon /> : <ErrorCircleIcon />}
      <TaskTypeBadge type={item.type} />
      <span className={styles.completedItemTitle}>{item.title}</span>
      {item.completedAt && (
        <span className={styles.completedItemTime}>
          <RelativeTime timestamp={item.completedAt} size="sm" color="soft" />
        </span>
      )}
    </div>
  );
}

function EmptyState({ onAddTask }: { onAddTask?: () => void }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <HourglassIcon />
      </div>
      <Heading level={2} size="h4">No Tasks in Queue</Heading>
      <Text color="secondary" className={styles.emptyDescription}>
        Add tasks from your plans or create standalone tasks to start executing.
        AI tasks run automatically, human tasks require manual completion.
      </Text>
      <div className={styles.emptyActions}>
        <Button variant="primary" icon={<AddIcon />} onClick={onAddTask}>
          Add Task
        </Button>
        <Button variant="default">
          Browse Plans
        </Button>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface IdeateQueueProps {
  queueItems?: QueueItem[];
  runningItem?: QueueItem | null;
  completedItems?: QueueItem[];
  isPaused?: boolean;
  filter?: 'all' | 'ai' | 'human';
}

function IdeateQueueComponent({
  queueItems = [],
  runningItem = null,
  completedItems = [],
  isPaused = false,
  filter: initialFilter = 'all',
}: IdeateQueueProps) {
  const [filter, setFilter] = useState(initialFilter);
  const [showCompleted, setShowCompleted] = useState(false);

  const filteredItems = queueItems.filter((item) => {
    if (filter === 'ai') return item.type === 'ai-task';
    if (filter === 'human') return item.type === 'human-task';
    return true;
  });

  const aiCount = queueItems.filter((i) => i.type === 'ai-task').length;
  const humanCount = queueItems.filter((i) => i.type === 'human-task').length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Heading level={1} size="h4">Execution Queue</Heading>
          <Chip size="sm" variant="default">{queueItems.length} tasks</Chip>
        </div>
        <div className={styles.headerRight}>
          <Button variant="ghost" icon={<RefreshIcon />}>
            Auto-prioritize
          </Button>
          <Button variant={isPaused ? 'warning' : 'default'} icon={isPaused ? <PlayIcon /> : <PauseIcon />}>
            {isPaused ? 'Resume' : 'Pause All'}
          </Button>
          <Button variant="primary" icon={<AddIcon />}>
            Add Task
          </Button>
        </div>
      </header>

      {/* Paused Banner */}
      {isPaused && (
        <div className={styles.pausedBanner}>
          <PauseIcon />
          <Text weight="medium">Queue is paused. No new tasks will start automatically.</Text>
          <Button variant="ghost" size="sm">Resume</Button>
        </div>
      )}

      {/* Active Execution Banner */}
      {runningItem && !isPaused && <ExecutionBanner item={runningItem} />}

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterLeft}>
          <Segmented
            value={filter}
            onChange={(v) => setFilter(v as 'all' | 'ai' | 'human')}
            options={[
              { value: 'all', label: `All (${queueItems.length})` },
              { value: 'ai', label: `AI Tasks (${aiCount})` },
              { value: 'human', label: `Human Tasks (${humanCount})` },
            ]}
          />
        </div>
        <div className={styles.filterRight}>
          <Text size="small" color="secondary">Sort by:</Text>
          <Select
            size="sm"
            value="priority"
            options={[
              { value: 'priority', label: 'Priority' },
              { value: 'created', label: 'Created' },
              { value: 'estimated', label: 'Estimated Time' },
            ]}
          />
        </div>
      </div>

      {/* Queue List */}
      <div className={styles.queueList}>
        {filteredItems.length === 0 ? (
          <EmptyState />
        ) : (
          <div className={styles.queueItems}>
            {filteredItems.map((item, index) => (
              <QueueItemCard key={item.id} item={item} position={index + 1} />
            ))}
          </div>
        )}
      </div>

      {/* Completed Section */}
      {completedItems.length > 0 && (
        <div className={styles.completedSection}>
          <div
            className={styles.completedHeader}
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <span className={styles.completedTitle}>
              {showCompleted ? <ChevronUpIcon /> : <ChevronDownIcon />}
              <span>Completed ({completedItems.length})</span>
            </span>
            <Text size="small" color="secondary">
              {completedItems.filter((i) => i.result?.success).length} succeeded,{' '}
              {completedItems.filter((i) => !i.result?.success).length} failed
            </Text>
          </div>
          {showCompleted && (
            <div className={styles.completedList}>
              {completedItems.map((item) => (
                <CompletedItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// STORYBOOK CONFIG
// ============================================

const meta: Meta<typeof IdeateQueueComponent> = {
  title: 'Example Pages/Ideate Queue',
  component: IdeateQueueComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof IdeateQueueComponent>;

export const Empty: Story = {
  args: {
    queueItems: [],
    runningItem: null,
    completedItems: [],
  },
};

export const Queued: Story = {
  args: {
    queueItems: sampleQueueItems,
    runningItem: null,
    completedItems: [],
  },
};

export const AIExecuting: Story = {
  args: {
    queueItems: sampleQueueItems,
    runningItem: runningItem,
    completedItems: completedItems,
  },
};

export const HumanPending: Story = {
  args: {
    queueItems: sampleQueueItems.filter((i) => i.type === 'human-task'),
    runningItem: null,
    completedItems: [],
    filter: 'human',
  },
};

export const Mixed: Story = {
  args: {
    queueItems: sampleQueueItems,
    runningItem: null,
    completedItems: completedItems,
  },
};

export const Paused: Story = {
  args: {
    queueItems: sampleQueueItems,
    runningItem: null,
    completedItems: completedItems,
    isPaused: true,
  },
};
