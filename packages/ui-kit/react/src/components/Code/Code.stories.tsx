import type { Meta, StoryObj } from '@storybook/react';
import { Code } from './Code';

const meta = {
  title: 'Typography/Code',
  component: Code,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Code display component for inline code snippets and code blocks.

## When to Use

- Inline code references in text
- Code examples and snippets
- Configuration values
- File paths and commands

## Display Modes

| Mode | Use Case |
|------|----------|
| **Inline** (default) | Code within text, short references |
| **Block** | Multi-line code, examples |

## Features

- **block**: Render as code block with scrolling
- **language**: Syntax highlighting language hint
- Automatic horizontal scrolling for long lines
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Code>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {
  args: {
    children: 'npm install @ui-kit/react',
  },
};

export const InlineInText: Story = {
  render: () => (
    <p style={{ color: 'var(--body-text)' }}>
      Use the <Code>Button</Code> component for interactive actions. You can import it using <Code>import {'{ Button }'} from '@ui-kit/react'</Code>.
    </p>
  ),
};

export const Block: Story = {
  args: {
    block: true,
    language: 'javascript',
    children: `function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');`,
  },
};

export const MultipleBlocks: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Code block language="bash">
        npm install @ui-kit/react
      </Code>
      <Code block language="jsx">
{`import { Button } from '@ui-kit/react';

function App() {
  return (
    <Button variant="primary">
      Click me
    </Button>
  );
}`}
      </Code>
    </div>
  ),
};

export const LongLine: Story = {
  args: {
    block: true,
    children: 'const longLine = "This is a very long line of code that might overflow the container and require horizontal scrolling to see the entire content";',
  },
};
