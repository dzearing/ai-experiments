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

## Notes

- Letter spacing values (like `0.5px`) don't have tokens, which is acceptable as they're rarely used
- Opacity values don't have tokens, which is acceptable as they're context-specific
- Fixed dimensions for specific components (like sidebar width) can remain as hardcoded values