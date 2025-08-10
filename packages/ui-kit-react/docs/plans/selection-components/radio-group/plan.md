# RadioGroup

## Component Name and Description
RadioGroup is an input primitive that provides a group of mutually exclusive radio button options with proper accessibility and keyboard navigation.

## Use Cases
- Single selection from multiple options
- Settings and preferences
- Form choices and categories
- Filter options
- Survey responses
- Configuration selections

## API/Props Interface

```typescript
interface RadioGroupProps {
  /** Group name for form submission */
  name: string;
  
  /** Currently selected value */
  value?: string;
  
  /** Default selected value */
  defaultValue?: string;
  
  /** Available options */
  options: RadioOption[];
  
  /** Group label */
  label?: string;
  
  /** Hide label visually but keep for screen readers */
  hideLabel?: boolean;
  
  /** Help text or description */
  description?: string;
  
  /** Error message */
  errorMessage?: string;
  
  /** Group layout direction */
  orientation?: 'horizontal' | 'vertical';
  
  /** Visual variant */
  variant?: 'default' | 'button' | 'card' | 'minimal';
  
  /** Size of radio buttons */
  size?: 'sm' | 'md' | 'lg';
  
  /** Required field indicator */
  required?: boolean;
  
  /** Disabled state for entire group */
  disabled?: boolean;
  
  /** Read-only state */
  readOnly?: boolean;
  
  /** Error state */
  error?: boolean;
  
  /** Event handlers */
  onChange?: (value: string) => void;
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
  
  /** ARIA attributes */
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

interface RadioOption {
  /** Option value */
  value: string;
  
  /** Option label */
  label: string;
  
  /** Option description */
  description?: string;
  
  /** Disabled state for individual option */
  disabled?: boolean;
  
  /** Icon for the option */
  icon?: React.ReactNode;
  
  /** Additional content */
  content?: React.ReactNode;
}
```

## Sub-components

### RadioGroup.Item
Individual radio button item with label and description.

### RadioGroup.Label
The group label component.

### RadioGroup.Description
Help text for the entire group.

## Usage Examples

### Basic Radio Group
```html
<fieldset class="radio-group" data-orientation="vertical">
  <legend class="radio-group-label">
    Preferred Contact Method
    <span class="required-indicator">*</span>
  </legend>
  
  <div class="radio-group-options">
    <div class="radio-option">
      <input type="radio" 
             id="contact-email" 
             name="contact" 
             value="email"
             class="radio-input">
      <label for="contact-email" class="radio-label">
        Email
      </label>
    </div>
    
    <div class="radio-option">
      <input type="radio" 
             id="contact-phone" 
             name="contact" 
             value="phone"
             class="radio-input">
      <label for="contact-phone" class="radio-label">
        Phone
      </label>
    </div>
    
    <div class="radio-option">
      <input type="radio" 
             id="contact-mail" 
             name="contact" 
             value="mail"
             class="radio-input">
      <label for="contact-mail" class="radio-label">
        Mail
      </label>
    </div>
  </div>
</fieldset>
```

### Horizontal Radio Group with Descriptions
```html
<fieldset class="radio-group" data-orientation="horizontal" data-variant="card">
  <legend class="radio-group-label">
    Subscription Plan
  </legend>
  <div class="radio-group-description">
    Choose the plan that best fits your needs
  </div>
  
  <div class="radio-group-options">
    <div class="radio-option card">
      <input type="radio" 
             id="plan-basic" 
             name="plan" 
             value="basic"
             class="radio-input">
      <label for="plan-basic" class="radio-label">
        <div class="option-title">Basic</div>
        <div class="option-description">$9/month</div>
        <div class="option-features">Up to 5 projects</div>
      </label>
    </div>
    
    <div class="radio-option card">
      <input type="radio" 
             id="plan-pro" 
             name="plan" 
             value="pro"
             class="radio-input">
      <label for="plan-pro" class="radio-label">
        <div class="option-title">Pro</div>
        <div class="option-description">$19/month</div>
        <div class="option-features">Unlimited projects</div>
      </label>
    </div>
    
    <div class="radio-option card">
      <input type="radio" 
             id="plan-enterprise" 
             name="plan" 
             value="enterprise"
             class="radio-input">
      <label for="plan-enterprise" class="radio-label">
        <div class="option-title">Enterprise</div>
        <div class="option-description">$49/month</div>
        <div class="option-features">Advanced features</div>
      </label>
    </div>
  </div>
</fieldset>
```

