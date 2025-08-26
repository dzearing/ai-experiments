# Icons Cheatsheet

Quick reference for all available icons in `@claude-flow/ui-kit-icons`. Use this guide to quickly find the right icon for your UI components.

## Import Usage

```tsx
import { IconName } from '@claude-flow/ui-kit-icons';
```

## Available Icons

### Navigation & Arrows
- `ArrowDownIcon` - Arrow pointing down
- `ArrowLeftIcon` - Arrow pointing left
- `ArrowRightIcon` - Arrow pointing right
- `ArrowUpIcon` - Arrow pointing up
- `BackIcon` - Back/return arrow
- `ChevronDownIcon` - Chevron pointing down
- `ChevronLeftIcon` - Chevron pointing left
- `ChevronRightIcon` - Chevron pointing right
- `ChevronUpIcon` - Chevron pointing up
- `ForwardIcon` - Forward arrow

### Actions & Controls
- `AddIcon` - Plus sign
- `AddCircleIcon` - Plus sign in circle
- `CloseIcon` - Close/X mark
- `CopyIcon` - Copy/duplicate
- `CutIcon` - Cut/scissors
- `DeleteIcon` - Delete/trash
- `DownloadIcon` - Download arrow
- `EditIcon` - Edit/pencil
- `ExportIcon` - Export/share out
- `PasteIcon` - Paste/clipboard
- `RedoIcon` - Redo arrow
- `RefreshIcon` - Refresh/reload
- `RemoveIcon` - Minus/remove
- `RestoreIcon` - Restore/revert
- `SaveIcon` - Save/disk
- `SearchIcon` - Search/magnifying glass
- `ShareIcon` - Share/network
- `SyncIcon` - Sync/circular arrows
- `UndoIcon` - Undo arrow
- `UploadIcon` - Upload arrow

### Media Controls
- `FastForwardIcon` - Fast forward
- `NextTrackIcon` - Next/skip forward
- `PauseIcon` - Pause
- `PlayIcon` - Play triangle
- `PreviousTrackIcon` - Previous/skip backward
- `RewindIcon` - Rewind
- `StopIcon` - Stop square

### Status & Feedback
- `CheckIcon` - Checkmark
- `CheckCircleIcon` - Checkmark in circle (success)
- `ErrorIcon` - Error/exclamation
- `ErrorCircleIcon` - Error in circle
- `InfoIcon` - Information
- `InfoCircleIcon` - Information in circle
- `LoadingIcon` - Loading indicator
- `SpinnerIcon` - Spinner/circular loading
- `WarningIcon` - Warning/alert
- `WarningTriangleIcon` - Warning triangle
- `XIcon` - X mark
- `XCircleIcon` - X in circle

### UI Elements
- `BellIcon` - Bell/notification
- `CalendarIcon` - Calendar
- `ChatIcon` - Chat bubble
- `ClockIcon` - Clock/time
- `CodeIcon` - Code brackets
- `CodeBlockIcon` - Code block
- `CommentIcon` - Comment bubble
- `ExpandIcon` - Expand/maximize
- `CollapseIcon` - Collapse/minimize
- `FileIcon` - File/document
- `FilterIcon` - Filter/funnel
- `FolderIcon` - Folder/directory
- `GearIcon` - Gear/settings
- `HeartIcon` - Heart/favorite
- `HomeIcon` - Home/house
- `HourglassIcon` - Hourglass/time/waiting
- `ImageIcon` - Image/picture
- `LinkIcon` - Link/chain
- `MaximizeIcon` - Maximize window
- `MenuIcon` - Menu/hamburger
- `MinimizeIcon` - Minimize window
- `NotificationIcon` - Notification bell
- `PopInIcon` - Pop in/enter fullscreen
- `PopOutIcon` - Pop out/exit fullscreen
- `SettingsIcon` - Settings/gear
- `StarIcon` - Star/favorite
- `TableIcon` - Table/grid
- `UserIcon` - Single user
- `UsersIcon` - Multiple users
- `ZoomInIcon` - Zoom in/magnify
- `ZoomOutIcon` - Zoom out/reduce

### Text Formatting
- `BoldIcon` - Bold text
- `ItalicIcon` - Italic text
- `UnderlineIcon` - Underline text
- `StrikethroughIcon` - Strikethrough text
- `QuoteIcon` - Quote/blockquote
- `Heading1Icon` - H1 heading
- `Heading2Icon` - H2 heading
- `Heading3Icon` - H3 heading
- `IndentIcon` - Indent/increase indent
- `OutdentIcon` - Outdent/decrease indent

### Lists
- `ListBulletIcon` - Bullet list
- `ListOrderedIcon` - Numbered list
- `ListTaskIcon` - Task/checklist

## Usage Examples

### Basic Icon Usage
```tsx
import { SaveIcon, RefreshIcon } from '@claude-flow/ui-kit-icons';

<Button>
  <SaveIcon /> Save
</Button>
```

### With Custom Styling
```tsx
import { CheckCircleIcon } from '@claude-flow/ui-kit-icons';

<CheckCircleIcon className={styles.successIcon} />
```

```css
.successIcon {
  color: var(--color-body-textSuccess);
  width: var(--spacing-large10);
  height: var(--spacing-large10);
}
```

### In Components
```tsx
import { Spinner } from '@claude-flow/ui-kit-react';
import { CheckCircleIcon, ErrorCircleIcon } from '@claude-flow/ui-kit-icons';

// Status indicator
{isLoading ? (
  <Spinner size="small" />
) : isSuccess ? (
  <CheckCircleIcon className={styles.success} />
) : (
  <ErrorCircleIcon className={styles.error} />
)}
```

## Icon Selection Guide

### For Status/State
- **Success**: `CheckCircleIcon`, `CheckIcon`
- **Error**: `ErrorCircleIcon`, `ErrorIcon`, `XCircleIcon`
- **Warning**: `WarningIcon`, `WarningTriangleIcon`
- **Info**: `InfoCircleIcon`, `InfoIcon`
- **Loading**: `SpinnerIcon`, `LoadingIcon`, or `<Spinner />` component

### For Actions
- **Primary actions**: `AddIcon`, `EditIcon`, `SaveIcon`
- **Destructive actions**: `DeleteIcon`, `RemoveIcon`, `XIcon`
- **Navigation**: `ChevronRightIcon`, `ArrowRightIcon`, `BackIcon`
- **Settings/Config**: `SettingsIcon`, `GearIcon`

### For Content Types
- **Files**: `FileIcon`, `FolderIcon`, `CodeIcon`
- **Media**: `ImageIcon`, `PlayIcon`, `PauseIcon`
- **Communication**: `ChatIcon`, `CommentIcon`, `BellIcon`
- **Users**: `UserIcon`, `UsersIcon`

## Notes

- All icons are SVG components that accept standard React props
- Icons inherit color from their parent by default
- Use CSS variables for consistent sizing: `var(--spacing)` for 16px, `var(--spacing-large10)` for 24px
- Icons are designed to work with the design token system
- For loading states, prefer the `<Spinner />` component over static icons