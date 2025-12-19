import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { Form, FormField, FormActions, FormRow } from '../Form';
import { Button } from '../Button';

const meta: Meta<typeof Input> = {
  title: 'Inputs/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Text input field for single-line user input. Supports various input types and validation states.

## When to Use

- Collecting text data (names, emails, passwords)
- Search fields
- Form fields requiring user input

## Input Types

| Type | Use Case |
|------|----------|
| \`text\` | General text input (default) |
| \`email\` | Email addresses with validation |
| \`password\` | Secure password entry |
| \`number\` | Numeric values |
| \`search\` | Search queries |

## States

- **Default**: Normal input state
- **Error**: Validation failed (use with FormField error message)
- **Disabled**: Input is not interactive

## With FormField

Wrap Input with \`FormField\` to add labels, hints, and error messages:

\`\`\`jsx
<FormField label="Email" hint="We won't share this" error="Invalid email">
  <Input type="email" error />
</FormField>
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
    placeholder: 'Enter text...',
    size: 'md',
  },
};

export const WithValue: Story = {
  args: {
    value: 'Hello World',
    size: 'md',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Input size="sm" placeholder="Small input" />
      <Input size="md" placeholder="Medium input" />
      <Input size="lg" placeholder="Large input" />
    </div>
  ),
};

export const Error: Story = {
  args: {
    placeholder: 'Invalid input',
    error: true,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    placeholder: 'Full width input',
    fullWidth: true,
  },
};

export const InputTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email input" />
      <Input type="password" placeholder="Password input" />
      <Input type="number" placeholder="Number input" />
      <Input type="search" placeholder="Search input" />
    </div>
  ),
};

// Form field examples using the Form components

export const WithLabel: Story = {
  render: () => (
    <FormField label="Username" htmlFor="username">
      <Input id="username" placeholder="Enter your username" />
    </FormField>
  ),
};

export const WithLabelAndHint: Story = {
  render: () => (
    <FormField
      label="Email Address"
      htmlFor="email"
      hint="We'll never share your email with anyone else."
    >
      <Input id="email" type="email" placeholder="you@example.com" />
    </FormField>
  ),
};

export const WithLabelAndError: Story = {
  render: () => (
    <FormField
      label="Password"
      htmlFor="password"
      error="Password must be at least 8 characters long."
    >
      <Input id="password" type="password" placeholder="Enter password" error />
    </FormField>
  ),
};

export const RequiredField: Story = {
  render: () => (
    <FormField
      label="Full Name"
      htmlFor="fullName"
      required
      hint="Your legal name as it appears on official documents."
    >
      <Input id="fullName" placeholder="John Doe" />
    </FormField>
  ),
};

export const FormExample: Story = {
  render: () => (
    <Form style={{ maxWidth: '400px' }}>
      <FormRow>
        <FormField label="First Name" htmlFor="firstName" required>
          <Input id="firstName" placeholder="John" />
        </FormField>
        <FormField label="Last Name" htmlFor="lastName" required>
          <Input id="lastName" placeholder="Doe" />
        </FormField>
      </FormRow>
      <FormField
        label="Email"
        htmlFor="formEmail"
        required
        hint="We'll send a confirmation email to this address."
      >
        <Input id="formEmail" type="email" placeholder="john.doe@example.com" />
      </FormField>
      <FormField
        label="Phone Number"
        htmlFor="phone"
        hint="Optional. Used for two-factor authentication."
      >
        <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
      </FormField>
      <FormField
        label="Password"
        htmlFor="formPassword"
        required
        error="Password is too weak. Add numbers and symbols."
      >
        <Input id="formPassword" type="password" placeholder="Create a strong password" error />
      </FormField>
      <FormActions>
        <Button variant="default">Cancel</Button>
        <Button variant="primary">Create Account</Button>
      </FormActions>
    </Form>
  ),
};
