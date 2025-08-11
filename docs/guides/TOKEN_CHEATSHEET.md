# Design Token Cheatsheet

Quick reference for design tokens in Claude Flow. For complete documentation, see `/packages/ui-kit/README.md`.

## 🎨 Color Tokens (Surface-Based System)

### Token Pattern: `--color-[surface]-[concept]-[state]`

#### Common Surface Colors

**Important:** Surface names map directly to component types:
- `primary` surface = Primary buttons, checkboxes, switches
- `neutral` surface = Secondary buttons, default states
- `danger` surface = Destructive buttons/actions
- `success` surface = Success buttons/states
- `warning` surface = Warning buttons/actions (caution state)
- `*Soft` surfaces = Banner/alert backgrounds (e.g., `successSoft`, `dangerSoft`, `warningSoft`)

Note: the `surface` component defines the background color group - the `concept` defines things within that group which will work together in that `state`. We can guarantee that the body text will work on the body background. However you must NOT mix and match surfaces - you should not use primary background with body text. Mixing different values from different surfaces risks creating contrast issues.


```css
/* Text Colors */
--color-body-text                  /* Primary text color */
--color-body-textSoft10            /* 10% less contrast (secondary text) */
--color-body-textSoft20            /* 20% less contrast (tertiary text) */
--color-body-link                  /* Link color */
--color-body-link-hover            /* Link hover state */

/* Semantic Text Colors (guaranteed contrast) */
--color-body-textSuccess           /* Success text (green) */
--color-body-textWarning           /* Warning text (yellow/amber) */
--color-body-textDanger            /* Error/danger text (red) */

/* Backgrounds */
--color-body-background            /* Main background */
--color-panel-background           /* Card/panel background */

/* Icons */
--color-body-icon                  /* Default icon color */
--color-body-iconSoft20            /* Softer icon variant */
--color-primary-icon               /* Icon on primary surface */
--color-neutral-icon               /* Icon on neutral surface */

/* Borders */
--color-body-border                /* Default border */
--color-body-borderSoft10          /* Subtle border */
--color-panel-border               /* Panel border */
--color-input-border               /* Input field border */
--color-input-border-focus         /* Focused input border */

/* Component Surfaces */
--color-primary-background         /* Primary button background */
--color-primary-text               /* Primary button text */
--color-primary-border             /* Primary button border */
--color-primary-background-hover   /* Primary hover state */
--color-neutral-background         /* Secondary button/default */
--color-neutral-text               /* Secondary button text */
--color-danger-background          /* Destructive actions */
--color-danger-text                /* Destructive button text */
--color-success-background         /* Success actions */
--color-success-text               /* Success button text */
--color-warning-background         /* Warning/caution actions */
--color-warning-text               /* Warning button text */
--color-warning-border             /* Warning button border */
--color-warning-background-hover   /* Warning hover state */

/* States & Feedback (Soft Surfaces) */
--color-successSoft-background     /* Success message background */
--color-successSoft-text           /* Success message text */
--color-successSoft-border         /* Success message border */
--color-dangerSoft-background      /* Error background */
--color-dangerSoft-text            /* Error text */
--color-dangerSoft-border          /* Error border */
--color-warningSoft-background     /* Warning background */
--color-warningSoft-text           /* Warning text */
--color-warningSoft-border         /* Warning border */
--color-infoSoft-background        /* Info background */
--color-infoSoft-text              /* Info text */
--color-infoSoft-border            /* Info border */

/* Note: For error/warning/success text on regular surfaces, use:
   --color-[surface]-textDanger, textWarning, textSuccess */
```

## 🌈 Gradient Tokens

### Pattern: `--gradient-[surface]-[intent]`

Gradients provide subtle overlays that maintain accessibility with all surface foreground tokens.

