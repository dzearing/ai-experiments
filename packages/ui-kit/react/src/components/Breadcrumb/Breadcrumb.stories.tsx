import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumb } from './Breadcrumb';

const meta = {
  title: 'Navigation/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Navigation trail showing the user's location in a hierarchy.

## When to Use

- Multi-level navigation structures
- Showing path to current page
- Allowing quick navigation to parent pages

## Best Practices

- Current page (last item) should not be a link
- Keep labels short and descriptive
- Use for hierarchical navigation, not linear history

## Usage

\`\`\`jsx
<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Current Page' }, // No href for current
  ]}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Electronics', href: '/products/electronics' },
      { label: 'Laptops' },
    ],
  },
};

export const TwoItems: Story = {
  args: {
    items: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Settings' },
    ],
  },
};

export const CustomSeparator: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Category', href: '/category' },
      { label: 'Item' },
    ],
    separator: <span style={{ margin: '0 4px' }}>/</span>,
  },
};

export const WithIcons: Story = {
  args: {
    items: [
      {
        label: (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1L1 6v9h5v-5h4v5h5V6L8 1z" />
            </svg>
            Home
          </span>
        ),
        href: '/',
      },
      { label: 'Settings', href: '/settings' },
      { label: 'Profile' },
    ],
  },
};

export const LongPath: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Documents', href: '/documents' },
      { label: 'Projects', href: '/documents/projects' },
      { label: '2024', href: '/documents/projects/2024' },
      { label: 'Q4', href: '/documents/projects/2024/q4' },
      { label: 'Report' },
    ],
  },
};
