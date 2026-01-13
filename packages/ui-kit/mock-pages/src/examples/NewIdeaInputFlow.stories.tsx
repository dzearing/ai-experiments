import type { Meta, StoryObj } from '@storybook/react';
import { useState, useRef, useLayoutEffect } from 'react';
import {
  Button,
  Chip,
  Heading,
  IconButton,
  Input,
  Progress,
  Spinner,
  Text,
  SplitPane,
  Checkbox,
  Tooltip,
} from '@ui-kit/react';
import { ChatPanel, ChatInput, type ChatPanelMessage } from '@ui-kit/react-chat';
import { MarkdownCoEditor, type ViewMode } from '@ui-kit/react-markdown';
import { ArrowRightIcon } from '@ui-kit/icons/ArrowRightIcon';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { InfoCircleIcon } from '@ui-kit/icons/InfoCircleIcon';
import { LightbulbIcon } from '@ui-kit/icons/LightbulbIcon';
import { PlayIcon } from '@ui-kit/icons/PlayIcon';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import styles from './NewIdeaInputFlow.module.css';

/**
 * # New Idea Input Flow
 *
 * The flow for capturing and processing a new idea, starting from a simple
 * one-liner prompt. The system analyzes the idea and determines the path:
 *
 * ## Flow States:
 * 1. **Input**: User types a one-liner describing their idea
 * 2. **Processing**: AI analyzes the idea and assesses execution confidence
 * 3. **Simple Outcome**: Idea is straightforward - ready to execute immediately
 * 4. **Complex Outcome**: Idea needs planning - transitions to split-screen planner
 *
 * ## Component Gap Analysis
 *
 * Components that would improve this implementation:
 *
 * 1. **SpotlightInput** - Centered command-palette style input with icon and hint
 * 2. **AnalysisProgress** - Multi-step progress indicator with current step label
 * 3. **ConfidenceBadge** - Visual indicator of execution confidence (high/moderate/low)
 * 4. **QuickPlanSummary** - Compact plan overview for simple ideas
 * 5. **TransitionAnimation** - Smooth morph from centered input to split layout
 */

// ============================================
// DATA TYPES
// ============================================

type FlowState = 'input' | 'processing' | 'simple-result' | 'medium-result' | 'complex-result' | 'planning';
type Confidence = 'high' | 'moderate' | 'low';

interface AnalysisStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete';
}

interface QuickPlan {
  summary: string;
  estimatedMinutes: number;
  steps: string[];
  canAutoExecute: boolean;
}

interface PlanPhase {
  id: string;
  title: string;
  description?: string;
  tasks: PlanTask[];
  expanded?: boolean;
}

interface PlanTask {
  id: string;
  title: string;
  completed?: boolean;
  inProgress?: boolean;
}

interface ConcernItem {
  text: string;
  detail?: string;
}

interface IdeaAnalysis {
  confidence: Confidence;
  title: string;
  summary: string;
  quickPlan?: QuickPlan;
  needsPlanning: boolean;
  concerns?: ConcernItem[];
  suggestions?: string[];
  /** Assumptions the agent will make if executing without planning (for moderate confidence) */
  assumptions?: string[];
}

// ============================================
// SAMPLE DATA
// ============================================

const analysisSteps: AnalysisStep[] = [
  { id: 'parse', label: 'Understanding your idea', status: 'complete' },
  { id: 'scope', label: 'Analyzing scope', status: 'active' },
  { id: 'plan', label: 'Creating approach', status: 'pending' },
];

const simpleAnalysis: IdeaAnalysis = {
  confidence: 'high',
  title: 'Add loading spinner to save button',
  summary: 'Show a spinner in the save button while the API request is in progress to provide feedback.',
  quickPlan: {
    summary: 'Add loading state to SaveButton component with Spinner while saving.',
    estimatedMinutes: 5,
    steps: [
      'Add isLoading prop to SaveButton',
      'Show Spinner inside button when loading',
      'Disable button during loading',
      'Update calling code to pass loading state',
    ],
    canAutoExecute: true,
  },
  needsPlanning: false,
};

const mediumAnalysis: IdeaAnalysis = {
  confidence: 'moderate',
  title: 'Add keyboard shortcuts for common actions',
  summary: 'Implement keyboard shortcuts for frequently used actions like save, undo, redo, and navigation to improve power user efficiency.',
  quickPlan: {
    summary: 'Add a keyboard shortcut system with configurable bindings and help overlay.',
    estimatedMinutes: 45,
    steps: [
      'Create keyboard shortcut context/provider',
      'Define default shortcuts for common actions',
      'Add shortcut hint tooltips to buttons',
      'Create keyboard shortcuts help dialog',
    ],
    canAutoExecute: true,
  },
  needsPlanning: false,
  assumptions: [
    'Using Ctrl/Cmd+S for save, Ctrl/Cmd+Z for undo',
    'Shortcuts will follow platform conventions (Cmd on Mac, Ctrl on Windows)',
    'Will add a help dialog accessible via ? key',
    'Shortcuts won\'t conflict with browser defaults',
  ],
  concerns: [
    { text: 'Some shortcuts may conflict with browser or OS defaults' },
    { text: 'Need to handle focus context (e.g., don\'t trigger in text inputs)' },
  ],
};

