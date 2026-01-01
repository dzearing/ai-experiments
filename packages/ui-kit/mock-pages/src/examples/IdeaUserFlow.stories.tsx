import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Button,
  Heading,
  IconButton,
  Progress,
  SplitPane,
  Spinner,
  Tabs,
  Text,
  Checkbox,
} from '@ui-kit/react';
import { ChatPanel, ChatInput, type ChatPanelMessage } from '@ui-kit/react-chat';
import { MarkdownCoEditor, type ViewMode } from '@ui-kit/react-markdown';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { ArrowRightIcon } from '@ui-kit/icons/ArrowRightIcon';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { ExpandIcon } from '@ui-kit/icons/ExpandIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { ImageIcon } from '@ui-kit/icons/ImageIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { ListIcon } from '@ui-kit/icons/ListIcon';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import styles from './IdeaUserFlow.module.css';

/**
 * # Idea User Flow
 *
 * Shows the complete flow from creating a new idea through planning
 * to execution. Each story represents a step in the journey.
 *
 * ## User Flow States:
 * 1. **New Idea - Empty**: Fresh dialog, Idea Agent greeting, blank doc
 * 2. **New Idea - With Content**: After chatting, doc has content
 * 3. **Planning - Just Started**: Plan Agent session begins
 * 4. **Planning - Plan Generated**: Implementation plan created
 * 5. **Executing**: Claude Code running tools, tasks being completed
 * 6. **Executing - Phase 1 Complete**: Phase 1 finished, ready for feedback
 * 7. **Executing - Phase 1 Iterations**: User requested changes, iterations tracked
 * 8. **All Phases Complete**: All work done, ready to archive or refine
 */

// ============================================
// DATA TYPES
// ============================================

type FlowPhase = 'new' | 'saved' | 'exploring' | 'ready';
type ResourceType = 'idea-doc' | 'plan' | 'diagram' | 'mock' | 'research';

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

interface Resource {
  id: string;
  type: ResourceType;
  title: string;
}

// ============================================
// SAMPLE DATA
// ============================================

const emptyDocMarkdown = `# Untitled Idea

*Add a brief summary of your idea...*

---

Describe your idea in detail...
`;

const partialDocMarkdown = `# Real-time Collaboration

Allow multiple users to work on the same document simultaneously.

**Tags:** collaboration, feature

---

*Describe your idea in detail...*
`;

const completedDocMarkdown = `# Real-time Collaboration

Allow multiple users to work on the same document simultaneously with presence indicators and live cursors.

**Tags:** collaboration, websocket, feature

---

## Goals
- Real-time sync without conflicts
- Show who else is viewing/editing
- Work offline with eventual consistency

## User Stories
- As a user, I want to see other users' cursors so I know where they're working
- As a user, I want my changes to sync instantly without manual refresh
- As a user, I want to work offline and have changes sync when I reconnect
`;

const ideaAgentGreeting: ChatPanelMessage[] = [
  {
    id: 'sys-1',
    content: `So what's on your mind regarding @ui-kit/icons?

Scalable icon library with React components, SVG sprites, WOFF2 fonts, and PNG exports. Provides a comprehensive set of icons for UI development.

Share your idea for extending @ui-kit/icons - whether it's a new export, feature, or capability. I'll help you develop it into a complete idea.`,
    timestamp: new Date(),
    senderName: 'Idea Agent',
    senderColor: 'var(--info-fg)',
    renderMarkdown: true,
  },
];

