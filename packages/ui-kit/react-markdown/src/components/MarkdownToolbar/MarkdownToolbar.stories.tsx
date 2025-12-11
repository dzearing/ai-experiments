import type { Meta, StoryObj } from '@storybook/react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { MarkdownToolbar } from './MarkdownToolbar';

const meta = {
  title: 'Markdown/MarkdownToolbar',
  component: MarkdownToolbar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Standalone toolbar for markdown editing with TipTap.

## When to Use

- **Rich text editing**: Adding formatting controls to a TipTap editor
- **Custom editor layouts**: Placing the toolbar independently from the editor
- **Feature-gated editors**: Enabling only specific formatting options

## Sizes

| Size | Use Case |
|------|----------|
| \`sm\` | Compact toolbars, inline editors |
| \`md\` | Default size for most use cases |
| \`lg\` | Touch-friendly interfaces |

## Variants

| Variant | Use Case |
|---------|----------|
| \`default\` | Transparent background |
| \`bordered\` | With border and subtle background |
| \`floating\` | Shadow and elevated appearance |

## Feature Toggles

Control which button groups appear:
- \`formatting\`: Bold, italic, strikethrough
- \`headings\`: H1, H2, H3 buttons
- \`lists\`: Bullet and numbered lists
- \`blocks\`: Code blocks, blockquotes
- \`links\`: Link insertion
- \`undo\`: Undo/redo buttons

## Usage

\`\`\`tsx
import { MarkdownToolbar } from '@ui-kit/react-markdown';
import { useEditor } from '@tiptap/react';

const editor = useEditor({ ... });

<MarkdownToolbar
  editor={editor}
  features={{ formatting: true, headings: true }}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant for toolbar buttons',
    },
    variant: {
      control: 'select',
      options: ['default', 'bordered', 'floating'],
      description: 'Visual style variant',
    },
  },
} satisfies Meta<typeof MarkdownToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper with actual editor
const ToolbarDemo = (props: any) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Select text and use the toolbar to format it. Try <strong>bold</strong>, <em>italic</em>, and more!</p><p>Create headings, lists, and code blocks.</p>',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <MarkdownToolbar editor={editor} {...props} />
      <div style={{
        padding: '16px',
        background: 'var(--inset-bg)',
        border: '1px solid var(--inset-border)',
        borderRadius: '8px',
        minHeight: '150px',
      }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export const Default: Story = {
  render: (args) => <ToolbarDemo {...args} />,
  args: {},
};

export const SmallSize: Story = {
  render: (args) => <ToolbarDemo {...args} />,
  args: {
    size: 'sm',
  },
};

export const LargeSize: Story = {
  render: (args) => <ToolbarDemo {...args} />,
  args: {
    size: 'lg',
  },
};

export const BorderedVariant: Story = {
  render: (args) => <ToolbarDemo {...args} />,
  args: {
    variant: 'bordered',
  },
};

export const FormattingOnly: Story = {
  render: (args) => <ToolbarDemo {...args} />,
  args: {
    features: {
      formatting: true,
      headings: false,
      lists: false,
      blocks: false,
      links: false,
      undo: true,
    },
  },
};

export const HeadingsAndLists: Story = {
  render: (args) => <ToolbarDemo {...args} />,
  args: {
    features: {
      formatting: false,
      headings: true,
      lists: true,
      blocks: false,
      links: false,
      undo: false,
    },
  },
};

export const BlocksOnly: Story = {
  render: (args) => <ToolbarDemo {...args} />,
  args: {
    features: {
      formatting: false,
      headings: false,
      lists: false,
      blocks: true,
      links: true,
      undo: false,
    },
  },
};

export const WithCustomButtons: Story = {
  render: (args) => <ToolbarDemo {...args} />,
  args: {
    customButtons: [
      {
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1l2 6h5l-4 3 2 6-5-4-5 4 2-6-4-3h5l2-6z"/>
          </svg>
        ),
        onClick: () => alert('Custom button clicked!'),
        tooltip: 'Custom Action',
      },
      {
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2"/>
          </svg>
        ),
        onClick: () => alert('Another action!'),
        tooltip: 'Another Action',
      },
    ],
  },
};

export const NoEditor: Story = {
  args: {
    editor: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'When no editor is provided, the toolbar renders nothing.',
      },
    },
  },
};
