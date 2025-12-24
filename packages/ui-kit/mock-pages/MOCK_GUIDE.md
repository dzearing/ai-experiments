# Mock Page Development Guide

This guide ensures consistent, accessible, and themable mock pages that properly leverage the `@ui-kit/react` component library and design token system.

---

## Core Principle: Use Components First

**Before writing custom HTML/CSS, always check if a `@ui-kit/react` component exists.**

```tsx
// ✅ CORRECT - Use existing components
import { Button, Card, Text, Heading, Avatar, Chip, Input, Stack } from '@ui-kit/react';

// ❌ WRONG - Don't recreate what already exists
<div className={styles.customButton}>Click me</div>
<div className={styles.customCard}>Content</div>
```

### Available Components by Category

#### Actions
- `Button` - Primary action component (variants: `default`, `primary`, `danger`, `ghost`, `outline`)
- `IconButton` - Icon-only buttons (variants: `default`, `primary`, `secondary`, `ghost`, `danger`)

#### Inputs
- `Input` - Text input field
- `Textarea` - Multi-line text input
- `Checkbox` - Checkbox input
- `Radio` - Radio button
- `Switch` - Toggle switch
- `Select` - Dropdown select
- `Slider` - Range slider
- `Dropdown` - Searchable select with multi-select support

#### Layout
- `Card` - Elevated content container
- `Panel` - Section container with variants
- `Stack` - Flexbox layout helper
- `Grid` - CSS grid layout helper
- `Divider` - Visual separator
- `SplitPane` - Resizable split layout

#### Overlays
- `Modal` - Modal dialog
- `Dialog` - Confirmation/alert dialog
- `Drawer` - Slide-in panel
- `Tooltip` - Hover tooltips
- `Popover` - Click-triggered overlays
- `Menu` - Dropdown menus

#### Navigation
- `Tabs` - Tab navigation (variants: `default`, `pills`, `underline`)
- `Breadcrumb` - Breadcrumb navigation
- `Pagination` - Page navigation

#### Feedback
- `Alert` - Inline alerts
- `Toast` / `useToast` - Toast notifications
- `Banner` - Page-level banners
- `Progress` - Progress bars
- `Spinner` - Loading spinner
- `Skeleton` - Loading placeholders
- `ShimmerText` - Animated text placeholder

#### Data Display
- `Avatar` - User/entity avatar
- `AvatarGroup` - Grouped avatars with overflow
- `Chip` - Status tags/badges (variants: `default`, `primary`, `success`, `warning`, `error`, `info`)
- `Table` - Data tables
- `List` / `ListItem` - List layouts
- `TreeView` - Hierarchical data
- `Accordion` - Collapsible sections

#### Typography
- `Text` - Body text with size/weight/color variants
- `Heading` - Semantic headings (h1-h6)
- `Code` - Inline/block code
- `Link` - Navigation links

#### Animation
- `Fade`, `Slide`, `Scale` - Transition wrappers
- `Collapse` - Animated collapse/expand
- `PageTransition` - Route transitions

---

## Component Usage Guidelines

### Button Variants

```tsx
// ✅ CORRECT - Use the right variant for the context
<Button variant="primary">Save Changes</Button>     // Primary action
<Button variant="default">Cancel</Button>          // Secondary action
<Button variant="ghost">Learn more</Button>        // Tertiary/inline action
<Button variant="outline">View details</Button>    // Alternative secondary
<Button variant="danger">Delete</Button>           // Destructive action

// With icons
import { SaveIcon } from '@ui-kit/icons/SaveIcon';
<Button variant="primary" icon={<SaveIcon />}>Save</Button>

// Pill shape for suggestion chips
<Button variant="default" size="sm" shape="pill">Suggestion</Button>
```

### Chip Variants

