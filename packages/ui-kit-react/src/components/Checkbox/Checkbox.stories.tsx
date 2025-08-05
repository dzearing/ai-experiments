import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';
import React from 'react';

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Controlled: Story = {
  name: 'Controlled Example',
  render: () => {
    const [checked, setChecked] = React.useState(false);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
        <Checkbox
          label="I agree to receive marketing emails"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          This checkbox is controlled - its checked state is managed by the parent component.
          <br />
          Current value: {checked ? 'checked' : 'unchecked'}
        </p>
      </div>
    );
  },
};

export const Uncontrolled: Story = {
  name: 'Uncontrolled Example',
  render: () => {
    const checkboxRef = React.useRef<HTMLInputElement>(null);
    
    const handleGetValue = () => {
      alert(`Checkbox is ${checkboxRef.current?.checked ? 'checked' : 'unchecked'}`);
    };
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
        <Checkbox
          ref={checkboxRef}
          label="Subscribe to newsletter"
          defaultChecked
        />
        <button 
          onClick={handleGetValue}
          style={{ 
            padding: '8px 16px',
            background: 'var(--color-primary-background)',
            color: 'var(--color-primary-text)',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            cursor: 'pointer'
          }}
        >
          Get Value
        </button>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          This checkbox is uncontrolled - it manages its own state internally using defaultChecked.
        </p>
      </div>
    );
  },
};

export const CheckboxUsage: Story = {
  args: {
    label: 'Accept terms and conditions',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Checkbox size="small" label="Small checkbox" />
      <Checkbox size="medium" label="Medium checkbox" />
      <Checkbox size="large" label="Large checkbox" />
    </div>
  ),
};

export const States: Story = {
  render: () => {
    const [checked, setChecked] = React.useState(true);
    const [indeterminate, setIndeterminate] = React.useState(true);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Checkbox label="Unchecked" />
        <Checkbox
          label="Checked"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <Checkbox
          label="Indeterminate"
          indeterminate={indeterminate}
          onChange={() => setIndeterminate(false)}
        />
        <Checkbox label="Disabled" disabled />
        <Checkbox label="Disabled checked" disabled checked />
        <Checkbox label="Error state" error />
      </div>
    );
  },
};

export const WithoutLabel: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Checkbox aria-label="Option 1" />
      <Checkbox aria-label="Option 2" defaultChecked />
      <Checkbox aria-label="Option 3" disabled />
    </div>
  ),
};

export const CheckboxGroup: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<string[]>(['option2']);

    const handleChange = (option: string) => {
      setSelected((prev) =>
        prev.includes(option)
          ? prev.filter((item) => item !== option)
          : [...prev, option]
      );
    };

    return (
      <div role="group" aria-labelledby="checkbox-group-label">
        <h3 id="checkbox-group-label" style={{ marginBottom: '1rem' }}>
          Select your preferences
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Checkbox
            label="Email notifications"
            checked={selected.includes('option1')}
            onChange={() => handleChange('option1')}
          />
          <Checkbox
            label="SMS notifications"
            checked={selected.includes('option2')}
            onChange={() => handleChange('option2')}
          />
          <Checkbox
            label="Push notifications"
            checked={selected.includes('option3')}
            onChange={() => handleChange('option3')}
          />
        </div>
      </div>
    );
  },
};

export const IndeterminateExample: Story = {
  render: () => {
    const [parentChecked, setParentChecked] = React.useState(false);
    const [childChecked, setChildChecked] = React.useState([true, false, false]);

    const handleParentChange = () => {
      const newValue = !parentChecked;
      setParentChecked(newValue);
      setChildChecked([newValue, newValue, newValue]);
    };

    const handleChildChange = (index: number) => {
      const newChildChecked = [...childChecked];
      newChildChecked[index] = !newChildChecked[index];
      setChildChecked(newChildChecked);

      const allChecked = newChildChecked.every(Boolean);
      setParentChecked(allChecked);
    };

    const allChecked = childChecked.every(Boolean);
    const someChecked = childChecked.some(Boolean);

    return (
      <div>
        <Checkbox
          label="Select all"
          checked={parentChecked}
          indeterminate={someChecked && !allChecked}
          onChange={handleParentChange}
        />
        <div style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Checkbox
              label="Option 1"
              checked={childChecked[0]}
              onChange={() => handleChildChange(0)}
            />
            <Checkbox
              label="Option 2"
              checked={childChecked[1]}
              onChange={() => handleChildChange(1)}
            />
            <Checkbox
              label="Option 3"
              checked={childChecked[2]}
              onChange={() => handleChildChange(2)}
            />
          </div>
        </div>
      </div>
    );
  },
};

export const FormExample: Story = {
  render: () => (
    <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h3 style={{ marginBottom: '1rem' }}>Newsletter Preferences</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Checkbox label="Daily digest" defaultChecked />
          <Checkbox label="Weekly summary" />
          <Checkbox label="Product updates" defaultChecked />
          <Checkbox label="Special offers" />
        </div>
      </div>
      
      <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--color-body-border)' }}>
        <Checkbox
          label="I agree to the terms and conditions"
          required
          error
        />
      </div>
    </form>
  ),
};