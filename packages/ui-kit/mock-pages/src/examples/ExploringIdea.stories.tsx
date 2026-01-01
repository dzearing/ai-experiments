import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Button,
  Chip,
  Heading,
  IconButton,
  Input,
  Progress,
  Text,
  Spinner,
  ShimmerText,
  Checkbox,
  SplitPane,
} from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { ArrowLeftIcon } from '@ui-kit/icons/ArrowLeftIcon';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { ImageIcon } from '@ui-kit/icons/ImageIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { ListIcon } from '@ui-kit/icons/ListIcon';
import { PlayIcon } from '@ui-kit/icons/PlayIcon';
import { SendIcon } from '@ui-kit/icons/SendIcon';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import { WarningIcon } from '@ui-kit/icons/WarningIcon';
import styles from './ExploringIdea.module.css';

/**
 * # Exploring Idea
 *
 * Exploration view for fleshing out an idea before execution.
 * Layout mirrors idea creation: Chat on LEFT, resources on RIGHT.
 *
 * Resources include:
 * - Idea Doc (the original markdown document)
 * - Implementation Plan (interactive rich document)
 * - Diagrams / Flow charts
 * - Visual Mocks
 * - Research links
 *
 * The chat (Explore Agent) helps build and refine these resources.
 */

// ============================================
// DATA TYPES
// ============================================

type ResourceType = 'idea-doc' | 'plan' | 'diagram' | 'mock' | 'research';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  createdAt: Date;
  updatedAt: Date;
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
}

interface ExploringIdeaData {
  id: string;
  title: string;
  description: string;
  tags: string[];
  chatHistory: ChatMessage[];
  resources: Resource[];
  ideaDocContent: string;
  planPhases: PlanPhase[];
}

// ============================================
// SAMPLE DATA
// ============================================

const sampleChatHistory: ChatMessage[] = [
  {
    id: 'sys-1',
    role: 'system',
    content: 'Explore Agent helps you figure out HOW to implement your idea. I can help create implementation plans, diagrams, research, and mocks.',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: 'user-1',
    role: 'user',
    content: 'Help me create an implementation plan for real-time collaboration.',
    timestamp: new Date(Date.now() - 3500000),
  },
  {
    id: 'assistant-1',
    role: 'assistant',
    content: `I'll help you create a comprehensive implementation plan. Based on your idea document, here's what I'm thinking:

**Approach: CRDT-based with Yjs**

I've created an Implementation Plan resource with 3 phases:
1. Core Infrastructure - Set up Yjs and WebSocket server
2. Presence System - User cursors and avatars
3. Integration - Connect to existing editor

Would you like me to add more detail to any phase, or create a diagram showing the architecture?`,
    timestamp: new Date(Date.now() - 3400000),
  },
  {
    id: 'user-2',
    role: 'user',
    content: 'Yes, create an architecture diagram.',
    timestamp: new Date(Date.now() - 3000000),
  },
  {
    id: 'assistant-2',
    role: 'assistant',
    content: `I've added an Architecture Diagram resource. It shows:

- Client-side Yjs document
- WebSocket provider for sync
- Awareness protocol for presence
- Server relay for multi-client sync

The diagram is interactive - you can click on components to see more details. Want me to also create a UI mock showing what the cursor presence will look like?`,
    timestamp: new Date(Date.now() - 2900000),
  },
];

const sampleResources: Resource[] = [
  {
    id: 'res-idea',
    type: 'idea-doc',
    title: 'Idea Document',
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'res-plan',
    type: 'plan',
    title: 'Implementation Plan',
    createdAt: new Date(Date.now() - 3400000),
    updatedAt: new Date(Date.now() - 2900000),
  },
  {
    id: 'res-diagram',
    type: 'diagram',
    title: 'Architecture Diagram',
    createdAt: new Date(Date.now() - 2900000),
    updatedAt: new Date(Date.now() - 2900000),
  },
];

