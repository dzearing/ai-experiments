import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Button,
  Chip,
  Heading,
  IconButton,
  Input,
  Progress,
  Spinner,
  Text,
  ShimmerText,
  SplitPane,
} from '@ui-kit/react';
import { ArrowLeftIcon } from '@ui-kit/icons/ArrowLeftIcon';
import { BellIcon } from '@ui-kit/icons/BellIcon';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { ChevronUpIcon } from '@ui-kit/icons/ChevronUpIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { CodeBlockIcon } from '@ui-kit/icons/CodeBlockIcon';
import { CopyIcon } from '@ui-kit/icons/CopyIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { ErrorCircleIcon } from '@ui-kit/icons/ErrorCircleIcon';
import { ExpandIcon } from '@ui-kit/icons/ExpandIcon';
import { ClockIcon } from '@ui-kit/icons/ClockIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { RemoveIcon } from '@ui-kit/icons/RemoveIcon';
import { PauseIcon } from '@ui-kit/icons/PauseIcon';
import { PlayIcon } from '@ui-kit/icons/PlayIcon';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { SendIcon } from '@ui-kit/icons/SendIcon';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import { StopIcon } from '@ui-kit/icons/StopIcon';
import { UndoIcon } from '@ui-kit/icons/UndoIcon';
import styles from './ExecutingIdea.module.css';

/**
 * # Executing Idea
 *
 * Detail view shown when double-clicking an idea in the Executing column
 * of the Kanban board. Shows live Claude Code execution with chat,
 * tool calls, progress tracking, and output panel.
 *
 * ## Component Gap Analysis
 *
 * Components that would improve this implementation:
 *
 * 1. **ToolCallDisplay** - Formatted tool call with icon, name, and result
 * 2. **ExecutionProgress** - Progress bar with step info and elapsed time
 * 3. **LiveOutputPanel** - Auto-scrolling terminal output with copy button
 * 4. **WaitingForInputBanner** - Highlighted prompt with quick-reply options
 * 5. **ExecutionChat** - Chat optimized for execution context (tool calls inline)
 */

// ============================================
// DATA TYPES
// ============================================

type ExecutionStatus = 'running' | 'paused' | 'waiting_for_input' | 'completed' | 'failed';
type ViewTab = 'chat' | 'revisions';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user' | 'system' | 'tool';
  content: string;
  toolName?: string;
  toolSuccess?: boolean;
  timestamp: Date;
  revisionId?: string; // Links message to a revision
}

interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
  diffContent?: string;
}

interface ExecutionRevision {
  id: string;
  number: number;
  summary: string;
  timestamp: Date;
  files: FileChange[];
  isCurrent: boolean;
}

interface TerminalProcess {
  id: string;
  name: string;
  type: 'process' | 'bash';
  output: string;
  status: 'running' | 'exited' | 'error';
  exitCode?: number;
}

interface ExecutingIdeaData {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: ExecutionStatus;
  progress: number;
  currentStep?: string;
  totalSteps?: number;
  completedSteps?: number;
  elapsedSeconds: number;
  chatHistory: ChatMessage[];
  liveOutput: string;
  waitingPrompt?: string;
  waitingOptions?: string[];
  revisions: ExecutionRevision[];
  terminalProcesses?: TerminalProcess[];
}

// ============================================
// SAMPLE DATA
// ============================================

