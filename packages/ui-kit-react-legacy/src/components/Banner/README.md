# Banner Component

A prominent notification component for displaying important messages, alerts, or calls-to-action.

## Overview

The Banner component displays important information at the top of pages or sections. It supports different severity levels, dismissible behavior, and actions for user interaction.

## Features

- Multiple severity levels (info, warning, error, success)
- Dismissible with close button
- Action buttons support
- Icon integration
- Full-width or contained layouts
- Sticky positioning option
- Animation on appear/dismiss
- Persistence options (session/local storage)

## Usage

```tsx
import { Banner } from '@claude-flow/ui-kit-react';

// Basic banner
<Banner severity="info">
  System maintenance scheduled for tonight at 10 PM.
</Banner>

// Dismissible with action
<Banner
  severity="warning"
  dismissible
  action={
    <Button size="small" variant="outline">
      Learn More
    </Button>
  }
>
  Your trial expires in 3 days.
</Banner>

// Error banner
<Banner severity="error" icon={<ErrorIcon />}>
  Connection lost. Please check your internet connection.
</Banner>
```

## Relationships

### Depended on by

- **Alert** - Similar component for inline alerts
- **Notification** - Related component for toast-style messages
- **SystemMessage** - Uses Banner for system-wide announcements
- **MaintenanceBanner** - Specialized Banner for maintenance notices
- **CookieBanner** - Uses Banner for cookie consent
- **UpdateBanner** - Shows Banner for app updates
- **WarningBanner** - Specialized Banner for warnings
- **PromotionalBanner** - Uses Banner for promotions
- **AnnouncementBar** - Uses Banner for site-wide announcements

### Depends on

- **Button** - Used for banner actions and close button
- **Icon Components** - For severity icons and close icon
- **React** - Core React dependencies
- **CSS Modules** - For component styling isolation