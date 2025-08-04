# Component Token Mapping Guide

This guide shows which design tokens to use for common UI components. For complete token documentation, see `/packages/ui-kit/README.md`.

## Button Components

### Primary Button
```css
.button-primary {
  /* Colors */
  background: var(--color-buttonPrimary-background);
  color: var(--color-buttonPrimary-text);
  border-color: var(--color-buttonPrimary-border);
  
  /* Spacing */
  padding: var(--spacing-buttonY) var(--spacing-buttonX);
  gap: var(--gap-small10);
  
  /* Typography */
  font-size: var(--font-size);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  
  /* Shape */
  border-radius: var(--radius-button);
  border-width: var(--border-width);
  
  /* Effects */
  box-shadow: var(--shadow-button);
  transition: all var(--duration-normal) var(--easing-standard);
}

.button-primary:hover {
  background: var(--color-buttonPrimary-background-hover);
  color: var(--color-buttonPrimary-text-hover);
  box-shadow: var(--shadow-button-hover);
}

.button-primary:active {
  background: var(--color-buttonPrimary-background-active);
}

.button-primary:disabled {
  background: var(--color-buttonPrimary-background-disabled);
  color: var(--color-buttonPrimary-text-disabled);
  cursor: not-allowed;
}
```

### Secondary/Neutral Button
```css
.button-secondary {
  background: var(--color-buttonNeutral-background);
  color: var(--color-buttonNeutral-text);
  border-color: var(--color-buttonNeutral-border);
}
```

### Danger/Destructive Button
```css
.button-danger {
  background: var(--color-buttonDanger-background);
  color: var(--color-buttonDanger-text);
}
```

## Form Components

### Input Fields
```css
.input {
  /* Colors */
  background: var(--color-input-background);
  color: var(--color-input-text);
  border-color: var(--color-input-border);
  
  /* Placeholder */
  &::placeholder {
    color: var(--color-input-placeholderText);
  }
  
  /* Spacing */
  padding: var(--spacing-inputY) var(--spacing-inputX);
  
  /* Typography */
  font-size: var(--font-size);
  line-height: var(--line-height-normal);
  
  /* Shape */
  border-radius: var(--radius-input);
  border-width: var(--border-width);
}

.input:focus {
  border-color: var(--color-input-border-focus);
  outline: 2px solid var(--color-input-border-focus);
  outline-offset: var(--focus-ring-offset);
}

.input:disabled {
  background: var(--color-input-background-disabled);
  color: var(--color-input-text-disabled);
}

.input.error {
  border-color: var(--color-danger);
}
```

### Labels
```css
.label {
  color: var(--color-body-text);
  font-size: var(--font-size-small10);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-small20);
}

.label.required::after {
  content: "*";
  color: var(--color-danger);
  margin-left: var(--spacing-smallest);
}
```

### Form Error Messages
```css
.form-error {
  color: var(--color-danger);
  font-size: var(--font-size-small10);
  margin-top: var(--spacing-small20);
}
```

## Card Components

### Basic Card
```css
.card {
  /* Colors */
  background: var(--color-panel-background);
  border-color: var(--color-panel-border);
  
  /* Spacing */
  padding: var(--spacing-card);
  gap: var(--spacing);
  
  /* Shape */
  border-radius: var(--radius-card);
  border-width: var(--border-width);
  
  /* Effects */
  box-shadow: var(--shadow-card);
}

.card-header {
  border-bottom: var(--border-width) solid var(--color-panel-border);
  padding-bottom: var(--spacing);
  margin-bottom: var(--spacing);
}

.card-title {
  color: var(--color-panel-text);
  font-size: var(--font-size-h5);
  font-weight: var(--font-weight-semibold);
}

.card-description {
  color: var(--color-panel-textSoft10);
  font-size: var(--font-size-small10);
  margin-top: var(--spacing-small20);
}
```

### Elevated Card
```css
.card-elevated {
  background: var(--color-panelRaised-background);
  border-color: var(--color-panelRaised-border);
  box-shadow: var(--shadow-hard10);
}
```

## Navigation Components

### Navigation Bar
```css
.navbar {
  background: var(--color-panel-background);
  border-bottom: var(--border-width) solid var(--color-panel-border);
  height: var(--height-header);
  padding: 0 var(--spacing-large10);
}

.nav-link {
  color: var(--color-panel-text);
  padding: var(--spacing-small10) var(--spacing);
  font-weight: var(--font-weight-medium);
  transition: color var(--duration-fast) var(--easing-standard);
}

.nav-link:hover {
  color: var(--color-panel-link);
}

.nav-link.active {
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
}
```

### Breadcrumbs
```css
.breadcrumb {
  color: var(--color-body-textSoft10);
  font-size: var(--font-size-small10);
}

.breadcrumb-separator {
  color: var(--color-body-textSoft20);
  margin: 0 var(--spacing-small20);
}

.breadcrumb-current {
  color: var(--color-body-text);
  font-weight: var(--font-weight-medium);
}
```

## Modal/Dialog Components

### Dialog
```css
.dialog-overlay {
  background: var(--color-overlay-background);
  backdrop-filter: blur(4px);
}

.dialog {
  background: var(--color-dialog-background);
  border: var(--border-width) solid var(--color-dialog-border);
  border-radius: var(--radius-dialog);
  box-shadow: var(--shadow-modal);
  padding: var(--spacing-large10);
  max-width: var(--maxWidth-large10);
}

.dialog-header {
  border-bottom: var(--border-width) solid var(--color-dialog-border);
  padding-bottom: var(--spacing);
  margin-bottom: var(--spacing-large5);
}

.dialog-title {
  color: var(--color-dialog-text);
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-semibold);
}

.dialog-footer {
  border-top: var(--border-width) solid var(--color-dialog-border);
  padding-top: var(--spacing);
  margin-top: var(--spacing-large10);
  display: flex;
  gap: var(--gap);
  justify-content: flex-end;
}
```

