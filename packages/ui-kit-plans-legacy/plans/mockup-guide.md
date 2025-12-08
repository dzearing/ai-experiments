# Component Mockup Guide

This guide provides best practices and requirements for creating HTML mockups that demonstrate component designs using the ui-kit design system.

## Quick Start - FOLLOW THESE STEPS IN ORDER

### Step 0: READ THE TOKEN_CHEATSHEET.md (MANDATORY)

**🚨 CRITICAL FIRST STEP**: Before creating ANY mockup, you MUST read and understand the design token system:

1. **READ** `/docs/guides/TOKEN_CHEATSHEET.md` - This contains all available design tokens
2. **UNDERSTAND** the surface-based color system and spacing grid
3. **REFERENCE** the token examples throughout your mockup creation
4. **NEVER** use hardcoded colors, spacing, or typography values

**Your mockups MUST use ui-kit design tokens exclusively.** Any mockup using hardcoded values will be rejected.

### Step 1: Determine File Location and Naming

HTML mockups belong in `ui-kit-plans/plans/{category}/{component-name}/mockups/mock-{component-name}-{scenario}.html`

Each part of the path is kebab-cased:
* **category**: Group by type (e.g. "animation-components", "form-components", "workflow-components") 
* **component-name**: The specific component/view name (kebab-cased)
* **scenario**: Optional descriptor for variants (e.g., "default", "interactive", "responsive")

**CRITICAL**: File names MUST start with `mock-` not `mockup-`

### Step 2: Create the Mockup Files

Create one or more HTML files following the template below. Multiple files may be needed for:
- Different scenarios (default, dark mode, mobile view)
- Complex workflows with multiple screens
- Alternative design approaches

### Step 3: Update plan-data.json (NEVER SKIP THIS STEP)

**CRITICAL**: You MUST update `/packages/ui-kit-plans/plan-data.json` to register your mockups:

1. Open `plan-data.json`
2. Find or create your category in the categories object
3. Add/update the component entry:
```json
{
  "name": "Your Component Name",
  "folder": "your-component-name",
  "plans": [],
  "mockups": [
    "mockups/mock-your-component-name-default.html",
    "mockups/mock-your-component-name-interactive.html"
  ]
}
```
4. Verify all mockup paths are correct

**If you skip this step, your mockups will not appear in the index!**

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

**Refer to Step 0 above for mandatory TOKEN_CHEATSHEET.md requirements.**

### Important Token Guidelines

- **NEVER** assume token names - only use tokens documented in TOKEN_CHEATSHEET.md
- **ALWAYS** use surface-based colors for accessibility (e.g., `--color-primary-background` with `--color-primary-text`)
- **FOLLOW** the 4px spacing grid exclusively

### Missing Tokens

If tokens are missing from TOKEN_CHEATSHEET.md, update `/docs/guides/TOKEN_SUGGESTIONS.md` with:
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

/* Don't override theme-provided styles */
body {
    font-family: system-ui, -apple-system;  /* ❌ Theme already sets this */
    font-weight: 400;  /* ❌ Use --font-weight tokens */
}

/* Don't use absolute positioning unnecessarily */
.element {
    position: absolute;  /* ❌ Unless truly needed */
    top: 20px;
    left: 30px;
}
```

### IMPORTANT: Theme System Integration

**The ui-kit theme system already provides:**
- Font family settings (DO NOT override with `font-family` on body)
- Base font weights and sizes
- Line heights
- Color schemes
- All typography foundations

**Your mockups should ONLY set:**
```css
body {
    /* Theme-compatible overrides only */
    background: var(--color-body-background);
    color: var(--color-body-text);
    font-size: var(--font-size);  /* Only if needed */
    line-height: var(--line-height);  /* Only if needed */
    /* DO NOT SET: font-family, font-weight, or other typography that the theme handles */
}
```

## Final Verification Checklist

Before completing your mockup, verify EVERY item:

### TOKEN REQUIREMENTS (MANDATORY)
- [ ] **READ** `/docs/guides/TOKEN_CHEATSHEET.md` before starting
- [ ] **ALL** colors use design tokens from the cheatsheet AND stick with same-surface bg and fg tokens (do not mix and match surfaces to avoid accessibility issues where we render white on white.)
- [ ] **ALL** spacing uses design tokens from the cheatsheet  
- [ ] **ALL** typography uses design tokens from the cheatsheet
- [ ] **NO** hardcoded values (colors, px values, font names) anywhere
- [ ] **VERIFIED** all tokens exist in TOKEN_CHEATSHEET.md

### Files and Structure
- [ ] Files are in `plans/{category}/{component-name}/mockups/` directory
- [ ] Files named as `mock-{component-name}-{scenario}.html` (NOT mockup-)
- [ ] All required HTML template elements included

### plan-data.json Updates (CRITICAL)
- [ ] `plan-data.json` has been updated
- [ ] Category exists in the categories object
- [ ] Component entry includes all mockup file paths
- [ ] File paths in JSON match actual file locations exactly

### Quality Checks
- [ ] Test in both light and dark modes
- [ ] Check responsive behavior at different sizes
- [ ] Ensure semantic HTML is used
- [ ] Validate accessibility basics (headings, labels, ARIA)
- [ ] Test with different themes (use theme switcher)
- [ ] Verify no hardcoded colors or spacing (only design tokens)

### Summary
After completing, you should be able to confirm:
- ✅ Mockup files created in correct location with correct names
- ✅ plan-data.json updated with all mockup entries
- ✅ Mockups appear in the ui-kit-plans index page
- ✅ All mockups use design tokens and follow ui-kit patterns
