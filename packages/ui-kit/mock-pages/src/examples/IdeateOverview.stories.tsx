import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Button,
  Chip,
  Divider,
  Dropdown,
  Heading,
  IconButton,
  Input,
  Progress,
  Spinner,
  Text,
  RelativeTime,
} from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';
import { ClockIcon } from '@ui-kit/icons/ClockIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import { HourglassIcon } from '@ui-kit/icons/HourglassIcon';
import { PlayIcon } from '@ui-kit/icons/PlayIcon';
import { SendIcon } from '@ui-kit/icons/SendIcon';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import { UserIcon } from '@ui-kit/icons/UserIcon';
import styles from './IdeateOverview.module.css';

/**
 * # Ideate Overview Dashboard
 *
 * Central dashboard for managing projects with ideas, plans, and execution queue.
 * Shows project statistics, recent activity, and AI assistant integration.
 *
 * ## Component Gap Analysis
 *
 * Components that would improve this implementation:
 *
 * 1. **ProjectPicker** - Dropdown with project stats and search
 * 2. **StatCard** - Standardized stat display with icon, value, trend
 * 3. **ActivityFeed** - Timeline of events with filtering
 * 4. **AIStatusIndicator** - AI working/idle status with context
 * 5. **QuickCapture** - AI-assisted input bar
 * 6. **NavSidebar** - Collapsible navigation sidebar
 */

// ============================================
// DATA TYPES
// ============================================

interface Project {
  id: string;
  name: string;
  description?: string;
  gitUrl?: string;
  stats: {
    ideasCount: number;
    plansCount: number;
    queueCount: number;
    completedCount: number;
  };
  lastActivity: Date;
}

interface ActivityItem {
  id: string;
  type: 'idea' | 'plan' | 'queue' | 'completed' | 'ai';
  title: string;
  description: string;
  timestamp: Date;
}

interface PlanPreview {
  id: string;
  title: string;
  status: 'draft' | 'in-progress' | 'completed';
  progress: number;
}

interface QueuePreview {
  id: string;
  title: string;
  type: 'ai-task' | 'human-task';
  position: number;
}

// ============================================
// SAMPLE DATA
// ============================================

const sampleProjects: Project[] = [
  {
    id: 'project-1',
    name: 'claude-flow',
    description: 'AI-powered project management',
    gitUrl: 'github.com/org/claude-flow',
    stats: { ideasCount: 12, plansCount: 5, queueCount: 8, completedCount: 23 },
    lastActivity: new Date(Date.now() - 1800000),
  },
  {
    id: 'project-2',
    name: 'ui-kit',
    description: 'Design system components',
    gitUrl: 'github.com/org/ui-kit',
    stats: { ideasCount: 7, plansCount: 3, queueCount: 2, completedCount: 15 },
    lastActivity: new Date(Date.now() - 7200000),
  },
  {
    id: 'project-3',
    name: 'api-service',
    description: 'Backend API service',
    gitUrl: 'github.com/org/api-service',
    stats: { ideasCount: 4, plansCount: 2, queueCount: 0, completedCount: 8 },
    lastActivity: new Date(Date.now() - 86400000),
  },
];

const sampleActivity: ActivityItem[] = [
  {
    id: 'a1',
    type: 'completed',
    title: 'Task completed',
    description: 'Set up auth routes and middleware',
    timestamp: new Date(Date.now() - 600000),
  },
  {
    id: 'a2',
    type: 'ai',
    title: 'AI suggestion',
    description: 'Consider adding rate limiting to API endpoints',
    timestamp: new Date(Date.now() - 1800000),
  },
  {
    id: 'a3',
    type: 'plan',
    title: 'Plan created',
    description: 'Implement Dark Mode Support',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: 'a4',
    type: 'idea',
    title: 'New idea captured',
    description: 'Add keyboard shortcuts for power users',
    timestamp: new Date(Date.now() - 7200000),
  },
  {
    id: 'a5',
    type: 'queue',
    title: 'Task queued',
    description: 'Generate test fixtures for auth module',
    timestamp: new Date(Date.now() - 10800000),
  },
];