const createChatHistory = (scenario: 'starting' | 'running' | 'waiting' | 'completed'): ChatMessage[] => {
  const base: ChatMessage[] = [
    {
      id: 'sys-1',
      role: 'system',
      content: 'Starting execution of "Real-time Collaboration"...',
      timestamp: new Date(Date.now() - 300000),
    },
    {
      id: 'asst-1',
      role: 'assistant',
      content: "I'll implement real-time collaboration using Yjs as we discussed in the exploration phase. Let me start by setting up the dependencies.",
      timestamp: new Date(Date.now() - 290000),
    },
  ];

  if (scenario === 'starting') return base;

  const withTools: ChatMessage[] = [
    ...base,
    {
      id: 'tool-1',
      role: 'tool',
      toolName: 'bash',
      content: 'npm install yjs y-websocket y-indexeddb',
      toolSuccess: true,
      timestamp: new Date(Date.now() - 280000),
    },
    {
      id: 'asst-2',
      role: 'assistant',
      content: 'Dependencies installed. See [Revision 1 →]',
      timestamp: new Date(Date.now() - 270000),
      revisionId: 'rev-1',
    },
    {
      id: 'tool-2',
      role: 'tool',
      toolName: 'write',
      content: 'Created src/lib/yjs/provider.ts',
      toolSuccess: true,
      timestamp: new Date(Date.now() - 260000),
    },
    {
      id: 'tool-3',
      role: 'tool',
      toolName: 'write',
      content: 'Created src/lib/yjs/awareness.ts',
      toolSuccess: true,
      timestamp: new Date(Date.now() - 250000),
    },
    {
      id: 'asst-3',
      role: 'assistant',
      content: 'Core Yjs infrastructure is in place. See [Revision 2 →]',
      timestamp: new Date(Date.now() - 240000),
      revisionId: 'rev-2',
    },
    {
      id: 'tool-4',
      role: 'tool',
      toolName: 'write',
      content: 'Created src/components/CursorPresence.tsx',
      toolSuccess: true,
      timestamp: new Date(Date.now() - 230000),
    },
  ];

  if (scenario === 'running') {
    return [
      ...withTools,
      {
        id: 'asst-4',
        role: 'assistant',
        content: "The cursor presence component is ready. See [Revision 3 →]. I'm now integrating it with the main editor component...",
        timestamp: new Date(Date.now() - 220000),
        revisionId: 'rev-3',
      },
    ];
  }

  if (scenario === 'waiting') {
    return [
      ...withTools,
      {
        id: 'asst-4',
        role: 'assistant',
        content: "I've analyzed your existing color tokens and have two approaches for the cursor colors. Which would you prefer?",
        timestamp: new Date(Date.now() - 100000),
      },
    ];
  }

  // completed
  return [
    ...withTools,
    {
      id: 'asst-4',
      role: 'assistant',
      content: 'Integration complete! Real-time collaboration is now working. See [Revision 4 →]. Users can see each other\'s cursors and edits sync instantly.',
      timestamp: new Date(Date.now() - 50000),
      revisionId: 'rev-4',
    },
    {
      id: 'tool-5',
      role: 'tool',
      toolName: 'bash',
      content: 'npm test -- --coverage',
      toolSuccess: true,
      timestamp: new Date(Date.now() - 40000),
    },
    {
      id: 'asst-5',
      role: 'assistant',
      content: 'All tests passing with 94% coverage. The implementation is complete and ready for review.',
      timestamp: new Date(Date.now() - 30000),
    },
  ];
};

const sampleLiveOutput = `$ npm install yjs y-websocket y-indexeddb
added 12 packages in 2.3s

$ Creating src/lib/yjs/provider.ts
✓ File created successfully

$ Creating src/lib/yjs/awareness.ts
✓ File created successfully

$ Creating src/components/CursorPresence.tsx
✓ File created successfully

[Claude] Integrating with editor component...`;

const completedOutput = `${sampleLiveOutput}

$ npm test -- --coverage
PASS src/lib/yjs/provider.test.ts
PASS src/lib/yjs/awareness.test.ts
PASS src/components/CursorPresence.test.tsx

Test Suites: 3 passed, 3 total
Tests:       12 passed, 12 total
Coverage:    94.2%

✓ All tests passing`;

// Sample terminal processes
const sampleTerminalProcesses: TerminalProcess[] = [
  {
    id: 'proc-1',
    name: 'Dev Server',
    type: 'process',
    status: 'running',
    output: `$ npm run dev
> vite

  VITE v5.0.0  ready in 312 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.100:3000/
  ➜  press h to show help
`,
  },
  {
    id: 'bash-1',
    name: 'Bash 1',
    type: 'bash',
    status: 'running',
    output: `$ git status
On branch feature/collab
Changes not staged for commit:
  modified:   src/lib/yjs/provider.ts

$ `,
  },
];

// Sample diff content for revisions
const sampleDiffProvider = `@@ -1,5 +1,18 @@
+import { WebsocketProvider } from 'y-websocket';
+import { IndexeddbPersistence } from 'y-indexeddb';
+import * as Y from 'yjs';
+
 export function setupProvider(doc: Y.Doc) {
-  // TODO: implement provider
+  const provider = new WebsocketProvider(
+    'wss://demos.yjs.dev',
+    'my-room',
+    doc
+  );
+
+  const persistence = new IndexeddbPersistence('my-room', doc);
+
+  return { provider, persistence };
 }`;

