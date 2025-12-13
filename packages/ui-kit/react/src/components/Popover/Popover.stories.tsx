import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Popover } from './Popover';
import { Button } from '../Button';

const meta: Meta<typeof Popover> = {
  title: 'Overlays/Popover',
  component: Popover,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A floating panel that displays rich content triggered by user interaction.

## When to Use

- Contextual help or information
- Action menus
- Settings panels
- Additional content that doesn't fit inline

## Popover vs Tooltip

| Component | Use Case |
|-----------|----------|
| **Popover** | Interactive content, forms, buttons, complex layouts |
| **Tooltip** | Simple text hints, non-interactive, hover-only |

## Positions

The popover can be positioned relative to its trigger:
- **top**: Above the trigger
- **bottom**: Below the trigger (default)
- **left**: Left of the trigger
- **right**: Right of the trigger

## Behavior

- Opens on click (not hover)
- Closes on outside click
- Closes on Escape key
- Supports controlled and uncontrolled modes

## Accessibility

- Closes on Escape key
- Click outside to dismiss
- Focus management within popover content

## Usage

### Uncontrolled (default)

\`\`\`tsx
import { Popover, Button } from '@ui-kit/react';

<Popover
  content={<div>Popover content here</div>}
  position="bottom"
>
  <Button>Click me</Button>
</Popover>
\`\`\`

### Controlled

\`\`\`tsx
import { useState } from 'react';
import { Popover, Button } from '@ui-kit/react';

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      content={<div>Popover content</div>}
      open={open}
      onOpenChange={setOpen}
    >
      <Button>Click me</Button>
    </Popover>
  );
}
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    position: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Position relative to the trigger element',
      table: {
        defaultValue: { summary: 'bottom' },
      },
    },
    open: {
      control: 'boolean',
      description: 'Controlled open state (undefined for uncontrolled)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Simple example content
const SimpleContent = () => (
  <div style={{ padding: '12px' }}>
    <p style={{ margin: 0 }}>This is popover content</p>
  </div>
);

// Rich example content with actions
const RichContent = () => (
  <div style={{ padding: '8px', minWidth: '200px' }}>
    <div style={{ padding: '8px', cursor: 'pointer', borderRadius: '4px' }}>
      Edit
    </div>
    <div style={{ padding: '8px', cursor: 'pointer', borderRadius: '4px' }}>
      Duplicate
    </div>
    <div style={{ padding: '8px', cursor: 'pointer', borderRadius: '4px', color: 'var(--danger-text)' }}>
      Delete
    </div>
  </div>
);

export const Default: Story = {
  args: {
    content: <SimpleContent />,
    position: 'bottom',
    children: <Button>Click to open</Button>,
  },
};

export const Positions: Story = {
  render: () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '80px',
      padding: '80px'
    }}>
      <Popover content={<SimpleContent />} position="top">
        <Button>Top</Button>
      </Popover>
      <Popover content={<SimpleContent />} position="bottom">
        <Button>Bottom</Button>
      </Popover>
      <Popover content={<SimpleContent />} position="left">
        <Button>Left</Button>
      </Popover>
      <Popover content={<SimpleContent />} position="right">
        <Button>Right</Button>
      </Popover>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The popover can be positioned on any side of the trigger element.',
      },
    },
  },
};

export const WithActions: Story = {
  args: {
    content: <RichContent />,
    position: 'bottom',
    children: <Button>Actions</Button>,
  },
  parameters: {
    docs: {
      description: {
        story: 'Popovers can contain interactive elements like buttons and links.',
      },
    },
  },
};

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
        <Popover
          content={
            <div style={{ padding: '16px' }}>
              <p style={{ margin: '0 0 12px 0' }}>Controlled popover</p>
              <Button size="sm" onClick={() => setOpen(false)}>Close</Button>
            </div>
          }
          position="bottom"
          open={open}
          onOpenChange={setOpen}
        >
          <Button>Controlled trigger</Button>
        </Popover>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="sm" onClick={() => setOpen(true)}>Open programmatically</Button>
          <Button size="sm" onClick={() => setOpen(false)}>Close programmatically</Button>
        </div>

        <p style={{ margin: 0 }}>
          Status: <strong>{open ? 'Open' : 'Closed'}</strong>
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Use controlled mode to manage popover state externally or trigger it programmatically.',
      },
    },
  },
};

export const ComplexContent: Story = {
  render: () => (
    <Popover
      content={
        <div style={{ padding: '16px', maxWidth: '300px' }}>
          <h4 style={{ margin: '0 0 8px 0' }}>Account Settings</h4>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--panel-text-soft)' }}>
            Manage your account preferences and settings.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Button size="sm" fullWidth>Profile</Button>
            <Button size="sm" fullWidth>Preferences</Button>
            <Button size="sm" fullWidth>Security</Button>
          </div>
        </div>
      }
      position="bottom"
    >
      <Button>Open settings</Button>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Popovers can contain complex layouts with headings, descriptions, and multiple interactive elements.',
      },
    },
  },
};
