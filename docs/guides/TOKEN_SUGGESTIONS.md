# Token Suggestions

This document tracks design tokens that are missing from the ui-kit token system and were identified during component audits.

## Missing Tokens Identified

### Gradients
The following gradient tokens were identified as needed but don't exist in the current system:

#### Location: `/packages/ui-kit-plans/plans/chat-components/ai-persona-indicator/mockup.html`

**Intent:** AI persona visual identity gradients
**Suggested tokens:**
- `--gradient-primary`: Primary gradient for branding (e.g., Claude)
- `--gradient-success`: Success/positive state gradient (e.g., GPT)
- `--gradient-info`: Information/neutral gradient (e.g., Gemini)
- `--gradient-danger-warning`: Multi-color gradient for custom/warning states

**Usage context:** Used to create visual distinction between different AI personas in the chat interface.

### Non-existent Tokens Referenced

The following tokens were incorrectly used and don't exist in the token system:

1. **--color-surface** (lines 70, 78, 84)
   - Should use: `--color-panel-background`
   - Context: Background color for elevated surfaces

2. **--color-surface-elevated** (line 84)
   - Should use: `--color-panel-background`
   - Context: Elevated panel state

3. **--color-border** (line 71)
   - Should use: `--color-panel-border` or `--color-body-border`
   - Context: Generic border color

4. **--radius-full** (line 72, 92, 126)
   - Should use: `99999px` for circular elements
   - Context: Full circle border radius

5. **--shadow-sm** (line 79)
   - Should use: `--shadow-soft10`
   - Context: Small/subtle shadow

6. **--color-success** (line 127)
   - Should use: `--color-success-background`
   - Context: Success indicator background

7. **--color-text-softer** (line 137)
   - Should use: `--color-body-textSoft20`
   - Context: Very soft text color

8. **--color-text** (line 119, 576, 587)
   - Should use: `--color-body-text`
   - Context: Primary text color

9. **--color-text-soft** (line 585)
   - Should use: `--color-body-textSoft10`
   - Context: Secondary text color

10. **--spacing-xs** (line 69)
    - Should use: `--spacing-small20` (4px)
    - Context: Extra small spacing

11. **--spacing-md** (line 69, 568)
    - Should use: `--spacing` (16px)
    - Context: Medium spacing

12. **--radius-md** (line 568)
    - Should use: `--radius` or `--radius-large10`
    - Context: Medium border radius

13. **--color-warning** (line 556, 558)
    - Should use: `--color-warning-background` or `--color-body-textWarning`
    - Context: Warning state colors

14. **--color-successBright-background** (line 24)
    - Token doesn't exist in system
    - Should simplify gradient or use existing success tokens

15. **--color-infoBright-background** (line 25)
    - Token doesn't exist in system
    - Should simplify gradient or use existing info tokens

## Recommendations

1. **Gradient System**: Consider adding a gradient token system for components that need visual distinction beyond solid colors.

2. **Standardize Token Names**: Ensure all developers are aware of the correct token names to avoid creating non-existent references.

3. **Token Documentation**: Update the TOKEN_CHEATSHEET.md with common mistakes and their corrections.

4. **Linting Rules**: Consider adding CSS linting rules to catch usage of non-existent tokens during development.

## Theme Explorer Issues

### Location: `/packages/ui-kit/src/stories/ThemeExplorer.stories.tsx`

**Missing/Incorrect Tokens:**

1. **--font-family** (lines 24, 34)
   - Intent: Default font family
   - Should be added to system or use fallback

2. **--line-height-normal** (line 35)
   - Intent: Normal line height
   - Token exists in cheatsheet, verify in themes

3. **--duration** (line 207)
   - Should use: `--duration-normal`

4. **--color-panel-border-hard10** (line 62)
   - Should use: `--color-panel-borderHard10` (no dash)

