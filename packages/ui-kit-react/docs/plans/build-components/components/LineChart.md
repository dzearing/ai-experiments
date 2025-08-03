# LineChart Component

## Overview
A line chart component for visualizing continuous data trends over time or ordered categories, supporting multiple series, customizable styling, and interactive features.

## Component Specification

### Props
```typescript
interface LineChartProps extends HTMLAttributes<HTMLDivElement> {
  // Data
  data: ChartDataPoint[];
  
  // Series configuration
  series?: SeriesConfig[];
  xAxisKey?: string; // Key for x-axis values (default: 'x')
  yAxisKey?: string; // Key for y-axis values (default: 'y')
  
  // Axes configuration
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  showGrid?: boolean;
  showAxes?: boolean;
  
  // Line styling
  strokeWidth?: number;
  curveType?: 'linear' | 'smooth' | 'step' | 'monotone';
  showPoints?: boolean;
  pointSize?: number;
  fillArea?: boolean; // Convert to area chart
  
  // Colors and styling
  colors?: string[];
  gradientFill?: boolean;
  
  // Interaction
  interactive?: boolean;
  tooltip?: boolean | TooltipConfig;
  zoom?: boolean;
  pan?: boolean;
  crosshair?: boolean;
  
  // Events
  onPointClick?: (point: ChartDataPoint, series: string) => void;
  onPointHover?: (point: ChartDataPoint | null, series: string) => void;
  
  // Annotations
  annotations?: Annotation[];
  thresholds?: Threshold[];
  
  // Responsive
  responsive?: boolean;
  
  // Animation
  animate?: boolean;
  animationDuration?: number;
  
  // Styling
  className?: string;
}

interface ChartDataPoint {
  [key: string]: any;
  x: number | string | Date;
  y: number;
}

interface SeriesConfig {
  key: string;
  name: string;
  color?: string;
  strokeWidth?: number;
  strokeDashArray?: string;
  showPoints?: boolean;
  fillArea?: boolean;
  visible?: boolean;
}

interface AxisConfig {
  show?: boolean;
  label?: string;
  tickCount?: number;
  tickFormatter?: (value: any) => string;
  domain?: [number, number] | 'auto';
  grid?: boolean;
  gridColor?: string;
}

interface TooltipConfig {
  show?: boolean;
  formatter?: (point: ChartDataPoint, series: string) => ReactNode;
  className?: string;
}

interface Annotation {
  type: 'line' | 'point' | 'area' | 'text';
  x?: number | string | Date;
  y?: number;
  x1?: number | string | Date;
  y1?: number;
  x2?: number | string | Date;
  y2?: number;
  text?: string;
  color?: string;
  style?: CSSProperties;
}

interface Threshold {
  value: number;
  color?: string;
  label?: string;
  strokeDashArray?: string;
}
```

