# Flex

## Component Name and Description
Flex is a layout primitive that provides flexbox layout capabilities with convenient props for common flexbox patterns.

## Use Cases
- Horizontal and vertical layouts
- Component alignment and distribution
- Responsive layout arrangements
- Navigation bars and toolbars
- Button groups and action bars
- Form layouts

## API/Props Interface

```typescript
interface FlexProps extends BoxProps {
  /** Flex direction */
  direction?: ResponsiveValue<'row' | 'column' | 'row-reverse' | 'column-reverse'>;
  
  /** Flex wrap behavior */
  wrap?: ResponsiveValue<'nowrap' | 'wrap' | 'wrap-reverse'>;
  
  /** Justify content (main axis) */
  justify?: ResponsiveValue<
    | 'flex-start' 
    | 'flex-end' 
    | 'center' 
    | 'space-between' 
    | 'space-around' 
    | 'space-evenly'
  >;
  
  /** Align items (cross axis) */
  align?: ResponsiveValue<
    | 'stretch' 
    | 'flex-start' 
    | 'flex-end' 
    | 'center' 
    | 'baseline'
  >;
  
  /** Align content (multi-line) */
  alignContent?: ResponsiveValue<
    | 'stretch'
    | 'flex-start'
    | 'flex-end' 
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
  >;
  
  /** Gap between children */
  gap?: ResponsiveValue<SpaceToken>;
  rowGap?: ResponsiveValue<SpaceToken>;
  columnGap?: ResponsiveValue<SpaceToken>;
  
  /** Inline flex display */
  inline?: boolean;
}

interface FlexItemProps {
  /** Flex grow factor */
  grow?: number;
  
  /** Flex shrink factor */
  shrink?: number;
  
  /** Flex basis */
  basis?: string | number;
  
  /** Flex shorthand */
  flex?: string | number;
  
  /** Individual alignment */
  alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  
  /** Order */
  order?: number;
}
```

## Sub-components

### Flex.Item
A wrapper component for flex items that need specific flex properties.

```typescript
interface FlexItemProps extends BoxProps, FlexItemProps {}
```

## Usage Examples

### Horizontal Layout with Gap
```html
<div class="flex" data-direction="row" data-gap="md" data-align="center">
  <div class="flex-item">Item 1</div>
  <div class="flex-item">Item 2</div>
  <div class="flex-item">Item 3</div>
</div>
```

### Navigation Bar Layout
```html
<nav class="flex" 
     data-direction="row" 
     data-justify="space-between" 
     data-align="center"
     data-p="md"
     data-bg="surface-1">
  <div class="flex" data-align="center" data-gap="sm">
    <img src="logo.svg" alt="Logo" class="logo">
    <h1>Brand Name</h1>
  </div>
  
  <div class="flex" data-gap="md" data-align="center">
    <a href="/dashboard">Dashboard</a>
    <a href="/projects">Projects</a>
    <button class="primary">Sign In</button>
  </div>
</nav>
```

### Responsive Stack Layout
```html
<div class="flex" 
     data-direction="column"
     data-direction-md="row"
     data-gap="lg"
     data-align="stretch">
  
  <div class="flex-item" data-flex="1">
    <h2>Main Content</h2>
    <p>This area grows to fill available space.</p>
  </div>
  
  <div class="flex-item" data-flex="0 0 300px">
    <h3>Sidebar</h3>
    <p>Fixed width sidebar on larger screens.</p>
  </div>
</div>
```

### Centered Content
```html
<div class="flex" 
     data-direction="column"
     data-justify="center"
     data-align="center"
     data-min-height="100vh"
     data-gap="lg">
  <h1>Welcome</h1>
  <p>Perfectly centered content</p>
  <button>Get Started</button>
</div>
```

## Accessibility Notes
- Flex containers don't change semantic meaning - use appropriate semantic elements
- Be cautious with `order` property as it can create disconnect between visual and DOM order
- Ensure focus order remains logical when using visual reordering
- Use `flex-wrap` to prevent horizontal scrolling on narrow screens
- Consider impact on screen readers when changing visual layout order
- Maintain sufficient touch target sizes in flex layouts

## Performance Considerations
- Flex layouts are generally performant but avoid excessive nesting
- Use `gap` property instead of margin on children for better performance
- Consider CSS Grid for complex 2D layouts instead of nested Flex
- Responsive flex properties may cause layout thrashing during resize
- Prefer CSS classes over inline styles for static layouts
- Cache responsive value objects to prevent unnecessary re-renders

## Related Components
- **Box**: Base primitive that Flex extends
- **Grid**: Alternative for 2D layouts
- **Stack**: Simplified component for consistent spacing
- **Container**: For constrained width layouts
- **Spacer**: For flexible spacing in flex layouts
- **Center**: For simple centering patterns