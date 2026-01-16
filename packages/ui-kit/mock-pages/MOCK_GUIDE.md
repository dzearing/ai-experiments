# Mock Page Development Guide

This guide ensures consistent, accessible, and themable mock pages that properly leverage the `@ui-kit/react` component library and design token system.

---

## ⛔ CRITICAL: Color Group Rules (Read This First!)

**The #1 cause of broken mocks is mixing color groups.** This section is mandatory reading.

### The Golden Rule

> **If you use a background from a color group, ALL foreground/text colors in that element MUST come from the SAME group.**

This is because contrast is only guaranteed within a group. Mixing groups can result in unreadable text.

### How Color Groups Work

Each group has a complete set of tokens that are designed to work together:

```
--{group}-bg          ← Background
--{group}-bg-hover    ← Background on hover
--{group}-fg          ← Primary text (guaranteed contrast with bg)
--{group}-fg-soft     ← Secondary text (guaranteed contrast with bg)
--{group}-fg-softer   ← Tertiary text (guaranteed contrast with bg)
--{group}-border      ← Border color
```

### ✅ CORRECT Examples

```css
/* soft background → soft foreground colors */
.header {
  background: var(--soft-bg);
  color: var(--soft-fg);           /* ✅ Same group */
  border: 1px solid var(--soft-border);  /* ✅ Same group */
}

.headerSubtext {
  color: var(--soft-fg-soft);      /* ✅ Same group */
}

/* softer background → softer foreground colors */
.inputArea {
  background: var(--softer-bg);
  color: var(--softer-fg);         /* ✅ Same group */
}

/* primary background → primary foreground colors */
.selectedItem {
  background: var(--primary-bg);
  color: var(--primary-fg);        /* ✅ Same group */
}

/* warning background → warning foreground colors */
.warningBanner {
  background: var(--warning-bg);
  color: var(--warning-fg);        /* ✅ Same group */
}
```

### ❌ WRONG Examples (These WILL break)

```css
/* ❌ WRONG: soft background with base foreground */
.broken1 {
  background: var(--soft-bg);
  color: var(--base-fg);           /* ❌ VIOLATION! */
}

/* ❌ WRONG: softer background with base foreground */
.broken2 {
  background: var(--softer-bg);
  color: var(--base-fg-soft);      /* ❌ VIOLATION! */
}

/* ❌ WRONG: primary background with soft foreground */
.broken3 {
  background: var(--primary-bg);
  color: var(--soft-fg);           /* ❌ VIOLATION! */
}

/* ❌ WRONG: soft background with base border */
.broken4 {
  background: var(--softer-bg);
  border: 1px solid var(--base-border);  /* ❌ VIOLATION! */
}
```

### Semantic Foreground Colors (Accent Colors on Surfaces)

When you need an accent color (like a success or error indicator) on a colored surface, use the semantic foreground tokens:

```css
/* On a softer-bg surface, use softer-fg-* variants for accents */
.toolCallOnSofterBg {
  background: var(--softer-bg);
  color: var(--softer-fg);
}

.toolCallOnSofterBg .successIcon {
  color: var(--softer-fg-success);   /* ✅ Semantic color for softer surface */
}

.toolCallOnSofterBg .errorIcon {
  color: var(--softer-fg-danger);    /* ✅ Semantic color for softer surface */
}

/* On a soft-bg surface, use soft-fg-* variants for accents */
.tabOnSoftBg {
  background: var(--soft-bg);
}

.tabOnSoftBg.active {
  color: var(--soft-fg-primary);     /* ✅ Primary accent on soft surface */
}
```

### ⚠️ Watch Out: Nested Components Override Colors!

Components like `<Text>` have their own color styling. If you place them inside a colored surface, they may NOT inherit the parent's color:

```tsx
// ❌ WRONG: Text component has its own color, ignores parent
<div className={styles.primaryBubble}>  {/* background: var(--primary-bg) */}
  <Text>{message}</Text>                 {/* Text uses --base-fg internally! */}
</div>

// ✅ CORRECT: Use plain text to inherit color
<div className={styles.primaryBubble}>  {/* background: var(--primary-bg); color: var(--primary-fg) */}
  {message}                              {/* Inherits --primary-fg from parent */}
</div>

// ✅ ALSO CORRECT: Override Text color explicitly
<div className={styles.primaryBubble}>
  <Text color="inherit">{message}</Text> {/* Inherits from parent */}
</div>
```

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

// Pill shape for suggestion chips
<Button variant="default" size="sm" shape="pill">Suggestion</Button>
```

### Button Icons

**ALWAYS use `icon` or `iconAfter` props for icons in buttons.**

The Button component wraps children in a `.label` span that has `flex: 1`. Placing icons inline as children causes misalignment.

```tsx
// ✅ CORRECT - Use icon props
import { SaveIcon } from '@ui-kit/icons/SaveIcon';
import { ArrowRightIcon } from '@ui-kit/icons/ArrowRightIcon';

