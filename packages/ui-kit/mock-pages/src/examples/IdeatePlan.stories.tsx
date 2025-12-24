import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Button,
  Breadcrumb,
  Checkbox,
  Chip,
  Divider,
  Heading,
  IconButton,
  Progress,
  Spinner,
  Tabs,
  Text,
  ShimmerText,
  RelativeTime,
} from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';
import { ClockIcon } from '@ui-kit/icons/ClockIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { ErrorCircleIcon } from '@ui-kit/icons/ErrorCircleIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { PlayIcon } from '@ui-kit/icons/PlayIcon';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { UserIcon } from '@ui-kit/icons/UserIcon';
import { WarningIcon } from '@ui-kit/icons/WarningIcon';
import styles from './IdeatePlan.module.css';

/**
 * # Ideate Plan Detail
 *
 * Structured plan view with goals, steps, effort estimation, and AI analysis.
 * Plans can be created from ideas or independently. Steps can be queued for
 * AI or human execution.
 *
 * ## Component Gap Analysis
 *
 * Components that would improve this implementation:
 *
 * 1. **GoalsChecklist** - Checklist with inline editing and reordering
 * 2. **StepsTimeline** - Timeline view of steps with status indicators
 * 3. **EffortEstimate** - Effort display with confidence and breakdown
 * 4. **AIAnalysisPanel** - Standardized AI analysis display
 * 5. **DependencyGraph** - Visual dependency tree for plans
 * 6. **ProgressRing** - Circular progress indicator
 */

// ============================================
// DATA TYPES
// ============================================

type PlanStatus = 'draft' | 'in-progress' | 'completed' | 'blocked';
type StepStatus = 'pending' | 'in-progress' | 'completed' | 'skipped';
type ExecutorType = 'ai' | 'human';
type Confidence = 'low' | 'medium' | 'high';
type Complexity = 'low' | 'medium' | 'high';

interface PlanGoal {
  id: string;
  description: string;
  isComplete: boolean;
}

interface PlanStep {
  id: string;
  title: string;
  description?: string;
  status: StepStatus;
  executorType: ExecutorType;
  estimatedMinutes?: number;
  order: number;
  queueItemId?: string;
}

interface EffortEstimate {
  hours: number;
  confidence: Confidence;
  breakdown?: { category: string; hours: number }[];
}

interface AIAnalysis {
  complexity: Complexity;
  risks: string[];
  suggestions: string[];
}

interface Dependency {
  id: string;
  planId: string;
  planTitle: string;
  status: PlanStatus;
}

