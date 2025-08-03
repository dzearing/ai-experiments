import type { Meta, StoryObj } from '@storybook/react';
import { Notification } from './Notification';
import { Button } from '../Button';
import * as React from 'react';

const meta: Meta<typeof Notification> = {
  title: 'Components/Notification',
  component: Notification,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Notification>;

export const NotificationUsage: Story = {
  args: {
    title: 'New message received',
    description: 'You have a new message from John Doe',
    timestamp: '2 min ago',
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Notification 
        variant="info"
        title="System Update"
        description="A new version is available. Update now to get the latest features."
        timestamp="Just now"
      />
      <Notification 
        variant="success"
        title="Payment Successful"
        description="Your payment of $99.00 has been processed successfully."
        timestamp="5 min ago"
      />
      <Notification 
        variant="warning"
        title="Storage Almost Full"
        description="You're using 90% of your storage space. Consider upgrading your plan."
        timestamp="1 hour ago"
      />
      <Notification 
        variant="error"
        title="Sync Failed"
        description="Unable to sync your data. Please check your connection and try again."
        timestamp="30 min ago"
      />
    </div>
  ),
};

export const WithActions: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Notification 
        variant="info"
        title="Friend Request"
        description="Sarah Johnson wants to connect with you"
        timestamp="2 min ago"
        actions={
          <>
            <Button size="small" variant="primary">Accept</Button>
            <Button size="small" variant="neutral">Decline</Button>
          </>
        }
      />
      <Notification 
        variant="warning"
        title="Subscription Expiring"
        description="Your Pro subscription expires in 3 days"
        timestamp="1 day ago"
        actions={
          <Button size="small" variant="primary">Renew Now</Button>
        }
      />
    </div>
  ),
};

export const CustomIcon: Story = {
  render: () => (
    <Notification 
      variant="info"
      title="New Feature Available"
      description="Try our new AI-powered search to find content faster"
      timestamp="Yesterday"
      icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      }
    />
  ),
};

export const ReadStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Notification 
        variant="info"
        title="New comment on your post"
        description="Alex Smith commented: 'Great article!'"
        timestamp="Just now"
        read={false}
      />
      <Notification 
        variant="info"
        title="Weekly digest ready"
        description="Your personalized weekly summary is available"
        timestamp="2 hours ago"
        read={true}
      />
    </div>
  ),
};

export const Clickable: Story = {
  render: () => {
    const [clicked, setClicked] = React.useState(false);
    
    return (
      <div>
        <Notification 
          variant="info"
          title="Click me!"
          description="This notification is clickable"
          timestamp="Just now"
          onClick={() => setClicked(true)}
        />
        {clicked && (
          <p style={{ marginTop: '1rem', color: 'var(--color-success)' }}>
            Notification clicked!
          </p>
        )}
      </div>
    );
  },
};

export const NotificationList: Story = {
  render: () => (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '0.5rem',
      maxWidth: '600px',
      padding: '1rem',
      background: 'var(--color-body-background)',
      borderRadius: 'var(--radius-large10)',
    }}>
      <h3 style={{ margin: '0 0 1rem 0' }}>Notifications</h3>
      <Notification 
        variant="success"
        title="Upload Complete"
        description="profile-photo.jpg uploaded successfully"
        timestamp="Just now"
      />
      <Notification 
        variant="info"
        title="Meeting Reminder"
        description="Team standup starts in 15 minutes"
        timestamp="15 min ago"
        actions={<Button size="small" variant="primary">Join Now</Button>}
      />
      <Notification 
        variant="warning"
        title="Security Alert"
        description="New login from Chrome on Windows"
        timestamp="1 hour ago"
        read={true}
      />
      <Notification 
        variant="info"
        title="New follower"
        description="Jane Smith started following you"
        timestamp="2 hours ago"
        read={true}
      />
    </div>
  ),
};