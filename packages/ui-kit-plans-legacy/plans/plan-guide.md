# Component Plan Guide

This guide provides the template and best practices for creating component plan documents. Component plans define the architecture, API, and implementation strategy for new components.

**Important**: After creating a new plan document, update `/packages/ui-kit-plans/plan-data.json` to add your component to the appropriate category so it appears in the index page.

## Plan Document Structure

### 1. Overview Section

#### Description
- Brief, clear explanation of the component's purpose
- Primary use cases and scenarios
- Value proposition for users

#### Visual Design References
- Link to mockup files (see [mockup-guide.md](./mockup-guide.md))
- List different states and variants with links
- Reference any existing design patterns

#### Key Features
- Core functionality bullets
- Distinguishing characteristics
- Unique capabilities

#### Use Cases
- Primary: Most common usage scenario
- Secondary: Additional supported patterns
- Edge cases: Special considerations

### 2. API Design Section

#### Props Interface Table
| Column | Purpose | Example |
|--------|---------|---------|
| Prop Name | The prop identifier | `variant`, `size`, `disabled` |
| Type | TypeScript type definition | `'primary' \| 'secondary'` |
| Required | Whether prop is mandatory | ✓ or - |
| Default | Default value if not provided | `'medium'`, `false`, `undefined` |
| Description | Clear explanation of behavior | "Controls the visual style" |

**Categories to organize props:**
- Required Props
- Optional Props
- Event Handlers
- Render Props/Slots
- Style Props
- Accessibility Props

#### CSS Classes & Theming
Document the CSS architecture approach:
- Component-specific class names needed
- Variant classes (e.g., `.primary`, `.secondary`)
- State classes (e.g., `.disabled`, `.loading`)
- Element classes for internal parts
- Token usage patterns

### 3. Dependencies Section

#### External Dependencies
- List any third-party libraries
- Justify why each is necessary
- Consider bundle size impact

#### Internal Dependencies
- UI Kit tokens (always required)
- Other components this depends on
- Shared hooks
- Utility functions

### 4. Dependent Components Section

#### Direct Dependents
Components that will import and use this component:
- List each dependent
- Explain how it uses this component
- Note any special integration needs

#### Indirect Dependents
Components that may benefit from patterns:
- Shared utilities that could be extracted
- Common patterns to standardize

### 5. Internal Architecture Section

#### Sub-components
Internal components for organization:
- Name and purpose of each
- Whether they could be extracted later
- Composition strategy

#### Hooks
Custom React hooks needed:
- Hook name and purpose
- State it manages
- Reusability potential

#### Utilities
Helper functions:
- Function purpose
- Whether it should be shared
- Testing requirements

### 6. Performance Considerations

#### Rendering Strategy
Choose applicable strategies:
- [ ] Static (no re-render concerns)
- [ ] Dynamic (frequent updates)
- [ ] List rendering (virtualization needs)
- [ ] Animation heavy
- [ ] Async data loading

#### Optimization Approaches
Document planned optimizations:
- **Memoization**: What and why
- **Lazy Loading**: What can be deferred
- **Initial Render**: Critical vs. non-critical
- **Bundle Impact**: Size considerations

### 7. Accessibility Section

#### ARIA Requirements
- Roles needed
- Labels and descriptions
- Live regions
- Focus management

#### Keyboard Navigation
- Tab order
- Keyboard shortcuts
- Focus trapping
- Escape handling

#### Screen Reader Support
- Announcement patterns
- Hidden descriptive text
- State changes

### 8. Testing Strategy

#### Test Categories
- **Unit Tests**: Props, state, events, edge cases
- **Integration Tests**: Composition, theming
- **Visual Tests**: Variants, states, themes
- **Accessibility Tests**: ARIA, keyboard, screen readers

### 9. Storybook Stories

#### Story Categories
- **Essential**: Default, Playground, Variants
- **Interaction**: User interactions, controlled/uncontrolled
- **Edge Cases**: Empty, loading, error states
- **Composition**: With other components

### 10. Research Section

#### Prior Art
Research similar components:
- What works well
- What to avoid
- Patterns to adopt
- API comparisons

### 11. Implementation Checklist

#### Phases
1. **Foundation**: Structure, basic props, CSS, tests
2. **Features**: Full props, events, accessibility
3. **Polish**: Optimization, stories, docs
4. **Integration**: Real usage, profiling

### 12. Open Questions

Document unresolved decisions:
- Design questions
- Technical trade-offs
- Future enhancements

## Best Practices for Plans

### DO:
- Keep descriptions concise and clear
- Consider all use cases upfront
- Think about composition and reusability
- Plan for accessibility from the start
- Consider performance implications early
- Research existing solutions

### DON'T:
- Over-engineer the initial design
- Add props "just in case"
- Ignore bundle size impact
- Skip accessibility planning
- Forget about testing strategy

## Plan Review Checklist

Before finalizing a component plan:
- [ ] API is minimal but complete
- [ ] Props follow existing patterns
- [ ] Accessibility is fully considered
- [ ] Performance strategy is defined
- [ ] Dependencies are justified
- [ ] Testing approach is clear
- [ ] Implementation phases are realistic