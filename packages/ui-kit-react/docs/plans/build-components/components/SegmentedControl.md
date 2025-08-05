# SegmentedControl Component Plan

## Overview

### Description
A segmented control is a UI component that displays a group of options where only one option can be selected at a time. It's similar to radio buttons but presented as connected buttons in a single row, providing a more compact and visually cohesive interface for mutually exclusive choices.

### Visual Design Mockups
- [Default State](./mockups/segmented-control-default.html)
- [Interactive States](./mockups/segmented-control-interactive.html)
- [Responsive Behavior](./mockups/segmented-control-responsive.html)
- [Dark Mode](./mockups/segmented-control-dark.html)
- [All Variants](./mockups/segmented-control-variants.html)

### Key Features
- Single selection from multiple options
- Smooth animated selection indicator
- Full keyboard navigation support
- Responsive design with overflow handling
- Icon and text support
- Multiple size variants
- Accessible with proper ARIA attributes

### Use Cases
- View mode switching (e.g., List/Grid/Map views)
- Tab-like navigation within a component
- Filter controls (e.g., All/Active/Completed)
- Time period selection (e.g., Day/Week/Month/Year)
- Display preference toggles
- Settings options selection

## API Design

### Props Interface

| Prop Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| **Required Props** |
| options | `SegmentOption[]` | ✓ | - | Array of options to display |
| value | `string` | ✓ | - | Currently selected value |
| onChange | `(value: string) => void` | ✓ | - | Handler called when selection changes |
| **Optional Props** |
| size | `'small' \| 'medium' \| 'large'` | - | `'medium'` | Size of the control |
| fullWidth | `boolean` | - | `false` | Whether control should fill container width |
| disabled | `boolean` | - | `false` | Disable entire control |
| name | `string` | - | - | Name for form integration |
| ariaLabel | `string` | - | - | Accessible label for the control |
| ariaLabelledBy | `string` | - | - | ID of element that labels the control |
| className | `string` | - | - | Additional CSS classes |
| **Visual Options** |
| variant | `'pills' \| 'square' \| 'underline'` | - | `'pills'` | Visual style variant |
| color | `'primary' \| 'secondary' \| 'neutral'` | - | `'primary'` | Color scheme |
| showDividers | `boolean` | - | `true` | Show dividers between segments |
| **Event Handlers** |
| onFocus | `(event: FocusEvent) => void` | - | - | Focus event handler |
| onBlur | `(event: FocusEvent) => void` | - | - | Blur event handler |

### SegmentOption Interface

```typescript
interface SegmentOption {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  tooltip?: string;
  ariaLabel?: string;
}
```

### CSS Classes & Theming
*Implementation will follow guidelines in [component-implementation-guide.md](./component-implementation-guide.md)*

- Component-specific classes needed:
  - Variants: `.variant-pills`, `.variant-square`, `.variant-underline`
  - States: `.selected`, `.disabled`, `.focused`
  - Elements: `.container`, `.option`, `.indicator`, `.divider`
- Special styling considerations:
  - Smooth sliding animation for selection indicator
  - Consistent spacing between segments
  - Proper contrast ratios for accessibility
  - Responsive behavior for small screens

## Dependencies

### External Dependencies
- [x] None

### Internal Dependencies
- [x] Design tokens from `@claude-flow/ui-kit`
- [x] Utilities: `mergeProps` utility for prop merging
- [ ] Components: None
- [ ] Hooks: None

## Dependent Components

### Direct Dependents
Components that will directly import and use this component:
- Filter components - For switching between filter views
- View switchers - For toggling between list/grid/card views
- Navigation bars - For section navigation
- Settings panels - For preference selection

### Indirect Dependents
Components that may benefit from patterns established here:
- TabList - Similar selection pattern
- RadioGroup - Similar single-selection behavior
- ToggleButtonGroup - Similar visual structure

## Internal Architecture

### Sub-components
Internal components that won't be exported but help organize the implementation:
- `SegmentedControlOption` - Individual segment button
- `SelectionIndicator` - Animated selection background

### Hooks
Custom hooks this component needs:
- `useSegmentedControl` - Manages selection state and keyboard navigation
- `useIndicatorPosition` - Calculates position/size for sliding indicator

### Utilities
Helper functions or utilities:
- `calculateIndicatorStyle` - Computes CSS properties for indicator animation
- `getEnabledOptions` - Filters out disabled options for navigation

## Performance Considerations

### Rendering Strategy
- [x] Frequent re-renders expected (selection changes)
- [x] Animation/transition heavy (sliding indicator)
- [ ] Static component
- [ ] Large lists or data sets
- [ ] Async data loading

### Optimization Approaches
- **Memoization**: 
  - [x] Component memoization with `React.memo`
  - [x] Expensive calculations with `useMemo` (indicator position)
  - [x] Event handlers with `useCallback`
  - Memoize option rendering to prevent unnecessary re-renders

- **Lazy Loading**:
  - [ ] Not applicable for this component

- **Initial Render**:
  - [x] All options render immediately
  - [x] Indicator positioned on selected option
  - [ ] No deferred content
  - [x] CSS transitions handle animation smoothly

### Bundle Size Impact
- Estimated size: ~3-4KB minified
- No external dependencies
- CSS can be tree-shaken if not used

## Accessibility

### ARIA Requirements
- [x] Role attributes: `role="radiogroup"` on container
- [x] `role="radio"` on each option
- [x] `aria-checked` state on options
- [x] `aria-label` or `aria-labelledby` on group
- [x] `aria-disabled` for disabled options/group

