import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Banner } from './Banner';
import { Button } from '../Button';

const meta = {
  title: 'Feedback/Banner',
  component: Banner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Prominent message bar for important announcements or status information.

## When to Use

- System-wide announcements
- Important status updates
- Action-required notifications
- Success/error feedback for operations

## Variants

| Variant | Use Case |
|---------|----------|
| **default** | Neutral announcements |
| **info** | Informational messages |
| **success** | Successful operations |
| **warning** | Caution or attention needed |
| **error** | Errors or critical issues |

## Features

- **title**: Optional heading for the banner
- **action**: Optional button or action element
- **dismissible**: Allow users to close the banner
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    children: 'This is an informational banner with helpful context.',
    variant: 'info',
  },
};

export const Success: Story = {
  args: {
    children: 'Your changes have been saved successfully.',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: 'Please review the following items before continuing.',
    variant: 'warning',
  },
};

export const Error: Story = {
  args: {
    children: 'There was an error processing your request. Please try again.',
    variant: 'error',
  },
};

export const WithTitle: Story = {
  args: {
    title: 'Update Available',
    children: 'A new version is available. Please refresh to get the latest features.',
    variant: 'info',
  },
};

export const WithAction: Story = {
  args: {
    title: 'Subscription Expiring',
    children: 'Your subscription expires in 3 days.',
    variant: 'warning',
    action: <Button size="sm">Renew Now</Button>,
  },
};

export const Dismissible: Story = {
  render: () => {
    const [visible, setVisible] = useState(true);
    if (!visible) return <Button onClick={() => setVisible(true)}>Show Banner</Button>;
    return (
      <Banner
        variant="success"
        title="Welcome!"
        dismissible
        onDismiss={() => setVisible(false)}
      >
        Thanks for joining. Click X to dismiss this banner.
      </Banner>
    );
  },
};

export const NoIcon: Story = {
  args: {
    children: 'A banner without an icon.',
    variant: 'info',
    icon: null,
  },
};
