# Card Component

A versatile container component that groups related content and actions with consistent styling and structure.

## Overview

The Card component provides a flexible container with support for headers, content areas, and footers. It serves as the foundation for many specialized card types throughout the application.

## Features

- Header, content, and footer sections
- Elevation/shadow variants
- Hover and interactive states
- Padding and spacing options
- Border and background customization
- Click handling for interactive cards
- Loading state support
- Accessible structure

## Usage

```tsx
import { Card } from '@claude-flow/ui-kit-react';

// Basic usage
<Card>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>

// With header and footer
<Card
  header={<h3>Card Title</h3>}
  footer={<Button>Action</Button>}
>
  Content area
</Card>

// Interactive card
<Card onClick={handleClick} interactive>
  Clickable card content
</Card>
```

## Relationships

### Depended on by

- **WorkItemCard** - Extends Card for displaying work items with specific layouts and actions
- **ProjectCard** - Extends Card for project information display
- **AgentCard** - Extends Card for AI agent/persona information
- **PersonaCard** - Extends Card for persona selection and display
- **UserCard** - Extends Card for user profile information
- **ChatBubble** - Extends Card for chat message display with sender info and actions
- **KanbanCard** - Extends Card for draggable task cards in kanban boards
- **RepoCard** - Extends Card for repository information display
- **NotificationCenter** - Uses Card components for notification items
- **DashboardWidget** - Extends Card for dashboard metric displays
- **FilePreview** - Uses Card to frame file preview content
- **ImageTile** - Extends Card patterns for image gallery items

### Depends on

- **Button** - Often used in card footers for actions
- **Skeleton** - Used for loading states
- **React** - Core React dependencies for component functionality
- **CSS Modules** - For component styling isolation