```css
/* Body Surface Gradients */
--gradient-body-primary     /* Primary brand gradient (25% opacity) */
--gradient-body-success     /* Success state gradient (20% opacity) */
--gradient-body-warning     /* Warning state gradient (20% opacity) */
--gradient-body-danger      /* Error/danger gradient (20% opacity) */
--gradient-body-info        /* Informational gradient (20% opacity) */
--gradient-body-accent      /* Decorative dual-color gradient */

/* Usage Example */
.card-with-gradient {
  background: 
    var(--gradient-body-primary),
    var(--color-body-background);
  /* All body foreground tokens remain accessible */
}

/* Gradient Properties:
   - Direction: 135deg (consistent diagonal)
   - Opacity: 15-25% to maintain text readability
   - Fade: All gradients fade to transparent
   - Browser Support: Uses color-mix() for smooth transitions
*/
```

## 📏 Spacing Tokens

### Base unit: 4px grid system

```css
/* Common Spacing */
--spacing-small20    /* 4px */
--spacing-small10    /* 8px */
--spacing-small5     /* 12px */
--spacing            /* 16px - DEFAULT */
--spacing-large5     /* 20px */
--spacing-large10    /* 24px */
--spacing-large20    /* 32px */

/* Component Spacing */
--spacing-buttonX    /* Button horizontal padding (16px) */
--spacing-buttonY    /* Button vertical padding (8px) */
--spacing-card       /* Card padding (24px) */
--spacing-section    /* Section spacing (48px) */

/* Gaps (for flexbox/grid) */
--gap-small10        /* 8px */
--gap                /* 12px - DEFAULT */
--gap-large10        /* 20px */
```

## 🔤 Typography Tokens

```css
/* Font Sizes */
--font-size-smallest   /* 11px */
--font-size-small20    /* 12px */
--font-size-small10    /* 13px */
--font-size            /* 14px - DEFAULT */
--font-size-large10    /* 16px */
--font-size-large20    /* 18px */

/* Headings */
--font-size-h6         /* 16px */
--font-size-h5         /* 18px */
--font-size-h4         /* 20px */
--font-size-h3         /* 24px */
--font-size-h2         /* 32px */
--font-size-h1         /* 40px */

/* Font Weights */
--font-weight-normal   /* 400 */
--font-weight-medium   /* 500 */
--font-weight-semibold /* 600 */
--font-weight-bold     /* 700 */

/* Line Heights */
--line-height-tight    /* 1.2 */
--line-height          /* 1.5 - DEFAULT */
--line-height-relaxed  /* 1.75 */
```

## 🎭 Shadows

```css
/* Elevation Scale */
--shadow-soft10        /* Subtle shadow */
--shadow-soft20        /* Soft shadow */
--shadow               /* Default shadow */
--shadow-hard10        /* Medium shadow */
--shadow-hard20        /* Strong shadow */

/* Component Shadows */
--shadow-button        /* Button elevation */
--shadow-card          /* Card elevation */
--shadow-modal         /* Modal/dialog elevation */
--shadow-tooltip       /* Tooltip elevation */
--color-panel-shadow   /* Panel shadow (surface-specific) */
```

## 🔄 Border Radius

### Core Radius Values
```css
/* Base radius scale */
--radius-slight        /* 2px - Barely visible softening */
--radius-small         /* 4px - Light rounding */
--radius-medium        /* 8px - Standard rounding */
--radius-large         /* 12px - Prominent rounding */
--radius-xlarge        /* 16px - Extra large rounding */
--radius-round         /* 9999px - Pills and circles */
```

### Semantic Radius Tokens (Use These!)
```css
/* Purpose-based tokens - Use these in your components */
--radius-interactive   /* 4px - Buttons, inputs, selects, chips */
--radius-floating      /* 4px - Tooltips, popovers, context menus */
--radius-container     /* 8px - Cards, panels, list items */
--radius-modal         /* 12px - Dialogs, sheets, modals */
```

### Usage Guidelines

**When to use each semantic token:**