5. **--color-panel-textSoft30** (lines 118, 157)
   - Should use: `--color-panel-textSoft20` (Soft30 doesn't exist)

6. **--color-panel-backgroundSoft10** (line 236)
   - Verify existence or use alternative

7. **--color-panel-backgroundSoft20** (lines 125, 241)
   - Verify existence or use alternative

8. **--color-panel-backgroundSoft30** (lines 314, 378)
   - Should use: `--color-panel-backgroundSoft20` (Soft30 doesn't exist)

9. **--color-input-placeholderText** (line 296)
   - Should use: `--color-input-placeholder` or `--color-input-textSoft10`

10. **--color-neutral-text-hover** (lines 221, 238)
    - Should use: `--color-neutral-text` (verify hover state)

11. **--color-neutral-text-active** (lines 226, 243)
    - Should use: `--color-neutral-text` (verify active state)

12. **--color-neutral-border-hover** (line 238)
    - Should use: `--color-neutral-borderHard10` or verify existence

13. **--color-neutral-border-active** (line 244)
    - Should use: `--color-neutral-borderHard20` or verify existence

### Location: `/packages/ui-kit/src/stories/ThemeExplorer.stories.css`

**Missing/Incorrect Tokens:**

1. **--color-body-textHard10** (lines 25, 82)
   - Should verify or use: `--color-body-text`

2. **--color-body-textSoft30** (lines 30, 98)
   - Should use: `--color-body-textSoft20` (Soft30 doesn't exist)

## Token Browser Audit Findings

### Invalid Token Naming Pattern Fixed (2025-08-10)

During the token browser audit, discovered widespread use of incorrect token naming patterns with hyphens instead of camelCase for soft/hard variants:

**Files Updated:**
- `/packages/ui-kit/src/stories/foundations/TokenBrowser.stories.css`
- `/packages/ui-kit/src/stories/components/IconButton.stories.css`
- `/packages/ui-kit/src/stories/components/ButtonShapes.stories.css`
- `/packages/ui-kit/src/stories/foundations/ColorSystem.stories.css`
- `/packages/ui-kit/src/styles/storybook.css`

**Pattern Fixed:**
- ❌ `--color-body-text-soft10` → ✅ `--color-body-textSoft10`
- ❌ `--color-body-text-hard10` → ✅ `--color-body-textHard10`
- ❌ `--color-body-background-soft10` → ✅ `--color-body-backgroundSoft10`
- ❌ `--color-body-border-soft10` → ✅ `--color-body-borderSoft10`
- ❌ `--color-buttonPrimary-background-soft10` → ✅ Using base token (soft variant doesn't exist)

**Additional Missing Tokens Identified:**
1. **--color-body-textSoft30** - Used in multiple places but doesn't exist, replaced with textSoft20
2. **--color-buttonPrimary-backgroundSoft10** - Focus state variant needed
3. **--color-buttonPrimary-shadow** - Surface-specific shadow token needed

## Segmented Control Audit Findings (2025-08-10)

### Missing/Non-existent Tokens Identified

During the segmented control mockup audit, identified the following tokens that are referenced but don't exist in the system:

1. **--spacing-smallest** 
   - Used extensively for 2px padding/gaps
   - Files: All 5 segmented control mockups
   - Current workaround: Using fallback `var(--spacing-smallest, 2px)`
   - Suggested: Add to system as 2px value

2. **--color-border**
   - Generic border color (used incorrectly)
   - Should use: `--color-body-border` or `--color-panel-border` depending on surface
   - Fixed in all files

3. **--radius-full**
   - Used for circular elements
   - Should use: `50%` for true circles
   - Fixed in all files

4. **--color-body-textHard10**
   - Harder text variant (doesn't exist)
   - Should use: `--color-body-text` (already maximum contrast)
   - Fixed in all files

5. **--color-body-backgroundSoft20**
   - Softer background variant (doesn't exist)
   - Should use: `--color-panel-background` for elevated surfaces
   - Fixed in all files

6. **--color-body-backgroundHard10**
   - Harder background variant (doesn't exist)  
   - Should use: `--color-panel-background` for interactive states
   - Fixed in all files

7. **--color-primary**
   - Generic primary color (incorrect usage)
   - Should use: `--color-primary-background` for focus outlines
   - Fixed in all files

8. **--shadow-inner**
   - Inner shadow variant (doesn't exist)
   - Should use: `--shadow-soft10` for subtle shadows
   - Fixed in all files

9. **--color-panel-backgroundSoft10**
   - Panel background soft variant
   - Verify if exists or use `--color-panel-background`
   - Used in variant styles

10. **--duration** (without modifier)
    - Generic duration token
    - Should use: `--duration-normal`
    - Fixed in all files

### Hardcoded Values Replaced

1. **rgba() shadow values**
   - Replaced `inset 0 1px 3px rgba(0, 0, 0, 0.12), inset 0 1px 2px rgba(0, 0, 0, 0.24)` with `var(--shadow-soft10)`
   - Found in all 5 files

2. **Direct pixel values**
   - Replaced `2px` padding with `var(--spacing-smallest, 2px)`
   - Used fallback pattern for missing token

3. **Hardcoded colors in dark theme**
   - Replaced hex colors like `#0a0a0a`, `#ffffff`, `#328ce7` with appropriate tokens
   - File: mockup-dark.html

4. **Gradient colors**
   - Replaced hardcoded gradient `#667eea` and `#764ba2` with token-based approach
   - File: mockup-variants.html

### Files Updated

1. `/packages/ui-kit-plans/plans/form-components/segmented-control/mockup-default.html`
2. `/packages/ui-kit-plans/plans/form-components/segmented-control/mockup-responsive.html`
3. `/packages/ui-kit-plans/plans/form-components/segmented-control/mockup-dark.html`
4. `/packages/ui-kit-plans/plans/form-components/segmented-control/mockup-variants.html`
5. `/packages/ui-kit-plans/plans/form-components/segmented-control/mockup-interactive.html`

## Fixed Issues Summary

- Replaced 15+ hardcoded pixel values with appropriate spacing tokens
- Fixed all color references to use proper surface-based tokens
- Corrected animation durations to use duration tokens
- Fixed border-radius values to use proper tokens or standard CSS values
- Ensured all text colors follow the surface-based system
- Fixed ThemeExplorer component token usage
- **Fixed token naming pattern from hyphenated to camelCase for all soft/hard variants**
- **Corrected 50+ invalid token references across 5 CSS files**
- **Fixed all segmented control mockups to use proper design tokens**
- **Replaced all hardcoded rgba() values with shadow tokens**
- **Ensured surface alignment across all interactive states**

## Chat Components Mockup Audit (2025-08-10)

### Files Audited and Fixed:
1. `/packages/ui-kit-plans/plans/chat-components/chat-split-fork/mockup.html`
2. `/packages/ui-kit-plans/plans/chat-components/file-tree-visualizer/mockup.html`
3. `/packages/ui-kit-plans/plans/chat-components/chat-message-group/mockup.html`
4. `/packages/ui-kit-plans/plans/chat-components/search-results-visualizer/mockup.html`
5. `/packages/ui-kit-plans/plans/chat-components/multi-chat-dashboard/mockup.html`

### Common Issues Fixed:

#### Non-existent Tokens Replaced:
1. **--radius-modal** → `--radius-large20`
2. **--shadow-modal** → `--shadow-hard20`
3. **--radius-panel** → `--radius-large10`
4. **--radius-small** → `--radius-small10`
5. **--spacing-small30** → `--spacing-small20`
6. **--font-size-small30** → `--font-size-smallest`
7. **--color-panel-backgroundSoft10** → `--color-infoSoft-background` or `--color-neutral-background`
8. **--color-tag-background/text** → `--color-neutral-background/text`
9. **--radius-tag** → `--radius-small10`
10. **--color-button-backgroundHover** → `--color-neutral-background-hover`
11. **--shadow-panel** → `--shadow-card`
12. **--color-input-borderFocused** → `--color-input-border-focus`
13. **--shadow-inputFocused** → Custom focus shadow using primary color
14. **--color-body-backgroundSoft10** → `--color-neutral-background-hover`
15. **--color-body-borderHard10** → `--color-body-border`

#### Hardcoded Values Replaced:
1. **Pixel values** → Spacing tokens or calc() expressions
   - `2px` → `--spacing-small20`
   - `4px` → `--spacing-small20`
   - `8px` → `--spacing-small10`
   - `12px` → `--spacing-small5`
   - `20px` → `--spacing-large5`
   - `32px` → `--spacing-large20`
   - Large values → `calc(var(--spacing) * multiplier)`
2. **Border radius values** → Radius tokens
   - `2px` → `--radius-small20`
   - `4px` → `--radius-small10`
3. **Font sizes** → Font size tokens
   - `10px` → `--font-size-smallest`
   - `11px` → `--font-size-smallest`
   - `12px` → `--font-size-small20`
   - `13px` → `--font-size-small10`
   - `14px` → `--font-size`
4. **Colors** → Surface-based tokens
   - `yellow` → `--color-warningSoft-background`
   - `rgba()` values → Appropriate tokens
5. **Font weights** → Font weight tokens
   - `600` → `--font-weight-semibold`

### Tokens Still Missing from System:
1. **Avatar gradients** - Currently simplified to single colors
2. **Highlight colors with transparency** - Using warningSoft as alternative
3. **Hover shadows** - Using existing shadow tokens

### Recommendations:
1. Consider adding gradient tokens for complex UI elements
2. Add focus state shadow tokens
3. Document calc() usage patterns for larger spacing values
4. Create a linting rule to catch hardcoded values in CSS

## Chat Component Mockups Audit (2025-08-10)

### Files Audited:
- `/packages/ui-kit-plans/plans/chat-components/streaming-text/mockup.html`
- `/packages/ui-kit-plans/plans/chat-components/smart-prompt-input/mockup.html`
- `/packages/ui-kit-plans/plans/chat-components/chat-bubble/mockup.html`
- `/packages/ui-kit-plans/plans/chat-components/tool-execution-container/mockup-default.html`
- `/packages/ui-kit-plans/plans/chat-components/tool-execution-container/mockup.html`
- `/packages/ui-kit-plans/plans/chat-components/ai-persona-indicator/mockup.html`
- `/packages/ui-kit-plans/plans/list-components/chat-list/mockup.html`

### Common Issues Fixed:

1. **Hardcoded Colors Replaced:**
   - `#e0e0e0`, `#c0c0c0` → `var(--color-neutral-background)` variations
   - RGB values for alpha transparency → Used existing tokens or rgba() with token RGB values

2. **Non-existent Token References Fixed:**
   - `--color-input-placeholder` → `--color-body-textSoft20`
   - `--color-scrollbar-track` → `--color-panel-background`
   - `--color-scrollbar-thumb` → `--color-body-border`
   - `--color-divider` → `--color-body-border`
   - `--color-button-backgroundHover` → `--color-neutral-background`
   - `--color-tag-*` tokens → `--color-neutral-*` equivalents
   - `--color-error-*` → `--color-dangerSoft-*`
   - `--radius-inputSmall` → `--radius-small10`
   - `--radius-tag` → `--radius-small10`
   - `--radius-panel` → `--radius-large10`
   - `--shadow-panel` → `--shadow-card`
   - `--radius-full` → `50%` (CSS standard)
   - `--color-*-backgroundHard10` → base background tokens
   - `--color-*-borderSoft10` → base border tokens
   - `--color-primarySoft-text` → `--color-infoSoft-text`
   - `--color-infoBright-background` → `--color-info-background`
   - `--color-warningBright-background` → `--color-warning-background`
   - `--border-width` → `1px` (hardcoded as token doesn't exist)
   - `--color-panelRaised-*` → `--color-panel-*`
   - `--color-info-backgroundSoft` → `--color-infoSoft-background`
   - `--color-codeBlock-*` → `--color-panel-*` and `--color-body-textSoft10`
   - `--color-buttonNeutral-*` → `--color-neutral-*`
   - `--color-buttonPrimary-*` → `--color-primary-*`
   - `--color-input-placeholderText` → `--color-body-textSoft20`
   - `--duration-slower` → `--duration-slow20`

3. **Hardcoded Pixel Values Fixed:**
   - `2px` padding → `var(--spacing-small20)`
   - `3px` border-radius → `var(--radius-small20)`
   - `4px` gap → `var(--spacing-small20)`
   - `8px` dimensions → `var(--spacing-small10)`
   - `10px` transforms → `var(--spacing-small10)`
   - `12px` font-size → `var(--font-size-small20)`
   - `20px` transforms → `var(--spacing-large5)`
   - `24px` dimensions → `var(--spacing-large10)`
   - `32px` dimensions → `var(--spacing-large20)`

4. **Surface Alignment Issues Fixed:**
   - Ensured body surface tokens used together
   - Ensured panel surface tokens used together
   - Fixed button surface token mixing
   - Corrected primary/neutral/danger surface usage

### Missing Tokens Identified:

1. **Border Width Token:**
   - Intent: Consistent border widths across components
   - Suggested: `--border-width` (default 1px)
   - Currently hardcoding `1px` everywhere

2. **Code Block Surface Tokens:**
   - Intent: Specific styling for code blocks
   - Suggested: `--color-codeBlock-background`, `--color-codeBlock-border`, `--color-codeBlock-text`
   - Currently using panel surface tokens as fallback

3. **Raised Panel Surface:**
   - Intent: Elevated panel variant
   - Suggested: `--color-panelRaised-background`, `--color-panelRaised-border`
   - Currently using standard panel tokens

4. **Alpha Transparency Tokens:**
   - Intent: Soft backgrounds with transparency
   - Several tokens reference RGB values that don't exist for rgba() usage
   - Need RGB value exports for primary colors

### Recommendations:

1. **Add Missing Base Tokens:**
   - Border width token for consistency
   - RGB value exports for colors needing transparency
   - Code block specific surface tokens
   - Raised panel surface variant

2. **Documentation Updates:**
   - Update TOKEN_CHEATSHEET.md with common pitfalls
   - Document that `--radius-full` doesn't exist, use `50%`
   - Document that various `Soft10`, `Hard10` variants don't exist for all surfaces

3. **Component Token Patterns:**
   - Chat components need consistent avatar sizing tokens
   - Input components need placeholder text color token
   - Scrollbar theming tokens would be useful