const ideaAgentConversation: ChatPanelMessage[] = [
  ...ideaAgentGreeting,
  {
    id: 'user-1',
    content: 'I want to add real-time collaboration so multiple people can edit the same document at once.',
    timestamp: new Date(Date.now() - 300000),
    senderName: 'You',
    isOwn: true,
  },
  {
    id: 'assistant-1',
    content: `That's a great feature idea! Real-time collaboration would make the editor much more useful for teams.

I've started filling in your idea document with a title and summary. A few questions to flesh this out:

1. **Presence indicators** - Should users see each other's cursors and selection highlights?
2. **Conflict resolution** - How should we handle when two people edit the same line?
3. **Offline support** - Should edits sync when someone reconnects?

What's most important to you?`,
    timestamp: new Date(Date.now() - 240000),
    senderName: 'Idea Agent',
    senderColor: 'var(--info-fg)',
    renderMarkdown: true,
  },
  {
    id: 'user-2',
    content: 'Yes to all three! Presence is important, and we should use CRDTs for conflict resolution.',
    timestamp: new Date(Date.now() - 180000),
    senderName: 'You',
    isOwn: true,
  },
  {
    id: 'assistant-2',
    content: `Excellent choices! CRDTs (like Yjs or Automerge) are perfect for this - they handle conflicts automatically without a central server.

I've updated your idea document with:
- **Summary** with presence indicators
- **Goals** covering sync, presence, and offline
- **User Stories** from the user's perspective
- **Tags**: collaboration, websocket, feature

Your idea looks ready! Click **Create Idea** to save it, then you can start planning the implementation approach.`,
    timestamp: new Date(Date.now() - 120000),
    senderName: 'Idea Agent',
    senderColor: 'var(--info-fg)',
    renderMarkdown: true,
  },
];

const planAgentGreeting: ChatPanelMessage[] = [
  {
    id: 'assistant-plan-1',
    content: `Welcome! I'm the Plan Agent. I'll help you figure out HOW to implement "Real-time Collaboration".

I can help you create:
- **Implementation Plan** - Phases, tasks, and milestones
- **Architecture Diagrams** - System design visuals
- **UI Mocks** - What it will look like
- **Research Links** - Relevant docs and examples

What would you like to start with? I'd suggest creating an implementation plan first.`,
    timestamp: new Date(Date.now() - 3500000),
    senderName: 'Plan Agent',
    senderColor: 'var(--success-fg)',
    renderMarkdown: true,
  },
];

const planWithPlanConversation: ChatPanelMessage[] = [
  ...planAgentGreeting,
  {
    id: 'user-plan-1',
    content: 'Yes, let\'s create an implementation plan.',
    timestamp: new Date(Date.now() - 3400000),
    senderName: 'You',
    isOwn: true,
  },
  {
    id: 'assistant-plan-2',
    content: `I've created an **Implementation Plan** with 3 phases:

**Phase 1: Core Infrastructure**
Set up Yjs and the sync layer - this is the foundation.

**Phase 2: Presence System**
Add cursor presence and user avatars.

**Phase 3: Integration**
Connect to the editor and polish the UX.

Each phase has specific tasks you can track. I've added this as a new resource tab - check it out!

Would you like me to add more detail to any phase, or create an architecture diagram?`,
    timestamp: new Date(Date.now() - 3300000),
    senderName: 'Plan Agent',
    senderColor: 'var(--success-fg)',
    renderMarkdown: true,
  },
  {
    id: 'user-plan-2',
    content: 'Add an architecture diagram.',
    timestamp: new Date(Date.now() - 3200000),
    senderName: 'You',
    isOwn: true,
  },
  {
    id: 'assistant-plan-3',
    content: `Done! I've added an **Architecture Diagram** showing:

- Client-side Yjs documents
- WebSocket provider for real-time sync
- Awareness protocol for presence
- Server relay for multi-client communication

The plan looks solid. When you're ready, you can click **Execute** to start implementing with Claude Code.`,
    timestamp: new Date(Date.now() - 3100000),
    senderName: 'Plan Agent',
    senderColor: 'var(--success-fg)',
    renderMarkdown: true,
  },
];

