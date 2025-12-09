import type { Meta, StoryObj } from '@storybook/react';
import { useState, useRef } from 'react';
import { MarkdownEditor, type MarkdownEditorRef } from './MarkdownEditor';
import { MarkdownRenderer } from '../MarkdownRenderer';

const meta = {
  title: 'Components/MarkdownEditor',
  component: MarkdownEditor,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
TipTap-based WYSIWYG markdown editor with bi-directional editing.

## Features
- Rich text editing with markdown output
- Configurable toolbar
- Deep-linking support
- AI co-authoring ready

## Usage
\`\`\`tsx
import { MarkdownEditor } from '@ui-kit/react-markdown';

<MarkdownEditor
  value="# Hello"
  onChange={(markdown) => console.log(markdown)}
  showToolbar
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    showToolbar: {
      control: 'boolean',
      description: 'Show the formatting toolbar',
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
  },
} satisfies Meta<typeof MarkdownEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleContent = `# Welcome to the Editor

This is a **rich text** editor with *markdown* support.

## Features

- Bold, italic, strikethrough
- Headings (H1-H6)
- Lists (bullet and numbered)
- Code blocks
- Links
- And more!

\`\`\`typescript
const greeting = 'Hello, World!';
console.log(greeting);
\`\`\`

Try editing this content!
`;

export const Default: Story = {
  args: {
    value: sampleContent,
    showToolbar: true,
    height: '400px',
    placeholder: 'Start typing...',
  },
};

export const EmptyEditor: Story = {
  args: {
    showToolbar: true,
    height: '300px',
    placeholder: 'Start writing your document...',
  },
};

export const WithoutToolbar: Story = {
  args: {
    value: `# No Toolbar

This editor has no toolbar. Use keyboard shortcuts instead!

- **Bold**: Ctrl+B
- *Italic*: Ctrl+I
- \`Code\`: Ctrl+E`,
    showToolbar: false,
    height: '300px',
  },
};

export const ReadOnly: Story = {
  args: {
    value: sampleContent,
    showToolbar: false,
    readOnly: true,
    height: '400px',
  },
};

// Controlled mode story
const ControlledStory = () => {
  const [markdown, setMarkdown] = useState(`# Controlled Editor

Edit me!`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <MarkdownEditor
        markdown={markdown}
        onChange={setMarkdown}
        showToolbar
        height="300px"
      />

      <div>
        <h4 style={{ margin: '0 0 8px 0' }}>Raw Markdown:</h4>
        <pre style={{
          padding: '16px',
          background: 'var(--inset-bg)',
          border: '1px solid var(--inset-border)',
          borderRadius: '8px',
          overflow: 'auto',
          maxHeight: '200px',
          margin: 0,
          fontSize: '14px',
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
        <h4 style={{ margin: '0 0 8px 0' }}>Editor</h4>
        <MarkdownEditor
          markdown={markdown}
          onChange={setMarkdown}
          showToolbar
          height="100%"
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Preview</h4>
        <div style={{
          flex: 1,
          padding: '16px',
          background: 'var(--panel-bg)',
          border: '1px solid var(--panel-border)',
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
  parameters: {
    layout: 'padded',
  },
};

// Toolbar variants
export const ToolbarSmall: Story = {
  args: {
    value: `# Small Toolbar

Compact toolbar variant.`,
    showToolbar: true,
    toolbarProps: {
      size: 'sm',
    },
    height: '200px',
  },
};

export const ToolbarLarge: Story = {
  args: {
    value: `# Large Toolbar

Larger toolbar for touch interfaces.`,
    showToolbar: true,
    toolbarProps: {
      size: 'lg',
    },
    height: '200px',
  },
};

export const MinimalToolbar: Story = {
  args: {
    value: `# Minimal Features

Only basic formatting.`,
    showToolbar: true,
    toolbarProps: {
      features: {
        formatting: true,
        headings: false,
        lists: false,
        blocks: false,
        links: false,
        undo: true,
      },
    },
    height: '200px',
  },
};

// Ref access demo
const RefAccessStory = () => {
  const editorRef = useRef<MarkdownEditorRef>(null);
  const [output, setOutput] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
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
      </div>

      <MarkdownEditor
        ref={editorRef}
        value={`# Ref Access

Use the buttons above to interact with the editor programmatically.`}
        showToolbar
        height="250px"
      />

      {output && (
        <div>
          <h4 style={{ margin: '0 0 8px 0' }}>Output:</h4>
          <pre style={{
            padding: '16px',
            background: 'var(--inset-bg)',
            border: '1px solid var(--inset-border)',
            borderRadius: '8px',
            margin: 0,
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

// AI co-authoring simulation
const CoAuthoringStory = () => {
  const editorRef = useRef<MarkdownEditorRef>(null);
  const [isApplying, setIsApplying] = useState(false);

  const applyAIEdit = async () => {
    if (!editorRef.current) return;

    setIsApplying(true);

    // Simulate AI thinking
    await new Promise(r => setTimeout(r, 500));

    // Apply edit
    const currentContent = editorRef.current.getMarkdown();
    const newContent = currentContent + '\n\n## AI-Generated Section\n\nThis content was added by the AI assistant. It demonstrates the co-authoring capability.\n\n```typescript\n// AI-generated code\nconst aiResult = await processData(input);\nconsole.log(aiResult);\n```';

    editorRef.current.setMarkdown(newContent);

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
          {isApplying ? 'AI is writing...' : '✨ Add AI Content'}
        </button>
        <span style={{ fontSize: '14px', color: 'var(--page-text-soft)' }}>
          Click to simulate AI co-authoring
        </span>
      </div>

      <MarkdownEditor
        ref={editorRef}
        value={`# My Document

This is my draft document. Click the button above to let the AI add content.`}
        showToolbar
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
        story: 'Demonstrates programmatic content insertion for AI co-authoring.',
      },
    },
  },
};
