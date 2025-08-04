# @claude-flow/ui-kit-icons

SVG icon library for the Claude Flow design system.

## Overview

This package provides a comprehensive set of optimized SVG icons as React components. All icons follow consistent design principles and integrate seamlessly with the Claude Flow theme system.

## Features

- 🎨 **Theme Integration**: Icons automatically adapt to light/dark themes
- 🌳 **Tree-Shakable**: Import only the icons you need
- ♿ **Accessible**: Proper ARIA attributes and semantic markup
- 📦 **TypeScript**: Full type safety with comprehensive interfaces
- 🎯 **Consistent**: Unified design system across all icons
- ⚡ **Optimized**: SVG files are optimized for minimal bundle size

## Installation

This package is part of the Claude Flow monorepo and is installed automatically with the workspace.

```bash
pnpm install
```

## Usage

### Basic Usage

Import icons individually for optimal tree-shaking:

```tsx
import { SaveIcon, EditIcon, DeleteIcon } from '@claude-flow/ui-kit-icons';

function MyComponent() {
  return (
    <div>
      <SaveIcon size={20} />
      <EditIcon size={24} className="text-primary" />
      <DeleteIcon size={16} title="Delete item" />
    </div>
  );
}
```

### Props

All icon components accept the following props:

```tsx
interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;  // Default: 24
  title?: string;          // For accessibility
}
```

### Accessibility

Icons are decorative by default (hidden from screen readers). To make an icon semantic, provide a `title` prop:

```tsx
{/* Decorative icon */}
<SaveIcon size={20} />

{/* Semantic icon */}
<SaveIcon size={20} title="Save document" />
```

### Styling

Icons use `currentColor` and inherit styling from their parent:

```tsx
{/* Theme colors */}
<SaveIcon className="text-primary" />
<EditIcon className="text-success" />
<DeleteIcon className="text-error" />

{/* Custom styling */}
<SaveIcon 
  size={32}
  className="text-blue-500 hover:text-blue-700 transition-colors" 
/>

{/* Responsive sizing */}
<SaveIcon size="clamp(16px, 4vw, 24px)" />
```

## Development

### Local Development

Start Storybook to browse and test icons:

```bash
cd packages/ui-kit-icons
pnpm dev
```

This will start Storybook at `http://localhost:6007` with:
- Icon catalog with search and filtering
- Interactive size and color controls
- Copy-to-clipboard import statements
- Usage examples and documentation

### Adding New Icons

1. Add SVG files to the appropriate category folder:
   ```
   src/svgs/
   ├── actions/     # save, edit, delete, etc.
   ├── navigation/  # arrows, chevrons, menu, etc.
   ├── status/      # check, error, warning, etc.
   ├── editor/      # bold, italic, heading, etc.
   └── misc/        # settings, user, folder, etc.
   ```

2. Build the package to generate React components:
   ```bash
   pnpm build
   ```

3. The build process will:
   - Optimize SVG files
   - Generate React components
   - Update the main index.ts exports

### Icon Design Guidelines

When creating new icons:

- **Size**: Design at 24×24 pixel artboard
- **Stroke**: Use 2px stroke width
- **Style**: Rounded line caps and joins
- **Color**: Use `currentColor` for strokes/fills
- **Optimization**: Run through SVGO or similar
- **Naming**: Use kebab-case for files (e.g., `save-document.svg`)

Example SVG structure:
```xml
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path 
    d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" 
    stroke="currentColor" 
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
```

## Available Icons

Currently, this package is set up but contains no icons. Icons will be added by design specialists following the established patterns.

The package is ready to receive icons in these categories:

### Actions (Priority 1)
- save, edit, delete, add, remove
- copy, paste, cut, undo, redo
- search, filter, refresh, sync
- download, upload, share, export

### Navigation (Priority 1)
- arrow-up, arrow-down, arrow-left, arrow-right
- chevron-up, chevron-down, chevron-left, chevron-right
- menu, close, home, back, forward
- expand, collapse

### Status (Priority 1)
- check, check-circle, x, x-circle
- warning, warning-triangle
- info, info-circle, error, error-circle
- loading, spinner

### Editor (Priority 1)
- bold, italic, underline, strikethrough
- heading-1, heading-2, heading-3
- list-bullet, list-ordered, list-task
- quote, code, code-block, link, image, table
- indent, outdent

### Miscellaneous (Priority 2)
- settings, gear, user, users
- folder, file, calendar, clock
- bell, notification, star, heart
- comment, chat

## Scripts

```bash
# Build the package
pnpm build

# Start Storybook development server
pnpm dev

# Build Storybook for production
pnpm build:storybook

# Run linting
pnpm lint

# Run type checking
pnpm typecheck

# Clean build artifacts
pnpm clean
```

## Integration

This package integrates with:

- **@claude-flow/ui-kit**: Theme system and design tokens
- **@claude-flow/ui-kit-react**: React components that use these icons
- **Storybook**: Documentation and development environment

## Contributing

1. Follow the established design guidelines
2. Add icons to appropriate category folders
3. Test in Storybook before submitting
4. Ensure accessibility standards are met
5. Update documentation if needed

## License

Internal Claude Flow package - see main repository license.