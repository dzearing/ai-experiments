# TimePicker Component

## Overview
A time selection component that provides an intuitive interface for choosing hours, minutes, and optionally seconds, with support for different formats and locales.

## Component Specification

### Props
```typescript
interface TimePickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'value'> {
  // Value
  value?: Date | string | null;
  defaultValue?: Date | string | null;
  onChange?: (time: Date | null) => void;
  
  // Format and display
  format?: '12h' | '24h' | 'auto'; // Auto detects from locale
  showSeconds?: boolean;
  showMilliseconds?: boolean;
  use12Hours?: boolean; // Deprecated: use format instead
  
  // Behavior
  disabled?: boolean;
  readOnly?: boolean;
  clearable?: boolean;
  autoFocus?: boolean;
  
  // Validation
  minTime?: Date | string;
  maxTime?: Date | string;
  disabledHours?: number[];
  disabledMinutes?: number[];
  disabledSeconds?: number[];
  
  // Input behavior
  allowKeyboardInput?: boolean;
  placeholder?: string;
  
  // Dropdown behavior
  placement?: 'bottom' | 'top' | 'auto';
  dropdownClassName?: string;
  
  // Step values
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  
  // Localization
  locale?: string;
  
  // Styling
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'filled';
  
  // Events
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  onOpen?: () => void;
  onClose?: () => void;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  
  className?: string;
}
```

### Usage Examples
```tsx
// Basic time picker
<TimePicker
  value={selectedTime}
  onChange={setSelectedTime}
  placeholder="Select time"
/>

// 12-hour format with seconds
<TimePicker
  format="12h"
  showSeconds
  value={appointmentTime}
  onChange={setAppointmentTime}
/>

// 24-hour format
<TimePicker
  format="24h"
  value={militaryTime}
  onChange={setMilitaryTime}
/>

// With time constraints
<TimePicker
  minTime="09:00"
  maxTime="17:00"
  minuteStep={15}
  value={meetingTime}
  onChange={setMeetingTime}
  placeholder="Business hours only"
/>

// Disabled specific times
<TimePicker
  disabledHours={[0, 1, 2, 3, 4, 5, 22, 23]}
  disabledMinutes={[0, 15, 30, 45]} // Only allow quarter hours
  value={scheduledTime}
  onChange={setScheduledTime}
/>

// Read-only with clearable
<TimePicker
  value={displayTime}
  readOnly
  clearable
  onClear={() => setDisplayTime(null)}
/>

// Custom step values
<TimePicker
  hourStep={2}
  minuteStep={5}
  secondStep={10}
  showSeconds
  value={preciseTime}
  onChange={setPreciseTime}
/>

// Localized
<TimePicker
  locale="fr-FR"
  format="auto" // Will use French locale conventions
  value={frenchTime}
  onChange={setFrenchTime}
/>

// Different sizes and variants
<TimePicker size="sm" variant="outline" />
<TimePicker size="md" variant="filled" />
<TimePicker size="lg" variant="default" />

// With keyboard input
<TimePicker
  allowKeyboardInput
  placeholder="Type time (HH:MM)"
  value={typedTime}
  onChange={setTypedTime}
/>
```

## Visual Design

### Size Variants
- **sm**: 32px height, compact spacing
- **md**: 40px height, standard spacing (default)
- **lg**: 48px height, generous spacing

### Style Variants
- **default**: Standard border input
- **outline**: Emphasized border
- **filled**: Background filled styling

### Interactive Elements
- Time input field with clock icon
- Dropdown with time selection wheels/lists
- AM/PM toggle for 12-hour format
- Clear button when clearable
- Step increment/decrement buttons

## Technical Implementation