const samplePlans: PlanPreview[] = [
  { id: 'p1', title: 'Implement Dark Mode Support', status: 'in-progress', progress: 45 },
  { id: 'p2', title: 'Backend Authentication', status: 'in-progress', progress: 30 },
  { id: 'p3', title: 'API Documentation', status: 'draft', progress: 0 },
];

const sampleQueue: QueuePreview[] = [
  { id: 'q1', title: 'Set up database migrations', type: 'ai-task', position: 1 },
  { id: 'q2', title: 'Review API design document', type: 'human-task', position: 2 },
  { id: 'q3', title: 'Generate test fixtures', type: 'ai-task', position: 3 },
  { id: 'q4', title: 'Implement JWT handling', type: 'ai-task', position: 4 },
];

const aiSuggestions = [
  'Add error handling to auth endpoints',
  'Consider caching for frequently accessed data',
  'Write unit tests for new components',
];

// ============================================
// HELPER COMPONENTS
// ============================================

function AIStatusBadge({ isWorking }: { isWorking: boolean }) {
  return (
    <div className={`${styles.aiStatusBadge} ${isWorking ? styles.working : styles.idle}`}>
      {isWorking ? <Spinner size="sm" /> : <div className={`${styles.aiStatusDot} ${isWorking ? styles.working : ''}`} />}
      <span>{isWorking ? 'AI Working' : 'AI Ready'}</span>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  trend,
  variant,
  onClick,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  trend?: { value: number; direction: 'up' | 'down' };
  variant: 'ideas' | 'plans' | 'queue' | 'completed';
  onClick?: () => void;
}) {
  return (
    <div className={styles.statCard} onClick={onClick}>
      <div className={styles.statCardHeader}>
        <div className={`${styles.statCardIcon} ${styles[variant]}`}>{icon}</div>
        {trend && (
          <span className={`${styles.statCardTrend} ${styles[trend.direction]}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <div className={styles.statCardValue}>{value}</div>
      <div className={styles.statCardLabel}>{label}</div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className={`${styles.navItem} ${active ? styles.active : ''}`} onClick={onClick}>
      <span className={styles.navItemIcon}>{icon}</span>
      <span className={styles.navItemLabel}>{label}</span>
      {count !== undefined && <span className={styles.navItemCount}>{count}</span>}
    </div>
  );
}

function ActivityItemComponent({ item }: { item: ActivityItem }) {
  const iconMap = {
    idea: <StarIcon />,
    plan: <FileIcon />,
    queue: <HourglassIcon />,
    completed: <CheckCircleIcon />,
    ai: <StarIcon />,
  };

  return (
    <div className={styles.activityItem}>
      <div className={`${styles.activityIcon} ${styles[item.type]}`}>
        {iconMap[item.type]}
      </div>
      <div className={styles.activityContent}>
        <Text className={styles.activityTitle}>{item.title}</Text>
        <Text className={styles.activityDescription}>{item.description}</Text>
      </div>
      <RelativeTime timestamp={item.timestamp} className={styles.activityTime} size="sm" />
    </div>
  );
}

function PlanPreviewCard({ plan }: { plan: PlanPreview }) {
  const statusVariant: Record<string, 'default' | 'primary' | 'success'> = {
    draft: 'default',
    'in-progress': 'primary',
    completed: 'success',
  };

  return (
    <div className={styles.previewCard}>
      <div className={styles.previewCardContent}>
        <Text className={styles.previewCardTitle}>{plan.title}</Text>
        <div className={styles.previewCardMeta}>
          <Progress value={plan.progress} size="sm" style={{ width: 60, display: 'inline-flex' }} />
          <span style={{ marginLeft: 8 }}>{plan.progress}%</span>
        </div>
      </div>
      <Chip size="sm" variant={statusVariant[plan.status]}>{plan.status}</Chip>
      <IconButton variant="ghost" size="sm" icon={<ChevronRightIcon />} aria-label="View plan" />
    </div>
  );
}

function QueuePreviewItem({ item }: { item: QueuePreview }) {
  return (
    <div className={styles.queueItem}>
      <span className={styles.queueItemPosition}>{item.position}</span>
      <div className={styles.queueItemContent}>
        <Text className={styles.queueItemTitle}>{item.title}</Text>
      </div>
      <span className={`${styles.taskTypeBadge} ${item.type === 'ai-task' ? styles.ai : styles.human}`}>
        {item.type === 'ai-task' ? <StarIcon /> : <UserIcon />}
        {item.type === 'ai-task' ? 'AI' : 'Human'}
      </span>
    </div>
  );
}

function AISuggestionsBanner({ suggestions }: { suggestions: string[] }) {
  return (
    <div className={styles.aiBanner}>
      <div className={styles.aiBannerHeader}>
        <StarIcon />
        <span className={styles.aiBannerTitle}>AI Suggestions</span>
      </div>
      <div className={styles.aiBannerContent}>
        {suggestions.map((suggestion, i) => (
          <Button key={i} variant="ghost" size="sm" shape="pill">
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateIcon}>
        <FolderIcon />
      </div>
      <Heading level={2} size="h4">Welcome to Ideate</Heading>
      <Text color="secondary" className={styles.emptyStateDescription}>
        Start by capturing your first idea or creating a plan. The AI assistant
        is ready to help you develop and execute your ideas.
      </Text>
      <div className={styles.emptyStateActions}>
        <Button variant="primary" icon={<AddIcon />}>New Idea</Button>
        <Button variant="default" icon={<FileIcon />}>Create Plan</Button>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface IdeateOverviewProps {
  projects?: Project[];
  currentProjectId?: string;
  activity?: ActivityItem[];
  plans?: PlanPreview[];
  queue?: QueuePreview[];
  aiSuggestions?: string[];
  isAIWorking?: boolean;
  isEmpty?: boolean;
}

function IdeateOverviewComponent({
  projects = [],
  currentProjectId,
  activity = [],
  plans = [],
  queue = [],
  aiSuggestions: suggestions = [],
  isAIWorking = false,
  isEmpty = false,
}: IdeateOverviewProps) {
  const [activeNav, setActiveNav] = useState('overview');
  const currentProject = projects.find((p) => p.id === currentProjectId) || projects[0];

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.projectPicker}>
            <Dropdown
              options={projectOptions}
              value={currentProject?.id}
              placeholder="Select project..."
              searchable
            />
          </div>
          {currentProject && (
            <Text size="small" color="secondary">
              {currentProject.description}
            </Text>
          )}
        </div>
        <div className={styles.headerRight}>
          <AIStatusBadge isWorking={isAIWorking} />
          <IconButton variant="ghost" icon={<GearIcon />} aria-label="Settings" />
        </div>
      </header>

      <div className={styles.main}>
        {/* Sidebar */}
        <nav className={styles.sidebar}>
          <div className={styles.sidebarNav}>
            <NavItem
              icon={<FolderIcon />}
              label="Overview"
              active={activeNav === 'overview'}
              onClick={() => setActiveNav('overview')}
            />
            <NavItem
              icon={<StarIcon />}
              label="Ideas"
              count={currentProject?.stats.ideasCount}
              active={activeNav === 'ideas'}
              onClick={() => setActiveNav('ideas')}
            />
            <NavItem
              icon={<FileIcon />}
              label="Plans"
              count={currentProject?.stats.plansCount}
              active={activeNav === 'plans'}
              onClick={() => setActiveNav('plans')}
            />
            <NavItem
              icon={<HourglassIcon />}
              label="Queue"
              count={currentProject?.stats.queueCount}
              active={activeNav === 'queue'}
              onClick={() => setActiveNav('queue')}
            />
            <Divider className={styles.sidebarDivider} />
            <NavItem
              icon={<CheckCircleIcon />}
              label="Completed"
              count={currentProject?.stats.completedCount}
              active={activeNav === 'completed'}
              onClick={() => setActiveNav('completed')}
            />
          </div>
          <div className={styles.sidebarFooter}>
            <NavItem
              icon={<GearIcon />}
              label="Settings"
              active={activeNav === 'settings'}
              onClick={() => setActiveNav('settings')}
            />
          </div>
        </nav>

        {/* Content */}
        <main className={styles.content}>
          {isEmpty ? (
            <EmptyState />
          ) : (
            <>
              {/* AI Suggestions Banner */}
              {suggestions.length > 0 && <AISuggestionsBanner suggestions={suggestions} />}

              {/* Stats Grid */}
              <div className={styles.statsGrid}>
                <StatCard
                  icon={<StarIcon />}
                  value={currentProject?.stats.ideasCount || 0}
                  label="Ideas"
                  trend={{ value: 3, direction: 'up' }}
                  variant="ideas"
                />
                <StatCard
                  icon={<FileIcon />}
                  value={currentProject?.stats.plansCount || 0}
                  label="Active Plans"
                  variant="plans"
                />
                <StatCard
                  icon={<HourglassIcon />}
                  value={currentProject?.stats.queueCount || 0}
                  label="In Queue"
                  variant="queue"
                />
                <StatCard
                  icon={<CheckCircleIcon />}
                  value={currentProject?.stats.completedCount || 0}
                  label="Completed"
                  trend={{ value: 5, direction: 'up' }}
                  variant="completed"
                />
              </div>

              {/* Two Column Layout */}
              <div className={styles.twoColumn}>
                {/* Active Plans */}
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                      <FileIcon />
                      <Text weight="medium">Active Plans</Text>
                    </div>
                    <Button variant="ghost" size="sm">View All</Button>
                  </div>
                  <div className={styles.sectionContent}>
                    <div className={styles.previewList}>
                      {plans.map((plan) => (
                        <PlanPreviewCard key={plan.id} plan={plan} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Queue Preview */}
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                      <HourglassIcon />
                      <Text weight="medium">Execution Queue</Text>
                    </div>
                    <Button variant="ghost" size="sm">View All</Button>
                  </div>
                  <div className={styles.sectionContent}>
                    <div className={styles.queuePreview}>
                      {queue.map((item) => (
                        <QueuePreviewItem key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Feed */}
              <div className={styles.section} style={{ marginTop: 'var(--space-6)' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>
                    <ClockIcon />
                    <Text weight="medium">Recent Activity</Text>
                  </div>
                </div>
                <div className={styles.sectionContent}>
                  <div className={styles.activityFeed}>
                    {activity.map((item) => (
                      <ActivityItemComponent key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* AI Assistant Bar */}
      <div className={styles.aiBar}>
        <div className={styles.aiBarContent}>
          <StarIcon />
          <Input
            className={styles.aiBarInput}
            placeholder="Ask AI for help with your project..."
            aria-label="AI assistant input"
          />
          <IconButton variant="primary" icon={<SendIcon />} aria-label="Send" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// STORYBOOK CONFIG
// ============================================

const meta: Meta<typeof IdeateOverviewComponent> = {
  title: 'Example Pages/Ideate Overview',
  component: IdeateOverviewComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof IdeateOverviewComponent>;

export const Empty: Story = {
  args: {
    projects: sampleProjects,
    currentProjectId: 'project-1',
    isEmpty: true,
  },
};

export const Active: Story = {
  args: {
    projects: sampleProjects,
    currentProjectId: 'project-1',
    activity: sampleActivity,
    plans: samplePlans,
    queue: sampleQueue,
    aiSuggestions: aiSuggestions,
    isAIWorking: false,
  },
};

export const AIWorking: Story = {
  args: {
    projects: sampleProjects,
    currentProjectId: 'project-1',
    activity: sampleActivity,
    plans: samplePlans,
    queue: sampleQueue,
    aiSuggestions: [],
    isAIWorking: true,
  },
};

export const Minimal: Story = {
  args: {
    projects: sampleProjects,
    currentProjectId: 'project-3',
    activity: sampleActivity.slice(0, 2),
    plans: [],
    queue: [],
    aiSuggestions: aiSuggestions,
    isAIWorking: false,
  },
};
