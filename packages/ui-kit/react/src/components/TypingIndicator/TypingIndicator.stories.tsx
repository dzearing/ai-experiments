import type { Meta, StoryObj } from '@storybook/react';
import { TypingIndicator } from './TypingIndicator';

const meta = {
  title: 'Feedback/TypingIndicator',
  component: TypingIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Bouncing dots animation commonly used in chat interfaces to indicate someone is typing.

## When to Use

- Show when a user or AI is composing a message in a chat
- Indicate real-time typing activity
- Display as a temporary placeholder before content appears

## Variants

| Variant | Use Case |
|---------|----------|
| \`default\` | Standard typing indicator, uses muted text color |
| \`primary\` | Emphasize the indicator with primary brand color |

## Sizes

- **sm** (4px dots): Compact inline usage
- **md** (6px dots): Default size for most chat interfaces
- **lg** (8px dots): Larger, more prominent indicator

## Accessibility

- Uses \`role="status"\` for screen reader announcements
- Includes visually hidden label text
- Respects \`prefers-reduced-motion\` by showing static dots

## Usage

\`\`\`tsx
import { TypingIndicator } from '@claude-flow/ui-kit-react';

// Basic usage
<TypingIndicator />

// With custom label for accessibility
<TypingIndicator label="Assistant is typing" />

// Primary variant
<TypingIndicator variant="primary" />
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
} satisfies Meta<typeof TypingIndicator>;

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
        <TypingIndicator size="sm" />
        <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>sm</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <TypingIndicator size="md" />
        <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>md</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <TypingIndicator size="lg" />
        <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>lg</span>
      </div>
    </div>
  ),
};

export const DotCounts: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <TypingIndicator count={3} />
        <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>3 dots</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <TypingIndicator count={4} />
        <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>4 dots</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <TypingIndicator count={5} />
        <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>5 dots</span>
      </div>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <TypingIndicator variant="default" />
        <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>default</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <TypingIndicator variant="primary" />
        <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>primary</span>
      </div>
    </div>
  ),
};

export const InChatBubble: Story = {
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
            background: 'var(--primary-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary-text)',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          AI
        </div>
        <TypingIndicator size="md" />
      </div>
      <p style={{ fontSize: '12px', color: 'var(--page-text-soft)', margin: 0 }}>
        Typical chat bubble with typing indicator
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common usage pattern in chat interfaces showing the typing indicator inside a message bubble.',
      },
    },
  },
};

export const InlineWithText: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px' }}>
      <span style={{ color: 'var(--page-text-soft)' }}>Someone is typing</span>
      <TypingIndicator size="sm" />
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
