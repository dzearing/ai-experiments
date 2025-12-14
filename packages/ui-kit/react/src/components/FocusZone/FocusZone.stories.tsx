import type { Meta, StoryObj } from '@storybook/react';
import { FocusZone } from './FocusZone';
import { Button } from '../Button';
import { useState } from 'react';

const meta: Meta<typeof FocusZone> = {
  title: 'Focus Management/FocusZone',
  component: FocusZone,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: 'radio',
      options: ['vertical', 'horizontal'],
    },
    wrap: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FocusZone>;

export const VerticalMenu: Story = {
  render: (args) => (
    <FocusZone
      {...args}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '16px',
        border: '1px solid var(--color-panel-border)',
        borderRadius: '8px',
        width: '200px',
      }}
    >
      <Button variant="ghost" style={{ justifyContent: 'flex-start' }}>
        Dashboard
      </Button>
      <Button variant="ghost" style={{ justifyContent: 'flex-start' }}>
        Projects
      </Button>
      <Button variant="ghost" style={{ justifyContent: 'flex-start' }}>
        Settings
      </Button>
      <Button variant="ghost" style={{ justifyContent: 'flex-start' }}>
        Profile
      </Button>
      <Button variant="ghost" style={{ justifyContent: 'flex-start' }}>
        Logout
      </Button>
    </FocusZone>
  ),
  args: {
    direction: 'vertical',
    wrap: false,
  },
};

export const HorizontalToolbar: Story = {
  render: (args) => (
    <FocusZone
      {...args}
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '4px',
        padding: '8px',
        border: '1px solid var(--color-panel-border)',
        borderRadius: '8px',
      }}
    >
      <Button variant="ghost" size="sm">
        Bold
      </Button>
      <Button variant="ghost" size="sm">
        Italic
      </Button>
      <Button variant="ghost" size="sm">
        Underline
      </Button>
      <Button variant="ghost" size="sm">
        Link
      </Button>
      <Button variant="ghost" size="sm">
        Image
      </Button>
    </FocusZone>
  ),
  args: {
    direction: 'horizontal',
    wrap: false,
  },
};

export const WithWrap: Story = {
  render: (args) => (
    <FocusZone
      {...args}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '16px',
        border: '1px solid var(--color-panel-border)',
        borderRadius: '8px',
        width: '200px',
      }}
    >
      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-body-textSoft10)' }}>
        Navigation wraps from last to first item:
      </p>
      <Button variant="ghost" style={{ justifyContent: 'flex-start' }}>
        First
      </Button>
      <Button variant="ghost" style={{ justifyContent: 'flex-start' }}>
        Second
      </Button>
      <Button variant="ghost" style={{ justifyContent: 'flex-start' }}>
        Third
      </Button>
    </FocusZone>
  ),
  args: {
    direction: 'vertical',
    wrap: true,
  },
};

export const WithFocusCallback: Story = {
  render: function Render(args) {
    const [focusedItem, setFocusedItem] = useState<string | null>(null);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FocusZone
          {...args}
          onFocusChange={(el) => setFocusedItem(el.textContent)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '16px',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '8px',
            width: '200px',
          }}
        >
          <Button variant="ghost" style={{ justifyContent: 'flex-start' }}>
            Option A
          </Button>
          <Button variant="ghost" style={{ justifyContent: 'flex-start' }}>
            Option B
          </Button>
          <Button variant="ghost" style={{ justifyContent: 'flex-start' }}>
            Option C
          </Button>
        </FocusZone>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Focused: <strong>{focusedItem || 'none'}</strong>
        </p>
      </div>
    );
  },
  args: {
    direction: 'vertical',
    wrap: true,
  },
};

export const ActionList: Story = {
  render: (args) => (
    <FocusZone
      {...args}
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--color-panel-border)',
        borderRadius: '8px',
        width: '240px',
        overflow: 'hidden',
      }}
    >
      <button
        style={{
          padding: '12px 16px',
          border: 'none',
          background: 'var(--color-panel-background)',
          textAlign: 'left',
          cursor: 'pointer',
          borderBottom: '1px solid var(--color-panel-border)',
        }}
      >
        Edit item
      </button>
      <button
        style={{
          padding: '12px 16px',
          border: 'none',
          background: 'var(--color-panel-background)',
          textAlign: 'left',
          cursor: 'pointer',
          borderBottom: '1px solid var(--color-panel-border)',
        }}
      >
        Duplicate
      </button>
      <button
        style={{
          padding: '12px 16px',
          border: 'none',
          background: 'var(--color-panel-background)',
          textAlign: 'left',
          cursor: 'pointer',
          borderBottom: '1px solid var(--color-panel-border)',
        }}
      >
        Move to folder
      </button>
      <button
        style={{
          padding: '12px 16px',
          border: 'none',
          background: 'var(--color-panel-background)',
          textAlign: 'left',
          cursor: 'pointer',
          color: 'var(--color-danger-text)',
        }}
      >
        Delete
      </button>
    </FocusZone>
  ),
  args: {
    direction: 'vertical',
    wrap: false,
  },
};

export const TabList: Story = {
  render: function Render(args) {
    const [activeTab, setActiveTab] = useState(0);
    const tabs = ['Overview', 'Analytics', 'Reports', 'Settings'];

    return (
      <FocusZone
        {...args}
        role="tablist"
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '0',
          borderBottom: '1px solid var(--color-panel-border)',
        }}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === index}
            onClick={() => setActiveTab(index)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: activeTab === index ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === index ? 'var(--color-body-text)' : 'var(--color-body-textSoft10)',
              fontWeight: activeTab === index ? 500 : 400,
            }}
          >
            {tab}
          </button>
        ))}
      </FocusZone>
    );
  },
  args: {
    direction: 'horizontal',
    wrap: false,
  },
};

export const LongList: Story = {
  render: function Render(args) {
    const items = Array.from({ length: 25 }, (_, i) => `Item ${i + 1}`);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-body-textSoft10)' }}>
          Try Home, End, PageUp, PageDown keys:
        </p>
        <FocusZone
          {...args}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '8px',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '8px',
            width: '200px',
            maxHeight: '300px',
            overflow: 'auto',
          }}
        >
          {items.map((item) => (
            <button
              key={item}
              style={{
                padding: '8px 12px',
                border: 'none',
                background: 'var(--color-panel-background)',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
            >
              {item}
            </button>
          ))}
        </FocusZone>
      </div>
    );
  },
  args: {
    direction: 'vertical',
    wrap: false,
  },
};

export const TabExitsZone: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-body-textSoft10)' }}>
        Tab exits the FocusZone to next/previous element. Use arrows to navigate within:
      </p>

      <Button variant="outline">Before Zone</Button>

      <FocusZone
        {...args}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '16px',
          border: '2px solid var(--color-accent)',
          borderRadius: '8px',
          background: 'var(--color-panel-background)',
        }}
      >
        <Button variant="ghost" style={{ justifyContent: 'flex-start' }}>
          Item 1
        </Button>
        <Button variant="ghost" style={{ justifyContent: 'flex-start' }}>
          Item 2
        </Button>
        <Button variant="ghost" style={{ justifyContent: 'flex-start' }}>
          Item 3
        </Button>
        <Button variant="ghost" style={{ justifyContent: 'flex-start' }}>
          Item 4
        </Button>
      </FocusZone>

      <Button variant="outline">After Zone</Button>
    </div>
  ),
  args: {
    direction: 'vertical',
    wrap: false,
  },
};
