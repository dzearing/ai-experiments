# Button Component

A versatile button component that serves as the foundation for interactive elements throughout the UI Kit.

## Overview

The Button component is a core building block that provides consistent styling, behavior, and accessibility features for clickable actions. It supports multiple variants, sizes, and shapes to accommodate different use cases.

## Features

- Multiple variants (primary, neutral, outline, inline, danger, success)
- Size options (small, medium, large)  
- Shape variations (square, rounded, round, pill)
- Loading state support
- Disabled state handling
- Full keyboard accessibility
- Icon support
- Click event handling

## Usage

```tsx
import { Button } from '@claude-flow/ui-kit-react';

// Basic usage
<Button variant="primary">Click me</Button>

// With loading state
<Button variant="primary" loading>Loading...</Button>

// With icon
<Button variant="outline" icon={<IconComponent />}>
  With Icon
</Button>
```

## Relationships

### Depended on by

- **LoadingButton** - Extends Button with built-in loading state management and loading indicators
- **IconButton** - Specialized button variant optimized for icon-only actions
- **FloatingActionButton** - Extends Button for floating action button patterns
- **Dialog** - Uses Button components for dialog actions (confirm, cancel)
- **Toast** - May include Button components for toast actions
- **Notification** - Uses Button components for notification actions
- **Card** - Often includes Button components in card footers for actions
- **Banner** - Includes Button components for banner actions
- **Dropdown** - Uses Button as the trigger element
- **FileUploadZone** - Uses Button for browse file actions
- **ConfirmDialog** - Uses Button components for confirmation actions
- **Modal** - Uses Button components in modal footers
- **MessageActions** - Uses icon-variant buttons for message operations

### Depends on

- **Spinner** - Used to show loading indicator when `loading` prop is true
- **React** - Core React dependencies for component functionality