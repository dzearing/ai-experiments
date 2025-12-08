import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Drawer } from './Drawer';

const meta: Meta<typeof Drawer> = {
  title: 'Overlays/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Slide-out panel for secondary content, navigation, or actions.

## When to Use

- Side navigation menus
- Filters and settings panels
- Detail views without leaving context
- Mobile-style bottom sheets

## Drawer vs Modal

| Component | Use Case |
|-----------|----------|
| **Drawer** | Navigation, filters, ongoing reference |
| **Modal** | Focused tasks, confirmations, forms |

## Position

| Value | Use Case |
|-------|----------|
| **right** | Detail panels, settings (default) |
| **left** | Navigation menus |
| **bottom** | Mobile actions, quick selections |
| **top** | Notifications, alerts |
        `,
      },
    },
  },
  argTypes: {
    position: {
      control: 'select',
      options: ['left', 'right', 'top', 'bottom'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'full'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Right: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Open Drawer</button>
        <Drawer {...args} open={open} onClose={() => setOpen(false)} position="right">
          <div style={{ padding: '24px' }}>
            <h2 style={{ marginBottom: '16px' }}>Drawer Content</h2>
            <p>This is a side drawer. Click outside or press Escape to close.</p>
          </div>
        </Drawer>
      </>
    );
  },
};

export const Left: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Open Left Drawer</button>
        <Drawer open={open} onClose={() => setOpen(false)} position="left">
          <div style={{ padding: '24px' }}>
            <h2>Navigation</h2>
            <nav style={{ marginTop: '16px' }}>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><a href="#">Home</a></li>
                <li><a href="#">Products</a></li>
                <li><a href="#">About</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </nav>
          </div>
        </Drawer>
      </>
    );
  },
};

export const Bottom: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Open Bottom Drawer</button>
        <Drawer open={open} onClose={() => setOpen(false)} position="bottom" size="md">
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <h2>Bottom Drawer</h2>
            <p>Great for mobile-style menus and actions.</p>
          </div>
        </Drawer>
      </>
    );
  },
};

export const Positions: Story = {
  render: () => {
    const [position, setPosition] = useState<'left' | 'right' | 'top' | 'bottom' | null>(null);
    return (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => setPosition('left')}>Left</button>
        <button onClick={() => setPosition('right')}>Right</button>
        <button onClick={() => setPosition('top')}>Top</button>
        <button onClick={() => setPosition('bottom')}>Bottom</button>
        {position && (
          <Drawer open={true} onClose={() => setPosition(null)} position={position}>
            <div style={{ padding: '24px' }}>
              <h2>Position: {position}</h2>
            </div>
          </Drawer>
        )}
      </div>
    );
  },
};
