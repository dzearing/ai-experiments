# Adding Icons Guide

This guide explains how to add new icons to the `@ui-kit/icons` package.

## 1. Design Guidelines

### SVG Requirements

- **Viewbox**: Use `viewBox="0 0 24 24"` (24x24 grid)
- **Fill**: Set `fill="none"` on the root SVG element
- **Stroke color**: Use `stroke="currentColor"` so the icon inherits text color
- **Stroke width**: Use `stroke-width="2"` for primary strokes (1-1.5 for fine details)
- **Stroke caps/joins**: Use `stroke-linecap="round" stroke-linejoin="round"` for a consistent look

### Visual Guidelines

- Keep icons simple and recognizable at small sizes (16px-24px)
- Maintain consistent stroke weight across all icons
- Center the icon within the 24x24 viewbox with ~2px padding
- Use rounded corners and caps for a friendly, modern look
- Avoid overly detailed or complex shapes

### Example SVG Structure

```svg
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/>
  <path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>
```

## 2. File Location

Place SVG files in the appropriate category folder under `src/svgs/`:

```
src/svgs/
├── actions/       # User actions: add, delete, copy, paste, save, etc.
├── navigation/    # Arrows, chevrons, menu, home, back, forward
├── status/        # Check, error, warning, info indicators
├── editor/        # Text formatting: bold, italic, lists, headings
└── misc/          # General purpose: user, settings, bell, calendar
```

### Naming Convention

- Use **kebab-case** for file names: `my-icon.svg`
- The file name becomes the icon name and component name:
  - `my-icon.svg` → `MyIconIcon` component
  - `arrow-left.svg` → `ArrowLeftIcon` component

## 3. Adding Search Keywords

After adding your SVG, add search keywords so users can find the icon by related terms.

Edit `src/svgs/icon-keywords.yaml`:

```yaml
icons:
  # ... existing icons ...

  my-icon:
    - alias1
    - alias2
    - related term
    - another keyword
```

### Keyword Tips

- Include common synonyms (e.g., "trash" for delete, "cog" for gear)
- Include related concepts (e.g., "save" for download)
- Include abbreviations users might search (e.g., "config" for configuration)
- Keep keywords lowercase

### Example Keywords

```yaml
icons:
  gear:
    - cog
    - settings
    - options
    - config
    - configuration
    - preferences

  delete:
    - trash
    - remove
    - bin
    - garbage
    - discard
```

## 4. Build and Validate

### Build the Package

```bash
# From the icons package directory
pnpm build
```

This will:
- Generate React components for all icons
- Create the SVG sprite
- Build the search index with your keywords
- Generate TypeScript types
- **Update `package.json` exports** with explicit entry for the new icon

### Package Exports (Auto-Generated)

The build script automatically updates the `exports` field in `package.json` with an explicit entry for each icon. This avoids wildcard exports which could accidentally expose internal files.

For example, adding `my-icon.svg` will generate:

```json
{
  "exports": {
    "./MyIconIcon": {
      "types": "./dist/MyIconIcon.d.ts",
      "import": "./dist/MyIconIcon.js"
    }
  }
}
```

This allows consumers to import with:
```tsx
import { MyIconIcon } from '@ui-kit/icons/MyIconIcon';
```

**Important**: The exports are regenerated on every build, so you don't need to manually edit `package.json`.

### View in Storybook

```bash
pnpm dev:storybook
```

Open http://localhost:6007 to see your icon in the catalog.

### Validation Checklist

- [ ] Icon renders correctly at 16px, 24px, and 32px sizes
- [ ] Icon is visible in both light and dark themes
- [ ] Stroke weight matches other icons visually
- [ ] Icon is centered in the viewbox
- [ ] Search keywords work in Storybook search
- [ ] No console errors or warnings

### Visual Testing with Playwright

You can verify the icon renders correctly by viewing the SVG directly:

```bash
# Navigate to the SVG in a browser
open src/svgs/category/my-icon.svg
```

## 5. Quick Reference

| Step | Action |
|------|--------|
| 1 | Create SVG following design guidelines |
| 2 | Save to appropriate `src/svgs/{category}/` folder |
| 3 | Add keywords to `src/svgs/icon-keywords.yaml` |
| 4 | Run `pnpm build` |
| 5 | Verify in Storybook with `pnpm dev:storybook` |

## Troubleshooting

### Icon not appearing after build

- Ensure the file has `.svg` extension
- Check that the SVG has valid XML structure
- Verify the viewBox attribute is set

### Icon colors not working

- Make sure you're using `stroke="currentColor"` (not a hardcoded color)
- Check that `fill="none"` is set on the root SVG

### Icon looks different from others

- Compare stroke-width with similar icons
- Check padding/positioning within the 24x24 viewbox
- Ensure stroke-linecap and stroke-linejoin are set to "round"