// Execution in progress - showing tool usage
const executionInProgressConversation: ChatPanelMessage[] = [
  {
    id: 'user-exec-1',
    content: 'Start executing the plan.',
    timestamp: new Date(Date.now() - 300000),
    senderName: 'You',
    isOwn: true,
  },
  {
    id: 'assistant-exec-1',
    content: `Starting execution of **Phase 1: Core Infrastructure**. I'll begin by setting up the Yjs dependencies.`,
    timestamp: new Date(Date.now() - 290000),
    senderName: 'Claude Code',
    senderColor: 'var(--primary-fg)',
    renderMarkdown: true,
  },
  {
    id: 'tool-exec-1',
    content: `\`\`\`bash
$ pnpm add yjs y-websocket y-indexeddb
\`\`\`

Installing dependencies...`,
    timestamp: new Date(Date.now() - 280000),
    senderName: 'Claude Code',
    senderColor: 'var(--primary-fg)',
    renderMarkdown: true,
  },
  {
    id: 'tool-exec-2',
    content: `\`\`\`
Added 3 packages in 2.4s
\`\`\`

Dependencies installed. Now creating the Yjs document provider...`,
    timestamp: new Date(Date.now() - 260000),
    senderName: 'Claude Code',
    senderColor: 'var(--primary-fg)',
    renderMarkdown: true,
  },
  {
    id: 'tool-exec-3',
    content: `\`\`\`typescript
// src/lib/yjs/provider.ts
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

export function createCollabProvider(docId: string) {
  const doc = new Y.Doc();
  const wsProvider = new WebsocketProvider(
    'wss://your-server.com',
    docId,
    doc
  );
  const persistence = new IndexeddbPersistence(docId, doc);
  return { doc, wsProvider, persistence };
}
\`\`\`

Created the provider. Setting up WebSocket server next...`,
    timestamp: new Date(Date.now() - 240000),
    senderName: 'Claude Code',
    senderColor: 'var(--primary-fg)',
    renderMarkdown: true,
  },
];

// Execution complete
const executionCompleteConversation: ChatPanelMessage[] = [
  ...executionInProgressConversation,
  {
    id: 'tool-exec-4',
    content: `\`\`\`typescript
// src/server/websocket.ts
import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';

const wss = new WebSocketServer({ port: 1234 });
wss.on('connection', setupWSConnection);
\`\`\`

WebSocket server configured.`,
    timestamp: new Date(Date.now() - 200000),
    senderName: 'Claude Code',
    senderColor: 'var(--primary-fg)',
    renderMarkdown: true,
  },
  {
    id: 'assistant-exec-complete',
    content: `**Phase 1 complete!** I've set up:

✅ Yjs and dependencies installed
✅ Document provider with WebSocket sync
✅ IndexedDB persistence for offline support
✅ WebSocket server for real-time collaboration

Ready to move on to **Phase 2: Presence System**, or would you like me to make any changes to what we've built so far?`,
    timestamp: new Date(Date.now() - 180000),
    senderName: 'Claude Code',
    senderColor: 'var(--primary-fg)',
    renderMarkdown: true,
  },
];

