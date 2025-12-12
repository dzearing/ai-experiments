# Design Token Cheatsheet

Quick reference for UI Kit design tokens. For complete documentation, see `/packages/ui-kit/core/TOKEN_GUIDE.md`.

## Token Naming Pattern

```
--[role]-[property][-modifier]
```

Examples:
- `--page-bg` → Page background
- `--card-text-soft` → Secondary text on cards
- `--controlPrimary-bg-hover` → Primary button hover state

---

## The Golden Rule: Always Pair Background + Text from the Same Role

**To ensure accessible contrast, always use matching `-bg` and `-text` tokens from the same role:**

```css
/* ✅ CORRECT - tokens from same role guarantee contrast */
.primary-button {
  background: var(--controlPrimary-bg);
  color: var(--controlPrimary-text);
}

.card {
  background: var(--card-bg);
  color: var(--card-text);
}

.input {
  background: var(--inset-bg);
  color: var(--inset-text);
}

/* ❌ WRONG - mixing roles breaks contrast guarantees */
.broken {
  background: var(--controlPrimary-bg);
  color: var(--page-text);  /* May not be readable! */
}
```

**Role families and their tokens:**

| Role | Background | Text | Text (soft) | Border |
|------|------------|------|-------------|--------|
| `page` | `--page-bg` | `--page-text` | `--page-text-soft` | `--page-border` |
| `card` | `--card-bg` | `--card-text` | `--card-text-soft` | `--card-border` |
| `inset` | `--inset-bg` | `--inset-text` | `--inset-text-soft` | `--inset-border` |
| `overlay` | `--overlay-bg` | `--overlay-text` | `--overlay-text-soft` | `--overlay-border` |
| `popout` | `--popout-bg` | `--popout-text` | `--popout-text-soft` | `--popout-border` |
| `control` | `--control-bg` | `--control-text` | — | `--control-border` |
| `controlPrimary` | `--controlPrimary-bg` | `--controlPrimary-text` | — | `--controlPrimary-border` |
| `controlDanger` | `--controlDanger-bg` | `--controlDanger-text` | — | `--controlDanger-border` |
| `controlSubtle` | `--controlSubtle-bg` | `--controlSubtle-text` | — | — |
| `success` | `--success-bg` | `--success-text` | — | `--success-border` |
| `warning` | `--warning-bg` | `--warning-text` | — | `--warning-border` |
| `danger` | `--danger-bg` | `--danger-text` | — | `--danger-border` |
| `info` | `--info-bg` | `--info-text` | — | `--info-border` |

---

## Quick Reference Table

| I want to style... | Use these tokens |
|--------------------|------------------|
| Page background | `--page-bg` |
| Card/panel background | `--card-bg` |
| Input field background | `--inset-bg` |
| Primary button | `--controlPrimary-bg`, `--controlPrimary-text` |
| Secondary button | `--control-bg`, `--control-text` |
| Ghost/subtle button | `--controlSubtle-bg`, `--controlSubtle-text` |
| Danger button | `--controlDanger-bg`, `--controlDanger-text` |
| Disabled control | `--controlDisabled-bg`, `--controlDisabled-text` |
| Primary text | `--page-text` or `--card-text` |
| Secondary text | `--page-text-soft` or `--card-text-soft` |
| Tertiary text | `--page-text-softer` or `--card-text-softer` |
| Borders | `--page-border`, `--card-border`, `--control-border` |
| Focus ring | `--focus-ring`, `--focus-ring-width` |

---

## Container Tokens (Static Backgrounds)

### Page (Main App Background)
```css
--page-bg              /* Main background */
--page-text            /* Primary text */
--page-text-soft       /* Secondary text (30% less contrast) */
--page-text-softer     /* Tertiary text (50% less contrast) */
--page-text-hard       /* Maximum contrast (pure black/white) */
--page-border          /* Border color */
```