### Usage Examples
```tsx
// Basic line chart
<LineChart 
  data={[
    { x: '2024-01', y: 100 },
    { x: '2024-02', y: 150 },
    { x: '2024-03', y: 120 },
    { x: '2024-04', y: 180 }
  ]}
/>

// Multiple series
<LineChart 
  data={salesData}
  series={[
    { key: 'revenue', name: 'Revenue', color: '#3b82f6' },
    { key: 'profit', name: 'Profit', color: '#10b981' },
    { key: 'costs', name: 'Costs', color: '#ef4444', strokeDashArray: '5,5' }
  ]}
/>

// Smooth curve with area fill
<LineChart 
  data={timeSeriesData}
  curveType="smooth"
  fillArea
  gradientFill
  showPoints={false}
/>

// Interactive chart with custom tooltip
<LineChart 
  data={metricsData}
  interactive
  tooltip={{
    formatter: (point, series) => (
      <div className="p-2">
        <div className="font-semibold">{series}</div>
        <div>Value: {point.y.toLocaleString()}</div>
        <div>Date: {new Date(point.x).toLocaleDateString()}</div>
      </div>
    )
  }}
  zoom
  pan
  crosshair\n/>\n\n// Chart with thresholds and annotations\n<LineChart \n  data={performanceData}\n  thresholds={[\n    { value: 80, color: '#ef4444', label: 'Critical' },\n    { value: 60, color: '#f59e0b', label: 'Warning' }\n  ]}\n  annotations={[\n    {\n      type: 'line',\n      x: '2024-03-15',\n      color: '#6366f1',\n      text: 'Product Launch'\n    },\n    {\n      type: 'area',\n      x1: '2024-04-01',\n      x2: '2024-04-07',\n      color: 'rgba(239, 68, 68, 0.1)',\n      text: 'Maintenance Window'\n    }\n  ]}\n  onPointClick={handlePointClick}\n/>\n\n// Step chart for discrete data\n<LineChart \n  data={statusData}\n  curveType=\"step\"\n  showPoints\n  pointSize={6}\n  strokeWidth={3}\n/>\n\n// Custom axes configuration\n<LineChart \n  data={financialData}\n  xAxis={{\n    label: 'Date',\n    tickFormatter: (value) => new Date(value).toLocaleDateString(),\n    grid: true\n  }}\n  yAxis={{\n    label: 'Price ($)',\n    tickFormatter: (value) => `$${value.toLocaleString()}`,\n    domain: [0, 1000]\n  }}\n/>\n```\n\n## Visual Design\n\n### Line Styles\n- **linear**: Straight lines between points\n- **smooth**: Bezier curves for smooth transitions\n- **step**: Step-wise connections\n- **monotone**: Monotonic cubic interpolation\n\n### Visual Elements\n- Colored line strokes\n- Data points (optional)\n- Area fills with gradients\n- Grid lines for reference\n- Axis labels and ticks\n- Interactive crosshairs\n\n### Interactive Features\n- Hover effects on points\n- Tooltip display\n- Zoom and pan controls\n- Click handlers for data points\n- Legend toggling\n\n## Technical Implementation\n\n### Core Structure\n```typescript\nconst LineChart = forwardRef<HTMLDivElement, LineChartProps>(\n  ({ \n    data,\n    series,\n    xAxisKey = 'x',\n    yAxisKey = 'y',\n    xAxis,\n    yAxis,\n    showGrid = true,\n    showAxes = true,\n    strokeWidth = 2,\n    curveType = 'linear',\n    showPoints = false,\n    pointSize = 4,\n    fillArea = false,\n    colors,\n    gradientFill = false,\n    interactive = true,\n    tooltip = true,\n    zoom = false,\n    pan = false,\n    crosshair = false,\n    onPointClick,\n    onPointHover,\n    annotations = [],\n    thresholds = [],\n    responsive = true,\n    animate = true,\n    animationDuration = 300,\n    className,\n    ...props \n  }, ref) => {\n    const svgRef = useRef<SVGSVGElement>(null);\n    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });\n    const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null);\n    const [zoomTransform, setZoomTransform] = useState<ZoomTransform>(identity);\n    \n    const chartContext = useChartContext();\n    \n    // Process data for multiple series\n    const processedSeries = useMemo(() => {\n      if (series) {\n        return series.map(s => ({\n          ...s,\n          data: data.map(d => ({ x: d[xAxisKey], y: d[s.key] }))\n        }));\n      }\n      \n      return [{\n        key: yAxisKey,\n        name: 'Series 1',\n        data: data.map(d => ({ x: d[xAxisKey], y: d[yAxisKey] }))\n      }];\n    }, [data, series, xAxisKey, yAxisKey]);\n    \n    // Calculate scales\n    const scales = useMemo(() => {\n      const allXValues = processedSeries.flatMap(s => s.data.map(d => d.x));\n      const allYValues = processedSeries.flatMap(s => s.data.map(d => d.y));\n      \n      const xScale = createScale({\n        domain: [min(allXValues), max(allXValues)],\n        range: [0, dimensions.width - MARGINS.left - MARGINS.right],\n        type: typeof allXValues[0] === 'string' ? 'band' : 'linear'\n      });\n      \n      const yScale = createScale({\n        domain: yAxis?.domain || [min(allYValues), max(allYValues)],\n        range: [dimensions.height - MARGINS.top - MARGINS.bottom, 0],\n        type: 'linear'\n      });\n      \n      return { xScale, yScale };\n    }, [processedSeries, dimensions, yAxis]);\n    \n    // Line generator\n    const lineGenerator = useMemo(() => {\n      const generator = d3.line<DataPoint>()\n        .x(d => scales.xScale(d.x))\n        .y(d => scales.yScale(d.y));\n      \n      switch (curveType) {\n        case 'smooth':\n          generator.curve(d3.curveCatmullRom);\n          break;\n        case 'step':\n          generator.curve(d3.curveStepAfter);\n          break;\n        case 'monotone':\n          generator.curve(d3.curveMonotoneX);\n          break;\n        default:\n          generator.curve(d3.curveLinear);\n      }\n      \n      return generator;\n    }, [scales, curveType]);\n    \n    // Area generator for fills\n    const areaGenerator = useMemo(() => {\n      if (!fillArea) return null;\n      \n      return d3.area<DataPoint>()\n        .x(d => scales.xScale(d.x))\n        .y0(scales.yScale(0))\n        .y1(d => scales.yScale(d.y))\n        .curve(lineGenerator.curve());\n    }, [fillArea, scales, lineGenerator]);\n    \n    // Handle point interactions\n    const handlePointInteraction = (event: MouseEvent, point: DataPoint, seriesKey: string) => {\n      if (!interactive) return;\n      \n      const rect = svgRef.current?.getBoundingClientRect();\n      if (!rect) return;\n      \n      const hoveredPoint = {\n        point,\n        seriesKey,\n        x: event.clientX - rect.left,\n        y: event.clientY - rect.top\n      };\n      \n      setHoveredPoint(hoveredPoint);\n      onPointHover?.(point, seriesKey);\n    };\n    \n    const handlePointClick = (point: DataPoint, seriesKey: string) => {\n      onPointClick?.(point, seriesKey);\n    };\n    \n    return (\n      <div\n        ref={ref}\n        className={cn(lineChartStyles.container, className)}\n        data-chart=\"line\"\n        {...props}\n      >\n        <svg\n          ref={svgRef}\n          width={dimensions.width}\n          height={dimensions.height}\n          className={lineChartStyles.svg}\n        >\n          {/* Gradient definitions */}\n          {gradientFill && (\n            <defs>\n              {processedSeries.map((s, index) => (\n                <linearGradient\n                  key={s.key}\n                  id={`gradient-${s.key}`}\n                  x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\"\n                >\n                  <stop\n                    offset=\"0%\"\n                    stopColor={s.color || chartContext.colors[index]}\n                    stopOpacity={0.3}\n                  />\n                  <stop\n                    offset=\"100%\"\n                    stopColor={s.color || chartContext.colors[index]}\n                    stopOpacity={0}\n                  />\n                </linearGradient>\n              ))}\n            </defs>\n          )}\n          \n          <g transform={`translate(${MARGINS.left}, ${MARGINS.top})`}>\n            {/* Grid */}\n            {showGrid && (\n              <ChartGrid\n                xScale={scales.xScale}\n                yScale={scales.yScale}\n                width={dimensions.width - MARGINS.left - MARGINS.right}\n                height={dimensions.height - MARGINS.top - MARGINS.bottom}\n              />\n            )}\n            \n            {/* Thresholds */}\n            {thresholds.map((threshold, index) => (\n              <ThresholdLine\n                key={index}\n                threshold={threshold}\n                xScale={scales.xScale}\n                yScale={scales.yScale}\n                width={dimensions.width - MARGINS.left - MARGINS.right}\n              />\n            ))}\n            \n            {/* Annotations */}\n            {annotations.map((annotation, index) => (\n              <ChartAnnotation\n                key={index}\n                annotation={annotation}\n                xScale={scales.xScale}\n                yScale={scales.yScale}\n              />\n            ))}\n            \n            {/* Series */}\n            {processedSeries.map((s, index) => {\n              if (s.visible === false) return null;\n              \n              const color = s.color || chartContext.colors[index % chartContext.colors.length];\n              const pathData = lineGenerator(s.data);\n              \n              return (\n                <g key={s.key} className={lineChartStyles.series}>\n                  {/* Area fill */}\n                  {fillArea && areaGenerator && (\n                    <path\n                      d={areaGenerator(s.data) || undefined}\n                      fill={gradientFill ? `url(#gradient-${s.key})` : color}\n                      fillOpacity={gradientFill ? 1 : 0.1}\n                      className={lineChartStyles.area}\n                    />\n                  )}\n                  \n                  {/* Line */}\n                  <path\n                    d={pathData || undefined}\n                    fill=\"none\"\n                    stroke={color}\n                    strokeWidth={s.strokeWidth || strokeWidth}\n                    strokeDasharray={s.strokeDashArray}\n                    className={cn(\n                      lineChartStyles.line,\n                      animate && lineChartStyles.animated\n                    )}\n                    style={{\n                      animationDuration: `${animationDuration}ms`\n                    }}\n                  />\n                  \n                  {/* Points */}\n                  {(showPoints || s.showPoints) && s.data.map((point, pointIndex) => (\n                    <circle\n                      key={pointIndex}\n                      cx={scales.xScale(point.x)}\n                      cy={scales.yScale(point.y)}\n                      r={pointSize}\n                      fill={color}\n                      stroke=\"white\"\n                      strokeWidth={2}\n                      className={lineChartStyles.point}\n                      onMouseEnter={(e) => handlePointInteraction(e.nativeEvent, point, s.key)}\n                      onMouseLeave={() => setHoveredPoint(null)}\n                      onClick={() => handlePointClick(point, s.key)}\n                      style={{\n                        cursor: interactive ? 'pointer' : 'default'\n                      }}\n                    />\n                  ))}\n                </g>\n              );\n            })}\n            \n            {/* Crosshair */}\n            {crosshair && hoveredPoint && (\n              <Crosshair\n                x={scales.xScale(hoveredPoint.point.x)}\n                y={scales.yScale(hoveredPoint.point.y)}\n                width={dimensions.width - MARGINS.left - MARGINS.right}\n                height={dimensions.height - MARGINS.top - MARGINS.bottom}\n              />\n            )}\n          </g>\n          \n          {/* Axes */}\n          {showAxes && (\n            <>\n              <XAxis\n                scale={scales.xScale}\n                height={dimensions.height}\n                config={xAxis}\n              />\n              <YAxis\n                scale={scales.yScale}\n                width={dimensions.width}\n                config={yAxis}\n              />\n            </>\n          )}\n        </svg>\n        \n        {/* Tooltip */}\n        {tooltip && hoveredPoint && (\n          <ChartTooltip\n            point={hoveredPoint}\n            config={typeof tooltip === 'object' ? tooltip : undefined}\n          />\n        )}\n      </div>\n    );\n  }\n);\n```\n\n### CSS Module Structure\n```css\n.container {\n  position: relative;\n  width: 100%;\n  height: 100%;\n}\n\n.svg {\n  width: 100%;\n  height: 100%;\n  overflow: visible;\n}\n\n.series {\n  /* Series group styling */\n}\n\n.line {\n  transition: stroke-width 0.2s ease;\n}\n\n.line:hover {\n  stroke-width: 3px;\n}\n\n.animated {\n  stroke-dasharray: 1000;\n  stroke-dashoffset: 1000;\n  animation: drawLine var(--animation-duration, 300ms) ease-out forwards;\n}\n\n.area {\n  transition: opacity 0.2s ease;\n}\n\n.point {\n  transition: r 0.2s ease;\n}\n\n.point:hover {\n  r: 6;\n}\n\n@keyframes drawLine {\n  to {\n    stroke-dashoffset: 0;\n  }\n}\n```\n\n## Accessibility Features\n- Keyboard navigation for interactive elements\n- Screen reader descriptions for data points\n- High contrast mode support\n- Alternative text descriptions\n- ARIA labels for chart elements\n\n## Dependencies\n- React (forwardRef, useState, useMemo, useRef)\n- D3.js (scales, line/area generators, curves)\n- Chart context and utilities\n- CSS modules\n- Utility functions (cn)\n\n## Design Tokens Used\n- **Colors**: line colors, fills, grids\n- **Spacing**: margins, padding\n- **Typography**: axis labels, tooltips\n- **Animations**: draw-in effects\n\n## Testing Considerations\n- Data visualization accuracy\n- Interactive behavior\n- Performance with large datasets\n- Responsive behavior\n- Accessibility compliance\n- Animation performance\n- Cross-browser compatibility\n\n## Related Components\n- ChartContainer (wrapper component)\n- ChartTooltip, ChartLegend (accessories)\n- AreaChart (filled variant)\n- BarChart, PieChart (alternative charts)\n\n## Common Use Cases\n- Time series visualization\n- Trend analysis\n- Performance metrics\n- Financial data\n- Scientific measurements\n- Analytics dashboards\n- Progress tracking\n- Comparative analysis