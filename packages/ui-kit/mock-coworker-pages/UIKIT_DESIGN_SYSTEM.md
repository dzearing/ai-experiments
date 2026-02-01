# UI-Kit Design System Inventory

This document provides a comprehensive inventory of the UI-Kit design system packages for comparison against the Coworker design system.

## Table of Contents
1. [Core Design Tokens](#core-design-tokens)
2. [Themes](#themes)
3. [Surface System](#surface-system)
4. [React Components](#react-components)
5. [Icons](#icons)
6. [Chat Components](#chat-components)
7. [Markdown Components](#markdown-components)
8. [Picker Components](#picker-components)

---

## Core Design Tokens

Package: `@ui-kit/core`

### Spacing Tokens

Based on a 4px grid system.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Minimal spacing |
| `--space-2` | 8px | Tight spacing |
| `--space-3` | 12px | Compact spacing |
| `--space-4` | 16px | Standard spacing |
| `--space-5` | 20px | Medium spacing |
| `--space-6` | 24px | Comfortable spacing |
| `--space-8` | 32px | Large spacing |
| `--space-10` | 40px | Extra large spacing |
| `--space-12` | 48px | Section spacing |
| `--space-16` | 64px | Major section spacing |
| `--space-20` | 80px | Page section spacing |
| `--space-24` | 96px | Maximum spacing |

### Typography Tokens

#### Font Families
| Token | Value |
|-------|-------|
| `--font-sans` | 'Segoe UI Web', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif |
| `--font-mono` | 'JetBrains Mono', 'Fira Code', 'Consolas', monospace |
| `--font-serif` | 'Merriweather', Georgia, 'Times New Roman', serif |

#### Font Sizes
| Token | Value | Usage |
|-------|-------|-------|
| `--text-xs` | 11px | Caption text |
| `--text-sm` | 13px | Small text, labels |
| `--text-base` | 15px | Body text |
| `--text-lg` | 17px | Large body text |
| `--text-xl` | 20px | Small headings |
| `--text-2xl` | 24px | Section headings |
| `--text-3xl` | 30px | Page headings |
| `--text-4xl` | 36px | Display headings |

#### Font Weights
| Token | Value |
|-------|-------|
| `--weight-normal` | 400 |
| `--weight-medium` | 500 |
| `--weight-semibold` | 600 |
| `--weight-bold` | 700 |

#### Line Heights
| Token | Value | Usage |
|-------|-------|-------|
| `--leading-tight` | 1.25 | Headings, compact text |
| `--leading-normal` | 1.5 | Body text |
| `--leading-loose` | 1.75 | Relaxed reading |

### Border Radius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 2px | Subtle rounding |
| `--radius-md` | 4px | Default rounding |
| `--radius-lg` | 8px | Card rounding |
| `--radius-xl` | 12px | Large element rounding |
| `--radius-2xl` | 16px | Modal/dialog rounding |
| `--radius-full` | 9999px | Pill/circular rounding |

**Radius Styles**: `sharp` (0), `subtle` (2px), `rounded` (4px), `pill` (8px)

### Shadow Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | 0 1px 2px 0 rgba(0, 0, 0, 0.05) | Subtle elevation |
| `--shadow-md` | 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1) | Cards, dropdowns |
| `--shadow-lg` | 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1) | Modals, popovers |
| `--shadow-xl` | 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) | Large overlays |
| `--shadow-inner` | inset 0 1px 0 0 rgba(0, 0, 0, 0.06) | Inset elements |

### Animation Tokens

#### Durations
| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 100ms | Quick feedback |
| `--duration-normal` | 200ms | Standard transitions |
| `--duration-slow` | 300ms | Emphasized animations |

#### Easing Functions
| Token | Value | Usage |
|-------|-------|-------|
| `--ease-default` | ease-out | Standard easing |
| `--ease-in` | ease-in | Entry animations |
| `--ease-out` | ease-out | Exit animations |
| `--ease-in-out` | ease-in-out | Symmetric animations |
| `--ease-bounce` | cubic-bezier(0.68, -0.55, 0.265, 1.55) | Playful bounce |

---

## Themes

Package: `@ui-kit/core`

### Available Themes (20 total)

| Theme ID | Name | Description |
|----------|------|-------------|
| `default` | Default | Clean, professional design with balanced blues |
| `arctic` | Arctic | Cool, icy color palette |
| `art-deco` | Art Deco | Elegant, geometric styling |
| `cyberpunk` | Cyberpunk | Neon-inspired futuristic theme |
| `fluent` | Fluent | Microsoft Fluent Design inspired |
| `forest` | Forest | Nature-inspired green tones |
| `github` | GitHub | GitHub's color scheme |
| `high-contrast` | High Contrast | AAA accessibility compliance |
| `lavender` | Lavender | Soft purple tones |
| `linkedin` | LinkedIn | LinkedIn brand colors |
| `matrix` | Matrix | Terminal green on black |
| `midnight` | Midnight | Deep dark theme |
| `minimal` | Minimal | Clean, minimal aesthetic |
| `ocean` | Ocean | Deep blue ocean colors |
| `onedrive` | OneDrive | OneDrive brand colors |
| `retro` | Retro | Vintage computing aesthetic |
| `sketchy` | Sketchy | Hand-drawn appearance |
| `sunset` | Sunset | Warm orange and purple gradients |
| `teams` | Teams | Microsoft Teams styling |
| `terminal` | Terminal | Classic terminal appearance |

### Theme Definition Structure

```typescript
interface ThemeDefinition {
  id: string;
  name: string;
  description?: string;
  colors: {
    primary: string;      // Primary brand color
    secondary?: string;   // Secondary color (computed if omitted)
    accent?: string;      // Accent color (computed if omitted)
    neutral?: string;     // Neutral/gray base
  };
  typography?: {
    fontSans?: string;
    fontMono?: string;
    fontSerif?: string;
    scale?: number;       // 0.8 = compact, 1.2 = spacious
    baseSize?: number;    // Base font size in pixels
  };
  spacing?: {
    scale?: number;
    baseUnit?: number;
  };
  radii?: {
    scale?: number;
    style?: 'sharp' | 'subtle' | 'rounded' | 'pill';
  };
  animation?: {
    scale?: number;
    reduceMotion?: boolean;
  };
  accessibility?: {
    level?: 'AA' | 'AAA';
  };
}
```

### Theme Modes

- `light` - Light mode
- `dark` - Dark mode
- `auto` - System preference

---

## Surface System

Package: `@ui-kit/core`

The surface system provides a tonal approach to backgrounds with automatic token inheritance.

### Tonal Surfaces (9 types)

| Surface | Description | Use Case |
|---------|-------------|----------|
| `base` | Explicit reset to page defaults | Root containers |
| `raised` | Elevated content | Cards, panels, modals |
| `sunken` | Recessed areas | Input wells, sidebars |
| `soft` | Subtle backgrounds | Slight emphasis |
| `softer` | Very subtle backgrounds | Minimal emphasis |
| `strong` | Emphasized sections | Higher contrast |
| `stronger` | Very emphasized sections | Highest contrast |
| `inverted` | Opposite color scheme | Tooltips, callouts |
| `primary` | Primary color background | Branded sections, CTAs |

### Feedback Surfaces (4 types)

| Surface | Description | Use Case |
|---------|-------------|----------|
| `success` | Positive outcomes | Confirmations |
| `warning` | Caution, attention needed | Alerts |
| `danger` | Errors, destructive states | Error messages |
| `info` | Informational, neutral status | Info banners |

### Control Roles (Token Prefixes)

| Role | Description | Use Case |
|------|-------------|----------|
| `control` | Default interactive | Buttons, list items |
| `controlPrimary` | Primary actions | CTA buttons, selected states |
| `controlDanger` | Destructive actions | Delete buttons |
| `controlSubtle` | Ghost/minimal buttons | Tabs, ghost buttons |
| `controlDisabled` | Non-interactive state | Disabled controls |

### Surface Token Properties

```typescript
interface SurfaceTokens {
  // Background
  bg: string;
  'bg-hover'?: string;
  'bg-pressed'?: string;
  'bg-focus'?: string;

  // Text
  text: string;
  'text-soft'?: string;
  'text-softer'?: string;
  'text-strong'?: string;
  'text-stronger'?: string;

  // Border
  border: string;
  'border-soft'?: string;
  'border-strong'?: string;
  'border-hover'?: string;
  'border-focus'?: string;

  // Shadow
  shadow?: string;

  // Icon (for feedback surfaces)
  icon?: string;
}
```

### Special Tokens

```typescript
interface SpecialTokens {
  // Focus ring
  '--focus-ring': string;
  '--focus-ring-offset': string;
  '--focus-ring-width': string;

  // Text selection
  '--selection-bg': string;
  '--selection-text': string;

  // Links
  '--link': string;
  '--link-hover': string;
  '--link-pressed': string;
  '--link-visited': string;

  // Scrollbar
  '--scrollbar-track': string;
  '--scrollbar-thumb': string;
  '--scrollbar-thumb-hover': string;

  // Highlight
  '--highlight-bg': string;
  '--highlight-text': string;
}
```

---

## React Components

Package: `@ui-kit/react`

### Layout Components

| Component | Description | Key Props |
|-----------|-------------|-----------|
| `Stack` | Arranges children vertically/horizontally | `direction`, `align`, `justify`, `gap`, `wrap` |
| `Grid` | CSS Grid layout wrapper | Grid configuration props |
| `Sizer` | Constrains element dimensions | Size constraints |
| `SplitPane` | Resizable split panels | `orientation`, `defaultSizes` |
| `Panel` | Content container panel | Layout props |

### Typography Components

| Component | Description | Key Props |
|-----------|-------------|-----------|
| `Text` | Styled text element | `size` (xs-xl), `weight`, `color`, `truncate` |
| `Heading` | Semantic heading element | `level` (1-6), styling props |
| `Code` | Inline/block code display | `language`, styling props |
| `ShimmerText` | Animated loading text | Animation props |

### Form Components

| Component | Description | Key Props |
|-----------|-------------|-----------|
| `Input` | Text input field | `size` (sm/md/lg), `error`, `fullWidth` |
| `Textarea` | Multi-line text input | `size`, `error`, `rows` |
| `Select` | Native select dropdown | `size`, `error`, `options`, `placeholder` |
| `Dropdown` | Rich dropdown with search | `mode` (single/multi), `searchable`, `options`, `renderOption` |
| `Checkbox` | Checkbox input | `size`, `label`, `indeterminate` |
| `Radio` | Radio button input | `size`, `label` |
| `Switch` | Toggle switch | `size`, `label` |
| `Slider` | Range slider | `min`, `max`, `step`, `value` |
| `SearchInput` | Search input with icon | `onSearch`, `debounce` |
| `Form` | Form container | Form handling props |
| `FontPicker` | Font selection picker | Font configuration |

### Button Components

| Component | Description | Key Props |
|-----------|-------------|-----------|
| `Button` | Standard button | `variant` (default/primary/danger/ghost/outline), `size` (sm/md/lg), `shape` (pill/square/round), `icon`, `iconAfter`, `fullWidth` |
| `IconButton` | Icon-only button | `icon`, `variant`, `size`, `aria-label` |
| `CopyButton` | Copy to clipboard button | `content`, `onCopy` |

### Navigation Components

| Component | Description | Key Props |
|-----------|-------------|-----------|
| `Tabs` | Tabbed navigation | `items`, `variant` (default/pills/underline), `size`, `animated`, `fullWidth` |
| `Breadcrumb` | Breadcrumb navigation | `items`, `separator` |
| `Pagination` | Page navigation | `page`, `totalPages`, `onPageChange` |
| `Segmented` | Segmented control | `options`, `value`, `onChange` |
| `Link` | Styled anchor link | `href`, styling props |
| `TableOfContents` | Document navigation | `headings`, `activeId` |

### Feedback Components

| Component | Description | Key Props |
|-----------|-------------|-----------|
| `Alert` | Alert message box | `variant` (success/warning/danger/info) |
| `Banner` | Page-level banner | `variant`, `dismissable` |
| `Toast` | Non-blocking notification | `variant`, `duration`, `position`, `title`, `action` |
| `ToastProvider` | Toast queue system | `position`, `maxToasts` |
| `Spinner` | Loading spinner | `size` (sm/md/lg/xl), `label`, `inherit` |
| `Progress` | Progress bar | `value`, `variant`, `size`, `indeterminate`, `showLabel` |
| `ProgressDots` | Dot-based progress | Step indicators |
| `BusyIndicator` | Activity indicator | `size`, `label` |
| `Skeleton` | Loading placeholder | Shape and size props |
| `TypingIndicator` | Typing animation dots | Animation props |

### Data Display Components

| Component | Description | Key Props |
|-----------|-------------|-----------|
| `Avatar` | User/entity avatar | `src`, `fallback`, `size` (xs-xl), `type` (person/bot), `color` |
| `AvatarGroup` | Grouped avatars | `max`, `size` |
| `Card` | Content card | `padding` (sm/md/lg), `selected` |
| `CardTitle` | Card title subcomponent | - |
| `CardDescription` | Card description subcomponent | - |
| `Chip` | Tag/chip element | `size`, `variant`, `onRemove` |
| `Table` | Data table | Table structure props |
| `List` | List container | List configuration |
| `TreeView` | Hierarchical tree | `nodes`, `onSelect`, `expanded` |
| `FileDiff` | Code diff viewer | `diff`, `language` |
| `RelativeTime` | Relative time display | `date`, `updateInterval` |

### Overlay Components

| Component | Description | Key Props |
|-----------|-------------|-----------|
| `Modal` | Modal overlay | `open`, `onClose`, `size` (sm/md/lg/xl/full), `height` |
| `Dialog` | Modal with header/footer | `open`, `onClose`, `title`, `footer`, `onSubmit` |
| `Drawer` | Slide-out panel | `open`, `onClose`, `position` (left/right/top/bottom), `size` |
| `Popover` | Positioned popover | `trigger`, `content`, `position` |
| `Tooltip` | Hover tooltip | `content`, `position`, `delay`, `multiline`, `maxWidth` |
| `Menu` | Dropdown menu | `items`, `trigger` |
| `ImagePreview` | Image lightbox | `open`, `src`, `name` |

### Utility Components

| Component | Description | Key Props |
|-----------|-------------|-----------|
| `Divider` | Visual separator | `orientation`, `variant` |
| `Accordion` | Collapsible sections | `items`, `allowMultiple` |
| `FocusZone` | Keyboard focus management | `direction`, `wrap`, `onFocusChange` |
| `BidirectionalFocusZone` | Two-way focus management | Focus configuration |
| `DraggableReorder` | Drag-and-drop reordering | `items`, `onReorder` |
| `Toolbar` | Action toolbar | `items`, `orientation` |
| `Stepper` | Multi-step process | `steps`, `activeStep` |
| `PageTransition` | Page transition animation | Animation configuration |

### Animation Components

| Component | Description | Key Props |
|-----------|-------------|-----------|
| `Fade` | Fade in/out | `isVisible`, `duration` |
| `Scale` | Scale animation | `isVisible`, `origin` |
| `Slide` | Slide animation | `isVisible`, `direction` |
| `Collapse` | Collapse animation | `isVisible` |
| `Transition` | Generic transition wrapper | Transition configuration |
| `SurfaceAnimation` | Surface-aware animation | `isVisible`, `direction`, `onExitComplete` |
| `RotatingCarousel` | Rotating item carousel | `items`, `interval` |

---

## Icons

Package: `@ui-kit/icons`

### Icon Naming Convention

- Kebab-case file names: `chevron-down.svg`
- PascalCase component names: `ChevronDownIcon`
- Import pattern: `import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon'`

### Complete Icon List (103 icons)

#### Navigation Icons
| Icon | Name |
|------|------|
| `arrow-down` | ArrowDownIcon |
| `arrow-left` | ArrowLeftIcon |
| `arrow-right` | ArrowRightIcon |
| `arrow-up` | ArrowUpIcon |
| `back` | BackIcon |
| `chevron-down` | ChevronDownIcon |
| `chevron-left` | ChevronLeftIcon |
| `chevron-right` | ChevronRightIcon |
| `chevron-up` | ChevronUpIcon |
| `chevrons-left` | ChevronsLeftIcon |
| `chevrons-right` | ChevronsRightIcon |
| `forward` | ForwardIcon |
| `home` | HomeIcon |
| `menu` | MenuIcon |

#### Actions Icons
| Icon | Name |
|------|------|
| `add` | AddIcon |
| `add-circle` | AddCircleIcon |
| `check` | CheckIcon |
| `check-circle` | CheckCircleIcon |
| `close` | CloseIcon |
| `collapse` | CollapseIcon |
| `copy` | CopyIcon |
| `cut` | CutIcon |
| `delete` | DeleteIcon |
| `download` | DownloadIcon |
| `edit` | EditIcon |
| `expand` | ExpandIcon |
| `export` | ExportIcon |
| `filter` | FilterIcon |
| `logout` | LogoutIcon |
| `maximize` | MaximizeIcon |
| `minimize` | MinimizeIcon |
| `paste` | PasteIcon |
| `pop-in` | PopInIcon |
| `pop-out` | PopOutIcon |
| `redo` | RedoIcon |
| `refresh` | RefreshIcon |
| `remove` | RemoveIcon |
| `restore` | RestoreIcon |
| `save` | SaveIcon |
| `search` | SearchIcon |
| `send` | SendIcon |
| `share` | ShareIcon |
| `sync` | SyncIcon |
| `trash` | TrashIcon |
| `undo` | UndoIcon |
| `upload` | UploadIcon |
| `zoom-in` | ZoomInIcon |
| `zoom-out` | ZoomOutIcon |

#### Media Controls Icons
| Icon | Name |
|------|------|
| `fast-forward` | FastForwardIcon |
| `next-track` | NextTrackIcon |
| `pause` | PauseIcon |
| `play` | PlayIcon |
| `previous-track` | PreviousTrackIcon |
| `rewind` | RewindIcon |
| `stop` | StopIcon |

#### File & Folder Icons
| Icon | Name |
|------|------|
| `file` | FileIcon |
| `folder` | FolderIcon |
| `folder-plus` | FolderPlusIcon |
| `image` | ImageIcon |

#### Status Icons
| Icon | Name |
|------|------|
| `error` | ErrorIcon |
| `error-circle` | ErrorCircleIcon |
| `info` | InfoIcon |
| `info-circle` | InfoCircleIcon |
| `warning` | WarningIcon |
| `warning-triangle` | WarningTriangleIcon |
| `x-circle` | XCircleIcon |

#### Communication Icons
| Icon | Name |
|------|------|
| `bell` | BellIcon |
| `chat` | ChatIcon |
| `comment` | CommentIcon |

#### User Icons
| Icon | Name |
|------|------|
| `user` | UserIcon |
| `users` | UsersIcon |

#### Time & Calendar Icons
| Icon | Name |
|------|------|
| `calendar` | CalendarIcon |
| `clock` | ClockIcon |
| `hourglass` | HourglassIcon |

#### Social Icons
| Icon | Name |
|------|------|
| `heart` | HeartIcon |
| `star` | StarIcon |
| `thumbs-down` | ThumbsDownIcon |
| `thumbs-up` | ThumbsUpIcon |

#### Text Formatting Icons
| Icon | Name |
|------|------|
| `align-center` | AlignCenterIcon |
| `align-left` | AlignLeftIcon |
| `align-right` | AlignRightIcon |
| `bold` | BoldIcon |
| `code` | CodeIcon |
| `code-block` | CodeBlockIcon |
| `heading-1` | Heading1Icon |
| `heading-2` | Heading2Icon |
| `heading-3` | Heading3Icon |
| `indent` | IndentIcon |
| `italic` | ItalicIcon |
| `link` | LinkIcon |
| `list` | ListIcon |
| `list-bullet` | ListBulletIcon |
| `list-ordered` | ListOrderedIcon |
| `list-task` | ListTaskIcon |
| `outdent` | OutdentIcon |
| `quote` | QuoteIcon |
| `strikethrough` | StrikethroughIcon |
| `table` | TableIcon |
| `underline` | UnderlineIcon |

#### View Icons
| Icon | Name |
|------|------|
| `board` | BoardIcon |
| `grid-view` | GridViewIcon |
| `list-view` | ListViewIcon |
| `tree` | TreeIcon |

#### Misc Icons
| Icon | Name |
|------|------|
| `gear` | GearIcon |
| `globe` | GlobeIcon |
| `gripper` | GripperIcon |
| `help` | HelpIcon |
| `lightbulb` | LightbulbIcon |
| `moon` | MoonIcon |
| `more-horizontal` | MoreHorizontalIcon |
| `package` | PackageIcon |
| `sun` | SunIcon |
| `sun-moon` | SunMoonIcon |

---

## Chat Components

Package: `@ui-kit/react-chat`

### Components

| Component | Description | Key Props |
|-----------|-------------|-----------|
| `ChatInput` | Rich text chat input with TipTap | `size`, `onSubmit`, `multiline`, `commands`, `topics`, `onImageUpload`, `historyKey` |
| `ChatMessage` | Message display with markdown | `content`, `parts`, `senderName`, `isOwn`, `isSystem`, `isStreaming`, `toolCalls` |
| `ChatPanel` | Container for chat messages | Layout props |
| `VirtualizedChatPanel` | Virtualized message list | `messages`, `onLoadMore` |
| `ChatLayout` | Full chat interface layout | Layout configuration |
| `ChatGroupHeader` | Group chat header | Group info props |
| `MessageToolbar` | Message action toolbar | `timestamp`, `onEdit`, `getContent` |
| `MessageQueue` | Queued message display | `messages` |
| `ThinkingIndicator` | AI thinking animation | Animation props |
| `OpenQuestionsResolver` | Question/answer UI | `questions`, `onResolve` |
| `ContextDisplay` | Context information display | `data` |

### ChatInput Features
- Rich text editing with TipTap
- Markdown formatting toolbar
- Image paste/drop support
- Slash command autocomplete
- Topic reference autocomplete (^)
- Message history navigation
- Multiline mode toggle

### ChatMessage Parts
```typescript
type ChatMessagePart =
  | { type: 'text'; text: string }
  | { type: 'tool_calls'; calls: ChatMessageToolCall[] }
  | { type: 'component'; componentType: string; data: unknown };
```

### Context & Hooks
- `ChatContext` / `useChatContext` - Chat state management
- `useClaudeCodeCommands` - Claude Code integration
- `useScrollLock` - Scroll position management

---

## Markdown Components

Package: `@ui-kit/react-markdown`

### Components

| Component | Description | Key Props |
|-----------|-------------|-----------|
| `MarkdownRenderer` | Renders markdown with syntax highlighting | `content`, `streaming`, `enableDeepLinks`, `showLineNumbers`, `onDeepLinkClick` |
| `MarkdownEditor` | CodeMirror-based markdown editor | `value`, `onChange`, `extensions`, `onSave` |
| `MarkdownCoEditor` | Collaborative markdown editor | Co-editing configuration |
| `MarkdownToolbar` | Editor formatting toolbar | `editor`, `onAction` |

### MarkdownRenderer Features
- Syntax highlighting for code blocks
- Streaming support for AI responses
- Deep linking (hash-based navigation)
- Custom renderers for code, links, tables, headings
- Topic reference chip rendering (^topic)

### Hooks
- `useStreamingMarkdown` - Streaming text animation
- `useDeepLink` - Deep link navigation
- `useAIEdits` - AI-assisted editing

---

## Picker Components

Package: `@ui-kit/react-pickers`

### Components

| Component | Description | Key Props |
|-----------|-------------|-----------|
| `ItemPicker` | File/folder path picker | `value`, `onChange`, `onBrowse`, `onListDirectory`, `rootPaths` |
| `ItemPickerDialog` | Folder browser dialog | `open`, `onClose`, `onSelect`, `rootPaths` |

### Providers
- `DiskItemProvider` - File system provider
- `MockItemProvider` - Mock data provider for testing

---

## Component Token Usage Summary

### Surfaces by Component

| Component | Surfaces Used |
|-----------|---------------|
| Button | control, controlPrimary, controlDanger, controlSubtle, controlDisabled |
| Alert | success, warning, danger, info |
| Card | soft, primary |
| Input/Select/Textarea | inset |
| Modal/Dialog | overlay, panel |
| Drawer | overlay, panel |
| Tooltip | inverted |
| Tabs | controlSubtle, controlPrimary |
| Progress | controlSubtle, controlPrimary |
| Dropdown | inset, popout, controlPrimary |

### Common Token Patterns

```css
/* Interactive element */
background: var(--control-bg);
background: var(--control-bg-hover);  /* on :hover */
background: var(--control-bg-pressed); /* on :active */
color: var(--control-text);
border: 1px solid var(--control-border);

/* Focus state */
outline: var(--focus-ring-width) solid var(--focus-ring);
outline-offset: var(--focus-ring-offset);

/* Text hierarchy */
color: var(--body-text);       /* Primary text */
color: var(--body-text-soft);  /* Secondary text */
color: var(--body-text-softer); /* Tertiary text */

/* Spacing (4px grid) */
padding: var(--space-2) var(--space-4);  /* 8px 16px */
gap: var(--space-3);  /* 12px */
margin-bottom: var(--space-6);  /* 24px */
```

---

## Usage Guidelines

### Button Guidelines
- Prefer default size; use `size="sm"` only when space constrained
- Use `icon` prop for icon+label buttons: `<Button icon={<MyIcon />}>Label</Button>`
- Use `IconButton` for icon-only buttons (not `Button` with just icon child)

### File Organization
- One export per file with related types
- Test files colocated with source
- 500 line limit per file

### Accessibility
- All interactive elements must have visible focus states
- Use semantic HTML elements
- Provide aria labels for icon-only buttons
- Support keyboard navigation
- Theme system supports AA and AAA contrast levels
