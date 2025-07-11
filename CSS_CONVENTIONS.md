# CSS conventions

## Z-index layering system

To maintain a consistent and predictable layering system across the application, we follow these z-index conventions:

### Z-index scale

```css
/* Base content */
z-0    /* Background patterns, decorative elements */
z-10   /* Elevated content (sidebars, cards with elevation) */

/* Overlays and floating elements */
z-50   /* Dropdowns, popovers, floating UI elements */

/* Modal dialogs */
z-50   /* Standard modals and dialogs */
z-[9999] /* Critical system dialogs (feedback, errors) */
```

### Current usage patterns

1. **Background elements** (`z-0`)
   - BackgroundPattern components
   - Decorative elements that should always be behind content

2. **Page layout** (`z-10`)
   - Sidebar navigation
   - Main content areas with elevation

3. **Floating UI** (`z-50`)
   - Dropdown menus (SettingsMenu, AuthAvatar)
   - Popovers and tooltips
   - Theme switcher
   - Toast notifications
   - Standard dialogs (ConfirmDialog, WorkspaceDialogs, etc.)

4. **Critical overlays** (`z-[9999]`)
   - FeedbackDialog
   - FeedbackSuccessDialog
   - System-critical modals that must appear above all other content

### Guidelines

1. **Use sparingly**: Only set z-index when absolutely necessary for proper layering
2. **Stick to the scale**: Use the predefined values above rather than arbitrary numbers
3. **Document exceptions**: If you need a value outside the scale, document why
4. **Consider alternatives**: Before adding z-index, consider if proper DOM order or position context can solve the issue
5. **Portal for modals**: Use React Portals for modals to ensure they render at document root level

### Common patterns

#### Modals and dialogs
```tsx
// Standard dialog
<div className="fixed inset-0 z-50 overflow-y-auto">
  <div className="backdrop" />
  <div className="dialog-content" />
</div>

// Critical system dialog
<div className="fixed inset-0 z-[9999] overflow-y-auto">
  <div className="backdrop" />
  <div className="dialog-content" />
</div>
```

#### Dropdown menus
```tsx
<div className="relative">
  <button>Trigger</button>
  <div className="absolute z-50">
    {/* Dropdown content */}
  </div>
</div>
```

#### Fixed position elements
```tsx
// Toast notifications
<div className="fixed bottom-4 right-4 z-50">
  {/* Toast content */}
</div>
```

### Debugging z-index issues

If you encounter layering issues:

1. Check if the element has a proper stacking context (position: relative/absolute/fixed)
2. Verify the z-index value follows our scale
3. Consider if a React Portal would better solve the issue
4. Check parent elements for transform, filter, or other properties that create new stacking contexts

### Future considerations

As the application grows, we may need to:
- Add more granular levels between existing values
- Create component-specific z-index variables
- Implement a z-index management system for complex nested components