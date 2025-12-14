import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState, useRef, useEffect } from 'react';
import { Button, Stack, Text } from '@ui-kit/react';
import { MarkdownEditor, type MarkdownEditorRef, type CoAuthor } from './MarkdownEditor';
import { MarkdownRenderer } from '../MarkdownRenderer';

const meta: Meta<typeof MarkdownEditor> = {
  title: 'Markdown/MarkdownEditor',
  component: MarkdownEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
CodeMirror 6-based markdown editor with full editing capabilities.

## When to Use

- **Plain text editing**: When you need raw markdown editing without preview
- **Code-heavy documents**: Documents with many code blocks benefit from syntax highlighting
- **AI co-authoring**: Showing remote cursors during collaborative or AI-assisted writing
- **Large documents**: Performance-optimized for documents with thousands of lines

## Features

- **Syntax highlighting**: Full markdown support plus nested code blocks (JS, Python, etc.)
- **Search/replace**: Ctrl+F to find, Ctrl+H to replace, Ctrl+G to go to line
- **Code folding**: Fold code blocks and sections with gutter icons or Ctrl+Shift+[
- **Co-authoring**: Remote cursor visibility with labels and selection highlights
- **Theming**: Integrates with design tokens for light/dark mode

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+F | Open search panel |
| Ctrl+H | Open search/replace panel |
| Ctrl+G | Go to line |
| Ctrl+Z/Y | Undo/redo |
| Tab/Shift+Tab | Indent/outdent |
| Ctrl+Shift+[ | Fold at cursor |
| Ctrl+Shift+] | Unfold at cursor |

## Usage

\`\`\`tsx
import { MarkdownEditor } from '@ui-kit/react-markdown';

<MarkdownEditor
  defaultValue="# Hello"
  onChange={(markdown) => console.log(markdown)}
  showLineNumbers
/>
\`\`\`
        `,
      },
    },
  },
  args: {
    onChange: fn(),
    onFocus: fn(),
    onBlur: fn(),
    onSelectionChange: fn(),
    onEditorReady: fn(),
    onCoAuthorsChange: fn(),
  },
  argTypes: {
    showLineNumbers: {
      control: 'boolean',
      description: 'Show line numbers in gutter',
    },
    readOnly: {
      control: 'boolean',
      description: 'Make the editor read-only',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when editor is empty',
    },
    height: {
      control: 'text',
      description: 'Editor height (CSS value)',
    },
    tabSize: {
      control: 'number',
      description: 'Number of spaces for tab indentation',
    },
    onChange: {
      table: { disable: true },
    },
    onFocus: {
      table: { disable: true },
    },
    onBlur: {
      table: { disable: true },
    },
    onSelectionChange: {
      table: { disable: true },
    },
    onEditorReady: {
      table: { disable: true },
    },
    onCoAuthorsChange: {
      table: { disable: true },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleContent = `# Welcome to the Editor

This is a **CodeMirror 6** based markdown editor.

## Features

- Full markdown syntax highlighting
- Nested code block highlighting
- Search/replace (Ctrl+F, Ctrl+H)
- Code folding (click gutter or Ctrl+Shift+[)
- Co-authoring cursor support

\`\`\`typescript
const greeting = 'Hello, World!';
console.log(greeting);

function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
\`\`\`

\`\`\`python
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
\`\`\`

Try editing this content!
`;

export const Default: Story = {
  args: {
    defaultValue: sampleContent,
    showLineNumbers: true,
    height: '400px',
    placeholder: 'Enter markdown...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default editor with line numbers, syntax highlighting, and sample content.',
      },
    },
  },
};

export const EmptyEditor: Story = {
  args: {
    showLineNumbers: true,
    height: '300px',
    placeholder: 'Start writing your document...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty editor with placeholder text.',
      },
    },
  },
};

export const WithoutLineNumbers: Story = {
  args: {
    defaultValue: `# No Line Numbers

This editor has line numbers disabled.

- Edit freely
- Tab for indentation
- Shift+Tab to outdent`,
    showLineNumbers: false,
    height: '300px',
  },
  parameters: {
    docs: {
      description: {
        story: 'Editor without line numbers for a cleaner appearance.',
      },
    },
  },
};

