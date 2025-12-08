import type { Meta, StoryObj } from '@storybook/react';
import { Divider } from './Divider';

const meta: Meta<typeof Divider> = {
  title: 'Layout/Divider',
  component: Divider,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Visual separator for dividing content sections.

## When to Use

- Separating sections of content
- Dividing list items
- Creating visual breaks between related groups

## Orientation

| Value | Use Case |
|-------|----------|
| **horizontal** | Default, separates stacked content |
| **vertical** | Separates side-by-side content |

## Spacing

Control margin around the divider with \`spacing\` prop: \`none\`, \`sm\`, \`md\`, \`lg\`.
        `,
      },
    },
  },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    spacing: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
  },
};

export const Vertical: Story = {
  render: () => (
    <div style={{ display: 'flex', height: '100px', alignItems: 'center' }}>
      <span>Left</span>
      <Divider orientation="vertical" spacing="md" />
      <span>Right</span>
    </div>
  ),
};

export const WithSpacing: Story = {
  render: () => (
    <div>
      <p>Content above</p>
      <Divider spacing="md" />
      <p>Content below</p>
    </div>
  ),
};

export const InList: Story = {
  render: () => (
    <div>
      <div style={{ padding: '8px 0' }}>Item 1</div>
      <Divider />
      <div style={{ padding: '8px 0' }}>Item 2</div>
      <Divider />
      <div style={{ padding: '8px 0' }}>Item 3</div>
    </div>
  ),
};