### Button-Style Radio Group
```html
<fieldset class="radio-group" data-variant="button" data-size="md">
  <legend class="radio-group-label">
    Text Alignment
  </legend>
  
  <div class="radio-group-options button-group">
    <div class="radio-option">
      <input type="radio" 
             id="align-left" 
             name="alignment" 
             value="left"
             class="radio-input sr-only">
      <label for="align-left" class="radio-button">
        <span class="button-icon">⬅️</span>
        <span class="button-text">Left</span>
      </label>
    </div>
    
    <div class="radio-option">
      <input type="radio" 
             id="align-center" 
             name="alignment" 
             value="center"
             class="radio-input sr-only">
      <label for="align-center" class="radio-button">
        <span class="button-icon">↔️</span>
        <span class="button-text">Center</span>
      </label>
    </div>
    
    <div class="radio-option">
      <input type="radio" 
             id="align-right" 
             name="alignment" 
             value="right"
             class="radio-input sr-only">
      <label for="align-right" class="radio-button">
        <span class="button-icon">➡️</span>
        <span class="button-text">Right</span>
      </label>
    </div>
  </div>
</fieldset>
```

### Radio Group with Error State
```html
<fieldset class="radio-group" data-state="error">
  <legend class="radio-group-label">
    Payment Method
    <span class="required-indicator">*</span>
  </legend>
  
  <div class="radio-group-options">
    <div class="radio-option">
      <input type="radio" 
             id="payment-card" 
             name="payment" 
             value="card"
             class="radio-input"
             aria-invalid="true"
             aria-describedby="payment-error">
      <label for="payment-card" class="radio-label">
        Credit Card
      </label>
    </div>
    
    <div class="radio-option">
      <input type="radio" 
             id="payment-paypal" 
             name="payment" 
             value="paypal"
             class="radio-input"
             aria-invalid="true"
             aria-describedby="payment-error">
      <label for="payment-paypal" class="radio-label">
        PayPal
      </label>
    </div>
  </div>
  
  <div class="radio-group-message" 
       data-type="error" 
       id="payment-error">
    Please select a payment method
  </div>
</fieldset>
```

### Disabled Radio Options
```html
<fieldset class="radio-group">
  <legend class="radio-group-label">
    Delivery Options
  </legend>
  
  <div class="radio-group-options">
    <div class="radio-option">
      <input type="radio" 
             id="delivery-standard" 
             name="delivery" 
             value="standard"
             class="radio-input">
      <label for="delivery-standard" class="radio-label">
        Standard (3-5 days)
      </label>
    </div>
    
    <div class="radio-option">
      <input type="radio" 
             id="delivery-express" 
             name="delivery" 
             value="express"
             class="radio-input">
      <label for="delivery-express" class="radio-label">
        Express (1-2 days)
      </label>
    </div>
    
    <div class="radio-option" data-state="disabled">
      <input type="radio" 
             id="delivery-overnight" 
             name="delivery" 
             value="overnight"
             class="radio-input"
             disabled>
      <label for="delivery-overnight" class="radio-label">
        Overnight (Currently unavailable)
      </label>
    </div>
  </div>
</fieldset>
```

## Accessibility Notes
- Use `fieldset` and `legend` elements for proper grouping
- Ensure all radio buttons in a group share the same `name` attribute
- Use arrow keys for keyboard navigation between options
- Provide clear, descriptive labels for each option
- Use `aria-describedby` to link group descriptions and error messages
- Ensure sufficient color contrast for all states
- Test with screen readers to verify proper announcement
- Support Space or Enter to select focused option
- Maintain logical tab order within the group

## Performance Considerations
- Use event delegation for managing radio button events
- Minimize re-renders by using stable option arrays
- Cache option validation results when appropriate
- Use CSS-only styling for visual states when possible
- Consider virtualization for very large option lists
- Implement proper cleanup for event listeners
- Use semantic HTML elements for better performance

## Related Components
- **Checkbox**: For multiple selection options
- **SegmentedControl**: For tab-like radio selection
- **ToggleButton**: For binary choice options
- **Select**: For dropdown selection
- **ButtonGroup**: For button-style selections
- **FormField**: Complete form field wrapper