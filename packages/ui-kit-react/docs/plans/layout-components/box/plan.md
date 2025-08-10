# Box

## Component Name and Description
Box is the most fundamental layout primitive that provides a flexible foundation for building layouts with styling properties.

## Use Cases
- Base layout container
- Spacing and positioning
- Quick styling without custom CSS
- Building other layout components
- Creating responsive layouts
- Applying design tokens

## API/Props Interface

```typescript
interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Element type to render */
  as?: keyof JSX.IntrinsicElements | React.ComponentType<any>;
  
  /** Margin tokens */
  m?: ResponsiveValue<SpaceToken>;
  mt?: ResponsiveValue<SpaceToken>;
  mr?: ResponsiveValue<SpaceToken>;
  mb?: ResponsiveValue<SpaceToken>;
  ml?: ResponsiveValue<SpaceToken>;
  mx?: ResponsiveValue<SpaceToken>;
  my?: ResponsiveValue<SpaceToken>;
  
  /** Padding tokens */
  p?: ResponsiveValue<SpaceToken>;
  pt?: ResponsiveValue<SpaceToken>;
  pr?: ResponsiveValue<SpaceToken>;
  pb?: ResponsiveValue<SpaceToken>;
  pl?: ResponsiveValue<SpaceToken>;
  px?: ResponsiveValue<SpaceToken>;
  py?: ResponsiveValue<SpaceToken>;
  
  /** Display properties */
  display?: ResponsiveValue<'block' | 'inline' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'none'>;
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  
  /** Color tokens */
  bg?: ResponsiveValue<ColorToken>;
  color?: ResponsiveValue<ColorToken>;
  
  /** Border properties */
  border?: ResponsiveValue<BorderToken>;
  borderTop?: ResponsiveValue<BorderToken>;
  borderRight?: ResponsiveValue<BorderToken>;
  borderBottom?: ResponsiveValue<BorderToken>;
  borderLeft?: ResponsiveValue<BorderToken>;
  borderRadius?: ResponsiveValue<RadiusToken>;
  
  /** Position properties */
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  top?: ResponsiveValue<SpaceToken>;
  right?: ResponsiveValue<SpaceToken>;
  bottom?: ResponsiveValue<SpaceToken>;
  left?: ResponsiveValue<SpaceToken>;
  zIndex?: number;
  
  /** Size properties */
  width?: ResponsiveValue<SizeToken>;
  height?: ResponsiveValue<SizeToken>;
  minWidth?: ResponsiveValue<SizeToken>;
  minHeight?: ResponsiveValue<SizeToken>;
  maxWidth?: ResponsiveValue<SizeToken>;
  maxHeight?: ResponsiveValue<SizeToken>;
}

type ResponsiveValue<T> = T | { [breakpoint: string]: T };
type SpaceToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | number;
type ColorToken = string; // References design system color tokens
type BorderToken = 'none' | 'thin' | 'thick' | string;
type RadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
type SizeToken = string | number;
```

## Sub-components
None - Box is a primitive component.

## Usage Examples

### Basic Layout Container
```html
<div class="box" data-p="md" data-bg="surface-1" data-border-radius="md">
  <h2>Content Title</h2>
  <p>Some content inside a styled box container.</p>
</div>
```

### Responsive Spacing
```html
<div class="box" 
     data-p="sm" 
     data-p-md="md" 
     data-p-lg="lg"
     data-mx="auto"
     data-max-width="container-md">
  <div class="content">
    Responsive box that adjusts padding based on screen size.
  </div>
</div>
```

### Card-like Component
```html
<div class="box" 
     data-bg="surface-2" 
     data-border="thin" 
     data-border-radius="lg" 
     data-p="lg"
     data-shadow="md">
  <h3>Card Title</h3>
  <p>Card content with consistent spacing and styling.</p>
  <div class="box" data-mt="md">
    <button>Action Button</button>
  </div>
</div>
```

## Accessibility Notes
- Box renders as a div by default, which is semantically neutral
- Use the `as` prop to render semantically appropriate elements (e.g., `as="section"`, `as="article"`)
- Ensure sufficient color contrast when using `bg` and `color` props
- Consider focus management when using `position` props for overlays
- Use proper heading hierarchy when Box contains headings

## Performance Considerations
- Box uses CSS-in-JS for responsive styles, which may impact initial render
- Design system tokens are optimized for reuse and caching
- Avoid deeply nested Box components where plain HTML would suffice
- Use memoization for complex responsive value objects
- Consider using CSS classes for static layouts instead of Box props

## Related Components
- **Flex**: Box with flexbox layout
- **Grid**: Box with CSS Grid layout  
- **Container**: Box with responsive max-width constraints
- **Stack**: Box with consistent child spacing
- **Text**: For text content with similar styling props
- **Card**: Higher-level component built on Box