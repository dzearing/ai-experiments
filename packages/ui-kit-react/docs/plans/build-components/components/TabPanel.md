# TabPanel Component

## Overview
Content panel component that displays content associated with a selected tab in a tabbed interface.

## Component Specification

### Props
```typescript
interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  // Content
  children: ReactNode;
  
  // Identification
  value: string; // Matches tab value
  
  // State (controlled by parent)
  active?: boolean; // Whether this panel is currently visible
  
  // Behavior
  lazy?: boolean; // Only render when first activated
  keepMounted?: boolean; // Keep DOM mounted when inactive
  animateHeight?: boolean; // Animate height changes
  
  // Performance
  forceMount?: boolean; // Always mount regardless of active state
  
  // Styling
  className?: string;
  
  // Focus management
  focusable?: boolean; // Whether panel can receive focus
  autoFocus?: boolean; // Focus panel when activated
}
```

### Usage Examples
```tsx
// Basic tab panel (used with TabList)
<TabPanel value="overview" active={activeTab === 'overview'}>
  <h2>Overview Content</h2>
  <p>This is the overview section.</p>
</TabPanel>

// Lazy loading panel
<TabPanel 
  value="heavy-content" 
  active={activeTab === 'heavy-content'}
  lazy
>
  <ExpensiveComponent />
</TabPanel>

// With animation
<TabPanel 
  value="settings" 
  active={activeTab === 'settings'}
  animateHeight
>
  <SettingsForm />
</TabPanel>

// Keep mounted for state preservation
<TabPanel 
  value="form" 
  active={activeTab === 'form'}
  keepMounted
>
  <ComplexForm />
</TabPanel>

// Auto-focus on activation
<TabPanel 
  value="search" 
  active={activeTab === 'search'}
  autoFocus
  focusable
>
  <SearchInterface />
</TabPanel>

// Complete tab interface
<div>
  <TabList value={activeTab} onValueChange={setActiveTab}>
    <Tab value="overview">Overview</Tab>
    <Tab value="details">Details</Tab>
    <Tab value="settings">Settings</Tab>
  </TabList>
  
  <div className="tab-content">
    <TabPanel value="overview" active={activeTab === 'overview'}>
      <OverviewContent />
    </TabPanel>
    <TabPanel value="details" active={activeTab === 'details'} lazy>
      <DetailsContent />
    </TabPanel>
    <TabPanel value="settings" active={activeTab === 'settings'} lazy>
      <SettingsContent />
    </TabPanel>
  </div>
</div>
```

## Visual Design

### Display States
- **Active**: Visible and accessible
- **Inactive**: Hidden from view and screen readers
- **Loading**: Lazy panels showing loading state
- **Animated**: Smooth transitions between states

### Layout Considerations
- Full width of container by default
- Maintains scroll position when switching
- Proper spacing and padding
- Responsive behavior

## Technical Implementation