```tsx
// ✅ CORRECT - Use semantic variants
<Chip variant="default">Draft</Chip>       // Neutral status
<Chip variant="primary">Active</Chip>      // Highlighted/selected
<Chip variant="success">Complete</Chip>    // Success state
<Chip variant="warning">Pending</Chip>     // Warning state
<Chip variant="error">Failed</Chip>        // Error state
<Chip variant="info">In Progress</Chip>    // Informational

// ❌ WRONG - Don't use non-existent variants
<Chip variant="secondary">...</Chip>       // Does not exist!
```

### Avatar & AvatarGroup

```tsx
// ✅ CORRECT
<Avatar fallback="John Doe" size="sm" />           // Shows "JD" initials
<Avatar src="/avatar.jpg" alt="John Doe" />        // Image avatar
<Avatar fallback="JS" color="#3B82F6" />           // Custom color

<AvatarGroup max={3}>
  <Avatar fallback="Alice" />
  <Avatar fallback="Bob" />
  <Avatar fallback="Carol" />
  <Avatar fallback="Dave" />  {/* Shows "+1" overflow */}
</AvatarGroup>
```

### Text & Heading

```tsx
// ✅ CORRECT - Use semantic typography components
<Heading level={1} size="h3">Page Title</Heading>
<Text size="base">Body content</Text>
<Text size="small" color="secondary">Secondary info</Text>
<Text weight="medium">Emphasized text</Text>

// ❌ WRONG - Don't use raw HTML with custom styles
<h1 className={styles.title}>Page Title</h1>
<p className={styles.secondary}>Secondary info</p>
```

### Input with Icons

```tsx
import { SearchIcon } from '@ui-kit/icons/SearchIcon';
import { SendIcon } from '@ui-kit/icons/SendIcon';

// For search/chat inputs, wrap in a flex container
<div className={styles.inputWrapper}>
  <Input placeholder="Type a message..." />
  <IconButton variant="ghost" icon={<SendIcon />} aria-label="Send" />
</div>
```

---

## Design Token Usage

### The Golden Rule

**Pick a color group for your background, use ONLY that group's tokens for foreground/border.**

```css
/* ✅ CORRECT - All tokens from the same group */
.card {
  background: var(--soft-bg);
  color: var(--soft-fg);
  border: 1px solid var(--soft-border);
}

/* ❌ WRONG - Mixing groups breaks contrast */
.broken {
  background: var(--soft-bg);
  color: var(--base-fg);  /* May not be readable! */
}
```

### Available Color Groups

| Group | Usage |
|-------|-------|
| `softer` | Input backgrounds, recessed areas |
| `soft` | Cards, panels, elevated content |
| `base` | Page background, default content |
| `strong` | Default buttons, emphasized sections |
| `stronger` | Maximum emphasis |
| `primary` | Brand color, primary buttons, selected states |
| `success` | Success states |
| `warning` | Warning states |
| `danger` | Error states |
| `info` | Informational states |
| `inverted` | Tooltips, dark surfaces |

### Spacing Tokens (4px Grid)

```css
/* ✅ CORRECT - Use spacing tokens */
.container {
  padding: var(--space-4);      /* 16px */
  gap: var(--space-3);          /* 12px */
  margin-bottom: var(--space-6); /* 24px */
}

/* ❌ WRONG - Don't hardcode pixel values */
.container {
  padding: 16px;
  gap: 12px;
  margin-bottom: 24px;
}
```

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |

### Typography Tokens

```css
.label {
  font-size: var(--text-sm);        /* 13px */
  font-weight: var(--weight-medium); /* 500 */
  line-height: var(--leading-normal); /* 1.5 */
}
```

### Border Radius Tokens

```css
.card {
  border-radius: var(--radius-lg);  /* 8px */
}

.pill {
  border-radius: var(--radius-full); /* 9999px */
}
```

### Animation Tokens

```css
.interactive {
  transition: background var(--duration-fast) var(--ease-default);
}
```

---

## Common Patterns

### Card with Content Hierarchy

```tsx
<Card padding="md">
  <Stack direction="column" gap="sm">
    <div className={styles.cardHeader}>
      <Text weight="medium">Card Title</Text>
      <Chip size="sm" variant="success">Active</Chip>
    </div>
    <Text size="small" color="secondary">
      Supporting description text goes here.
    </Text>
    <div className={styles.cardFooter}>
      <Text size="small" color="secondary">Updated 2h ago</Text>
    </div>
  </Stack>
</Card>
```

