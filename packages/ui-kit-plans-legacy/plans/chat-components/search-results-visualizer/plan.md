# Search Results Visualizer Component Plan

## Overview
Component for displaying code search results with context, highlighting, and navigation.

## Component Details

### Name
`SearchResultsVisualizer`

### Purpose
Present search results with matched text highlighting, file context, and quick navigation.

### Props Interface
```typescript
interface SearchResultsVisualizerProps {
  results: SearchResult[]
  query: string
  groupBy?: 'file' | 'relevance' | 'type'
  maxResultsPerFile?: number
  showContext?: boolean
  contextLines?: number
  onResultClick?: (result: SearchMatch) => void
  onFileClick?: (filePath: string) => void
  highlightMatches?: boolean
  showStats?: boolean
}

interface SearchResult {
  filePath: string
  fileType: string
  matches: SearchMatch[]
  totalMatches: number
  relevanceScore?: number
}

interface SearchMatch {
  line: number
  column: number
  text: string
  contextBefore?: string[]
  contextAfter?: string[]
  matchLength: number
  snippet: string
  type?: 'exact' | 'fuzzy' | 'regex'
}

interface SearchStats {
  totalFiles: number
  totalMatches: number
  searchTime: number
  truncated: boolean
}
```

## Design Tokens Usage

### Colors
- Match highlight: `--color-warning-backgroundSoft20`
- Match text: `--color-warning-text`
- File path: `--color-info-text`
- Line numbers: `--color-body-textSoft20`
- Context: `--color-body-textSoft10`

### Spacing
- Result padding: `--spacing-small10`
- File group gap: `--spacing`
- Match indent: `--spacing-large10`

### Typography
- File names: `--font-weight-medium`
- Match text: `--font-family-mono`, `--font-size-small10`
- Stats: `--font-size-small20`

## States

### Display Modes

#### Grouped by File
- File path as header
- Matches nested below
- File match count badge
- Collapsible file sections

#### Grouped by Relevance
- Most relevant first
- Score indicators
- Mixed file results
- Relevance explanation

#### Flat List
- Simple match list
- Continuous scrolling
- Minimal UI

### Match States
- **Highlighted**: Yellow background on search terms
- **Focused**: Outline on keyboard navigation
- **Previewing**: Expanded context
- **Visited**: Slightly dimmed

## Behaviors

### Search Highlighting
- Case-insensitive highlighting
- Multiple term highlighting
- Regex pattern visualization
- Fuzzy match indication

### Context Display
- Expandable context lines
- Syntax highlighting in context
- Line number display
- Column position indicator

### Navigation
- Jump to next/previous match
- Keyboard shortcuts (F3/Shift+F3)
- Click to open file
- Copy match location

### Filtering
- Filter by file type
- Filter by path pattern
- Minimum relevance score
- Hide duplicate matches

## Responsive Design

### Desktop
- Multi-column layout option
- Wide context display
- Hover previews
- Sticky headers

### Mobile
- Single column
- Collapsible context
- Touch-friendly targets
- Swipe navigation

## Accessibility

### Keyboard Navigation
- Tab through results
- Enter to select
- Arrow keys for context
- Shortcuts announced

### Screen Reader Support
- Match count announcements
- File structure context
- Search term highlighting
- Navigation hints

## Performance Considerations

### Optimization Strategies
- Virtual scrolling for many results
- Lazy render file groups
- Debounced highlighting
- Progressive result loading

### Bundle Size
- Lightweight highlighting
- Optional syntax highlighting
- Minimal dependencies

## Integration Examples

### Basic Usage
```jsx
<SearchResultsVisualizer
  results={[
    {
      filePath: '/src/App.tsx',
      fileType: 'typescript',
      matches: [
        {
          line: 42,
          column: 15,
          text: 'const [search, setSearch] = useState("")',
          matchLength: 6,
          snippet: 'search'
        }
      ],
      totalMatches: 3
    }
  ]}
  query="search"
/>
```

### With Options
```jsx
<SearchResultsVisualizer
  results={searchResults}
  query="useState"
  groupBy="relevance"
  maxResultsPerFile={5}
  showContext={true}
  contextLines={2}
  highlightMatches={true}
  showStats={true}
  onResultClick={(match) => openFile(match)}
/>
```

## Visual Examples

### Grouped View
```
📄 src/components/SearchBar.tsx (5 matches)
  42:15  const [search, setSearch] = useState("")
         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^~~~~~~~~
  
  88:8   if (search.length > 0) {
         ~~~~~^^^^^^^~~~~~~~~~~~~~~~~

📄 src/utils/helpers.ts (2 matches)
  15:22  export function searchItems(query) {
         ~~~~~~~~~~~~~~~~~^^^^^^^~~~~~~~~~~~~~
```

### Compact View
```
SearchBar.tsx:42  [search, setSearch] = useState
SearchBar.tsx:88  if (search.length > 0)
helpers.ts:15     function searchItems(query)
```

## Implementation Priority
**High** - Core feature for code search tools

## Dependencies
- Text highlighting library
- Virtual scroll
- Syntax highlighter (optional)
- Copy-to-clipboard

## Open Questions
1. Should we support saved searches?
2. How to handle very long lines?
3. Should we show git blame info?
4. Maximum results before pagination?