- **`--radius-interactive`**: Use for clickable/typeable controls
  - Buttons (primary, secondary, etc.)
  - Input fields and textareas
  - Dropdowns and selects
  - Chips and tags
  - Segmented controls

- **`--radius-floating`**: Use for elements that float over content
  - Tooltips
  - Popovers
  - Context menus
  - Dropdown menus

- **`--radius-container`**: Use for content containers
  - Cards
  - Panels
  - List items
  - Notification banners
  - Content sections

- **`--radius-modal`**: Use for major overlays
  - Modal dialogs
  - Sheets and drawers
  - Full-screen overlays
  - Toast notifications

- **`--radius-round`**: Use for circular/pill shapes (9999px)
  - Avatar images
  - Badge indicators
  - Switch toggles
  - Progress bars
  - Pill buttons
  - Status dots

**For sharp edges (no rounding):**
- Simply use `0` or omit the border-radius property
- Appropriate for code blocks, terminals, data tables
```

## 🎬 Animation

```css
/* Durations */
--duration-fastest     /* 100ms */
--duration-fast20      /* 150ms */
--duration-fast10      /* 200ms */
--duration-normal      /* 300ms */
--duration-slow10      /* 400ms */
--duration-slow20      /* 600ms */
--duration-slowest     /* 1000ms */

/* Easings */
--easing-default       /* cubic-bezier(0.4, 0, 0.2, 1) */
--easing-decelerate    /* cubic-bezier(0, 0, 0.2, 1) */
--easing-accelerate    /* cubic-bezier(0.4, 0, 1, 1) */
--easing-bounce        /* Custom bounce effect */
```

## 🎯 Common Usage Patterns

### Button Styling
```css
.button-primary {
  background: var(--color-primary-background);
  color: var(--color-primary-text);
  padding: var(--spacing-buttonY) var(--spacing-buttonX);
  border-radius: var(--radius-button);
  font-weight: var(--font-weight-medium);
  transition: all var(--duration-normal) var(--easing-default);
}

.button-primary:hover {
  background: var(--color-primary-background-hover);
}
```

### Card Component
```css
.card {
  background: var(--color-panel-background);
  border: 1px solid var(--color-panel-border);
  padding: var(--spacing-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}
```

### Text Hierarchy
```css
.heading {
  color: var(--color-body-text);
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}

.body-text {
  color: var(--color-body-text);
  font-size: var(--font-size);
  line-height: var(--line-height);
}

.secondary-text {
  color: var(--color-body-textSoft10);
  font-size: var(--font-size-small10);
}

.error-text {
  color: var(--color-body-textDanger);
  font-size: var(--font-size-small10);
}

.success-text {
  color: var(--color-body-textSuccess);
  font-weight: var(--font-weight-medium);
}
```

### Form Input
```css
.input {
  background: var(--color-input-background);
  border: 1px solid var(--color-input-border);
  color: var(--color-input-text);
  padding: var(--spacing-inputY) var(--spacing-inputX);
  border-radius: var(--radius-input);
  font-size: var(--font-size);
}

.input:focus {
  background: var(--color-input-background-focus);
  border-color: var(--color-input-border-focus);
  outline: 2px solid var(--color-input-outline);
  outline-offset: 2px;
}
```

## 📍 Quick Tips

1. **Always use semantic tokens** - Never use hardcoded colors
2. **Prefer surface-based colors** - They automatically ensure accessibility
3. **Use the default token** when available (e.g., `--spacing` instead of `--spacing-large5`)
4. **Check the Token Browser** in Storybook for live previews
5. **Soft variants** reduce contrast, **Hard variants** increase contrast

## 🔗 Resources

- **Complete Documentation**: `/packages/ui-kit/README.md`
- **Design Principles**: `/packages/ui-kit/DESIGN_PRINCIPLES.md`
- **Token Browser**: Run Storybook and navigate to Foundations > Token Browser
- **Theme Definitions**: `/packages/ui-kit/src/themes/theme-definitions.ts`