export const ReadOnly: Story = {
  args: {
    defaultValue: sampleContent,
    showLineNumbers: true,
    readOnly: true,
    height: '400px',
  },
  parameters: {
    docs: {
      description: {
        story: 'Read-only mode prevents editing while maintaining syntax highlighting.',
      },
    },
  },
};

// Controlled mode story
const ControlledStory = () => {
  const [markdown, setMarkdown] = useState(`# Controlled Editor

Edit me and see the raw output below!`);

  return (
    <Stack direction="vertical" gap="md">
      <MarkdownEditor
        value={markdown}
        onChange={setMarkdown}
        showLineNumbers
        height="300px"
      />

      <Stack direction="vertical" gap="sm">
        <Text weight="semibold">Character Count: {markdown.length}</Text>
        <pre style={{
          padding: 'var(--space-4, 16px)',
          background: 'var(--card-bg, #f6f8fa)',
          border: '1px solid var(--card-border, #e1e4e8)',
          borderRadius: 'var(--radius-md, 8px)',
          overflow: 'auto',
          maxHeight: '200px',
          margin: 0,
          fontSize: 'var(--text-sm, 14px)',
          fontFamily: 'var(--font-mono, monospace)',
          color: 'var(--page-text, #24292e)',
        }}>
          {markdown}
        </pre>
      </Stack>
    </Stack>
  );
};

export const ControlledMode: Story = {
  render: () => <ControlledStory />,
  parameters: {
    docs: {
      description: {
        story: 'Use `value` and `onChange` props for controlled state management. The raw markdown output is shown below.',
      },
    },
  },
};

// Side-by-side editor and preview
const SideBySideStory = () => {
  const [markdown, setMarkdown] = useState(`# Live Preview

Edit on the left, see the preview on the right!

## Features

- **Real-time** preview
- Syntax highlighting
- All markdown elements

\`\`\`typescript
const x = 42;
\`\`\`
`);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-4, 16px)',
      height: '500px',
    }}>
      <Stack direction="vertical" gap="sm" style={{ minHeight: 0 }}>
        <Text weight="semibold">Editor (Plain Text)</Text>
        <MarkdownEditor
          value={markdown}
          onChange={setMarkdown}
          showLineNumbers
          height="100%"
        />
      </Stack>

      <Stack direction="vertical" gap="sm" style={{ minHeight: 0 }}>
        <Text weight="semibold">Preview (Rendered)</Text>
        <div style={{
          flex: 1,
          padding: 'var(--space-4, 16px)',
          background: 'var(--card-bg, #f6f8fa)',
          border: '1px solid var(--card-border, #e1e4e8)',
          borderRadius: 'var(--radius-md, 8px)',
          overflow: 'auto',
        }}>
          <MarkdownRenderer
            content={markdown}
            showLineNumbers
          />
        </div>
      </Stack>
    </div>
  );
};

export const EditorWithPreview: Story = {
  render: () => <SideBySideStory />,
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side editor and live preview. Changes in the editor update the rendered preview in real-time.',
      },
    },
  },
};

// Tab size variants
export const TabSize4: Story = {
  args: {
    defaultValue: `# Tab Size 4

Press Tab to indent with 4 spaces.

    This line is indented.`,
    showLineNumbers: true,
    tabSize: 4,
    height: '200px',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tab indentation with 4 spaces instead of the default 2.',
      },
    },
  },
};