const samplePlanPhases: PlanPhase[] = [
  {
    id: 'phase-1',
    title: 'Phase 1: Core Infrastructure',
    description: 'Set up the foundational CRDT and sync layer',
    expanded: true,
    tasks: [
      { id: 'task-1-1', title: 'Install Yjs and y-websocket dependencies', completed: false },
      { id: 'task-1-2', title: 'Create Yjs document provider', completed: false },
      { id: 'task-1-3', title: 'Set up WebSocket server for sync', completed: false },
      { id: 'task-1-4', title: 'Add IndexedDB persistence for offline', completed: false },
    ],
  },
  {
    id: 'phase-2',
    title: 'Phase 2: Presence System',
    description: 'User awareness and cursor presence',
    expanded: false,
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

const completedPlanPhases: PlanPhase[] = samplePlanPhases.map(phase => ({
  ...phase,
  expanded: true,
  tasks: phase.tasks.map(task => ({ ...task, completed: true })),
}));

// Execution in progress - first 2 tasks of phase 1 complete, 3rd in progress
const executingPlanPhases: PlanPhase[] = samplePlanPhases.map((phase, phaseIndex) => ({
  ...phase,
  expanded: phaseIndex === 0,
  tasks: phase.tasks.map((task, taskIndex) => ({
    ...task,
    completed: phaseIndex === 0 && taskIndex < 2,
    inProgress: phaseIndex === 0 && taskIndex === 2,
  })),
}));

// Phase 1 complete
const phase1CompletePlanPhases: PlanPhase[] = samplePlanPhases.map((phase, phaseIndex) => ({
  ...phase,
  expanded: true,
  tasks: phase.tasks.map(task => ({
    ...task,
    completed: phaseIndex === 0,
  })),
}));

// Phase 1 with iterations - showing refinement cycles
const phase1WithIterationsPlanPhases: PlanPhase[] = [
  {
    id: 'phase-1',
    title: 'Phase 1: Core Infrastructure',
    description: 'Set up the foundational CRDT and sync layer',
    expanded: true,
    tasks: [
      { id: 'task-1-1', title: 'Install Yjs and y-websocket dependencies', completed: true },
      { id: 'task-1-2', title: 'Create Yjs document provider', completed: true },
      { id: 'task-1-3', title: 'Set up WebSocket server for sync', completed: true },
      { id: 'task-1-4', title: 'Add IndexedDB persistence for offline', completed: true },
      { id: 'task-1-iter1-1', title: 'Iteration 1: Add connection retry logic', completed: true },
      { id: 'task-1-iter1-2', title: 'Iteration 1: Fix reconnection edge cases', completed: true },
      { id: 'task-1-iter2-1', title: 'Iteration 2: Add connection status indicator', completed: true },
    ],
  },
  {
    id: 'phase-2',
    title: 'Phase 2: Presence System',
    description: 'User awareness and cursor presence',
    expanded: false,
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
    description: 'Connect to editor and polish',
    expanded: false,
    tasks: [
      { id: 'task-3-1', title: 'Integrate with existing editor component', completed: false },
      { id: 'task-3-2', title: 'Add undo/redo support', completed: false },
      { id: 'task-3-3', title: 'Performance optimization', completed: false },
      { id: 'task-3-4', title: 'Final testing and polish', completed: false },
    ],
  },
];

// All phases complete
const allPhasesCompletePlanPhases: PlanPhase[] = phase1WithIterationsPlanPhases.map(phase => ({
  ...phase,
  expanded: true,
  tasks: phase.tasks.map(task => ({ ...task, completed: true })),
}));

// Iteration conversation
const iterationConversation: ChatPanelMessage[] = [
  ...executionCompleteConversation,
  {
    id: 'user-iter-1',
    content: 'The connection drops sometimes. Can you add retry logic?',
    timestamp: new Date(Date.now() - 150000),
    senderName: 'You',
    isOwn: true,
  },
  {
    id: 'assistant-iter-1',
    content: `Good catch! I'll add connection retry logic with exponential backoff.`,
    timestamp: new Date(Date.now() - 140000),
    senderName: 'Claude Code',
    senderColor: 'var(--primary-fg)',
    renderMarkdown: true,
  },
  {
    id: 'tool-iter-1',
    content: `\`\`\`typescript
// Updated src/lib/yjs/provider.ts
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

function connectWithRetry(wsProvider, attempt = 0) {
  wsProvider.connect();
  wsProvider.on('status', ({ status }) => {
    if (status === 'disconnected' && attempt < MAX_RETRIES) {
      const delay = INITIAL_DELAY * Math.pow(2, attempt);
      setTimeout(() => connectWithRetry(wsProvider, attempt + 1), delay);
    }
  });
}
\`\`\`

Added retry logic. Also fixed some edge cases with reconnection.`,
    timestamp: new Date(Date.now() - 120000),
    senderName: 'Claude Code',
    senderColor: 'var(--primary-fg)',
    renderMarkdown: true,
  },
  {
    id: 'user-iter-2',
    content: 'Can you also show a connection status indicator?',
    timestamp: new Date(Date.now() - 100000),
    senderName: 'You',
    isOwn: true,
  },
  {
    id: 'assistant-iter-2',
    content: `\`\`\`typescript
// src/components/ConnectionStatus.tsx
export function ConnectionStatus({ wsProvider }) {
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    wsProvider.on('status', ({ status }) => setStatus(status));
  }, [wsProvider]);

  return (
    <div className={\`status-\${status}\`}>
      {status === 'connected' ? '🟢 Connected' : '🔴 Reconnecting...'}
    </div>
  );
}
\`\`\`

Done! Phase 1 is now complete with all iterations. Ready to move on to Phase 2?`,
    timestamp: new Date(Date.now() - 80000),
    senderName: 'Claude Code',
    senderColor: 'var(--primary-fg)',
    renderMarkdown: true,
  },
];

// All complete conversation
const allCompleteConversation: ChatPanelMessage[] = [
  {
    id: 'summary-1',
    content: `**All phases complete!** Here's what we built:

**Phase 1: Core Infrastructure** ✅
- Yjs document sync with WebSocket
- Offline persistence with IndexedDB
- Connection retry with exponential backoff
- Status indicator component

**Phase 2: Presence System** ✅
- Real-time cursor presence
- User avatars and colors
- Smooth cursor interpolation

**Phase 3: Integration** ✅
- Editor integration complete
- Undo/redo working across users
- Performance optimized

The real-time collaboration feature is ready for testing! Would you like to:
- Run the test suite
- Deploy to staging
- Make additional refinements
- Archive this idea as complete`,
    timestamp: new Date(Date.now() - 30000),
    senderName: 'Claude Code',
    senderColor: 'var(--primary-fg)',
    renderMarkdown: true,
  },
];

const resourcesNew: Resource[] = [
  { id: 'res-idea', type: 'idea-doc', title: 'Idea Document' },
];

const resourcesWithPlan: Resource[] = [
  { id: 'res-idea', type: 'idea-doc', title: 'Idea Document' },
  { id: 'res-plan', type: 'plan', title: 'Implementation Plan' },
];

const resourcesFull: Resource[] = [
  { id: 'res-idea', type: 'idea-doc', title: 'Idea Document' },
  { id: 'res-plan', type: 'plan', title: 'Implementation Plan' },
  { id: 'res-diagram', type: 'diagram', title: 'Architecture Diagram' },
];

// ============================================
// HELPER COMPONENTS
// ============================================

function ResourceIcon({ type }: { type: ResourceType }) {
  switch (type) {
    case 'idea-doc': return <FileIcon />;
    case 'plan': return <ListIcon />;
    case 'diagram': return <CodeIcon />;
    case 'mock': return <ImageIcon />;
    case 'research': return <LinkIcon />;
  }
}

function ChatPanelWrapper({
  messages,
  agentName,
  isConnected = true,
  isThinking = false,
}: {
  messages: ChatPanelMessage[];
  agentName: string;
  isConnected?: boolean;
  isThinking?: boolean;
}) {
  return (
    <div className={styles.chatPanel}>
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderLeft}>
          <Text weight="medium">{agentName}</Text>
          <span className={`${styles.connectionStatus} ${isConnected ? styles.connected : ''}`}>
            <span className={styles.connectionDot} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <IconButton variant="ghost" size="sm" icon={<TrashIcon />} aria-label="Clear chat" />
      </div>

      <ChatPanel
        messages={messages}
        isLoading={isThinking}
        loadingText={`${agentName} is thinking...`}
        className={styles.chatMessages}
      />

      <div className={styles.chatInputArea}>
        <div className={styles.chatInput}>
          <ChatInput
            placeholder="Type a message..."
            size="md"
            fullWidth
          />
        </div>
      </div>
    </div>
  );
}

function IdeaDocEditor({
  markdown,
  viewMode,
  onViewModeChange,
  readOnly = false,
}: {
  markdown: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  readOnly?: boolean;
}) {
  return (
    <div className={styles.docEditor}>
      <MarkdownCoEditor
        value={markdown}
        mode={viewMode}
        onModeChange={onViewModeChange}
        readOnly={readOnly}
        fullPage
        placeholder="Start writing your idea..."
      />
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
    <div className={styles.planView}>
      <div className={styles.planToolbar}>
        <div className={styles.planProgress}>
          <Progress value={progressPercent} size="sm" style={{ width: 120 }} />
          <Text size="sm" color="secondary">{completedTasks}/{totalTasks} tasks</Text>
        </div>
        <Button variant="ghost" size="sm" icon={<EditIcon />}>Edit</Button>
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

function DiagramView() {
  return (
    <div className={styles.diagramView}>
      <div className={styles.diagramToolbar}>
        <Button variant="ghost" size="sm" icon={<EditIcon />}>Edit</Button>
        <Button variant="ghost" size="sm" icon={<ExpandIcon />}>Fullscreen</Button>
      </div>
      <div className={styles.diagramContent}>
        <div className={styles.diagramBox}>
          <div className={styles.diagramNode} style={{ top: '15%', left: '25%' }}>
            <Text size="sm" weight="medium">Client A</Text>
          </div>
          <div className={styles.diagramNode} style={{ top: '15%', left: '75%' }}>
            <Text size="sm" weight="medium">Client B</Text>
          </div>
          <div className={styles.diagramNode} style={{ top: '50%', left: '50%' }}>
            <Text size="sm" weight="medium">WebSocket Server</Text>
          </div>
          <div className={styles.diagramNode} style={{ top: '85%', left: '35%' }}>
            <Text size="sm" weight="medium">Yjs Document</Text>
          </div>
          <div className={styles.diagramNode} style={{ top: '85%', left: '65%' }}>
            <Text size="sm" weight="medium">Awareness</Text>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface StepInfo {
  number: number;
  title: string;
  description: string;
  canGoBack?: boolean;
  canGoNext?: boolean;
  nextLabel?: string;
}

interface IdeaUserFlowProps {
  phase: FlowPhase;
  markdown: string;
  messages: ChatPanelMessage[];
  resources: Resource[];
  activeResourceId: string;
  planPhases?: PlanPhase[];
  agentName: string;
  isThinking?: boolean;
  stepInfo: StepInfo;
  suggestedResponses?: string[];
}

const defaultStepInfo: StepInfo = {
  number: 1,
  title: 'Create Your Idea',
  description: 'Chat with the Idea Agent to shape your concept',
  canGoBack: false,
  canGoNext: false,
};

function IdeaUserFlowComponent({
  phase,
  markdown,
  messages,
  resources,
  activeResourceId,
  planPhases = [],
  agentName,
  isThinking = false,
  stepInfo = defaultStepInfo,
  suggestedResponses = [],
}: IdeaUserFlowProps) {
  const [selectedResourceId, setSelectedResourceId] = useState(activeResourceId);
  const [docViewMode, setDocViewMode] = useState<ViewMode>('preview');

  const selectedResource = resources.find(r => r.id === selectedResourceId);

  const renderResourceContent = () => {
    if (!selectedResource) return null;

    switch (selectedResource.type) {
      case 'idea-doc':
        return (
          <IdeaDocEditor
            markdown={markdown}
            viewMode={docViewMode}
            onViewModeChange={setDocViewMode}
            readOnly={phase !== 'new'}
          />
        );
      case 'plan':
        return <PlanView phases={planPhases} />;
      case 'diagram':
        return <DiagramView />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.dialog} surface raised`}>
        {/* Dialog Header */}
        <div className={styles.dialogHeader}>
          <div className={styles.dialogHeaderLeft}>
            <Heading level={2} size="h5">{stepInfo.title}</Heading>
          </div>
          <div className={styles.dialogHeaderRight}>
            {stepInfo.canGoNext && stepInfo.nextLabel && (
              <Button variant="primary" icon={<ArrowRightIcon />}>
                {stepInfo.nextLabel}
              </Button>
            )}
            <IconButton variant="ghost" icon={<CloseIcon />} aria-label="Close" />
          </div>
        </div>

        {/* Main Content Area */}
        <div className={styles.dialogBody}>
          <SplitPane
            orientation="horizontal"
            defaultSize="50%"
            collapsible
            first={
              <div className={styles.chatSection}>
                <ChatPanelWrapper
                  messages={messages}
                  agentName={agentName}
                  isConnected={true}
                  isThinking={isThinking}
                />
              </div>
            }
            second={
              <div className={styles.docSection}>
                {/* VS Code-style Document Tabs (only show when exploring) */}
                {phase === 'exploring' || phase === 'ready' ? (
                  <>
                    <div className={styles.vscodeTabs}>
                      {resources.map((resource) => (
                        <button
                          key={resource.id}
                          className={`${styles.vscodeTab} ${selectedResourceId === resource.id ? styles.vscodeTabActive : ''}`}
                          onClick={() => setSelectedResourceId(resource.id)}
                        >
                          {resource.title}
                        </button>
                      ))}
                    </div>
                    <div className={styles.resourceContent}>
                      {resources.find((r) => r.id === selectedResourceId)?.type === 'idea-doc' ? (
                        <IdeaDocEditor
                          markdown={markdown}
                          viewMode={docViewMode}
                          onViewModeChange={setDocViewMode}
                          readOnly={phase !== 'new'}
                        />
                      ) : resources.find((r) => r.id === selectedResourceId)?.type === 'plan' ? (
                        <PlanView phases={planPhases} />
                      ) : resources.find((r) => r.id === selectedResourceId)?.type === 'diagram' ? (
                        <DiagramView />
                      ) : null}
                    </div>
                  </>
                ) : (
                  <IdeaDocEditor
                    markdown={markdown}
                    viewMode={docViewMode}
                    onViewModeChange={setDocViewMode}
                    readOnly={phase !== 'new'}
                  />
                )}
              </div>
            }
          />
        </div>

        {/* Footer */}
        <div className={styles.dialogFooter}>
          <div className={styles.footerLeft}>
            {suggestedResponses.length > 0 && (
              <div className={styles.suggestedResponses}>
                {suggestedResponses.map((response, index) => (
                  <button key={index} className={styles.suggestedResponse}>
                    {response}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={styles.footerRight}>
            <Button variant="default">Cancel</Button>
            <Button variant="primary">Save Idea</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STORYBOOK CONFIG
// ============================================

const meta: Meta<typeof IdeaUserFlowComponent> = {
  title: 'Example Pages/Ideate Ideas/User Flow',
  component: IdeaUserFlowComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof IdeaUserFlowComponent>;

/**
 * Step 1: Starting a new idea
 * - Empty document
 * - Idea Agent greeting
 * - "Create Idea" button disabled (no content yet)
 */
export const Step1_NewIdeaEmpty: Story = {
  name: '1. New Idea - Empty',
  args: {
    phase: 'new',
    markdown: emptyDocMarkdown,
    messages: ideaAgentGreeting,
    resources: resourcesNew,
    activeResourceId: 'res-idea',
    agentName: 'Idea Agent',
    stepInfo: {
      number: 1,
      title: 'Create Your Idea',
      description: 'Chat with the Idea Agent to shape your concept',
      canGoBack: false,
      canGoNext: false,
    },
    suggestedResponses: [
      'Add a new feature',
      'Improve performance',
      'Fix a bug',
    ],
  },
};

/**
 * Step 2: Idea with content after chatting
 * - Document has title, summary, description
 * - Chat shows conversation with Idea Agent
 * - "Create Idea" button enabled
 */
export const Step2_NewIdeaWithContent: Story = {
  name: '2. New Idea - With Content',
  args: {
    phase: 'new',
    markdown: completedDocMarkdown,
    messages: ideaAgentConversation,
    resources: resourcesNew,
    activeResourceId: 'res-idea',
    agentName: 'Idea Agent',
    stepInfo: {
      number: 1,
      title: 'Create Your Idea',
      description: 'Your idea is ready - click Next to start planning',
      canGoBack: false,
      canGoNext: true,
      nextLabel: 'Start Planning',
    },
    suggestedResponses: [
      'Add more details',
      'Change the scope',
      'Looks good!',
    ],
  },
};

/**
 * Step 3: Starting planning
 * - Switched to Plan Agent
 * - Agent offers to create plan, diagrams, mocks
 */
export const Step3_PlanningJustStarted: Story = {
  name: '3. Planning - Just Started',
  args: {
    phase: 'exploring',
    markdown: completedDocMarkdown,
    messages: planAgentGreeting,
    resources: resourcesNew,
    activeResourceId: 'res-idea',
    agentName: 'Plan Agent',
    stepInfo: {
      number: 2,
      title: 'Plan Your Idea',
      description: 'Work with the Plan Agent to create a plan',
      canGoBack: true,
      canGoNext: false,
    },
    suggestedResponses: [
      'Create an implementation plan',
      'Draw a diagram',
      'Create a UI mock',
    ],
  },
};

/**
 * Step 4: Plan has been generated
 * - Implementation plan created with phases/tasks
 * - Plan tab active
 * - Chat shows planning conversation
 */
export const Step4_PlanningPlanGenerated: Story = {
  name: '4. Planning - Plan Generated',
  args: {
    phase: 'exploring',
    markdown: completedDocMarkdown,
    messages: planWithPlanConversation,
    resources: resourcesFull,
    activeResourceId: 'res-plan',
    planPhases: samplePlanPhases,
    agentName: 'Plan Agent',
    stepInfo: {
      number: 2,
      title: 'Plan Your Idea',
      description: 'Plan generated - click Next to start execution',
      canGoBack: true,
      canGoNext: true,
      nextLabel: 'Start Execution',
    },
    suggestedResponses: [
      'Add more detail to Phase 1',
      'Create a UI mock',
      'The plan looks good',
    ],
  },
};

/**
 * Step 5: Executing
 * - Claude Code is running tools
 * - Plan tasks being checked off
 * - Terminal output shown in chat
 */
export const Step5_Executing: Story = {
  name: '5. Executing',
  args: {
    phase: 'ready',
    markdown: completedDocMarkdown,
    messages: executionInProgressConversation,
    resources: resourcesFull,
    activeResourceId: 'res-plan',
    planPhases: executingPlanPhases,
    agentName: 'Claude Code',
    stepInfo: {
      number: 3,
      title: 'Execute Your Plan',
      description: 'Claude Code is implementing Phase 1...',
      canGoBack: false,
      canGoNext: false,
    },
    suggestedResponses: [],
  },
};

/**
 * Step 6: Phase 1 complete
 * - Phase 1 finished
 * - Waiting for further instructions
 * - User can request refinements or continue
 */
export const Step6_ExecutingPhase1Complete: Story = {
  name: '6. Executing - Phase 1 Complete',
  args: {
    phase: 'ready',
    markdown: completedDocMarkdown,
    messages: executionCompleteConversation,
    resources: resourcesFull,
    activeResourceId: 'res-plan',
    planPhases: phase1CompletePlanPhases,
    agentName: 'Claude Code',
    stepInfo: {
      number: 3,
      title: 'Execute Your Plan',
      description: 'Phase 1 complete - ready for next steps',
      canGoBack: true,
      canGoNext: false,
    },
    suggestedResponses: [
      'Continue to Phase 2',
      'Make some changes first',
      'Run the tests',
    ],
  },
};

/**
 * Step 7: Phase 1 with iterations
 * - User requested changes to Phase 1
 * - Iteration tasks added and completed
 * - Shows refinement cycle
 */
export const Step7_ExecutingPhase1Iterations: Story = {
  name: '7. Executing - Phase 1 Iterations',
  args: {
    phase: 'ready',
    markdown: completedDocMarkdown,
    messages: iterationConversation,
    resources: resourcesFull,
    activeResourceId: 'res-plan',
    planPhases: phase1WithIterationsPlanPhases,
    agentName: 'Claude Code',
    stepInfo: {
      number: 3,
      title: 'Execute Your Plan',
      description: 'Phase 1 refined with iterations - ready for Phase 2',
      canGoBack: true,
      canGoNext: true,
      nextLabel: 'Continue to Phase 2',
    },
    suggestedResponses: [
      'Continue to Phase 2',
      'One more tweak',
      'Run the tests',
    ],
  },
};

/**
 * Step 8: All phases complete
 * - All phases finished
 * - User can provide more feedback, run tests, or archive
 */
export const Step8_AllPhasesComplete: Story = {
  name: '8. All Phases Complete',
  args: {
    phase: 'ready',
    markdown: completedDocMarkdown,
    messages: allCompleteConversation,
    resources: resourcesFull,
    activeResourceId: 'res-plan',
    planPhases: allPhasesCompletePlanPhases,
    agentName: 'Claude Code',
    stepInfo: {
      number: 3,
      title: 'Execute Your Plan',
      description: 'All phases complete!',
      canGoBack: true,
      canGoNext: true,
      nextLabel: 'Archive Idea',
    },
    suggestedResponses: [
      'Run the test suite',
      'Deploy to staging',
      'Archive as complete',
    ],
  },
};

/**
 * Agent thinking state
 */
export const AgentThinking: Story = {
  name: 'Agent Thinking',
  args: {
    phase: 'new',
    markdown: partialDocMarkdown,
    messages: ideaAgentConversation.slice(0, 2),
    resources: resourcesNew,
    activeResourceId: 'res-idea',
    agentName: 'Idea Agent',
    isThinking: true,
    stepInfo: {
      number: 1,
      title: 'Create Your Idea',
      description: 'Idea Agent is processing your input...',
      canGoBack: false,
      canGoNext: false,
    },
    suggestedResponses: [],
  },
};
