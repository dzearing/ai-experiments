import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';
import { Button } from '../Button';

const meta: Meta<typeof Tooltip> = {
  title: 'Overlays/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Contextual help text that appears on hover or focus. Features smart positioning with automatic flip to stay on screen.

## When to Use

- Explaining icon-only buttons
- Providing additional context for truncated text
- Showing keyboard shortcuts
- Brief descriptions that don't warrant permanent space

## Features

- **Smart Positioning**: Defaults to top, but automatically flips to bottom/sides if there isn't enough space
- **Singleton**: Only one tooltip can be visible at a time
- **Scroll Dismiss**: Hides when the user scrolls
- **Portal Rendering**: Renders to body for proper layering
- **Inverted Styling**: Uses inverted colors (dark in light mode, light in dark mode) with a beak pointing to the target

## Tooltip vs Popover

| Component | Use Case |
|-----------|----------|
| **Tooltip** | Simple text hints, no interaction |
| **Popover** | Rich content, interactive elements |

## Best Practices

- Keep content concise (1-2 sentences max)
- Don't put essential information in tooltips
- Use for supplementary, non-critical info
- Icon-only buttons should always have tooltips

## Accessibility

- Uses \`aria-describedby\` to link trigger to tooltip content
- Supports keyboard focus (Tab to trigger, tooltip shows)
- Uses \`role="tooltip"\` for screen readers
- Dismisses on Escape key (via focus blur)

## Usage

\`\`\`tsx
import { Tooltip } from '@claude-flow/ui-kit-react';

<Tooltip content="Save document">
  <Button shape="square" icon={<SaveIcon />} aria-label="Save" />
</Tooltip>

// With preferred position (will flip if needed)
<Tooltip content="More options" position="right">
  <Button>Options</Button>
</Tooltip>

// Disabled tooltip
<Tooltip content="This won't show" disabled>
  <Button>No tooltip</Button>
</Tooltip>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    position: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Preferred position (will flip if not enough space)',
    },
    delay: {
      control: 'number',
      description: 'Delay before showing in milliseconds',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the tooltip',
    },
    multiline: {
      control: 'boolean',
      description: 'Enable multiline mode for wrapping text',
    },
    maxWidth: {
      control: 'number',
      description: 'Max width in pixels (default: 280)',
    },
    content: {
      control: 'text',
      description: 'Tooltip content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: 'This is a tooltip',
    children: <Button>Hover me</Button>,
  },
};

export const Positions: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', padding: '60px', justifyContent: 'center' }}>
      <Tooltip content="Top tooltip" position="top">
        <Button>Top</Button>
      </Tooltip>
      <Tooltip content="Bottom tooltip" position="bottom">
        <Button>Bottom</Button>
      </Tooltip>
      <Tooltip content="Left tooltip" position="left">
        <Button>Left</Button>
      </Tooltip>
      <Tooltip content="Right tooltip" position="right">
        <Button>Right</Button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tooltips can be positioned on any side of the trigger element. The position is a preference - tooltips will automatically flip if there is not enough space.',
      },
    },
  },
};

export const SmartPositioning: Story = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <p style={{ marginBottom: '16px', color: 'var(--page-text-soft)' }}>
        Position buttons near edges to see automatic flipping:
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '100px' }}>
        <Tooltip content="I flip to the right when near left edge" position="left">
          <Button>Near Left Edge</Button>
        </Tooltip>
        <Tooltip content="I flip to the left when near right edge" position="right">
          <Button>Near Right Edge</Button>
        </Tooltip>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
        <Tooltip content="I flip down when near top" position="top">
          <Button>Near Top</Button>
        </Tooltip>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Tooltips automatically flip to the opposite side when there is not enough space. Try hovering near the edges of the viewport.',
      },
    },
  },
};

export const LongContent: Story = {
  args: {
    content: 'This is a longer tooltip that explains something in more detail. It will wrap if needed.',
    multiline: true,
    children: <Button>More info</Button>,
  },
  parameters: {
    docs: {
      description: {
        story: 'Use `multiline` prop for longer content that needs to wrap within the max-width of 280px.',
      },
    },
  },
};

export const Multiline: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      <Tooltip
        content="Short single-line tooltip"
        position="top"
      >
        <Button>Default (no wrap)</Button>
      </Tooltip>
      <Tooltip
        content="This tooltip has multiline enabled so it can wrap across multiple lines when the content is longer."
        multiline
        position="top"
      >
        <Button>Multiline</Button>
      </Tooltip>
      <Tooltip
        content="Custom max width tooltip with a narrower width constraint for compact layouts."
        multiline
        maxWidth={180}
        position="top"
      >
        <Button>Custom Width (180px)</Button>
      </Tooltip>
      <Tooltip
        content={
          <div>
            <strong>Rich Content</strong>
            <p style={{ margin: '4px 0 0' }}>Tooltips can contain formatted content when multiline is enabled.</p>
          </div>
        }
        multiline
        maxWidth={220}
        position="bottom"
      >
        <Button>Rich Content</Button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use `multiline` for wrapping text and `maxWidth` to customize the tooltip width. Rich content (JSX) is also supported.',
      },
    },
  },
};

export const OnIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px' }}>
      <Tooltip content="Save">
        <Button shape="square" aria-label="Save" icon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 14H3a1 1 0 01-1-1V3a1 1 0 011-1h7l4 4v7a1 1 0 01-1 1z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        } />
      </Tooltip>
      <Tooltip content="Delete">
        <Button shape="square" aria-label="Delete" icon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        } />
      </Tooltip>
      <Tooltip content="Settings">
        <Button shape="square" aria-label="Settings" icon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        } />
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon-only buttons should always have tooltips to explain their action.',
      },
    },
  },
};

export const WithDelay: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px' }}>
      <Tooltip content="Instant (0ms)" delay={0}>
        <Button>No delay</Button>
      </Tooltip>
      <Tooltip content="Default (200ms)" delay={200}>
        <Button>Default delay</Button>
      </Tooltip>
      <Tooltip content="Slow (500ms)" delay={500}>
        <Button>500ms delay</Button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Customize the delay before the tooltip appears. Default is 200ms.',
      },
    },
  },
};

export const Singleton: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px' }}>
      <Tooltip content="Tooltip 1">
        <Button>Button 1</Button>
      </Tooltip>
      <Tooltip content="Tooltip 2">
        <Button>Button 2</Button>
      </Tooltip>
      <Tooltip content="Tooltip 3">
        <Button>Button 3</Button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Only one tooltip can be visible at a time. Moving quickly between buttons will show only the most recent tooltip.',
      },
    },
  },
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px' }}>
      <Tooltip content="You won't see this" disabled>
        <Button>Tooltip disabled</Button>
      </Tooltip>
      <Tooltip content="This one works">
        <Button>Tooltip enabled</Button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tooltips can be conditionally disabled while keeping the same component structure.',
      },
    },
  },
};

export const KeyboardAccessible: Story = {
  args: {
    content: 'Tab to this button to see the tooltip',
    children: <Button>Focus me with Tab</Button>,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tooltips show on keyboard focus as well as mouse hover, making them accessible to keyboard users.',
      },
    },
  },
};

export const InScrollableContainer: Story = {
  render: () => (
    <div style={{
      height: '200px',
      overflow: 'auto',
      border: '1px solid var(--page-border)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
    }}>
      <div style={{ height: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <p style={{ color: 'var(--page-text-soft)' }}>
          Scroll while hovering to see tooltip dismiss:
        </p>
        <Tooltip content="This will dismiss when you scroll">
          <Button>Hover then scroll</Button>
        </Tooltip>
        <div style={{ flex: 1 }} />
        <Tooltip content="Another tooltip">
          <Button>Another button</Button>
        </Tooltip>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tooltips automatically dismiss when the user scrolls, preventing them from appearing detached from their trigger.',
      },
    },
  },
};
