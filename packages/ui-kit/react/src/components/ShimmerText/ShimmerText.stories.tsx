import type { Meta, StoryObj } from '@storybook/react';
import { ShimmerText } from './ShimmerText';
import { Spinner } from '../Spinner';

const meta: Meta<typeof ShimmerText> = {
  title: 'Feedback/ShimmerText',
  component: ShimmerText,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ShimmerText>;

export const Default: Story = {
  args: {
    children: 'Processing...',
    isActive: true,
  },
};

export const Thinking: Story = {
  args: {
    children: 'Thinking...',
    isActive: true,
    durationRange: [600, 1200],
  },
};

export const SlowShimmer: Story = {
  args: {
    children: 'Loading data...',
    isActive: true,
    durationRange: [1500, 2500],
  },
};

export const FastShimmer: Story = {
  args: {
    children: 'Almost there...',
    isActive: true,
    durationRange: [400, 800],
  },
};

export const Inactive: Story = {
  args: {
    children: 'Complete',
    isActive: false,
  },
};

export const LongText: Story = {
  args: {
    children: 'Analyzing your request and preparing a detailed response...',
    isActive: true,
  },
};

export const InContext: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace' }}>
      <Spinner size="sm" />
      <ShimmerText isActive durationRange={[600, 1200]}>Pondering...</ShimmerText>
      <span style={{ opacity: 0.6, fontSize: '12px' }}>(esc to interrupt)</span>
    </div>
  ),
};
