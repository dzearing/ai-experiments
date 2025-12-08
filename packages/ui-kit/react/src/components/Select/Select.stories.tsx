import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select';

const meta: Meta<typeof Select> = {
  title: 'Inputs/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Dropdown select for choosing one option from a list.

## When to Use

- Selecting from 5+ options
- Limited vertical space
- Form fields requiring single selection

## Select vs Radio

| Component | Use Case |
|-----------|----------|
| **Select** | 5+ options, saves space |
| **Radio** | 2-5 options, all visible |

## Placeholder

Use \`placeholder\` to show hint text when no value is selected:

\`\`\`jsx
<Select placeholder="Choose a country">
  <option value="us">United States</option>
  <option value="uk">United Kingdom</option>
</Select>
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
    error: {
      control: 'boolean',
    },
    fullWidth: {
      control: 'boolean',
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
    placeholder: 'Select an option',
    children: (
      <>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
      </>
    ),
  },
};

export const WithPlaceholder: Story = {
  args: {
    placeholder: 'Choose a country',
    defaultValue: '',
    children: (
      <>
        <option value="us">United States</option>
        <option value="uk">United Kingdom</option>
        <option value="de">Germany</option>
        <option value="fr">France</option>
      </>
    ),
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Select size="sm" placeholder="Small">
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
      <Select size="md" placeholder="Medium">
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
      <Select size="lg" placeholder="Large">
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
    </div>
  ),
};

export const Error: Story = {
  args: {
    error: true,
    placeholder: 'Select required',
    children: (
      <>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </>
    ),
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled',
    children: (
      <>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </>
    ),
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    placeholder: 'Full width select',
    children: (
      <>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
      </>
    ),
  },
};