const sampleDiffAwareness = `@@ -1,3 +1,23 @@
+import { Awareness } from 'y-protocols/awareness';
+import type { WebsocketProvider } from 'y-websocket';
+
+export interface CursorState {
+  user: {
+    name: string;
+    color: string;
+  };
+  cursor: {
+    x: number;
+    y: number;
+  } | null;
+}
+
+export function setupAwareness(provider: WebsocketProvider) {
+  const awareness = provider.awareness;
+
+  return awareness;
+}`;

const sampleDiffCursor = `@@ -0,0 +1,45 @@
+import React, { useEffect, useState } from 'react';
+import type { CursorState } from '../lib/yjs/awareness';
+import styles from './CursorPresence.module.css';
+
+interface CursorPresenceProps {
+  awareness: any;
+  currentUserId: string;
+}
+
+export function CursorPresence({ awareness, currentUserId }: CursorPresenceProps) {
+  const [cursors, setCursors] = useState<Map<number, CursorState>>(new Map());
+
+  useEffect(() => {
+    const handleChange = () => {
+      const states = new Map(awareness.getStates());
+      states.delete(awareness.clientID);
+      setCursors(states as Map<number, CursorState>);
+    };
+
+    awareness.on('change', handleChange);
+    return () => awareness.off('change', handleChange);
+  }, [awareness]);
+
+  return (
+    <div className={styles.cursorContainer}>
+      {Array.from(cursors.entries()).map(([clientId, state]) => (
+        state.cursor && (
+          <div
+            key={clientId}
+            className={styles.cursor}
+            style={{
+              left: state.cursor.x,
+              top: state.cursor.y,
+              backgroundColor: state.user.color,
+            }}
+          >
+            <span className={styles.cursorLabel}>{state.user.name}</span>
+          </div>
+        )
+      ))}
+    </div>
+  );
+}`;

