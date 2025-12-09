# UI-Kit Missing Components Plan

This document outlines the plan for adding missing components to the ui-kit package.

## Current State Analysis

### Existing Components (39)
- **Actions**: Button, LinkButton, IconButton
- **Inputs**: Input, Textarea, Checkbox, Radio, Switch, Select, Slider, Chip
- **Layout**: Card, Panel, Divider, Stack, Grid, Form components
- **Overlays**: Modal, Dialog, Drawer, Tooltip, Popover, Dropdown
- **Navigation**: Tabs, Breadcrumb, Pagination
- **Feedback**: Alert, Toast, Banner, Progress, Spinner, Skeleton
- **Data Display**: Avatar, Code, Text, Heading, Link
- **Animation**: PageTransition

### Missing Components Identified

---

## Phase 1: Animation Infrastructure & Tab Improvements

### 1.1 AnimatedUnderline for Tabs
**Problem**: Tabs don't have an animated underline that slides between tabs.

**Solution**: Add a sliding indicator that animates between tab positions.

**Implementation**:
- Track the active tab's position and width using refs
- Use CSS transforms with transitions for smooth animation
- The indicator should slide horizontally to the new position
- Support all tab variants (default, pills, underline)

**Files**:
- `Tabs/Tabs.tsx` - Add position tracking and indicator element
- `Tabs/Tabs.module.css` - Add animated indicator styles

### 1.2 Animation Utilities
**Problem**: No consistent way to animate components in/out.

**Solution**: Create reusable animation components and hooks.

**Components**:
- `AnimatePresence` - Wrapper for mount/unmount animations
- `Transition` - Generic transition wrapper with enter/exit states
- `Collapse` - Height animation for accordions/collapsibles
- `Fade` - Opacity transitions
- `Slide` - Directional slide animations
- `Scale` - Scale in/out animations

**Hooks**:
- `useAnimatePresence` - Track mounting state with exit animations
- `useTransition` - Manage transition states

**Files**:
- `Animation/AnimatePresence.tsx`
- `Animation/Transition.tsx`
- `Animation/Collapse.tsx`
- `Animation/Fade.tsx`
- `Animation/Slide.tsx`
- `Animation/Scale.tsx`
- `Animation/Animation.module.css`
- `Animation/useAnimatePresence.ts`

---

## Phase 2: List & Data Display Components

### 2.1 List Component
**Purpose**: Display collections of items with consistent styling.

**Variants**:
- Simple list (ul/ol styling)
- Interactive list (clickable items)
- Selectable list (single/multi-select)
- Dense/comfortable/spacious spacing

**Features**:
- List item with leading/trailing content slots
- Support for icons, avatars, actions
- Selection states
- Dividers between items
- Grouping with headers

**Files**:
- `List/List.tsx`
- `List/ListItem.tsx`
- `List/ListItemText.tsx`
- `List/ListItemIcon.tsx`
- `List/ListItemAction.tsx`
- `List/ListGroup.tsx`
- `List/List.module.css`

### 2.2 Card Component Enhancement
**Current**: Basic Card exists but needs enhancement.

**Enhancements**:
- Card header/body/footer sections
- Clickable/hoverable variants
- Media slot for images
- Card actions area
- Loading state with skeleton
- Horizontal variant

**Files**:
- `Card/Card.tsx` - Enhanced
- `Card/CardHeader.tsx`
- `Card/CardContent.tsx`
- `Card/CardMedia.tsx`
- `Card/CardActions.tsx`
- `Card/CardFooter.tsx`
- `Card/Card.module.css`

### 2.3 Table Component
**Purpose**: Display tabular data with sorting, selection, and pagination.

**Features**:
- Column definitions with header/accessor
- Sortable columns
- Row selection (single/multi)
- Fixed header on scroll
- Column resizing (optional)
- Empty state
- Loading state with skeleton rows
- Pagination integration

**Files**:
- `Table/Table.tsx`
- `Table/TableHead.tsx`
- `Table/TableBody.tsx`
- `Table/TableRow.tsx`
- `Table/TableCell.tsx`
- `Table/TableSortLabel.tsx`
- `Table/Table.module.css`

### 2.4 DataList/DetailsView Component
**Purpose**: Display key-value pairs in a structured format.

**Features**:
- Term/description pairs
- Horizontal and vertical layouts
- Column layout support
- Optional colon after term
- Responsive stacking

**Files**:
- `DataList/DataList.tsx`
- `DataList/DataListItem.tsx`
- `DataList/DataList.module.css`

---

## Phase 3: Navigation & Menu Components

### 3.1 TreeView Component
**Purpose**: Hierarchical tree navigation (like file explorer).

**Features**:
- Expandable/collapsible nodes
- Single/multi-select
- Checkbox selection mode
- Custom node rendering
- Keyboard navigation
- Drag and drop (optional)
- Async loading of children
- Icons per node type
- Animated expand/collapse

