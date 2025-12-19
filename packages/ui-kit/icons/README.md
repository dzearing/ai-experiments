# @ui-kit/icons

A scalable icon library with React components, SVG sprites, WOFF2 fonts, and PNG exports.

## Features

- **89 icons** organized into 5 categories
- **Multiple consumption formats**: React components, SVG sprite, icon font (WOFF2), PNGs
- **Tree-shakable imports**: Only the icons you use are included in your bundle
- **Searchable Storybook catalog**: Find icons by name or keyword
- **Font subset generator**: Create custom WOFF2 fonts with only the icons you need
- **TypeScript support**: Full type definitions for all icons and utilities

## Installation

```bash
pnpm add @ui-kit/icons
```

## Usage

### React Components

Import icons individually for optimal tree-shaking:

```tsx
import { SaveIcon } from '@ui-kit/icons/SaveIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';

function Toolbar() {
  return (
    <div>
      <button>
        <SaveIcon size={20} title="Save document" />
      </button>
      <button>
        <EditIcon size={20} />
      </button>
    </div>
  );
}
```

**Note:** There is no barrel export. Each icon must be imported individually to ensure optimal bundle size.

### Icon Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number \| string` | `24` | Icon size (width and height) |
| `title` | `string` | - | Accessible title (makes icon semantic) |
| `className` | `string` | - | CSS class name |
| `...props` | `SVGProps` | - | All SVG attributes |

### SVG Sprite

For SSR-optimized rendering or non-React environments:

```html
<!-- Include the sprite in your HTML -->
<svg style="display: none;">
  <!-- Contents of dist/sprite/sprite.svg -->
</svg>

<!-- Use icons with <use> -->
<svg viewBox="0 0 24 24" width="24" height="24">
  <use href="#save" />
</svg>
```

### Icon Font

For legacy environments or email templates:

```html
<!-- Include the CSS -->
<link rel="stylesheet" href="@ui-kit/icons/font/icons.css">

<!-- Use icons with CSS classes -->
<i class="icon icon-save"></i>
<i class="icon icon-edit"></i>
```

## Available Icons

### Actions (33 icons)
add, add-circle, copy, cut, delete, download, edit, export, fast-forward, filter, maximize, minimize, next-track, paste, pause, play, pop-in, pop-out, previous-track, redo, refresh, remove, restore, rewind, save, search, share, stop, sync, undo, upload, zoom-in, zoom-out

### Navigation (15 icons)
arrow-down, arrow-left, arrow-right, arrow-up, back, chevron-down, chevron-left, chevron-right, chevron-up, close, collapse, expand, forward, home, menu

### Status (9 icons)
check, check-circle, error, error-circle, info, info-circle, warning, warning-triangle, x-circle

### Editor (18 icons)
bold, code, code-block, heading-1, heading-2, heading-3, image, indent, italic, link, list-bullet, list-ordered, list-task, outdent, quote, strikethrough, table, underline

### Misc (14 icons)
bell, calendar, chat, clock, comment, file, folder, gear, heart, hourglass, settings, star, user, users

## Storybook

Run Storybook to explore all icons with search and filtering:

```bash
pnpm dev:storybook
```

Features:
- **Icon Catalog**: Browse all icons, search by name or keyword, click to copy import
- **Font Subset Generator**: Select icons and generate custom WOFF2 fonts

## Build

```bash
# Build the package
pnpm build

# Build outputs:
# dist/
#   {IconName}.js     - Individual icon components
#   types.js          - TypeScript type definitions
#   sprite/           - SVG sprite sheet
#   font/             - Icon font CSS and icon map
#   metadata/         - Icon metadata and search index
```

## Adding New Icons

See [ICON_GUIDE.md](./ICON_GUIDE.md) for detailed instructions.

**Quick start:**
1. Create `src/svgs/my-icon.svg` with your SVG
2. Create `src/svgs/my-icon.json` with metadata (name, category, keywords)
3. Run `pnpm build`

The build process:
- Reads all SVGs and JSON metadata from `src/svgs/`
- Generates React components in `src/components/` (gitignored)
- Builds to `dist/` with all formats
- **Updates `package.json` exports map** with explicit entries for each icon

**Single source of truth**: Only the SVGs and JSON metadata in `src/svgs/` are committed. Everything else is generated.

### Package Exports

The build automatically generates explicit exports in `package.json` for each icon. This ensures:

- **Stable API contract** - Only declared exports are public
- **No accidental exposure** - Internal files/folders cannot be imported
- **Type safety** - Each export includes TypeScript definitions
- **No barrel export** - Each icon must be imported individually

Example of generated exports:
```json
{
  "exports": {
    "./types": { "types": "./dist/types.d.ts", "import": "./dist/types.js" },
    "./CloseIcon": { "types": "./dist/CloseIcon.d.ts", "import": "./dist/CloseIcon.js" },
    "./ChevronDownIcon": { "types": "./dist/ChevronDownIcon.d.ts", "import": "./dist/ChevronDownIcon.js" },
    "./sprite.svg": "./dist/sprite/sprite.svg",
    "./font/icons.css": "./dist/font/icons.css"
  }
}
```

When you add a new icon, the exports are regenerated automatically during build.

### SVG Requirements

- **ViewBox**: `0 0 24 24`
- **Stroke-based**: Use `stroke="currentColor"` for theme support
- **No fill**: Use `fill="none"` for outline style
- **Stroke width**: 2px recommended
- **Line caps**: Round (`stroke-linecap="round"`)
- **Line joins**: Round (`stroke-linejoin="round"`)

Example:
```xml
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

## License

Private - Internal use only.
