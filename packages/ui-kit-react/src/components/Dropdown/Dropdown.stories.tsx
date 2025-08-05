import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown } from './Dropdown';
import { Button } from '../Button';
import React from 'react';

const meta: Meta<typeof Dropdown> = {
  title: 'Components/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'padded',
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
type Story = StoryObj<typeof Dropdown>;

const defaultOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'orange', label: 'Orange' },
  { value: 'grape', label: 'Grape' },
  { value: 'strawberry', label: 'Strawberry' },
];

export const Controlled: Story = {
  name: 'Controlled Example',
  render: () => {
    const [selectedFruit, setSelectedFruit] = React.useState<string>('');
    
    // Define options locally for this example
    const fruitOptions = [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'orange', label: 'Orange' },
      { value: 'grape', label: 'Grape' },
      { value: 'strawberry', label: 'Strawberry' },
    ];
    
    // Find the label for the selected value
    const selectedLabel = fruitOptions.find(opt => opt.value === selectedFruit)?.label;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', width: '300px' }}>
        <Dropdown
          label="Favorite Fruit (Controlled)"
          options={fruitOptions}
          value={selectedFruit}
          onChange={setSelectedFruit}
          placeholder="Select a fruit"
        />
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          This dropdown is controlled - its value is managed by the parent component.
          <br />
          Current value: {selectedFruit || '(none selected)'}
          <br />
          Display label: {selectedLabel || '(none selected)'}
        </p>
        <Button 
          onClick={() => setSelectedFruit('banana')}
          variant="neutral"
        >
          Set to Banana
        </Button>
      </div>
    );
  },
};

export const Uncontrolled: Story = {
  name: 'Uncontrolled Example',
  render: () => {
    const dropdownRef = React.useRef<HTMLSelectElement>(null);
    
    const handleGetValue = () => {
      const value = dropdownRef.current?.value;
      const label = defaultOptions.find(opt => opt.value === value)?.label;
      alert(`Selected: ${label || '(none)'}`);
    };
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', width: '300px' }}>
        <Dropdown
          ref={dropdownRef}
          label="Favorite Fruit (Uncontrolled)"
          options={defaultOptions}
          defaultValue="orange"
          placeholder="Select a fruit"
        />
        <Button 
          onClick={handleGetValue}
          variant="primary"
        >
          Get Value
        </Button>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          This dropdown is uncontrolled - it manages its own state internally using defaultValue.
        </p>
      </div>
    );
  },
};

export const DropdownUsage: Story = {
  render: () => {
    const [value, setValue] = React.useState<string>('');
    
    return (
      <Dropdown
        options={defaultOptions}
        value={value}
        onChange={setValue}
        placeholder="Select a fruit"
      />
    );
  },
};

export const WithLabel: Story = {
  render: () => {
    const [value, setValue] = React.useState<string>('');
    
    return (
      <Dropdown
        label="Favorite Fruit"
        helperText="Choose your favorite fruit from the list"
        options={defaultOptions}
        value={value}
        onChange={setValue}
        required
      />
    );
  },
};

export const Sizes: Story = {
  render: () => {
    const [small, setSmall] = React.useState<string>('');
    const [medium, setMedium] = React.useState<string>('');
    const [large, setLarge] = React.useState<string>('');
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Dropdown
          label="Small"
          size="small"
          options={defaultOptions}
          value={small}
          onChange={setSmall}
        />
        <Dropdown
          label="Medium (default)"
          size="medium"
          options={defaultOptions}
          value={medium}
          onChange={setMedium}
        />
        <Dropdown
          label="Large"
          size="large"
          options={defaultOptions}
          value={large}
          onChange={setLarge}
        />
      </div>
    );
  },
};

export const States: Story = {
  render: () => {
    const [normal, setNormal] = React.useState<string>('apple');
    const [error, setError] = React.useState<string>('');
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Dropdown
          label="Normal"
          options={defaultOptions}
          value={normal}
          onChange={setNormal}
        />
        <Dropdown
          label="Error"
          options={defaultOptions}
          value={error}
          onChange={setError}
          error
          errorMessage="Please select a valid option"
        />
        <Dropdown
          label="Disabled"
          options={defaultOptions}
          value="banana"
          disabled
        />
      </div>
    );
  },
};

export const WithDisabledOptions: Story = {
  render: () => {
    const [value, setValue] = React.useState<string>('');
    
    const optionsWithDisabled = [
      { value: 'available1', label: 'Available Option 1' },
      { value: 'disabled1', label: 'Disabled Option 1', disabled: true },
      { value: 'available2', label: 'Available Option 2' },
      { value: 'disabled2', label: 'Disabled Option 2', disabled: true },
      { value: 'available3', label: 'Available Option 3' },
    ];
    
    return (
      <Dropdown
        label="Select an option"
        helperText="Some options are disabled"
        options={optionsWithDisabled}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const FullWidth: Story = {
  render: () => {
    const [value, setValue] = React.useState<string>('');
    
    return (
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <Dropdown
          label="Full Width Dropdown"
          options={defaultOptions}
          value={value}
          onChange={setValue}
          fullWidth
        />
      </div>
    );
  },
};

export const LongOptions: Story = {
  render: () => {
    const [value, setValue] = React.useState<string>('');
    
    const longOptions = [
      { value: 'short', label: 'Short' },
      { value: 'medium', label: 'This is a medium length option' },
      { value: 'long', label: 'This is a very long option that might need to be truncated in the dropdown' },
      { value: 'verylong', label: 'This is an extremely long option that definitely needs to be truncated because it contains so much text that it would break the layout' },
    ];
    
    return (
      <div style={{ width: '300px' }}>
        <Dropdown
          label="Long Options"
          options={longOptions}
          value={value}
          onChange={setValue}
          fullWidth
        />
      </div>
    );
  },
};

export const ManyOptions: Story = {
  render: () => {
    const [value, setValue] = React.useState<string>('');
    
    const manyOptions = Array.from({ length: 50 }, (_, i) => ({
      value: `option-${i + 1}`,
      label: `Option ${i + 1}`,
    }));
    
    return (
      <Dropdown
        label="Many Options (scrollable)"
        helperText="The dropdown menu scrolls when there are many options"
        options={manyOptions}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const InForm: Story = {
  render: () => {
    const [country, setCountry] = React.useState<string>('');
    const [state, setState] = React.useState<string>('');
    
    const countries = [
      { value: 'us', label: 'United States' },
      { value: 'ca', label: 'Canada' },
      { value: 'mx', label: 'Mexico' },
    ];
    
    const states = [
      { value: 'ca', label: 'California' },
      { value: 'tx', label: 'Texas' },
      { value: 'ny', label: 'New York' },
      { value: 'fl', label: 'Florida' },
    ];
    
    return (
      <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
        <Dropdown
          label="Country"
          options={countries}
          value={country}
          onChange={setCountry}
          required
          fullWidth
        />
        <Dropdown
          label="State/Province"
          options={states}
          value={state}
          onChange={setState}
          required
          fullWidth
          disabled={!country}
          helperText={!country ? 'Please select a country first' : undefined}
        />
      </form>
    );
  },
};