<Button variant="primary" icon={<SaveIcon />}>Save</Button>          // Icon before
<Button variant="primary" iconAfter={<ArrowRightIcon />}>Next</Button>  // Icon after

// ❌ WRONG - Never place icons inline as children
<Button variant="primary">Save <SaveIcon /></Button>     // Misaligned!
<Button variant="primary"><SaveIcon /> Save</Button>     // Misaligned!
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

**⚠️ Important: Text renders as inline `<span>`**

The `<Text>` component renders as a `<span>` (inline element). Multiple `<Text>` components placed next to each other will flow horizontally, not stack vertically.

```tsx
// ❌ WRONG - Text components flow inline, not stacked
<div>
  <Text>Name</Text>
  <Text>Status</Text>  {/* Renders: "NameStatus" on same line! */}
</div>

// ✅ CORRECT - Use Stack for vertical arrangement
<Stack direction="vertical" gap="xs">
  <Text>Name</Text>
  <Text>Status</Text>  {/* Renders on separate lines */}
</Stack>
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

> ⛔ **See the "CRITICAL: Color Group Rules" section at the top of this document for comprehensive guidance.**

In short: **Pick a color group for your background, use ONLY that group's tokens for foreground/border.**

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

## Surface Classes vs Tokens

**This is a critical distinction for building accessible, themeable UIs.**

### When to Use What

| Use Case | Solution |
|----------|----------|
| **Composite areas** (cards, panels, dialogs, sections) | Surface classes |
| **Atomic elements** (buttons, text, individual borders) | Tokens directly |

### Why Surface Classes?

Surface classes solve a critical problem: **ensuring all nested components remain readable when placed on different backgrounds.**

Every `.surface` element:
1. **Resets ALL tokens** to appropriate values for that surface
2. **Prevents compounding** - nested surfaces don't inherit broken colors
3. **Works with theming** - components inside surfaces automatically adapt

### Available Surface Classes

Import from `@ui-kit/core/surfaces.css` or use inline:

**Tonal Surfaces:**
```html
<div class="surface base">Page default</div>
<div class="surface raised">Cards, panels, dialogs</div>
<div class="surface sunken">Input wells, sidebars, recessed areas</div>
<div class="surface section">Command areas, region separation</div>
<div class="surface inverted">Tooltips (opposite color scheme)</div>
<div class="surface primary">Teaching bubbles, branded sections</div>
```

**Feedback Surfaces:**
```html
<div class="surface success">Success toasts, confirmations</div>
<div class="surface warning">Warning messages</div>
<div class="surface danger">Error toasts, alerts</div>
<div class="surface info">Info notifications</div>
```

### ✅ CORRECT - Use Surface Classes for Composite Areas

```tsx
// Card that needs a different background
<div className="surface raised">
  <Heading>Card Title</Heading>
  <Text>All nested components automatically get correct colors</Text>
  <Button>Action</Button>  {/* Works correctly */}
</div>

// Success notification
<div className="surface success">
  <CheckCircleIcon />  {/* Icon color is correct */}
  <Text>Operation completed</Text>  {/* Text color is correct */}
</div>

// Nested surfaces reset properly
<div className="surface sunken">
  <p>Recessed area</p>
  <div className="surface raised">
    <p>Card inside - tokens reset, no compounding issues</p>
  </div>
</div>
```

### ❌ WRONG - Using Tokens for Composite Areas

```css
/* Don't manually set all the tokens for a card - use surface class instead */
.myCard {
  background: var(--soft-bg);
  color: var(--soft-fg);
  /* Now you have to manually handle EVERY nested element's colors */
  /* And nested components may not respect these overrides */
}
```

### When Tokens ARE Appropriate

Use tokens directly for **atomic styling** within a surface:

```css
/* Text hierarchy within the current surface */
.heading {
  color: var(--base-fg-strong);
}

.secondary {
  color: var(--base-fg-soft);
}

/* A single element's hover state */
.link:hover {
  color: var(--base-fg-primary);
}

/* Border on a specific element */
.divider {
  border-top: 1px solid var(--base-border);
}
```

### Summary

| Area Type | Example | Solution |
|-----------|---------|----------|
| **Card/Panel** | Chat bubble, notification, modal | `<div class="surface raised">` |
| **Feedback area** | Success message, error alert | `<div class="surface success">` |
| **Recessed area** | Input container, sidebar | `<div class="surface sunken">` |
| **Text color** | Secondary label | `color: var(--base-fg-soft)` |
| **Single border** | Divider line | `border: 1px solid var(--base-border)` |
| **Button** | Use component | `<Button variant="primary">` |

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
    <Text size="sm" color="soft">
      Supporting description text goes here.
    </Text>
    <div className={styles.cardFooter}>
      <Text size="sm" color="soft">Updated 2h ago</Text>
    </div>
  </Stack>
</Card>
```

