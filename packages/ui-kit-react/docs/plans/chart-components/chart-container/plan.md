# ChartContainer Component

## Overview
A container component that provides common chart functionality including responsive behavior, theming, and standardized layout for all chart types.

## Component Specification

### Props
```typescript
interface ChartContainerProps extends HTMLAttributes<HTMLDivElement> {
  // Dimensions
  width?: number | string;
  height?: number | string;
  aspectRatio?: number; // width/height ratio
  
  // Responsive behavior
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  
  // Content
  children: ReactNode;
  title?: string;
  description?: string;
  
  // Loading and error states
  loading?: boolean;
  error?: string | Error;
  empty?: boolean;
  emptyMessage?: string;
  
  // Toolbar and actions
  toolbar?: ReactNode;
  actions?: ReactNode;
  
  // Theme and styling
  theme?: 'light' | 'dark' | 'auto';
  colorScheme?: string[]; // Custom color palette
  
  // Animation
  animationEnabled?: boolean;
  animationDuration?: number;
  
  // Accessibility
  ariaLabel?: string;
  ariaDescription?: string;
  
  // Export functionality
  exportable?: boolean;
  exportFormats?: ('png' | 'svg' | 'pdf' | 'csv')[];
  onExport?: (format: string, data: any) => void;
  
  // Styling
  className?: string;
  contentClassName?: string;
}
```

### Usage Examples
```tsx
// Basic chart container
<ChartContainer 
  height={300}
  title="Sales Overview"
  description="Monthly sales data for the current year"
>
  <LineChart data={salesData} />
</ChartContainer>

// Responsive container with aspect ratio
<ChartContainer 
  responsive
  aspectRatio={16/9}
  title="Revenue Trends"
>
  <AreaChart data={revenueData} />
</ChartContainer>

// With loading state
<ChartContainer 
  height={400}
  loading={isLoadingData}
  title="User Analytics"
>
  <BarChart data={analyticsData} />
</ChartContainer>

// With error handling
<ChartContainer 
  height={350}
  error={dataError}
  title="System Metrics"
>
  <LineChart data={metricsData} />
</ChartContainer>

// With toolbar and actions
<ChartContainer 
  height={300}
  title="Project Timeline"
  toolbar={
    <div className="flex gap-2">
      <Select value={timeRange} onValueChange={setTimeRange}>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
      </Select>
    </div>
  }
  actions={
    <div className="flex gap-1">
      <IconButton icon={<Refresh />} onClick={refreshData} />
      <IconButton icon={<Download />} onClick={exportChart} />
    </div>
  }
>
  <GanttChart data={projectData} />
</ChartContainer>

// Empty state
<ChartContainer 
  height={300}
  empty={data.length === 0}
  emptyMessage="No data available for the selected period"
  title="Dashboard Metrics"
>
  <DashboardChart data={data} />
</ChartContainer>

// Custom theme and colors
<ChartContainer 
  height={400}
  theme="dark"
  colorScheme={['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']}
  title="Custom Styled Chart"
>
  <PieChart data={categoryData} />
</ChartContainer>

// Exportable chart
<ChartContainer 
  height={350}
  exportable
  exportFormats={['png', 'svg', 'csv']}
  onExport={handleExport}
  title="Quarterly Results"
>
  <ComboChart data={quarterlyData} />
</ChartContainer>
```

## Visual Design

### Layout Structure
- Header with title and description
- Toolbar area for controls
- Main chart content area
- Footer for legends or additional info
- Action buttons positioned consistently

### Responsive Behavior
- Automatic resizing based on container
- Aspect ratio preservation
- Mobile-optimized layouts
- Breakpoint-aware element hiding

### State Indicators
- Loading spinner with skeleton
- Error messages with retry options
- Empty state illustrations
- Data update animations

## Technical Implementation