## Notification Components

### Toast/Alert
```css
.toast {
  border-radius: var(--radius);
  padding: var(--spacing) var(--spacing-large5);
  font-size: var(--font-size);
  box-shadow: var(--shadow-hard10);
}

.toast-success {
  background: var(--color-successSoft-background);
  color: var(--color-successSoft-text);
  border: var(--border-width) solid var(--color-successSoft-border);
}

.toast-error {
  background: var(--color-dangerSoft-background);
  color: var(--color-dangerSoft-text);
  border: var(--border-width) solid var(--color-dangerSoft-border);
}

.toast-warning {
  background: var(--color-warningSoft-background);
  color: var(--color-warningSoft-text);
  border: var(--border-width) solid var(--color-warningSoft-border);
}

.toast-info {
  background: var(--color-infoSoft-background);
  color: var(--color-infoSoft-text);
  border: var(--border-width) solid var(--color-infoSoft-border);
}
```

### Banner
```css
.banner {
  padding: var(--spacing-large5) var(--spacing-large10);
  border-radius: var(--radius-large10);
  margin-bottom: var(--spacing-large10);
}

.banner-info {
  background: var(--color-infoSoft-background);
  color: var(--color-infoSoft-text);
}
```

## Data Display Components

### Table
```css
.table {
  background: var(--color-panel-background);
  border: var(--border-width) solid var(--color-panel-border);
  border-radius: var(--radius);
}

.table-header {
  background: var(--color-panel-backgroundSoft10);
  border-bottom: var(--border-width) solid var(--color-panel-border);
}

.table-header-cell {
  color: var(--color-panel-text);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-small10);
  padding: var(--spacing-small5) var(--spacing);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-cell {
  color: var(--color-panel-text);
  padding: var(--spacing) var(--spacing);
  border-bottom: var(--border-width) solid var(--color-panel-borderSoft10);
}

.table-row:hover {
  background: var(--color-panel-backgroundHover);
}
```

### List
```css
.list {
  background: var(--color-panel-background);
  border-radius: var(--radius);
}

.list-item {
  padding: var(--spacing) var(--spacing-large5);
  border-bottom: var(--border-width) solid var(--color-panel-borderSoft10);
  transition: background var(--duration-fast) var(--easing-standard);
}

.list-item:hover {
  background: var(--color-panel-backgroundHover);
}

.list-item:last-child {
  border-bottom: none;
}

.list-item-title {
  color: var(--color-panel-text);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-smallest);
}

.list-item-description {
  color: var(--color-panel-textSoft10);
  font-size: var(--font-size-small10);
}
```

## Loading States

### Skeleton
```css
.skeleton {
  background: var(--color-panel-backgroundSoft10);
  border-radius: var(--radius-small10);
  animation: skeleton-pulse var(--duration-slower) var(--easing-standard) infinite;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### Spinner
```css
.spinner {
  border: 2px solid var(--color-panel-borderSoft10);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-circle);
  animation: spin var(--duration-slow) linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

## Typography Components

### Headings
```css
.h1 {
  color: var(--color-body-text);
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  margin-bottom: var(--spacing-large5);
}

.h2 {
  color: var(--color-body-text);
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  margin-bottom: var(--spacing);
}

.h3 {
  color: var(--color-body-text);
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  margin-bottom: var(--spacing-small5);
}
```

### Body Text
```css
.text {
  color: var(--color-body-text);
  font-size: var(--font-size);
  line-height: var(--line-height-normal);
}

.text-secondary {
  color: var(--color-body-textSoft10);
}

.text-muted {
  color: var(--color-body-textSoft20);
  font-size: var(--font-size-small10);
}

.text-small {
  font-size: var(--font-size-small10);
  line-height: var(--line-height-normal);
}

.text-large {
  font-size: var(--font-size-large10);
  line-height: var(--line-height-relaxed);
}
```

### Links
```css
.link {
  color: var(--color-body-link);
  text-decoration: none;
  transition: color var(--duration-fast) var(--easing-standard);
}

.link:hover {
  color: var(--color-body-link-hover);
  text-decoration: underline;
}

.link:visited {
  color: var(--color-body-link-visited);
}

.link:active {
  color: var(--color-body-link-active);
}
```

## Quick Reference

### Token Categories by Component Need

| Component Need | Token Category | Example |
|----------------|----------------|---------|
| Main text | `--color-body-text*` | `--color-body-text` |
| Component backgrounds | `--color-panel-*` | `--color-panel-background` |
| Interactive elements | `--color-button*-*` | `--color-buttonPrimary-background` |
| Form inputs | `--color-input-*` | `--color-input-border` |
| Feedback/alerts | `--color-*Soft-*` | `--color-successSoft-background` |
| Spacing/gaps | `--spacing-*` | `--spacing-large10` |
| Text sizes | `--font-size-*` | `--font-size-h3` |
| Rounded corners | `--radius-*` | `--radius-button` |
| Elevation | `--shadow-*` | `--shadow-card` |
| Animation | `--duration-*` | `--duration-normal` |

### Surface Selection Guide

1. **body** - Main application background and text
2. **panel** - Cards, sections, containers
3. **panelRaised** - Elevated cards, important sections
4. **input** - Form fields and inputs
5. **button[Type]** - Buttons (Primary, Neutral, Danger, Success)
6. **[state]Soft** - Notifications and alerts (info, success, warning, danger)
7. **dialog/modal** - Overlay content
8. **tooltip** - Tooltips and popovers
9. **menu** - Dropdown menus and selects
10. **codeBlock/codeInline** - Code display