import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { Button } from '../Button/Button';
import React from 'react';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
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
type Story = StoryObj<typeof Input>;

export const Controlled: Story = {
  name: 'Controlled Example',
  render: () => {
    const [value, setValue] = React.useState('');
    const [error, setError] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      
      // Example validation
      if (newValue && !newValue.includes('@')) {
        setError(true);
        setErrorMessage('Please enter a valid email address');
      } else {
        setError(false);
        setErrorMessage('');
      }
    };
    
    return (
      <div style={{ width: '300px' }}>
        <Input
          label="Email (Controlled)"
          placeholder="Enter your email"
          type="email"
          value={value}
          onChange={handleChange}
          error={error}
          errorMessage={errorMessage}
          helperText="This input is controlled - its value and error state are managed by the parent"
        />
        <p style={{ marginTop: '1rem', fontSize: '14px', color: '#666' }}>
          Current value: {value || '(empty)'}
        </p>
      </div>
    );
  },
};

export const Uncontrolled: Story = {
  name: 'Uncontrolled Example',
  render: () => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    const handleSubmit = () => {
      alert(`Submitted value: ${inputRef.current?.value || '(empty)'}`);
    };
    
    return (
      <div style={{ width: '300px' }}>
        <Input
          ref={inputRef}
          label="Name (Uncontrolled)"
          placeholder="Enter your name"
          helperText="This input is uncontrolled - it manages its own state internally"
        />
        <Button 
          onClick={handleSubmit}
          variant="primary"
          style={{ marginTop: '1rem' }}
        >
          Get Value
        </Button>
      </div>
    );
  },
};

// Icons for examples
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
  </svg>
);

export const InputUsage: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email',
    type: 'email',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
      <Input size="small" placeholder="Small input" />
      <Input size="medium" placeholder="Medium input" />
      <Input size="large" placeholder="Large input" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
      <Input placeholder="Normal input" />
      <Input placeholder="Disabled input" disabled />
      <Input placeholder="Error input" error />
      <Input placeholder="Success input" success />
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
      <Input leftIcon={<SearchIcon />} placeholder="Search..." />
      <Input leftIcon={<MailIcon />} placeholder="Email address" type="email" />
      <Input
        placeholder="Password"
        type="password"
        rightIcon={<EyeIcon />}
      />
      <Input
        leftIcon={<SearchIcon />}
        rightIcon={<span style={{ fontSize: '12px', color: 'var(--color-body-text-soft20)' }}>⌘K</span>}
        placeholder="Search with shortcut"
      />
    </div>
  ),
};

export const WithHelperText: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
      <Input
        label="Username"
        placeholder="Enter username"
        helperText="Choose a unique username"
      />
      <Input
        label="Email"
        placeholder="Enter email"
        type="email"
        error
        errorMessage="Please enter a valid email address"
      />
      <Input
        label="Password"
        placeholder="Enter password"
        type="password"
        success
        helperText="Strong password!"
      />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div style={{ width: '300px' }}>
      <Input
        label="Required Field"
        placeholder="This field is required"
        required
        helperText="This field must be filled out"
      />
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '400px' }}>
      <Input
        label="First Name"
        placeholder="John"
        required
      />
      <Input
        label="Last Name"
        placeholder="Doe"
        required
      />
      <Input
        label="Email"
        placeholder="john.doe@example.com"
        type="email"
        leftIcon={<MailIcon />}
        required
        helperText="We'll never share your email"
      />
      <Input
        label="Password"
        placeholder="Enter password"
        type="password"
        required
        helperText="Must be at least 8 characters"
      />
    </form>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <Input
        fullWidth
        label="Full Width Input"
        placeholder="This input takes full width of its container"
        helperText="Useful for forms and layouts"
      />
    </div>
  ),
};