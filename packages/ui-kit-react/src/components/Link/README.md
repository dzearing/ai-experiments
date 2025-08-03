# Link Component

A styled anchor component for navigation with consistent styling and behavior.

## Overview

The Link component provides a consistent way to handle navigation throughout the application. It supports both internal routing and external links with proper accessibility and visual feedback.

## Features

- Internal and external link handling
- Hover and focus states
- Underline variants
- Icon support
- Active state styling
- Target and rel attributes
- Keyboard navigation
- Disabled state
- Custom styling options

## Usage

```tsx
import { Link } from '@claude-flow/ui-kit-react';

// Basic link
<Link href="/about">About Us</Link>

// External link
<Link href="https://example.com" external>
  Visit Example
</Link>

// With icon
<Link href="/settings" icon={<SettingsIcon />}>
  Settings
</Link>

// No underline variant
<Link href="/home" variant="no-underline">
  Home
</Link>
```

## Relationships

### Depended on by

- **Navigation** - Uses Link for navigation items
- **Breadcrumb** - Uses Link for breadcrumb segments
- **Menu** - Uses Link for menu items
- **Footer** - Uses Link for footer navigation
- **TableOfContents** - Uses Link for content navigation
- **UserMention** - Uses Link for user profile links
- **FileLink** - Extends Link for file references
- **HashtagLink** - Uses Link for hashtag navigation
- **RelatedLinks** - Uses Link for related content

### Depends on

- **React Router** - For internal navigation (if applicable)
- **React** - Core React dependencies
- **CSS Modules** - For component styling isolation