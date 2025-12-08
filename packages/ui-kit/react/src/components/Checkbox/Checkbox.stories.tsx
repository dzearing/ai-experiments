import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Inputs/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Checkbox for toggling a boolean value or selecting multiple options from a list.

## When to Use

- **Single checkbox**: Toggle a setting on/off (e.g., "Remember me")
- **Checkbox group**: Select multiple items from a list
- **Terms acceptance**: Require user agreement

## Checkbox vs Switch

| Component | Use Case |
|-----------|----------|
| **Checkbox** | Options saved with form submission |
| **Switch** | Immediate effect, no save required |

## States

- **Unchecked**: Default state
- **Checked**: Option is selected
- **Indeterminate**: Parent checkbox with partially selected children
- **Disabled**: Non-interactive state
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
    indeterminate: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Accept terms and conditions',
  },
};

export const Checked: Story = {
  args: {
    label: 'Checked checkbox',
    defaultChecked: true,
  },
};

export const Indeterminate: Story = {
  args: {
    label: 'Indeterminate state',
    indeterminate: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Checkbox size="sm" label="Small checkbox" />
      <Checkbox size="md" label="Medium checkbox" />
      <Checkbox size="lg" label="Large checkbox" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Checkbox disabled label="Disabled unchecked" />
      <Checkbox disabled defaultChecked label="Disabled checked" />
    </div>
  ),
};

export const WithoutLabel: Story = {
  args: {},
};

export const CheckboxGroup: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Checkbox name="options" label="Option 1" defaultChecked />
      <Checkbox name="options" label="Option 2" />
      <Checkbox name="options" label="Option 3" />
    </div>
  ),
};
