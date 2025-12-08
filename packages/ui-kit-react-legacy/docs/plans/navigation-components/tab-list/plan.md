# TabList Component

## Overview
Container component that manages a collection of Tab components and handles tab selection state.

## Component Specification

### Props
```typescript
interface TabListProps extends HTMLAttributes<HTMLDivElement> {
  // Content
  children: ReactNode;
  
  // State management
  value?: string; // Currently selected tab
  defaultValue?: string; // Default selected tab (uncontrolled)
  onValueChange?: (value: string) => void;
  
  // Visual styling
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'pills' | 'underline' | 'segment';
  
  // Layout
  orientation?: 'horizontal' | 'vertical';
  fullWidth?: boolean; // Tabs stretch to fill width
  scrollable?: boolean; // Enable horizontal scrolling
  
  // Behavior
  activationMode?: 'automatic' | 'manual'; // How tabs activate
  loop?: boolean; // Allow keyboard navigation to wrap
  
  // Styling
  className?: string;
}
```

### Usage Examples
```tsx
// Basic controlled tab list
<TabList value={activeTab} onValueChange={setActiveTab}>
  <Tab value="overview">Overview</Tab>
  <Tab value="details">Details</Tab>
  <Tab value="settings">Settings</Tab>
</TabList>

// Uncontrolled with default
<TabList defaultValue="home">
  <Tab value="home">Home</Tab>
  <Tab value="about">About</Tab>
  <Tab value="contact">Contact</Tab>
</TabList>

// Different variants
<TabList variant="pills" value={selected} onValueChange={setSelected}>
  <Tab value="all">All Items</Tab>
  <Tab value="active">Active</Tab>
  <Tab value="completed">Completed</Tab>
</TabList>

// Vertical orientation
<TabList orientation="vertical" value={currentTab}>
  <Tab value="general">General</Tab>
  <Tab value="security">Security</Tab>
  <Tab value="notifications">Notifications</Tab>
  <Tab value="billing">Billing</Tab>
</TabList>

// Scrollable tabs
<TabList scrollable fullWidth={false}>
  <Tab value="tab1">Very Long Tab Name 1</Tab>
  <Tab value="tab2">Very Long Tab Name 2</Tab>
  <Tab value="tab3">Very Long Tab Name 3</Tab>
  <Tab value="tab4">Very Long Tab Name 4</Tab>
  <Tab value="tab5">Very Long Tab Name 5</Tab>
</TabList>

// Full width tabs
<TabList fullWidth variant="segment">
  <Tab value="week">Week</Tab>
  <Tab value="month">Month</Tab>
  <Tab value="year">Year</Tab>
</TabList>

// Manual activation
<TabList activationMode="manual" value={activeTab}>
  <Tab value="slow-loading">Slow Loading Content</Tab>
  <Tab value="expensive">Expensive Operation</Tab>
</TabList>
```

## Visual Design

### Variants
- **default**: Standard tabs with background styling
- **pills**: Pill-shaped tabs with rounded corners
- **underline**: Tabs with bottom border indicators
- **segment**: Segmented control appearance

### Orientation
- **horizontal**: Standard horizontal tab layout (default)
- **vertical**: Vertical stack of tabs for sidebars

### Layout Options
- **fullWidth**: Tabs expand to fill container width
- **scrollable**: Horizontal scrolling for overflow tabs

## Technical Implementation

