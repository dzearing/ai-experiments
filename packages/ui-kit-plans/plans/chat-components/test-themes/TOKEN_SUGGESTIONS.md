# Missing Tokens Documentation

This document lists tokens that are missing from the ui-kit token system, discovered during the audit of chat component mockup files.

## Missing Tokens Found

### Syntax Highlighting Colors
**Intent**: Colors for code syntax highlighting in code blocks and diffs
**Found in**: code-diff-visualizer/mockup.html (lines 22-26)
**Suggested tokens**:
- `--color-syntax-keyword`: For language keywords (if, for, function, etc.)
- `--color-syntax-string`: For string literals
- `--color-syntax-comment`: For code comments
- `--color-syntax-function`: For function names
- `--color-syntax-type`: For type annotations

**Current workaround**: Using semantic colors like `--color-info-text`, `--color-success-text`, etc.

### Diff Background Colors with Transparency
**Intent**: Semi-transparent backgrounds for diff highlighting
**Found in**: code-diff-visualizer/mockup.html (lines 29-34)
**Suggested tokens**:
- `--color-diff-add-background`: Background for added lines (green tint)
- `--color-diff-delete-background`: Background for deleted lines (red tint)
- `--color-inline-add-background`: Inline added text background
- `--color-inline-delete-background`: Inline deleted text background

**Current workaround**: Using rgba() values with hardcoded colors

### Avatar Gradients
**Intent**: Gradient backgrounds for AI/system avatars
**Found in**: typing-indicator/mockup.html (line 22), file-attachment/mockup.html
**Suggested tokens**:
- `--gradient-avatar-ai`: AI assistant avatar gradient
- `--gradient-avatar-system`: System avatar gradient
- `--gradient-avatar-user`: User avatar gradient

**Current workaround**: Using linear-gradient with primary colors

### File Type Colors
**Intent**: Semantic colors for different file types
**Found in**: file-attachment/mockup.html (lines 23-27)
**Suggested tokens**:
- `--color-filetype-pdf`: PDF file type color
- `--color-filetype-image`: Image file type color  
- `--color-filetype-document`: Document file type color
- `--color-filetype-code`: Code file type color
- `--color-filetype-archive`: Archive file type color

**Current workaround**: Using semantic colors like `--color-danger-background`, `--color-info-background`

### Component-Specific Tokens

#### Missing Button Hover States
**Found in**: Multiple files using hardcoded hover colors
**Suggested tokens**:
- `--color-buttonNeutral-background-hover`: Neutral button hover
- `--color-buttonSecondary-background`: Secondary button background
- `--color-buttonSecondary-background-hover`: Secondary button hover

#### Missing Surface Tokens
**Found in**: Multiple files
**Suggested tokens**:
- `--color-body-backgroundSoft10`: Slightly different body background
- `--color-assistant-background`: Assistant message background
- `--color-user-background`: User message background

#### Missing Notice/Alert Colors
**Found in**: test-theme.html (lines 74-76)
**Issue**: Using non-existent `--color-noticeInfo-*` tokens
**Should use**: `--color-infoSoft-*` tokens instead

## Hardcoded Values to Fix

### Colors
- `white` → `--color-body-background` or appropriate surface text
- `#333`, `#666` → `--color-body-text` or `--color-body-textSoft10`
- `#ddd`, `#ccc` → `--color-body-border`
- `#007bff`, `#0056b3`, `#004080` → `--color-primary-background` variants
- `rgba(0,0,0,0.05)` → Consider adding `--color-overlay-light`
- `rgba(255,255,255,0.05)` → Consider adding `--color-overlay-dark`

### Spacing
- `2rem` → `--spacing-large20` (32px)
- `1rem` → `--spacing` (16px)
- `0.5rem` → `--spacing-small10` (8px)
- `1.5rem` → `--spacing-large10` (24px)
- `4px` → `--spacing-small20`
- `3px` → No direct token, consider using `--spacing-small20` (4px)
- `6px` → No direct token, consider using `--spacing-small10` (8px)
- `8px` → `--spacing-small10`
- `12px` → `--spacing-small5`
- `24px` → `--spacing-large10`

### Typography
- `24px` → `--font-size-h3` or `--font-size-h4`
- `18px` → `--font-size-h5` or `--font-size-large20`
- `14px` → `--font-size`
- `13px` → `--font-size-small10`
- `12px` → `--font-size-small20`
- `11px` → `--font-size-smallest`
- `9px` → No token, smaller than smallest
- `500` → `--font-weight-medium`
- `600` → `--font-weight-semibold`
- `1.5` → `--line-height` or `--line-height-normal`
- `1.6` → Close to `--line-height-relaxed` (1.75)
- `1.4` → Between normal and tight

### Border Radius
- `8px` → `--radius-large10`
- `4px` → `--radius-small10`
- `3px` → Close to `--radius-small20` (2px) or `--radius-small10` (4px)
- `50%` → Keep as is for circles

### Shadows
- `0 2px 8px rgba(0,0,0,0.1)` → `--shadow-card`
- Box shadow values → Use appropriate `--shadow-*` tokens

### Animations
- `0.3s` → `--duration-normal` (300ms)
- `0.2s` → `--duration-fast10` (200ms)
- `1.4s`, `1.5s` → No exact token, closest is `--duration-slowest` (1000ms)

### Missing Tokens for Common Patterns
- Input padding X/Y tokens
- Overlay colors for light/dark themes
- More granular spacing tokens (3px, 6px equivalents)
- Animation durations between 1s and 2s
- Font sizes smaller than 11px