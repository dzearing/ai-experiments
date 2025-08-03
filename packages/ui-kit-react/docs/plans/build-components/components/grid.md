# Grid

## Component Name and Description
Grid is a layout primitive that provides CSS Grid layout capabilities with convenient props for creating complex 2D layouts.

## Use Cases
- Complex dashboard layouts
- Card grids and galleries
- Form layouts with multiple columns
- Responsive grid systems
- Magazine-style layouts
- Data visualization layouts

## API/Props Interface

```typescript
interface GridProps extends BoxProps {
  /** Grid template columns */
  templateColumns?: ResponsiveValue<string>;
  
  /** Grid template rows */
  templateRows?: ResponsiveValue<string>;
  
  /** Grid template areas */
  templateAreas?: ResponsiveValue<string>;
  
  /** Grid gap */
  gap?: ResponsiveValue<SpaceToken>;
  rowGap?: ResponsiveValue<SpaceToken>;
  columnGap?: ResponsiveValue<SpaceToken>;
  
  /** Auto columns sizing */
  autoColumns?: ResponsiveValue<string>;
  
  /** Auto rows sizing */
  autoRows?: ResponsiveValue<string>;
  
  /** Auto flow direction */
  autoFlow?: ResponsiveValue<'row' | 'column' | 'row dense' | 'column dense'>;
  
  /** Justify items */
  justifyItems?: ResponsiveValue<'start' | 'end' | 'center' | 'stretch'>;
  
  /** Align items */
  alignItems?: ResponsiveValue<'start' | 'end' | 'center' | 'stretch' | 'baseline'>;
  
  /** Justify content */
  justifyContent?: ResponsiveValue<
    | 'start' 
    | 'end' 
    | 'center' 
    | 'stretch' 
    | 'space-around' 
    | 'space-between' 
    | 'space-evenly'
  >;
  
  /** Align content */
  alignContent?: ResponsiveValue<
    | 'start'
    | 'end'
    | 'center'
    | 'stretch'
    | 'space-around'
    | 'space-between'
    | 'space-evenly'
  >;
  
  /** Inline grid display */
  inline?: boolean;
}

interface GridItemProps {
  /** Grid column position */
  colStart?: ResponsiveValue<number | string>;
  colEnd?: ResponsiveValue<number | string>;
  colSpan?: ResponsiveValue<number>;
  
  /** Grid row position */
  rowStart?: ResponsiveValue<number | string>;
  rowEnd?: ResponsiveValue<number | string>;
  rowSpan?: ResponsiveValue<number>;
  
  /** Grid area name */
  area?: ResponsiveValue<string>;
  
  /** Individual alignment */
  justifySelf?: ResponsiveValue<'auto' | 'start' | 'end' | 'center' | 'stretch'>;
  alignSelf?: ResponsiveValue<'auto' | 'start' | 'end' | 'center' | 'stretch' | 'baseline'>;
}
```

## Sub-components

### Grid.Item
A wrapper component for grid items that need specific grid placement properties.

```typescript
interface GridItemProps extends BoxProps, GridItemProps {}
```

## Usage Examples

### Responsive Card Grid
```html
<div class="grid" 
     data-template-columns="1fr"
     data-template-columns-md="repeat(2, 1fr)"
     data-template-columns-lg="repeat(3, 1fr)"
     data-gap="lg">
  
  <div class="grid-item card">
    <h3>Card 1</h3>
    <p>Content for the first card.</p>
  </div>
  
  <div class="grid-item card">
    <h3>Card 2</h3>
    <p>Content for the second card.</p>
  </div>
  
  <div class="grid-item card">
    <h3>Card 3</h3>
    <p>Content for the third card.</p>
  </div>
</div>
```

### Dashboard Layout with Named Areas
```html
<div class="grid" 
     data-template-areas="'header header header'
                          'sidebar main aside'
                          'footer footer footer'"
     data-template-columns="200px 1fr 200px"
     data-template-rows="auto 1fr auto"
     data-gap="md"
     data-min-height="100vh">
  
  <header class="grid-item" data-area="header">
    <h1>Dashboard Header</h1>
  </header>
  
  <nav class="grid-item" data-area="sidebar">
    <h2>Navigation</h2>
    <ul>
      <li><a href="/dashboard">Dashboard</a></li>
      <li><a href="/projects">Projects</a></li>
    </ul>
  </nav>
  
  <main class="grid-item" data-area="main">
    <h2>Main Content</h2>
    <p>Primary dashboard content goes here.</p>
  </main>
  
  <aside class="grid-item" data-area="aside">
    <h3>Quick Actions</h3>
    <button>New Project</button>
  </aside>
  
  <footer class="grid-item" data-area="footer">
    <p>&copy; 2024 Company Name</p>
  </footer>
</div>
```

## Accessibility Notes
- Grid containers don't change semantic meaning - use appropriate semantic elements
- Be careful with grid ordering as it can disconnect visual and DOM order
- Ensure focus order remains logical when using grid placement
- Use semantic HTML elements (`header`, `main`, `aside`, `footer`) with grid areas
- Consider screen reader users when designing complex grid layouts
- Ensure sufficient spacing and touch targets in grid layouts
- Test grid layouts with zoom levels up to 200%

## Performance Considerations
- CSS Grid is highly optimized but avoid excessive template area recalculation
- Use `repeat()` function instead of repeating column/row definitions
- Consider using CSS classes for static grid layouts
- Be mindful of responsive grid changes causing layout thrashing
- Cache responsive template objects to prevent re-renders
- Use `auto-fit` and `auto-fill` wisely for performance
- Prefer explicit track sizes over content-based sizing when possible

## Related Components
- **Box**: Base primitive that Grid extends
- **Flex**: Alternative for 1D layouts
- **Container**: For constrained width layouts
- **Stack**: For simple vertical layouts
- **Masonry**: For Pinterest-style layouts
- **DataTable**: For tabular data display
