import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Drawer } from './Drawer';
import { Button } from '../Button';

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
        <Button onClick={() => setOpen(true)}>Open Drawer</Button>
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
        <Button onClick={() => setOpen(true)}>Open Left Drawer</Button>
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
        <Button onClick={() => setOpen(true)}>Open Bottom Drawer</Button>
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
        <Button size="sm" onClick={() => setPosition('left')}>Left</Button>
        <Button size="sm" onClick={() => setPosition('right')}>Right</Button>
        <Button size="sm" onClick={() => setPosition('top')}>Top</Button>
        <Button size="sm" onClick={() => setPosition('bottom')}>Bottom</Button>
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

export const FocusTrap: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Drawer with Focus Trap</Button>
        <Drawer open={open} onClose={() => setOpen(false)} position="right">
          <div style={{ padding: '24px' }}>
            <h2 style={{ marginBottom: '16px' }}>Focus Trap Demo</h2>
            <p style={{ marginBottom: '16px' }}>
              Try pressing Tab to cycle through the focusable elements.
              The focus should stay trapped within this drawer.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="Search..." style={{ padding: '8px' }} />
              <div>
                <h3>Filters</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" />
                    Option 1
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" />
                    Option 2
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" />
                    Option 3
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <Button size="sm" onClick={() => setOpen(false)}>Reset</Button>
                <Button size="sm" onClick={() => setOpen(false)}>Apply</Button>
              </div>
            </div>
          </div>
        </Drawer>
      </>
    );
  },
};
