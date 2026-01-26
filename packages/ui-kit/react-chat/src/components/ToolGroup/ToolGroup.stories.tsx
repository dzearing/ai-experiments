import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect, useRef } from 'react';
import { Stack, Text, Button } from '@ui-kit/react';
import { SearchIcon } from '@ui-kit/icons/SearchIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { GlobeIcon } from '@ui-kit/icons/GlobeIcon';
import { ToolGroup, ToolItem, type ToolCall, type ToolStatus } from './ToolGroup';

const meta: Meta<typeof ToolGroup> = {
  title: 'React Chat/ToolGroup',
  component: ToolGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A collapsible group of tool calls with status indicators.

## When to Use

- Display consecutive tool calls in chat messages
- Show tool execution progress with running/complete/error states
- Group related operations together

## Features

- **Collapsed state**: Shows only the active/last tool with badge count
- **Expanded state**: Shows all tools in the group
- **Tool states**: Running (spinner), Complete (checkmark), Error (X)
- **Output expansion**: Each tool can show its output when clicked
- **Hover highlighting**: Entire row highlights on hover

## Summary Segments

Tool summaries use segments to control formatting:
- \`type: 'label'\` - Soft/muted text (e.g., "Searching", "in")
- \`type: 'value'\` - Bold text (e.g., file paths, search terms)

\`\`\`tsx
summary: [
  { text: 'Searching ', type: 'label' },
  { text: 'useState', type: 'value' },
  { text: ' in ', type: 'label' },
  { text: 'src/', type: 'value' },
]
// Renders: "Searching **useState** in **src/**"
\`\`\`

## Accessibility

- Buttons have appropriate ARIA labels
- Focus states are clearly visible
- Screen readers can navigate tool items
        `,
      },
    },
  },
  argTypes: {
    tools: {
      description: 'Array of tool calls to display',
    },
    initialExpanded: {
      control: 'boolean',
      description: 'Whether the group starts expanded',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToolGroup>;

// =============================================================================
// SAMPLE DATA
// =============================================================================

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

const singleTool: ToolCall[] = [
  {
    id: '1',
    name: 'Read',
    icon: <FileIcon />,
    summary: [
      { text: 'Reading ', type: 'label' },
      { text: 'package.json', type: 'value' },
    ],
    status: 'complete',
    output: '{ "name": "my-app", "version": "1.0.0" }',
  },
];

const allCompletedTools: ToolCall[] = [
  {
    id: '1',
    name: 'Grep',
    icon: <SearchIcon />,
    summary: [
      { text: 'Searching ', type: 'label' },
      { text: 'Button', type: 'value' },
      { text: ' in ', type: 'label' },
      { text: 'src/components/', type: 'value' },
    ],
    status: 'complete',
    output: '5 files found',
  },
  {
    id: '2',
    name: 'Read',
    icon: <FileIcon />,
    summary: [
      { text: 'Reading ', type: 'label' },
      { text: 'src/components/Button.tsx', type: 'value' },
    ],
    status: 'complete',
    output: 'export function Button() { ... }',
  },
  {
    id: '3',
    name: 'Edit',
    icon: <EditIcon />,
    summary: [
      { text: 'Editing ', type: 'label' },
      { text: 'src/components/Button.tsx', type: 'value' },
    ],
    status: 'complete',
    output: 'Added onClick handler',
  },
];

// =============================================================================
// STORIES
// =============================================================================

/**
 * Default collapsed state with multiple tools, one running.
 */
export const Default: Story = {
  args: {
    tools: sampleTools,
  },
};

/**
 * Expanded state showing all tools in the group.
 */
export const Expanded: Story = {
  args: {
    tools: sampleTools,
    initialExpanded: true,
  },
};

/**
 * Single tool - no expand button shown.
 */
export const SingleTool: Story = {
  args: {
    tools: singleTool,
  },
};

/**
 * All tools completed - badge shows success variant.
 */
export const AllCompleted: Story = {
  args: {
    tools: allCompletedTools,
    initialExpanded: true,
  },
};

/**
 * Error state showing tool failure.
 */
export const WithError: Story = {
  args: {
    tools: errorTools,
    initialExpanded: true,
  },
};

/**
 * Permission denied error.
 */
export const PermissionDenied: Story = {
  args: {
    tools: [
      {
        id: '1',
        name: 'Write',
        icon: <EditIcon />,
        summary: [
          { text: 'Writing to ', type: 'label' },
          { text: '/etc/passwd', type: 'value' },
        ],
        status: 'error',
        output: JSON.stringify(
          {
            reason: 'Permission denied by user',
            tool: 'Write',
            path: '/etc/passwd',
          },
          null,
          2
        ),
      },
    ],
  },
};

/**
 * Multiple tool groups showing consecutive operations.
 */
export const MultipleGroups: Story = {
  render: () => {
    const firstGroup: ToolCall[] = [
      {
        id: '1',
        name: 'Grep',
        icon: <SearchIcon />,
        summary: [
          { text: 'Searching ', type: 'label' },
          { text: 'handleSubmit', type: 'value' },
          { text: ' in ', type: 'label' },
          { text: 'src/', type: 'value' },
        ],
        status: 'complete',
        output: '2 files found',
      },
      {
        id: '2',
        name: 'Read',
        icon: <FileIcon />,
        summary: [
          { text: 'Reading ', type: 'label' },
          { text: 'src/components/Form.tsx', type: 'value' },
        ],
        status: 'complete',
        output: 'export function Form() { ... }',
      },
    ];

    const secondGroup: ToolCall[] = [
      {
        id: '3',
        name: 'Edit',
        icon: <EditIcon />,
        summary: [
          { text: 'Editing ', type: 'label' },
          { text: 'src/components/Form.tsx', type: 'value' },
        ],
        status: 'complete',
        output: 'Added validation logic',
      },
      {
        id: '4',
        name: 'Bash',
        icon: <CodeIcon />,
        summary: [
          { text: 'Running ', type: 'label' },
          { text: 'npm test', type: 'value' },
        ],
        status: 'running',
      },
    ];

    return (
      <Stack direction="vertical" gap="md">
        <Text size="sm" color="soft">
          Multiple tool groups in a conversation:
        </Text>
        <ToolGroup tools={firstGroup} />
        <Text size="sm">
          I found the form component. Let me add validation and run tests.
        </Text>
        <ToolGroup tools={secondGroup} />
      </Stack>
    );
  },
};

/**
 * Various tool types showing different icons and formats.
 */
export const VariousToolTypes: Story = {
  render: () => {
    const tools: ToolCall[] = [
      {
        id: '1',
        name: 'Grep',
        icon: <SearchIcon />,
        summary: [
          { text: 'Searching ', type: 'label' },
          { text: 'handleClick', type: 'value' },
          { text: ' in ', type: 'label' },
          { text: 'src/', type: 'value' },
        ],
        status: 'complete',
      },
      {
        id: '2',
        name: 'Read',
        icon: <FileIcon />,
        summary: [
          { text: 'Reading ', type: 'label' },
          { text: 'src/components/Button.tsx', type: 'value' },
        ],
        status: 'complete',
      },
      {
        id: '3',
        name: 'Glob',
        icon: <FolderIcon />,
        summary: [
          { text: 'Finding ', type: 'label' },
          { text: '**/*.test.tsx', type: 'value' },
        ],
        status: 'complete',
      },
      {
        id: '4',
        name: 'Edit',
        icon: <EditIcon />,
        summary: [
          { text: 'Editing ', type: 'label' },
          { text: 'src/utils/format.ts', type: 'value' },
        ],
        status: 'complete',
      },
      {
        id: '5',
        name: 'Bash',
        icon: <CodeIcon />,
        summary: [
          { text: 'Running ', type: 'label' },
          { text: 'npm test -- Button', type: 'value' },
        ],
        status: 'complete',
      },
      {
        id: '6',
        name: 'WebFetch',
        icon: <GlobeIcon />,
        summary: [
          { text: 'Fetching ', type: 'label' },
          { text: 'https://api.example.com/docs', type: 'value' },
        ],
        status: 'running',
      },
    ];

    return <ToolGroup tools={tools} initialExpanded />;
  },
};

/**
 * Auto-playing demo showing tool execution over time.
 */
function AutoPlayDemo() {
  const autoPlayTools: ToolCall[] = [
    {
      id: '1',
      name: 'Grep',
      icon: <SearchIcon />,
      summary: [
        { text: 'Searching ', type: 'label' },
        { text: 'handleClick', type: 'value' },
        { text: ' in ', type: 'label' },
        { text: 'src/', type: 'value' },
      ],
      status: 'complete',
    },
    {
      id: '2',
      name: 'Read',
      icon: <FileIcon />,
      summary: [
        { text: 'Reading ', type: 'label' },
        { text: 'src/components/Button.tsx', type: 'value' },
      ],
      status: 'complete',
    },
    {
      id: '3',
      name: 'Grep',
      icon: <SearchIcon />,
      summary: [
        { text: 'Searching ', type: 'label' },
        { text: 'onClick', type: 'value' },
        { text: ' in ', type: 'label' },
        { text: 'src/', type: 'value' },
      ],
      status: 'complete',
    },
    {
      id: '4',
      name: 'Edit',
      icon: <EditIcon />,
      summary: [
        { text: 'Editing ', type: 'label' },
        { text: 'src/components/Button.tsx', type: 'value' },
      ],
      status: 'complete',
    },
    {
      id: '5',
      name: 'Bash',
      icon: <CodeIcon />,
      summary: [
        { text: 'Running ', type: 'label' },
        { text: 'npm test -- Button', type: 'value' },
      ],
      status: 'running',
    },
  ];

  const [tools, setTools] = useState<ToolCall[]>([
    { ...autoPlayTools[0], status: 'running' },
  ]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTools((prev) => {
        const nextIndex = prev.length;

        // Reset after all tools
        if (nextIndex >= autoPlayTools.length) {
          return [{ ...autoPlayTools[0], status: 'running' as ToolStatus }];
        }

        // Mark current as complete, add next as running
        const updated = prev.map((t, i) =>
          i === prev.length - 1
            ? { ...t, status: 'complete' as ToolStatus }
            : t
        );

        return [
          ...updated,
          { ...autoPlayTools[nextIndex], status: 'running' as ToolStatus },
        ];
      });
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <Stack direction="vertical" gap="sm">
      <Text size="sm" color="soft">
        Auto-plays every 2 seconds, resets after 5 tools:
      </Text>
      <ToolGroup tools={tools} />
    </Stack>
  );
}

export const AutoPlay: Story = {
  render: () => <AutoPlayDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates tool execution over time with automatic progression.',
      },
    },
  },
};

