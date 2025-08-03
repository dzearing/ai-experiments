import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
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
type Story = StoryObj<typeof Spinner>;

export const SpinnerUsage: Story = {
  args: {},
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <Spinner size="small" />
      <Spinner size="medium" />
      <Spinner size="large" />
    </div>
  ),
};


export const WithLabel: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '3rem' }}>
      <Spinner label="Loading..." />
      <Spinner size="large" label="Please wait" />
    </div>
  ),
};

export const Centered: Story = {
  render: () => (
    <div style={{ width: '400px', height: '300px', border: '1px solid var(--color-body-border)' }}>
      <Spinner center label="Loading content..." />
    </div>
  ),
};

export const InlineUsage: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <button
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          border: '1px solid var(--color-body-border)',
          borderRadius: 'var(--radius-button)',
          background: 'var(--color-buttonNeutral-background)',
          cursor: 'pointer',
        }}
      >
        <Spinner size="small" />
        Loading...
      </button>
      
      <div
        style={{
          padding: '1rem',
          background: 'var(--color-panel-background)',
          border: '1px solid var(--color-panel-border)',
          borderRadius: 'var(--radius)',
        }}
      >
        <h3>Processing your request</h3>
        <Spinner size="small" label="This may take a few moments" />
      </div>
    </div>
  ),
};

export const LoadingStates: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div
        style={{
          width: '200px',
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-panel-background)',
          border: '1px solid var(--color-panel-border)',
          borderRadius: 'var(--radius)',
        }}
      >
        <Spinner />
      </div>
      
      <div
        style={{
          width: '200px',
          height: '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: 'var(--color-panel-background)',
          border: '1px solid var(--color-panel-border)',
          borderRadius: 'var(--radius)',
        }}
      >
        <Spinner />
        <span style={{ fontSize: '14px', color: 'var(--color-body-text-soft20)' }}>
          Uploading files...
        </span>
      </div>
    </div>
  ),
};