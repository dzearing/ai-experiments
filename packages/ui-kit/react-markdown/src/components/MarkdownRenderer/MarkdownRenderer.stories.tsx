import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

const meta = {
  title: 'Components/MarkdownRenderer',
  component: MarkdownRenderer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Renders markdown content with syntax highlighting, streaming support, and deep-linking.

## Features
- GitHub Flavored Markdown (GFM) support
- Syntax highlighting with Prism.js
- Line numbers in code blocks
- Collapsible code blocks
- Streaming mode for AI responses
- Deep-linking to headings and line numbers

## Usage
\`\`\`tsx
import { MarkdownRenderer } from '@ui-kit/react-markdown';

<MarkdownRenderer
  content="# Hello World"
  showLineNumbers
  enableDeepLinks
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    streaming: {
      control: 'boolean',
      description: 'Enable streaming mode',
    },
    showLineNumbers: {
      control: 'boolean',
      description: 'Show line numbers in code blocks',
    },
    collapsibleCodeBlocks: {
      control: 'boolean',
      description: 'Enable code block collapsing',
    },
    enableDeepLinks: {
      control: 'boolean',
      description: 'Enable deep-linking',
    },
  },
} satisfies Meta<typeof MarkdownRenderer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample markdown content
const sampleMarkdown = `
# Welcome to MarkdownRenderer

This is a **comprehensive** markdown renderer with support for all standard markdown features.

## Features

### Text Formatting

You can use **bold**, *italic*, ~~strikethrough~~, and \`inline code\`.

### Lists

Unordered list:
- Item one
- Item two
  - Nested item
  - Another nested item
- Item three

Ordered list:
1. First item
2. Second item
3. Third item

### Links and Images

Here's a [link to Google](https://google.com) and an image:

### Code Blocks

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}

const user: User = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com'
};

console.log(greet(user));
\`\`\`

### Tables

| Feature | Status | Notes |
|---------|--------|-------|
| Bold | ✅ | Working |
| Italic | ✅ | Working |
| Code | ✅ | With syntax highlighting |
| Tables | ✅ | GFM tables |

### Blockquotes

> This is a blockquote.
> It can span multiple lines.

### Horizontal Rule

---

That's all folks!
`;

export const Default: Story = {
  args: {
    content: sampleMarkdown,
    showLineNumbers: true,
    enableDeepLinks: true,
  },
};

export const AllMarkdownElements: Story = {
  args: {
    content: sampleMarkdown,
    showLineNumbers: true,
    collapsibleCodeBlocks: false,
    enableDeepLinks: true,
  },
};

export const CodeBlockWithLineNumbers: Story = {
  args: {
    content: `
## Code Example

\`\`\`typescript
import { useState, useEffect } from 'react';

interface Props {
  title: string;
  count: number;
}

export function Counter({ title, count }: Props) {
  const [value, setValue] = useState(count);

  useEffect(() => {
    console.log('Count changed:', value);
  }, [value]);

  return (
    <div>
      <h2>{title}</h2>
      <p>Count: {value}</p>
      <button onClick={() => setValue(v => v + 1)}>
        Increment
      </button>
    </div>
  );
}
\`\`\`

Try clicking on line numbers to create deep links!
    `,
    showLineNumbers: true,
  },
};

export const CollapsibleCodeBlocks: Story = {
  args: {
    content: `
## Collapsible Code

This code block can be collapsed:

\`\`\`javascript
// This is a long code block
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Calculate first 20 fibonacci numbers
const numbers = [];
for (let i = 0; i < 20; i++) {
  numbers.push(fibonacci(i));
}

console.log('Fibonacci sequence:');
console.log(numbers.join(', '));

// More code to make it long
const squares = numbers.map(n => n * n);
const cubes = numbers.map(n => n * n * n);

console.log('Squares:', squares);
console.log('Cubes:', cubes);
\`\`\`
    `,
    showLineNumbers: true,
    collapsibleCodeBlocks: true,
  },
};

export const MultipleLanguages: Story = {
  args: {
    content: `
## Multiple Languages

### TypeScript
\`\`\`typescript
const greeting: string = 'Hello, World!';
console.log(greeting);
\`\`\`

### Python
\`\`\`python
def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("World"))
\`\`\`

### CSS
\`\`\`css
.button {
  background: var(--primary-bg);
  color: var(--primary-text);
  padding: 8px 16px;
  border-radius: 4px;
}
\`\`\`

### JSON
\`\`\`json
{
  "name": "ui-kit",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.0.0"
  }
}
\`\`\`

### Bash
\`\`\`bash
#!/bin/bash
echo "Installing dependencies..."
pnpm install
pnpm build
echo "Done!"
\`\`\`
    `,
    showLineNumbers: true,
  },
};

// Streaming story with simulation
const StreamingStory = () => {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const fullContent = `
# Streaming Response

This content is being **streamed** character by character, simulating an AI response.

## Features

- Real-time rendering
- Smooth animation
- Cursor indicator

\`\`\`typescript
// Code blocks stream too!
const message = 'Hello from AI';
console.log(message);
\`\`\`

Pretty cool, right?
  `.trim();

  const startStreaming = () => {
    setContent('');
    setIsStreaming(true);
  };

  useEffect(() => {
    if (isStreaming) {
      // Reset content when starting
      setContent('');
    }
  }, [isStreaming]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <button
        onClick={startStreaming}
        style={{
          padding: '8px 16px',
          cursor: 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        {isStreaming ? 'Streaming...' : 'Start Streaming'}
      </button>

      <MarkdownRenderer
        content={isStreaming ? fullContent : content || 'Click "Start Streaming" to begin'}
        streaming={isStreaming}
        streamingSpeed={5}
        onStreamComplete={() => {
          setIsStreaming(false);
          setContent(fullContent);
        }}
        showLineNumbers
      />
    </div>
  );
};

export const StreamingAIResponse: Story = {
  render: () => <StreamingStory />,
};

export const DeepLinkDemo: Story = {
  args: {
    content: `
# Deep Linking Demo

Click on any heading anchor or code line number to create a shareable link.

## Getting Started

Introduction paragraph here.

## Installation

\`\`\`bash
npm install @ui-kit/react-markdown
\`\`\`

## Usage

\`\`\`typescript
import { MarkdownRenderer } from '@ui-kit/react-markdown';

function App() {
  return (
    <MarkdownRenderer
      content="# Hello"
      enableDeepLinks
    />
  );
}
\`\`\`

## API Reference

Check the docs for more info.

## Contributing

We welcome contributions!
    `,
    showLineNumbers: true,
    enableDeepLinks: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Try clicking heading anchors (# symbol) or line numbers to create deep links.',
      },
    },
  },
};

export const Tables: Story = {
  args: {
    content: `
# Data Tables

## User Data

| ID | Name | Email | Role |
|----|------|-------|------|
| 1 | John Doe | john@example.com | Admin |
| 2 | Jane Smith | jane@example.com | User |
| 3 | Bob Wilson | bob@example.com | User |
| 4 | Alice Brown | alice@example.com | Moderator |

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| Free | $0/mo | 5 projects, 1GB storage |
| Pro | $19/mo | Unlimited projects, 100GB storage |
| Enterprise | Custom | Everything + support |

Tables support alignment too!

| Left | Center | Right |
|:-----|:------:|------:|
| L | C | R |
| Left | Center | Right |
    `,
  },
};

export const MinimalContent: Story = {
  args: {
    content: 'Just a simple paragraph with **bold** and *italic* text.',
    showLineNumbers: false,
  },
};

export const EmptyContent: Story = {
  args: {
    content: '',
  },
};
