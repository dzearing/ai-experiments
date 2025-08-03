# Notification Component

A component for displaying persistent notifications and alerts within the application interface.

## Overview

The Notification component provides a way to show important messages that persist until dismissed or acted upon. Unlike toasts, notifications remain visible and can be stacked in a notification center.

## Features

- Multiple types (info, success, warning, error)
- Title and description support
- Avatar/icon display
- Timestamp display
- Action buttons
- Mark as read functionality
- Grouping support
- Badge indicators
- Click handling
- Swipe gestures (mobile)

## Usage

```tsx
import { Notification } from '@claude-flow/ui-kit-react';

// Basic notification
<Notification
  type="info"
  title="New message"
  description="You have a new message from John"
  timestamp={new Date()}
/>

// With actions
<Notification
  type="warning"
  title="Update available"
  description="A new version is ready to install"
  actions={[
    { label: 'Update Now', onClick: handleUpdate },
    { label: 'Later', onClick: handleDismiss }
  ]}
/>

// With avatar
<Notification
  type="success"
  avatar={<UserAvatar user={user} />}
  title="Task completed"
  description="Your export has finished processing"
/>
```

## Relationships

### Depended on by

- **NotificationCenter** - Container that manages multiple notifications
- **NotificationBadge** - Shows count of unread notifications
- **NotificationList** - Displays list of notifications
- **ActivityFeed** - Uses Notification for activity items
- **AlertCenter** - Uses Notification for system alerts
- **MessageCenter** - Uses Notification for messages
- **UpdateNotifier** - Uses Notification for update alerts
- **TaskNotification** - Specialized notification for tasks
- **SystemNotification** - Uses Notification for system events

### Depends on

- **Card** - Base structure for notification layout
- **Button** - Used for notification actions
- **Avatar** - For user/icon display
- **Badge** - For unread indicators
- **React** - Core React dependencies
- **CSS Modules** - For component styling isolation