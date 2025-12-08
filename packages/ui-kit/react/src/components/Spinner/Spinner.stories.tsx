import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './Spinner';

const meta = {
  title: 'Feedback/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Animated loading indicator for operations with unknown duration.

## When to Use

- Page or section loading
- Button loading states
- Async operations in progress
- Content being fetched

## Spinner vs Progress

| Component | Use Case |
|-----------|----------|
| **Spinner** | Unknown duration, indeterminate |
| **Progress** | Known duration, show percentage |

## Sizes

- **sm**: Inline with text, buttons
- **md**: Section loading (default)
- **lg**: Page-level loading
- **xl**: Full-page loading overlay
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      <Spinner size="xl" />
    </div>
  ),
};

export const InheritColor: Story = {
  render: () => (
    <div style={{ color: 'var(--status-success)' }}>
      <Spinner inherit />
    </div>
  ),
};

export const InButton: Story = {
  render: () => (
    <button
      type="button"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        background: 'var(--controlPrimary-bg)',
        color: 'var(--controlPrimary-text)',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
      }}
    >
      <Spinner size="sm" inherit />
      Loading...
    </button>
  ),
};
