import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button, Stack, Checkbox } from '@ui-kit/react';
import { ThinkingIndicator } from './ThinkingIndicator';

const meta: Meta<typeof ThinkingIndicator> = {
  title: 'React Chat/ThinkingIndicator',
  component: ThinkingIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
An animated progress indicator shown while the AI is thinking or processing a request.

## When to Use

- Show during AI response generation
- Indicate background processing (file reads, tool execution)
- Provide feedback during longer operations
- Display specific status updates for multi-step tasks

## Features

- Cycles through progress verbs (Thinking, Pondering, Analyzing, etc.)
- Shows elapsed time
- Optional escape hint
- Shimmer animation on text
- Can show specific status text instead of cycling verbs

## Accessibility

- Uses appropriate ARIA attributes for status indication
- Text content is readable by screen readers
- Animation respects prefers-reduced-motion
- Escape hint provides keyboard guidance

## Usage

\`\`\`tsx
import { ThinkingIndicator } from '@ui-kit/react-chat';

// Basic usage
<ThinkingIndicator isActive={isProcessing} />

// With custom status text
<ThinkingIndicator
  isActive={isProcessing}
  statusText="Creating document..."
/>

// Without escape hint
<ThinkingIndicator
  isActive={isProcessing}
  showEscapeHint={false}
/>

// With custom progress verbs
<ThinkingIndicator
  isActive={isProcessing}
  progressVerbs={['Cooking', 'Baking', 'Simmering']}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    isActive: {
      control: 'boolean',
      description: 'Whether the indicator is active/visible',
    },
    statusText: {
      control: 'text',
      description: 'Specific status text that overrides cycling verbs',
    },
    showEscapeHint: {
      control: 'boolean',
      description: 'Whether to show the escape hint',
    },
    escapeHintText: {
      control: 'text',
      description: 'Custom escape hint text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ThinkingIndicator>;

// =============================================================================
// STORIES
// =============================================================================

/**
 * Default state with cycling progress verbs.
 */
export const Default: Story = {
  args: {
    isActive: true,
  },
};

/**
 * With a specific status text instead of cycling verbs.
 */
export const WithStatusText: Story = {
  args: {
    isActive: true,
    statusText: 'Analyzing codebase...',
  },
};

/**
 * Without the escape hint.
 */
export const WithoutEscapeHint: Story = {
  args: {
    isActive: true,
    showEscapeHint: false,
  },
};

/**
 * With custom escape hint text.
 */
export const CustomEscapeHint: Story = {
  args: {
    isActive: true,
    escapeHintText: 'Press Escape to cancel',
  },
};

/**
 * With custom progress verbs.
 */
export const CustomVerbs: Story = {
  args: {
    isActive: true,
    progressVerbs: ['Cooking', 'Baking', 'Simmering', 'Sautéing', 'Roasting'],
  },
};

/**
 * Interactive demo to toggle the indicator on/off.
 */
function InteractiveDemo() {
  const [isActive, setIsActive] = useState(false);
  const [showEscapeHint, setShowEscapeHint] = useState(true);
  const [statusText, setStatusText] = useState('');

  return (
    <Stack direction="vertical" gap="lg">
      <Stack direction="horizontal" gap="md" align="center">
        <Button
          variant={isActive ? 'default' : 'primary'}
          onClick={() => setIsActive(!isActive)}
        >
          {isActive ? 'Stop Thinking' : 'Start Thinking'}
        </Button>
        <Checkbox
          checked={showEscapeHint}
          onChange={(e) => setShowEscapeHint(e.target.checked)}
          label="Show escape hint"
        />
      </Stack>

      <Stack direction="horizontal" gap="sm" align="center">
        <input
          type="text"
          placeholder="Custom status text (optional)"
          value={statusText}
          onChange={(e) => setStatusText(e.target.value)}
          style={{
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--soft-border)',
            background: 'var(--softer-bg)',
            color: 'var(--base-fg)',
            width: '250px',
          }}
        />
        {statusText && (
          <Button variant="ghost" size="sm" onClick={() => setStatusText('')}>
            Clear
          </Button>
        )}
      </Stack>

      <div
        style={{
          padding: 'var(--space-4)',
          background: 'var(--soft-bg)',
          borderRadius: 'var(--radius-md)',
          minHeight: '60px',
        }}
      >
        <ThinkingIndicator
          isActive={isActive}
          showEscapeHint={showEscapeHint}
          statusText={statusText || undefined}
        />
        {!isActive && (
          <span style={{ color: 'var(--base-fg-soft)', fontSize: 'var(--text-sm)' }}>
            Click "Start Thinking" to see the indicator
          </span>
        )}
      </div>
    </Stack>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo to toggle the indicator and customize its appearance.',
      },
    },
  },
};

/**
 * Various status text examples.
 */
function StatusTextExamplesDemo() {
  const examples = [
    'Thinking...',
    'Analyzing code...',
    'Reading files...',
    'Running tests...',
    'Creating implementation plan...',
    'Searching codebase...',
  ];

  return (
    <Stack direction="vertical" gap="md">
      {examples.map((text) => (
        <div
          key={text}
          style={{
            padding: 'var(--space-3)',
            background: 'var(--soft-bg)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <ThinkingIndicator isActive statusText={text} />
        </div>
      ))}
    </Stack>
  );
}

export const StatusTextExamples: Story = {
  render: () => <StatusTextExamplesDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Examples of different status text messages.',
      },
    },
  },
};

/**
 * Inactive state - renders nothing.
 */
export const Inactive: Story = {
  args: {
    isActive: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'When isActive is false, the component renders nothing.',
      },
    },
  },
};
