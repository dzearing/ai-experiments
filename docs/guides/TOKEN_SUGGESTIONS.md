# Token Suggestions for UI Kit

This document tracks design tokens that were found missing during code audits and should be considered for addition to the ui-kit token system.

## Missing Tokens Identified

### Radius Tokens
The following radius token names were used but don't exist in the current system:
- **`--radius-small`** - Found in multiple places in ClaudeCodeTerminal.module.css
  - Intent: Small radius for compact interactive elements like badges, tags, small buttons
  - Suggested mapping: Use `--radius-interactive` (4px) for now
  - Files affected: 
    - `/apps/ui-kit-mocks/src/mocks/terminal-components/claude-code-terminal/ClaudeCodeTerminal.module.css` (lines 31, 39, 47, 166, 294)

- **`--radius-medium`** - Found in ClaudeCodeTerminal.module.css
  - Intent: Medium radius for floating elements
  - Suggested mapping: Use `--radius-floating` (4px) or `--radius-container` (8px) depending on context
  - Files affected:
    - `/apps/ui-kit-mocks/src/mocks/terminal-components/claude-code-terminal/ClaudeCodeTerminal.module.css` (line 191)

### Typography Tokens
- **`--font-size-small`** - Found in ClaudeCodeTerminal.module.css
  - Intent: Small font size for secondary text
  - Suggested mapping: Use `--font-size-small10` (13px)
  - Files affected:
    - `/apps/ui-kit-mocks/src/mocks/terminal-components/claude-code-terminal/ClaudeCodeTerminal.module.css` (line 230)

- **`--line-height-normal`** - Found in ClaudeCodeTerminal.module.css
  - Intent: Normal line height for body text
  - Suggested mapping: Use `--line-height` (1.5)
  - Files affected:
    - `/apps/ui-kit-mocks/src/mocks/terminal-components/claude-code-terminal/ClaudeCodeTerminal.module.css` (line 246)

### Font Family Tokens
- **`--font-family-mono`** - This token exists but wasn't being used consistently
  - Found hardcoded `'Courier New', monospace` in multiple places
  - Should use the token instead for consistency

## Recommendations

1. Consider adding a more granular radius scale if needed, or document the intended usage of existing radius tokens more clearly
2. Ensure all font-family declarations use the appropriate tokens
3. Consider standardizing the naming convention for line-height tokens to match other token patterns

### Hover States for Panel Surface

**Issue:** The panel surface lacks hover state tokens that would be useful for interactive elements on panel backgrounds.

**Found in:** `/apps/ui-kit-mocks/src/mocks/terminal-components/claude-code-terminal/TabBar.module.css`

**Missing tokens:**
- `--color-panel-background-hover` - For panel background hover state
- `--color-panel-text-hover` - For panel text hover state  
- `--color-panel-border-hover` - For panel border hover state

**Current workaround:** Using Hard10 variants (`--color-panel-backgroundHard10`) for hover states, which provides a darker shade but isn't semantically a hover state.

**Suggested implementation:**
```css
--color-panel-background-hover: /* slightly darker than panel-background */
--color-panel-text-hover: /* slightly enhanced contrast from panel-text */
--color-panel-border-hover: /* slightly darker than panel-border */
```

### Duration Tokens

**Issue:** The token `--duration-fast` was incorrectly used but doesn't exist in the system.

**Found in:** `/apps/ui-kit-mocks/src/mocks/terminal-components/claude-code-terminal/TabBar.module.css` (multiple lines)

**Resolution:** Replaced with `--duration-fast20` (150ms) which exists in the system.

### Component-Specific Dimensions

**Issue:** Tab heights and widths are using hardcoded values or calc() expressions.

**Found in:** `/apps/ui-kit-mocks/src/mocks/terminal-components/claude-code-terminal/TabBar.module.css`

**Missing tokens that could be useful:**
- `--size-tab-height` - Standard tab height (32px)
- `--size-tab-min-width` - Minimum tab width (120px)
- `--size-tab-max-width` - Maximum tab width (240px)
- `--size-icon-small` - Small icon size (16px)

**Current workaround:** Using calc() expressions with spacing tokens or direct var(--spacing) for 16px dimensions.

## Notes

- Letter spacing values (like `0.5px`) don't have tokens, which is acceptable as they're rarely used
- Opacity values don't have tokens, which is acceptable as they're context-specific
- Fixed dimensions for specific components (like sidebar width) can remain as hardcoded values
- Hover states for surfaces other than primary may need to use Hard/Soft variants as a convention when specific hover tokens don't exist