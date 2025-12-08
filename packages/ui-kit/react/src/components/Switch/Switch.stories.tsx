import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './Switch';

const meta: Meta<typeof Switch> = {
  title: 'Inputs/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Toggle switch for binary on/off settings with immediate effect.

## When to Use

- Settings that take effect immediately (no save button needed)
- Binary on/off states
- Feature toggles

## Switch vs Checkbox

| Component | Use Case |
|-----------|----------|
| **Switch** | Immediate effect, no form submission |
| **Checkbox** | Part of a form, saved on submit |

## Common Patterns

Use in settings pages with label on left, switch on right:

\`\`\`jsx
<Stack direction="row" justify="between">
  <Text>Dark Mode</Text>
  <Switch checked={isDark} onChange={setIsDark} />
</Stack>
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
    label: 'Enable notifications',
  },
};

export const Checked: Story = {
  args: {
    label: 'Feature enabled',
    defaultChecked: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Switch size="sm" label="Small switch" />
      <Switch size="md" label="Medium switch" />
      <Switch size="lg" label="Large switch" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Switch disabled label="Disabled off" />
      <Switch disabled defaultChecked label="Disabled on" />
    </div>
  ),
};

export const WithoutLabel: Story = {
  args: {},
};

export const SettingsExample: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Dark Mode</span>
        <Switch />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Notifications</span>
        <Switch defaultChecked />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Auto-save</span>
        <Switch defaultChecked />
      </div>
    </div>
  ),
};
