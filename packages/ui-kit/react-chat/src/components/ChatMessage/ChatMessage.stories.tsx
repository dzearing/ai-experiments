import type { Meta, StoryObj } from '@storybook/react';
import { ChatMessage, type ChatMessageToolCall } from './ChatMessage';

const meta: Meta<typeof ChatMessage> = {
  title: 'React Chat/ChatMessage',
  component: ChatMessage,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Displays a single message in a chat interface with support for avatars, markdown, and AI features.

## When to Use

- Displaying messages in a chat or conversation UI
- Showing AI assistant responses with tool calls
- Building collaborative editing or commenting interfaces

## Features

| Feature | Description |
|---------|-------------|
| **Avatar** | Shows sender's avatar with fallback to initials |
| **Markdown** | Renders content as markdown by default |
| **Consecutive grouping** | Hides redundant avatars for messages from same sender |
| **Streaming** | Animated indicator for AI responses being generated |
| **Tool calls** | Display AI tool/function calls with status |
| **Hover toolbar** | Shows timestamp, copy, and optional edit on hover |

## Accessibility

- Toolbar buttons are keyboard accessible via focus-within
- Streaming indicator has \`aria-label\` for screen readers
- Message IDs available via \`data-message-id\` attribute

## Usage

\`\`\`tsx
import { ChatMessage } from '@ui-kit/react-chat';

<ChatMessage
  id="msg-1"
  content="Hello! How can I help you today?"
  timestamp={new Date()}
  senderName="Assistant"
  senderColor="#6366f1"
/>
\`\`\`
        `,
      },
    },
  },
  args: {
    onEdit: (messageId) => console.log('Edit clicked:', messageId),
  },
  argTypes: {
    id: {
      control: 'text',
      description: 'Unique message identifier',
    },
    content: {
      control: 'text',
      description: 'Message content (text or markdown)',
    },
    timestamp: {
      control: 'date',
      description: 'When the message was sent',
    },
    senderName: {
      control: 'text',
      description: "Sender's display name",
    },
    senderColor: {
      control: 'color',
      description: "Sender's avatar color",
    },
    isOwn: {
      control: 'boolean',
      description: 'Whether this is from the current user (highlights message)',
    },
    isConsecutive: {
      control: 'boolean',
      description: 'Whether this follows another message from same sender',
    },
    renderMarkdown: {
      control: 'boolean',
      description: 'Whether to render content as markdown',
    },
    isStreaming: {
      control: 'boolean',
      description: 'Whether the message is being streamed (AI generating)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatMessage>;

const now = new Date();
const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);

export const Default: Story = {
  args: {
    id: 'msg-1',
    content: 'Hello! How can I help you today?',
    timestamp: now,
    senderName: 'Assistant',
    senderColor: '#6366f1',
  },
};

export const WithMarkdown: Story = {
  args: {
    id: 'msg-2',
    content: `Here's an example with **bold**, *italic*, and \`inline code\`.

You can also use:
- Bullet lists
- Like this one

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

And [links](https://example.com) work too!`,
    timestamp: now,
    senderName: 'Assistant',
    senderColor: '#6366f1',
  },
  parameters: {
    docs: {
      description: {
        story: 'Messages render markdown by default, including code blocks, lists, and links.',
      },
    },
  },
};

export const OwnMessage: Story = {
  args: {
    id: 'msg-3',
    content: 'This is my own message with highlighting applied.',
    timestamp: now,
    senderName: 'You',
    senderColor: '#10b981',
    isOwn: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Messages from the current user are highlighted with a background color.',
      },
    },
  },
};

export const Streaming: Story = {
  args: {
    id: 'msg-4',
    content: 'I am currently generating a response',
    timestamp: now,
    senderName: 'Assistant',
    senderColor: '#6366f1',
    isStreaming: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows an animated indicator when the AI is generating a response.',
      },
    },
  },
};

const sampleToolCalls: ChatMessageToolCall[] = [
  { name: 'search_web', input: { query: 'weather' }, output: 'Sunny, 72°F' },
  { name: 'read_file', input: { path: '/docs/readme.md' }, output: '# Documentation...' },
];