const sampleIdeaDocContent = `# Real-time Collaboration

## Overview
Allow multiple users to work on the same document simultaneously with presence indicators and live cursors.

## Goals
- Real-time sync without conflicts
- Show who else is viewing/editing
- Work offline with eventual consistency

## User Stories
- As a user, I want to see other users' cursors so I know where they're working
- As a user, I want my changes to sync instantly without manual refresh
- As a user, I want to work offline and have changes sync when I reconnect

## Open Questions
- [ ] What's the max number of concurrent users?
- [ ] Do we need undo/redo across users?
- [x] Which CRDT library to use? → Yjs
`;

const samplePlanPhases: PlanPhase[] = [
  {
    id: 'phase-1',
    title: 'Phase 1: Core Infrastructure',
    description: 'Set up the foundational CRDT and sync layer',
    expanded: true,
    tasks: [
      { id: 'task-1-1', title: 'Install Yjs and y-websocket dependencies', completed: true },
      { id: 'task-1-2', title: 'Create Yjs document provider', completed: true },
      { id: 'task-1-3', title: 'Set up WebSocket server for sync', completed: false },
      { id: 'task-1-4', title: 'Add IndexedDB persistence for offline', completed: false },
    ],
  },
  {
    id: 'phase-2',
    title: 'Phase 2: Presence System',
    description: 'User awareness and cursor presence',
    expanded: true,
    tasks: [
      { id: 'task-2-1', title: 'Implement awareness protocol', completed: false },
      { id: 'task-2-2', title: 'Create CursorPresence component', completed: false },
      { id: 'task-2-3', title: 'Add user avatar display', completed: false },
      { id: 'task-2-4', title: 'Smooth cursor interpolation', completed: false },
    ],
  },
  {
    id: 'phase-3',
    title: 'Phase 3: Integration',
    description: 'Connect to existing editor and polish',
    expanded: false,
    tasks: [
      { id: 'task-3-1', title: 'Integrate with editor component', completed: false },
      { id: 'task-3-2', title: 'Handle connection state UI', completed: false },
      { id: 'task-3-3', title: 'Add reconnection logic', completed: false },
      { id: 'task-3-4', title: 'Write tests', completed: false },
    ],
  },
];

const sampleIdea: ExploringIdeaData = {
  id: 'idea-1',
  title: 'Real-time Collaboration',
  description: 'Allow multiple users to work on the same document simultaneously with presence indicators and live cursors.',
  tags: ['collaboration', 'websocket', 'feature'],
  chatHistory: sampleChatHistory,
  resources: sampleResources,
  ideaDocContent: sampleIdeaDocContent,
  planPhases: samplePlanPhases,
};

// ============================================
// HELPER COMPONENTS
// ============================================

function ResourceIcon({ type }: { type: ResourceType }) {
  switch (type) {
    case 'idea-doc':
      return <FileIcon />;
    case 'plan':
      return <ListIcon />;
    case 'diagram':
      return <CodeIcon />;
    case 'mock':
      return <ImageIcon />;
    case 'research':
      return <LinkIcon />;
  }
}

function ChatPanel({
  messages,
  isThinking,
}: {
  messages: ChatMessage[];
  isThinking?: boolean;
}) {
  return (
    <div className={styles.chatPanel}>
      <div className={styles.chatHeader}>
        <Heading level={2} size="h5">Explore Agent</Heading>
        <Text size="sm" color="secondary">Helps build resources</Text>
      </div>
      <div className={styles.chatMessages}>
        {messages.map((msg) => {
          if (msg.role === 'system') {
            return (
              <div key={msg.id} className={styles.systemMessage}>
                <Text size="sm" color="secondary">{msg.content}</Text>
              </div>
            );
          }

          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`${styles.chatMessage} ${isUser ? styles.chatMessageUser : styles.chatMessageAssistant}`}
            >
              <div className={`${styles.chatAvatar} ${isUser ? styles.chatAvatarUser : styles.chatAvatarAssistant}`}>
                {isUser ? 'U' : <StarIcon />}
              </div>
              <div className={`${styles.chatBubble} ${isUser ? styles.chatBubbleUser : styles.chatBubbleAssistant}`}>
                {msg.content}
              </div>
            </div>
          );
        })}
        {isThinking && (
          <div className={styles.thinkingIndicator}>
            <Spinner size="sm" />
            <ShimmerText>Explore Agent is thinking...</ShimmerText>
          </div>
        )}
      </div>
      <div className={styles.chatInputArea}>
        <Input placeholder="Ask for help building resources..." aria-label="Chat input" />
        <IconButton variant="primary" icon={<SendIcon />} aria-label="Send" />
      </div>
      <div className={styles.chatSuggestions}>
        <Button variant="ghost" size="sm" shape="pill">Create a diagram</Button>
        <Button variant="ghost" size="sm" shape="pill">Add implementation details</Button>
        <Button variant="ghost" size="sm" shape="pill">Generate a mock</Button>
      </div>
    </div>
  );
}