interface Plan {
  id: string;
  title: string;
  description: string;
  status: PlanStatus;
  sourceIdeaId?: string;
  sourceIdeaTitle?: string;
  goals: PlanGoal[];
  steps: PlanStep[];
  dependencies: Dependency[];
  estimatedEffort: EffortEstimate;
  aiAnalysis?: AIAnalysis;
  blockedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SAMPLE DATA
// ============================================

const samplePlan: Plan = {
  id: 'plan-1',
  title: 'Implement Dark Mode Support',
  description: 'Add a theme switching system with persistent user preferences. Support both light and dark themes with smooth transitions.',
  status: 'in-progress',
  sourceIdeaId: 'idea-1',
  sourceIdeaTitle: 'Add dark mode support',
  goals: [
    { id: 'g1', description: 'Users can toggle between light and dark themes', isComplete: true },
    { id: 'g2', description: 'Theme preference persists across sessions', isComplete: true },
    { id: 'g3', description: 'Respects system preference by default', isComplete: false },
    { id: 'g4', description: 'All components support theming', isComplete: false },
    { id: 'g5', description: 'Smooth transition animations between themes', isComplete: false },
  ],
  steps: [
    {
      id: 's1',
      title: 'Create ThemeProvider context',
      description: 'Set up React context for managing theme state globally.',
      status: 'completed',
      executorType: 'ai',
      estimatedMinutes: 15,
      order: 1,
    },
    {
      id: 's2',
      title: 'Define CSS custom properties',
      description: 'Create CSS variables for all color tokens in light and dark variants.',
      status: 'completed',
      executorType: 'ai',
      estimatedMinutes: 20,
      order: 2,
    },
    {
      id: 's3',
      title: 'Add theme toggle component',
      description: 'Create a reusable toggle switch for theme selection.',
      status: 'in-progress',
      executorType: 'ai',
      estimatedMinutes: 10,
      order: 3,
      queueItemId: 'queue-1',
    },
    {
      id: 's4',
      title: 'Audit component color usage',
      description: 'Review all components and replace hardcoded colors with CSS variables.',
      status: 'pending',
      executorType: 'human',
      estimatedMinutes: 60,
      order: 4,
    },
    {
      id: 's5',
      title: 'Implement localStorage persistence',
      description: 'Save theme preference to localStorage and load on app start.',
      status: 'pending',
      executorType: 'ai',
      estimatedMinutes: 10,
      order: 5,
    },
    {
      id: 's6',
      title: 'Add system preference detection',
      description: 'Use prefers-color-scheme media query for initial theme.',
      status: 'pending',
      executorType: 'ai',
      estimatedMinutes: 10,
      order: 6,
    },
    {
      id: 's7',
      title: 'Test and fix third-party components',
      description: 'Verify theming works with external libraries and fix any issues.',
      status: 'pending',
      executorType: 'human',
      estimatedMinutes: 45,
      order: 7,
    },
  ],
  dependencies: [],
  estimatedEffort: {
    hours: 4.5,
    confidence: 'medium',
    breakdown: [
      { category: 'AI Tasks', hours: 1.5 },
      { category: 'Human Tasks', hours: 2 },
      { category: 'Testing', hours: 1 },
    ],
  },
  aiAnalysis: {
    complexity: 'medium',
    risks: [
      'Third-party components may not support CSS variables',
      'Some legacy code may have hardcoded colors that are hard to find',
      'Transition animations may cause performance issues on low-end devices',
    ],
    suggestions: [
      'Consider using a CSS-in-JS solution for better type safety',
      'Add a "system" option in addition to light/dark',
      'Create a theme preview in settings before applying',
    ],
  },
  createdAt: new Date(Date.now() - 86400000 * 2),
  updatedAt: new Date(Date.now() - 3600000),
};

const draftPlan: Plan = {
  ...samplePlan,
  id: 'plan-draft',
  status: 'draft',
  goals: samplePlan.goals.map((g) => ({ ...g, isComplete: false })),
  steps: samplePlan.steps.map((s) => ({ ...s, status: 'pending' as StepStatus })),
  aiAnalysis: undefined,
};

const blockedPlan: Plan = {
  ...samplePlan,
  id: 'plan-blocked',
  status: 'blocked',
  blockedReason: 'Waiting for "Backend API Setup" plan to complete',
  dependencies: [
    {
      id: 'dep-1',
      planId: 'plan-backend',
      planTitle: 'Backend API Setup',
      status: 'in-progress',
    },
  ],
};

const completedPlan: Plan = {
  ...samplePlan,
  id: 'plan-completed',
  status: 'completed',
  goals: samplePlan.goals.map((g) => ({ ...g, isComplete: true })),
  steps: samplePlan.steps.map((s) => ({ ...s, status: 'completed' as StepStatus })),
};

// ============================================
// HELPER COMPONENTS
// ============================================

function ExecutorBadge({ type }: { type: ExecutorType }) {
  return (
    <span className={`${styles.executorBadge} ${styles[type]}`}>
      {type === 'ai' ? <StarIcon /> : <UserIcon />}
      {type === 'ai' ? 'AI' : 'Human'}
    </span>
  );
}

function ComplexityIndicator({ complexity }: { complexity: Complexity }) {
  return (
    <div className={styles.complexityIndicator}>
      <div className={`${styles.complexityDot} ${styles[complexity]}`} />
      <Text>{complexity.charAt(0).toUpperCase() + complexity.slice(1)}</Text>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <span className={`${styles.confidenceBadge} ${styles[confidence]}`}>
      {confidence} confidence
    </span>
  );
}

function GoalItem({ goal, onChange }: { goal: PlanGoal; onChange?: (checked: boolean) => void }) {
  return (
    <div className={styles.goalItem}>
      <Checkbox
        checked={goal.isComplete}
        onChange={(e) => onChange?.(e.target.checked)}
        className={styles.goalCheckbox}
      />
      <Text className={goal.isComplete ? styles.goalTextComplete : styles.goalText}>
        {goal.description}
      </Text>
    </div>
  );
}

function StepItem({ step, number }: { step: PlanStep; number: number }) {
  const isCompleted = step.status === 'completed';
  const isRunning = step.status === 'in-progress';

  return (
    <div className={styles.stepItem}>
      <div
        className={`${styles.stepNumber} ${isCompleted ? styles.stepNumberCompleted : ''} ${isRunning ? styles.stepNumberRunning : ''}`}
      >
        {isCompleted ? <CheckCircleIcon /> : isRunning ? <Spinner size="sm" /> : number}
      </div>
      <div className={styles.stepContent}>
        <div className={styles.stepHeader}>
          <Text className={`${styles.stepTitle} ${isCompleted ? styles.stepTitleCompleted : ''}`}>
            {step.title}
          </Text>
          <ExecutorBadge type={step.executorType} />
          <Chip size="sm" variant={isCompleted ? 'success' : isRunning ? 'primary' : 'default'}>
            {step.status}
          </Chip>
        </div>
        {step.description && (
          <Text size="small" color="secondary" className={styles.stepDescription}>
            {step.description}
          </Text>
        )}
        <div className={styles.stepMeta}>
          {step.estimatedMinutes && (
            <Text size="small" color="secondary">
              <ClockIcon /> {step.estimatedMinutes} min
            </Text>
          )}
        </div>
      </div>
      <div className={styles.stepActions}>
        {step.status === 'pending' && step.executorType === 'ai' && (
          <IconButton variant="primary" size="sm" icon={<PlayIcon />} aria-label="Queue step" />
        )}
        {step.status === 'pending' && step.executorType === 'human' && (
          <Button variant="default" size="sm">Mark Done</Button>
        )}
        <IconButton variant="ghost" size="sm" icon={<EditIcon />} aria-label="Edit step" />
      </div>
    </div>
  );
}

function AIAnalysisPanel({ analysis, isLoading }: { analysis?: AIAnalysis; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className={styles.aiPanel}>
        <div className={styles.aiPanelHeader}>
          <StarIcon />
          <Text weight="medium">AI Analysis</Text>
        </div>
        <div className={styles.loadingState}>
          <Spinner size="md" />
          <ShimmerText>Analyzing plan...</ShimmerText>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className={styles.aiPanel}>
        <div className={styles.aiPanelHeader}>
          <StarIcon />
          <Text weight="medium">AI Analysis</Text>
        </div>
        <div className={styles.sectionContent}>
          <Button variant="default" icon={<StarIcon />}>Generate AI Analysis</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.aiPanel}>
      <div className={styles.aiPanelHeader}>
        <StarIcon />
        <Text weight="medium">AI Analysis</Text>
      </div>
      <div className={styles.aiPanelContent}>
        <div className={styles.aiMetric}>
          <span className={styles.aiMetricLabel}>Complexity</span>
          <ComplexityIndicator complexity={analysis.complexity} />
        </div>

        {analysis.risks.length > 0 && (
          <div className={styles.aiMetric}>
            <span className={styles.aiMetricLabel}>Risks</span>
            <div className={styles.risksList}>
              {analysis.risks.map((risk, i) => (
                <div key={i} className={styles.riskItem}>
                  <WarningIcon className={styles.riskIcon} />
                  <Text size="small">{risk}</Text>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.suggestions.length > 0 && (
          <div className={styles.aiMetric}>
            <span className={styles.aiMetricLabel}>Suggestions</span>
            <div className={styles.suggestionsList}>
              {analysis.suggestions.map((suggestion, i) => (
                <div key={i} className={styles.suggestionItem}>
                  <StarIcon />
                  <Text size="small">{suggestion}</Text>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EffortPanel({ effort }: { effort: EffortEstimate }) {
  return (
    <div className={styles.effortPanel}>
      <div className={styles.effortHeader}>
        <div>
          <Text size="small" color="secondary">Estimated Effort</Text>
          <div className={styles.effortValue}>{effort.hours}h</div>
        </div>
        <ConfidenceBadge confidence={effort.confidence} />
      </div>
      {effort.breakdown && (
        <div className={styles.effortBreakdown}>
          {effort.breakdown.map((item) => (
            <div key={item.category} className={styles.breakdownItem}>
              <Text size="small">{item.category}</Text>
              <div className={styles.breakdownBar}>
                <div
                  className={styles.breakdownFill}
                  style={{ width: `${(item.hours / effort.hours) * 100}%` }}
                />
              </div>
              <Text size="small" color="secondary">{item.hours}h</Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressPanel({ plan }: { plan: Plan }) {
  const completedSteps = plan.steps.filter((s) => s.status === 'completed').length;
  const totalSteps = plan.steps.length;
  const percent = Math.round((completedSteps / totalSteps) * 100);

  const completedGoals = plan.goals.filter((g) => g.isComplete).length;
  const totalGoals = plan.goals.length;

  return (
    <div className={styles.progressPanel}>
      <div className={styles.progressHeader}>
        <div>
          <Text size="small" color="secondary">Progress</Text>
          <div className={styles.progressPercent}>{percent}%</div>
        </div>
        <Chip size="sm" variant={plan.status === 'completed' ? 'success' : plan.status === 'blocked' ? 'error' : 'primary'}>
          {plan.status}
        </Chip>
      </div>
      <Progress value={percent} size="md" />
      <div className={styles.progressStats}>
        <div className={styles.progressStat}>
          <Text size="small" color="secondary">Steps</Text>
          <Text size="small">{completedSteps} / {totalSteps}</Text>
        </div>
        <div className={styles.progressStat}>
          <Text size="small" color="secondary">Goals</Text>
          <Text size="small">{completedGoals} / {totalGoals}</Text>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface IdeatePlanProps {
  plan: Plan;
  activeTab?: string;
  isAnalyzing?: boolean;
}

function IdeatePlanComponent({
  plan,
  activeTab = 'overview',
  isAnalyzing = false,
}: IdeatePlanProps) {
  const [tab, setTab] = useState(activeTab);

  const breadcrumbItems = [
    { label: 'Ideas', href: '#' },
    { label: 'Plans', href: '#' },
    { label: plan.title },
  ];

  const statusVariant: Record<PlanStatus, 'default' | 'primary' | 'success' | 'error'> = {
    draft: 'default',
    'in-progress': 'primary',
    completed: 'success',
    blocked: 'error',
  };

  return (
    <div className={styles.container}>
      {/* Blocked Banner */}
      {plan.status === 'blocked' && plan.blockedReason && (
        <div className={styles.blockedBanner}>
          <ErrorCircleIcon />
          <Text weight="medium">Blocked: {plan.blockedReason}</Text>
        </div>
      )}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.breadcrumb}>
          <Breadcrumb items={breadcrumbItems} />
        </div>
        <div className={styles.headerMain}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitle}>
              <Heading level={1} size="h3">{plan.title}</Heading>
              <Chip variant={statusVariant[plan.status]}>{plan.status}</Chip>
            </div>
            <div className={styles.headerMeta}>
              {plan.sourceIdeaTitle && (
                <span className={styles.linkedIdea}>
                  <LinkIcon />
                  From: {plan.sourceIdeaTitle}
                </span>
              )}
              <span className={styles.metaItem}>
                <ClockIcon />
                <Text size="small" color="secondary">
                  Updated <RelativeTime timestamp={plan.updatedAt} />
                </Text>
              </span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button variant="default" icon={<EditIcon />}>Edit</Button>
            <Button variant="primary" icon={<PlayIcon />}>Start Execution</Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'overview', label: 'Overview' },
            { value: 'steps', label: `Steps (${plan.steps.length})` },
            { value: 'dependencies', label: `Dependencies (${plan.dependencies.length})` },
            { value: 'analysis', label: 'AI Analysis' },
          ]}
        />
      </div>

      {/* Content */}
      <div className={styles.content}>
        {tab === 'overview' && (
          <div className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              {/* Description */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>
                    <FileIcon />
                    <Text weight="medium">Description</Text>
                  </div>
                </div>
                <div className={styles.sectionContent}>
                  <Text>{plan.description}</Text>
                </div>
              </div>

              {/* Goals */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>
                    <CheckCircleIcon />
                    <Text weight="medium">Goals</Text>
                    <Chip size="sm" variant="default">
                      {plan.goals.filter((g) => g.isComplete).length}/{plan.goals.length}
                    </Chip>
                  </div>
                  <IconButton variant="ghost" size="sm" icon={<AddIcon />} aria-label="Add goal" />
                </div>
                <div className={styles.sectionContent}>
                  <div className={styles.goalsList}>
                    {plan.goals.map((goal) => (
                      <GoalItem key={goal.id} goal={goal} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Steps Preview */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>
                    <ChevronRightIcon />
                    <Text weight="medium">Steps</Text>
                    <Chip size="sm" variant="default">
                      {plan.steps.filter((s) => s.status === 'completed').length}/{plan.steps.length}
                    </Chip>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setTab('steps')}>
                    View All
                  </Button>
                </div>
                <div className={styles.sectionContent}>
                  <div className={styles.stepsList}>
                    {plan.steps.slice(0, 3).map((step, i) => (
                      <StepItem key={step.id} step={step} number={i + 1} />
                    ))}
                    {plan.steps.length > 3 && (
                      <Button variant="ghost" onClick={() => setTab('steps')}>
                        + {plan.steps.length - 3} more steps
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.sideColumn}>
              <ProgressPanel plan={plan} />
              <EffortPanel effort={plan.estimatedEffort} />
              <AIAnalysisPanel analysis={plan.aiAnalysis} isLoading={isAnalyzing} />
            </div>
          </div>
        )}

        {tab === 'steps' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <Text weight="medium">All Steps</Text>
              </div>
              <Button variant="default" size="sm" icon={<AddIcon />}>Add Step</Button>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.stepsList}>
                {plan.steps.map((step, i) => (
                  <StepItem key={step.id} step={step} number={i + 1} />
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'dependencies' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <Text weight="medium">Dependencies</Text>
              </div>
              <Button variant="default" size="sm" icon={<AddIcon />}>Add Dependency</Button>
            </div>
            <div className={styles.sectionContent}>
              {plan.dependencies.length === 0 ? (
                <div className={styles.emptyState}>
                  <Text color="secondary">No dependencies defined</Text>
                </div>
              ) : (
                <div className={styles.dependencyList}>
                  {plan.dependencies.map((dep) => (
                    <div key={dep.id} className={styles.dependencyItem}>
                      <LinkIcon className={styles.dependencyIcon} />
                      <div className={styles.dependencyInfo}>
                        <Text className={styles.dependencyTitle}>{dep.planTitle}</Text>
                        <Text className={styles.dependencyStatus}>
                          Status: {dep.status}
                        </Text>
                      </div>
                      <Chip size="sm" variant={dep.status === 'completed' ? 'success' : 'warning'}>
                        {dep.status}
                      </Chip>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'analysis' && (
          <div style={{ maxWidth: 600 }}>
            <AIAnalysisPanel analysis={plan.aiAnalysis} isLoading={isAnalyzing} />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// STORYBOOK CONFIG
// ============================================

const meta: Meta<typeof IdeatePlanComponent> = {
  title: 'Example Pages/Ideate Plan',
  component: IdeatePlanComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof IdeatePlanComponent>;

export const Draft: Story = {
  args: {
    plan: draftPlan,
  },
};

export const InProgress: Story = {
  args: {
    plan: samplePlan,
  },
};

export const AIAnalyzing: Story = {
  args: {
    plan: draftPlan,
    isAnalyzing: true,
  },
};

export const Blocked: Story = {
  args: {
    plan: blockedPlan,
  },
};

export const Completed: Story = {
  args: {
    plan: completedPlan,
  },
};

export const StepsTab: Story = {
  args: {
    plan: samplePlan,
    activeTab: 'steps',
  },
};
