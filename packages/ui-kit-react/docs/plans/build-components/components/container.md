# Container

## Component Name and Description
Container is a responsive layout primitive that constrains content width and provides consistent padding for optimal reading experiences across different screen sizes.

## Use Cases
- Page content wrapping
- Article and blog layouts
- Section containers
- Form layouts
- Dashboard content areas
- Responsive design patterns

## API/Props Interface

```typescript
interface ContainerProps extends BoxProps {
  /** Container size variants */
  size?: ResponsiveValue<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'>;
  
  /** Custom max-width */
  maxWidth?: ResponsiveValue<string | number>;
  
  /** Whether to center the container */
  centerContent?: boolean;
  
  /** Disable automatic padding */
  disablePadding?: boolean;
  
  /** Custom padding override */
  padding?: ResponsiveValue<SpaceToken>;
  
  /** Fluid width (no max-width constraint) */
  fluid?: boolean;
  
  /** Whether to apply padding on mobile */
  mobilePadding?: boolean;
  
  /** Custom breakpoint behavior */
  breakpoints?: {
    [key: string]: {
      maxWidth?: string | number;
      padding?: SpaceToken;
    };
  };
}

// Predefined container sizes
type ContainerSizes = {
  xs: '20rem';     // 320px
  sm: '24rem';     // 384px  
  md: '28rem';     // 448px
  lg: '32rem';     // 512px
  xl: '36rem';     // 576px
  '2xl': '42rem';  // 672px
  full: '100%';
};
```

## Sub-components
None - Container is a primitive component.

## Usage Examples

### Basic Page Container
```html
<div class="container" data-size="lg" data-center-content="true">
  <header>
    <h1>Page Title</h1>
    <nav>
      <a href="/home">Home</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </nav>
  </header>
  
  <main>
    <h2>Main Content</h2>
    <p>This content is contained within optimal reading width.</p>
  </main>
  
  <footer>
    <p>&copy; 2024 Company Name</p>
  </footer>
</div>
```

### Responsive Container with Custom Padding
```html
<div class="container" 
     data-size="md"
     data-size-lg="xl"
     data-padding="sm"
     data-padding-md="md"
     data-padding-lg="lg">
  <article>
    <h1>Article Title</h1>
    <p>Article content with responsive container sizing and padding.</p>
    <p>The container adjusts its max-width and padding based on screen size.</p>
  </article>
</div>
```

### Fluid Container for Full-Width Sections
```html
<section class="container" data-fluid="true" data-bg="surface-2">
  <div class="container" data-size="lg" data-center-content="true">
    <h2>Full-Width Section</h2>
    <p>This section has a full-width background, but the content is constrained.</p>
  </div>
</section>
```

### Form Container
```html
<div class="container" data-size="sm" data-center-content="true">
  <form class="form">
    <h2>Sign In</h2>
    
    <div class="form-field">
      <label for="email">Email</label>
      <input type="email" id="email" name="email">
    </div>
    
    <div class="form-field">
      <label for="password">Password</label>
      <input type="password" id="password" name="password">
    </div>
    
    <button type="submit">Sign In</button>
  </form>
</div>
```

## Accessibility Notes
- Container is semantically neutral and doesn't affect screen reader navigation
- Use appropriate semantic elements within containers (`main`, `section`, `article`)
- Ensure sufficient padding for touch targets on mobile devices
- Test with text scaling up to 200% to ensure content remains accessible
- Consider reading line length - optimal is 45-75 characters per line
- Maintain sufficient contrast when using background colors

## Performance Considerations
- Container calculations are CSS-based and highly performant
- Use CSS custom properties for dynamic max-width values
- Avoid excessive nesting of containers
- Consider using CSS Grid or Flexbox for complex layouts instead of multiple containers
- Responsive container changes are handled by CSS media queries for optimal performance
- Cache container configuration objects to prevent unnecessary re-renders

## Related Components
- **Box**: Base primitive that Container extends
- **Flex**: For flexible layouts within containers
- **Grid**: For complex layouts within containers
- **Stack**: For vertical layouts within containers
- **Section**: Higher-level semantic wrapper
- **Page**: Complete page layout component