// Ref access demo
const RefAccessStory = () => {
  const editorRef = useRef<MarkdownEditorRef>(null);
  const [output, setOutput] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  return (
    <Stack direction="vertical" gap="md">
      <Stack direction="horizontal" gap="sm" wrap>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => editorRef.current?.focus()}
        >
          Focus Editor
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const md = editorRef.current?.getMarkdown();
            setOutput(md || '');
          }}
        >
          Get Markdown
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            editorRef.current?.setMarkdown(`# Programmatic Update

Content set via ref!`);
          }}
        >
          Set Content
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const sel = editorRef.current?.getSelection();
            if (sel) setSelection(sel);
          }}
        >
          Get Selection
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            editorRef.current?.insertText('\n\n**Inserted text!**\n\n');
          }}
        >
          Insert Text
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => editorRef.current?.goToLine(5)}
        >
          Go to Line 5
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => editorRef.current?.foldAll()}
        >
          Fold All
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => editorRef.current?.unfoldAll()}
        >
          Unfold All
        </Button>
      </Stack>

      <Text size="sm" color="soft">
        Selection: {selection.start} - {selection.end}
      </Text>

      <MarkdownEditor
        ref={editorRef}
        defaultValue={`# Ref Access

Use the buttons above to interact with the editor programmatically.

Try selecting some text and clicking "Get Selection".

\`\`\`javascript
// This code block can be folded
const message = "Hello!";
console.log(message);
\`\`\`

## Another Section

More content here.`}
        showLineNumbers
        height="300px"
        onSelectionChange={(start, end) => setSelection({ start, end })}
      />

      {output && (
        <Stack direction="vertical" gap="sm">
          <Text weight="semibold">Output:</Text>
          <pre style={{
            padding: 'var(--space-4, 16px)',
            background: 'var(--card-bg, #f6f8fa)',
            border: '1px solid var(--card-border, #e1e4e8)',
            borderRadius: 'var(--radius-md, 8px)',
            margin: 0,
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--page-text, #24292e)',
          }}>
            {output}
          </pre>
        </Stack>
      )}
    </Stack>
  );
};

export const RefAccess: Story = {
  render: () => <RefAccessStory />,
  parameters: {
    docs: {
      description: {
        story: 'Access editor methods via ref: `focus()`, `getMarkdown()`, `setMarkdown()`, `insertText()`, `goToLine()`, `foldAll()`, `unfoldAll()`.',
      },
    },
  },
};

// Rapid AI streaming test (TC-7)
const RapidStreamingStory = () => {
  const editorRef = useRef<MarkdownEditorRef>(null);
  const initialMarkdown = '# Rapid Streaming Test\n\nStart: ';
  const [isStreaming, setIsStreaming] = useState(false);
  const [coAuthors, setCoAuthors] = useState<CoAuthor[]>([
    {
      id: 'ai',
      name: 'AI',
      color: '#f59e0b',
      isAI: true,
      selectionStart: 36,
      selectionEnd: 36,
    },
  ]);

  // Handle coAuthor position updates from the editor
  const handleCoAuthorsChange = (updatedCoAuthors: CoAuthor[]) => {
    setCoAuthors(updatedCoAuthors);
  };

  const startStreaming = async () => {
    if (isStreaming || !editorRef.current) return;
    setIsStreaming(true);

    const chars = 'The quick brown fox jumps over the lazy dog. Lorem ipsum dolor sit amet, consectetur adipiscing elit. ';
    let pos = editorRef.current.getMarkdown().length;

    for (const char of chars) {
      await new Promise(r => setTimeout(r, 20)); // 20ms per char
      if (!editorRef.current) break;

      // Use imperative API for proper position mapping
      editorRef.current.insertAt(pos, char);
      pos++;
      setCoAuthors([{
        id: 'ai',
        name: 'AI',
        color: '#f59e0b',
        isAI: true,
        selectionStart: pos,
        selectionEnd: pos,
      }]);
    }

    setIsStreaming(false);
  };

  return (
    <Stack direction="vertical" gap="md">
      <Stack direction="horizontal" gap="md" align="center">
        <Button
          variant="primary"
          size="sm"
          onClick={startStreaming}
          disabled={isStreaming}
        >
          {isStreaming ? 'Streaming...' : 'Start Rapid Streaming (20ms/char)'}
        </Button>
        <Text size="sm" color="soft">
          TC-7: Tests rapid AI streaming at 100 chars / 20ms intervals
        </Text>
      </Stack>

      <MarkdownEditor
        ref={editorRef}
        defaultValue={initialMarkdown}
        coAuthors={coAuthors}
        onCoAuthorsChange={handleCoAuthorsChange}
        showLineNumbers
        height="200px"
      />
    </Stack>
  );
};

export const RapidStreaming: Story = {
  render: () => <RapidStreamingStory />,
  parameters: {
    docs: {
      description: {
        story: 'TC-7: Tests rapid AI streaming at 100 characters with 20ms intervals. Your typing should remain responsive.',
      },
    },
  },
};

