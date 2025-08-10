# Heading

## Component Name and Description
Heading is a typography primitive that provides consistent heading styles with proper semantic hierarchy and responsive scaling.

## Use Cases
- Page titles and section headers
- Content hierarchy establishment
- SEO and accessibility structure
- Card and panel titles
- Navigation headings
- Modal and dialog titles

## API/Props Interface

```typescript
interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Heading level for semantic hierarchy */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  
  /** Visual size (can differ from semantic level) */
  size?: ResponsiveValue<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'>;
  
  /** Font weight */
  weight?: ResponsiveValue<'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold'>;
  
  /** Text color */
  color?: ResponsiveValue<ColorToken>;
  
  /** Text alignment */
  align?: ResponsiveValue<'left' | 'center' | 'right'>;
  
  /** Line height */
  lineHeight?: ResponsiveValue<'tight' | 'normal' | 'relaxed'>;
  
  /** Letter spacing */
  letterSpacing?: ResponsiveValue<'tight' | 'normal' | 'wide'>;
  
  /** Text decoration */
  decoration?: 'none' | 'underline';
  
  /** Text transform */
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  
  /** Font family */
  family?: 'sans' | 'serif' | 'display';
  
  /** Text truncation */
  truncate?: boolean;
  
  /** Maximum lines before truncation */
  maxLines?: number;
  
  /** Heading variant shortcuts */
  variant?: 
    | 'display'      // Large display headings
    | 'headline'     // Main page headings
    | 'title'        // Section titles
    | 'subtitle'     // Subsection titles
    | 'label'        // Small labels
    | 'overline';    // All-caps overline text
  
  /** Margin adjustments */
  marginTop?: ResponsiveValue<SpaceToken>;
  marginBottom?: ResponsiveValue<SpaceToken>;
}

type ColorToken = 
  | 'inherit'
  | 'current'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'neutral'
  | 'muted'
  | 'error'
  | 'warning'
  | 'success'
  | 'info';
```

## Sub-components
None - Heading is a primitive component.

## Usage Examples

### Semantic Heading Hierarchy
```html
<article>
  <h1 class="heading" data-level="1" data-variant="display">
    Main Article Title
  </h1>
  
  <h2 class="heading" data-level="2" data-variant="headline">
    Section Heading
  </h2>
  
  <h3 class="heading" data-level="3" data-variant="title">
    Subsection Title
  </h3>
  
  <h4 class="heading" data-level="4" data-variant="subtitle">
    Sub-subsection Title
  </h4>
</article>
```

### Visual Size vs Semantic Level
```html
<div class="heading-examples">
  <!-- Large visual heading but h2 semantically -->
  <h2 class="heading" 
      data-level="2" 
      data-size="4xl"
      data-weight="bold">
    Visually Large H2
  </h2>
  
  <!-- Small visual heading but h1 semantically -->
  <h1 class="heading" 
      data-level="1" 
      data-size="lg"
      data-weight="medium"
      data-color="muted">
    Visually Small H1
  </h1>
</div>
```

### Responsive Headings
```html
<div class="responsive-headings">
  <h1 class="heading" 
      data-level="1"
      data-size="xl"
      data-size-md="3xl"
      data-size-lg="4xl"
      data-weight="semibold"
      data-weight-lg="bold">
    Responsive Main Heading
  </h1>
  
  <h2 class="heading" 
      data-level="2"
      data-size="md"
      data-size-md="lg"
      data-size-lg="xl"
      data-line-height="tight">
    Responsive Section Heading
  </h2>
</div>
```

### Card and Component Headings
```html
<div class="card">
  <h3 class="heading" 
      data-level="3" 
      data-variant="title"
      data-margin-bottom="sm">
    Card Title
  </h3>
  
  <p class="text">Card content goes here...</p>
  
  <h4 class="heading" 
      data-level="4" 
      data-variant="subtitle"
      data-margin-top="md"
      data-margin-bottom="xs">
    Card Subsection
  </h4>
  
  <p class="text">More card content...</p>
</div>
```

### Styled Heading Variants
```html
<div class="heading-variants">
  <!-- Display heading for hero sections -->
  <h1 class="heading" 
      data-variant="display"
      data-family="display"
      data-align="center">
    Hero Display Heading
  </h1>
  
  <!-- Overline heading -->
  <h2 class="heading" 
      data-variant="overline"
      data-transform="uppercase"
      data-letter-spacing="wide"
      data-color="muted">
    Overline Heading
  </h2>
  
  <!-- Truncated heading -->
  <h3 class="heading" 
      data-level="3"
      data-truncate="true"
      style="max-width: 200px;">
    This is a very long heading that will be truncated
  </h3>
</div>
```

## Accessibility Notes
- Always use proper semantic heading levels (h1-h6) for screen readers
- Maintain logical heading hierarchy - don't skip levels
- Use `aria-level` if visual and semantic levels must differ significantly
- Ensure sufficient color contrast (minimum 3:1 for large text)
- Test heading structure with screen readers
- Use `aria-labelledby` to associate content with headings
- Avoid using headings purely for visual styling
- Consider adding `role="heading"` for non-standard heading elements

## Performance Considerations
- Heading rendering is highly optimized by browsers
- Use semantic HTML elements for better accessibility and SEO
- Cache responsive heading configurations
- Avoid excessive DOM nesting around headings
- Use CSS containment for complex heading layouts
- Consider font loading strategies for custom heading fonts
- Minimize style recalculations by using stable class names

## Related Components
- **Text**: For body text and non-heading content
- **Label**: For form and UI labels
- **Breadcrumb**: For navigation hierarchy
- **PageHeader**: For page-level heading components
- **Card**: Components that often contain headings
- **Modal**: Components that use heading for titles