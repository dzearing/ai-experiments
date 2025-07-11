# Z-Index Guidelines

## Core Principle

**Z-index should ONLY be used when content needs to overlay other content.** If an element doesn't need to appear above something else, it shouldn't have a z-index.

## When to Use Z-Index

### ✅ USE z-index for:

1. **Dropdown menus** - Need to appear above page content
   - Example: `AuthAvatar`, `SettingsMenu`
   - Use: `z-50`

2. **Modal dialogs** - Need to appear above everything
   - Example: `FeedbackDialog`, `ConfirmDialog`
   - Use: `z-50`

3. **Tooltips** - Need to appear above their trigger elements
   - Use: `z-50`

4. **Toast notifications** - Need to appear above page content
   - Use: `z-50`

5. **Fixed headers/footers** - When they need to stay above scrolling content
   - Use: `z-10`

### ❌ DON'T use z-index for:

1. **Main content areas** - They don't overlay anything
   - Bad: `<main className="z-10">`
   - Good: `<main>`

2. **Regular layout sections** - Sidebars, content areas, etc.
   - Bad: `<aside className="z-10">`
   - Good: `<aside>`

3. **Background decorations** - Use natural stacking order
   - Bad: Background with `z-0`, content with `z-10`
   - Good: Background first in DOM, content after (no z-index needed)

## Z-Index Scale

When z-index IS needed, use this consistent scale:

- `z-10` - Sticky elements (headers, footers)
- `z-20` - Floating UI (tooltips, popovers) 
- `z-30` - Overlays (dropdown menus)
- `z-40` - Modal backdrops
- `z-50` - Modal content

## Common Mistakes

1. **Adding z-index "just in case"** - Only add when you encounter an actual stacking issue
2. **Using z-index to fix layout issues** - Fix the root cause instead
3. **Arbitrary high values** - Stick to the scale above

## Debugging Z-Index Issues

If content appears behind something it shouldn't:

1. First check if the overlay element has appropriate z-index
2. Check for `position: relative/absolute/fixed` on the element
3. Look for parent elements creating new stacking contexts
4. Use browser DevTools to inspect computed z-index values

Remember: Most layout issues can be solved without z-index through proper DOM ordering and positioning.