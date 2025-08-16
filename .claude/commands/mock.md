# Generate HTML Mockup

Generate a comprehensive, production-ready HTML mockup for: $ARGUMENTS

## IMPORTANT: Follow the mockup-guide.md EXACTLY

1. **READ FIRST**: Read `packages/ui-kit-plans/plans/mockup-guide.md` completely
2. **FOLLOW ALL STEPS**: Follow every step in the guide exactly, including:
   - File naming conventions
   - Directory structure
   - HTML template requirements
   - Updating plan-data.json (CRITICAL - never skip this)
   - All verification steps

3. **USE DESIGN TOKENS**: Read `docs/guides/TOKEN_CHEATSHEET.md` for the token system

## Additional Requirements for This Mockup

Based on the user's request: "$ARGUMENTS"

Consider the following when creating the mockup:
- Determine if multiple mockup files are needed for different scenarios
- If creating a single component, show multiple states in one HTML file
- If creating a complex view, consider separate mockup files for each major variation
- Be creative in representing information visually

## Required Sections
Include ALL of these sections with detailed implementations:

### Default Configuration
- Show the component in its most common usage
- Include realistic content and data
- Demonstrate primary functionality

### Interactive States
- Normal state
- Hover state (with proper :hover CSS)
- Focus state (with focus-visible outline)
- Active/pressed state
- Disabled state
- Loading state (if applicable)
- Error state (if applicable)

### Component Variants
- Primary variant
- Secondary/neutral variant
- Success variant (if applicable)
- Danger/destructive variant (if applicable)
- Warning variant (if applicable)
- Outline/ghost variant
- Different sizes (small, medium, large)
- With/without icons
- Different layouts/orientations

### Composition Examples
- Used within a form
- Inside a card/panel
- In a modal/dialog
- As part of a list
- Within a navigation structure
- Combined with other components

### Responsive Behavior
- Mobile layout (< 768px)
- Tablet layout (768px - 1024px)
- Desktop layout (> 1024px)
- Use CSS Grid and Flexbox for layouts
- Show how component adapts to different screen sizes

### Accessibility Features
- Semantic HTML elements (button, nav, main, article, section, etc.)
- Proper ARIA labels and roles
- Keyboard navigation support (Tab, Enter, Space, Arrow keys)
- Focus management
- Screen reader announcements
- Color contrast compliance

## 4. Design Token Usage
ONLY use design tokens from `/docs/guides/TOKEN_CHEATSHEET.md`:

### Required tokens:
- Colors: Use surface-based color system (--color-[surface]-[concept])
- Spacing: Use 4px grid tokens (--spacing, --spacing-small10, etc.)
- Typography: Use font tokens (--font-size, --font-weight, etc.)
- Borders: Use radius tokens (--radius-interactive, --radius-container)
- Shadows: Use shadow tokens (--shadow-small10, --shadow-card)
- Transitions: Use duration and easing tokens

### NEVER use:
- Hardcoded colors (#ffffff, rgb(), etc.)
- Hardcoded spacing (16px, 1rem, etc.)
- Hardcoded fonts or sizes
- Mix colors from different surfaces

## 5. Interactive JavaScript
Add JavaScript for:
- State management (toggle states, selections)
- Form validation
- Keyboard event handlers
- ARIA attribute updates
- Smooth transitions and animations
- Ripple effects or micro-interactions
- Console logging for debugging

## 6. CSS Best Practices
- Use CSS custom properties for all values
- Implement smooth transitions
- Add hover/focus states for all interactive elements
- Use CSS Grid and Flexbox for layouts
- Include print styles if relevant
- Add animation keyframes for loading states

## 7. Testing Requirements
Ensure the mockup:
- Works in both light and dark modes
- Functions with keyboard only
- Has proper tab order
- Maintains 4.5:1 color contrast ratio
- Scales properly on zoom (up to 200%)
- Works without JavaScript

## 8. Generate comprehensive, detailed implementation
- Make the mockup as thorough and production-ready as possible
- Include realistic data and content
- Add helpful comments in the code
- Implement all interactive behaviors
- Create a visually polished result

## 9. Final Verification Checklist

Before completing the /mock command, verify:

✅ Mockup files are in: `packages/ui-kit-plans/plans/{category}/{component-name}/mockups/`
✅ Files named as: `mock-{component-name}-{scenario}.html` (NOT mockup-*.html)
✅ All mockups include proper ui-kit asset links from mockup-guide.md
✅ Design tokens are used exclusively (no hardcoded values)
✅ `plan-data.json` has been updated with the new category/component entry
✅ All mockup file paths are correctly listed in the plan-data.json mockups array
✅ The mockups are accessible with ARIA labels and keyboard navigation

## 10. Summary Output

After generating mockups, provide a summary:
- Category created/used: {category}
- Component folder: {component-name}
- Mockups created:
  - mock-{component-name}-{scenario1}.html
  - mock-{component-name}-{scenario2}.html
- plan-data.json: ✅ Updated with {number} mockup entries

Generate the complete HTML mockup now with all sections fully implemented. Make it thorough, detailed, and production-ready.