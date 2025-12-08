import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';

const meta: Meta<typeof Tooltip> = {
  title: 'Overlays/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Contextual help text that appears on hover or focus.

## When to Use

- Explaining icon-only buttons
- Providing additional context for truncated text
- Showing keyboard shortcuts
- Brief descriptions that don't warrant permanent space

## Tooltip vs Popover

| Component | Use Case |
|-----------|----------|
| **Tooltip** | Simple text hints, no interaction |
| **Popover** | Rich content, interactive elements |

## Best Practices

- Keep content concise (1-2 sentences max)
- Don't put essential information in tooltips
- Use for supplementary, non-critical info
        `,
      },
    },
  },
  argTypes: {
    position: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
    delay: {
      control: 'number',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: 'This is a tooltip',
    children: <button>Hover me</button>,
  },
};

export const Positions: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', padding: '60px', justifyContent: 'center' }}>
      <Tooltip content="Top tooltip" position="top">
        <button>Top</button>
      </Tooltip>
      <Tooltip content="Bottom tooltip" position="bottom">
        <button>Bottom</button>
      </Tooltip>
      <Tooltip content="Left tooltip" position="left">
        <button>Left</button>
      </Tooltip>
      <Tooltip content="Right tooltip" position="right">
        <button>Right</button>
      </Tooltip>
    </div>
  ),
};

export const LongContent: Story = {
  args: {
    content: 'This is a longer tooltip that explains something in more detail',
    children: <button>More info</button>,
  },
};

export const OnIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px' }}>
      <Tooltip content="Save">
        <button style={{ padding: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 14H3a1 1 0 01-1-1V3a1 1 0 011-1h7l4 4v7a1 1 0 01-1 1z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
      </Tooltip>
      <Tooltip content="Delete">
        <button style={{ padding: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </Tooltip>
      <Tooltip content="Settings">
        <button style={{ padding: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
      </Tooltip>
    </div>
  ),
};
