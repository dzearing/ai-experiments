# Label

## Component Name and Description
Label is a typography primitive specifically designed for form labels, UI labels, and descriptive text with proper accessibility support.

## Use Cases
- Form field labels
- UI component labels
- Status and category labels
- Required field indicators
- Help text and descriptions
- Interactive element labels

## API/Props Interface

```typescript
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Element type to render */
  as?: 'label' | 'span' | 'div';
  
  /** Label size variants */
  size?: ResponsiveValue<'xs' | 'sm' | 'md' | 'lg'>;
  
  /** Font weight */
  weight?: ResponsiveValue<'normal' | 'medium' | 'semibold' | 'bold'>;
  
  /** Text color */
  color?: ResponsiveValue<ColorToken>;
  
  /** Label variant */
  variant?: 
    | 'default'
    | 'required'
    | 'optional'
    | 'error'
    | 'success'
    | 'warning'
    | 'disabled'
    | 'help';
  
  /** Required field indicator */
  required?: boolean;
  
  /** Optional field indicator */
  optional?: boolean;
  
  /** Custom required indicator */
  requiredIndicator?: React.ReactNode;
  
  /** Custom optional indicator */
  optionalIndicator?: React.ReactNode;
  
  /** Associated form control ID */
  htmlFor?: string;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Error state */
  error?: boolean;
  
  /** Help text or description */
  description?: string;
  
  /** Position of description */
  descriptionPosition?: 'below' | 'inline';
  
  /** Tooltip for additional help */
  tooltip?: string;
  
  /** Truncate long labels */
  truncate?: boolean;
  
  /** Make label inline */
  inline?: boolean;
  
  /** Screen reader only label */
  srOnly?: boolean;
}

type ColorToken = 
  | 'inherit'
  | 'current'
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'muted'
  | 'error'
  | 'warning'
  | 'success'
  | 'disabled';
```

## Sub-components

### Label.Description
A component for help text or additional description.

### Label.RequiredIndicator
A component for required field indicators.

## Usage Examples

### Basic Form Labels
```html
<div class="form-field">
  <label class="label" 
         data-size="sm" 
         data-weight="medium"
         for="email">
    Email Address
  </label>
  <input type="email" id="email" name="email">
</div>

<div class="form-field">
  <label class="label" 
         data-variant="required"
         for="password">
    Password
    <span class="label-required" aria-label="required">*</span>
  </label>
  <input type="password" id="password" name="password" required>
</div>
```

### Labels with Descriptions
```html
<div class="form-field">
  <label class="label" 
         data-size="sm"
         for="username">
    Username
  </label>
  <div class="label-description" data-size="xs" data-color="muted">
    Choose a unique username between 3-20 characters
  </div>
  <input type="text" 
         id="username" 
         name="username"
         aria-describedby="username-help">
</div>
```

### Error and Success States
```html
<div class="form-field">
  <label class="label" 
         data-variant="error"
         for="email-error">
    Email Address
  </label>
  <input type="email" 
         id="email-error" 
         name="email-error"
         class="error"
         aria-invalid="true"
         aria-describedby="email-error-msg">
  <div class="label-description" 
       data-color="error" 
       data-size="xs"
       id="email-error-msg">
    Please enter a valid email address
  </div>
</div>

<div class="form-field">
  <label class="label" 
         data-variant="success"
         for="email-success">
    Email Address
  </label>
  <input type="email" 
         id="email-success" 
         name="email-success"
         class="success">
  <div class="label-description" 
       data-color="success" 
       data-size="xs">
    Email address is valid
  </div>
</div>
```

### UI Component Labels
```html
<div class="ui-controls">
  <!-- Toggle switch label -->
  <div class="control-group">
    <label class="label" 
           data-inline="true"
           for="notifications">
      Enable Notifications
    </label>
    <input type="checkbox" 
           id="notifications" 
           role="switch"
           aria-checked="false">
  </div>
  
  <!-- Radio group labels -->
  <fieldset>
    <legend class="label" data-weight="medium">
      Preferred Contact Method
    </legend>
    
    <div class="radio-option">
      <input type="radio" id="contact-email" name="contact" value="email">
      <label class="label" 
             data-size="sm"
             for="contact-email">
        Email
      </label>
    </div>
    
    <div class="radio-option">
      <input type="radio" id="contact-phone" name="contact" value="phone">
      <label class="label" 
             data-size="sm"
             for="contact-phone">
        Phone
      </label>
    </div>
  </fieldset>
</div>
```

### Screen Reader Only Labels
```html
<div class="search-field">
  <label class="label" 
         data-sr-only="true"
         for="search">
    Search products
  </label>
  <input type="search" 
         id="search" 
         placeholder="Search products..."
         aria-label="Search products">
  <button type="submit">Search</button>
</div>
```

## Accessibility Notes
- Always associate labels with form controls using `for` attribute or nesting
- Use `aria-describedby` to link labels with help text
- Provide clear, descriptive label text that explains the field purpose
- Use `aria-label` or `aria-labelledby` for complex label relationships
- Ensure required fields are clearly indicated and announced to screen readers
- Use semantic HTML elements (`label`, `legend`, `fieldset`) appropriately
- Test label associations with screen readers
- Maintain sufficient color contrast for all label states

## Performance Considerations
- Label rendering is lightweight and highly optimized
- Use semantic HTML elements for better performance and accessibility
- Cache label configurations for repeated use
- Avoid complex computations in label rendering
- Use CSS classes instead of inline styles where possible
- Consider using CSS containment for complex label layouts

## Related Components
- **Text**: For general text content
- **FormField**: Complete form field with label integration
- **Input**: Form controls that need labels
- **Fieldset**: For grouping related form controls
- **Tooltip**: For additional help information
- **Badge**: For status and category indicators