### Header with Actions

```tsx
<header className={styles.header}>
  <div className={styles.headerLeft}>
    <Heading level={1} size={4}>Page Title</Heading>
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
  <Heading level={2} size={3}>No Items Yet</Heading>
  <Text color="soft" className={styles.emptyDescription}>
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
  <IconButton variant="default" icon={<MicIcon />} aria-label="Voice input" />
</div>
```

### User/Contact List Item

**This is a critical pattern.** The `<Text>` component renders inline (as a `<span>`). When you need to stack text vertically (name + status, title + subtitle, etc.), you MUST use `<Stack direction="vertical">`.

```tsx
// ✅ CORRECT - Use Stack for vertically stacked text
<div className={styles.listItem}>
  <Avatar fallback={user.name} size="sm" />
  <Stack direction="vertical" gap="none">
    <Text size="sm" weight="medium">{user.name}</Text>
    <Text size="xs" color="soft">{user.status}</Text>
  </Stack>
  {user.online && <div className={styles.onlineIndicator} />}
</div>

// ❌ WRONG - Plain div won't stack inline Text components
<div className={styles.listItem}>
  <Avatar fallback={user.name} size="sm" />
  <div>  {/* Text elements flow inline! */}
    <Text size="sm" weight="medium">{user.name}</Text>
    <Text size="xs" color="soft">{user.status}</Text>
  </div>
</div>
```

**CSS for list item:**
```css
.listItem {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
}

.onlineIndicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--success-fg);
}
```

**Key rule:** Whenever you have multiple `<Text>` components that should stack vertically, wrap them in `<Stack direction="vertical">`.

### Selectable Cards

**Use `strong` surface for default state and `primary` surface for selected state.**

This ensures:
- Proper visual hierarchy (elevated, interactive appearance)
- Correct hover states that don't conflict with selection
- Nested components (Text, etc.) inherit correct foreground colors

```css
/* ✅ CORRECT - Strong surface (default), Primary surface (selected) */
.selectableCard {
  background: var(--strong-bg);
  color: var(--strong-fg);
  border: 2px solid var(--strong-border);
  cursor: pointer;
}

.selectableCard:hover {
  background: var(--strong-bg-hover);
  border-color: var(--strong-border-hover);
}

.selectableCardSelected {
  background: var(--primary-bg);
  color: var(--primary-fg);
  border-color: var(--primary-border);
}

.selectableCardSelected:hover {
  background: var(--primary-bg-hover);
  border-color: var(--primary-border-hover);
}

/* ❌ WRONG - softer surface for selectable items */
.broken {
  background: var(--softer-bg);  /* Too recessed for interactive items */
}

/* ❌ WRONG - mixing surfaces on hover */
.broken:hover {
  background: var(--soft-bg);  /* Different surface = inconsistent hover */
}

/* ❌ WRONG - using disabled tokens for selection */
.brokenSelected {
  background: var(--primary-bg-disabled);  /* Disabled != selected! */
}
```

**Why not `soft` or `softer`?**
- `softer` is for recessed/input areas, not interactive cards
- `soft` is for passive containers, not clickable elements
- `strong` signals "this is elevated and clickable"
- `primary` signals "this is the active/selected choice"

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
- **Status**: `CheckCircleIcon`, `ErrorCircleIcon`, `WarningIcon`, `WarningTriangleIcon`, `InfoIcon`
- **UI**: `CloseIcon`, `SearchIcon`, `GearIcon`, `UserIcon`, `UsersIcon`
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

### ⛔ CRITICAL (Will Break If Wrong)
- [ ] **Color groups are NOT mixed** - Every element's bg/fg/border tokens come from the SAME group
- [ ] **No `<Text>` inside colored surfaces** - Use plain text or `color="inherit"` on non-base backgrounds

### Required
- [ ] All UI components use `@ui-kit/react` where available
- [ ] All icons use `@ui-kit/icons` (no inline SVGs)
- [ ] All colors use design tokens (no hardcoded hex/rgba)
- [ ] All spacing uses `--space-*` tokens
- [ ] All typography uses `--text-*`, `--weight-*`, `--leading-*` tokens
- [ ] Interactive elements have proper focus styles
- [ ] Icon buttons have `aria-label` attributes
- [ ] Component gaps are documented at the top of the story file
- [ ] CSS is organized with clear section comments

---

## Quick Reference

### Most Common Mistakes

| Mistake | Fix |
|---------|-----|
| **`--soft-bg` with `--base-fg`** | **Use `--soft-fg` (same group!)** |
| **`--softer-bg` with `--base-border`** | **Use `--softer-border` (same group!)** |
| **`<Text>` inside primary-bg div** | **Use plain text or `color="inherit"`** |
| **Multiple `<Text>` in plain `<div>`** | **Wrap in `<Stack direction="vertical">`** |
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
