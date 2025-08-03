# MentionAutocomplete

**Priority**: High

**Description**: Provides intelligent autocomplete suggestions when typing @ mentions in text inputs.

**Base Component**: AutocompleteInput (extends all AutocompleteInput props)

**Component Dependencies**:
- AutocompleteInput (base autocomplete functionality)
- Avatar (user avatars in suggestions)
- List (suggestion list display)
- SearchHighlight (highlight matching text)
- Chip (selected mentions display)

**API Surface Extension**:
```typescript
interface MentionAutocompleteProps extends AutocompleteInputProps {
  // Data sources
  users?: User[];
  files?: File[];
  channels?: Channel[];
  
  // Trigger character
  trigger?: string; // default '@'
  
  // Display options
  showAvatars?: boolean;
  groupSuggestions?: boolean;
  
  // Permissions
  filterByPermissions?: boolean;
  currentUser?: User;
  
  // Rendering
  mentionRenderer?: (mention: Mention) => React.ReactNode;
  
  // Events
  onMentionSelect?: (mention: Mention) => void;
  onMentionRemove?: (mention: Mention) => void;
}
```

**Features**:
- Fuzzy search matching
- User avatars in suggestions
- Recent mentions priority
- Grouped suggestions (users, files, channels)
- Keyboard navigation
- Custom mention rendering
- Permission-aware filtering
- Offline support

**Use Cases**:
- Chat mentions
- Comment systems
- Task assignments
- Document collaboration