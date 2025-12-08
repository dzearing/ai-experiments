import type { Meta, StoryObj } from '@storybook/react';
import { Radio } from './Radio';

const meta: Meta<typeof Radio> = {
  title: 'Inputs/Radio',
  component: Radio,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Radio button for selecting one option from a mutually exclusive list.

## When to Use

- Selecting one option from 2-5 choices
- When all options should be visible at once
- Settings where selection is immediate

## Radio vs Select

| Component | Use Case |
|-----------|----------|
| **Radio** | 2-5 options, all visible |
| **Select** | 5+ options, or limited space |

## Usage

Radio buttons must share the same \`name\` attribute to form a group:

\`\`\`jsx
<Radio name="size" value="sm" label="Small" />
<Radio name="size" value="md" label="Medium" />
<Radio name="size" value="lg" label="Large" />
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Radio option',
    name: 'default-radio',
  },
};

export const Checked: Story = {
  args: {
    label: 'Selected option',
    name: 'checked-radio',
    defaultChecked: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Radio size="sm" name="sizes-sm" label="Small radio" />
      <Radio size="md" name="sizes-md" label="Medium radio" />
      <Radio size="lg" name="sizes-lg" label="Large radio" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Radio disabled name="disabled-1" label="Disabled unselected" />
      <Radio disabled defaultChecked name="disabled-2" label="Disabled selected" />
    </div>
  ),
};

export const RadioGroup: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Radio name="color" value="red" label="Red" defaultChecked />
      <Radio name="color" value="green" label="Green" />
      <Radio name="color" value="blue" label="Blue" />
    </div>
  ),
};
