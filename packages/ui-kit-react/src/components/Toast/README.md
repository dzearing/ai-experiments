# Toast Component

A notification component that displays temporary messages to users in a non-intrusive way.

## Overview

The Toast component provides feedback about operations through brief messages that appear temporarily and then automatically dismiss. It supports different severity levels, actions, and positioning options.

## Features

- Multiple severity levels (info, success, warning, error)
- Auto-dismiss with customizable duration
- Manual dismiss option
- Action button support
- Stack multiple toasts
- Position variants (top, bottom, corners)
- Progress bar for auto-dismiss
- Pause on hover
- Accessible announcements

## Usage

```tsx
import { Toast, useToast } from '@claude-flow/ui-kit-react';

// Using the hook
const { showToast } = useToast();

showToast({
  message: 'Operation completed successfully',
  severity: 'success',
  duration: 5000
});

// With action
showToast({
  message: 'File deleted',
  severity: 'info',
  action: {
    label: 'Undo',
    onClick: handleUndo
  }
});
```

## Relationships

### Depended on by

- **ToastProvider** - Context provider that manages toast state
- **NotificationCenter** - May display toasts alongside persistent notifications
- **FormSubmission** - Shows toasts for form success/error states
- **FileUpload** - Shows toasts for upload status
- **CopyButton** - Shows toast when content is copied
- **SaveIndicator** - Shows toast for save operations
- **ErrorBoundary** - May show toast for recoverable errors
- **NetworkStatus** - Shows toast for connection changes

### Depends on

- **Button** - Used for toast action buttons and close button
- **Progress** - Used for auto-dismiss countdown visualization
- **Portal** - For rendering toasts outside normal DOM hierarchy
- **React** - Core React dependencies
- **CSS Modules** - For component styling isolation