import type { Meta, StoryObj } from '@storybook/react';
import { Heading } from './Heading';

const meta = {
  title: 'Typography/Heading',
  component: Heading,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Semantic heading component for page and section titles.

## When to Use

- Page titles (h1)
- Section headers (h2-h3)
- Subsections (h4-h6)

## Semantic vs Visual Hierarchy

Use \`level\` for semantic HTML (accessibility/SEO) and \`size\` to override visual appearance:

\`\`\`jsx
// Semantically h2, but styled like h4
<Heading level={2} size={4}>Subsection</Heading>
\`\`\`

## Best Practices

- Only one h1 per page
- Don't skip heading levels (h1 → h3)
- Use for structure, not just styling
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Heading',
    level: 1,
  },
};

export const AllLevels: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Heading level={1}>Heading 1</Heading>
      <Heading level={2}>Heading 2</Heading>
      <Heading level={3}>Heading 3</Heading>
      <Heading level={4}>Heading 4</Heading>
      <Heading level={5}>Heading 5</Heading>
      <Heading level={6}>Heading 6</Heading>
    </div>
  ),
};

export const CustomSize: Story = {
  args: {
    children: 'H2 styled as H4',
    level: 2,
    size: 4,
  },
};

export const InContext: Story = {
  render: () => (
    <article>
      <Heading level={1}>Article Title</Heading>
      <p style={{ color: 'var(--body-text-soft)', marginTop: '8px' }}>
        Published on January 1, 2024
      </p>
      <Heading level={2} style={{ marginTop: '24px' }}>Introduction</Heading>
      <p style={{ color: 'var(--body-text)', marginTop: '8px' }}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </p>
      <Heading level={2} style={{ marginTop: '24px' }}>Main Content</Heading>
      <p style={{ color: 'var(--body-text)', marginTop: '8px' }}>
        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </p>
      <Heading level={3} style={{ marginTop: '16px' }}>Subsection</Heading>
      <p style={{ color: 'var(--body-text)', marginTop: '8px' }}>
        Ut enim ad minim veniam, quis nostrud exercitation.
      </p>
    </article>
  ),
};
