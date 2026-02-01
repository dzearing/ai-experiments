import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SidePanel } from './SidePanel';
import { Button } from '../Button';
import { IconButton } from '../IconButton';

const meta: Meta<typeof SidePanel> = {
  title: 'Layout/SidePanel',
  component: SidePanel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Flexible side panel for navigation, detail views, or contextual content.

## Modes

| Mode | Description |
|------|-------------|
| **push** | Inline rendering - affects sibling layout (default) |
| **overlay** | Modal-like - renders in portal with backdrop |

## When to Use

- **Push mode**: Navigation panels, sidebars that persist alongside content
- **Overlay mode**: Detail views, contextual panels that need focus

## SidePanel vs Drawer

| Component | Use Case |
|-----------|----------|
| **SidePanel** | Navigation, sidebars (has push mode) |
| **Drawer** | Mobile menus, temporary overlays (all 4 positions) |
        `,
      },
    },
  },
  argTypes: {
    mode: {
      control: 'select',
      options: ['push', 'overlay'],
    },
    position: {
      control: 'select',
      options: ['left', 'right'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'auto'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Close icon component
const CloseIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M12 4L4 12M4 4l8 8" />
  </svg>
);

export const PushMode: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <div style={{ display: 'flex', height: '400px', border: '1px solid var(--soft-border)' }}>
        <SidePanel
          open={open}
          onClose={() => setOpen(false)}
          mode="push"
          position="left"
          header={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>Navigation</span>
              <IconButton
                icon={<CloseIcon />}
                size="sm"
                variant="ghost"
                aria-label="Close panel"
                onClick={() => setOpen(false)}
              />
            </div>
          }
        >
          <nav>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="#" style={{ display: 'block', padding: '8px 0' }}>Dashboard</a></li>
              <li><a href="#" style={{ display: 'block', padding: '8px 0' }}>Projects</a></li>
              <li><a href="#" style={{ display: 'block', padding: '8px 0' }}>Tasks</a></li>
              <li><a href="#" style={{ display: 'block', padding: '8px 0' }}>Settings</a></li>
            </ul>
          </nav>
        </SidePanel>
        <div style={{ flex: 1, padding: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <Button onClick={() => setOpen(!open)}>
              {open ? 'Close' : 'Open'} Panel
            </Button>
          </div>
          <h2>Main Content</h2>
          <p>
            This is the main content area. Notice how the content adjusts
            when the panel opens and closes. The panel is rendered inline
            (push mode) and affects the layout flow.
          </p>
        </div>
      </div>
    );
  },
};

export const OverlayMode: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Overlay Panel</Button>
        <SidePanel
          open={open}
          onClose={() => setOpen(false)}
          mode="overlay"
          position="right"
          header={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>Details</span>
              <IconButton
                icon={<CloseIcon />}
                size="sm"
                variant="ghost"
                aria-label="Close panel"
                onClick={() => setOpen(false)}
              />
            </div>
          }
        >
          <div>
            <h3>Item Details</h3>
            <p style={{ marginTop: '8px' }}>
              This panel opens in overlay mode. It renders in a portal with a
              backdrop. Click outside or press Escape to close.
            </p>
            <p style={{ marginTop: '16px' }}>
              Focus is trapped within this panel while it is open.
              Try pressing Tab to cycle through focusable elements.
            </p>
            <div style={{ marginTop: '24px', display: 'flex', gap: '8px' }}>
              <Button size="sm" onClick={() => setOpen(false)}>Save</Button>
              <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </div>
        </SidePanel>
      </>
    );
  },
};

export const RightPosition: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <div style={{ display: 'flex', height: '400px', border: '1px solid var(--soft-border)' }}>
        <div style={{ flex: 1, padding: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <Button onClick={() => setOpen(!open)}>
              {open ? 'Close' : 'Open'} Panel
            </Button>
          </div>
          <h2>Main Content</h2>
          <p>The panel is on the right side in push mode.</p>
        </div>
        <SidePanel
          open={open}
          onClose={() => setOpen(false)}
          mode="push"
          position="right"
          header={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>Properties</span>
              <IconButton
                icon={<CloseIcon />}
                size="sm"
                variant="ghost"
                aria-label="Close panel"
                onClick={() => setOpen(false)}
              />
            </div>
          }
        >
          <div>
            <p>Right-positioned panel content.</p>
          </div>
        </SidePanel>
      </div>
    );
  },
};

export const WithHeader: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Panel with Header</Button>
        <SidePanel
          open={open}
          onClose={() => setOpen(false)}
          mode="overlay"
          position="left"
          size="lg"
          header={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px' }}>Panel Title</h2>
                <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.7 }}>
                  Subtitle or description
                </p>
              </div>
              <IconButton
                icon={<CloseIcon />}
                size="sm"
                variant="ghost"
                aria-label="Close panel"
                onClick={() => setOpen(false)}
              />
            </div>
          }
        >
          <div style={{ height: '600px' }}>
            <p>This panel has a header with title and subtitle.</p>
            <p style={{ marginTop: '16px' }}>
              The content area is scrollable. Scroll down to see more content.
            </p>
            {[...Array(20)].map((_, i) => (
              <p key={i} style={{ marginTop: '16px' }}>
                Content item {i + 1}
              </p>
            ))}
          </div>
        </SidePanel>
      </>
    );
  },
};

export const Sizes: Story = {
  render: () => {
    const [activeSize, setActiveSize] = useState<'sm' | 'md' | 'lg' | null>(null);

    return (
      <>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="sm" onClick={() => setActiveSize('sm')}>Small (280px)</Button>
          <Button size="sm" onClick={() => setActiveSize('md')}>Medium (360px)</Button>
          <Button size="sm" onClick={() => setActiveSize('lg')}>Large (480px)</Button>
        </div>
        {activeSize && (
          <SidePanel
            open={true}
            onClose={() => setActiveSize(null)}
            mode="overlay"
            position="right"
            size={activeSize}
            header={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>Size: {activeSize}</span>
                <IconButton
                  icon={<CloseIcon />}
                  size="sm"
                  variant="ghost"
                  aria-label="Close panel"
                  onClick={() => setActiveSize(null)}
                />
              </div>
            }
          >
            <p>
              This panel is size "{activeSize}".
              {activeSize === 'sm' && ' Width: 280px'}
              {activeSize === 'md' && ' Width: 360px'}
              {activeSize === 'lg' && ' Width: 480px'}
            </p>
          </SidePanel>
        )}
      </>
    );
  },
};

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<'push' | 'overlay'>('push');
    const [position, setPosition] = useState<'left' | 'right'>('left');

    return (
      <div>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Mode:</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'push' | 'overlay')}
              style={{ padding: '4px 8px' }}
            >
              <option value="push">Push</option>
              <option value="overlay">Overlay</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Position:</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as 'left' | 'right')}
              style={{ padding: '4px 8px' }}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <Button onClick={() => setOpen(!open)}>
              {open ? 'Close' : 'Open'} Panel
            </Button>
          </div>
        </div>

        {mode === 'push' ? (
          <div style={{ display: 'flex', height: '300px', border: '1px solid var(--soft-border)' }}>
            {position === 'left' && (
              <SidePanel
                open={open}
                onClose={() => setOpen(false)}
                mode={mode}
                position={position}
                header={<span style={{ fontWeight: 500 }}>Panel</span>}
              >
                <p>Controlled panel content</p>
              </SidePanel>
            )}
            <div style={{ flex: 1, padding: '16px' }}>
              <p>Main content area</p>
            </div>
            {position === 'right' && (
              <SidePanel
                open={open}
                onClose={() => setOpen(false)}
                mode={mode}
                position={position}
                header={<span style={{ fontWeight: 500 }}>Panel</span>}
              >
                <p>Controlled panel content</p>
              </SidePanel>
            )}
          </div>
        ) : (
          <>
            <div style={{ height: '300px', border: '1px solid var(--soft-border)', padding: '16px' }}>
              <p>Main content area</p>
            </div>
            <SidePanel
              open={open}
              onClose={() => setOpen(false)}
              mode={mode}
              position={position}
              header={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>Panel</span>
                  <IconButton
                    icon={<CloseIcon />}
                    size="sm"
                    variant="ghost"
                    aria-label="Close panel"
                    onClick={() => setOpen(false)}
                  />
                </div>
              }
            >
              <p>Controlled panel content</p>
            </SidePanel>
          </>
        )}
      </div>
    );
  },
};

export const FocusTrapDemo: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Panel with Focus Trap</Button>
        <SidePanel
          open={open}
          onClose={() => setOpen(false)}
          mode="overlay"
          position="right"
          header={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>Focus Trap Demo</span>
              <IconButton
                icon={<CloseIcon />}
                size="sm"
                variant="ghost"
                aria-label="Close panel"
                onClick={() => setOpen(false)}
              />
            </div>
          }
        >
          <div>
            <p style={{ marginBottom: '16px' }}>
              Press Tab to cycle through the focusable elements.
              Focus stays trapped within this panel.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="First input"
                style={{ padding: '8px', border: '1px solid var(--soft-border)' }}
              />
              <input
                type="text"
                placeholder="Second input"
                style={{ padding: '8px', border: '1px solid var(--soft-border)' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" />
                Checkbox option
              </label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <Button size="sm">Submit</Button>
                <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </SidePanel>
      </>
    );
  },
};
