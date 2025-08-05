import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button/Button';
import { Input } from './Input/Input';
import { Checkbox } from './Checkbox/Checkbox';
import { Switch } from './Switch/Switch';
import { Link } from './Link/Link';
import { Dropdown } from './Dropdown/Dropdown';
import { Stack } from './Stack/Stack';

const meta = {
  title: 'Focus Styles Demo',
  parameters: {
    layout: 'padded',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const FocusStylesShowcase: Story = {
  render: () => (
    <Stack direction="vertical" spacing="large30" style={{ padding: '20px' }}>
      <div>
        <h2 style={{ marginBottom: '16px' }}>Focus Style Consistency Demo</h2>
        <p style={{ marginBottom: '24px', color: 'var(--color-body-textSoft20)' }}>
          Tab through elements to see the consistent 2px internal focus borders
        </p>
      </div>

      <Stack direction="vertical" spacing="large10">
        <h3>Buttons - Internal 2px focus border</h3>
        <Stack direction="horizontal" spacing="medium">
          <Button variant="primary">Primary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="neutral">Neutral Button</Button>
          <Button variant="danger">Danger Button</Button>
        </Stack>
        <p style={{ fontSize: '14px', color: 'var(--color-body-textSoft20)' }}>
          Primary buttons have additional inner white shadow for contrast
        </p>
      </Stack>

      <Stack direction="vertical" spacing="large10">
        <h3>Inputs - 2px internal border on focus</h3>
        <Stack direction="horizontal" spacing="medium">
          <Input placeholder="Normal input" />
          <Input placeholder="Error input" error errorText="Error state" />
          <Input placeholder="Success input" success />
        </Stack>
      </Stack>

      <Stack direction="vertical" spacing="large10">
        <h3>Checkboxes & Switches</h3>
        <Stack direction="horizontal" spacing="large20">
          <Checkbox label="Checkbox 1" />
          <Checkbox label="Checkbox 2" />
          <Switch label="Switch 1" />
          <Switch label="Switch 2" />
        </Stack>
      </Stack>

      <Stack direction="vertical" spacing="large10">
        <h3>Links - Internal focus with padding adjustment</h3>
        <Stack direction="horizontal" spacing="large10">
          <Link href="#">Link 1</Link>
          <Link href="#">Link 2</Link>
          <Link href="#" variant="secondary">Secondary Link</Link>
        </Stack>
      </Stack>

      <Stack direction="vertical" spacing="large10">
        <h3>Dropdowns</h3>
        <Stack direction="horizontal" spacing="medium">
          <Dropdown
            options={[
              { label: 'Option 1', value: '1' },
              { label: 'Option 2', value: '2' },
              { label: 'Option 3', value: '3' },
            ]}
            placeholder="Select an option"
          />
          <Dropdown
            options={[
              { label: 'Option 1', value: '1' },
              { label: 'Option 2', value: '2' },
            ]}
            placeholder="Error state"
            error
          />
        </Stack>
      </Stack>

      <Stack direction="vertical" spacing="medium" style={{ marginTop: '40px' }}>
        <h3>Key Changes:</h3>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>All components now use <code>box-shadow: inset 0 0 0 2px</code> for focus</li>
          <li>Focus indicators are contained within component boundaries (no overflow risk)</li>
          <li>Consistent 2px width across all components</li>
          <li>Primary buttons include additional inner shadow for better contrast</li>
          <li>Links have padding adjustments to accommodate inline display</li>
        </ul>
      </Stack>
    </Stack>
  ),
};