**Files**:
- `TreeView/TreeView.tsx`
- `TreeView/TreeNode.tsx`
- `TreeView/TreeNodeContent.tsx`
- `TreeView/TreeView.module.css`

### 3.2 Accordion Component
**Purpose**: Collapsible content panels (like Storybook sidebar).

**Features**:
- Single or multiple expanded panels
- Animated expand/collapse (using Collapse animation)
- Header with expand icon
- Custom header rendering
- Disabled panels
- Nested accordions (for sidebar menus)

**Files**:
- `Accordion/Accordion.tsx`
- `Accordion/AccordionItem.tsx`
- `Accordion/AccordionHeader.tsx`
- `Accordion/AccordionContent.tsx`
- `Accordion/Accordion.module.css`

### 3.3 Menu/ContextMenu Component (Rename Dropdown)
**Problem**: Current Dropdown is actually a context menu. True dropdown should be a styled select with multi-select.

**Solution**:
1. Rename `Dropdown` to `Menu` (context menu behavior)
2. Create new `ComboBox` for dropdown select with custom content

**Menu (formerly Dropdown)**:
- Right-click context menu
- Triggered by button click
- Supports keyboard shortcuts display
- Dividers and groups
- Sub-menus (nested)
- Icons

**Files**:
- `Menu/Menu.tsx` (renamed from Dropdown)
- `Menu/MenuItem.tsx`
- `Menu/MenuDivider.tsx`
- `Menu/MenuGroup.tsx`
- `Menu/SubMenu.tsx`
- `Menu/Menu.module.css`

### 3.4 ComboBox Component
**Purpose**: Dropdown that opens a list/menu for selection (like Select but customizable).

**Features**:
- Single and multi-select modes
- Search/filter functionality
- Custom option rendering
- Tags display for multi-select
- Clearable
- Async option loading
- Groups/categories

**Files**:
- `ComboBox/ComboBox.tsx`
- `ComboBox/ComboBoxOption.tsx`
- `ComboBox/ComboBoxGroup.tsx`
- `ComboBox/ComboBox.module.css`

---

## Phase 4: Layout Components

### 4.1 DockPanel/SplitPane Component
**Purpose**: Resizable panels that can be docked to sides.

**Features**:
- Dock to left, right, top, bottom
- Resizable with drag handle
- Collapsible panels
- Min/max size constraints
- Animated show/hide
- Persist sizes to localStorage (optional)

**Files**:
- `SplitPane/SplitPane.tsx`
- `SplitPane/SplitPanePanel.tsx`
- `SplitPane/Sizer.tsx`
- `SplitPane/SplitPane.module.css`

### 4.2 Sizer/Resizer Component
**Purpose**: Drag handle for resizing adjacent elements.

**Features**:
- Horizontal and vertical orientations
- Double-click to collapse/expand
- Visual grip indicator
- Keyboard accessible
- Hover/active states

**Files**:
- `Sizer/Sizer.tsx`
- `Sizer/Sizer.module.css`

### 4.3 AppShell/PageLayout Component
**Purpose**: Full page layout with header, sidebar, content, footer.

**Features**:
- Responsive sidebar (auto-collapse on mobile)
- Fixed header option
- Multiple sidebar slots (left, right)
- Breadcrumb integration
- Main content area with scrolling

**Files**:
- `AppShell/AppShell.tsx`
- `AppShell/AppHeader.tsx`
- `AppShell/AppSidebar.tsx`
- `AppShell/AppContent.tsx`
- `AppShell/AppFooter.tsx`
- `AppShell/AppShell.module.css`

---

## Phase 5: Toolbar Components

### 5.1 Toolbar Component
**Purpose**: Horizontal bar with tools, actions, and controls.

**Features**:
- Tool groups with dividers
- Icon button groups
- Alignment (start, center, end, space-between)
- Overflow menu for responsive
- Vertical variant
- Size variants

**Files**:
- `Toolbar/Toolbar.tsx`
- `Toolbar/ToolbarGroup.tsx`
- `Toolbar/ToolbarDivider.tsx`
- `Toolbar/ToolbarButton.tsx`
- `Toolbar/Toolbar.module.css`

### 5.2 ButtonGroup Component
**Purpose**: Group buttons together visually.

**Features**:
- Connected buttons (shared borders)
- Segmented control variant
- Toggle group (single/multi select)
- Vertical stacking option

**Files**:
- `ButtonGroup/ButtonGroup.tsx`
- `ButtonGroup/ButtonGroup.module.css`

---

## Phase 6: Chart Components

### 6.1 Chart Base Infrastructure
**Purpose**: Common chart utilities and wrapper.

**Features**:
- Responsive container
- Legend component
- Axis components
- Tooltip integration
- Theme-aware colors
- Animation support

