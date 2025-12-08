import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Alert,
  Avatar,
  Banner,
  Button,
  Checkbox,
  Chip,
  Divider,
  Heading,
  Panel,
  Stack,
  Text,
  Toast,
} from '../index';

/**
 * # Notification Center
 *
 * A notification management interface demonstrating feedback components.
 *
 * ## Components Used
 * - **Toast**: Temporary notifications
 * - **Alert**: Inline messages
 * - **Banner**: Page-level announcements
 * - **Chip**: Filter chips with counts, unread indicator
 * - **Avatar**: Notification sources
 */

interface Notification {
  id: string;
  type: 'mention' | 'comment' | 'invite' | 'system' | 'alert';
  title: string;
  message: string;
  time: string;
  read: boolean;
  avatar?: string;
  action?: { label: string; href: string };
}

function NotificationCenterPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [showBanner, setShowBanner] = useState(true);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; variant: 'success' | 'error' | 'warning' | 'info' }>>([
    { id: '1', message: 'Settings saved successfully', variant: 'success' },
  ]);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'mention',
      title: 'Sarah Kim mentioned you',
      message: 'Hey @John, can you review this PR when you get a chance?',
      time: '2 min ago',
      read: false,
      avatar: 'SK',
    },
    {
      id: '2',
      type: 'comment',
      title: 'New comment on "API Design Doc"',
      message: 'Mike Ross: I think we should consider pagination here...',
      time: '15 min ago',
      read: false,
      avatar: 'MR',
    },
    {
      id: '3',
      type: 'invite',
      title: 'Project invitation',
      message: 'You\'ve been invited to join "E-commerce Platform" project',
      time: '1 hour ago',
      read: false,
      action: { label: 'Accept', href: '#' },
    },
    {
      id: '4',
      type: 'system',
      title: 'Scheduled maintenance',
      message: 'System maintenance scheduled for Dec 15, 2024 at 2:00 AM UTC',
      time: '2 hours ago',
      read: true,
    },
    {
      id: '5',
      type: 'alert',
      title: 'Build failed',
      message: 'CI pipeline failed on branch feature/auth. Click to view logs.',
      time: '3 hours ago',
      read: true,
    },
    {
      id: '6',
      type: 'comment',
      title: 'Anna Bell replied to your comment',
      message: 'Good point! I\'ll update the documentation accordingly.',
      time: 'Yesterday',
      read: true,
      avatar: 'AB',
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addToast = (message: string, variant: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, variant }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention': return '@';
      case 'comment': return '💬';
      case 'invite': return '✉️';
      case 'system': return '⚙️';
      case 'alert': return '⚠️';
      default: return '🔔';
    }
  };

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : activeTab === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.type === activeTab);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Top Banner */}
      {showBanner && (
        <Banner
          variant="info"
          onDismiss={() => setShowBanner(false)}
        >
          <strong>New feature!</strong> You can now customize notification preferences in Settings.
        </Banner>
      )}

      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        top: showBanner ? 60 : 16,
        right: 16,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            onClose={() => removeToast(toast.id)}
          >
            {toast.message}
          </Toast>
        ))}
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <Stack direction="row" justify="between" align="center">
          <Stack direction="row" align="center" gap="sm">
            <Heading level={1}>Notifications</Heading>
            {unreadCount > 0 && (
              <Chip variant="error" size="sm">{unreadCount}</Chip>
            )}
          </Stack>
          <Stack direction="row" gap="sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </Button>
            <Button variant="default" size="sm">Settings</Button>
          </Stack>
        </Stack>

        {/* Demo Actions */}
        <Panel padding="md" style={{ marginTop: '1.5rem', background: 'var(--inset-bg)' }}>
          <Text size="sm" color="soft">Demo: Trigger different notification types</Text>
          <Stack direction="row" gap="sm" wrap style={{ marginTop: '0.5rem' }}>
            <Button size="sm" variant="default" onClick={() => addToast('Action completed successfully', 'success')}>
              Success Toast
            </Button>
            <Button size="sm" variant="default" onClick={() => addToast('Something went wrong', 'error')}>
              Error Toast
            </Button>
            <Button size="sm" variant="default" onClick={() => addToast('Please review your settings', 'warning')}>
              Warning Toast
            </Button>
            <Button size="sm" variant="default" onClick={() => addToast('New update available', 'info')}>
              Info Toast
            </Button>
          </Stack>
        </Panel>

        {/* Inline Alerts */}
        <Stack gap="sm" style={{ marginTop: '1.5rem' }}>
          <Alert variant="warning">
            <strong>Action required:</strong> Your payment method expires soon. Please update your billing information.
          </Alert>
        </Stack>

        {/* Filter Chips */}
        <Stack direction="row" gap="sm" wrap style={{ marginTop: '1.5rem' }}>
          <Chip
            variant={activeTab === 'all' ? 'primary' : 'outline'}
            selected={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          >
            All ({notifications.length})
          </Chip>
          <Chip
            variant={activeTab === 'unread' ? 'primary' : 'outline'}
            selected={activeTab === 'unread'}
            onClick={() => setActiveTab('unread')}
          >
            Unread ({unreadCount})
          </Chip>
          <Chip
            variant={activeTab === 'mention' ? 'primary' : 'outline'}
            selected={activeTab === 'mention'}
            onClick={() => setActiveTab('mention')}
          >
            Mentions ({notifications.filter(n => n.type === 'mention').length})
          </Chip>
          <Chip
            variant={activeTab === 'comment' ? 'primary' : 'outline'}
            selected={activeTab === 'comment'}
            onClick={() => setActiveTab('comment')}
          >
            Comments ({notifications.filter(n => n.type === 'comment').length})
          </Chip>
          <Chip
            variant={activeTab === 'system' ? 'primary' : 'outline'}
            selected={activeTab === 'system'}
            onClick={() => setActiveTab('system')}
          >
            System ({notifications.filter(n => n.type === 'system').length})
          </Chip>
        </Stack>

        {/* Notification List */}
        <Panel style={{ marginTop: '1rem' }}>
          {filteredNotifications.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <Text color="soft">No notifications to show</Text>
            </div>
          ) : (
            <Stack gap="none">
              {filteredNotifications.map((notification, index) => (
                <div key={notification.id}>
                  {index > 0 && <Divider />}
                  <div
                    style={{
                      padding: 'var(--space-4)',
                      background: notification.read ? 'transparent' : 'var(--info-bg)',
                      cursor: 'pointer',
                    }}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <Stack direction="row" gap="md" align="start">
                      {notification.avatar ? (
                        <Avatar size="md" fallback={notification.avatar} />
                      ) : (
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--control-bg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                        }}>
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" justify="between" align="start">
                          <div style={{ flex: 1 }}>
                            <Stack direction="row" align="center" gap="sm">
                              <Text weight={notification.read ? 'normal' : 'semibold'}>
                                {notification.title}
                              </Text>
                              {!notification.read && (
                                <div style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  background: 'var(--controlPrimary-bg)',
                                }} />
                              )}
                            </Stack>
                            <Text size="sm" color="soft" style={{ marginTop: '0.25rem' }}>
                              {notification.message}
                            </Text>
                            <Stack direction="row" align="center" gap="md" style={{ marginTop: '0.5rem' }}>
                              <Text size="xs" color="softer">{notification.time}</Text>
                              {notification.action && (
                                <Button variant="primary" size="sm">
                                  {notification.action.label}
                                </Button>
                              )}
                            </Stack>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Dismiss notification"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNotifications(prev => prev.filter(n => n.id !== notification.id));
                            }}
                          >
                            ×
                          </Button>
                        </Stack>
                      </div>
                    </Stack>
                  </div>
                </div>
              ))}
            </Stack>
          )}
        </Panel>

        {/* Notification Preferences Preview */}
        <Panel padding="lg" style={{ marginTop: '1.5rem' }}>
          <Heading level={3}>Quick Preferences</Heading>
          <Text size="sm" color="soft">Customize which notifications you receive</Text>

          <Divider style={{ margin: '1rem 0' }} />

          <Stack gap="md">
            <Stack direction="row" justify="between" align="center">
              <Stack gap="xs">
                <Text weight="medium">Email notifications</Text>
                <Text size="sm" color="soft">Receive notifications via email</Text>
              </Stack>
              <Checkbox defaultChecked />
            </Stack>

            <Stack direction="row" justify="between" align="center">
              <Stack gap="xs">
                <Text weight="medium">Push notifications</Text>
                <Text size="sm" color="soft">Receive browser push notifications</Text>
              </Stack>
              <Checkbox defaultChecked />
            </Stack>

            <Stack direction="row" justify="between" align="center">
              <Stack gap="xs">
                <Text weight="medium">Mentions only</Text>
                <Text size="sm" color="soft">Only notify when directly mentioned</Text>
              </Stack>
              <Checkbox />
            </Stack>
          </Stack>
        </Panel>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Example Pages/Notification Center',
  component: NotificationCenterPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## Building a Notification Center

