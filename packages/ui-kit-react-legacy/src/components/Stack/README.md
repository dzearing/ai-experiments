# Stack Component

A layout component for arranging children with consistent spacing in vertical or horizontal stacks.

## Overview

The Stack component simplifies layout by automatically applying consistent spacing between child elements. It's a fundamental building block for creating well-spaced interfaces without manual margin management.

## Features

- Vertical and horizontal orientations
- Customizable gap spacing
- Alignment options (start, center, end, stretch)
- Justify content options
- Wrap support
- Responsive gap values
- Divider support
- Recursive spacing (nested stacks)
- Zero-config defaults

## Usage

```tsx
import { Stack } from '@claude-flow/ui-kit-react';

// Vertical stack (default)
<Stack gap="medium">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Stack>

// Horizontal stack
<Stack direction="horizontal" gap="large" align="center">
  <Button>Cancel</Button>
  <Button variant="primary">Save</Button>
</Stack>

// With dividers
<Stack divider={<Divider />}>
  <Section>Section 1</Section>
  <Section>Section 2</Section>
</Stack>

// Responsive gap
<Stack gap={{ base: 'small', md: 'medium', lg: 'large' }}>
  <Component />
</Stack>
```

## Relationships

### Depended on by

- **Form** - Uses Stack for form field layout
- **ButtonGroup** - Uses Stack for button arrangements
- **CardList** - Uses Stack for card layouts
- **DialogFooter** - Uses Stack for action alignment
- **Toolbar** - Uses Stack for tool arrangements
- **NavigationList** - Uses Stack for nav items
- **SettingsGroup** - Uses Stack for settings layout
- **Container** - May use Stack for content organization
- **FormField** - Uses Stack for label and input arrangement
- **Grid** - Stack can be used within grid cells

### Depends on

- **React** - Core React dependencies
- **CSS Modules** - For component styling isolation
- **Divider** - Optional divider component between items