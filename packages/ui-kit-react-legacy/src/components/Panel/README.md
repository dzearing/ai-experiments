# Panel Component

A container component for organizing content into distinct sections with optional headers and actions.

## Overview

The Panel component provides a structured container for grouping related content. It supports collapsible behavior, headers with actions, and flexible layouts for building complex interfaces.

## Features

- Header with title and actions
- Collapsible/expandable content
- Footer section support
- Border and shadow variants
- Padding options
- Full-width and constrained modes
- Loading state support
- Nested panel support
- Keyboard accessibility for collapse

## Usage

```tsx
import { Panel } from '@claude-flow/ui-kit-react';

// Basic panel
<Panel title="Settings">
  <p>Panel content here</p>
</Panel>

// Collapsible panel
<Panel 
  title="Advanced Options"
  collapsible
  defaultCollapsed={false}
>
  <SettingsForm />
</Panel>

// With header actions
<Panel
  title="Users"
  actions={
    <Button size="small">Add User</Button>
  }
>
  <UserList />
</Panel>
```

## Relationships

### Depended on by

- **Accordion** - Uses Panel for expandable sections
- **SettingsPanel** - Extends Panel for settings UI
- **ResizablePanel** - Adds resize functionality to Panel
- **FloatingPanel** - Makes Panel draggable/floating
- **CollapsibleSection** - Uses Panel for collapsible content
- **Drawer** - Uses Panel patterns for slide-out content
- **NavigationDrawer** - Uses Panel for navigation sections
- **PropertyPanel** - Uses Panel for property display
- **DebugPanel** - Uses Panel for debug information
- **InspectorPanel** - Uses Panel for inspection tools

### Depends on

- **Button** - Used for collapse toggle and panel actions
- **Chevron/Arrow Icons** - For collapse indicators
- **React** - Core React dependencies
- **CSS Modules** - For component styling isolation