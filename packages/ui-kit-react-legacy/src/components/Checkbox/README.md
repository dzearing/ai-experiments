# Checkbox Component

A customizable checkbox component for boolean selections and multi-select interfaces.

## Overview

The Checkbox component provides an accessible and styled checkbox input with support for labels, indeterminate states, and custom styling. It integrates seamlessly with form libraries and state management.

## Features

- Checked, unchecked, and indeterminate states
- Label integration
- Disabled state support
- Custom styling variants
- Keyboard accessibility
- Form integration
- Error state handling
- Size variants

## Usage

```tsx
import { Checkbox } from '@claude-flow/ui-kit-react';

// Basic usage
<Checkbox
  checked={isChecked}
  onChange={handleChange}
  label="Accept terms"
/>

// Indeterminate state
<Checkbox
  checked={someSelected}
  indeterminate={!allSelected && someSelected}
  label="Select all"
/>

// Disabled state
<Checkbox
  checked={true}
  disabled
  label="This option is disabled"
/>
```

## Relationships

### Depended on by

- **ChecklistItem** - Uses Checkbox for task completion tracking
- **SelectableList** - Uses Checkbox for multi-select functionality
- **DataTable** - Uses Checkbox for row selection
- **FormField** - Can wrap Checkbox with validation
- **FilterableList** - Uses Checkbox for filter options
- **TableFilters** - Uses Checkbox for multi-select filters
- **BulkActions** - Uses Checkbox for selecting multiple items
- **SettingsPanel** - Uses Checkbox for toggle settings
- **PermissionsList** - Uses Checkbox for permission selection

### Depends on

- **React** - Core React dependencies
- **CSS Modules** - For component styling isolation