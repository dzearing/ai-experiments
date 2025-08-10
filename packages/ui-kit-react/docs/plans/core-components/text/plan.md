# Text

## Component Name and Description
Text is the fundamental typography primitive that provides consistent text styling with design system integration and responsive capabilities.

## Use Cases
- Body text and paragraphs
- Labels and descriptions
- Inline text elements
- Text with semantic meaning
- Responsive typography
- Accessible text content

## API/Props Interface

```typescript
interface TextProps extends React.HTMLAttributes<HTMLElement> {
  /** Element type to render */
  as?: 'p' | 'span' | 'div' | 'strong' | 'em' | 'small' | 'mark' | 'del' | 'ins' | 'sub' | 'sup';
  
  /** Text size variants */
  size?: ResponsiveValue<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'>;
  
  /** Font weight */
  weight?: ResponsiveValue<'light' | 'normal' | 'medium' | 'semibold' | 'bold'>;
  
  /** Text color */
  color?: ResponsiveValue<ColorToken>;
  
  /** Text alignment */
  align?: ResponsiveValue<'left' | 'center' | 'right' | 'justify'>;
  
  /** Line height */
  lineHeight?: ResponsiveValue<'tight' | 'normal' | 'relaxed' | 'loose' | number>;
  
  /** Letter spacing */
  letterSpacing?: ResponsiveValue<'tight' | 'normal' | 'wide' | number>;
  
  /** Text decoration */
  decoration?: 'none' | 'underline' | 'overline' | 'line-through';
  
  /** Text transform */
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  
  /** Font family */
  family?: 'sans' | 'serif' | 'mono' | 'display';
  
  /** Text overflow behavior */
  overflow?: 'visible' | 'hidden' | 'ellipsis' | 'clip';
  
  /** Maximum lines before truncation */
  maxLines?: number;
  
  /** Whether text should be selectable */
  selectable?: boolean;
  
  /** Whitespace handling */
  whitespace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line';
  
  /** Word break behavior */
  wordBreak?: 'normal' | 'break-all' | 'keep-all' | 'break-word';
  
  /** Text variant shortcuts */
  variant?: 
    | 'body'
    | 'caption'
    | 'footnote'
    | 'subtitle'
    | 'lead'
    | 'muted'
    | 'error'
    | 'success'
    | 'warning'
    | 'info';
}

type ColorToken = 
  | 'inherit'
  | 'current'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'neutral'
  | 'muted'
  | 'subtle'
  | 'error'
  | 'warning'
  | 'success'
  | 'info';
```

## Sub-components
None - Text is a primitive component.

## Usage Examples

### Basic Text Variants
```html
<div class="text-examples">
  <p class="text" data-variant="lead">
    This is lead text that introduces the main content.
  </p>
  
  <p class="text" data-variant="body">
    This is regular body text for main content reading.
  </p>
  
  <p class="text" data-variant="caption">
    This is caption text for additional context.
  </p>
  
  <span class="text" data-variant="muted">
    This is muted text for less important information.
  </span>
</div>
```

### Responsive Typography
```html
<div class="responsive-text">
  <p class="text" 
     data-size="sm"
     data-size-md="md"
     data-size-lg="lg"
     data-weight="normal"
     data-weight-md="medium"
     data-line-height="relaxed">
    This text scales up on larger screens and increases weight.
  </p>
</div>
```

### Text States and Colors
```html
<div class="text-states">
  <p class="text" data-color="error" data-weight="medium">
    Error message text in red color.
  </p>
  
  <p class="text" data-color="success">
    Success message text in green color.
  </p>
  
  <p class="text" data-color="warning">
    Warning message text in amber color.
  </p>
  
  <p class="text" data-color="muted" data-size="sm">
    Muted supporting text in smaller size.
  </p>
</div>
```

### Text Truncation and Overflow
```html
<div class="text-overflow-examples">
  <!-- Single line truncation -->
  <p class="text" 
     data-overflow="ellipsis" 
     data-whitespace="nowrap"
     style="max-width: 200px;">
    This is a very long text that will be truncated with ellipsis.
  </p>
  
  <!-- Multi-line truncation -->
  <p class="text" 
     data-max-lines="3"
     data-overflow="ellipsis">
    This is a longer paragraph that will be truncated after three lines of text. 
    The rest of the content will be hidden and indicated with ellipsis at the end.
    This demonstrates multi-line text truncation capability.
  </p>
</div>
```

### Semantic Text Elements
```html
<div class="semantic-text">
  <p class="text">
    This paragraph contains 
    <strong class="text" data-as="strong" data-weight="semibold">important text</strong>
    and 
    <em class="text" data-as="em" data-style="italic">emphasized text</em>
    for semantic meaning.
  </p>
  
  <p class="text">
    <mark class="text" data-as="mark" data-bg="highlight">Highlighted text</mark>
    and 
    <del class="text" data-as="del" data-decoration="line-through">deleted text</del>
    show content changes.
  </p>
</div>
```

## Accessibility Notes
- Use semantic HTML elements (`strong`, `em`, `mark`) for meaning, not just styling
- Ensure sufficient color contrast for all text colors (minimum 4.5:1 for normal text)
- Use `aria-label` or `aria-describedby` for text that needs additional context
- Test text scaling up to 200% to ensure readability
- Provide alternative text for decorative text elements
- Use proper heading hierarchy instead of styled text for headings
- Consider screen reader pronunciation for abbreviations and technical terms

## Performance Considerations
- Text rendering is highly optimized by browsers
- Use system fonts when possible for better performance
- Avoid excessive font weight and style variations
- Cache responsive text configurations
- Use CSS containment for large text blocks
- Consider font loading strategies for custom fonts
- Minimize DOM nodes for simple text content
- Use text-rendering optimizations for better performance

## Related Components
- **Heading**: For title and heading text
- **Label**: For form labels and UI labels
- **Link**: For interactive text elements
- **Code**: For monospace code text
- **Badge**: For status and category text
- **Tooltip**: For supplementary text information