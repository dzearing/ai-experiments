import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import { MarkdownCoEditor, type ViewMode } from './MarkdownCoEditor';

const meta: Meta<typeof MarkdownCoEditor> = {
  title: 'Markdown/MarkdownCoEditor',
  component: MarkdownCoEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', padding: '16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    onChange: fn(),
    onModeChange: fn(),
    onSelectionChange: fn(),
    onEditorReady: undefined, // Explicitly undefined to avoid implicit action detection
  },
  argTypes: {
    defaultMode: {
      control: 'select',
      options: ['edit', 'preview', 'split'],
    },
    splitOrientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    showModeSwitch: {
      control: 'boolean',
    },
    showLineNumbers: {
      control: 'boolean',
    },
    readOnly: {
      control: 'boolean',
    },
    streaming: {
      control: 'boolean',
    },
    onEditorReady: {
      table: { disable: true }, // Hide from controls
    },
  },
};

export default meta;
type Story = StoryObj<typeof MarkdownCoEditor>;

const sampleMarkdown = `# Welcome to MarkdownCoEditor

This is a **plain text markdown editor** with preview.

## Features

- **Edit mode**: Write raw markdown text
- **Preview mode**: See the rendered output
- **Split mode**: Side-by-side editing and preview

### Code Example

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

### Lists

1. First item
2. Second item
3. Third item

- Unordered item
- Another item

> This is a blockquote. It can contain **formatted text** and even \`inline code\`.

---

Learn more at [example.com](https://example.com).
`;

export const Default: Story = {
  args: {
    defaultValue: sampleMarkdown,
    defaultMode: 'edit',
  },
};

export const PreviewMode: Story = {
  args: {
    defaultValue: sampleMarkdown,
    defaultMode: 'preview',
  },
};

export const SplitMode: Story = {
  args: {
    defaultValue: sampleMarkdown,
    defaultMode: 'split',
  },
};

export const SplitVertical: Story = {
  args: {
    defaultValue: sampleMarkdown,
    defaultMode: 'split',
    splitOrientation: 'vertical',
  },
};

export const WithoutModeSwitch: Story = {
  args: {
    defaultValue: sampleMarkdown,
    defaultMode: 'split',
    showModeSwitch: false,
  },
};

export const WithoutLineNumbers: Story = {
  args: {
    defaultValue: sampleMarkdown,
    defaultMode: 'edit',
    showLineNumbers: false,
  },
};

export const ReadOnly: Story = {
  args: {
    defaultValue: sampleMarkdown,
    defaultMode: 'preview',
    readOnly: true,
  },
};

export const Empty: Story = {
  args: {
    defaultValue: '',
    placeholder: 'Start writing your markdown here...',
  },
};

export const Controlled: Story = {
  render: () => {
    const [markdown, setMarkdown] = useState(sampleMarkdown);
    const [mode, setMode] = useState<ViewMode>('split');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '8px' }}>
          <span>Current mode: <strong>{mode}</strong></span>
          <span>Character count: <strong>{markdown.length}</strong></span>
        </div>
        <MarkdownCoEditor
          value={markdown}
          onChange={setMarkdown}
          mode={mode}
          onModeChange={setMode}
        />
      </div>
    );
  },
};