// Large document performance test
const LargeDocumentStory = () => {
  const [lineCount] = useState(1000);

  // Generate large document
  const largeContent = Array.from({ length: lineCount }, (_, i) => {
    if (i % 50 === 0) {
      return `\n## Section ${Math.floor(i / 50) + 1}\n`;
    }
    if (i % 10 === 0) {
      return `\`\`\`javascript\nconst line${i} = "content";\nconsole.log(line${i});\n\`\`\`\n`;
    }
    return `Line ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n`;
  }).join('');

  return (
    <Stack direction="vertical" gap="md">
      <Text size="sm" color="soft">
        TC-10: Large document with {lineCount} lines. Type to test keystroke latency.
      </Text>
      <MarkdownEditor
        defaultValue={largeContent}
        showLineNumbers
        height="500px"
      />
    </Stack>
  );
};

export const LargeDocument: Story = {
  render: () => <LargeDocumentStory />,
  parameters: {
    docs: {
      description: {
        story: 'TC-10: Performance test with 1000 lines. Keystroke latency should remain under 16ms.',
      },
    },
  },
};

// Search demo
export const SearchDemo: Story = {
  args: {
    defaultValue: `# Search Demo

Press **Ctrl+F** to open the search panel.

This document contains multiple occurrences of the word "foo":
- foo is here
- and foo is here
- also foo appears here

Try searching for "foo" to see all matches highlighted!

Press **Ctrl+G** to go to a specific line number.
Press **Ctrl+H** to open search & replace.

\`\`\`javascript
const foo = "bar";
const foobar = foo + "baz";
\`\`\`
`,
    showLineNumbers: true,
    height: '400px',
  },
  parameters: {
    docs: {
      description: {
        story: 'TC-14, TC-15, TC-16: Demonstrates search (Ctrl+F), regex search, and go-to-line (Ctrl+G).',
      },
    },
  },
};

// Folding demo
export const FoldingDemo: Story = {
  args: {
    defaultValue: `# Folding Demo

Click the arrows in the gutter to fold/unfold code blocks and sections.

## Section 1 (click to fold)

This content is inside Section 1.
You can fold the entire section by clicking the fold icon.

\`\`\`javascript
// This code block can be folded independently
function longFunction() {
  const a = 1;
  const b = 2;
  const c = 3;
  const d = 4;
  const e = 5;
  return a + b + c + d + e;
}
\`\`\`

## Section 2

Another section with more content.

\`\`\`python
# Python code can also be folded
def calculate():
    result = 0
    for i in range(100):
        result += i
    return result
\`\`\`

## Keyboard Shortcuts

- **Ctrl+Shift+[** : Fold at cursor
- **Ctrl+Shift+]** : Unfold at cursor
`,
    showLineNumbers: true,
    height: '500px',
  },
  parameters: {
    docs: {
      description: {
        story: 'TC-17, TC-18, TC-19: Demonstrates code block and heading folding.',
      },
    },
  },
};

// Syntax highlighting demo
export const SyntaxHighlighting: Story = {
  args: {
    defaultValue: `# Syntax Highlighting Demo

This shows **bold**, *italic*, and ~~strikethrough~~ text.

Here's a [link](https://example.com) and some \`inline code\`.

## Code Blocks with Language-Specific Highlighting

\`\`\`javascript
// JavaScript highlighting
const greeting = 'Hello';
const numbers = [1, 2, 3];
const sum = numbers.reduce((a, b) => a + b, 0);

async function fetchData(url) {
  const response = await fetch(url);
  return response.json();
}
\`\`\`

\`\`\`python
# Python highlighting
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

result = [fibonacci(i) for i in range(10)]
print(f"Result: {result}")
\`\`\`

\`\`\`css
/* CSS highlighting */
.container {
  display: flex;
  align-items: center;
  background: var(--color-primary);
}
\`\`\`

\`\`\`json
{
  "name": "example",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0"
  }
}
\`\`\`

> Blockquotes are styled differently too.

- List item 1
- List item 2
  - Nested item
`,
    showLineNumbers: true,
    height: '600px',
  },
  parameters: {
    docs: {
      description: {
        story: 'TC-13, TC-22: Demonstrates markdown syntax highlighting and nested code block highlighting for multiple languages.',
      },
    },
  },
};