const complexAnalysis: IdeaAnalysis = {
  confidence: 'low',
  title: 'Real-time collaborative editing',
  summary: 'Enable multiple users to edit the same document simultaneously with live cursor presence and conflict-free synchronization.',
  needsPlanning: true,
  concerns: [
    {
      text: 'Requires WebSocket infrastructure for real-time sync',
      detail: 'You will need to set up a WebSocket server (e.g., Socket.io or ws) to handle real-time bidirectional communication between clients. Consider using a managed service like Pusher or Ably for easier scaling.',
    },
    {
      text: 'Need conflict resolution strategy (CRDTs recommended)',
      detail: 'Conflict-free Replicated Data Types (CRDTs) allow multiple users to edit simultaneously without conflicts. Libraries like Yjs or Automerge handle this automatically.',
    },
    {
      text: 'Affects multiple components and services',
    },
  ],
  suggestions: [
    'Use Yjs for CRDT-based synchronization',
    'Implement in phases: sync first, then presence',
    'Consider offline support requirements',
  ],
};

const planningMessages: ChatPanelMessage[] = [
  {
    id: 'sys-1',
    content: `I'll help you plan "Real-time collaborative editing". This is a complex feature that will benefit from careful planning.

Based on my analysis, here's what we need to consider:

**Key Components:**
- CRDT library (Yjs recommended) for conflict-free sync
- WebSocket server for real-time communication
- Presence system for cursor/selection display
- Offline support with IndexedDB

Would you like me to create a phased implementation plan?`,
    timestamp: new Date(),
    senderName: 'Plan Agent',
    senderColor: 'var(--success-fg)',
    renderMarkdown: true,
  },
];

const planningConversation: ChatPanelMessage[] = [
  ...planningMessages,
  {
    id: 'user-1',
    content: 'Yes, create a phased plan. Focus on getting basic sync working first.',
    timestamp: new Date(Date.now() - 60000),
    senderName: 'You',
    isOwn: true,
  },
  {
    id: 'assistant-1',
    content: `I've created a 3-phase implementation plan:

**Phase 1: Core Sync (Week 1)**
- Set up Yjs document model
- Create WebSocket server
- Basic document synchronization

**Phase 2: Presence (Week 2)**
- Awareness protocol for user presence
- Cursor position display
- User avatars/colors

**Phase 3: Polish (Week 3)**
- Offline support with IndexedDB
- Reconnection handling
- Performance optimization

The plan is in the document on the right. Ready to start execution when you are.`,
    timestamp: new Date(Date.now() - 30000),
    senderName: 'Plan Agent',
    senderColor: 'var(--success-fg)',
    renderMarkdown: true,
  },
];

const planPhases: PlanPhase[] = [
  {
    id: 'phase-1',
    title: 'Phase 1: Core Sync Infrastructure',
    description: 'Set up the foundational CRDT and synchronization layer',
    expanded: true,
    tasks: [
      { id: 'task-1-1', title: 'Install Yjs and y-websocket dependencies' },
      { id: 'task-1-2', title: 'Create Yjs document provider' },
      { id: 'task-1-3', title: 'Set up WebSocket server' },
      { id: 'task-1-4', title: 'Implement basic document sync' },
    ],
  },
  {
    id: 'phase-2',
    title: 'Phase 2: Presence System',
    description: 'User awareness and cursor presence',
    expanded: false,
    tasks: [
      { id: 'task-2-1', title: 'Implement awareness protocol' },
      { id: 'task-2-2', title: 'Create CursorPresence component' },
      { id: 'task-2-3', title: 'Add user avatar display' },
      { id: 'task-2-4', title: 'Smooth cursor interpolation' },
    ],
  },
  {
    id: 'phase-3',
    title: 'Phase 3: Polish & Offline',
    description: 'Offline support and UX improvements',
    expanded: false,
    tasks: [
      { id: 'task-3-1', title: 'Add IndexedDB persistence' },
      { id: 'task-3-2', title: 'Implement reconnection logic' },
      { id: 'task-3-3', title: 'Handle connection state UI' },
      { id: 'task-3-4', title: 'Performance optimization' },
    ],
  },
];

const planMarkdown = `# Real-time Collaborative Editing

## Overview
Enable multiple users to edit the same document simultaneously with live cursor presence and conflict-free synchronization.

## Goals
- Real-time sync without conflicts
- Show who else is viewing/editing
- Work offline with eventual consistency

## Implementation Plan

### Phase 1: Core Sync Infrastructure
Set up the foundational CRDT and synchronization layer.
- Install Yjs and y-websocket dependencies
- Create Yjs document provider
- Set up WebSocket server
- Implement basic document sync

### Phase 2: Presence System
User awareness and cursor presence.
- Implement awareness protocol
- Create CursorPresence component
- Add user avatar display
- Smooth cursor interpolation

### Phase 3: Polish & Offline
Offline support and UX improvements.
- Add IndexedDB persistence
- Implement reconnection logic
- Handle connection state UI
- Performance optimization

## Technical Notes
- Using Yjs for CRDT-based synchronization
- WebSocket for real-time communication
- IndexedDB for offline persistence
`;

// ============================================
// HELPER COMPONENTS
// ============================================

function ConfidenceIndicator({ confidence }: { confidence: Confidence }) {
  const variants: Record<Confidence, 'success' | 'warning' | 'error'> = {
    high: 'success',
    moderate: 'warning',
    low: 'error',
  };

  const labels: Record<Confidence, string> = {
    high: 'High',
    moderate: 'Moderate',
    low: 'Low',
  };

  return (
    <Chip size="sm" variant={variants[confidence]}>
      Confidence: {labels[confidence]}
    </Chip>
  );
}

