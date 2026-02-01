import type { Meta, StoryObj } from '@storybook/react';
import { PageHeader } from './PageHeader';
import { Button } from '../Button/Button';

const meta = {
  title: 'Layout/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Page-level header component with breadcrumbs, title, description, and actions.

## When to Use

- Top of page content to establish context
- With breadcrumbs for hierarchical navigation
- With action buttons for page-level operations

## Best Practices

- Use a concise, descriptive title
- Breadcrumbs should reflect the navigation path
- Primary action should be prominent (primary button variant)

## Usage

\`\`\`jsx
<PageHeader
  breadcrumbs={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Settings' },
  ]}
  title="Account Settings"
  description="Manage your account preferences"
  actions={<Button variant="primary">Save Changes</Button>}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Page Title',
  },
};

export const WithDescription: Story = {
  args: {
    title: 'Dashboard',
    description: 'Overview of your workspace activity and metrics',
  },
};

export const WithBreadcrumbs: Story = {
  args: {
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Projects', href: '/projects' },
      { label: 'Project Details' },
    ],
    title: 'Project Details',
  },
};

export const WithActions: Story = {
  args: {
    title: 'User Management',
    actions: (
      <>
        <Button variant="outline">Export</Button>
        <Button variant="primary">Add User</Button>
      </>
    ),
  },
};

export const Complete: Story = {
  args: {
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Settings', href: '/dashboard/settings' },
      { label: 'Notifications' },
    ],
    title: 'Notification Preferences',
    description: 'Configure how and when you receive notifications from the system.',
    actions: (
      <>
        <Button variant="ghost">Reset to Defaults</Button>
        <Button variant="primary">Save Changes</Button>
      </>
    ),
  },
};

export const LongTitle: Story = {
  args: {
    breadcrumbs: [
      { label: 'Organization', href: '/org' },
      { label: 'Settings' },
    ],
    title: 'This is a Very Long Page Title That Should Truncate on Smaller Screens',
    description: 'Sometimes page titles can be quite long and need to handle overflow gracefully.',
    actions: <Button variant="primary">Action</Button>,
  },
};

export const Responsive: Story = {
  args: {
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Reports', href: '/reports' },
      { label: 'Analytics' },
    ],
    title: 'Analytics Report',
    description: 'Resize the viewport to see responsive behavior',
    actions: (
      <>
        <Button variant="outline" size="sm">Secondary</Button>
        <Button variant="primary" size="sm">Primary</Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'On mobile screens (< 640px), the title row stacks vertically with actions below the title.',
      },
    },
  },
};
