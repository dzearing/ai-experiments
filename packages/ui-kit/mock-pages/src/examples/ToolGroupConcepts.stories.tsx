import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect, useRef } from 'react';
import { Text, Stack, Chip, Button, Spinner } from '@ui-kit/react';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { ChevronUpIcon } from '@ui-kit/icons/ChevronUpIcon';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { XCircleIcon } from '@ui-kit/icons/XCircleIcon';
import { SearchIcon } from '@ui-kit/icons/SearchIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { GlobeIcon } from '@ui-kit/icons/GlobeIcon';
import styles from './ToolGroupConcepts.module.css';

/**
 * # Tool Group Concepts
 *
 * Exploration of tool grouping UI for Claude Code Web.
 *
 * ## Key Concepts
 *
 * 1. **Consecutive tools are grouped** - Tools that execute back-to-back form a group
 * 2. **Text breaks groups** - If assistant text appears, it ends the current group
 * 3. **Collapsed shows active tool** - Only the last/active tool visible when collapsed
 * 4. **Expandable** - Click chevron to see all tools in the group
 * 5. **Individual tools expandable** - Each tool can show its output
 *
 * ## Tool States
 * - Running: Spinner + "Running..." text
 * - Complete: Checkmark
 * - Error: Red X
 *
 * ## Animation Concepts
 * - When new tool starts: current slides up/clips, new slides up from bottom
 * - Transition: ~200ms ease-out
 */

type ToolStatus = 'running' | 'complete' | 'error';

interface SummarySegment {
  text: string;
  type: 'label' | 'value';
}

interface ToolCall {
  id: string;
  name: string;
  icon: React.ReactNode;
  summary: SummarySegment[];
  status: ToolStatus;
  output?: string;
}

interface ToolItemProps {
  tool: ToolCall;
  isExpanded: boolean;
  onToggle: () => void;
  showOutput?: boolean;
}

function ToolItem({ tool, isExpanded, onToggle, showOutput = true }: ToolItemProps) {
  return (
    <div className={styles.toolItem}>
      <button
        className={styles.toolItemHeader}
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <span className={styles.toolStatus}>
          {tool.status === 'running' && (
            <Spinner size="sm" inherit />
          )}
          {tool.status === 'complete' && (
            <CheckCircleIcon className={styles.successIcon} />
          )}
          {tool.status === 'error' && (
            <XCircleIcon className={styles.errorIcon} />
          )}
        </span>
        <span className={styles.toolIcon}>{tool.icon}</span>
        <span className={styles.toolSummary}>
          {tool.summary.map((segment, i) => (
            <span
              key={i}
              className={segment.type === 'label' ? styles.toolLabel : styles.toolValue}
            >
              {segment.text}
            </span>
          ))}
        </span>
        {showOutput && tool.output && (
          <span className={styles.toolChevron}>
            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </span>
        )}
      </button>
      {isExpanded && showOutput && tool.output && (
        <div className={styles.toolOutput}>
          <pre>{tool.output}</pre>
        </div>
      )}
    </div>
  );
}

interface ToolGroupProps {
  tools: ToolCall[];
  initialExpanded?: boolean;
}

