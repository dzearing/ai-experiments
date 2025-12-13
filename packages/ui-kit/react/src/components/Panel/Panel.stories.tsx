import type { Meta, StoryObj } from '@storybook/react';
import { Panel } from './Panel';
import { Button } from '../Button';

const meta: Meta<typeof Panel> = {
  title: 'Layout/Panel',
  component: Panel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Container component for grouping related content with consistent styling.

## When to Use

- Cards and content containers
- Settings sections
- Dashboard widgets
- Grouped information display

## Variants

| Variant | Use Case |
|---------|----------|
| **default** | Standard card with background |
| **elevated** | Shadow for depth, clickable cards |
| **outlined** | Border only, lighter visual weight |

## Padding

Control internal spacing: \`none\`, \`sm\`, \`md\`, \`lg\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined'],
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This is a panel with some content inside.',
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: 'This panel has a shadow for elevation.',
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: 'This panel has just an outline, no background.',
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Panel variant="default">Default Panel</Panel>
      <Panel variant="elevated">Elevated Panel</Panel>
      <Panel variant="outlined">Outlined Panel</Panel>
    </div>
  ),
};

export const PaddingSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Panel padding="none">No padding</Panel>
      <Panel padding="sm">Small padding</Panel>
      <Panel padding="md">Medium padding</Panel>
      <Panel padding="lg">Large padding</Panel>
    </div>
  ),
};

// Real-world examples

export const UserProfileCard: Story = {
  render: () => (
    <Panel variant="elevated" padding="lg" style={{ maxWidth: '320px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--controlPrimary-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px',
          fontWeight: 600,
        }}>
          JD
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '18px' }}>John Doe</div>
          <div style={{ color: 'var(--page-text-soft)', fontSize: '14px' }}>Software Engineer</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: '20px' }}>128</div>
          <div style={{ color: 'var(--page-text-soft)', fontSize: '12px' }}>Projects</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: '20px' }}>1.4k</div>
          <div style={{ color: 'var(--page-text-soft)', fontSize: '12px' }}>Followers</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: '20px' }}>256</div>
          <div style={{ color: 'var(--page-text-soft)', fontSize: '12px' }}>Following</div>
        </div>
      </div>
      <Button variant="primary" fullWidth>
        Follow
      </Button>
    </Panel>
  ),
};

export const SettingsSection: Story = {
  render: () => (
    <Panel variant="outlined" padding="none" style={{ maxWidth: '400px' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--card-border)' }}>
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>Notifications</div>
        <div style={{ color: 'var(--page-text-soft)', fontSize: '14px' }}>
          Manage your notification preferences
        </div>
      </div>
      {[
        { label: 'Email notifications', checked: true },
        { label: 'Push notifications', checked: true },
        { label: 'SMS alerts', checked: false },
        { label: 'Weekly digest', checked: true },
      ].map((item, i) => (
        <div key={i} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: i < 3 ? '1px solid var(--card-border)' : 'none',
        }}>
          <span>{item.label}</span>
          <input type="checkbox" defaultChecked={item.checked} />
        </div>
      ))}
    </Panel>
  ),
};

export const StatsDashboard: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '600px' }}>
      <Panel variant="elevated" padding="md" style={{ textAlign: 'center' }}>
        <div style={{ color: 'var(--page-text-soft)', fontSize: '12px', marginBottom: '4px' }}>
          Total Revenue
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success-icon)' }}>
          $48,290
        </div>
        <div style={{ fontSize: '12px', color: 'var(--success-icon)' }}>+12.5%</div>
      </Panel>
      <Panel variant="elevated" padding="md" style={{ textAlign: 'center' }}>
        <div style={{ color: 'var(--page-text-soft)', fontSize: '12px', marginBottom: '4px' }}>
          Active Users
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--info-icon)' }}>
          2,340
        </div>
        <div style={{ fontSize: '12px', color: 'var(--info-icon)' }}>+8.2%</div>
      </Panel>
      <Panel variant="elevated" padding="md" style={{ textAlign: 'center' }}>
        <div style={{ color: 'var(--page-text-soft)', fontSize: '12px', marginBottom: '4px' }}>
          Bounce Rate
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--warning-icon)' }}>
          24.5%
        </div>
        <div style={{ fontSize: '12px', color: 'var(--danger-icon)' }}>+2.1%</div>
      </Panel>
    </div>
  ),
};

export const ContentCard: Story = {
  render: () => (
    <Panel variant="elevated" padding="none" style={{ maxWidth: '350px', overflow: 'hidden' }}>
      <div style={{
        height: '180px',
        background: 'linear-gradient(135deg, var(--controlPrimary-bg), var(--info-icon))',
      }} />
      <div style={{ padding: '16px' }}>
        <div style={{ fontWeight: 600, fontSize: '18px', marginBottom: '8px' }}>
          Getting Started with React
        </div>
        <div style={{ color: 'var(--page-text-soft)', fontSize: '14px', marginBottom: '16px' }}>
          Learn the fundamentals of React including components, state, and props.
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--control-bg)',
            }} />
            <span style={{ fontSize: '14px' }}>Jane Smith</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>5 min read</span>
        </div>
      </div>
    </Panel>
  ),
};