function AnalysisStepIndicator({ steps }: { steps: AnalysisStep[] }) {
  return (
    <div className={styles.analysisSteps}>
      {steps.map((step, index) => (
        <div key={step.id} className={styles.analysisStep}>
          <div className={styles.stepIndicatorWrapper}>
            {step.status === 'active' ? (
              <Spinner size="sm" />
            ) : (
              <div className={`${styles.stepIndicator} ${styles[step.status]}`}>
                {step.status === 'complete' && <CheckCircleIcon />}
                {step.status === 'pending' && <span className={styles.stepNumber}>{index + 1}</span>}
              </div>
            )}
          </div>
          <Text size="sm" color={step.status === 'active' ? undefined : 'soft'}>
            {step.label}
          </Text>
        </div>
      ))}
    </div>
  );
}

function QuickPlanCard({ plan }: { plan: QuickPlan }) {
  return (
    <div className={`surface info ${styles.quickPlanCard}`}>
      <div className={styles.quickPlanHeader}>
        <Text weight="medium">Quick Plan</Text>
      </div>
      <Text size="sm" color="soft" className={styles.quickPlanSummary}>
        {plan.summary}
      </Text>
      <div className={styles.quickPlanSteps}>
        {plan.steps.map((step, index) => (
          <div key={index} className={styles.quickPlanStep}>
            <span className={styles.stepBullet}>{index + 1}</span>
            <Text size="sm">{step}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConcernsList({ concerns, defaultExpanded = true }: { concerns: ConcernItem[]; defaultExpanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`surface warning ${styles.concernsList} ${!isExpanded ? styles.collapsed : ''}`}>
      <button
        className={styles.collapsibleHeader}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className={styles.collapsibleToggle}>
          {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </span>
        <InfoCircleIcon />
        <Text size="sm" weight="medium">Considerations</Text>
        {!isExpanded && <Text size="sm" color="soft">({concerns.length})</Text>}
      </button>
      {isExpanded && (
        <div className={styles.collapsibleContent}>
          {concerns.map((concern, index) => (
            <div key={index} className={styles.concernItem}>
              <Text size="sm">{concern.text}</Text>
              {concern.detail && (
                <Tooltip content={concern.detail} multiline maxWidth={280}>
                  <span className={styles.concernInfoIcon}>
                    <InfoCircleIcon />
                  </span>
                </Tooltip>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlanViewSidebar({ phases }: { phases: PlanPhase[] }) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    new Set(phases.filter(p => p.expanded).map(p => p.id))
  );

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }

      return next;
    });
  };

  const totalTasks = phases.reduce((sum, p) => sum + p.tasks.length, 0);
  const completedTasks = phases.reduce((sum, p) => sum + p.tasks.filter(t => t.completed).length, 0);
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className={styles.planView}>
      <div className={styles.planToolbar}>
        <div className={styles.planProgress}>
          <div style={{ width: 120 }}>
            <Progress value={progressPercent} size="sm" />
          </div>
          <Text size="sm" color="soft">{completedTasks}/{totalTasks} tasks</Text>
        </div>
      </div>
      <div className={styles.planContent}>
        {phases.map((phase, phaseIndex) => {
          const isExpanded = expandedPhases.has(phase.id);
          const phaseCompletedTasks = phase.tasks.filter(t => t.completed).length;
          const phaseProgress = phase.tasks.length > 0
            ? Math.round((phaseCompletedTasks / phase.tasks.length) * 100)
            : 0;

          return (
            <div key={phase.id} className={styles.planPhase}>
              <button
                className={styles.planPhaseHeader}
                onClick={() => togglePhase(phase.id)}
                aria-expanded={isExpanded}
              >
                <span className={styles.planPhaseToggle}>
                  {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                </span>
                <span className={styles.planPhaseNumber}>{phaseIndex + 1}</span>
                <span className={styles.planPhaseTitle}>{phase.title}</span>
                <span className={styles.planPhaseProgress}>
                  {phaseProgress === 100 ? (
                    <CheckCircleIcon style={{ color: 'var(--success-fg)' }} />
                  ) : (
                    <Text size="sm" color="soft">{phaseCompletedTasks}/{phase.tasks.length}</Text>
                  )}
                </span>
              </button>
              {isExpanded && (
                <div className={styles.planPhaseContent}>
                  {phase.description && (
                    <Text size="sm" color="soft" className={styles.planPhaseDescription}>
                      {phase.description}
                    </Text>
                  )}
                  <div className={styles.planTasks}>
                    {phase.tasks.map((task) => (
                      <div key={task.id} className={`${styles.planTask} ${task.inProgress ? styles.planTaskInProgress : ''}`}>
                        {task.inProgress ? (
                          <Spinner size="sm" />
                        ) : (
                          <Checkbox checked={task.completed} aria-label={task.title} />
                        )}
                        <span className={`${styles.planTaskTitle} ${task.completed ? styles.planTaskCompleted : ''}`}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChatPanelWrapper({
  messages,
  isThinking = false,
}: {
  messages: ChatPanelMessage[];
  isThinking?: boolean;
}) {
  return (
    <div className={styles.chatPanel}>
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderLeft}>
          <StarIcon className={styles.agentIcon} />
          <Text weight="medium">Plan Agent</Text>
          <span className={styles.connectionStatus}>
            <span className={styles.connectionDot} />
            Connected
          </span>
        </div>
      </div>

      <ChatPanel
        messages={messages}
        isLoading={isThinking}
        loadingText="Plan Agent is thinking..."
        className={styles.chatMessages}
      />

      <div className={styles.chatInputArea}>
        <ChatInput
          placeholder="Ask questions or refine the plan..."
          size="md"
          fullWidth
        />
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT VARIANTS
// ============================================

interface InputStateProps {
  topic?: string;
  topicName?: string;
  placeholder?: string;
}

function InputState({ topic = '', topicName = 'Authentication', placeholder = "What would you like to build or improve?" }: InputStateProps) {
  const [value, setValue] = useState(topic);

  return (
    <div className={styles.overlay}>
      <div className={styles.inputDialog}>
        <div className={styles.inputHeader}>
          <LightbulbIcon className={styles.inputIcon} />
          <Heading level={2} size={4}>New Idea</Heading>
          <Chip size="sm" variant="default">{topicName}</Chip>
          <div className={styles.headerSpacer} />
          <IconButton variant="ghost" icon={<CloseIcon />} aria-label="Close" />
        </div>
        <div className={styles.inputBody}>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            aria-label="Describe your idea"
            autoFocus
            fullWidth
          />
        </div>
        <div className={styles.inputFooter}>
          <Button variant="default">Cancel</Button>
          <Button variant="primary" icon={<StarIcon />} disabled={!value.trim()}>
            Analyze Idea
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ProcessingStateProps {
  topicName?: string;
  steps: AnalysisStep[];
}

function ProcessingState({ topicName = 'Authentication', steps }: ProcessingStateProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.inputDialog}>
        <div className={styles.inputHeader}>
          <Spinner size="sm" />
          <Heading level={2} size={4}>Analyzing idea...</Heading>
          <Chip size="sm" variant="default">{topicName}</Chip>
          <div className={styles.headerSpacer} />
          <IconButton variant="ghost" icon={<CloseIcon />} aria-label="Close" />
        </div>
        <div className={styles.inputBody}>
          <AnalysisStepIndicator steps={steps} />
        </div>
        <div className={styles.inputFooter}>
          <Button variant="default">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

interface SimpleResultStateProps {
  analysis: IdeaAnalysis;
}

function SimpleResultState({ analysis }: SimpleResultStateProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.resultDialog}>
        <div className={styles.resultHeader}>
          <div className={styles.resultHeaderLeft}>
            <CheckCircleIcon className={styles.successIcon} />
            <Heading level={2} size={4}>Ready to Execute</Heading>
          </div>
          <div className={styles.resultHeaderRight}>
            <ConfidenceIndicator confidence={analysis.confidence} />
            <IconButton variant="ghost" icon={<CloseIcon />} aria-label="Close" />
          </div>
        </div>
        <div className={styles.resultBody}>
          <div className={styles.resultSummary}>
            <Heading level={3} size={5}>{analysis.title}</Heading>
            <Text color="soft">{analysis.summary}</Text>
          </div>
          {analysis.quickPlan && <QuickPlanCard plan={analysis.quickPlan} />}
        </div>
        <div className={styles.resultFooter}>
          <Button variant="default">Edit Plan</Button>
          <Button variant="default">Save as Draft</Button>
          <Button variant="primary" icon={<PlayIcon />}>
            Execute Now
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ComplexResultStateProps {
  analysis: IdeaAnalysis;
}

function ComplexResultState({ analysis }: ComplexResultStateProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.complexResultDialog}>
        <div className={styles.resultHeader}>
          <div className={styles.resultHeaderLeft}>
            <InfoCircleIcon className={styles.warningIcon} />
            <Heading level={2} size={4}>This needs planning</Heading>
          </div>
          <div className={styles.resultHeaderRight}>
            <ConfidenceIndicator confidence={analysis.confidence} />
            <IconButton variant="ghost" icon={<CloseIcon />} aria-label="Close" />
          </div>
        </div>
        <div className={styles.resultBody}>
          <div className={styles.resultSummary}>
            <Heading level={3} size={5}>{analysis.title}</Heading>
            <Text color="soft">{analysis.summary}</Text>
          </div>
          {analysis.concerns && <ConcernsList concerns={analysis.concerns} />}
          {analysis.suggestions && (
            <div className={`surface info ${styles.suggestionsList}`}>
              <Text size="sm" weight="medium" className={styles.suggestionsHeader}>
                <StarIcon /> Recommendations
              </Text>
              {analysis.suggestions.map((suggestion, index) => (
                <div key={index} className={styles.suggestionItem}>
                  <Text size="sm">{suggestion}</Text>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={styles.resultFooter}>
          <Button variant="default">Cancel</Button>
          <Button variant="primary" icon={<ArrowRightIcon />}>
            Start Planning
          </Button>
        </div>
      </div>
    </div>
  );
}

function AssumptionsList({ assumptions, defaultExpanded = false }: { assumptions: string[]; defaultExpanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`surface soft ${styles.assumptionsList} ${!isExpanded ? styles.collapsed : ''}`}>
      <button
        className={styles.collapsibleHeader}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className={styles.collapsibleToggle}>
          {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </span>
        <InfoCircleIcon />
        <Text size="sm" weight="medium">Assumptions (if executing now)</Text>
        {!isExpanded && <Text size="sm" color="soft">({assumptions.length})</Text>}
      </button>
      {isExpanded && (
        <div className={styles.collapsibleContent}>
          {assumptions.map((assumption, index) => (
            <div key={index} className={styles.assumptionItem}>
              <Text size="sm">{assumption}</Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface MediumResultStateProps {
  analysis: IdeaAnalysis;
}

function MediumResultState({ analysis }: MediumResultStateProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.complexResultDialog}>
        <div className={styles.resultHeader}>
          <div className={styles.resultHeaderLeft}>
            <LightbulbIcon className={styles.inputIcon} />
            <Heading level={2} size={4}>Ready with some assumptions</Heading>
          </div>
          <div className={styles.resultHeaderRight}>
            <ConfidenceIndicator confidence={analysis.confidence} />
            <IconButton variant="ghost" icon={<CloseIcon />} aria-label="Close" />
          </div>
        </div>
        <div className={`${styles.resultBody} ${styles.scrollable}`}>
          <div className={styles.resultSummary}>
            <Heading level={3} size={5}>{analysis.title}</Heading>
            <Text color="soft">{analysis.summary}</Text>
          </div>
          {analysis.quickPlan && <QuickPlanCard plan={analysis.quickPlan} />}
          {analysis.assumptions && <AssumptionsList assumptions={analysis.assumptions} defaultExpanded={false} />}
          {analysis.concerns && <ConcernsList concerns={analysis.concerns} defaultExpanded={false} />}
        </div>
        <div className={styles.resultFooter}>
          <Button variant="default">Cancel</Button>
          <Button variant="default" icon={<ArrowRightIcon />}>
            Plan First
          </Button>
          <Button variant="primary" icon={<PlayIcon />}>
            Execute with Assumptions
          </Button>
        </div>
      </div>
    </div>
  );
}

interface PlanningStateProps {
  messages: ChatPanelMessage[];
  phases: PlanPhase[];
  markdown: string;
  isThinking?: boolean;
}

function PlanningState({ messages, phases, markdown, isThinking = false }: PlanningStateProps) {
  const [docViewMode, setDocViewMode] = useState<ViewMode>('preview');
  const [activeTab, setActiveTab] = useState<'doc' | 'plan'>('plan');

  return (
    <div className={styles.overlay}>
      <div className={styles.planningDialog}>
        <div className={styles.planningHeader}>
          <div className={styles.planningHeaderLeft}>
            <Heading level={2} size={4}>Planning: Real-time Collaborative Editing</Heading>
            <Chip size="sm" variant="default">Collaboration</Chip>
          </div>
          <div className={styles.planningHeaderRight}>
            <Chip size="sm" variant="error">Confidence: Low</Chip>
            <IconButton variant="ghost" icon={<CloseIcon />} aria-label="Close" />
          </div>
        </div>
        <div className={styles.planningBody}>
          <SplitPane
            orientation="horizontal"
            defaultSize="50%"
            collapsible
            first={
              <div className={styles.chatSection}>
                <ChatPanelWrapper messages={messages} isThinking={isThinking} />
              </div>
            }
            second={
              <div className={styles.docSection}>
                <div className={styles.docTabs}>
                  <button
                    className={`${styles.docTab} ${activeTab === 'plan' ? styles.docTabActive : ''}`}
                    onClick={() => setActiveTab('plan')}
                  >
                    Plan
                  </button>
                  <button
                    className={`${styles.docTab} ${activeTab === 'doc' ? styles.docTabActive : ''}`}
                    onClick={() => setActiveTab('doc')}
                  >
                    Document
                  </button>
                </div>
                {activeTab === 'plan' ? (
                  <PlanViewSidebar phases={phases} />
                ) : (
                  <div className={styles.docEditor}>
                    <MarkdownCoEditor
                      value={markdown}
                      mode={docViewMode}
                      onModeChange={setDocViewMode}
                      fullPage
                      placeholder="Plan details..."
                    />
                  </div>
                )}
              </div>
            }
          />
        </div>
        <div className={styles.planningFooter}>
          <div className={styles.footerLeft}>
            <Button variant="ghost" size="sm" shape="pill">Add diagram</Button>
            <Button variant="ghost" size="sm" shape="pill">Add research</Button>
            <Button variant="ghost" size="sm" shape="pill">Break into phases</Button>
          </div>
          <div className={styles.footerRight}>
            <Button variant="default">Save Draft</Button>
            <Button variant="primary" icon={<PlayIcon />}>Execute Plan</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMBINED FLOW COMPONENT
// ============================================

interface NewIdeaInputFlowProps {
  state: FlowState;
  inputTopic?: string;
  topicName?: string;
  analysis?: IdeaAnalysis;
  processingSteps?: AnalysisStep[];
  planningMessages?: ChatPanelMessage[];
  planPhases?: PlanPhase[];
  planMarkdown?: string;
  isThinking?: boolean;
}

function NewIdeaInputFlowComponent({
  state,
  inputTopic = '',
  topicName = 'Authentication',
  analysis,
  processingSteps = analysisSteps,
  planningMessages: messages = planningMessages,
  planPhases: phases = planPhases,
  planMarkdown: markdown = planMarkdown,
  isThinking = false,
}: NewIdeaInputFlowProps) {
  switch (state) {
    case 'input':
      return <InputState topic={inputTopic} topicName={topicName} />;
    case 'processing':
      return (
        <ProcessingState
          topicName={topicName}
          steps={processingSteps}
        />
      );
    case 'simple-result':
      return <SimpleResultState analysis={analysis || simpleAnalysis} />;
    case 'medium-result':
      return <MediumResultState analysis={analysis || mediumAnalysis} />;
    case 'complex-result':
      return <ComplexResultState analysis={analysis || complexAnalysis} />;
    case 'planning':
      return (
        <PlanningState
          messages={messages}
          phases={phases}
          markdown={markdown}
          isThinking={isThinking}
        />
      );
    default:
      return <InputState topic={inputTopic} />;
  }
}

// ============================================
// STORYBOOK CONFIG
// ============================================

const meta: Meta<typeof NewIdeaInputFlowComponent> = {
  title: 'Example Pages/Ideate Ideas/New Idea Flow',
  component: NewIdeaInputFlowComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof NewIdeaInputFlowComponent>;

/**
 * Step 1: Initial input state
 * User sees a centered dialog with a single input field
 */
export const Step1_Input: Story = {
  name: '1. Input - Empty',
  args: {
    state: 'input',
  },
};

/**
 * Step 1b: Input with content
 * User has typed their idea
 */
export const Step1b_InputWithContent: Story = {
  name: '1b. Input - With Content',
  args: {
    state: 'input',
    inputTopic: 'Add real-time collaborative editing with cursor presence',
  },
};

/**
 * Step 2: Processing
 * AI is analyzing the idea and assessing confidence
 */
export const Step2_ProcessingStart: Story = {
  name: '2a. Processing - Start',
  args: {
    state: 'processing',
    inputTopic: 'Add real-time collaborative editing with cursor presence',
    processingSteps: [
      { id: 'parse', label: 'Understanding your idea', status: 'active' },
      { id: 'scope', label: 'Analyzing scope', status: 'pending' },
      { id: 'plan', label: 'Creating approach', status: 'pending' },
    ],
  },
};

export const Step2b_ProcessingMid: Story = {
  name: '2b. Processing - Middle',
  args: {
    state: 'processing',
    inputTopic: 'Add real-time collaborative editing with cursor presence',
    processingSteps: [
      { id: 'parse', label: 'Understanding your idea', status: 'complete' },
      { id: 'scope', label: 'Analyzing scope', status: 'active' },
      { id: 'plan', label: 'Creating approach', status: 'pending' },
    ],
  },
};

export const Step2c_ProcessingEnd: Story = {
  name: '2c. Processing - End',
  args: {
    state: 'processing',
    inputTopic: 'Add real-time collaborative editing with cursor presence',
    processingSteps: [
      { id: 'parse', label: 'Understanding your idea', status: 'complete' },
      { id: 'scope', label: 'Analyzing scope', status: 'complete' },
      { id: 'plan', label: 'Creating approach', status: 'active' },
    ],
  },
};

/**
 * Step 3a: Simple result
 * The idea is straightforward - can execute immediately
 */
export const Step3a_SimpleResult: Story = {
  name: '3a. Result - Simple (Execute Now)',
  args: {
    state: 'simple-result',
    analysis: simpleAnalysis,
  },
};

/**
 * Step 3b: Complex result
 * The idea needs planning before execution
 */
export const Step3b_MediumResult: Story = {
  name: '3b. Result - Medium (Execute or Plan)',
  args: {
    state: 'medium-result',
    analysis: mediumAnalysis,
  },
};

/**
 * Step 3c: Complex result
 * The idea needs planning before execution
 */
export const Step3c_ComplexResult: Story = {
  name: '3c. Result - Complex (Needs Planning)',
  args: {
    state: 'complex-result',
    analysis: complexAnalysis,
  },
};

/**
 * Step 4: Planning mode
 * Split screen with chat and plan document
 */
export const Step4_PlanningStart: Story = {
  name: '4a. Planning - Just Started',
  args: {
    state: 'planning',
    planningMessages: planningMessages,
    planPhases: planPhases,
    planMarkdown: planMarkdown,
    isThinking: false,
  },
};

export const Step4b_PlanningConversation: Story = {
  name: '4b. Planning - With Conversation',
  args: {
    state: 'planning',
    planningMessages: planningConversation,
    planPhases: planPhases,
    planMarkdown: planMarkdown,
    isThinking: false,
  },
};

export const Step4c_PlanningThinking: Story = {
  name: '4c. Planning - Agent Thinking',
  args: {
    state: 'planning',
    planningMessages: [
      ...planningConversation,
      {
        id: 'user-2',
        content: 'Can we also add support for comments and annotations?',
        timestamp: new Date(),
        senderName: 'You',
        isOwn: true,
      },
    ],
    planPhases: planPhases,
    planMarkdown: planMarkdown,
    isThinking: true,
  },
};

/**
 * Alternative simple ideas for comparison
 */
export const SimpleIdea_DarkMode: Story = {
  name: 'Simple - Dark Mode Toggle',
  args: {
    state: 'simple-result',
    analysis: {
      confidence: 'high',
      title: 'Add dark mode toggle',
      summary: 'Add a theme switcher button to toggle between light and dark modes.',
      quickPlan: {
        summary: 'Add theme toggle using existing ThemeProvider and CSS variables.',
        estimatedMinutes: 10,
        steps: [
          'Add toggle button to header',
          'Connect to ThemeProvider context',
          'Persist preference to localStorage',
          'Test both themes',
        ],
        canAutoExecute: true,
      },
      needsPlanning: false,
    },
  },
};

export const SimpleIdea_FixBug: Story = {
  name: 'Simple - Fix Bug',
  args: {
    state: 'simple-result',
    analysis: {
      confidence: 'high',
      title: 'Fix double-click text selection',
      summary: 'Prevent text selection when double-clicking interactive elements.',
      quickPlan: {
        summary: 'Add user-select: none to interactive elements and prevent default on double-click.',
        estimatedMinutes: 3,
        steps: [
          'Add CSS user-select: none to button elements',
          'Add onDoubleClick handler to prevent default',
          'Test in all browsers',
        ],
        canAutoExecute: true,
      },
      needsPlanning: false,
    },
  },
};

export const MediumIdea_FormValidation: Story = {
  name: 'Medium - Form Validation',
  args: {
    state: 'medium-result',
    analysis: {
      confidence: 'moderate',
      title: 'Add comprehensive form validation',
      summary: 'Implement client-side validation with real-time feedback and server-side validation for all forms.',
      needsPlanning: false,
      quickPlan: {
        summary: 'Add form validation using react-hook-form with zod schemas for type-safe validation.',
        estimatedMinutes: 60,
        steps: [
          'Install react-hook-form and zod',
          'Create shared validation schemas',
          'Update forms to use useForm hook',
          'Add error display components',
        ],
        canAutoExecute: true,
      },
      assumptions: [
        'Using react-hook-form with zod for validation',
        'Email validation uses standard RFC 5322 pattern',
        'Required fields show inline error messages',
        'Form submits only when all validations pass',
      ],
      concerns: [
        { text: 'Multiple forms across the application' },
        { text: 'Need consistent validation patterns' },
      ],
    },
  },
};

/**
 * Interactive demo: Click "Analyze Idea" to see the transition
 * Sequenced animation: fade out → resize → fade in
 */
type AnimationPhase = 'idle' | 'fading-out' | 'resizing' | 'fading-in';

function InteractiveFlowDemo() {
  const [currentState, setCurrentState] = useState<'input' | 'processing' | 'complex-result' | 'planning'>('input');
  const [displayState, setDisplayState] = useState<'input' | 'processing' | 'complex-result' | 'planning'>('input');
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [inputValue, setInputValue] = useState('Add real-time collaborative editing');
  const [processingStep, setProcessingStep] = useState(0);

  const transitionTo = (newState: 'input' | 'processing' | 'complex-result' | 'planning') => {
    if (newState === displayState) return;

    // Phase 1: Fade out current content
    setAnimationPhase('fading-out');
    setCurrentState(newState);

    // Phase 2: After fade out, resize dialog
    setTimeout(() => {
      setAnimationPhase('resizing');
      setDisplayState(newState);
    }, 200);

    // Phase 3: After resize, fade in new content
    setTimeout(() => {
      setAnimationPhase('fading-in');
    }, 500);

    // Phase 4: Done
    setTimeout(() => {
      setAnimationPhase('idle');
    }, 700);
  };

  const handleAnalyze = () => {
    transitionTo('processing');
    setProcessingStep(0);

    // Simulate processing steps
    setTimeout(() => setProcessingStep(1), 1200);
    setTimeout(() => setProcessingStep(2), 2000);
    setTimeout(() => transitionTo('complex-result'), 2800);
  };

  const handleReset = () => {
    transitionTo('input');
    setProcessingStep(0);
  };

  const handleStartPlanning = () => {
    transitionTo('planning');
  };

  const dialogRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef<number | undefined>(undefined);
  const [dialogHeight, setDialogHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (dialogRef.current) {
      const el = dialogRef.current;

      // Temporarily set to auto to measure natural height
      el.style.height = 'auto';
      const naturalHeight = el.scrollHeight;

      // Restore previous height immediately (no transition yet)
      if (prevHeightRef.current !== undefined) {
        el.style.height = `${prevHeightRef.current}px`;
        // Force reflow
        void el.offsetHeight;
      }

      // Now set the new height (this will animate)
      prevHeightRef.current = naturalHeight;
      setDialogHeight(naturalHeight);
    }
  }, [displayState, processingStep]);

  const currentSteps: AnalysisStep[] = [
    { id: 'parse', label: 'Understanding your idea', status: processingStep > 0 ? 'complete' : processingStep === 0 ? 'active' : 'pending' },
    { id: 'scope', label: 'Analyzing scope', status: processingStep > 1 ? 'complete' : processingStep === 1 ? 'active' : 'pending' },
    { id: 'plan', label: 'Creating approach', status: processingStep > 2 ? 'complete' : processingStep === 2 ? 'active' : 'pending' },
  ];

  const isVisible = animationPhase === 'idle' || animationPhase === 'fading-in';
  const maxWidth = displayState === 'complex-result' ? 640 : 560;

  const renderHeaderContent = () => {
    if (displayState === 'input') {
      return (
        <>
          <LightbulbIcon className={styles.inputIcon} />
          <Heading level={2} size={4}>New Idea</Heading>
          <Chip size="sm" variant="default">Authentication</Chip>
          <div className={styles.headerSpacer} />
          <IconButton variant="ghost" icon={<CloseIcon />} aria-label="Close" />
        </>
      );
    }

    if (displayState === 'processing') {
      return (
        <>
          <Spinner size="sm" />
          <Heading level={2} size={4}>Analyzing idea...</Heading>
          <Chip size="sm" variant="default">Authentication</Chip>
          <div className={styles.headerSpacer} />
          <IconButton variant="ghost" icon={<CloseIcon />} aria-label="Close" onClick={handleReset} />
        </>
      );
    }

    return (
      <>
        <div className={styles.resultHeaderLeft}>
          <InfoCircleIcon className={styles.warningIcon} />
          <Heading level={2} size={4}>This needs planning</Heading>
        </div>
        <div className={styles.resultHeaderRight}>
          <ConfidenceIndicator confidence="low" />
          <IconButton variant="ghost" icon={<CloseIcon />} aria-label="Close" onClick={handleReset} />
        </div>
      </>
    );
  };

  const renderFooterContent = () => {
    if (displayState === 'input') {
      return (
        <>
          <Button variant="default">Cancel</Button>
          <Button variant="primary" icon={<StarIcon />} disabled={!inputValue.trim()} onClick={handleAnalyze}>
            Analyze Idea
          </Button>
        </>
      );
    }

    if (displayState === 'processing') {
      return <Button variant="default" onClick={handleReset}>Cancel</Button>;
    }

    return (
      <>
        <Button variant="default" onClick={handleReset}>Cancel</Button>
        <Button variant="primary" icon={<ArrowRightIcon />} onClick={handleStartPlanning}>
          Start Planning
        </Button>
      </>
    );
  };

  const showPlanning = displayState === 'planning';
  const showDialog = !showPlanning;

  return (
    <div className={styles.overlay}>
      {/* Small dialog states */}
      <div
        ref={dialogRef}
        className={`${styles.animatedDialog} ${showDialog ? styles.animatedDialogVisible : ''}`}
        style={{ maxWidth, height: dialogHeight }}
      >
        {/* Header - always visible */}
        <div className={displayState === 'complex-result' ? styles.resultHeader : styles.inputHeader}>
          {renderHeaderContent()}
        </div>

        {/* Body - fades in/out */}
        <div className={`${styles.animatedBody} ${isVisible ? styles.animatedBodyVisible : ''}`}>
          {displayState === 'input' && (
            <div className={styles.inputBody}>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="What would you like to build or improve?"
                aria-label="Describe your idea"
                autoFocus
                fullWidth
              />
            </div>
          )}

          {displayState === 'processing' && (
            <div className={styles.inputBody}>
              <AnalysisStepIndicator steps={currentSteps} />
            </div>
          )}

          {displayState === 'complex-result' && (
            <div className={styles.resultBody}>
              <div className={styles.resultSummary}>
                <Heading level={3} size={5}>{complexAnalysis.title}</Heading>
                <Text color="soft">{complexAnalysis.summary}</Text>
              </div>
              {complexAnalysis.concerns && <ConcernsList concerns={complexAnalysis.concerns} />}
              {complexAnalysis.suggestions && (
                <div className={`surface info ${styles.suggestionsList}`}>
                  <Text size="sm" weight="medium" className={styles.suggestionsHeader}>
                    <StarIcon /> Recommendations
                  </Text>
                  {complexAnalysis.suggestions.map((suggestion, index) => (
                    <div key={index} className={styles.suggestionItem}>
                      <Text size="sm">{suggestion}</Text>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - always visible */}
        <div className={displayState === 'complex-result' ? styles.resultFooter : styles.inputFooter}>
          {renderFooterContent()}
        </div>
      </div>

      {/* Planning state - full screen */}
      <div className={`${styles.planningWrapper} ${showPlanning ? styles.planningWrapperVisible : ''}`}>
        <div className={styles.planningDialog}>
          <div className={styles.planningHeader}>
            <div className={styles.planningHeaderLeft}>
              <Heading level={2} size={4}>Planning: Real-time Collaborative Editing</Heading>
              <Chip size="sm" variant="default">Collaboration</Chip>
            </div>
            <div className={styles.planningHeaderRight}>
              <Chip size="sm" variant="error">Confidence: Low</Chip>
              <IconButton variant="ghost" icon={<CloseIcon />} aria-label="Close" onClick={handleReset} />
            </div>
          </div>
          <div className={styles.planningBody}>
            <SplitPane
              orientation="horizontal"
              defaultSize="50%"
              collapsible
              first={
                <div className={styles.chatSection}>
                  <ChatPanelWrapper messages={planningMessages} isThinking={false} />
                </div>
              }
              second={
                <div className={styles.docSection}>
                  <div className={styles.docTabs}>
                    <button className={`${styles.docTab} ${styles.docTabActive}`}>
                      Plan
                    </button>
                    <button className={styles.docTab}>
                      Document
                    </button>
                  </div>
                  <PlanViewSidebar phases={planPhases} />
                </div>
              }
            />
          </div>
          <div className={styles.planningFooter}>
            <div className={styles.footerLeft}>
              <Button variant="ghost" size="sm" shape="pill">Add diagram</Button>
              <Button variant="ghost" size="sm" shape="pill">Add research</Button>
            </div>
            <div className={styles.footerRight}>
              <Button variant="default">Save Draft</Button>
              <Button variant="primary" icon={<PlayIcon />}>Execute Plan</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Interactive_FullFlow: Story = {
  name: 'Interactive - Full Flow Demo',
  render: () => <InteractiveFlowDemo />,
};
