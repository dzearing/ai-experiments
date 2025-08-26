---
description: Add a new icon to ui-kit-icons package from a description
argument-hint: <description of the icon you want>
---

# Add Icon to UI Kit

I'll create a new icon for the `@claude-flow/ui-kit-icons` package based on your description.

## Input
Description: $ARGUMENTS

## Process

### 1. Analyze Requirements
- Parse the description: $ARGUMENTS
- Generate an appropriate kebab-case icon name
- Determine the best group based on the icon's purpose:
  - **actions**: User actions (add, delete, save, copy, etc.)
  - **editor**: Text/content editing (bold, italic, lists, etc.)
  - **misc**: General purpose (bell, calendar, user, etc.)
  - **navigation**: Navigation/directional (arrows, chevrons, menu, etc.)
  - **status**: States/feedback (check, error, warning, info, etc.)
- Check existing icons to avoid duplicates

### 2. Design the Icon
- Create a simple, clear SVG design
- Follow design principles:
  - 24x24 pixel grid
  - 2px stroke width for consistency
  - Minimalist, recognizable shapes
  - Works at small sizes
  - Uses currentColor for theming

### 3. Implementation Steps

1. **Create SVG file** at `packages/ui-kit-icons/src/svgs/{group}/{icon-name}.svg`
2. **Generate React component** at `packages/ui-kit-icons/src/components/{IconName}Icon.tsx`
3. **Update exports** in `packages/ui-kit-icons/src/index.ts`
4. **Update documentation** in `/docs/guides/ICONS_CHEATSHEET.md`
5. **Build and verify** with `pnpm build`

### 4. Quality Checks
- Ensure SVG is optimized and clean
- Verify component follows existing patterns
- Check alphabetical ordering in exports
- Confirm documentation is updated

## Expected Output

I will:
1. Generate an appropriate icon name from your description
2. Select or suggest the best group
3. Create a custom SVG design
4. Add the icon to the package
5. Update all necessary files
6. Provide usage instructions

The icon will be ready to use as:
```typescript
import { YourNewIcon } from '@claude-flow/ui-kit-icons';
```