**Files**:
- `Chart/ChartContainer.tsx`
- `Chart/ChartLegend.tsx`
- `Chart/ChartTooltip.tsx`
- `Chart/chartUtils.ts`
- `Chart/Chart.module.css`

### 6.2 Specific Chart Types
**Components**:
- `BarChart` - Vertical/horizontal bars, grouped/stacked
- `LineChart` - Line/area with multiple series
- `PieChart` - Pie/donut with labels
- `SparkLine` - Inline mini charts
- `ProgressRing` - Circular progress (like Apple Activity)

**Files**:
- `Chart/BarChart.tsx`
- `Chart/LineChart.tsx`
- `Chart/PieChart.tsx`
- `Chart/SparkLine.tsx`
- `Chart/ProgressRing.tsx`

---

## Phase 7: AI Input Components

### 7.1 AIInput/SmartInput Component
**Purpose**: Rich input for AI chat with attachments.

**Features**:
- Text input with auto-resize
- Image attachment (paste, drag-drop, browse)
- File attachment support
- Image preview thumbnails
- Remove attachment
- Send button integration
- Keyboard shortcuts (Cmd+Enter to send)
- Mention support (@)
- Slash commands (/)
- Loading/thinking state

**Files**:
- `AIInput/AIInput.tsx`
- `AIInput/AIInputAttachment.tsx`
- `AIInput/AIInputToolbar.tsx`
- `AIInput/AIInput.module.css`

### 7.2 ImagePreview Component
**Purpose**: Preview attached images with actions.

**Features**:
- Thumbnail grid
- Enlarge on click
- Remove button
- Loading state
- Error state

**Files**:
- `ImagePreview/ImagePreview.tsx`
- `ImagePreview/ImagePreviewItem.tsx`
- `ImagePreview/ImagePreview.module.css`

---

## Phase 8: Example Pages

### New Example Pages to Create

1. **FileExplorer.stories.tsx**
   - Uses: TreeView, SplitPane, Toolbar, List, Menu
   - Shows: File browser interface with tree navigation

2. **DataManagement.stories.tsx**
   - Uses: Table, Toolbar, ComboBox, Menu, Pagination
   - Shows: CRUD interface with filtering and bulk actions

3. **Analytics.stories.tsx**
   - Uses: Charts (Bar, Line, Pie), DataList, Panel, Grid
   - Shows: Analytics dashboard with various chart types

4. **AIChatAdvanced.stories.tsx**
   - Uses: AIInput, ImagePreview, List, Avatar, Menu
   - Shows: Full-featured AI chat with attachments

5. **ApplicationLayout.stories.tsx**
   - Uses: AppShell, Accordion, TreeView, Toolbar
   - Shows: Complete application shell like VS Code/Storybook

### Update Existing Example Pages

1. **Dashboard.stories.tsx**
   - Add: SparkLine charts, ProgressRing for metrics

2. **SettingsPage.stories.tsx**
   - Add: Accordion for setting groups, TreeView for nested settings

---

## Implementation Order

### Priority 1 (Foundation)
1. Animation utilities (AnimatePresence, Collapse, Transition)
2. Animated Tabs underline
3. Sizer component
4. Rename Dropdown → Menu

### Priority 2 (Data Display)
5. List component
6. Enhanced Card
7. Table component
8. DataList component

### Priority 3 (Navigation)
9. TreeView
10. Accordion
11. ComboBox

### Priority 4 (Layout)
12. SplitPane
13. AppShell
14. Toolbar & ButtonGroup

### Priority 5 (Advanced)
15. Charts (SparkLine first, then others)
16. AIInput
17. ImagePreview

### Priority 6 (Examples)
18. Create new example pages
19. Update existing examples
20. Add documentation links

---

## Design Token Usage

All components should follow the established token patterns:

### Surfaces to Use
- `panel` - Cards, panels, elevated containers
- `inset` - Input backgrounds, recessed areas
- `control*` - Interactive elements
- `overlay` - Modals, popovers
- `popout` - Menus, dropdowns

### Animation Tokens
- `--duration-fast`: 100ms (hover states)
- `--duration-normal`: 200ms (most transitions)
- `--duration-slow`: 300ms (complex animations)
- `--ease-default`: Standard easing
- `--ease-bounce`: For playful interactions

### Spacing
- Follow 4px grid system
- Use `--space-*` tokens consistently

---

## Component Documentation Pattern

Each component should include:
1. JSDoc with surface/token documentation
2. Storybook stories with:
   - Default example
   - All variants
   - Interactive playground
   - Usage documentation
3. Link to example pages showing real-world usage

---

## File Structure Pattern

```
ComponentName/
├── ComponentName.tsx
├── ComponentName.module.css
├── ComponentName.stories.tsx
├── SubComponent.tsx (if needed)
└── index.ts
```

Each `index.ts` exports:
```typescript
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName';
```
