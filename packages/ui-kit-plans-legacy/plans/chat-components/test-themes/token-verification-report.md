# Token Verification Report for chat-message-group-default.html

## Summary
All tokens used in the chat-message-group-default.html file have been verified and corrected.

## Tokens Fixed
The following incorrect tokens were replaced with their correct versions:

| Incorrect Token | Correct Token | Location |
|----------------|---------------|----------|
| `--line-height-normal` | `--line-height` | Global styles.css |
| `--radius-circle` | `50%` | Use raw CSS value |
| `--color-buttonPrimary-text` | `--color-primary-text` | Theme file |
| `--color-body-borderSoft20` | `--color-body-borderSoft10` | Theme file |
| `--color-primarySoft-background` | `--color-infoSoft-background` | Theme file |
| `--color-primarySoft-border` | `--color-infoSoft-border` | Theme file |
| `--duration-fast` | `--duration-fast10` | Global styles.css |
| `--easing-standard` | `--easing-default` | Global styles.css |
| `--color-body-linkHover` | `--color-body-link-hover` | Theme file |
| `--color-accent-background` | `--color-info-background` | Theme file |
| `--color-secondary-background` | `--color-success-background` | Theme file |

## Valid Tokens Used

### Color Tokens (from theme files)
- `--color-body-background`
- `--color-body-text`
- `--color-body-textSoft10`
- `--color-body-textSoft20`
- `--color-body-border`
- `--color-body-borderSoft10`
- `--color-body-link`
- `--color-body-link-hover`
- `--color-panel-background`
- `--color-primary-background`
- `--color-primary-text`
- `--color-neutral-background`
- `--color-neutral-background-hover`
- `--color-neutral-border`
- `--color-warningSoft-background`
- `--color-warningSoft-text`
- `--color-warningSoft-border`
- `--color-info-background`
- `--color-success-background`
- `--color-infoSoft-background`
- `--color-infoSoft-border`

### Typography Tokens (from styles.css)
- `--font-size`
- `--font-size-small10`
- `--font-size-small20`
- `--font-size-smallest`
- `--font-size-h3`
- `--font-size-h4`
- `--font-size-h5`
- `--font-weight-medium`
- `--font-weight-semibold`
- `--font-weight-bold`
- `--line-height`
- `--font-family-mono`

### Spacing Tokens (from styles.css)
- `--spacing`
- `--spacing-small10`
- `--spacing-small20`
- `--spacing-large10`
- `--spacing-large20`

### Radius Tokens (from styles.css)
- `--radius`
- `--radius-small10`
- `--radius-large10`
- `--radius-large20`

### Animation Tokens (from styles.css)
- `--duration-fast10`
- `--easing-default`

### Shadow Tokens (from styles.css)
- `--shadow-card`

### Custom Tokens (defined locally in the HTML)
- `--avatar-gradient-assistant` - Custom gradient for avatar backgrounds

## Verification Status
✅ All tokens have been verified and are correctly defined in either:
- `/packages/ui-kit/dist/themes/default-light.css` (and other theme files)
- `/packages/ui-kit/dist/styles.css` (global tokens)
- Locally in the HTML file (custom tokens)

## Notes
- The `--radius-circle` token does not exist. Use `50%` directly or `--radius-full` for circular elements.
- Color tokens follow a surface-based naming convention (e.g., `body`, `panel`, `primary`, etc.)
- All "Soft" variants provide reduced contrast versions of colors
- The token guide has been updated to reflect the correct token names