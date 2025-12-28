import type { Meta, StoryObj } from '@storybook/react';
import { BusyIndicator } from './BusyIndicator';

const meta = {
  title: 'Feedback/BusyIndicator',
  component: BusyIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Pulsing dots animation used to indicate AI or system processing states.

## When to Use

- Show when an AI is processing or "thinking"
- Indicate background operations in progress
- Display during streaming content generation
- Show system is busy but responsive

## Variants

| Variant | Use Case |
|---------|----------|
| \`default\` | Standard busy indicator, uses muted text color |
| \`primary\` | Emphasize with primary brand color |

## Sizes

- **sm** (4px dots): Compact inline usage
- **md** (6px dots): Default size for most interfaces
- **lg** (8px dots): Larger, more prominent indicator

## Accessibility

- Uses \`role="status"\` for screen reader announcements
- Includes visually hidden label text
- Respects \`prefers-reduced-motion\` by showing static dots

## Usage

\`\`\`tsx
import { BusyIndicator } from '@claude-flow/ui-kit-react';

// Basic usage
<BusyIndicator />

// With custom label for accessibility
<BusyIndicator label="AI is thinking" />

// Primary variant
<BusyIndicator variant="primary" />
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the dots',
    },
    variant: {
      control: 'select',
      options: ['default', 'primary'],
      description: 'Color variant',
    },
    count: {
      control: 'select',
      options: [3, 4, 5],
      description: 'Number of dots',
    },
    label: {
      control: 'text',
      description: 'Accessible label for screen readers',
    },
  },
} satisfies Meta<typeof BusyIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: 'md',
    variant: 'default',
    count: 3,
  },
};

export const Primary: Story = {
  args: {
    variant: 'primary',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <BusyIndicator size="sm" />
        <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>sm</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <BusyIndicator size="md" />
        <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>md</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <BusyIndicator size="lg" />
        <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>lg</span>
      </div>
    </div>
  ),
};

export const DotCounts: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <BusyIndicator count={3} />
        <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>3 dots</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <BusyIndicator count={4} />
        <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>4 dots</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <BusyIndicator count={5} />
        <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>5 dots</span>
      </div>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <BusyIndicator variant="default" />
        <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>default</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <BusyIndicator variant="primary" />
        <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>primary</span>
      </div>
    </div>
  ),
};

export const AIThinking: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius-lg)',
          width: 'fit-content',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-bg), var(--primary-bg-hover))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary-text)',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          AI
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '13px', color: 'var(--page-text-soft)' }}>Thinking</span>
          <BusyIndicator size="sm" variant="primary" />
        </div>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--page-text-soft)', margin: 0 }}>
        AI processing indicator with label
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common usage pattern showing the AI is processing a request.',
      },
    },
  },
};

export const InlineWithText: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px' }}>
      <span style={{ color: 'var(--page-text-soft)' }}>Processing</span>
      <BusyIndicator size="sm" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compact inline usage with accompanying text label.',
      },
    },
  },
};

export const CompareWithTyping: Story = {
  name: 'Compare: BusyIndicator vs TypingIndicator',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '14px', fontWeight: 500 }}>BusyIndicator (pulsing)</span>
        <BusyIndicator size="lg" />
        <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>
          Use for AI thinking, processing, loading states
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '14px', fontWeight: 500 }}>TypingIndicator (bouncing)</span>
        <div style={{ color: 'var(--page-text-soft)', fontSize: '12px' }}>
          See TypingIndicator component for bouncing animation
        </div>
        <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>
          Use for chat typing indicators, user is composing
        </span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'BusyIndicator uses a pulsing animation for processing states, while TypingIndicator uses bouncing for chat typing.',
      },
    },
  },
};