### Keyboard Navigation
- [x] Tab to focus the control
- [x] Arrow keys to navigate between options
- [x] Space/Enter to select focused option
- [x] Home/End keys to jump to first/last option
- [x] Skip disabled options during navigation

### Screen Reader Support
- [x] Announce group label and selected option
- [x] Announce option count and position
- [x] State changes announced when selection changes
- [x] Disabled state properly communicated

## Testing Strategy

### Unit Tests
- [x] **Props validation** - All prop combinations work correctly
- [x] **State management** - Selection state updates properly
- [x] **Event handling** - onChange fires with correct value
- [x] **Edge cases** - No options, all disabled, single option
- [x] **Accessibility** - ARIA attributes, keyboard navigation

### Integration Tests
- [x] **Form integration** - Works with form libraries
- [x] **Controlled/Uncontrolled** - Both modes supported
- [x] **Theme integration** - Respects design tokens
- [x] **Responsive behavior** - Handles container resize

### Visual Regression Tests
- [x] **All variants** - Default, pills, underline
- [x] **States** - Hover, focus, selected, disabled
- [x] **Themes** - Light/dark mode
- [x] **Sizes** - Small, medium, large
- [x] **With icons** - Icon-only and icon+text

## Storybook Stories

### Essential Stories
- [x] **Default** - Basic 3-option example with pills variant
- [x] **Playground** - All props interactive
- [x] **Sizes** - Small, medium, large examples
- [x] **Variants** - All visual variants

### Interaction Stories
- [x] **With Icons** - Icon and text combinations
- [x] **Controlled** - External state management
- [x] **Form Integration** - Within a form context
- [x] **Full Width** - Responsive full-width mode

### Edge Case Stories
- [x] **Many Options** - Overflow behavior
- [x] **Single Option** - Edge case handling
- [x] **All Disabled** - Fully disabled state
- [x] **Long Labels** - Text truncation handling

### Composition Stories
- [x] **View Switcher** - List/Grid/Map example
- [x] **Filter Control** - All/Active/Archived
- [x] **Time Period** - Day/Week/Month/Year

## Similar Components in Open Source

### Prior Art Research
- **Material-UI ToggleButtonGroup** - [Link](https://mui.com/material-ui/react-toggle-button/)
  - Good: Smooth animations, accessible
  - Avoid: Complex API for simple use cases
  - Adopt: Keyboard navigation pattern

- **Ant Design Segmented** - [Link](https://ant.design/components/segmented)
  - Good: Clean API, nice animations
  - Avoid: Limited customization
  - Adopt: Option structure

- **Chakra UI Tabs** - [Link](https://chakra-ui.com/docs/components/tabs)
  - Good: Excellent accessibility
  - Avoid: Separate tab/panel structure
  - Adopt: ARIA implementation

- **Mantine SegmentedControl** - [Link](https://mantine.dev/core/segmented-control/)
  - Good: Simple API, good defaults
  - Avoid: Heavy styling dependencies
  - Adopt: Size variants approach

### API Comparison
| Library | Prop Name | Our Equivalent | Notes |
|---------|-----------|----------------|-------|
| MUI | value/onChange | value/onChange | Same pattern |
| Ant | options | options | Same structure |
| Mantine | data | options | We use clearer name |
| Chakra | defaultIndex | - | We use value-based |

## Relationship to Other Components

### Potential Overlaps
- **RadioGroup** - Both provide single selection, but SegmentedControl is more compact and visual
- **Tabs** - Similar appearance, but Tabs manage content panels while SegmentedControl is just selection
- **ToggleButtonGroup** - Could share implementation, but ToggleButtonGroup allows multiple selection

### Composition Opportunities
- Can be used within Toolbar components for view switching
- Often paired with filtered lists or data tables
- Works well in app headers for navigation

### Shared Patterns
- Shares keyboard navigation with RadioGroup
- Could extract selection indicator animation for reuse
- Similar focus management to other form controls

## Implementation Checklist

### Phase 1: Foundation
- [ ] Basic component structure with options
- [ ] CSS module with design tokens
- [ ] Single selection logic
- [ ] Basic unit tests

### Phase 2: Features
- [ ] Keyboard navigation
- [ ] Selection indicator animation
- [ ] All size and variant props
- [ ] ARIA attributes

### Phase 3: Polish
- [ ] Smooth animations
- [ ] Full Storybook stories
- [ ] Complete test coverage
- [ ] Edge case handling

### Phase 4: Integration
- [ ] Documentation and examples
- [ ] Performance optimization
- [ ] Use in real components
- [ ] Gather feedback

## Open Questions

### Design Decisions
- [ ] Should we support multi-line labels or always truncate?
- [ ] How should overflow be handled on mobile - scroll or wrap?
- [ ] Should the indicator animation be customizable?

### Technical Considerations
- [ ] Use CSS transitions or JavaScript for indicator animation?
- [ ] How to handle dynamic width changes smoothly?
- [ ] Support for RTL languages?

### Future Enhancements
- [ ] Multi-select variant (becomes ToggleButtonGroup)
- [ ] Async option loading
- [ ] Custom option rendering
- [ ] Dropdown variant for many options

## Notes

### Implementation Notes
- Use CSS Grid or Flexbox for equal-width segments
- Indicator should use transform for smooth animation
- Consider using ResizeObserver for dynamic sizing
- Ensure touch targets meet accessibility guidelines (44x44px)

### Migration Notes
- If replacing existing toggle controls, ensure value prop compatibility
- Consider providing a codemod for common migrations

### Security Considerations
- Sanitize any HTML in option labels if supporting rich content
- No direct DOM manipulation that could introduce XSS