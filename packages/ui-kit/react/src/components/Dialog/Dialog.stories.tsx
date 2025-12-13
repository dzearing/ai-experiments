import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Dialog } from './Dialog';
import { Button } from '../Button';
import { Input } from '../Input';
import { Textarea } from '../Textarea';

const meta: Meta<typeof Dialog> = {
  title: 'Overlays/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Structured modal with header, content, and footer sections.

## When to Use

- Confirmation dialogs
- Forms requiring focused attention
- Information that needs acknowledgment
- CRUD operations

## Dialog vs Modal

| Component | Use Case |
|-----------|----------|
| **Dialog** | Structured: title + content + actions |
| **Modal** | Flexible: any content layout |

## Structure

- **title**: Header with close button
- **children**: Main content area
- **footer**: Action buttons (Cancel, Confirm, etc.)

## Common Patterns

- Confirmation: "Are you sure?" with Cancel/Delete
- Forms: Input fields with Cancel/Save
- Alerts: Message with acknowledgment button
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          title="Dialog Title"
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setOpen(false)}>Confirm</Button>
            </>
          }
        >
          <p>This is the dialog content. It has a header with a title and close button, content area, and a footer.</p>
        </Dialog>
      </>
    );
  },
};

export const Confirmation: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>Delete Item</Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="Confirm Delete"
          size="sm"
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => setOpen(false)}>Delete</Button>
            </>
          }
        >
          <p>Are you sure you want to delete this item? This action cannot be undone.</p>
        </Dialog>
      </>
    );
  },
};

export const WithForm: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>Create New</Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="Create New Item"
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setOpen(false)}>Create</Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Name</label>
              <Input fullWidth placeholder="Enter name" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Description</label>
              <Textarea fullWidth placeholder="Enter description" rows={3} />
            </div>
          </div>
        </Dialog>
      </>
    );
  },
};

export const LargeDialog: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Large Dialog</Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="Large Dialog"
          size="lg"
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Close</Button>
            </>
          }
        >
          <p>This is a larger dialog that can accommodate more content.</p>
          <p style={{ marginTop: '16px' }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </Dialog>
      </>
    );
  },
};

export const FocusTrap: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog with Focus Trap</Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="Focus Trap Demo"
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setOpen(false)}>Submit</Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p>
              Try pressing Tab to cycle through the focusable elements.
              The focus should stay trapped within this dialog, including the close button, inputs, and footer buttons.
            </p>
            <Input fullWidth placeholder="First input" />
            <Input fullWidth placeholder="Second input" />
            <Textarea fullWidth placeholder="Comments" rows={3} />
          </div>
        </Dialog>
      </>
    );
  },
};
