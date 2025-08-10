# Token Suggestions for UI-Kit

## Tokens Found Missing During Audit

### 1. Panel Background Variants
**Intent**: Provide subtle variations of panel background for nested components
**Found in**: mockup.html line 26 (originally attempted to use `--color-panel-backgroundSoft10` and `--color-panel-backgroundHard10`)
**Suggested tokens**:
- `--color-panel-backgroundSoft10` - Slightly lighter panel background
- `--color-panel-backgroundHard10` - Slightly darker panel background
**Current workaround**: Using hardcoded gradient values `#e0e0e0` and `#c0c0c0`

### 2. Warning Color for Borders
**Intent**: Consistent warning state for component borders
**Found in**: mockup.html line 553 (originally attempted to use `--color-warning`)
**Suggested token**:
- `--color-warning` - Base warning color for inline styling needs
**Current workaround**: Using `--color-warningSoft-border` which is appropriate for the soft surface

## Tokens Successfully Replaced

All invalid token references have been replaced with valid ui-kit tokens:
- `--color-panel-backgroundSoft10` → Hardcoded gradient value (component-specific)
- `--color-panel-backgroundHard10` → Hardcoded gradient value (component-specific)
- `--color-warning` → `--color-warningSoft-border`
- `--color-warning-background` → `--color-warningSoft-background`
- `--color-body-textWarning` → `--color-warningSoft-text`

## Component-Specific Styles

The following custom properties are intentionally defined within the component as they are specific to the AI persona indicator use case:
- `--gradient-claude`
- `--gradient-gpt`
- `--gradient-gemini`
- `--gradient-custom`
- `--gradient-ai-default`

These gradients are not candidates for the global token system as they are highly specific to AI persona branding.