### Header with Actions

```tsx
<header className={styles.header}>
  <div className={styles.headerLeft}>
    <Heading level={1} size="h4">Page Title</Heading>
    <Chip size="sm" variant="default">Status</Chip>
  </div>
  <div className={styles.headerRight}>
    <AvatarGroup max={3}>
      {users.map(u => <Avatar key={u.id} fallback={u.name} size="sm" />)}
    </AvatarGroup>
    <Button variant="default" icon={<ShareIcon />}>Share</Button>
  </div>
</header>
```

### Empty State

```tsx
// Use Stack for layout, not custom flex divs
<Stack direction="column" align="center" gap="md" className={styles.emptyState}>
  <LightbulbIcon size={64} />
  <Heading level={2} size="h3">No Items Yet</Heading>
  <Text color="secondary" className={styles.emptyDescription}>
    Get started by creating your first item.
  </Text>
  <Button variant="primary">Create Item</Button>
</Stack>
```

### Input with Actions

```tsx
<div className={styles.inputWrapper}>
  <Input
    placeholder="Type a message..."
    aria-label="Message input"
  />
  <IconButton variant="ghost" icon={<SendIcon />} aria-label="Send" />
  <IconButton variant="secondary" icon={<MicIcon />} aria-label="Voice input" />
</div>
```

---

## Icons

**Always use icons from `@ui-kit/icons`** - never create inline SVGs.

```tsx
// ✅ CORRECT - Import from the icon package
import { SendIcon } from '@ui-kit/icons/SendIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';

// ❌ WRONG - Don't create inline SVGs
function MyIcon() {
  return <svg>...</svg>;  // Don't do this!
}
```

### Finding the Right Icon

See `/docs/guides/ICONS_CHEATSHEET.md` for the complete list. Common icons:

- **Actions**: `AddIcon`, `EditIcon`, `DeleteIcon`, `SaveIcon`, `CopyIcon`
- **Navigation**: `ChevronRightIcon`, `ArrowLeftIcon`, `BackIcon`, `MenuIcon`
- **Status**: `CheckCircleIcon`, `ErrorCircleIcon`, `WarningIcon`, `InfoIcon`
- **UI**: `CloseIcon`, `SearchIcon`, `SettingsIcon`, `UserIcon`, `UsersIcon`
- **Communication**: `SendIcon`, `ChatIcon`, `BellIcon`, `CommentIcon`

---

## Accessibility Requirements

### Focus States

```css
/* ✅ CORRECT - Use focus token */
.interactive:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

/* ❌ WRONG - Don't remove focus styles */
.interactive:focus {
  outline: none;  /* Never do this! */
}
```

### ARIA Labels

```tsx
// ✅ CORRECT - Provide labels for icon-only buttons
<IconButton icon={<CloseIcon />} aria-label="Close dialog" />
<IconButton icon={<SendIcon />} aria-label="Send message" />

// ✅ CORRECT - Label inputs
<Input placeholder="Search..." aria-label="Search items" />
```

### Semantic HTML

```tsx
// ✅ CORRECT - Use semantic elements
<header className={styles.header}>...</header>
<main className={styles.content}>...</main>
<nav className={styles.navigation}>...</nav>

// ❌ WRONG - Don't use divs for everything
<div className={styles.header}>...</div>
```

---

## CSS Module Guidelines

### File Structure

```
ComponentName/
├── ComponentName.stories.tsx   # Storybook story
└── ComponentName.module.css    # Styles
```

### CSS Structure

```css
/* component-name.module.css */

/* ============================================
   SECTION NAME
   ============================================ */
.container {
  /* Layout properties first */
  display: flex;
  flex-direction: column;

  /* Then spacing using tokens */
  padding: var(--space-4);
  gap: var(--space-3);

  /* Then visual properties using tokens */
  background: var(--soft-bg);
  border: 1px solid var(--soft-border);
  border-radius: var(--radius-lg);
}

/* Interactive states */
.interactive {
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-default);
}

.interactive:hover {
  background: var(--soft-bg-hover);
}
```

