import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './Modal';
import { Button } from '../Button';

const meta: Meta<typeof Modal> = {
  title: 'Overlays/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Modal dialog for content that requires user attention or interaction.

## When to Use

- Displaying content that requires focus
- Confirmation dialogs
- Forms that shouldn't leave the current page
- Detailed views of list items

## Modal vs Drawer

| Component | Use Case |
|-----------|----------|
| **Modal** | Centered, focused content, confirmations |
| **Drawer** | Side panel, navigation, filters, settings |

## Sizes

- **sm**: Small dialogs, confirmations
- **md**: Default, most content
- **lg/xl**: Complex forms, detailed content
- **full**: Full-screen takeover

## Behavior

- Closes on backdrop click (configurable)
- Closes on Escape key (configurable)
- Focus is trapped within modal
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
    closeOnBackdrop: {
      control: 'boolean',
    },
    closeOnEscape: {
      control: 'boolean',
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
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal {...args} open={open} onClose={() => setOpen(false)}>
          <div style={{ padding: '24px' }}>
            <h2 style={{ marginBottom: '16px' }}>Modal Title</h2>
            <p>This is the modal content. Click outside or press Escape to close.</p>
          </div>
        </Modal>
      </>
    );
  },
};

export const Sizes: Story = {
  render: () => {
    const [size, setSize] = useState<'sm' | 'md' | 'lg' | 'xl' | 'full' | null>(null);
    return (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button size="sm" onClick={() => setSize('sm')}>Small</Button>
        <Button size="sm" onClick={() => setSize('md')}>Medium</Button>
        <Button size="sm" onClick={() => setSize('lg')}>Large</Button>
        <Button size="sm" onClick={() => setSize('xl')}>XL</Button>
        <Button size="sm" onClick={() => setSize('full')}>Full</Button>
        {size && (
          <Modal open={true} onClose={() => setSize(null)} size={size}>
            <div style={{ padding: '24px' }}>
              <h2>Size: {size}</h2>
              <p>This modal demonstrates the {size} size.</p>
            </div>
          </Modal>
        )}
      </div>
    );
  },
};

export const FocusTrap: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal with Focus Trap</Button>
        <Modal open={open} onClose={() => setOpen(false)}>
          <div style={{ padding: '24px' }}>
            <h2 style={{ marginBottom: '16px' }}>Focus Trap Demo</h2>
            <p style={{ marginBottom: '16px' }}>
              Try pressing Tab to cycle through the focusable elements.
              The focus should stay trapped within this modal.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="First input" style={{ padding: '8px' }} />
              <input type="text" placeholder="Second input" style={{ padding: '8px' }} />
              <textarea placeholder="Textarea" rows={3} style={{ padding: '8px' }} />
              <select style={{ padding: '8px' }}>
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <Button size="sm" onClick={() => alert('Action clicked')}>Action</Button>
                <Button size="sm" onClick={() => setOpen(false)}>Close</Button>
              </div>
            </div>
          </div>
        </Modal>
      </>
    );
  },
};
