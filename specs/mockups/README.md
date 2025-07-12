# Claude Flow Mockups

This directory contains visual mockups for the Claude Flow project management tool, organized into design system components and user flows.

## Directory Structure

### `/design-system/`
Contains mockups of all reusable UI components shown in both light and dark themes:

- **Button.svg** - All button variants (primary, secondary, ghost, danger) with sizes and states
- **Input.svg** - Form inputs, textareas, checkboxes, toggles, and validation states
- **Card.svg** - Card containers with headers, footers, and interaction states
- **Modal.svg** - Modal dialogs, confirmation dialogs, and toast notifications
- **Navigation.svg** - Header nav, sidebar nav, breadcrumbs, tabs, and pagination
- **Badge.svg** - Status badges, priority indicators, count badges, and removable tags
- **Progress.svg** - Linear progress bars, circular progress, loading spinners, and skeleton screens

### `/flows/`
Contains screen mockups organized by feature area:

#### `/dashboard/`
- **dashboard-view.svg** - Main dashboard with stats, recent activity, and quick actions
- **claude-chat-view.svg** - Claude AI chat interface for development assistance

#### `/projects/`
- **projects-list-view.svg** - Grid view of all projects with filters and status indicators
- **project-detail-view.svg** - Individual project view with team, progress, and tabs

#### `/work-items/`
- **work-items-kanban-view.svg** - Kanban board with drag-and-drop columns
- **work-item-editor-view.svg** - Detailed work item editor with all fields

#### `/feedback/`
- **feedback-dialog-view.svg** - Original feedback dialog with category/priority
- **feedback-dialog-simple-view.svg** - Simplified feedback dialog with just screenshot and input

#### `/personas/`
- **persona-review-session-view.svg** - AI persona review session interface

## Design Principles

1. **Consistency** - All components follow the same visual language and spacing
2. **Accessibility** - High contrast ratios and clear visual hierarchy
3. **Theme Support** - All components work in both light and dark themes
4. **Responsive** - Components scale appropriately for different screen sizes
5. **Interactive States** - Clear hover, focus, and active states for all interactive elements

## Color System

### Light Theme
- Primary: #3b82f6 (Blue)
- Success: #10b981 (Green)
- Warning: #f59e0b (Amber)
- Danger: #ef4444 (Red)
- Neutral: #6b7280 (Gray)

### Dark Theme
- Adjusted colors for proper contrast on dark backgrounds
- Primary: #60a5fa (Lighter Blue)
- Background: #1f2937
- Surface: #374151

## Component States

All interactive components include:
- Default state
- Hover state
- Active/pressed state
- Disabled state
- Loading state (where applicable)
- Error state (for form inputs)

## Usage Notes

These mockups serve as the visual specification for implementing the Claude Flow UI. They demonstrate:
- Component composition and spacing
- Visual hierarchy and typography
- Interaction patterns
- Theme switching capabilities
- Responsive behavior guidelines