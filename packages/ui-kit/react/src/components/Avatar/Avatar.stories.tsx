import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta = {
  title: 'Data Display/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Visual representation of a user or entity.

## When to Use

- User profile displays
- Comment/message authors
- Team member lists
- Account menus

## Fallback Behavior

1. **Image**: Displays if \`src\` is provided and loads successfully
2. **Initials**: Extracted from \`fallback\` prop (e.g., "John Doe" → "JD")
3. **Custom**: Pass JSX (like an icon) to \`fallback\`

## Sizes

| Size | Use Case |
|------|----------|
| **xs** | Dense lists, inline mentions |
| **sm** | Comments, compact views |
| **md** | Standard lists (default) |
| **lg** | Profile cards |
| **xl** | Profile pages, hero sections |
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    fallback: 'John Doe',
  },
};

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?u=john',
    alt: 'John Doe',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Avatar size="xs" fallback="JD" />
      <Avatar size="sm" fallback="JD" />
      <Avatar size="md" fallback="JD" />
      <Avatar size="lg" fallback="JD" />
      <Avatar size="xl" fallback="JD" />
    </div>
  ),
};

export const SquareAvatar: Story = {
  args: {
    fallback: 'AB',
    rounded: false,
  },
};

export const WithIcon: Story = {
  args: {
    fallback: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z" />
      </svg>
    ),
  },
};

export const Group: Story = {
  render: () => (
    <div style={{ display: 'flex' }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ marginLeft: i > 1 ? '-12px' : 0 }}>
          <Avatar
            src={`https://i.pravatar.cc/150?u=user${i}`}
            alt={`User ${i}`}
            size="md"
          />
        </div>
      ))}
    </div>
  ),
};