// Sample revisions data
const createRevisions = (scenario: 'starting' | 'running' | 'completed'): ExecutionRevision[] => {
  if (scenario === 'starting') {
    return [
      {
        id: 'rev-1',
        number: 1,
        summary: 'Installed Yjs dependencies',
        timestamp: new Date(Date.now() - 280000),
        isCurrent: true,
        files: [
          { path: 'package.json', status: 'modified', additions: 4, deletions: 0 },
          { path: 'package-lock.json', status: 'modified', additions: 892, deletions: 0 },
        ],
      },
    ];
  }

  if (scenario === 'running') {
    return [
      {
        id: 'rev-3',
        number: 3,
        summary: 'Added cursor presence component',
        timestamp: new Date(Date.now() - 230000),
        isCurrent: true,
        files: [
          { path: 'src/components/CursorPresence.tsx', status: 'added', additions: 45, deletions: 0, diffContent: sampleDiffCursor },
          { path: 'src/components/CursorPresence.module.css', status: 'added', additions: 32, deletions: 0 },
        ],
      },
      {
        id: 'rev-2',
        number: 2,
        summary: 'Set up Yjs provider and awareness',
        timestamp: new Date(Date.now() - 260000),
        isCurrent: false,
        files: [
          { path: 'src/lib/yjs/provider.ts', status: 'added', additions: 18, deletions: 0, diffContent: sampleDiffProvider },
          { path: 'src/lib/yjs/awareness.ts', status: 'added', additions: 23, deletions: 0, diffContent: sampleDiffAwareness },
        ],
      },
      {
        id: 'rev-1',
        number: 1,
        summary: 'Installed Yjs dependencies',
        timestamp: new Date(Date.now() - 280000),
        isCurrent: false,
        files: [
          { path: 'package.json', status: 'modified', additions: 4, deletions: 0 },
          { path: 'package-lock.json', status: 'modified', additions: 892, deletions: 0 },
        ],
      },
    ];
  }

  // completed
  return [
    {
      id: 'rev-4',
      number: 4,
      summary: 'Integrated with main editor',
      timestamp: new Date(Date.now() - 50000),
      isCurrent: true,
      files: [
        { path: 'src/components/Editor.tsx', status: 'modified', additions: 28, deletions: 5 },
        { path: 'src/components/Editor.module.css', status: 'modified', additions: 12, deletions: 0 },
      ],
    },
    {
      id: 'rev-3',
      number: 3,
      summary: 'Added cursor presence component',
      timestamp: new Date(Date.now() - 230000),
      isCurrent: false,
      files: [
        { path: 'src/components/CursorPresence.tsx', status: 'added', additions: 45, deletions: 0, diffContent: sampleDiffCursor },
        { path: 'src/components/CursorPresence.module.css', status: 'added', additions: 32, deletions: 0 },
      ],
    },
    {
      id: 'rev-2',
      number: 2,
      summary: 'Set up Yjs provider and awareness',
      timestamp: new Date(Date.now() - 260000),
      isCurrent: false,
      files: [
        { path: 'src/lib/yjs/provider.ts', status: 'added', additions: 18, deletions: 0, diffContent: sampleDiffProvider },
        { path: 'src/lib/yjs/awareness.ts', status: 'added', additions: 23, deletions: 0, diffContent: sampleDiffAwareness },
      ],
    },
    {
      id: 'rev-1',
      number: 1,
      summary: 'Installed Yjs dependencies',
      timestamp: new Date(Date.now() - 280000),
      isCurrent: false,
      files: [
        { path: 'package.json', status: 'modified', additions: 4, deletions: 0 },
        { path: 'package-lock.json', status: 'modified', additions: 892, deletions: 0 },
      ],
    },
  ];
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// TERMINAL TABS COMPONENT
// ============================================

interface TerminalTabsProps {
  processes: TerminalProcess[];
  activeId: string;
  onSelect: (id: string) => void;
  onNewBash: () => void;
  onClose: (id: string) => void;
}

function TerminalTabs({
  processes,
  activeId,
  onSelect,
  onNewBash,
  onClose,
}: TerminalTabsProps) {
  return (
    <div className={styles.terminalTabs}>
      {processes.map((proc) => (
        <button
          key={proc.id}
          className={`${styles.terminalTab} ${activeId === proc.id ? styles.terminalTabActive : ''}`}
          onClick={() => onSelect(proc.id)}
        >
          {proc.type === 'process' ? <PlayIcon /> : <CodeBlockIcon />}
          <span>{proc.name}</span>
          {proc.status === 'running' && proc.type === 'process' && (
            <Spinner size="sm" />
          )}
          {proc.type === 'bash' && (
            <button
              className={styles.terminalTabClose}
              onClick={(e) => { e.stopPropagation(); onClose(proc.id); }}
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          )}
        </button>
      ))}
      <IconButton
        variant="ghost"
        size="sm"
        icon={<AddIcon />}
        onClick={onNewBash}
        aria-label="New Bash"
      />
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface ExecutingIdeaProps {
  idea: ExecutingIdeaData;
  isThinking?: boolean;
  showOutput?: boolean;
  initialTab?: ViewTab;
  initialRevisionId?: string;
}

function ExecutingIdeaComponent({
  idea,
  isThinking = false,
  showOutput: initialShowOutput = true,
  initialTab = 'chat',
  initialRevisionId,
}: ExecutingIdeaProps) {
  const [userInput, setUserInput] = useState('');
  const [showOutput, setShowOutput] = useState(initialShowOutput);
  const [activeTab, setActiveTab] = useState<ViewTab>(initialTab);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(
    initialRevisionId ?? (idea.revisions.length > 0 ? idea.revisions[0].id : null)
  );
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  // Terminal state
  const [processes, setProcesses] = useState<TerminalProcess[]>(
    idea.terminalProcesses ?? sampleTerminalProcesses
  );
  const [activeTerminalId, setActiveTerminalId] = useState<string>(
    idea.terminalProcesses?.[0]?.id ?? sampleTerminalProcesses[0].id
  );
  const [terminalExpanded, setTerminalExpanded] = useState(initialShowOutput);

  // Get active terminal process
  const activeProcess = processes.find(p => p.id === activeTerminalId);

  // Get selected revision and file
  const selectedRevision = idea.revisions.find(r => r.id === selectedRevisionId);
  const selectedFile = selectedRevision?.files.find(f => f.path === selectedFilePath);

  // Handle revision link clicks from chat
  const handleRevisionClick = (revisionId: string) => {
    setActiveTab('revisions');
    setSelectedRevisionId(revisionId);
    setSelectedFilePath(null);
  };

  // When selecting a revision, auto-select first file
  const handleSelectRevision = (revisionId: string) => {
    setSelectedRevisionId(revisionId);
    const rev = idea.revisions.find(r => r.id === revisionId);
    setSelectedFilePath(rev?.files[0]?.path ?? null);
  };

  // Terminal handlers
  const handleNewBash = () => {
    const bashCount = processes.filter(p => p.type === 'bash').length;
    const newBash: TerminalProcess = {
      id: `bash-${Date.now()}`,
      name: `Bash ${bashCount + 1}`,
      type: 'bash',
      status: 'running',
      output: '$ ',
    };
    setProcesses([...processes, newBash]);
    setActiveTerminalId(newBash.id);
    setTerminalExpanded(true);
  };

  const handleCloseTerminal = (id: string) => {
    const remaining = processes.filter(p => p.id !== id);
    setProcesses(remaining);
    if (activeTerminalId === id && remaining.length > 0) {
      setActiveTerminalId(remaining[0].id);
    }
  };

  const isWaiting = idea.status === 'waiting_for_input';
  const isPaused = idea.status === 'paused';
  const isCompleted = idea.status === 'completed';
  const isFailed = idea.status === 'failed';
  const isRunning = idea.status === 'running';

  const getStatusVariant = () => {
    if (isWaiting) return 'warning';
    if (isRunning) return 'primary';
    if (isCompleted) return 'success';
    if (isFailed) return 'error';
    return 'default';
  };

  const getStatusLabel = () => {
    if (isWaiting) return 'Waiting for Input';
    if (isPaused) return 'Paused';
    if (isCompleted) return 'Completed';
    if (isFailed) return 'Failed';
    return 'Running';
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <IconButton
            variant="ghost"
            icon={<ArrowLeftIcon />}
            aria-label="Back to board"
          />
          <div className={styles.headerTitle}>
            <Heading level={1} size="h3">{idea.title}</Heading>
            <div className={styles.headerMeta}>
              <Chip variant={getStatusVariant()}>{getStatusLabel()}</Chip>
              {idea.tags.map((tag) => (
                <Chip key={tag} variant="default" size="sm">{tag}</Chip>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          {!isCompleted && !isFailed && (
            <>
              {isPaused ? (
                <IconButton
                  variant="primary"
                  icon={<PlayIcon />}
                  aria-label="Resume execution"
                />
              ) : (
                <IconButton
                  variant="ghost"
                  icon={<PauseIcon />}
                  aria-label="Pause execution"
                />
              )}
              <IconButton
                variant="ghost"
                icon={<StopIcon />}
                aria-label="Cancel execution"
              />
            </>
          )}
          <IconButton
            variant="ghost"
            icon={<ExpandIcon />}
            aria-label="Fullscreen"
          />
        </div>
      </header>

      {/* Progress Bar */}
      <div className={styles.progressSection}>
        <div className={styles.progressBar}>
          <Progress
            value={idea.progress}
            variant={isCompleted ? 'success' : isFailed ? 'error' : 'default'}
          />
        </div>
        <div className={styles.progressInfo}>
          <span className={styles.progressPercent}>{idea.progress}%</span>
          {idea.currentStep && (
            <span className={styles.progressStep}>{idea.currentStep}</span>
          )}
          <span className={styles.progressSteps}>
            Step {idea.completedSteps || 0} of {idea.totalSteps || '?'}
          </span>
          <span className={styles.progressTime}>
            {formatTime(idea.elapsedSeconds)}
          </span>
        </div>
      </div>

      {/* Waiting for Input Banner */}
      {isWaiting && idea.waitingPrompt && (
        <div className={styles.waitingBanner}>
          <div className={styles.waitingIcon}>
            <BellIcon />
          </div>
          <div className={styles.waitingContent}>
            <Text weight="medium" className={styles.waitingQuestion}>
              {idea.waitingPrompt}
            </Text>
            {idea.waitingOptions && (
              <div className={styles.waitingOptions}>
                {idea.waitingOptions.map((opt, i) => (
                  <Button key={i} variant="default" size="sm">
                    {opt}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paused Banner */}
      {isPaused && (
        <div className={styles.pausedBanner}>
          <PauseIcon />
          <Text weight="medium">Execution paused. Click resume to continue.</Text>
          <Button variant="primary" size="sm" icon={<PlayIcon />}>
            Resume
          </Button>
        </div>
      )}

      {/* View Tabs */}
      <div className={styles.viewTabs}>
        <button
          className={`${styles.viewTab} ${activeTab === 'chat' ? styles.viewTabActive : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <ChatIcon />
          <span>Chat</span>
        </button>
        <button
          className={`${styles.viewTab} ${activeTab === 'revisions' ? styles.viewTabActive : ''}`}
          onClick={() => setActiveTab('revisions')}
        >
          <ClockIcon />
          <span>Revisions ({idea.revisions.length})</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        <SplitPane
          orientation="vertical"
          first={
            <>
              {/* Chat Tab */}
              {activeTab === 'chat' && (
              <div className={styles.chatSection}>
          <div className={styles.chatMessages}>
            {idea.chatHistory.map((msg) => {
              if (msg.role === 'system') {
                return (
                  <div key={msg.id} className={styles.systemMessage}>
                    <Text size="sm" color="secondary">{msg.content}</Text>
                  </div>
                );
              }

              if (msg.role === 'tool') {
                return (
                  <div
                    key={msg.id}
                    className={`${styles.toolCall} ${
                      msg.toolSuccess ? styles.toolCallSuccess : styles.toolCallError
                    }`}
                  >
                    <div className={styles.toolCallHeader}>
                      {msg.toolSuccess ? <CheckCircleIcon /> : <ErrorCircleIcon />}
                      <span className={styles.toolCallName}>{msg.toolName}</span>
                    </div>
                    <div className={styles.toolCallContent}>
                      <code>{msg.content}</code>
                    </div>
                  </div>
                );
              }

              const isUser = msg.role === 'user';

              // Parse content for revision links [Revision N →]
              const renderContentWithLinks = (content: string, revisionId?: string) => {
                const revisionLinkRegex = /\[Revision \d+ →\]/g;
                const parts = content.split(revisionLinkRegex);
                const matches = content.match(revisionLinkRegex);

                if (!matches || matches.length === 0) {
                  return content;
                }

                return parts.reduce((acc: (string | JSX.Element)[], part, idx) => {
                  acc.push(part);
                  if (matches[idx]) {
                    acc.push(
                      <button
                        key={`link-${idx}`}
                        className={styles.revisionLink}
                        onClick={() => revisionId && handleRevisionClick(revisionId)}
                      >
                        {matches[idx]}
                      </button>
                    );
                  }
                  return acc;
                }, []);
              };

              return (
                <div
                  key={msg.id}
                  className={`${styles.chatMessage} ${
                    isUser ? styles.chatMessageUser : styles.chatMessageAssistant
                  }`}
                >
                  <div className={`${styles.chatAvatar} ${
                    isUser ? styles.chatAvatarUser : styles.chatAvatarAssistant
                  }`}>
                    {isUser ? 'U' : <StarIcon />}
                  </div>
                  <div className={`${styles.chatBubble} ${
                    isUser ? styles.chatBubbleUser : styles.chatBubbleAssistant
                  }`}>
                    {renderContentWithLinks(msg.content, msg.revisionId)}
                  </div>
                </div>
              );
            })}

            {/* AI Thinking Indicator */}
            {isThinking && (
              <div className={styles.thinkingIndicator}>
                <Spinner size="sm" />
                <ShimmerText>Claude is working...</ShimmerText>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className={styles.inputArea}>
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={isWaiting ? 'Type your response...' : 'Ask a question or provide guidance...'}
              disabled={isCompleted || isFailed}
              aria-label="Message input"
            />
            <IconButton
              variant="primary"
              icon={<SendIcon />}
              aria-label="Send message"
              disabled={isCompleted || isFailed || !userInput.trim()}
            />
          </div>
        </div>
        )}

        {/* Revisions Tab */}
        {activeTab === 'revisions' && (
          <div className={styles.revisionsView}>
            {/* Left Column: Revisions List */}
            <div className={styles.revisionsColumn}>
              <div className={styles.revisionsList}>
                {idea.revisions.map((rev) => (
                  <button
                    key={rev.id}
                    className={`${styles.revisionItem} ${selectedRevisionId === rev.id ? styles.revisionItemSelected : ''}`}
                    onClick={() => handleSelectRevision(rev.id)}
                  >
                    <div className={styles.revisionItemHeader}>
                      <span className={styles.revisionNumber}>Rev {rev.number}</span>
                      {rev.isCurrent && <Chip variant="success" size="sm">Current</Chip>}
                    </div>
                    <div className={styles.revisionSummary}>{rev.summary}</div>
                    <div className={styles.revisionMeta}>
                      <span>{rev.files.length} file{rev.files.length !== 1 ? 's' : ''}</span>
                      <span>+{rev.files.reduce((sum, f) => sum + f.additions, 0)}</span>
                      <span>-{rev.files.reduce((sum, f) => sum + f.deletions, 0)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Middle Column: Files List */}
            <div className={styles.filesColumn}>
              {selectedRevision ? (
                <div className={styles.filesList}>
                  <div className={styles.filesHeader}>
                    <Text weight="medium" size="sm">Files in Revision {selectedRevision.number}</Text>
                  </div>
                  {selectedRevision.files.map((file) => (
                    <button
                      key={file.path}
                      className={`${styles.fileItem} ${selectedFilePath === file.path ? styles.fileItemSelected : ''}`}
                      onClick={() => setSelectedFilePath(file.path)}
                    >
                      <span className={`${styles.fileStatus} ${styles[`fileStatus${file.status.charAt(0).toUpperCase()}${file.status.slice(1)}`]}`}>
                        {file.status === 'added' && <AddIcon />}
                        {file.status === 'modified' && <EditIcon />}
                        {file.status === 'deleted' && <RemoveIcon />}
                      </span>
                      <span className={styles.fileName}>{file.path.split('/').pop()}</span>
                      <span className={styles.fileChanges}>
                        <span className={styles.fileAdditions}>+{file.additions}</span>
                        {file.deletions > 0 && <span className={styles.fileDeletions}>-{file.deletions}</span>}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <Text color="secondary">Select a revision</Text>
                </div>
              )}
            </div>

            {/* Right Column: Diff View */}
            <div className={styles.diffColumn}>
              {selectedFile ? (
                <div className={styles.diffView}>
                  <div className={styles.diffHeader}>
                    <Text weight="medium" size="sm">{selectedFile.path}</Text>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      icon={<CopyIcon />}
                      aria-label="Copy diff"
                    />
                  </div>
                  <div className={styles.diffContent}>
                    {selectedFile.diffContent ? (
                      <pre>
                        {selectedFile.diffContent.split('\n').map((line, idx) => {
                          let lineClass = styles.diffLine;
                          if (line.startsWith('+') && !line.startsWith('+++')) {
                            lineClass = `${styles.diffLine} ${styles.diffLineAdded}`;
                          } else if (line.startsWith('-') && !line.startsWith('---')) {
                            lineClass = `${styles.diffLine} ${styles.diffLineDeleted}`;
                          } else if (line.startsWith('@@')) {
                            lineClass = `${styles.diffLine} ${styles.diffLineHunk}`;
                          }
                          return (
                            <div key={idx} className={lineClass}>
                              <span className={styles.diffLineNumber}>{idx + 1}</span>
                              <span className={styles.diffLineContent}>{line}</span>
                            </div>
                          );
                        })}
                      </pre>
                    ) : (
                      <div className={styles.noDiff}>
                        <Text color="secondary">Diff not available for this file</Text>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <CodeBlockIcon />
                  <Text color="secondary">Select a file to view diff</Text>
                </div>
              )}
            </div>

            {/* Revert Action */}
            {selectedRevision && !selectedRevision.isCurrent && (
              <div className={styles.revertAction}>
                <Button variant="default" icon={<UndoIcon />}>
                  Revert to Revision {selectedRevision.number}
                </Button>
              </div>
            )}
          </div>
        )}
            </>
          }
          second={
            <div className={styles.terminalPanel}>
              <TerminalTabs
                processes={processes}
                activeId={activeTerminalId}
                onSelect={setActiveTerminalId}
                onNewBash={handleNewBash}
                onClose={handleCloseTerminal}
              />
              <div className={styles.terminalContent}>
                <pre>{activeProcess?.output ?? ''}</pre>
              </div>
            </div>
          }
          defaultSize={450}
          minSize={150}
          maxSize={600}
        />
      </div>

      {/* Completion Actions */}
      {isCompleted && (
        <div className={styles.completionActions}>
          <Button variant="default">View Changes</Button>
          <Button variant="default">Run Again</Button>
          <Button variant="primary">Move to Done</Button>
        </div>
      )}
    </div>
  );
}

// ============================================
// STORYBOOK CONFIG
// ============================================

const meta: Meta<typeof ExecutingIdeaComponent> = {
  title: 'Example Pages/Ideate Ideas/Execute',
  component: ExecutingIdeaComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ExecutingIdeaComponent>;

// Base idea for stories
const baseIdea: ExecutingIdeaData = {
  id: 'idea-1',
  title: 'Real-time Collaboration',
  description: 'Add real-time collaborative editing using Yjs for cursor presence and document sync.',
  tags: ['feature', 'collaboration'],
  status: 'running',
  progress: 65,
  currentStep: 'Integrating cursor presence',
  totalSteps: 8,
  completedSteps: 5,
  elapsedSeconds: 312,
  chatHistory: createChatHistory('running'),
  liveOutput: sampleLiveOutput,
  revisions: createRevisions('running'),
};

export const Default: Story = {
  args: {
    idea: baseIdea,
    isThinking: false,
    showOutput: true,
  },
};

export const Starting: Story = {
  args: {
    idea: {
      ...baseIdea,
      progress: 5,
      currentStep: 'Analyzing requirements',
      completedSteps: 0,
      elapsedSeconds: 12,
      chatHistory: createChatHistory('starting'),
      liveOutput: '',
      revisions: [],
    },
    isThinking: true,
    showOutput: false,
  },
};

export const Running: Story = {
  args: {
    idea: baseIdea,
    isThinking: true,
    showOutput: true,
  },
};

export const WaitingForInput: Story = {
  args: {
    idea: {
      ...baseIdea,
      status: 'waiting_for_input',
      progress: 45,
      currentStep: 'Choosing cursor colors',
      completedSteps: 3,
      chatHistory: createChatHistory('waiting'),
      waitingPrompt: 'Which cursor color scheme would you prefer for collaboration?',
      waitingOptions: ['Rainbow (unique per user)', 'Brand colors only', 'Let me specify'],
    },
    isThinking: false,
    showOutput: true,
  },
};

export const Paused: Story = {
  args: {
    idea: {
      ...baseIdea,
      status: 'paused',
      progress: 65,
    },
    isThinking: false,
    showOutput: true,
  },
};

export const Completed: Story = {
  args: {
    idea: {
      ...baseIdea,
      status: 'completed',
      progress: 100,
      currentStep: undefined,
      completedSteps: 8,
      elapsedSeconds: 480,
      chatHistory: createChatHistory('completed'),
      liveOutput: completedOutput,
      revisions: createRevisions('completed'),
    },
    isThinking: false,
    showOutput: true,
  },
};

export const Failed: Story = {
  args: {
    idea: {
      ...baseIdea,
      status: 'failed',
      progress: 45,
      currentStep: 'Failed at npm install',
      completedSteps: 2,
      chatHistory: [
        ...createChatHistory('starting'),
        {
          id: 'tool-fail',
          role: 'tool',
          toolName: 'bash',
          content: 'npm ERR! peer dep missing: react@^18.0.0',
          toolSuccess: false,
          timestamp: new Date(),
        },
        {
          id: 'asst-fail',
          role: 'assistant',
          content: 'The installation failed due to a peer dependency conflict. Your project uses React 17 but yjs requires React 18+. Would you like me to try an alternative approach?',
          timestamp: new Date(),
        },
      ],
      liveOutput: `$ npm install yjs y-websocket
npm ERR! peer dep missing: react@^18.0.0, required by y-presence@1.0.0
npm ERR! code ERESOLVE`,
      revisions: createRevisions('starting'),
    },
    isThinking: false,
    showOutput: true,
  },
};

export const OutputCollapsed: Story = {
  args: {
    idea: baseIdea,
    isThinking: true,
    showOutput: false,
  },
};

// Revisions View Stories
export const RevisionsView: Story = {
  args: {
    idea: baseIdea,
    isThinking: false,
    showOutput: false,
    initialTab: 'revisions',
  },
};

export const RevisionsViewWithDiff: Story = {
  args: {
    idea: baseIdea,
    isThinking: false,
    showOutput: false,
    initialTab: 'revisions',
    initialRevisionId: 'rev-2',
  },
};

export const RevisionsViewCompleted: Story = {
  args: {
    idea: {
      ...baseIdea,
      status: 'completed',
      progress: 100,
      currentStep: undefined,
      completedSteps: 8,
      elapsedSeconds: 480,
      chatHistory: createChatHistory('completed'),
      liveOutput: completedOutput,
      revisions: createRevisions('completed'),
    },
    isThinking: false,
    showOutput: false,
    initialTab: 'revisions',
  },
};