### Core Structure
```typescript
const TabList = forwardRef<HTMLDivElement, TabListProps>(
  ({ 
    children,
    value,
    defaultValue,
    onValueChange,
    size = 'md',
    variant = 'default',
    orientation = 'horizontal',
    fullWidth = false,
    scrollable = false,
    activationMode = 'automatic',
    loop = false,
    className,
    ...props 
  }, ref) => {
    const [selectedValue, setSelectedValue] = useControlledState({
      prop: value,
      defaultProp: defaultValue,
      onChange: onValueChange
    });
    
    const tabsRef = useRef<HTMLDivElement>(null);
    const [focusedValue, setFocusedValue] = useState<string | null>(null);
    
    // Get all tab values for keyboard navigation
    const tabValues = useMemo(() => {\n      return React.Children.toArray(children)\n        .filter((child): child is ReactElement => React.isValidElement(child))\n        .map(child => child.props.value)\n        .filter(Boolean);\n    }, [children]);\n    \n    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {\n      const currentIndex = tabValues.indexOf(focusedValue || selectedValue || '');\n      let nextIndex = currentIndex;\n      \n      switch (e.key) {\n        case 'ArrowLeft':\n        case 'ArrowUp':\n          e.preventDefault();\n          nextIndex = currentIndex > 0 ? currentIndex - 1 : (loop ? tabValues.length - 1 : currentIndex);\n          break;\n        case 'ArrowRight':\n        case 'ArrowDown':\n          e.preventDefault();\n          nextIndex = currentIndex < tabValues.length - 1 ? currentIndex + 1 : (loop ? 0 : currentIndex);\n          break;\n        case 'Home':\n          e.preventDefault();\n          nextIndex = 0;\n          break;\n        case 'End':\n          e.preventDefault();\n          nextIndex = tabValues.length - 1;\n          break;\n        case 'Enter':\n        case ' ':\n          if (activationMode === 'manual' && focusedValue) {\n            e.preventDefault();\n            setSelectedValue(focusedValue);\n          }\n          break;\n      }\n      \n      if (nextIndex !== currentIndex) {\n        const nextValue = tabValues[nextIndex];\n        setFocusedValue(nextValue);\n        \n        if (activationMode === 'automatic') {\n          setSelectedValue(nextValue);\n        }\n        \n        // Focus the tab element\n        const tabElement = tabsRef.current?.querySelector(\n          `[data-value=\"${nextValue}\"]`\n        ) as HTMLElement;\n        tabElement?.focus();\n      }\n    };\n    \n    return (\n      <div\n        ref={ref}\n        role=\"tablist\"\n        aria-orientation={orientation}\n        className={cn(\n          tabListStyles.base,\n          tabListStyles.variant[variant],\n          tabListStyles.size[size],\n          tabListStyles.orientation[orientation],\n          fullWidth && tabListStyles.fullWidth,\n          scrollable && tabListStyles.scrollable,\n          className\n        )}\n        onKeyDown={handleKeyDown}\n        {...props}\n      >\n        <div ref={tabsRef} className={tabListStyles.tabsContainer}>\n          {React.Children.map(children, (child) => {\n            if (!React.isValidElement(child)) return child;\n            \n            const isSelected = child.props.value === selectedValue;\n            const isFocused = child.props.value === focusedValue;\n            \n            return React.cloneElement(child, {\n              selected: isSelected,\n              size,\n              variant,\n              'data-value': child.props.value,\n              onClick: (e: MouseEvent) => {\n                child.props.onClick?.(e);\n                if (!child.props.disabled) {\n                  setSelectedValue(child.props.value);\n                  setFocusedValue(child.props.value);\n                }\n              }\n            });\n          })}\n        </div>\n        \n        {/* Scrollable indicators */}\n        {scrollable && (\n          <>\n            <button \n              className={tabListStyles.scrollButton} \n              aria-label=\"Scroll tabs left\"\n            >\n              <ChevronLeft />\n            </button>\n            <button \n              className={tabListStyles.scrollButton} \n              aria-label=\"Scroll tabs right\"\n            >\n              <ChevronRight />\n            </button>\n          </>\n        )}\n      </div>\n    );\n  }\n);\n```\n\n### Controlled State Hook\n```typescript\nfunction useControlledState<T>({\n  prop,\n  defaultProp,\n  onChange\n}: {\n  prop?: T;\n  defaultProp?: T;\n  onChange?: (value: T) => void;\n}) {\n  const [uncontrolledValue, setUncontrolledValue] = useState(defaultProp);\n  const isControlled = prop !== undefined;\n  const value = isControlled ? prop : uncontrolledValue;\n  \n  const setValue = useCallback((nextValue: T) => {\n    if (!isControlled) {\n      setUncontrolledValue(nextValue);\n    }\n    onChange?.(nextValue);\n  }, [isControlled, onChange]);\n  \n  return [value, setValue] as const;\n}\n```\n\n### CSS Module Structure\n```css\n.base {\n  display: flex;\n  position: relative;\n}\n\n.orientation {\n  &.horizontal {\n    flex-direction: row;\n    border-bottom: 1px solid var(--color-border);\n  }\n  \n  &.vertical {\n    flex-direction: column;\n    border-right: 1px solid var(--color-border);\n    width: fit-content;\n  }\n}\n\n.tabsContainer {\n  display: flex;\n  flex: 1;\n}\n\n.orientation.horizontal .tabsContainer {\n  flex-direction: row;\n}\n\n.orientation.vertical .tabsContainer {\n  flex-direction: column;\n}\n\n.fullWidth .tabsContainer {\n  width: 100%;\n}\n\n.fullWidth .tabsContainer > * {\n  flex: 1;\n}\n\n.scrollable {\n  overflow: hidden;\n}\n\n.scrollable .tabsContainer {\n  overflow-x: auto;\n  scrollbar-width: none;\n  -ms-overflow-style: none;\n}\n\n.scrollable .tabsContainer::-webkit-scrollbar {\n  display: none;\n}\n\n.scrollButton {\n  position: absolute;\n  top: 50%;\n  transform: translateY(-50%);\n  background: var(--color-surface);\n  border: 1px solid var(--color-border);\n  border-radius: var(--border-radius-sm);\n  width: 24px;\n  height: 24px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  cursor: pointer;\n  z-index: 1;\n}\n\n.scrollButton:first-of-type {\n  left: 4px;\n}\n\n.scrollButton:last-of-type {\n  right: 4px;\n}\n\n.variant {\n  &.default {\n    /* Standard tab list styling */\n  }\n  \n  &.pills .tabsContainer {\n    gap: var(--spacing-xs);\n    padding: var(--spacing-xs);\n    background: var(--color-surface-secondary);\n    border-radius: var(--border-radius-lg);\n  }\n  \n  &.underline {\n    border-bottom: 1px solid var(--color-border);\n  }\n  \n  &.segment .tabsContainer {\n    border: 1px solid var(--color-border);\n    border-radius: var(--border-radius-md);\n    overflow: hidden;\n  }\n}\n\n.size {\n  /* Size variants applied to child tabs */\n}\n```\n\n## Accessibility Features\n- Proper ARIA roles and orientation\n- Keyboard navigation (arrow keys, home, end)\n- Focus management\n- Screen reader support\n- Tab activation modes\n\n### ARIA Implementation\n```typescript\nconst ariaProps = {\n  role: 'tablist',\n  'aria-orientation': orientation,\n  'aria-multiselectable': false\n};\n```\n\n## Dependencies\n- React (forwardRef, useState, useMemo, useCallback)\n- CSS modules\n- Utility functions (cn)\n- Icon components (ChevronLeft, ChevronRight)\n\n## Design Tokens Used\n- **Colors**: borders, backgrounds\n- **Spacing**: gaps, padding\n- **Border Radius**: container rounding\n- **Transitions**: smooth interactions\n\n## Testing Considerations\n- Keyboard navigation in all directions\n- Screen reader announcements\n- Controlled vs uncontrolled behavior\n- Tab activation modes\n- Scrollable overflow\n- Orientation switching\n- Focus management\n\n## Related Components\n- Tab (individual tab items)\n- TabPanel (content component)\n- TabPanels (content container)\n\n## Common Use Cases\n- Navigation interfaces\n- Settings panels\n- Content categorization\n- Multi-view dashboards\n- Form sections\n- Data filtering\n- Editor interfaces