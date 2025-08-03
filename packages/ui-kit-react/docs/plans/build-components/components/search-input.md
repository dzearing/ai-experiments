# SearchInput

**Priority**: High

**Description**: Enhanced search field with built-in features for better search UX.

**Base Component**: Input (extends all Input props)

**Component Dependencies**:
- Input (base input functionality)
- Button (search button, clear button)
- IconButton (search icon, voice input)
- Spinner (loading state)
- Dropdown (recent searches)
- VoiceInput (optional voice search)

**API Surface Extension**:
```typescript
interface SearchInputProps extends InputProps {
  // Search behavior
  onSearch?: (query: string) => void;
  searchOnType?: boolean;
  debounceMs?: number;
  
  // UI elements
  showSearchButton?: boolean;
  showClearButton?: boolean;
  showSearchIcon?: boolean;
  
  // Loading state
  loading?: boolean;
  loadingText?: string;
  
  // Voice search
  enableVoice?: boolean;
  voiceLanguage?: string;
  
  // Recent searches
  showRecentSearches?: boolean;
  recentSearches?: string[];
  onRecentSearchSelect?: (search: string) => void;
  
  // Keyboard shortcuts
  shortcuts?: KeyboardShortcut[];
  
  // Mobile optimization
  mobileKeyboard?: 'search' | 'default';
}
```

**Features**:
- Search icon
- Clear button
- Loading state
- Voice input option
- Search button
- Placeholder animation
- Character count
- Recent searches
- Keyboard shortcuts
- Mobile optimized

**Use Cases**:
- Global search
- Page search
- Filter inputs
- Quick find
- Navigation search