/**
 * In context: How tool groups appear within a chat message.
 */
function ChatContextDemo() {
  return (
    <div
      style={{
        background: 'var(--soft-bg)',
        border: '1px solid var(--soft-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
      }}
    >
      <Text
        size="sm"
        style={{
          lineHeight: 'var(--leading-relaxed)',
          marginBottom: 'var(--space-3)',
        }}
      >
        Let me search for the relevant files and run the tests.
      </Text>
      <ToolGroup tools={sampleTools} />
      <Text
        size="sm"
        style={{
          lineHeight: 'var(--leading-relaxed)',
          marginTop: 'var(--space-3)',
        }}
      >
        Found 3 files using useState. The tests are currently running.
      </Text>
    </div>
  );
}

export const InChatContext: Story = {
  render: () => <ChatContextDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Shows how tool groups appear within a chat message flow.',
      },
    },
  },
};

/**
 * Interactive demo with controls.
 */
function InteractiveDemo() {
  const [tools, setTools] = useState<ToolCall[]>([
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
      output: '3 files found',
    },
  ]);

  const addTool = () => {
    const toolTypes = [
      {
        name: 'Read',
        icon: <FileIcon />,
        summary: [
          { text: 'Reading ', type: 'label' as const },
          { text: `src/file-${tools.length + 1}.ts`, type: 'value' as const },
        ],
      },
      {
        name: 'Edit',
        icon: <EditIcon />,
        summary: [
          { text: 'Editing ', type: 'label' as const },
          { text: `src/file-${tools.length + 1}.ts`, type: 'value' as const },
        ],
      },
      {
        name: 'Bash',
        icon: <CodeIcon />,
        summary: [
          { text: 'Running ', type: 'label' as const },
          { text: 'npm test', type: 'value' as const },
        ],
      },
    ];

    const toolType = toolTypes[tools.length % toolTypes.length];

    // Mark previous as complete
    const updatedTools = tools.map((t, i) =>
      i === tools.length - 1 ? { ...t, status: 'complete' as ToolStatus } : t
    );

    setTools([
      ...updatedTools,
      {
        id: String(tools.length + 1),
        ...toolType,
        status: 'running',
        output: `Output for tool ${tools.length + 1}`,
      },
    ]);
  };

  const completeAll = () => {
    setTools(tools.map((t) => ({ ...t, status: 'complete' as ToolStatus })));
  };

  const reset = () => {
    setTools([
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
        status: 'running',
        output: '3 files found',
      },
    ]);
  };

  return (
    <Stack direction="vertical" gap="md">
      <Stack direction="horizontal" gap="sm">
        <Button size="sm" variant="primary" onClick={addTool}>
          Add Tool
        </Button>
        <Button size="sm" variant="default" onClick={completeAll}>
          Complete All
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          Reset
        </Button>
      </Stack>
      <ToolGroup tools={tools} />
    </Stack>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo to add tools and control their states.',
      },
    },
  },
};