### Card (Elevated Containers)
```css
--card-bg              /* Card background */
--card-text            /* Primary text */
--card-text-soft       /* Secondary text */
--card-text-hard       /* Maximum contrast */
--card-border          /* Border color */
--card-shadow          /* Box shadow */
```

### Inset (Input Fields, Wells)
```css
--inset-bg             /* Background */
--inset-bg-hover       /* Hover background */
--inset-bg-focus       /* Focus background */
--inset-text           /* Text color */
--inset-text-soft      /* Placeholder text */
--inset-border         /* Border */
--inset-border-focus   /* Focus border (matches --focus-ring) */
```

### Overlay (Modals, Dialogs)
```css
--overlay-bg           /* Modal background */
--overlay-text         /* Text color */
--overlay-text-soft    /* Secondary text */
--overlay-border       /* Border */
--overlay-shadow       /* Drop shadow */
```

### Popout (Dropdowns, Menus, Tooltips)
```css
--popout-bg            /* Menu background */
--popout-text          /* Text color */
--popout-text-soft     /* Secondary text */
--popout-border        /* Border */
--popout-shadow        /* Drop shadow */
```

---

## Control Tokens (Interactive Elements)

### Control (Default Buttons)
```css
--control-bg           /* Background */
--control-bg-hover     /* Hover */
--control-bg-pressed   /* Active/pressed */
--control-text         /* Text */
--control-border       /* Border */
```

### Control Primary (CTA Buttons)
```css
--controlPrimary-bg           /* Background (brand color) */
--controlPrimary-bg-hover     /* Hover */
--controlPrimary-bg-pressed   /* Active/pressed */
--controlPrimary-text         /* Text (auto-contrasts) */
--controlPrimary-border       /* Border */
```

### Control Danger (Destructive Actions)
```css
--controlDanger-bg            /* Background (red) */
--controlDanger-bg-hover      /* Hover */
--controlDanger-bg-pressed    /* Active/pressed */
--controlDanger-text          /* Text */
--controlDanger-border        /* Border */
```

### Control Subtle (Ghost/Minimal Buttons)
```css
--controlSubtle-bg            /* Background (transparent) */
--controlSubtle-bg-hover      /* Hover */
--controlSubtle-bg-pressed    /* Active/pressed */
--controlSubtle-text          /* Text */
--controlSubtle-text-hover    /* Hover text */
```

### Control Disabled
```css
--controlDisabled-bg          /* Background */
--controlDisabled-text        /* Text */
--controlDisabled-border      /* Border */
```

---

## Feedback Tokens (Status Colors)

Semantic colors that stay consistent across all themes.

### Success (Green)
```css
--success-bg           /* Alert background */
--success-text         /* Text */
--success-border       /* Border */
--success-icon         /* Icon color (#16a34a) */
```

### Warning (Amber)
```css
--warning-bg           /* Alert background */
--warning-text         /* Text */
--warning-border       /* Border */
--warning-icon         /* Icon color (#f59e0b) */
```

### Danger (Red)
```css
--danger-bg            /* Alert background */
--danger-text          /* Text */
--danger-border        /* Border */
--danger-icon          /* Icon color (#dc2626) */
```

### Info (Blue)
```css
--info-bg              /* Alert background */
--info-text            /* Text */
--info-border          /* Border */
--info-icon            /* Icon color (#0ea5e9) */
```

---

## Special Tokens

### Focus Ring
```css
--focus-ring           /* Ring color (brand color) */
--focus-ring-width     /* Ring thickness (2px) */
--focus-ring-offset    /* Gap between element and ring (2px) */
```

### Links
```css
--link                 /* Default link color */
--link-hover           /* Hover */
--link-pressed         /* Active */
--link-visited         /* Visited */
```

### Selection
```css
--selection-bg         /* Text selection background */
--selection-text       /* Selected text color */
```

### Scrollbar
```css
--scrollbar-track      /* Track background */
--scrollbar-thumb      /* Thumb color */
--scrollbar-thumb-hover /* Thumb hover */
```

