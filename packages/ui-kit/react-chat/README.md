# @ui-kit/react-chat

Chat components for React built on UI-Kit design tokens.

## Installation

```bash
pnpm add @ui-kit/react-chat
```

## Components

### ChatInput

A smart chat input component with markdown formatting support, message history, and image attachments.

```tsx
import { ChatInput } from '@ui-kit/react-chat';

function MyChat() {
  const handleSubmit = (data) => {
    console.log('Message:', data.content);
    console.log('Images:', data.images);
  };

  return (
    <ChatInput
      placeholder="Type a message..."
      onSubmit={handleSubmit}
      historyKey="my-chat"
    />
  );
}
```

## Features

### Markdown Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Bold (**text**) |
| `Ctrl+I` | Italic (*text*) |
| `Ctrl+K` | Insert link |
| `Ctrl+`` ` | Inline code |
| `>` at line start | Quote block |

### Submit Behavior

| Mode | Enter | Shift+Enter | Ctrl/Meta+Enter |
|------|-------|-------------|-----------------|
| Single-line (default) | Submit | New line | Toggle to multiline |
| Multiline | New line | New line | Submit |

### Message History

Enable history navigation with the `historyKey` prop:

```tsx
<ChatInput historyKey="my-chat" />
```

- **Up Arrow**: Navigate to previous message
- **Down Arrow**: Navigate to next message
- History is stored in localStorage
- Duplicates are automatically removed

### Image Attachments

Images can be added via:
- **Paste**: `Ctrl+V` with an image in clipboard
- **Drag & Drop**: Drag image files onto the input
- **File Button**: Click the attachment button (if enabled)

```tsx
<ChatInput
  maxImages={5}
  onImageUpload={async (file) => {
    // Upload file and return URL
    const url = await uploadToServer(file);
    return url;
  }}
  onSubmit={(data) => {
    // data.images contains: { name, file, preview, uploadedUrl? }
  }}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | `"Type a message..."` | Placeholder text |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Input size |
| `multiline` | `boolean` | `false` | Start in multiline mode |
| `disabled` | `boolean` | `false` | Disable the input |
| `loading` | `boolean` | `false` | Show loading spinner on send button |
| `error` | `boolean` | `false` | Show error state styling |
| `fullWidth` | `boolean` | `false` | Expand to fill container width |
| `historyKey` | `string` | - | localStorage key for message history |
| `maxImages` | `number` | `10` | Maximum images allowed |
| `onSubmit` | `(data: ChatInputSubmitData) => void` | - | Called when message is submitted |
| `onImageUpload` | `(file: File) => Promise<string>` | - | Upload handler, returns URL |
| `className` | `string` | - | Additional CSS class |

## Types

```typescript
interface ChatInputSubmitData {
  content: string;
  images: ChatInputImage[];
}

interface ChatInputImage {
  name: string;      // Display name (e.g., "Image #1")
  file: File;        // Original file
  preview: string;   // Object URL for preview
  uploadedUrl?: string; // URL from onImageUpload
}
```

## Hooks

### useMessageHistory

Manage message history in localStorage:

```tsx
import { useMessageHistory } from '@ui-kit/react-chat';

function MyComponent() {
  const { getHistory, addToHistory, clearHistory } = useMessageHistory('my-key', 50);

  // Get all history items
  const history = getHistory();

  // Add a message to history
  addToHistory('Hello world');

  // Clear all history
  clearHistory();
}
```

## Styling

The component uses CSS Modules with design tokens from `@ui-kit/core`. All colors, spacing, and typography automatically adapt to the current theme.

### Size Variants

- **sm**: Compact input for constrained spaces
- **md**: Standard size (default)
- **lg**: Large input for prominent placement

### States

- **disabled**: Reduced opacity, no interaction
- **loading**: Spinner on send button, input disabled
- **error**: Red border styling

## Development

```bash
# Start Storybook dev server
pnpm dev

# Run tests
pnpm test

# Build package
pnpm build

# Type check
pnpm typecheck
```

## Dependencies

- `@ui-kit/core` - Design tokens and themes
- `@ui-kit/react` - Base React components (Button, IconButton, Spinner, Tooltip)
- `@ui-kit/icons` - Icon components

## License

MIT
