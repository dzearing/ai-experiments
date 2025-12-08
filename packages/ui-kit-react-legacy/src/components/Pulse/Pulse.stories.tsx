import type { Meta, StoryObj } from '@storybook/react';
import { Pulse } from './Pulse';

const meta: Meta<typeof Pulse> = {
  title: 'Components/Pulse',
  component: Pulse,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'danger'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Pulse>;

export const PulseUsage: Story = {
  args: {},
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <Pulse size="small" />
      <Pulse size="medium" />
      <Pulse size="large" />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <Pulse variant="default" />
      <Pulse variant="primary" />
      <Pulse variant="success" />
      <Pulse variant="danger" />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '3rem' }}>
      <Pulse label="Processing..." />
      <Pulse size="large" label="Saving changes" />
    </div>
  ),
};

export const Centered: Story = {
  render: () => (
    <div style={{ width: '400px', height: '300px', border: '1px solid var(--color-body-border)' }}>
      <Pulse center label="Updating..." />
    </div>
  ),
};

export const InlineUsage: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div
        style={{
          padding: '1rem',
          background: 'var(--color-panel-background)',
          border: '1px solid var(--color-panel-border)',
          borderRadius: 'var(--radius)',
        }}
      >
        <h3>System Update</h3>
        <Pulse size="small" label="Installing updates..." />
      </div>
      
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <Pulse size="small" />
        <span>Checking for updates</span>
      </div>
    </div>
  ),
};