### Skeleton Loading
```css
--skeleton-bg          /* Skeleton background */
--skeleton-shimmer     /* Shimmer highlight */
```

### Highlight
```css
--highlight-bg         /* Search highlight background */
--highlight-text       /* Highlighted text color */
```

---

## Spacing Tokens

Based on a 4px grid system.

```css
--space-1              /* 4px */
--space-2              /* 8px */
--space-3              /* 12px */
--space-4              /* 16px (base unit) */
--space-5              /* 20px */
--space-6              /* 24px */
--space-8              /* 32px */
--space-10             /* 40px */
--space-12             /* 48px */
--space-16             /* 64px */
--space-20             /* 80px */
--space-24             /* 96px */
```

---

## Typography Tokens

### Font Families
```css
--font-sans            /* System sans-serif stack */
--font-mono            /* Monospace stack */
--font-serif           /* Serif stack */
```

### Font Sizes
```css
--text-xs              /* 11px - Fine print */
--text-sm              /* 13px - Small text, captions */
--text-base            /* 15px - Body text (default) */
--text-lg              /* 17px - Large body */
--text-xl              /* 20px - Subheadings */
--text-2xl             /* 24px - Section headings */
--text-3xl             /* 30px - Page headings */
--text-4xl             /* 36px - Large headings */
```

### Font Weights
```css
--weight-normal        /* 400 */
--weight-medium        /* 500 */
--weight-semibold      /* 600 */
--weight-bold          /* 700 */
```

### Line Heights
```css
--leading-tight        /* 1.25 */
--leading-normal       /* 1.5 (default) */
--leading-loose        /* 1.75 */
```

---

## Border Radius Tokens

```css
--radius-sm            /* 2px */
--radius-md            /* 4px (default for buttons) */
--radius-lg            /* 8px (default for cards) */
--radius-xl            /* 12px */
--radius-2xl           /* 16px */
--radius-full          /* 9999px (pill/circle) */
```

---

## Shadow Tokens

```css
--shadow-sm            /* Subtle shadow */
--shadow-md            /* Default card shadow */
--shadow-lg            /* Elevated elements */
--shadow-xl            /* Modals, overlays */
--shadow-inner         /* Inset shadow */
```

---

## Animation Tokens

### Durations
```css
--duration-fast        /* 100ms - Micro-interactions */
--duration-normal      /* 200ms - Default (buttons, inputs) */
--duration-slow        /* 300ms - Larger elements */
```

### Easing Functions
```css
--ease-default         /* ease-out - General purpose */
--ease-in              /* ease-in - Enter animations */
--ease-out             /* ease-out - Exit animations */
--ease-in-out          /* ease-in-out - Continuous */
--ease-bounce          /* Playful bounce effect */
```

---

## Component Tokens

Pre-configured shortcuts for common patterns.

```css
--button-padding-x     /* var(--space-4) */
--button-padding-y     /* var(--space-2) */
--button-radius        /* var(--radius-md) */
--input-height         /* 40px */
--input-padding-x      /* var(--space-3) */
--card-padding         /* var(--space-4) */
--modal-padding        /* var(--space-6) */
--avatar-size-sm       /* 24px */
--avatar-size-md       /* 32px */
--avatar-size-lg       /* 48px */
```

---

## Common Patterns

### Primary Button
```css
.button-primary {
  background: var(--controlPrimary-bg);
  color: var(--controlPrimary-text);
  border: 1px solid var(--controlPrimary-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4);
  font-weight: var(--weight-medium);
  transition: background var(--duration-fast) var(--ease-default);
}

.button-primary:hover:not(:disabled) {
  background: var(--controlPrimary-bg-hover);
}

.button-primary:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.button-primary:disabled {
  background: var(--controlDisabled-bg);
  color: var(--controlDisabled-text);
  cursor: not-allowed;
}
```

