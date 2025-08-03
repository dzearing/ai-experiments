# Dialog Component

A modal dialog component for displaying content that requires user attention or interaction.

## Overview

The Dialog component provides a flexible modal interface with proper focus management, accessibility features, and customizable content areas. It serves as the foundation for various dialog patterns throughout the application.

## Features

- Modal and non-modal variants
- Header, content, and footer sections
- Backdrop click handling
- ESC key dismissal
- Focus trap management
- Smooth open/close animations
- Customizable width and positioning
- Scroll handling for long content
- Accessible ARIA attributes

## Usage

```tsx
import { Dialog } from '@claude-flow/ui-kit-react';

// Basic usage
<Dialog
  open={isOpen}
  onClose={handleClose}
  title="Dialog Title"
>
  <p>Dialog content goes here</p>
</Dialog>

// With footer actions
<Dialog
  open={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  footer={
    <>
      <Button variant="outline" onClick={handleClose}>Cancel</Button>
      <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
    </>
  }
>
  Are you sure you want to proceed?
</Dialog>
```

## Relationships

### Depended on by

- **Modal** - Extends Dialog with additional modal-specific features
- **ConfirmDialog** - Specialized Dialog for confirmation actions
- **AlertDialog** - Specialized Dialog for alert messages
- **FullscreenDialog** - Extends Dialog for full-screen content
- **DirectoryPicker** - Uses Dialog as the container for folder selection
- **PersonaSelector** - Uses Dialog for persona selection interface
- **CommandPalette** - Built on Dialog for command interface
- **Sheet** - Similar pattern to Dialog but slides from edges
- **Lightbox** - Uses Dialog patterns for image viewing
- **QuickView** - Uses Dialog for quick content preview
- **FileUploadZone** - May use Dialog for upload confirmations

### Depends on

- **Button** - Used for dialog action buttons
- **Portal** - For rendering dialog outside normal DOM hierarchy
- **FocusTrap** - For managing focus within dialog
- **React** - Core React dependencies
- **CSS Modules** - For component styling isolation