### Don'ts

```css
/* ❌ DON'T hardcode colors */
.button { background: #3b82f6; color: white; }

/* ❌ DON'T hardcode spacing */
.card { padding: 16px; margin: 8px; }

/* ❌ DON'T hardcode shadows with rgba */
.elevated { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }

/* ❌ DON'T use undefined tokens */
.broken { background: var(--surface-bg); }  /* 'surface-bg' doesn't exist! */

/* ❌ DON'T mix color groups */
.broken { background: var(--soft-bg); color: var(--base-fg); }
```

---

## Component Gap Analysis

**When you need functionality that doesn't exist, STOP and document it.**

### Before Creating Custom Components

1. **Check existing components** - Review the full component list above
2. **Check if it's a variant** - Maybe an existing component supports what you need
3. **Document the gap** - Add a comment in your story file

### Gap Documentation Format

Add this to the top of your story file:

```tsx
/**
 * # Component Name
 *
 * Description of what this mock demonstrates.
 *
 * ## Component Gap Analysis
 *
 * Components that would improve this implementation:
 *
 * 1. **ComponentName** - Brief description of what it would do
 * 2. **AnotherComponent** - Brief description
 */
```

### Example Gap Analysis

```tsx
/**
 * ## Component Gap Analysis
 *
 * 1. **ChatInput** - Specialized input for chat interfaces with
 *    send button, voice input, and file attachment integration
 *
 * 2. **EmptyState** - Standardized empty state with icon,
 *    title, description, and optional action
 *
 * 3. **PresenceIndicator** - Online/offline status dot with
 *    optional pulse animation for "active" state
 *
 * 4. **SuggestionGroup** - Horizontally scrollable group of
 *    suggestion chips with overflow handling
 */
```

---

## Checklist Before Submitting

- [ ] All UI components use `@ui-kit/react` where available
- [ ] All icons use `@ui-kit/icons` (no inline SVGs)
- [ ] All colors use design tokens (no hardcoded hex/rgba)
- [ ] All spacing uses `--space-*` tokens
- [ ] All typography uses `--text-*`, `--weight-*`, `--leading-*` tokens
- [ ] Color tokens stay within their group (don't mix `--soft-fg` with `--base-bg`)
- [ ] Interactive elements have proper focus styles
- [ ] Icon buttons have `aria-label` attributes
- [ ] Component gaps are documented at the top of the story file
- [ ] CSS is organized with clear section comments

---

## Quick Reference

### Most Common Mistakes

| Mistake | Fix |
|---------|-----|
| `<div className={styles.button}>` | `<Button variant="default">` |
| `variant="secondary"` on Chip | `variant="default"` or `variant="info"` |
| Inline SVG icons | Import from `@ui-kit/icons` |
| `padding: 16px` | `padding: var(--space-4)` |
| `color: #666` | `color: var(--soft-fg-soft)` |
| `rgba(0,0,0,0.1)` | Use shadow tokens or `var(--soft-border)` |
| Missing `aria-label` on IconButton | Add `aria-label="Action description"` |

### Token Quick Reference

```css
/* Backgrounds */
--base-bg        /* Page background */
--soft-bg        /* Cards, panels */
--softer-bg      /* Input fields */
--primary-bg     /* Primary buttons */

/* Text */
--{group}-fg           /* Primary text */
--{group}-fg-soft      /* Secondary text */
--{group}-fg-softer    /* Tertiary text */

/* Borders */
--{group}-border       /* Default border */
--{group}-border-hover /* Hover state */

/* Spacing */
--space-2  /* 8px */
--space-3  /* 12px */
--space-4  /* 16px */
--space-6  /* 24px */

/* Radius */
--radius-md   /* 4px - buttons, inputs */
--radius-lg   /* 8px - cards */
--radius-full /* pill shapes */
```
