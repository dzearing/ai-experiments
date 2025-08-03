# Switch Component

A toggle switch component for binary on/off states with smooth animations.

## Overview

The Switch component provides an accessible toggle control for settings and preferences. It offers a more visual alternative to checkboxes for on/off states with smooth transition animations.

## Features

- Smooth sliding animation
- Label support (left or right positioned)
- Disabled state handling
- Size variants (small, medium, large)
- Custom color theming
- Loading state support
- Keyboard accessibility (Space/Enter)
- Form integration

## Usage

```tsx
import { Switch } from '@claude-flow/ui-kit-react';

// Basic usage
<Switch
  checked={isEnabled}
  onChange={handleToggle}
  label="Enable notifications"
/>

// With custom colors
<Switch
  checked={isDarkMode}
  onChange={toggleTheme}
  label="Dark mode"
  checkedColor="primary"
/>

// Disabled state
<Switch
  checked={true}
  disabled
  label="Premium feature"
/>
```

## Relationships

### Depended on by

- **SettingsPanel** - Uses Switch for toggle preferences
- **ThemeToggle** - Uses Switch for dark/light mode switching
- **FeatureFlags** - Uses Switch for feature toggles
- **NotificationSettings** - Uses Switch for notification preferences
- **PrivacySettings** - Uses Switch for privacy options
- **AccessibilitySettings** - Uses Switch for accessibility features
- **FormField** - Can wrap Switch with labels and validation
- **PreferencesDialog** - Uses Switch for user preferences

### Depends on

- **React** - Core React dependencies
- **CSS Modules** - For component styling isolation