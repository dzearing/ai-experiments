import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SegmentedControl, SegmentOption } from './SegmentedControl';
import { 
  ListBulletIcon,
  TableIcon,
  ImageIcon,
  CalendarIcon,
  ClockIcon,
  FolderIcon,
  HomeIcon,
  UserIcon,
  SettingsIcon
} from '@claude-flow/ui-kit-icons';

const meta: Meta<typeof SegmentedControl> = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['pills', 'square', 'underline'],
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
    },
    color: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'neutral'],
    },
    fullWidth: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    showDividers: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic options for most stories
const basicOptions: SegmentOption[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

// Controlled component wrapper
const ControlledSegmentedControl = (props: any) => {
  const [value, setValue] = useState(props.value || props.options[0].value);
  
  return (
    <SegmentedControl
      {...props}
      value={value}
      onChange={setValue}
    />
  );
};

export const Default: Story = {
  render: () => (
    <ControlledSegmentedControl
      options={basicOptions}
      value="option1"
    />
  ),
};

export const Playground: Story = {
  args: {
    options: basicOptions,
    value: 'option1',
    variant: 'pills',
    size: 'medium',
    color: 'primary',
    fullWidth: false,
    disabled: false,
    showDividers: true,
    ariaLabel: 'Select an option',
  },
  render: (args) => <ControlledSegmentedControl {...args} />,
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' }}>
      <div>
        <h4 style={{ marginBottom: '8px' }}>Small</h4>
        <ControlledSegmentedControl
          options={basicOptions}
          value="option1"
          size="small"
        />
      </div>
      <div>
        <h4 style={{ marginBottom: '8px' }}>Medium (Default)</h4>
        <ControlledSegmentedControl
          options={basicOptions}
          value="option2"
        />
      </div>
      <div>
        <h4 style={{ marginBottom: '8px' }}>Large</h4>
        <ControlledSegmentedControl
          options={basicOptions}
          value="option3"
          size="large"
        />
      </div>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' }}>
      <div>
        <h4 style={{ marginBottom: '8px' }}>Pills (Default)</h4>
        <ControlledSegmentedControl
          options={basicOptions}
          value="option1"
          variant="pills"
        />
      </div>
      <div>
        <h4 style={{ marginBottom: '8px' }}>Square</h4>
        <ControlledSegmentedControl
          options={basicOptions}
          value="option2"
          variant="square"
        />
      </div>
      <div>
        <h4 style={{ marginBottom: '8px' }}>Underline</h4>
        <ControlledSegmentedControl
          options={basicOptions}
          value="option3"
          variant="underline"
        />
      </div>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' }}>
      <div>
        <h4 style={{ marginBottom: '8px' }}>Primary</h4>
        <ControlledSegmentedControl
          options={basicOptions}
          value="option1"
          color="primary"
        />
      </div>
      <div>
        <h4 style={{ marginBottom: '8px' }}>Secondary</h4>
        <ControlledSegmentedControl
          options={basicOptions}
          value="option2"
          color="secondary"
        />
      </div>
      <div>
        <h4 style={{ marginBottom: '8px' }}>Neutral</h4>
        <ControlledSegmentedControl
          options={basicOptions}
          value="option3"
          color="neutral"
        />
      </div>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => {
    const optionsWithIcons: SegmentOption[] = [
      { value: 'list', label: 'List', icon: <ListBulletIcon /> },
      { value: 'table', label: 'Table', icon: <TableIcon /> },
      { value: 'gallery', label: 'Gallery', icon: <ImageIcon /> },
    ];
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ marginBottom: '8px' }}>Icon + Text</h4>
          <ControlledSegmentedControl
            options={optionsWithIcons}
            value="list"
          />
        </div>
        <div>
          <h4 style={{ marginBottom: '8px' }}>Icon Only</h4>
          <ControlledSegmentedControl
            options={[
              { value: 'list', icon: <ListBulletIcon />, ariaLabel: 'List view' },
              { value: 'table', icon: <TableIcon />, ariaLabel: 'Table view' },
              { value: 'gallery', icon: <ImageIcon />, ariaLabel: 'Gallery view' },
            ]}
            value="list"
          />
        </div>
      </div>
    );
  },
};

export const FullWidth: Story = {
  render: () => (
    <div style={{ width: '400px' }}>
      <ControlledSegmentedControl
        options={basicOptions}
        value="option2"
        fullWidth
      />
    </div>
  ),
};

