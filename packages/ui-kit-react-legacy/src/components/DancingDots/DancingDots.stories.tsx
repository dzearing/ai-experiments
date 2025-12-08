import type { Meta, StoryObj } from '@storybook/react';
import { DancingDots } from './DancingDots';

const meta: Meta<typeof DancingDots> = {
  title: 'Components/DancingDots',
  component: DancingDots,
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
    count: {
      control: 'select',
      options: [3, 4, 5],
    },
  },
};

export default meta;
type Story = StoryObj<typeof DancingDots>;

export const DancingDotsUsage: Story = {
  args: {},
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <DancingDots size="small" />
      <DancingDots size="medium" />
      <DancingDots size="large" />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <DancingDots variant="default" />
      <DancingDots variant="primary" />
      <DancingDots variant="success" />
      <DancingDots variant="danger" />
    </div>
  ),
};

export const DotCounts: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <DancingDots count={3} />
      <DancingDots count={4} />
      <DancingDots count={5} />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '3rem' }}>
      <DancingDots label="Typing..." />
      <DancingDots count={4} label="AI is thinking" />
    </div>
  ),
};

export const Centered: Story = {
  render: () => (
    <div style={{ width: '400px', height: '300px', border: '1px solid var(--color-body-border)' }}>
      <DancingDots center label="Loading messages..." />
    </div>
  ),
};

export const ChatIndicator: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'var(--color-panel-background)',
          border: '1px solid var(--color-panel-border)',
          borderRadius: 'var(--radius-large10)',
          width: 'fit-content',
        }}
      >
        <span style={{ fontSize: '14px' }}>Assistant</span>
        <DancingDots size="small" />
      </div>
      
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem',
        }}
      >
        <span style={{ fontSize: '12px', color: 'var(--color-body-text-soft20)' }}>
          Someone is typing
        </span>
        <DancingDots size="small" count={3} />
      </div>
    </div>
  ),
};