export const WithToolCalls: Story = {
  args: {
    id: 'msg-5',
    content: 'I found the information you requested.',
    timestamp: now,
    senderName: 'Assistant',
    senderColor: '#6366f1',
    toolCalls: sampleToolCalls,
  },
  parameters: {
    docs: {
      description: {
        story: 'AI messages can display tool/function calls that were executed.',
      },
    },
  },
};

export const WithEditEnabled: Story = {
  args: {
    id: 'msg-6',
    content: 'This message has edit enabled. Hover to see the toolbar with copy and edit buttons.',
    timestamp: now,
    senderName: 'You',
    senderColor: '#10b981',
    isOwn: true,
    enableEdit: true,
    onEdit: (messageId) => console.log('Edit clicked:', messageId),
  },
  parameters: {
    docs: {
      description: {
        story: 'User messages can have an edit button in the toolbar when `enableEdit={true}`.',
      },
    },
  },
};

export const AssistantWithToolbar: Story = {
  args: {
    id: 'msg-7',
    content: 'This is an assistant message. Hover to see the toolbar with timestamp and copy button. The toolbar has different styling for assistant messages.',
    timestamp: now,
    senderName: 'Assistant',
    senderColor: '#6366f1',
    isOwn: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Assistant messages show a toolbar with different styling (neutral background instead of primary).',
      },
    },
  },
};

export const PlainText: Story = {
  args: {
    id: 'msg-8',
    content: 'This message is rendered as plain text, not markdown.\n\nLine breaks are preserved.',
    timestamp: now,
    senderName: 'User',
    senderColor: '#f59e0b',
    renderMarkdown: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Set `renderMarkdown={false}` to display content as plain text.',
      },
    },
  },
};

export const Conversation: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '600px' }}>
      <ChatMessage
        id="conv-1"
        content="Hi there! I have a question about the API."
        timestamp={tenMinAgo}
        senderName="You"
        senderColor="#10b981"
        isOwn
      />
      <ChatMessage
        id="conv-2"
        content="Of course! I'd be happy to help. What would you like to know?"
        timestamp={fiveMinAgo}
        senderName="Assistant"
        senderColor="#6366f1"
      />
      <ChatMessage
        id="conv-3"
        content="How do I authenticate API requests?"
        timestamp={fiveMinAgo}
        senderName="You"
        senderColor="#10b981"
        isOwn
        isConsecutive
      />
      <ChatMessage
        id="conv-4"
        content={`You'll need to include an API key in your request headers:

\`\`\`bash
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.example.com/v1/resource
\`\`\`

Make sure to keep your API key secure and never commit it to version control.`}
        timestamp={now}
        senderName="Assistant"
        senderColor="#6366f1"
      />
      <ChatMessage
        id="conv-5"
        content="Got it, thanks!"
        timestamp={now}
        senderName="You"
        senderColor="#10b981"
        isOwn
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A realistic conversation showing consecutive messages, own messages, and markdown content.',
      },
    },
  },
};

export const ConsecutiveMessages: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '600px' }}>
      <ChatMessage
        id="seq-1"
        content="First message from this sender."
        timestamp={tenMinAgo}
        senderName="Assistant"
        senderColor="#6366f1"
      />
      <ChatMessage
        id="seq-2"
        content="Second message - notice the avatar is hidden."
        timestamp={fiveMinAgo}
        senderName="Assistant"
        senderColor="#6366f1"
        isConsecutive
      />
      <ChatMessage
        id="seq-3"
        content="Third message - timestamp shows on hover."
        timestamp={now}
        senderName="Assistant"
        senderColor="#6366f1"
        isConsecutive
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Consecutive messages from the same sender hide the avatar. Timestamps appear on hover.',
      },
    },
  },
};

export const CustomAvatar: Story = {
  args: {
    id: 'msg-custom',
    content: 'This message uses a custom avatar element.',
    timestamp: now,
    senderName: 'Bot',
    avatar: (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
        }}
      >
        🤖
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Pass a custom React element via the `avatar` prop to override the default Avatar component.',
      },
    },
  },
};