export const WithDisabledOptions: Story = {
  render: () => {
    const optionsWithDisabled: SegmentOption[] = [
      { value: 'active', label: 'Active' },
      { value: 'pending', label: 'Pending' },
      { value: 'archived', label: 'Archived', disabled: true },
      { value: 'deleted', label: 'Deleted', disabled: true },
    ];
    
    return (
      <ControlledSegmentedControl
        options={optionsWithDisabled}
        value="active"
      />
    );
  },
};

export const EntirelyDisabled: Story = {
  render: () => (
    <ControlledSegmentedControl
      options={basicOptions}
      value="option1"
      disabled
    />
  ),
};

export const ManyOptions: Story = {
  render: () => {
    const manyOptions: SegmentOption[] = [
      { value: 'monday', label: 'Monday' },
      { value: 'tuesday', label: 'Tuesday' },
      { value: 'wednesday', label: 'Wednesday' },
      { value: 'thursday', label: 'Thursday' },
      { value: 'friday', label: 'Friday' },
      { value: 'saturday', label: 'Saturday' },
      { value: 'sunday', label: 'Sunday' },
    ];
    
    return (
      <div style={{ maxWidth: '400px', overflow: 'auto' }}>
        <ControlledSegmentedControl
          options={manyOptions}
          value="monday"
        />
      </div>
    );
  },
};

export const SingleOption: Story = {
  render: () => (
    <ControlledSegmentedControl
      options={[{ value: 'only', label: 'Only Option' }]}
      value="only"
    />
  ),
};

export const LongLabels: Story = {
  render: () => {
    const longLabelOptions: SegmentOption[] = [
      { value: 'short', label: 'Short' },
      { value: 'medium', label: 'Medium Length' },
      { value: 'long', label: 'This is a very long label that might truncate' },
    ];
    
    return (
      <div style={{ maxWidth: '400px' }}>
        <ControlledSegmentedControl
          options={longLabelOptions}
          value="short"
        />
      </div>
    );
  },
};

export const ViewSwitcher: Story = {
  name: 'Use Case: View Switcher',
  render: () => {
    const viewOptions: SegmentOption[] = [
      { value: 'list', label: 'List', icon: <ListBulletIcon /> },
      { value: 'table', label: 'Table', icon: <TableIcon /> },
      { value: 'folder', label: 'Folders', icon: <FolderIcon /> },
    ];
    
    return (
      <div>
        <h4 style={{ marginBottom: '16px' }}>Select View Mode</h4>
        <ControlledSegmentedControl
          options={viewOptions}
          value="list"
          ariaLabel="View mode selector"
        />
      </div>
    );
  },
};

export const FilterControl: Story = {
  name: 'Use Case: Filter Control',
  render: () => {
    const filterOptions: SegmentOption[] = [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'completed', label: 'Completed' },
      { value: 'archived', label: 'Archived' },
    ];
    
    return (
      <div>
        <h4 style={{ marginBottom: '16px' }}>Filter Tasks</h4>
        <ControlledSegmentedControl
          options={filterOptions}
          value="all"
          ariaLabel="Task filter"
          variant="underline"
        />
      </div>
    );
  },
};

export const TimePeriod: Story = {
  name: 'Use Case: Time Period Selection',
  render: () => {
    const timeOptions: SegmentOption[] = [
      { value: 'day', label: 'Day' },
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
      { value: 'year', label: 'Year' },
    ];
    
    return (
      <div>
        <h4 style={{ marginBottom: '16px' }}>Select Time Range</h4>
        <ControlledSegmentedControl
          options={timeOptions}
          value="week"
          ariaLabel="Time period selector"
          size="large"
        />
      </div>
    );
  },
};

export const FormIntegration: Story = {
  render: () => {
    const [formData, setFormData] = useState({ viewMode: 'list' });
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      alert(`Form submitted with view mode: ${formData.viewMode}`);
    };
    
    return (
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <label>
          <div style={{ marginBottom: '8px' }}>Select View Mode:</div>
          <ControlledSegmentedControl
            options={[
              { value: 'list', label: 'List' },
              { value: 'grid', label: 'Grid' },
              { value: 'cards', label: 'Cards' },
            ]}
            value={formData.viewMode}
            onChange={(value: string) => setFormData({ ...formData, viewMode: value })}
            name="viewMode"
          />
        </label>
        <button type="submit" style={{ padding: '8px 16px', alignSelf: 'flex-start' }}>
          Submit Form
        </button>
      </form>
    );
  },
};