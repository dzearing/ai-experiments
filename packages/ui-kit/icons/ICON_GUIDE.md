# Icon Guide

## Adding a New Icon

Adding an icon requires two files in `src/svgs/`:

### 1. Create the SVG file: `{name}.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <path d="..." stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**Requirements:**
- `viewBox="0 0 24 24"` - 24x24 grid
- `fill="none"` - no fill
- `stroke="currentColor"` - allows color theming
- Use kebab-case: `my-icon.svg` becomes `MyIconIcon`

### 2. Create the metadata file: `{name}.json`

```json
{
  "name": "my-icon",
  "category": "actions",
  "keywords": ["my", "icon", "related", "terms"]
}
```

**Categories:** `actions` | `navigation` | `status` | `editor` | `misc`

### 3. Build

```bash
pnpm build
```

Done! The build generates the React component, types, sprite symbol, and search metadata.

## Using Icons

Import icons individually (no barrel export):

```tsx
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { SearchIcon } from '@ui-kit/icons/SearchIcon';

<AddIcon />                    // Default 24px
<AddIcon size={32} />          // Custom size
<AddIcon title="Add item" />   // Accessible title
<AddIcon className="my-class" />
```

## File Structure

```
src/svgs/
  add.svg          # SVG source (single source of truth)
  add.json         # Metadata (name, category, keywords)
  search.svg
  search.json
  ...

src/components/    # Generated - do not edit
dist/              # Generated - build output
```

## Design Guidelines

- Keep icons simple and recognizable at 16-24px
- Use consistent stroke width (2px standard, 1-1.5px for details)
- Center within 24x24 with ~2px padding
- Use rounded caps/joins for a friendly look

## Viewing Icons

```bash
pnpm dev    # Opens Storybook at http://localhost:6007
```