This example demonstrates how to build a comprehensive notification management interface.

### Feedback Component Patterns

#### Toast Notifications
- Use for temporary, non-blocking feedback
- Position fixed in top-right corner
- Auto-dismiss after 3-5 seconds
- Allow manual dismissal with close button
- Stack multiple toasts vertically

\`\`\`jsx
<Toast variant="success" onClose={handleClose}>
  Settings saved successfully
</Toast>
\`\`\`

#### Banner Announcements
- Use for page-level, important announcements
- Position at the very top of the page
- Allow dismissal for non-critical messages
- Use appropriate variant for urgency

#### Alert Messages
- Use for inline, contextual messages
- Place near related content
- Don't auto-dismiss (user must acknowledge)
- Include clear call-to-action when needed

### Notification List Patterns

#### Unread Indicators
- Highlight unread notifications with background color
- Add a dot indicator next to unread titles
- Use \`weight="semibold"\` for unread notification titles
- Show unread count in header badge

#### Notification Types
- Use icons or avatars based on notification source
- System notifications: Use icon
- User notifications: Use avatar
- Group by type using filter chips

#### Notification Actions
- Include action buttons for actionable notifications
- Add dismiss button for each notification
- Support "Mark all as read" in header

### Chip Usage

| Context | Variant |
|---------|---------|
| Unread count (header) | \`error\` - draws attention |
| Active filter | \`primary\` - selected state |
| Inactive filter | \`outline\` - available option |
| New feature | \`info\` - highlights feature |

### Filter Chips Pattern
Filter chips provide a clear, scannable way to filter content:
- Show count in parentheses next to each filter label
- Use \`primary\` variant for selected filter
- Use \`outline\` variant for unselected filters
- Wrap chips in a Stack with \`direction="row"\` and \`wrap\`

\`\`\`jsx
<Stack direction="row" gap="sm" wrap>
  <Chip variant={active ? 'primary' : 'outline'} onClick={...}>
    All ({count})
  </Chip>
</Stack>
\`\`\`

### Components Used

| Component | Purpose |
|-----------|---------|
| Toast | Temporary notifications |
| Banner | Page-level announcements |
| Alert | Inline contextual messages |
| Chip | Filter chips with counts, unread indicator |
| Avatar | User notification sources |
| Panel | Notification list container |
| Checkbox | Quick preferences |
| Button | Dismiss actions |
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {};
