# SmartPromptInput

**Priority**: High

**Description**: A sophisticated multi-line input component designed specifically for AI chat interfaces. It provides advanced features like command history, autocomplete for mentions and tags, and intelligent paste handling.

**Base Component**: TextArea (extends all TextArea props)

**Component Dependencies**:
- TextArea (base input functionality)
- MentionAutocomplete (@ mention suggestions)
- HashtagAutocomplete (# tag suggestions)
- PromptHistory (command history)
- ImagePasteHandler (image paste processing)
- TextPasteHandler (large text paste processing)
- VoiceInput (optional voice input)
- ChatToolbar (formatting toolbar)

**API Surface Extension**:
```typescript
interface SmartPromptInputProps extends TextAreaProps {
  // History management
  enableHistory?: boolean;
  historyLimit?: number;
  onHistoryChange?: (history: string[]) => void;
  
  // Autocomplete features
  enableMentions?: boolean;
  enableHashtags?: boolean;
  mentionDataSource?: MentionDataSource;
  hashtagDataSource?: HashtagDataSource;
  
  // Paste handling
  enableSmartPaste?: boolean;
  onImagePaste?: (images: File[]) => void;
  onTextPaste?: (text: string, summary?: string) => void;
  
  // Voice input
  enableVoiceInput?: boolean;
  voiceLanguage?: string;
  
  // Toolbar
  showToolbar?: boolean;
  toolbarActions?: ToolbarAction[];
}
```

**Features**:
- Multi-line support with Shift+Enter for new lines
- Command history navigation with up/down arrows
- @ mention autocomplete for users, files, or entities
- # tag autocomplete for memory and categorization
- File path autocomplete with fuzzy matching
- Smart paste handling for images and large text blocks
- Character/token counting
- Inline markdown preview
- Voice input support
- Customizable toolbar

**Use Cases**:
- Main chat interface input
- Command palette inputs
- Search boxes with advanced features
- Code editors with AI assistance
- Documentation writers