### Input Field
```css
.input {
  background: var(--inset-bg);
  color: var(--inset-text);
  border: 1px solid var(--inset-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  transition: all var(--duration-fast) var(--ease-default);
}

.input::placeholder {
  color: var(--inset-text-soft);
}

.input:hover:not(:disabled) {
  background: var(--inset-bg-hover);
}

.input:focus {
  background: var(--inset-bg-focus);
  border-color: var(--focus-ring);
  box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring);
  outline: none;
}
```

### Card
```css
.card {
  background: var(--card-bg);
  color: var(--card-text);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-md);
}
```

### Text Hierarchy
```css
.heading {
  color: var(--page-text);
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
}

.body {
  color: var(--page-text);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
}

.secondary {
  color: var(--page-text-soft);
  font-size: var(--text-sm);
}

.caption {
  color: var(--page-text-softer);
  font-size: var(--text-xs);
}
```

### Alert/Banner
```css
.alert-danger {
  background: var(--danger-bg);
  color: var(--danger-text);
  border: 1px solid var(--danger-border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
}

.alert-danger .icon {
  color: var(--danger-icon);
}
```

---

## Surface Classes

Pre-built CSS classes that apply background, text, border, and shadow from a role. Useful for containers and feedback states:

```css
/* Container surfaces */
.surface-page          /* Page background & text */
.surface-card          /* Card with shadow */
.surface-overlay       /* Modal layer */
.surface-popout        /* Dropdown/menu */
.surface-inset         /* Input/well */

/* Feedback surfaces (commonly used for alerts/banners) */
.surface-success       /* Success alert */
.surface-warning       /* Warning alert */
.surface-danger        /* Danger alert */
.surface-info          /* Info alert */
```

**Note:** For interactive controls (buttons), use the tokens directly rather than surface classes. This gives you proper hover/pressed states:

```css
/* ✅ Use tokens for buttons */
.my-button {
  background: var(--controlPrimary-bg);
  color: var(--controlPrimary-text);
}
.my-button:hover {
  background: var(--controlPrimary-bg-hover);
}
```

---

## Don'ts

### Never mix tokens from different roles
```css
/* BAD - mixing roles can break contrast */
.button {
  background: var(--controlPrimary-bg);
  color: var(--card-text);  /* Wrong! Use --controlPrimary-text */
}

/* GOOD - same role guarantees contrast */
.button {
  background: var(--controlPrimary-bg);
  color: var(--controlPrimary-text);
}
```

### Never hardcode colors
```css
/* BAD */
.button { background: #3b82f6; color: white; }

/* GOOD */
.button { background: var(--controlPrimary-bg); color: var(--controlPrimary-text); }
```

### Never hardcode spacing
```css
/* BAD */
.card { padding: 16px; margin-bottom: 24px; }

/* GOOD */
.card { padding: var(--space-4); margin-bottom: var(--space-6); }
```

### Never remove focus styles
```css
/* BAD */
.button:focus { outline: none; }

/* GOOD */
.button:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}
```

### Always respect reduced motion
```css
.animated {
  transition: transform var(--duration-normal) var(--ease-default);
}

@media (prefers-reduced-motion: reduce) {
  .animated { transition: none; }
}
```

---

## Accessibility

The token system automatically ensures WCAG contrast ratios:

| Content Type | AA (Default) | AAA (High Contrast) |
|--------------|--------------|---------------------|
| Normal text  | 4.5:1        | 7:1                 |
| Large text   | 3:1          | 4.5:1               |
| UI components| 3:1          | 4.5:1               |

Use proper tokens and contrast is guaranteed.

---

## Resources

- **Complete Token Guide**: `/packages/ui-kit/core/TOKEN_GUIDE.md`
- **Theme Definition Guide**: `/packages/ui-kit/core/src/themes/theme-definition.md`
- **Schema Reference**: `/packages/ui-kit/core/src/themes/schema/schema-definition.md`
- **Icons Cheatsheet**: `/docs/guides/ICONS_CHEATSHEET.md`
