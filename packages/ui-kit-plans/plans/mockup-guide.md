# Component Mockup Guide

This guide provides best practices and requirements for creating HTML mockups that demonstrate component designs using the ui-kit design system.

## Quick Start

HTML mockups belong in `ui-kit-plans/plans/{subject}/{subject}/mockups/mock-{subject}-{scenario}.html`. 

Each part of the path is kebab-cased. Notes:

* Try to group component plans by subject (e.g. "animation-components", "form-components", "experimental-chat-views"). 
* The subject represents the component or view name (kebab cased).
* The scenario (optional) represents the scenario being demo'd, or can simply be omited for a general mock.

**Important**: After creating a new mockup, update `/packages/ui-kit-plans/plan-data.json` to add your mockup to the appropriate category so it appears in the index page.

Every mockup HTML file must include these essential elements:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Component Name - Mockup</title>
    
    <!-- 1. Link to UI Kit styles -->
    <link rel="stylesheet" href="/assets/styles.css">
    
    <!-- 2. Set base path for themes -->
    <script>
        window.__uiKitBasePath = '/assets/';
    </script>
    
    <!-- 3. Load theme engine (auto-initializes) -->
    <script type="module" src="/assets/theme.js"></script>
    
    <!-- 4. Optional: Theme switcher UI -->
    <script type="module" src="/assets/theme-switcher.js"></script>
</head>
<body>
    <!-- Your mockup content -->
</body>
</html>
```

## UI Kit Integration

### Required Files

The ui-kit provides these auto-updating files:
- **styles.css**: Complete design token CSS variables
- **theme.js**: Core theme engine (auto-initializes, prevents FOUC)
- **theme-switcher.js**: Adds theme/mode toggle UI (optional)

### Theme API

The theme.js script provides a global `__uiKitTheme` API:
```javascript
// Available after theme.js loads
__uiKitTheme.setTheme('ocean');     // Change theme
__uiKitTheme.setMode('dark');       // Toggle dark mode
__uiKitTheme.getTheme();             // Get current theme
__uiKitTheme.getMode();              // Get current mode
```

## Design Token Usage

Follow guidance in docs/guides/TOKEN_CHEATSHEET.md on what toens to use. You must follow the token guidance there and DO NOT assume any token names will exist if they aren't documented.

If tokens are missing, update docs/guides/TOKEN_SUGGESTIONS.md with:
* The token name you were looking for
* Scenario you needed it in
* Suggested alternative names

## Mockup Types and Examples

### 1. Default State Mockup
Shows the component in its most common configuration:
```html
<div class="component-demo">
    <h2>Default Component</h2>
    <div class="example">
        <!-- Component with minimal/default props -->
    </div>
</div>
```

### 2. Interactive States Mockup
Demonstrates hover, focus, active, disabled states:
```html
<div class="states-grid">
    <div class="state-example">
        <h3>Normal</h3>
        <!-- Normal state -->
    </div>
    <div class="state-example">
        <h3>Hover</h3>
        <!-- Hover state (use :hover in CSS) -->
    </div>
    <div class="state-example">
        <h3>Disabled</h3>
        <!-- Disabled state -->
    </div>
</div>
```

### 3. Variants Mockup
Shows all visual variants:
```html
<div class="variants-showcase">
    <section>
        <h3>Primary Variant</h3>
        <!-- Primary styling -->
    </section>
    <section>
        <h3>Secondary Variant</h3>
        <!-- Secondary styling -->
    </section>
</div>
```

### 4. Responsive Behavior Mockup
Demonstrates mobile, tablet, desktop layouts:
```html
<style>
    .responsive-demo {
        /* Mobile first approach */
    }
    
    @media (min-width: 768px) {
        .responsive-demo {
            /* Tablet styles */
        }
    }
    
    @media (min-width: 1024px) {
        .responsive-demo {
            /* Desktop styles */
        }
    }
</style>
```

### 5. Composition Mockup
Shows the component used with others:
```html
<div class="composition-examples">
    <div class="with-form">
        <!-- Component in a form context -->
    </div>
    <div class="in-card">
        <!-- Component inside a card -->
    </div>
</div>
```

## CSS Best Practices

### DO:
```css
/* Use design tokens */
.component {
    padding: var(--spacing-small);
    background: var(--color-primary-background);
    border-radius: var(--radius-interactive);
}

/* ONLY use same-surface colors to ensure accessibility */
.foo {
  background: var(--color-primary-background);
  color: var(--color-primary-text);
}

/* Use semantic HTML */
<button type="button">Click me</button>
<nav aria-label="Main navigation">...</nav>

/* Use flexbox/grid for layout */
.container {
    display: flex;
    gap: var(--spacing);
}
```

### DON'T:
```css
/* Don't use hardcoded values */
.component {
    padding: 16px;  /* ❌ Use --spacing tokens */
    background: #ffffff;  /* ❌ Use --color-panel-background */
    border-radius: 8px;  /* ❌ Use --radius-container */
}

/* Don't use absolute positioning unnecessarily */
.element {
    position: absolute;  /* ❌ Unless truly needed */
    top: 20px;
    left: 30px;
}
```

## Testing Your Mockup

Before finalizing:
- [ ] Test in both light and dark modes
- [ ] Check responsive behavior at different sizes
- [ ] Ensure semantic HTML is used
- [ ] Validate accessibility basics (headings, labels)
- [ ] Test with different themes (use theme switcher)
- [ ] Verify no hardcoded colors or spacing