function ToolGroup({ tools, initialExpanded = false }: ToolGroupProps) {
  const [isGroupExpanded, setIsGroupExpanded] = useState(initialExpanded);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  const activeTool = tools[tools.length - 1];
  const hasMultipleTools = tools.length > 1;
  const allComplete = tools.every(t => t.status !== 'running');

  const toggleTool = (id: string) => {
    setExpandedTools(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={styles.toolGroup}>
      {!isGroupExpanded ? (
        // Collapsed state - show only active tool
        <div className={styles.toolGroupCollapsed}>
          <div className={styles.toolGroupHeader}>
            <ToolItem
              tool={activeTool}
              isExpanded={expandedTools.has(activeTool.id)}
              onToggle={() => toggleTool(activeTool.id)}
            />
            {hasMultipleTools && (
              <button
                className={styles.toolGroupExpandBtn}
                onClick={() => setIsGroupExpanded(true)}
                aria-label={`Expand to see all ${tools.length} tools`}
              >
                <Chip size="sm" variant={allComplete ? 'success' : 'info'}>
                  {tools.length} tools
                </Chip>
                <ChevronDownIcon className={styles.groupChevron} />
              </button>
            )}
          </div>
        </div>
      ) : (
        // Expanded state - show all tools
        <div className={styles.toolGroupExpanded}>
          <button
            className={styles.toolGroupCollapseBtn}
            onClick={() => setIsGroupExpanded(false)}
          >
            <Chip size="sm" variant={allComplete ? 'success' : 'info'}>
              {tools.length} tools
            </Chip>
            <ChevronUpIcon className={styles.groupChevron} />
          </button>
          <div className={styles.toolList}>
            {tools.map((tool) => (
              <ToolItem
                key={tool.id}
                tool={tool}
                isExpanded={expandedTools.has(tool.id)}
                onToggle={() => toggleTool(tool.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Demo data
const sampleTools: ToolCall[] = [
  {
    id: '1',
    name: 'Grep',
    icon: <SearchIcon />,
    summary: [
      { text: 'Searching ', type: 'label' },
      { text: 'useState', type: 'value' },
      { text: ' in ', type: 'label' },
      { text: 'src/', type: 'value' },
    ],
    status: 'complete',
    output: `src/hooks/useCounter.ts
src/hooks/useForm.ts
src/components/App.tsx
3 files found`,
  },
  {
    id: '2',
    name: 'Read',
    icon: <FileIcon />,
    summary: [
      { text: 'Reading ', type: 'label' },
      { text: 'src/hooks/useCounter.ts', type: 'value' },
    ],
    status: 'complete',
    output: `import { useState } from 'react';

export function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  return { count, increment: () => setCount(c => c + 1) };
}`,
  },
  {
    id: '3',
    name: 'Bash',
    icon: <CodeIcon />,
    summary: [
      { text: 'Running ', type: 'label' },
      { text: 'npm test', type: 'value' },
    ],
    status: 'running',
  },
];

const errorTools: ToolCall[] = [
  {
    id: '1',
    name: 'Glob',
    icon: <FolderIcon />,
    summary: [
      { text: 'Finding ', type: 'label' },
      { text: '**/*.test.ts', type: 'value' },
    ],
    status: 'complete',
    output: '15 files found',
  },
  {
    id: '2',
    name: 'Bash',
    icon: <CodeIcon />,
    summary: [
      { text: 'Running ', type: 'label' },
      { text: 'npm run build', type: 'value' },
    ],
    status: 'error',
    output: `Error: TypeScript compilation failed
src/index.ts:15:3 - error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.`,
  },
];

const deniedTool: ToolCall = {
  id: '1',
  name: 'Write',
  icon: <EditIcon />,
  summary: [
    { text: 'Writing to ', type: 'label' },
    { text: '/etc/passwd', type: 'value' },
  ],
  status: 'error',
  output: JSON.stringify({
    reason: 'Permission denied by user',
    tool: 'Write',
    path: '/etc/passwd',
  }, null, 2),
};

// Extended tools for auto-play demo (10 tools)
const autoPlayTools: ToolCall[] = [
  { id: '1', name: 'Grep', icon: <SearchIcon />, summary: [{ text: 'Searching ', type: 'label' }, { text: 'handleClick', type: 'value' }, { text: ' in ', type: 'label' }, { text: 'src/', type: 'value' }], status: 'complete' },
  { id: '2', name: 'Read', icon: <FileIcon />, summary: [{ text: 'Reading ', type: 'label' }, { text: 'src/components/Button.tsx', type: 'value' }], status: 'complete' },
  { id: '3', name: 'Grep', icon: <SearchIcon />, summary: [{ text: 'Searching ', type: 'label' }, { text: 'onClick', type: 'value' }, { text: ' in ', type: 'label' }, { text: 'src/', type: 'value' }], status: 'complete' },
  { id: '4', name: 'Read', icon: <FileIcon />, summary: [{ text: 'Reading ', type: 'label' }, { text: 'src/hooks/useClickHandler.ts', type: 'value' }], status: 'complete' },
  { id: '5', name: 'Glob', icon: <FolderIcon />, summary: [{ text: 'Finding ', type: 'label' }, { text: '**/*.test.tsx', type: 'value' }], status: 'complete' },
  { id: '6', name: 'Read', icon: <FileIcon />, summary: [{ text: 'Reading ', type: 'label' }, { text: 'src/components/Button.test.tsx', type: 'value' }], status: 'complete' },
  { id: '7', name: 'Edit', icon: <EditIcon />, summary: [{ text: 'Editing ', type: 'label' }, { text: 'src/components/Button.tsx', type: 'value' }], status: 'complete' },
  { id: '8', name: 'Bash', icon: <CodeIcon />, summary: [{ text: 'Running ', type: 'label' }, { text: 'npm test -- Button', type: 'value' }], status: 'complete' },
  { id: '9', name: 'WebFetch', icon: <GlobeIcon />, summary: [{ text: 'Fetching ', type: 'label' }, { text: 'https://api.example.com/docs', type: 'value' }], status: 'complete' },
  { id: '10', name: 'Bash', icon: <CodeIcon />, summary: [{ text: 'Running ', type: 'label' }, { text: 'npm run build', type: 'value' }], status: 'running' },
];

// Auto-play demo component
function AutoPlayDemo() {
  // Start with first tool as 'running'
  const [tools, setTools] = useState<ToolCall[]>([{ ...autoPlayTools[0], status: 'running' }]);
  const [animState, setAnimState] = useState<AnimationState>('idle');
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTools(prev => {
        const nextIndex = prev.length;

        // Reset after 10 tools
        if (nextIndex >= autoPlayTools.length) {
          setAnimState('idle');
          setExpandedTools(new Set());
          return [{ ...autoPlayTools[0], status: 'running' as ToolStatus }];
        }

        // Mark current as complete (shows green check during exit animation)
        const updated = prev.map((t, i) =>
          i === prev.length - 1 ? { ...t, status: 'complete' as ToolStatus } : t
        );

        // Trigger exit animation
        setAnimState('exiting');

        setTimeout(() => {
          // Add new tool as 'running' (shows spinner)
          setTools(current => [...current, { ...autoPlayTools[nextIndex], status: 'running' as ToolStatus }]);
          setAnimState('entering');

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setAnimState('idle');
            });
          });
        }, 80);

        return updated;
      });
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const activeTool = tools[tools.length - 1];

  const getAnimClass = () => {
    switch (animState) {
      case 'exiting':
        return styles.slideOut;
      case 'entering':
        return styles.slideEnter;
      default:
        return styles.slideIn;
    }
  };

  const toggleToolExpand = (id: string) => {
    setExpandedTools(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Stack direction="vertical" gap="sm">
      <Text size="sm" color="soft">
        Auto-plays every 2 seconds, resets after 10 tools. Click to expand and see all tools.
      </Text>

      <div className={styles.toolGroup}>
        {!isExpanded ? (
          <div className={styles.toolGroupCollapsed}>
            <div className={styles.toolGroupHeader}>
              <div
                className={styles.animationContainer}
                style={{ flex: 1, background: 'transparent', borderRadius: 0, cursor: 'pointer' }}
                onClick={() => setIsExpanded(true)}
              >
                <div className={`${styles.animatingTool} ${getAnimClass()}`}>
                  <ToolItem
                    tool={activeTool}
                    isExpanded={false}
                    onToggle={() => setIsExpanded(true)}
                    showOutput={false}
                  />
                </div>
              </div>
              {tools.length > 1 && (
                <button
                  className={styles.toolGroupExpandBtn}
                  onClick={() => setIsExpanded(true)}
                  aria-label={`Expand to see all ${tools.length} tools`}
                >
                  <Chip size="sm" variant="info">
                    {tools.length} tools
                  </Chip>
                  <ChevronDownIcon className={styles.groupChevron} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.toolGroupExpanded}>
            <button
              className={styles.toolGroupCollapseBtn}
              onClick={() => setIsExpanded(false)}
            >
              <Chip size="sm" variant="info">
                {tools.length} tools
              </Chip>
              <ChevronUpIcon className={styles.groupChevron} />
            </button>
            <div className={styles.toolList}>
              {tools.map((tool) => (
                <ToolItem
                  key={tool.id}
                  tool={tool}
                  isExpanded={expandedTools.has(tool.id)}
                  onToggle={() => toggleToolExpand(tool.id)}
                  showOutput={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Stack>
  );
}

// Animation demo component
type AnimationState = 'idle' | 'exiting' | 'entering';

function AnimationDemo() {
  const [tools, setTools] = useState<ToolCall[]>([sampleTools[0]]);
  const [animState, setAnimState] = useState<AnimationState>('idle');

  const addNextTool = () => {
    const nextIndex = tools.length;
    if (nextIndex < sampleTools.length) {
      // Mark current as complete
      setTools(prev => prev.map((t, i) =>
        i === prev.length - 1 ? { ...t, status: 'complete' as ToolStatus } : t
      ));

      // Phase 1: Current tool slides up and out
      setAnimState('exiting');

      setTimeout(() => {
        // Phase 2: Add new tool, positioned below (entering state)
        setTools(prev => [...prev, sampleTools[nextIndex]]);
        setAnimState('entering');

        // Phase 3: After a frame, animate new tool up to final position
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setAnimState('idle');
          });
        });
      }, 80);
    }
  };

  const reset = () => {
    setTools([{ ...sampleTools[0], status: 'running' }]);
    setAnimState('idle');
  };

  const activeTool = tools[tools.length - 1];

  const getAnimClass = () => {
    switch (animState) {
      case 'exiting':
        return styles.slideOut;
      case 'entering':
        return styles.slideEnter;
      default:
        return styles.slideIn;
    }
  };

  return (
    <Stack direction="vertical" gap="sm" className={styles.animationDemo}>
      <Text size="sm" color="soft">
        Click "Add Tool" to see the animation (new tool slides up from below)
      </Text>

      <div className={styles.animationContainer}>
        <div className={`${styles.animatingTool} ${getAnimClass()}`}>
          <ToolItem
            tool={activeTool}
            isExpanded={false}
            onToggle={() => {}}
            showOutput={false}
          />
        </div>
        {tools.length > 1 && (
          <span className={styles.toolCountBadge}>
            <Chip size="sm" variant="info">
              {tools.length} tools
            </Chip>
          </span>
        )}
      </div>

      <Stack direction="horizontal" gap="sm">
        <Button
          size="sm"
          variant="primary"
          onClick={addNextTool}
          disabled={tools.length >= sampleTools.length}
        >
          Add Tool
        </Button>
        <Button size="sm" variant="default" onClick={reset}>
          Reset
        </Button>
      </Stack>
    </Stack>
  );
}

// Main demo page
function ToolGroupConceptsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Stack direction="vertical" gap="lg">
          <Stack direction="vertical" gap="sm" as="section">
            <Stack direction="vertical" gap="xs">
              <Text size="lg" weight="semibold">
                Auto-Play Demo (Collapsed)
              </Text>
              <Text size="sm" color="soft">
                New tool every 2 seconds, up to 10 tools, then resets. Watch the animation.
              </Text>
            </Stack>
            <AutoPlayDemo />
          </Stack>

          <Stack direction="vertical" gap="sm" as="section">
            <Stack direction="vertical" gap="xs">
              <Text size="lg" weight="semibold">
                Collapsed State (3 tools, 1 running)
              </Text>
              <Text size="sm" color="soft">
                Shows only the active tool. Badge shows total count. Click badge to expand.
              </Text>
            </Stack>
            <ToolGroup tools={sampleTools} />
          </Stack>

          <Stack direction="vertical" gap="sm" as="section">
            <Stack direction="vertical" gap="xs">
              <Text size="lg" weight="semibold">
                Expanded State (same group)
              </Text>
              <Text size="sm" color="soft">
                All tools visible. Each tool expandable for output.
              </Text>
            </Stack>
            <ToolGroup tools={sampleTools} initialExpanded />
          </Stack>

          <Stack direction="vertical" gap="sm" as="section">
            <Stack direction="vertical" gap="xs">
              <Text size="lg" weight="semibold">
                Error State
              </Text>
              <Text size="sm" color="soft">
                Tool failure shows red X. Expandable to see error details.
              </Text>
            </Stack>
            <ToolGroup tools={errorTools} initialExpanded />
          </Stack>

          <Stack direction="vertical" gap="sm" as="section">
            <Stack direction="vertical" gap="xs">
              <Text size="lg" weight="semibold">
                Permission Denied (Treated as Error)
              </Text>
              <Text size="sm" color="soft">
                Denied permissions show as tool failure with JSON reason.
              </Text>
            </Stack>
            <ToolGroup tools={[deniedTool]} />
          </Stack>

          <Stack direction="vertical" gap="sm" as="section">
            <Stack direction="vertical" gap="xs">
              <Text size="lg" weight="semibold">
                Animation Concept
              </Text>
              <Text size="sm" color="soft">
                When a new tool starts, current slides up/out, new slides up from below.
              </Text>
            </Stack>
            <AnimationDemo />
          </Stack>

          <Stack direction="vertical" gap="sm" as="section">
            <Stack direction="vertical" gap="xs">
              <Text size="lg" weight="semibold">
                In Context: Chat Message
              </Text>
              <Text size="sm" color="soft">
                How tool groups appear within a chat message flow.
              </Text>
            </Stack>
            <div className={styles.chatDemo}>
              <div className={styles.messageText}>
                Let me search for the relevant files and run the tests.
              </div>
              <ToolGroup tools={sampleTools} />
              <div className={styles.messageText}>
                Found 3 files using useState. The tests are currently running.
              </div>
            </div>
          </Stack>
        </Stack>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Example Pages/Tool Group Concepts',
  component: ToolGroupConceptsPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## Tool Group UX Concepts

This mock explores the tool grouping UI for Claude Code Web chat interface.

### Key Behaviors

1. **Grouping**: Consecutive tool executions are grouped together
2. **Text Breaks**: Assistant text between tools creates separate groups
3. **Collapsed Default**: Groups show only the active/last tool
4. **Badge Count**: Shows total tools in group
5. **Expandable**: Click to see all tools in group
6. **Individual Expansion**: Each tool can show its output

### States

- **Running**: Spinner animation
- **Complete**: Green checkmark
- **Error/Denied**: Red X with expandable details

### Animation

When a new tool starts in a group:
- Current tool slides up and clips out
- New tool slides up from below
- ~200ms transition for smooth feel
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {};