### Core Structure
```typescript
const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  ({ 
    children,
    value,
    active = false,
    lazy = false,
    keepMounted = false,
    animateHeight = false,
    forceMount = false,
    focusable = true,
    autoFocus = false,
    className,
    ...props 
  }, ref) => {
    const [hasBeenActive, setHasBeenActive] = useState(!lazy || active || forceMount);
    const [isAnimating, setIsAnimating] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    \n    // Track if panel has ever been active for lazy loading\n    useEffect(() => {\n      if (active && !hasBeenActive) {\n        setHasBeenActive(true);\n      }\n    }, [active, hasBeenActive]);\n    \n    // Auto-focus when panel becomes active\n    useEffect(() => {\n      if (active && autoFocus && focusable) {\n        panelRef.current?.focus();\n      }\n    }, [active, autoFocus, focusable]);\n    \n    // Height animation\n    useEffect(() => {\n      if (!animateHeight || !contentRef.current) return;\n      \n      if (active) {\n        setIsAnimating(true);\n        const height = contentRef.current.scrollHeight;\n        panelRef.current?.style.setProperty('height', `${height}px`);\n        \n        const timer = setTimeout(() => {\n          setIsAnimating(false);\n          panelRef.current?.style.removeProperty('height');\n        }, 300);\n        \n        return () => clearTimeout(timer);\n      }\n    }, [active, animateHeight]);\n    \n    // Determine if we should render content\n    const shouldRender = forceMount || hasBeenActive;\n    const shouldShow = active || (keepMounted && hasBeenActive);\n    \n    if (!shouldRender) {\n      return null;\n    }\n    \n    return (\n      <div\n        ref={ref}\n        role=\"tabpanel\"\n        aria-labelledby={`tab-${value}`}\n        aria-hidden={!active}\n        tabIndex={focusable && active ? 0 : -1}\n        className={cn(\n          tabPanelStyles.base,\n          active && tabPanelStyles.active,\n          !active && tabPanelStyles.inactive,\n          animateHeight && tabPanelStyles.animated,\n          isAnimating && tabPanelStyles.animating,\n          className\n        )}\n        style={{\n          display: shouldShow ? undefined : 'none'\n        }}\n        {...props}\n      >\n        <div ref={contentRef} className={tabPanelStyles.content}>\n          {children}\n        </div>\n      </div>\n    );\n  }\n);\n```\n\n### Lazy Loading Hook\n```typescript\n// Optional: Hook for managing lazy loading state\nconst useLazyContent = (active: boolean, lazy: boolean) => {\n  const [shouldRender, setShouldRender] = useState(!lazy || active);\n  \n  useEffect(() => {\n    if (active && !shouldRender) {\n      setShouldRender(true);\n    }\n  }, [active, shouldRender]);\n  \n  return shouldRender;\n};\n```\n\n### CSS Module Structure\n```css\n.base {\n  width: 100%;\n  outline: none;\n}\n\n.active {\n  /* Active panel styles */\n}\n\n.inactive {\n  /* Hidden panel styles */\n}\n\n.content {\n  padding: var(--spacing-md);\n}\n\n.animated {\n  overflow: hidden;\n  transition: height 300ms cubic-bezier(0.4, 0.0, 0.2, 1);\n}\n\n.animating {\n  /* Styles during animation */\n}\n\n/* Focus styles */\n.base:focus {\n  outline: 2px solid var(--color-primary);\n  outline-offset: 2px;\n}\n\n/* Responsive adjustments */\n@media (max-width: 768px) {\n  .content {\n    padding: var(--spacing-sm);\n  }\n}\n```\n\n## Accessibility Features\n- Proper ARIA roles and relationships\n- Hidden state management for screen readers\n- Focus management when panels change\n- Keyboard navigation support\n- Proper labeling association with tabs\n\n### ARIA Implementation\n```typescript\nconst ariaProps = {\n  role: 'tabpanel',\n  'aria-labelledby': `tab-${value}`,\n  'aria-hidden': !active,\n  id: `tabpanel-${value}`,\n  tabIndex: focusable && active ? 0 : -1\n};\n```\n\n## Performance Optimization\n\n### Lazy Loading Strategy\n```typescript\n// Only render expensive content when needed\nconst LazyTabPanel = ({ value, active, children }) => (\n  <TabPanel value={value} active={active} lazy>\n    {active && children}\n  </TabPanel>\n);\n\n// Or with React.lazy for code splitting\nconst LazyComponent = React.lazy(() => import('./ExpensiveComponent'));\n\n<TabPanel value=\"heavy\" active={active} lazy>\n  <Suspense fallback={<Spinner />}>\n    <LazyComponent />\n  </Suspense>\n</TabPanel>\n```\n\n## Dependencies\n- React (forwardRef, useState, useEffect, useRef)\n- CSS modules\n- Utility functions (cn)\n\n## Design Tokens Used\n- **Spacing**: content padding\n- **Colors**: focus outline\n- **Transitions**: animation timing\n- **Border Radius**: panel corners\n\n## Testing Considerations\n- Panel visibility state\n- Lazy loading behavior\n- Focus management\n- Screen reader announcements\n- Height animations\n- Content preservation\n- Performance with large content\n\n## Related Components\n- TabList (tab navigation)\n- Tab (individual tabs)\n- TabPanels (container for multiple panels)\n- Suspense (for lazy loading)\n\n## Common Use Cases\n- Tabbed content sections\n- Settings panels\n- Multi-step forms\n- Data views\n- Documentation sections\n- Dashboard widgets\n- Code editor panels\n- Media galleries