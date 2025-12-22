import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ChatInput, type ChatInputSubmitData } from './ChatInput';

const meta: Meta<typeof ChatInput> = {
  title: 'Inputs/ChatInput',
  component: ChatInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A smart chat input component with markdown formatting support, message history, and image attachments.

## Features
- **Markdown shortcuts**: Ctrl+B (bold), Ctrl+I (italic), Ctrl+K (link), Ctrl+\` (code)
- **Quote blocks**: Type \`>\` at line start to create a quote
- **History navigation**: Up/Down arrows to cycle through previous messages
- **Image attachments**: Paste or drag & drop images
- **Multiline mode**: Toggle between Enter-to-send and multiline editing

## Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| Ctrl+B | Bold (**text**) |
| Ctrl+I | Italic (*text*) |
| Ctrl+K | Insert link |
| Ctrl+\` | Inline code |
| Enter | Send message (single-line mode) |
| Shift+Enter | New line (single-line mode) |
| Ctrl+Enter | Send message (multiline mode) |
| Up Arrow | Previous history item |
| Down Arrow | Next history item |

## Image Handling
Images can be pasted from clipboard or dragged onto the input. They appear in a "well" above the textarea as "Image #1", "Image #2", etc. Click an image name to insert a \`[Image #N]\` placeholder in your message.
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Input size',
    },
    multiline: {
      control: 'boolean',
      description: 'Enable multiline mode by default',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the input',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state on send button',
    },
    error: {
      control: 'boolean',
      description: 'Show error state',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width input',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    historyKey: {
      control: 'text',
      description: 'localStorage key for message history',
    },
    maxImages: {
      control: 'number',
      description: 'Maximum number of images allowed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatInput>;

export const Default: Story = {
  args: {
    placeholder: 'Type a message...',
    size: 'md',
  },
};

export const WithHistoryDemo: Story = {
  render: () => {
    const [messages, setMessages] = useState<string[]>([]);

    const handleSubmit = (data: ChatInputSubmitData) => {
      setMessages((prev) => [...prev, data.content]);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
        <ChatInput
          placeholder="Type and submit messages, then use Up/Down arrows to recall history..."
          historyKey="storybook-demo"
          onSubmit={handleSubmit}
          fullWidth
        />
        <div style={{ fontSize: '14px', color: 'var(--base-fg-soft)' }}>
          <strong>Sent messages:</strong>
          {messages.length === 0 ? (
            <p>No messages yet. Try typing and pressing Enter!</p>
          ) : (
            <ul>
              {messages.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          )}
          <p>
            <em>Press Up/Down arrows to navigate through your message history.</em>
          </p>
        </div>
      </div>
    );
  },
};

export const WithImageUpload: Story = {
  render: () => {
    const [lastSubmit, setLastSubmit] = useState<ChatInputSubmitData | null>(null);

    const handleSubmit = (data: ChatInputSubmitData) => {
      setLastSubmit(data);
    };

    // Mock upload function
    const handleImageUpload = async (file: File): Promise<string> => {
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return `https://example.com/uploads/${file.name}`;
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
        <ChatInput
          placeholder="Paste or drag an image here..."
          onSubmit={handleSubmit}
          onImageUpload={handleImageUpload}
          fullWidth
        />
        {lastSubmit && (
          <div style={{ fontSize: '14px', color: 'var(--base-fg-soft)' }}>
            <strong>Last submission:</strong>
            <pre style={{ background: 'var(--soft-bg)', padding: '8px', borderRadius: '4px' }}>
              {JSON.stringify(lastSubmit, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  },
};

export const MultilineMode: Story = {
  args: {
    placeholder: 'Multiline mode: Enter creates new lines, Ctrl+Enter sends...',
    multiline: true,
    fullWidth: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
      <div>
        <label style={{ fontSize: '12px', color: 'var(--base-fg-soft)' }}>Small</label>
        <ChatInput size="sm" placeholder="Small input..." fullWidth />
      </div>
      <div>
        <label style={{ fontSize: '12px', color: 'var(--base-fg-soft)' }}>Medium (default)</label>
        <ChatInput size="md" placeholder="Medium input..." fullWidth />
      </div>
      <div>
        <label style={{ fontSize: '12px', color: 'var(--base-fg-soft)' }}>Large</label>
        <ChatInput size="lg" placeholder="Large input..." fullWidth />
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
      <div>
        <label style={{ fontSize: '12px', color: 'var(--base-fg-soft)' }}>Normal</label>
        <ChatInput placeholder="Normal state..." fullWidth />
      </div>
      <div>
        <label style={{ fontSize: '12px', color: 'var(--base-fg-soft)' }}>Disabled</label>
        <ChatInput placeholder="Disabled state..." disabled fullWidth />
      </div>
      <div>
        <label style={{ fontSize: '12px', color: 'var(--base-fg-soft)' }}>Loading</label>
        <ChatInput placeholder="Loading state..." loading fullWidth />
      </div>
      <div>
        <label style={{ fontSize: '12px', color: 'var(--base-fg-soft)' }}>Error</label>
        <ChatInput placeholder="Error state..." error fullWidth />
      </div>
    </div>
  ),
};

export const KeyboardShortcutsDemo: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
      <ChatInput
        placeholder="Try Ctrl+B, Ctrl+I, Ctrl+K, or type > at line start..."
        fullWidth
        onSubmit={(data) => console.log('Submitted:', data)}
      />
      <div style={{ fontSize: '14px', color: 'var(--base-fg-soft)' }}>
        <strong>Try these shortcuts:</strong>
        <ul>
          <li>
            <kbd>Ctrl+B</kbd> - Bold (wraps selection with **)
          </li>
          <li>
            <kbd>Ctrl+I</kbd> - Italic (wraps selection with *)
          </li>
          <li>
            <kbd>Ctrl+K</kbd> - Insert link
          </li>
          <li>
            <kbd>Ctrl+`</kbd> - Inline code
          </li>
          <li>
            <kbd>&gt;</kbd> at line start - Quote block
          </li>
        </ul>
      </div>
    </div>
  ),
};
