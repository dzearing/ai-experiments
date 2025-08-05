import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './Switch';
import React from 'react';

const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Controlled: Story = {
  name: 'Controlled Example',
  render: () => {
    const [isEnabled, setIsEnabled] = React.useState(false);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
        <Switch
          label="Enable feature"
          checked={isEnabled}
          onChange={(e) => setIsEnabled(e.target.checked)}
        />
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          This switch is controlled - its checked state is managed by the parent component.
          <br />
          Current value: {isEnabled ? 'ON' : 'OFF'}
        </p>
      </div>
    );
  },
};

export const Uncontrolled: Story = {
  name: 'Uncontrolled Example',
  render: () => {
    const switchRef = React.useRef<HTMLInputElement>(null);
    
    const handleGetValue = () => {
      alert(`Switch is ${switchRef.current?.checked ? 'ON' : 'OFF'}`);
    };
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
        <Switch
          ref={switchRef}
          label="Auto-save"
          defaultChecked
        />
        <button 
          onClick={handleGetValue}
          style={{ 
            padding: '8px 16px',
            background: 'var(--color-primary-background)',
            color: 'var(--color-primary-text)',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            cursor: 'pointer'
          }}
        >
          Get Value
        </button>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          This switch is uncontrolled - it manages its own state internally using defaultChecked.
        </p>
      </div>
    );
  },
};

export const SwitchUsage: Story = {
  render: () => {
    const [checked, setChecked] = React.useState(false);
    
    return (
      <Switch
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
    );
  },
};

export const WithLabel: Story = {
  render: () => {
    const [checked, setChecked] = React.useState(false);
    
    return (
      <Switch
        label="Enable notifications"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
    );
  },
};

export const Sizes: Story = {
  render: () => {
    const [small, setSmall] = React.useState(false);
    const [medium, setMedium] = React.useState(true);
    const [large, setLarge] = React.useState(false);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Switch
          size="small"
          label="Small switch"
          checked={small}
          onChange={(e) => setSmall(e.target.checked)}
        />
        <Switch
          size="medium"
          label="Medium switch (default)"
          checked={medium}
          onChange={(e) => setMedium(e.target.checked)}
        />
        <Switch
          size="large"
          label="Large switch"
          checked={large}
          onChange={(e) => setLarge(e.target.checked)}
        />
      </div>
    );
  },
};

export const States: Story = {
  render: () => {
    const [normal, setNormal] = React.useState(true);
    const [error, setError] = React.useState(false);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Switch
          label="Normal switch"
          checked={normal}
          onChange={(e) => setNormal(e.target.checked)}
        />
        <Switch
          label="Error switch"
          checked={error}
          onChange={(e) => setError(e.target.checked)}
          error
          helperText="Something went wrong"
        />
        <Switch
          label="Disabled switch (off)"
          checked={false}
          disabled
        />
        <Switch
          label="Disabled switch (on)"
          checked={true}
          disabled
        />
      </div>
    );
  },
};

export const LabelPositions: Story = {
  render: () => {
    const [right, setRight] = React.useState(true);
    const [left, setLeft] = React.useState(false);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Switch
          label="Label on the right (default)"
          labelRight={true}
          checked={right}
          onChange={(e) => setRight(e.target.checked)}
        />
        <Switch
          label="Label on the left"
          labelRight={false}
          checked={left}
          onChange={(e) => setLeft(e.target.checked)}
        />
      </div>
    );
  },
};

export const WithHelperText: Story = {
  render: () => {
    const [checked, setChecked] = React.useState(false);
    
    return (
      <Switch
        label="Dark mode"
        helperText="Reduces eye strain in low light conditions"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
    );
  },
};

export const Settings: Story = {
  render: () => {
    const [notifications, setNotifications] = React.useState(true);
    const [emails, setEmails] = React.useState(false);
    const [analytics, setAnalytics] = React.useState(true);
    const [marketing, setMarketing] = React.useState(false);
    
    return (
      <div style={{ 
        maxWidth: '400px',
        padding: 'var(--spacing-large20)',
        background: 'var(--color-panel-background)',
        borderRadius: 'var(--radius-large10)',
        border: '1px solid var(--color-panel-border)',
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Preferences</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Switch
            label="Push notifications"
            helperText="Get notified about important updates"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
          />
          <Switch
            label="Email updates"
            helperText="Receive weekly digest emails"
            checked={emails}
            onChange={(e) => setEmails(e.target.checked)}
          />
          <Switch
            label="Analytics"
            helperText="Help us improve by sharing usage data"
            checked={analytics}
            onChange={(e) => setAnalytics(e.target.checked)}
          />
          <Switch
            label="Marketing emails"
            helperText="Get updates about new features and offers"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
          />
        </div>
      </div>
    );
  },
};

export const FeatureFlags: Story = {
  render: () => {
    const [beta, setBeta] = React.useState(false);
    const [experimental, setExperimental] = React.useState(false);
    const [debug, setDebug] = React.useState(false);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Switch
          size="small"
          label="Beta features"
          checked={beta}
          onChange={(e) => setBeta(e.target.checked)}
        />
        <Switch
          size="small"
          label="Experimental features"
          checked={experimental}
          onChange={(e) => setExperimental(e.target.checked)}
          error={experimental}
          helperText={experimental ? 'Use at your own risk!' : undefined}
        />
        <Switch
          size="small"
          label="Debug mode"
          checked={debug}
          onChange={(e) => setDebug(e.target.checked)}
        />
      </div>
    );
  },
};