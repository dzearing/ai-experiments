# Design Token Cheatsheet

Quick reference for design tokens in Claude Flow. For complete documentation, see `/packages/ui-kit/README.md`.

## 🎨 Color Tokens (Surface-Based System)

### Token Pattern: `--color-[surface]-[concept]-[state]`

#### Common Surface Colors

Note: the `surface` component defines the background color group - the `concept` defines things within that group which will work together in that `state`. We can guarantee that the body text will work on the body background. However you must NOT mix and match surfaces - you should not use primary background with body text. Mixing different values from different surfaces risks creating contrast issues.


```css
/* Text Colors */
--color-body-text                  /* Primary text color */
--color-body-textSoft10            /* 10% less contrast (secondary text) */
--color-body-textSoft20            /* 20% less contrast (tertiary text) */
--color-body-link                  /* Link color */
--color-body-link-hover            /* Link hover state */

/* Backgrounds */
--color-body-background            /* Main background */
--color-panel-background           /* Card/panel background */
--color-panelRaised-background     /* Elevated panel */
--color-overlay-background         /* Modal/dialog overlay */

/* Borders */
--color-body-border                /* Default border */
--color-body-borderSoft10          /* Subtle border */
--color-input-border               /* Input field border */
--color-input-border-focus         /* Focused input border */

/* Buttons */
--color-buttonPrimary-background   /* Primary button background */
--color-buttonPrimary-text         /* Primary button text */
--color-buttonPrimary-background-hover
--color-buttonNeutral-background   /* Secondary button */
--color-buttonDanger-background    /* Destructive action */

/* States & Feedback */
--color-successSoft-background     /* Success message background */
--color-successSoft-text           /* Success message text */
--color-dangerSoft-background      /* Error background */
--color-dangerSoft-text            /* Error text */
--color-warningSoft-background     /* Warning background */
--color-infoSoft-background        /* Info background */
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
--line-height-normal   /* 1.5 - DEFAULT */
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
```

## 🔄 Border Radius

```css
/* Radius Scale */
--radius-small20       /* 2px */
--radius-small10       /* 4px */
--radius               /* 6px - DEFAULT */
--radius-large10       /* 8px */
--radius-large20       /* 12px */
--radius-large30       /* 16px */
--radius-circle        /* 50% */

/* Component Radius */
--radius-button        /* Button corners */
--radius-input         /* Input field corners */
--radius-card          /* Card corners */
--radius-dialog        /* Dialog corners */
```

## 🎬 Animation

```css
/* Durations */
--duration-instant     /* 0ms */
--duration-fast        /* 100ms */
--duration-normal      /* 200ms - DEFAULT */
--duration-slow        /* 300ms */
--duration-slower      /* 500ms */

/* Easings */
--easing-standard      /* cubic-bezier(0.4, 0, 0.2, 1) */
--easing-decelerate    /* cubic-bezier(0, 0, 0.2, 1) */
--easing-accelerate    /* cubic-bezier(0.4, 0, 1, 1) */
--easing-bounce        /* Custom bounce effect */
```

## 🎯 Common Usage Patterns

### Button Styling
```css
.button-primary {
  background: var(--color-buttonPrimary-background);
  color: var(--color-buttonPrimary-text);
  padding: var(--spacing-buttonY) var(--spacing-buttonX);
  border-radius: var(--radius-button);
  font-weight: var(--font-weight-medium);
  transition: all var(--duration-normal) var(--easing-standard);
}

.button-primary:hover {
  background: var(--color-buttonPrimary-background-hover);
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
  line-height: var(--line-height-normal);
}

.secondary-text {
  color: var(--color-body-textSoft10);
  font-size: var(--font-size-small10);
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
  border-color: var(--color-input-border-focus);
  outline: 2px solid var(--color-input-border-focus);
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