function IdeaDocView({ content }: { content: string }) {
  return (
    <div className={styles.resourceContent}>
      <div className={styles.resourceToolbar}>
        <Button variant="ghost" size="sm" icon={<EditIcon />}>Edit</Button>
      </div>
      <div className={styles.markdownContent}>
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{content}</pre>
      </div>
    </div>
  );
}

function PlanView({ phases }: { phases: PlanPhase[] }) {
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
    <div className={styles.resourceContent}>
      <div className={styles.resourceToolbar}>
        <div className={styles.planProgress}>
          <Progress value={progressPercent} size="sm" style={{ width: 120 }} />
          <Text size="sm" color="secondary">{completedTasks}/{totalTasks} tasks</Text>
        </div>
        <Button variant="ghost" size="sm" icon={<EditIcon />}>Edit</Button>
        <Button variant="ghost" size="sm" icon={<AddIcon />}>Add Phase</Button>
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
                    <CheckCircleIcon style={{ color: 'var(--color-success-text)' }} />
                  ) : (
                    <Text size="sm" color="secondary">{phaseCompletedTasks}/{phase.tasks.length}</Text>
                  )}
                </span>
              </button>
              {isExpanded && (
                <div className={styles.planPhaseContent}>
                  {phase.description && (
                    <Text size="sm" color="secondary" className={styles.planPhaseDescription}>
                      {phase.description}
                    </Text>
                  )}
                  <div className={styles.planTasks}>
                    {phase.tasks.map((task) => (
                      <div key={task.id} className={styles.planTask}>
                        <Checkbox checked={task.completed} aria-label={task.title} />
                        <span className={`${styles.planTaskTitle} ${task.completed ? styles.planTaskCompleted : ''}`}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                    <button className={styles.planAddTask}>
                      <AddIcon />
                      <span>Add task</span>
                    </button>
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

function DiagramView() {
  return (
    <div className={styles.resourceContent}>
      <div className={styles.resourceToolbar}>
        <Button variant="ghost" size="sm" icon={<EditIcon />}>Edit</Button>
      </div>
      <div className={styles.diagramPlaceholder}>
        <div className={styles.diagramBox}>
          <div className={styles.diagramNode} style={{ top: '10%', left: '50%' }}>
            <Text size="sm" weight="medium">Client A</Text>
          </div>
          <div className={styles.diagramNode} style={{ top: '10%', left: '75%' }}>
            <Text size="sm" weight="medium">Client B</Text>
          </div>
          <div className={styles.diagramNode} style={{ top: '40%', left: '62.5%' }}>
            <Text size="sm" weight="medium">WebSocket Server</Text>
          </div>
          <div className={styles.diagramNode} style={{ top: '70%', left: '40%' }}>
            <Text size="sm" weight="medium">Yjs Document</Text>
          </div>
          <div className={styles.diagramNode} style={{ top: '70%', left: '75%' }}>
            <Text size="sm" weight="medium">Awareness</Text>
          </div>
        </div>
        <Text size="sm" color="secondary" style={{ textAlign: 'center', marginTop: 'var(--spacing)' }}>
          Interactive diagram - click nodes to see details
        </Text>
      </div>
    </div>
  );
}

function EmptyResourceView({ type }: { type: ResourceType }) {
  return (
    <div className={styles.emptyResource}>
      <ResourceIcon type={type} />
      <Text weight="medium">No {type} resource yet</Text>
      <Text size="sm" color="secondary">Ask the Explore Agent to help create one</Text>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface ExploringIdeaProps {
  idea?: ExploringIdeaData;
  activeResourceId?: string;
  isThinking?: boolean;
}

function ExploringIdeaComponent({
  idea = sampleIdea,
  activeResourceId,
  isThinking = false,
}: ExploringIdeaProps) {
  const [selectedResourceId, setSelectedResourceId] = useState(
    activeResourceId || idea.resources[0]?.id || 'res-idea'
  );

  const selectedResource = idea.resources.find(r => r.id === selectedResourceId);

  const renderResourceContent = () => {
    if (!selectedResource) return <EmptyResourceView type="idea-doc" />;

    switch (selectedResource.type) {
      case 'idea-doc':
        return <IdeaDocView content={idea.ideaDocContent} />;
      case 'plan':
        return <PlanView phases={idea.planPhases} />;
      case 'diagram':
        return <DiagramView />;
      default:
        return <EmptyResourceView type={selectedResource.type} />;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <IconButton variant="ghost" icon={<ArrowLeftIcon />} aria-label="Back to board" />
          <Heading level={1} size="h4">{idea.title}</Heading>
          <Chip variant="info">Exploring</Chip>
        </div>
        <div className={styles.headerRight}>
          <Button variant="default" icon={<PlayIcon />}>Preview</Button>
          <Button variant="primary" icon={<PlayIcon />}>Execute</Button>
        </div>
      </header>

      {/* Main Content: Chat Left, Resources Right */}
      <div className={styles.mainContent}>
        <SplitPane
          first={<ChatPanel messages={idea.chatHistory} isThinking={isThinking} />}
          second={
            <div className={styles.resourcesPanel}>
          {/* Resource Tabs */}
          <div className={styles.resourceTabs}>
            {idea.resources.map((resource) => (
              <button
                key={resource.id}
                className={`${styles.resourceTab} ${selectedResourceId === resource.id ? styles.resourceTabActive : ''}`}
                onClick={() => setSelectedResourceId(resource.id)}
              >
                <ResourceIcon type={resource.type} />
                <span>{resource.title}</span>
              </button>
            ))}
            <button className={styles.resourceTabAdd}>
              <AddIcon />
            </button>
          </div>

          {/* Resource Content */}
          <div className={styles.resourceView}>
            {renderResourceContent()}
          </div>
            </div>
          }
          orientation="horizontal"
          defaultSize={380}
          minSize={280}
          maxSize={500}
          collapsible
        />
      </div>
    </div>
  );
}

// ============================================
// STORYBOOK CONFIG
// ============================================

const meta: Meta<typeof ExploringIdeaComponent> = {
  title: 'Example Pages/Ideate Ideas/Explore',
  component: ExploringIdeaComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ExploringIdeaComponent>;

export const Default: Story = {
  args: {
    idea: sampleIdea,
    activeResourceId: 'res-idea',
  },
};

export const ViewingPlan: Story = {
  args: {
    idea: sampleIdea,
    activeResourceId: 'res-plan',
  },
};

export const ViewingDiagram: Story = {
  args: {
    idea: sampleIdea,
    activeResourceId: 'res-diagram',
  },
};

export const AgentThinking: Story = {
  args: {
    idea: sampleIdea,
    activeResourceId: 'res-plan',
    isThinking: true,
  },
};

export const JustStarted: Story = {
  args: {
    idea: {
      ...sampleIdea,
      chatHistory: [sampleChatHistory[0]],
      resources: [sampleResources[0]],
      planPhases: [],
    },
    activeResourceId: 'res-idea',
  },
};

export const PlanInProgress: Story = {
  args: {
    idea: {
      ...sampleIdea,
      planPhases: samplePlanPhases.map((phase, i) => ({
        ...phase,
        tasks: phase.tasks.map((task, j) => ({
          ...task,
          completed: i === 0 || (i === 1 && j < 2),
        })),
      })),
    },
    activeResourceId: 'res-plan',
  },
};
