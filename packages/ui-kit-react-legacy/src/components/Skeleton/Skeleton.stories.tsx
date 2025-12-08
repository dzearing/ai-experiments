import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';
import { Card } from '../Card';

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'rectangular', 'circular'],
    },
    animation: {
      control: 'select',
      options: ['pulse', 'wave', 'none'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Text: Story = {
  args: {
    variant: 'text',
    width: 200,
  },
};

export const MultilineText: Story = {
  args: {
    variant: 'text',
    width: 300,
    lines: 3,
  },
};

export const Rectangular: Story = {
  args: {
    variant: 'rectangular',
    width: 200,
    height: 100,
  },
};

export const Circular: Story = {
  args: {
    variant: 'circular',
    width: 60,
    height: 60,
  },
};

export const AnimationTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <p style={{ marginBottom: '0.5rem' }}>Pulse Animation (default)</p>
        <Skeleton width={250} animation="pulse" />
      </div>
      <div>
        <p style={{ marginBottom: '0.5rem' }}>Wave Animation</p>
        <Skeleton width={250} animation="wave" />
      </div>
      <div>
        <p style={{ marginBottom: '0.5rem' }}>No Animation</p>
        <Skeleton width={250} animation="none" />
      </div>
    </div>
  ),
};

export const UserProfile: Story = {
  render: () => (
    <Card style={{ maxWidth: '400px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Skeleton variant="circular" width={60} height={60} />
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" style={{ marginBottom: '0.5rem' }} />
          <Skeleton width="40%" />
        </div>
      </div>
    </Card>
  ),
};

export const BlogPost: Story = {
  render: () => (
    <Card style={{ maxWidth: '600px' }}>
      <Skeleton variant="rectangular" width="100%" height={200} style={{ marginBottom: '1rem' }} />
      <Skeleton width="70%" style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }} />
      <Skeleton width="40%" style={{ marginBottom: '1rem', fontSize: '0.875rem' }} />
      <Skeleton lines={4} width="100%" />
    </Card>
  ),
};

export const TableSkeleton: Story = {
  render: () => (
    <div style={{ 
      border: '1px solid var(--color-panel-border)',
      borderRadius: 'var(--radius-medium10)',
      overflow: 'hidden',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-panel-border)' }}>
            <th style={{ padding: '1rem', textAlign: 'left' }}>
              <Skeleton width={80} />
            </th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>
              <Skeleton width={100} />
            </th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>
              <Skeleton width={60} />
            </th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4].map((i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--color-panel-border)' }}>
              <td style={{ padding: '1rem' }}>
                <Skeleton width="90%" />
              </td>
              <td style={{ padding: '1rem' }}>
                <Skeleton width="70%" />
              </td>
              <td style={{ padding: '1rem' }}>
                <Skeleton width="50%" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};

export const ProductCard: Story = {
  render: () => (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '1rem',
      maxWidth: '800px',
    }}>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} padding="none">
          <Skeleton variant="rectangular" width="100%" height={150} />
          <div style={{ padding: 'var(--spacing)' }}>
            <Skeleton width="80%" style={{ marginBottom: '0.5rem' }} />
            <Skeleton width="60%" style={{ marginBottom: '1rem', fontSize: '0.875rem' }} />
            <Skeleton width="40%" style={{ fontSize: '1.25rem' }} />
          </div>
        </Card>
      ))}
    </div>
  ),
};

export const CommentSkeleton: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ display: 'flex', gap: '1rem' }}>
          <Skeleton variant="circular" width={40} height={40} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Skeleton width={120} />
              <Skeleton width={80} />
            </div>
            <Skeleton lines={2} width="100%" />
          </div>
        </div>
      ))}
    </div>
  ),
};

export const FormSkeleton: Story = {
  render: () => (
    <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <Skeleton width={60} style={{ marginBottom: '0.5rem' }} />
        <Skeleton variant="rectangular" width="100%" height={40} />
      </div>
      <div>
        <Skeleton width={80} style={{ marginBottom: '0.5rem' }} />
        <Skeleton variant="rectangular" width="100%" height={40} />
      </div>
      <div>
        <Skeleton width={100} style={{ marginBottom: '0.5rem' }} />
        <Skeleton variant="rectangular" width="100%" height={80} />
      </div>
      <Skeleton variant="rectangular" width={120} height={40} />
    </div>
  ),
};