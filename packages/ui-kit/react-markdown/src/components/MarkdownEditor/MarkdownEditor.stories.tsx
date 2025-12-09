import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState, useRef } from 'react';
import { MarkdownEditor, type MarkdownEditorRef } from './MarkdownEditor';
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
Plain text markdown editor for editing raw markdown content.

## Features
- Plain text editing (no WYSIWYG)
- Line numbers
- Tab/Shift+Tab for indentation
- Selection tracking for co-authoring cursor support

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
  },
  argTypes: {
    showLineNumbers: {
      control: 'boolean',
      description: 'Show line numbers',
    },
    readOnly: {
      control: 'boolean',
      description: 'Make the editor read-only',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    height: {
      control: 'text',
      description: 'Editor height',
    },
    tabSize: {
      control: 'number',
      description: 'Number of spaces for tab',
    },
    onEditorReady: {
      table: { disable: true },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleContent = `# Welcome to the Editor

This is a **plain text** markdown editor.

## Features

- Line numbers
- Tab indentation
- Selection tracking
- Co-authoring ready

\`\`\`typescript
const greeting = 'Hello, World!';
console.log(greeting);
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
};

export const EmptyEditor: Story = {
  args: {
    showLineNumbers: true,
    height: '300px',
    placeholder: 'Start writing your document...',
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
};

export const ReadOnly: Story = {
  args: {
    defaultValue: sampleContent,
    showLineNumbers: true,
    readOnly: true,
    height: '400px',
  },
};

// Controlled mode story
const ControlledStory = () => {
  const [markdown, setMarkdown] = useState(`# Controlled Editor

Edit me and see the raw output below!`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <MarkdownEditor
        value={markdown}
        onChange={setMarkdown}
        showLineNumbers
        height="300px"
      />

      <div>
        <h4 style={{ margin: '0 0 8px 0' }}>Character Count: {markdown.length}</h4>
        <pre style={{
          padding: '16px',
          background: 'var(--color-panel-background)',
          border: '1px solid var(--color-panel-border)',
          borderRadius: '8px',
          overflow: 'auto',
          maxHeight: '200px',
          margin: 0,
          fontSize: '14px',
          fontFamily: 'monospace',
        }}>
          {markdown}
        </pre>
      </div>
    </div>
  );
};

export const ControlledMode: Story = {
  render: () => <ControlledStory />,
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
      gap: '16px',
      height: '500px',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Editor (Plain Text)</h4>
        <MarkdownEditor
          value={markdown}
          onChange={setMarkdown}
          showLineNumbers
          height="100%"
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Preview (Rendered)</h4>
        <div style={{
          flex: 1,
          padding: '16px',
          background: 'var(--color-panel-background)',
          border: '1px solid var(--color-panel-border)',
          borderRadius: '8px',
          overflow: 'auto',
        }}>
          <MarkdownRenderer
            content={markdown}
            showLineNumbers
          />
        </div>
      </div>
    </div>
  );
};

export const EditorWithPreview: Story = {
  render: () => <SideBySideStory />,
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
};

// Ref access demo
const RefAccessStory = () => {
  const editorRef = useRef<MarkdownEditorRef>(null);
  const [output, setOutput] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => editorRef.current?.focus()}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Focus Editor
        </button>
        <button
          onClick={() => {
            const md = editorRef.current?.getMarkdown();
            setOutput(md || '');
          }}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Get Markdown
        </button>
        <button
          onClick={() => {
            editorRef.current?.setMarkdown(`# Programmatic Update

Content set via ref!`);
          }}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Set Content
        </button>
        <button
          onClick={() => {
            const sel = editorRef.current?.getSelection();
            if (sel) setSelection(sel);
          }}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Get Selection
        </button>
        <button
          onClick={() => {
            editorRef.current?.insertText('\n\n**Inserted text!**\n\n');
          }}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Insert Text
        </button>
      </div>

      <div style={{ fontSize: '14px', color: 'var(--color-body-textSoft10)' }}>
        Selection: {selection.start} - {selection.end}
      </div>

      <MarkdownEditor
        ref={editorRef}
        defaultValue={`# Ref Access

Use the buttons above to interact with the editor programmatically.

Try selecting some text and clicking "Get Selection".`}
        showLineNumbers
        height="250px"
        onSelectionChange={(start, end) => setSelection({ start, end })}
      />

      {output && (
        <div>
          <h4 style={{ margin: '0 0 8px 0' }}>Output:</h4>
          <pre style={{
            padding: '16px',
            background: 'var(--color-panel-background)',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '8px',
            margin: 0,
            fontFamily: 'monospace',
          }}>
            {output}
          </pre>
        </div>
      )}
    </div>
  );
};

export const RefAccess: Story = {
  render: () => <RefAccessStory />,
};

// Co-authoring simulation
const CoAuthoringStory = () => {
  const editorRef = useRef<MarkdownEditorRef>(null);
  const [isApplying, setIsApplying] = useState(false);

  const applyAIEdit = async () => {
    if (!editorRef.current) return;

    setIsApplying(true);

    // Simulate AI thinking
    await new Promise(r => setTimeout(r, 500));

    // Apply edit at cursor position
    editorRef.current.insertText(`

## AI-Generated Section

This content was added by the AI assistant at your cursor position.

\`\`\`typescript
// AI-generated code
const aiResult = await processData(input);
console.log(aiResult);
\`\`\`

`);

    setIsApplying(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={applyAIEdit}
          disabled={isApplying}
          style={{
            padding: '8px 16px',
            cursor: isApplying ? 'not-allowed' : 'pointer',
            opacity: isApplying ? 0.7 : 1,
          }}
        >
          {isApplying ? 'AI is writing...' : 'Add AI Content at Cursor'}
        </button>
        <span style={{ fontSize: '14px', color: 'var(--color-body-textSoft10)' }}>
          Click to simulate AI co-authoring (inserts at cursor)
        </span>
      </div>

      <MarkdownEditor
        ref={editorRef}
        defaultValue={`# My Document

This is my draft document.

Place your cursor here and click the button to let the AI add content.

## Existing Section

Some existing content...`}
        showLineNumbers
        height="400px"
      />
    </div>
  );
};

export const CoAuthoringSimulation: Story = {
  render: () => <CoAuthoringStory />,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates programmatic content insertion for AI co-authoring at cursor position.',
      },
    },
  },
};
