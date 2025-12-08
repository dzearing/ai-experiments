import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'Feedback/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Placeholder component shown while content is loading.

## When to Use

- Page or section loading states
- Async data fetching
- Image placeholders
- Reducing perceived loading time

## Skeleton vs Spinner

| Component | Use Case |
|-----------|----------|
| **Skeleton** | Content shape preview, layout preservation |
| **Spinner** | Simple loading indicator, unknown layout |

## Variants

| Variant | Use Case |
|---------|----------|
| **text** | Text lines, paragraphs |
| **circular** | Avatars, icons |
| **rectangular** | Images, cards, containers |
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Skeleton variant="text" width={200} />,
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--page-text-soft)' }}>Small (100px)</div>
        <Skeleton variant="text" width={100} />
      </div>
      <div>
        <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--page-text-soft)' }}>Medium (200px)</div>
        <Skeleton variant="text" width={200} />
      </div>
      <div>
        <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--page-text-soft)' }}>Large (300px)</div>
        <Skeleton variant="text" width={300} />
      </div>
      <div>
        <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--page-text-soft)' }}>Full Width (100%)</div>
        <Skeleton variant="text" width="100%" />
      </div>
    </div>
  ),
};

export const Text: Story = {
  render: () => <Skeleton variant="text" width={200} />,
};

export const MultipleLines: Story = {
  render: () => <Skeleton variant="text" lines={3} />,
};

export const Circular: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Skeleton variant="circular" width={32} height={32} />
      <Skeleton variant="circular" width={48} height={48} />
      <Skeleton variant="circular" width={64} height={64} />
    </div>
  ),
};

export const Rectangular: Story = {
  render: () => <Skeleton variant="rectangular" width={300} height={150} />,
};

export const NoAnimation: Story = {
  render: () => <Skeleton variant="text" width={200} animation={false} />,
};

export const CustomRadius: Story = {
  render: () => <Skeleton variant="rectangular" width={200} height={100} borderRadius={16} />,
};

export const CardPlaceholder: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', padding: '16px', background: 'var(--panel-background)', borderRadius: '8px' }}>
      <Skeleton variant="circular" width={48} height={48} />
      <div style={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" />
        <div style={{ marginTop: '8px' }}>
          <Skeleton variant="text" lines={2} />
        </div>
      </div>
    </div>
  ),
};

export const ListPlaceholder: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Skeleton variant="circular" width={40} height={40} />
          <div style={{ flex: 1 }}>
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  ),
};