### Core Structure
```typescript
const ChartContainer = forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ 
    width,
    height = 300,
    aspectRatio,
    responsive = true,
    maintainAspectRatio = true,
    children,
    title,
    description,
    loading = false,
    error,
    empty = false,
    emptyMessage = 'No data available',
    toolbar,
    actions,
    theme = 'auto',
    colorScheme,
    animationEnabled = true,
    animationDuration = 300,
    ariaLabel,
    ariaDescription,
    exportable = false,
    exportFormats = ['png', 'svg'],
    onExport,
    className,
    contentClassName,
    ...props 
  }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [currentTheme, setCurrentTheme] = useState(theme);
    
    // Responsive dimensions handling
    useEffect(() => {
      if (!responsive) return;
      
      const observer = new ResizeObserver(entries => {
        const entry = entries[0];
        if (entry) {
          const { width: containerWidth, height: containerHeight } = entry.contentRect;
          
          let newWidth = containerWidth;
          let newHeight = height;
          
          if (aspectRatio && maintainAspectRatio) {
            newHeight = containerWidth / aspectRatio;
          }
          
          setDimensions({ width: newWidth, height: newHeight });
        }
      });
      
      if (containerRef.current) {
        observer.observe(containerRef.current);
      }
      
      return () => observer.disconnect();
    }, [responsive, aspectRatio, maintainAspectRatio, height]);
    
    // Theme detection\n    useEffect(() => {\n      if (theme === 'auto') {\n        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');\n        setCurrentTheme(mediaQuery.matches ? 'dark' : 'light');\n        \n        const handleChange = (e: MediaQueryListEvent) => {\n          setCurrentTheme(e.matches ? 'dark' : 'light');\n        };\n        \n        mediaQuery.addEventListener('change', handleChange);\n        return () => mediaQuery.removeEventListener('change', handleChange);\n      } else {\n        setCurrentTheme(theme);\n      }\n    }, [theme]);\n    \n    // Export functionality\n    const handleExport = async (format: string) => {\n      if (!onExport) return;\n      \n      try {\n        // Implementation would depend on chart library\n        // This is a simplified example\n        const chartElement = containerRef.current?.querySelector('[data-chart]');\n        if (chartElement) {\n          onExport(format, { element: chartElement, title });\n        }\n      } catch (error) {\n        console.error('Export failed:', error);\n      }\n    };\n    \n    const containerStyle = {\n      width: responsive ? '100%' : width,\n      height: responsive ? dimensions.height : height,\n      ...(aspectRatio && !responsive && { aspectRatio: aspectRatio.toString() })\n    };\n    \n    return (\n      <div\n        ref={ref}\n        className={cn(\n          chartContainerStyles.base,\n          chartContainerStyles.theme[currentTheme],\n          className\n        )}\n        style={containerStyle}\n        {...props}\n      >\n        {/* Header */}\n        {(title || description || toolbar || actions) && (\n          <div className={chartContainerStyles.header}>\n            <div className={chartContainerStyles.headerContent}>\n              {title && (\n                <h3 className={chartContainerStyles.title}>\n                  {title}\n                </h3>\n              )}\n              {description && (\n                <p className={chartContainerStyles.description}>\n                  {description}\n                </p>\n              )}\n            </div>\n            \n            {toolbar && (\n              <div className={chartContainerStyles.toolbar}>\n                {toolbar}\n              </div>\n            )}\n            \n            {(actions || exportable) && (\n              <div className={chartContainerStyles.actions}>\n                {actions}\n                {exportable && (\n                  <ExportMenu \n                    formats={exportFormats}\n                    onExport={handleExport}\n                  />\n                )}\n              </div>\n            )}\n          </div>\n        )}\n        \n        {/* Content Area */}\n        <div \n          ref={containerRef}\n          className={cn(\n            chartContainerStyles.content,\n            contentClassName\n          )}\n          role=\"img\"\n          aria-label={ariaLabel || title}\n          aria-description={ariaDescription || description}\n        >\n          {loading ? (\n            <ChartSkeleton height={dimensions.height || height} />\n          ) : error ? (\n            <ChartError \n              error={error} \n              onRetry={() => window.location.reload()}\n            />\n          ) : empty ? (\n            <ChartEmpty message={emptyMessage} />\n          ) : (\n            <ChartThemeProvider \n              theme={currentTheme}\n              colorScheme={colorScheme}\n              animationEnabled={animationEnabled}\n              animationDuration={animationDuration}\n            >\n              {children}\n            </ChartThemeProvider>\n          )}\n        </div>\n      </div>\n    );\n  }\n);\n```\n\n### Theme Provider Component\n```typescript\ninterface ChartThemeProviderProps {\n  children: ReactNode;\n  theme: 'light' | 'dark';\n  colorScheme?: string[];\n  animationEnabled: boolean;\n  animationDuration: number;\n}\n\nconst ChartThemeProvider = ({\n  children,\n  theme,\n  colorScheme,\n  animationEnabled,\n  animationDuration\n}: ChartThemeProviderProps) => {\n  const themeConfig = {\n    theme,\n    colors: colorScheme || getDefaultColorScheme(theme),\n    animation: {\n      enabled: animationEnabled,\n      duration: animationDuration\n    }\n  };\n  \n  return (\n    <ChartContext.Provider value={themeConfig}>\n      {children}\n    </ChartContext.Provider>\n  );\n};\n```\n\n### CSS Module Structure\n```css\n.base {\n  position: relative;\n  background: var(--color-surface);\n  border: 1px solid var(--color-border);\n  border-radius: var(--border-radius-lg);\n  overflow: hidden;\n}\n\n.theme {\n  &.light {\n    --chart-background: var(--color-surface);\n    --chart-text: var(--color-text-primary);\n    --chart-grid: var(--color-border);\n  }\n  \n  &.dark {\n    --chart-background: var(--color-surface-dark);\n    --chart-text: var(--color-text-primary-dark);\n    --chart-grid: var(--color-border-dark);\n  }\n}\n\n.header {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: var(--spacing-md);\n  padding: var(--spacing-md) var(--spacing-lg) var(--spacing-sm);\n  border-bottom: 1px solid var(--color-border);\n  background: var(--color-surface-secondary);\n}\n\n.headerContent {\n  flex: 1;\n  min-width: 0;\n}\n\n.title {\n  font-size: var(--font-size-lg);\n  font-weight: var(--font-weight-semibold);\n  color: var(--color-text-primary);\n  margin: 0 0 var(--spacing-xs) 0;\n  line-height: 1.4;\n}\n\n.description {\n  font-size: var(--font-size-sm);\n  color: var(--color-text-secondary);\n  margin: 0;\n  line-height: 1.4;\n}\n\n.toolbar {\n  display: flex;\n  align-items: center;\n  gap: var(--spacing-sm);\n}\n\n.actions {\n  display: flex;\n  align-items: center;\n  gap: var(--spacing-xs);\n}\n\n.content {\n  position: relative;\n  padding: var(--spacing-lg);\n  background: var(--chart-background);\n  color: var(--chart-text);\n}\n\n/* Responsive adjustments */\n@media (max-width: 768px) {\n  .header {\n    flex-direction: column;\n    align-items: stretch;\n    gap: var(--spacing-sm);\n  }\n  \n  .toolbar,\n  .actions {\n    justify-content: center;\n  }\n  \n  .content {\n    padding: var(--spacing-md);\n  }\n}\n```\n\n## Accessibility Features\n- Proper ARIA roles and labels\n- Screen reader descriptions\n- Keyboard navigation for interactive elements\n- High contrast theme support\n- Alternative text for chart content\n\n### ARIA Implementation\n```typescript\nconst ariaProps = {\n  role: 'img',\n  'aria-label': ariaLabel || title,\n  'aria-description': ariaDescription || description,\n  'aria-hidden': loading || error || empty\n};\n```\n\n## Dependencies\n- React (forwardRef, useState, useEffect, useRef)\n- ResizeObserver API\n- Chart context and theming utilities\n- CSS modules\n- Utility functions (cn)\n\n## Design Tokens Used\n- **Colors**: theme-aware color schemes\n- **Spacing**: padding, gaps, margins\n- **Typography**: title and description styling\n- **Border Radius**: container rounding\n- **Borders**: container and section dividers\n\n## Testing Considerations\n- Responsive behavior across breakpoints\n- Theme switching functionality\n- Loading and error state handling\n- Export functionality\n- Accessibility compliance\n- Performance with large datasets\n- Animation preferences\n\n## Related Components\n- LineChart, BarChart, PieChart (chart implementations)\n- ChartTooltip, ChartLegend (chart accessories)\n- ExportMenu (export functionality)\n- ChartSkeleton (loading states)\n\n## Common Use Cases\n- Dashboard widgets\n- Analytics reports\n- Financial charts\n- Performance metrics\n- Data visualizations\n- Real-time monitoring\n- Comparative analysis\n- Trend visualization