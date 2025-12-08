# SegmentedControl

A segmented control component that displays a group of options where only one option can be selected at a time. It's similar to radio buttons but presented as connected buttons in a single row, providing a more compact and visually cohesive interface for mutually exclusive choices.

## Features

- **Single Selection**: Only one option can be selected at a time
- **Smooth Animation**: Animated selection indicator that slides between options
- **Full Keyboard Support**: Navigate with arrow keys, Home/End, Space/Enter
- **Responsive Design**: Handles overflow gracefully on small screens
- **Icon Support**: Options can display icons with or without text
- **Multiple Variants**: Pills (default), square, and underline styles
- **Size Options**: Small, medium, and large sizes
- **Color Schemes**: Primary, secondary, and neutral colors
- **Accessible**: Full ARIA support and screen reader compatibility
- **Form Integration**: Works with form submissions via hidden input

## Usage

```tsx
import { SegmentedControl } from '@claude-flow/ui-kit-react';

function MyComponent() {
  const [view, setView] = useState('list');
  
  const options = [
    { value: 'list', label: 'List' },
    { value: 'grid', label: 'Grid' },
    { value: 'map', label: 'Map' }
  ];
  
  return (
    <SegmentedControl
      options={options}
      value={view}
      onChange={setView}
      ariaLabel="View mode selector"
    />
  );
}
```

## Props

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `options` | `SegmentOption[]` | Array of options to display |
| `value` | `string` | Currently selected value |
| `onChange` | `(value: string) => void` | Handler called when selection changes |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size of the control |
| `variant` | `'pills' \| 'square' \| 'underline'` | `'pills'` | Visual style variant |
| `color` | `'primary' \| 'secondary' \| 'neutral'` | `'primary'` | Color scheme |
| `fullWidth` | `boolean` | `false` | Whether control should fill container width |
| `disabled` | `boolean` | `false` | Disable entire control |
| `showDividers` | `boolean` | `true` | Show dividers between segments |
| `name` | `string` | - | Name for form integration |
| `ariaLabel` | `string` | - | Accessible label for the control |
| `ariaLabelledBy` | `string` | - | ID of element that labels the control |
| `className` | `string` | - | Additional CSS classes |
| `onFocus` | `(event: FocusEvent) => void` | - | Focus event handler |
| `onBlur` | `(event: FocusEvent) => void` | - | Blur event handler |

### SegmentOption Interface

```typescript
interface SegmentOption {
  value: string;        // Unique value for the option
  label: string;        // Display text
  icon?: ReactNode;     // Optional icon
  disabled?: boolean;   // Whether option is disabled
  tooltip?: string;     // Tooltip text
  ariaLabel?: string;   // Custom aria-label for the option
}
```

## Examples

### With Icons

```tsx
const optionsWithIcons = [
  { value: 'list', label: 'List', icon: <ListIcon /> },
  { value: 'grid', label: 'Grid', icon: <GridIcon /> },
  { value: 'map', label: 'Map', icon: <MapIcon /> }
];

<SegmentedControl
  options={optionsWithIcons}
  value={view}
  onChange={setView}
/>
```

### Icon Only

```tsx
const iconOnlyOptions = [
  { value: 'list', label: '', icon: <ListIcon />, ariaLabel: 'List view' },
  { value: 'grid', label: '', icon: <GridIcon />, ariaLabel: 'Grid view' },
  { value: 'map', label: '', icon: <MapIcon />, ariaLabel: 'Map view' }
];

<SegmentedControl
  options={iconOnlyOptions}
  value={view}
  onChange={setView}
/>
```

### Different Variants

```tsx
// Pills (default)
<SegmentedControl options={options} value={value} onChange={onChange} />

// Square
<SegmentedControl variant="square" options={options} value={value} onChange={onChange} />

// Underline
<SegmentedControl variant="underline" options={options} value={value} onChange={onChange} />
```

### Form Integration

```tsx
<form onSubmit={handleSubmit}>
  <SegmentedControl
    options={options}
    value={formData.viewMode}
    onChange={(value) => updateFormData({ viewMode: value })}
    name="viewMode"
  />
  <button type="submit">Submit</button>
</form>
```

### With Disabled Options

```tsx
const options = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'archived', label: 'Archived', disabled: true }
];

<SegmentedControl
  options={options}
  value="active"
  onChange={setStatus}
/>
```

## Keyboard Navigation

- **Tab**: Focus the control
- **Arrow Left/Up**: Navigate to previous option
- **Arrow Right/Down**: Navigate to next option
- **Home**: Jump to first option
- **End**: Jump to last option
- **Space/Enter**: Select focused option

Disabled options are automatically skipped during keyboard navigation.

## Accessibility

The component follows WAI-ARIA guidelines for radio groups:

- Container has `role="radiogroup"`
- Each option has `role="radio"`
- Selected option has `aria-checked="true"`
- Disabled options have `aria-disabled="true"`
- Supports `aria-label` and `aria-labelledby` for group labeling
- Only selected option has `tabIndex="0"` for proper keyboard navigation

## Styling

The component uses CSS modules and respects the design tokens from `@claude-flow/ui-kit`. All visual aspects are customizable through the provided props.

### CSS Classes

The component applies the following CSS classes that can be targeted for additional customization:

- `.container` - Main container
- `.option` - Individual option button
- `.selected` - Selected option
- `.disabled` - Disabled state
- `.indicator` - Selection indicator
- `.icon` - Icon wrapper
- `.label` - Text label
- `.divider` - Divider between options

## Performance

The component is optimized for performance:

- Uses CSS transforms for smooth indicator animation
- Memoizes expensive calculations
- Minimal re-renders on selection changes
- Supports React.memo for parent component optimization

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- RTL language support
- High contrast mode compatible
- Respects `prefers-reduced-motion` for accessibility