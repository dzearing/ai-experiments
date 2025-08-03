import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from './Progress';
import { Button } from '../Button';
import React from 'react';

const meta: Meta<typeof Progress> = {
  title: 'Components/Progress',
  component: Progress,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    variant: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'error'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const ProgressUsage: Story = {
  args: {
    value: 60,
  },
};

export const WithLabel: Story = {
  args: {
    value: 75,
    showLabel: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <p style={{ marginBottom: '0.5rem' }}>Small</p>
        <Progress value={30} size="small" />
      </div>
      <div>
        <p style={{ marginBottom: '0.5rem' }}>Medium (default)</p>
        <Progress value={60} size="medium" />
      </div>
      <div>
        <p style={{ marginBottom: '0.5rem' }}>Large</p>
        <Progress value={90} size="large" />
      </div>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Progress value={25} variant="primary" showLabel />
      <Progress value={50} variant="success" showLabel />
      <Progress value={75} variant="warning" showLabel />
      <Progress value={90} variant="error" showLabel />
    </div>
  ),
};

export const LabelPositions: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <p style={{ marginBottom: '0.5rem' }}>Label Outside</p>
        <Progress value={45} showLabel labelPosition="outside" />
      </div>
      <div>
        <p style={{ marginBottom: '0.5rem' }}>Label Inside</p>
        <Progress value={75} size="large" showLabel labelPosition="inside" />
      </div>
    </div>
  ),
};

export const Indeterminate: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Progress value={0} indeterminate variant="primary" />
      <Progress value={0} indeterminate variant="success" size="large" />
    </div>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    
    React.useEffect(() => {
      if (loading && value < 100) {
        const timer = setTimeout(() => {
          setValue(v => Math.min(v + 10, 100));
        }, 500);
        return () => clearTimeout(timer);
      } else if (value === 100) {
        setLoading(false);
      }
      return undefined;
    }, [loading, value]);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Progress value={value} showLabel variant="primary" />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button 
            onClick={() => {
              setValue(0);
              setLoading(true);
            }}
            disabled={loading}
          >
            Start Progress
          </Button>
          <Button 
            variant="neutral"
            onClick={() => {
              setLoading(false);
              setValue(0);
            }}
          >
            Reset
          </Button>
        </div>
      </div>
    );
  },
};

export const FileUpload: Story = {
  render: () => {
    const [progress, setProgress] = React.useState(0);
    const [uploading, setUploading] = React.useState(false);
    
    const simulateUpload = () => {
      setUploading(true);
      setProgress(0);
      
      const interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + Math.random() * 15;
          if (next >= 100) {
            clearInterval(interval);
            setUploading(false);
            return 100;
          }
          return next;
        });
      }, 300);
    };
    
    return (
      <div style={{ 
        padding: '1.5rem',
        background: 'var(--color-panel-background)',
        border: '1px solid var(--color-panel-border)',
        borderRadius: 'var(--radius-large10)',
        maxWidth: '400px',
      }}>
        <h4 style={{ margin: '0 0 1rem 0' }}>Upload File</h4>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            {uploading ? 'Uploading document.pdf...' : 'Ready to upload'}
          </p>
          <Progress 
            value={progress} 
            showLabel 
            variant={progress === 100 ? 'success' : 'primary'}
          />
        </div>
        <Button 
          onClick={simulateUpload} 
          disabled={uploading}
          fullWidth
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </Button>
      </div>
    );
  },
};

export const MultipleProgress: Story = {
  render: () => (
    <div style={{ 
      padding: '1.5rem',
      background: 'var(--color-panel-background)',
      border: '1px solid var(--color-panel-border)',
      borderRadius: 'var(--radius-large10)',
      maxWidth: '500px',
    }}>
      <h4 style={{ margin: '0 0 1.5rem 0' }}>System Resources</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem' }}>CPU Usage</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 'var(--font-weight-semibold)' }}>65%</span>
          </div>
          <Progress value={65} variant="warning" size="small" />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem' }}>Memory</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 'var(--font-weight-semibold)' }}>42%</span>
          </div>
          <Progress value={42} variant="success" size="small" />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem' }}>Disk Space</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 'var(--font-weight-semibold)' }}>89%</span>
          </div>
          <Progress value={89} variant="error" size="small" />
        </div>
      </div>
    </div>
  ),
};