### Core Structure
```typescript
const TimePicker = forwardRef<HTMLDivElement, TimePickerProps>(
  ({ 
    value,
    defaultValue,
    onChange,
    format = 'auto',
    showSeconds = false,
    showMilliseconds = false,
    use12Hours, // Deprecated
    disabled = false,
    readOnly = false,
    clearable = false,
    autoFocus = false,
    minTime,
    maxTime,
    disabledHours = [],
    disabledMinutes = [],
    disabledSeconds = [],
    allowKeyboardInput = true,
    placeholder,
    placement = 'auto',
    dropdownClassName,
    hourStep = 1,
    minuteStep = 1,
    secondStep = 1,
    locale,
    size = 'md',
    variant = 'default',
    onFocus,
    onBlur,
    onOpen,
    onClose,
    className,
    ...props 
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [selectedTime, setSelectedTime] = useControlledState({
      prop: value,
      defaultProp: defaultValue,
      onChange
    });
    
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Determine format based on locale and settings\n    const resolvedFormat = useMemo(() => {\n      if (use12Hours !== undefined) {\n        return use12Hours ? '12h' : '24h';\n      }\n      \n      if (format === 'auto') {\n        // Detect from locale\n        const formatter = new Intl.DateTimeFormat(locale, { hour: 'numeric' });\n        const sample = formatter.format(new Date(2000, 0, 1, 13, 0, 0));\n        return sample.includes('PM') || sample.includes('AM') ? '12h' : '24h';\n      }\n      \n      return format;\n    }, [format, use12Hours, locale]);\n    \n    // Format time for display\n    const formatTimeDisplay = useCallback((time: Date | null) => {\n      if (!time) return '';\n      \n      const options: Intl.DateTimeFormatOptions = {\n        hour: '2-digit',\n        minute: '2-digit',\n        hour12: resolvedFormat === '12h'\n      };\n      \n      if (showSeconds) {\n        options.second = '2-digit';\n      }\n      \n      return new Intl.DateTimeFormat(locale, options).format(time);\n    }, [resolvedFormat, showSeconds, locale]);\n    \n    // Parse time from string input\n    const parseTimeInput = useCallback((input: string): Date | null => {\n      if (!input.trim()) return null;\n      \n      // Handle various time formats\n      const timeRegex = resolvedFormat === '12h'\n        ? /^(\\d{1,2}):(\\d{2})(?::(\\d{2}))?\\s*(AM|PM)?$/i\n        : /^(\\d{1,2}):(\\d{2})(?::(\\d{2}))?$/;\n      \n      const match = input.trim().match(timeRegex);\n      if (!match) return null;\n      \n      let hours = parseInt(match[1]);\n      const minutes = parseInt(match[2]);\n      const seconds = match[3] ? parseInt(match[3]) : 0;\n      const ampm = match[4]?.toUpperCase();\n      \n      // Convert 12-hour to 24-hour\n      if (resolvedFormat === '12h' && ampm) {\n        if (ampm === 'PM' && hours !== 12) hours += 12;\n        if (ampm === 'AM' && hours === 12) hours = 0;\n      }\n      \n      // Validate ranges\n      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {\n        return null;\n      }\n      \n      const date = new Date();\n      date.setHours(hours, minutes, seconds, 0);\n      \n      return date;\n    }, [resolvedFormat]);\n    \n    // Validate time against constraints\n    const isTimeDisabled = useCallback((time: Date) => {\n      const hours = time.getHours();\n      const minutes = time.getMinutes();\n      const seconds = time.getSeconds();\n      \n      if (disabledHours.includes(hours)) return true;\n      if (disabledMinutes.includes(minutes)) return true;\n      if (disabledSeconds.includes(seconds)) return true;\n      \n      if (minTime) {\n        const min = typeof minTime === 'string' ? parseTimeInput(minTime) : minTime;\n        if (min && time < min) return true;\n      }\n      \n      if (maxTime) {\n        const max = typeof maxTime === 'string' ? parseTimeInput(maxTime) : maxTime;\n        if (max && time > max) return true;\n      }\n      \n      return false;\n    }, [disabledHours, disabledMinutes, disabledSeconds, minTime, maxTime, parseTimeInput]);\n    \n    // Update input value when selected time changes\n    useEffect(() => {\n      if (selectedTime) {\n        setInputValue(formatTimeDisplay(selectedTime));\n      } else {\n        setInputValue('');\n      }\n    }, [selectedTime, formatTimeDisplay]);\n    \n    // Handle input change\n    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {\n      const newValue = e.target.value;\n      setInputValue(newValue);\n      \n      if (allowKeyboardInput) {\n        const parsedTime = parseTimeInput(newValue);\n        if (parsedTime && !isTimeDisabled(parsedTime)) {\n          setSelectedTime(parsedTime);\n        }\n      }\n    };\n    \n    // Handle input blur\n    const handleInputBlur = (e: FocusEvent<HTMLInputElement>) => {\n      if (allowKeyboardInput) {\n        const parsedTime = parseTimeInput(inputValue);\n        if (parsedTime && !isTimeDisabled(parsedTime)) {\n          setSelectedTime(parsedTime);\n        } else if (selectedTime) {\n          setInputValue(formatTimeDisplay(selectedTime));\n        } else {\n          setInputValue('');\n        }\n      }\n      \n      onBlur?.(e);\n    };\n    \n    // Handle time selection from dropdown\n    const handleTimeSelect = (time: Date) => {\n      if (isTimeDisabled(time)) return;\n      \n      setSelectedTime(time);\n      setIsOpen(false);\n    };\n    \n    // Handle clear\n    const handleClear = () => {\n      setSelectedTime(null);\n      setInputValue('');\n      inputRef.current?.focus();\n    };\n    \n    // Generate time options\n    const timeOptions = useMemo(() => {\n      const options: Date[] = [];\n      const baseDate = new Date();\n      baseDate.setSeconds(0, 0);\n      \n      for (let h = 0; h < 24; h += hourStep) {\n        for (let m = 0; m < 60; m += minuteStep) {\n          if (showSeconds) {\n            for (let s = 0; s < 60; s += secondStep) {\n              const time = new Date(baseDate);\n              time.setHours(h, m, s);\n              if (!isTimeDisabled(time)) {\n                options.push(new Date(time));\n              }\n            }\n          } else {\n            const time = new Date(baseDate);\n            time.setHours(h, m, 0);\n            if (!isTimeDisabled(time)) {\n              options.push(new Date(time));\n            }\n          }\n        }\n      }\n      \n      return options;\n    }, [hourStep, minuteStep, secondStep, showSeconds, isTimeDisabled]);\n    \n    return (\n      <div\n        ref={ref}\n        className={cn(\n          timePickerStyles.container,\n          timePickerStyles.size[size],\n          className\n        )}\n        {...props}\n      >\n        <div className={timePickerStyles.inputContainer}>\n          <input\n            ref={inputRef}\n            type=\"text\"\n            value={inputValue}\n            onChange={handleInputChange}\n            onBlur={handleInputBlur}\n            onFocus={(e) => {\n              if (!readOnly && !disabled) {\n                setIsOpen(true);\n                onOpen?.();\n              }\n              onFocus?.(e);\n            }}\n            placeholder={placeholder || (resolvedFormat === '12h' ? 'HH:MM AM/PM' : 'HH:MM')}\n            disabled={disabled}\n            readOnly={!allowKeyboardInput || readOnly}\n            autoFocus={autoFocus}\n            className={cn(\n              timePickerStyles.input,\n              timePickerStyles.variant[variant],\n              disabled && timePickerStyles.disabled\n            )}\n          />\n          \n          {/* Clock icon */}\n          <button\n            type=\"button\"\n            className={timePickerStyles.trigger}\n            onClick={() => {\n              if (!disabled && !readOnly) {\n                setIsOpen(!isOpen);\n                if (!isOpen) onOpen?.();\n                else onClose?.();\n              }\n            }}\n            disabled={disabled}\n          >\n            <Clock className={timePickerStyles.icon} />\n          </button>\n          \n          {/* Clear button */}\n          {clearable && selectedTime && !disabled && !readOnly && (\n            <button\n              type=\"button\"\n              className={timePickerStyles.clearButton}\n              onClick={handleClear}\n              aria-label=\"Clear time\"\n            >\n              <X className={timePickerStyles.clearIcon} />\n            </button>\n          )}\n        </div>\n        \n        {/* Dropdown */}\n        {isOpen && (\n          <Dropdown\n            ref={dropdownRef}\n            placement={placement}\n            onClose={() => {\n              setIsOpen(false);\n              onClose?.();\n            }}\n            className={cn(timePickerStyles.dropdown, dropdownClassName)}\n          >\n            <TimeDropdown\n              options={timeOptions}\n              selectedTime={selectedTime}\n              onSelect={handleTimeSelect}\n              format={resolvedFormat}\n              showSeconds={showSeconds}\n              locale={locale}\n            />\n          </Dropdown>\n        )}\n      </div>\n    );\n  }\n);\n```\n\n### CSS Module Structure\n```css\n.container {\n  position: relative;\n  display: inline-block;\n}\n\n.inputContainer {\n  position: relative;\n  display: flex;\n  align-items: center;\n}\n\n.input {\n  flex: 1;\n  border: 1px solid var(--color-border);\n  border-radius: var(--border-radius-md);\n  padding: var(--spacing-sm) var(--spacing-md);\n  font-family: inherit;\n  font-size: inherit;\n  background: var(--color-surface);\n  color: var(--color-text-primary);\n  transition: border-color 0.15s ease;\n}\n\n.input:focus {\n  outline: none;\n  border-color: var(--color-primary);\n  box-shadow: 0 0 0 2px var(--color-primary-alpha-20);\n}\n\n.input::placeholder {\n  color: var(--color-text-placeholder);\n}\n\n.variant {\n  &.outline {\n    border-width: 2px;\n  }\n  \n  &.filled {\n    background: var(--color-surface-secondary);\n    border-color: transparent;\n  }\n}\n\n.size {\n  &.sm {\n    height: 32px;\n    font-size: var(--font-size-sm);\n  }\n  \n  &.md {\n    height: 40px;\n    font-size: var(--font-size-md);\n  }\n  \n  &.lg {\n    height: 48px;\n    font-size: var(--font-size-lg);\n  }\n}\n\n.trigger {\n  position: absolute;\n  right: var(--spacing-sm);\n  background: transparent;\n  border: none;\n  cursor: pointer;\n  padding: var(--spacing-xs);\n  border-radius: var(--border-radius-sm);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition: background-color 0.15s ease;\n}\n\n.trigger:hover:not(:disabled) {\n  background: var(--color-surface-secondary);\n}\n\n.icon {\n  width: 16px;\n  height: 16px;\n  color: var(--color-text-secondary);\n}\n\n.clearButton {\n  position: absolute;\n  right: 32px;\n  background: transparent;\n  border: none;\n  cursor: pointer;\n  padding: var(--spacing-xs);\n  border-radius: var(--border-radius-sm);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition: background-color 0.15s ease;\n}\n\n.clearButton:hover {\n  background: var(--color-surface-secondary);\n}\n\n.clearIcon {\n  width: 14px;\n  height: 14px;\n  color: var(--color-text-secondary);\n}\n\n.disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n  pointer-events: none;\n}\n\n.dropdown {\n  z-index: 1000;\n  background: var(--color-surface);\n  border: 1px solid var(--color-border);\n  border-radius: var(--border-radius-md);\n  box-shadow: var(--shadow-lg);\n  max-height: 200px;\n  overflow-y: auto;\n}\n```\n\n## Accessibility Features\n- Keyboard navigation support\n- Screen reader compatible\n- ARIA labels and descriptions\n- Focus management\n- Proper input semantics\n\n## Dependencies\n- React (forwardRef, useState, useMemo, useCallback, useEffect, useRef)\n- Internal Dropdown component\n- Icon components (Clock, X)\n- CSS modules\n- Utility functions (cn)\n\n## Design Tokens Used\n- **Colors**: borders, backgrounds, text\n- **Spacing**: padding, margins\n- **Typography**: font sizes\n- **Border Radius**: input and dropdown rounding\n- **Shadows**: dropdown elevation\n- **Transitions**: smooth interactions\n\n## Testing Considerations\n- Time parsing and formatting\n- Locale-specific behavior\n- Keyboard input validation\n- Constraint enforcement\n- Accessibility compliance\n- Cross-browser time handling\n- Different time formats\n\n## Related Components\n- DatePicker (date selection)\n- DateTimePicker (combined picker)\n- Input (base input component)\n- Dropdown (popup container)\n\n## Common Use Cases\n- Appointment scheduling\n- Meeting time selection\n- Business hours configuration\n- Alarm and reminder settings\n- Time-based form inputs\n- Event planning\n- Shift scheduling\n- Time tracking applications