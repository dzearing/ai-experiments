# Dropdown Component

A flexible dropdown component for displaying contextual menus and selection lists.

## Overview

The Dropdown component provides a customizable menu that appears on user interaction. It supports various trigger types, positioning options, and content layouts, serving as the foundation for select inputs and context menus.

## Features

- Click and hover trigger options
- Smart positioning (auto-adjusts to viewport)
- Keyboard navigation support
- Single and multi-select modes
- Search/filter capability
- Custom item rendering
- Grouped items support
- Disabled items handling
- Accessible ARIA implementation

## Usage

```tsx
import { Dropdown } from '@claude-flow/ui-kit-react';

// Basic usage
<Dropdown
  trigger={<Button>Open Menu</Button>}
  items={[
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
    { label: 'Option 3', value: '3' }
  ]}
  onSelect={handleSelect}
/>

// With groups
<Dropdown
  trigger={<Button>Grouped Menu</Button>}
  groups={[
    {
      label: 'Group 1',
      items: [
        { label: 'Item 1', value: '1' },
        { label: 'Item 2', value: '2' }
      ]
    }
  ]}
/>
```

## Relationships

### Depended on by

- **Select** - Extends Dropdown for form select inputs
- **SearchableSelect** - Extends Dropdown with search functionality
- **MultiSelect** - Extends Dropdown for multiple selection
- **CommandPalette** - Uses Dropdown patterns for command suggestions
- **AutocompleteInput** - Uses Dropdown for suggestion display
- **MentionAutocomplete** - Uses Dropdown for mention suggestions
- **HashtagAutocomplete** - Uses Dropdown for hashtag suggestions
- **ContextMenu** - Uses Dropdown for right-click menus
- **UserMenu** - Uses Dropdown for user account menu
- **LanguageSelector** - Uses Dropdown for language selection
- **ThemeSelector** - Uses Dropdown for theme selection
- **Popover** - Similar component with different interaction patterns
- **Tooltip** - Simplified Dropdown for hover information

### Depends on

- **Button** - Often used as the trigger element
- **Portal** - For rendering dropdown outside normal DOM hierarchy
- **List** - Used for rendering dropdown items
- **Input** - Used when search is enabled
- **React** - Core React dependencies
- **CSS Modules** - For component styling isolation