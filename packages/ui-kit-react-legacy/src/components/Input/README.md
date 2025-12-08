# Input Component

A flexible text input component that serves as the foundation for various form inputs throughout the UI Kit.

## Overview

The Input component provides a consistent and accessible text input experience with support for different types, states, and validation feedback. It serves as the base for more specialized input components.

## Features

- Multiple input types (text, email, password, number, etc.)
- Size variants (small, medium, large)
- Error and validation states
- Placeholder support
- Disabled state handling
- Full keyboard accessibility
- Label integration
- Helper text support
- Icon support (prefix/suffix)

## Usage

```tsx
import { Input } from '@claude-flow/ui-kit-react';

// Basic usage
<Input placeholder="Enter text" />

// With error state
<Input error errorMessage="This field is required" />

// With label and helper text
<Input 
  label="Email"
  type="email"
  helperText="We'll never share your email"
  placeholder="you@example.com"
/>
```

## Relationships

### Depended on by

- **SearchInput** - Extends Input with search-specific features like search icon and clear button
- **PasswordInput** - Extends Input with password visibility toggle and strength indicators
- **NumberInput** - Extends Input with number-specific controls (increment/decrement)
- **PinInput** - Uses multiple Input components for PIN entry
- **TextArea** - Shares similar API and styling patterns for multi-line text input
- **AutocompleteInput** - Extends Input with autocomplete dropdown functionality
- **DatePicker** - Uses Input as the text field for date entry
- **TimePicker** - Uses Input for time value display
- **TagInput** - Extends Input for tag creation and management
- **SearchableSelect** - Uses Input for the search field
- **FormField** - Wraps Input with label and validation message components
- **FileInput** - Extends Input patterns for file selection
- **CommandPalette** - Uses Input for command entry
- **SmartPromptInput** - Builds upon Input foundations for advanced text entry

### Depends on

- **React** - Core React dependencies for component functionality
- **CSS Modules** - For component styling isolation