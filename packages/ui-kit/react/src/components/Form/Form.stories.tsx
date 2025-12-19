import type { Meta, StoryObj } from '@storybook/react';
import { Form, FormField, FormActions, FormRow } from './Form';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { Dropdown } from '../Dropdown';
import { Checkbox } from '../Checkbox';
import { Button } from '../Button';

const meta: Meta<typeof Form> = {
  title: 'Layout/Form',
  component: Form,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Layout system for building accessible, well-structured forms with consistent spacing and validation.

## When to Use

- User registration and login forms
- Settings and preferences pages
- Data entry and submission forms
- Multi-step wizards with multiple fields
- Contact and feedback forms

## Variants

| Component | Use Case |
|-----------|----------|
| \`Form\` | Container with consistent vertical spacing between fields |
| \`FormField\` | Wrapper for individual inputs with label, hint, and error display |
| \`FormRow\` | Horizontal layout for placing multiple fields side-by-side |
| \`FormActions\` | Container for form buttons with flexible alignment options |

## FormField States

- **Normal**: Standard field with optional hint text
- **Required**: Shows asterisk indicator for required fields
- **Error**: Displays error message and applies error styling
- **Hint + Error**: Error message replaces hint when present

## Accessibility

- Labels are properly associated with inputs via \`htmlFor\` and \`id\`
- Required fields indicated with visual \`*\` and semantic markup
- Error messages linked to inputs with \`aria-describedby\`
- Logical tab order maintained throughout the form
- Form element provides semantic structure for screen readers

## Usage

\`\`\`tsx
import { Form, FormField, FormRow, FormActions } from '@ui-kit/react';
import { Input, Button } from '@ui-kit/react';

<Form>
  <FormField
    label="Email"
    required
    htmlFor="email"
    hint="We'll never share your email"
  >
    <Input id="email" type="email" />
  </FormField>

  <FormRow>
    <FormField label="First Name" htmlFor="first">
      <Input id="first" />
    </FormField>
    <FormField label="Last Name" htmlFor="last">
      <Input id="last" />
    </FormField>
  </FormRow>

  <FormActions align="end">
    <Button variant="default">Cancel</Button>
    <Button variant="primary">Submit</Button>
  </FormActions>
</Form>
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicForm: Story = {
  render: () => (
    <Form style={{ maxWidth: '400px' }}>
      <FormField label="Email" required htmlFor="email">
        <Input id="email" type="email" placeholder="you@example.com" />
      </FormField>
      <FormField label="Password" required htmlFor="password">
        <Input id="password" type="password" placeholder="Enter password" />
      </FormField>
      <FormActions>
        <Button variant="default">Cancel</Button>
        <Button variant="primary">Sign In</Button>
      </FormActions>
    </Form>
  ),
};

export const WithHintsAndErrors: Story = {
  render: () => (
    <Form style={{ maxWidth: '400px' }}>
      <FormField
        label="Username"
        required
        htmlFor="username"
        hint="Must be 3-20 characters, letters and numbers only"
      >
        <Input id="username" placeholder="johndoe" />
      </FormField>
      <FormField
        label="Email"
        required
        htmlFor="email-error"
        error="This email is already registered"
      >
        <Input id="email-error" type="email" defaultValue="taken@example.com" />
      </FormField>
      <FormField
        label="Bio"
        htmlFor="bio"
        hint="Brief description about yourself"
      >
        <Textarea id="bio" placeholder="Tell us about yourself..." rows={3} />
      </FormField>
      <FormActions>
        <Button variant="primary">Save Profile</Button>
      </FormActions>
    </Form>
  ),
};

export const TwoColumnLayout: Story = {
  render: () => (
    <Form style={{ maxWidth: '600px' }}>
      <FormRow>
        <FormField label="First Name" required htmlFor="firstName">
          <Input id="firstName" placeholder="John" />
        </FormField>
        <FormField label="Last Name" required htmlFor="lastName">
          <Input id="lastName" placeholder="Doe" />
        </FormField>
      </FormRow>
      <FormField label="Email" required htmlFor="email2">
        <Input id="email2" type="email" placeholder="john.doe@example.com" />
      </FormField>
      <FormRow>
        <FormField label="City" htmlFor="city">
          <Input id="city" placeholder="New York" />
        </FormField>
        <FormField label="ZIP Code" htmlFor="zip">
          <Input id="zip" placeholder="10001" />
        </FormField>
      </FormRow>
      <FormActions>
        <Button variant="default">Cancel</Button>
        <Button variant="primary">Submit</Button>
      </FormActions>
    </Form>
  ),
};

export const RegistrationForm: Story = {
  render: () => (
    <Form style={{ maxWidth: '450px' }}>
      <FormField label="Full Name" required htmlFor="fullName">
        <Input id="fullName" placeholder="Enter your full name" />
      </FormField>
      <FormField
        label="Email Address"
        required
        htmlFor="regEmail"
        hint="We'll never share your email"
      >
        <Input id="regEmail" type="email" placeholder="you@example.com" />
      </FormField>
      <FormField
        label="Password"
        required
        htmlFor="regPassword"
        hint="At least 8 characters with a number"
      >
        <Input id="regPassword" type="password" placeholder="Create a password" />
      </FormField>
      <FormField label="Confirm Password" required htmlFor="confirmPassword">
        <Input id="confirmPassword" type="password" placeholder="Confirm your password" />
      </FormField>
      <FormField label="Country" htmlFor="country">
        <Dropdown
          id="country"
          placeholder="Select a country"
          searchable
          options={[
            { value: 'us', label: 'United States' },
            { value: 'uk', label: 'United Kingdom' },
            { value: 'ca', label: 'Canada' },
            { value: 'au', label: 'Australia' },
            { value: 'de', label: 'Germany' },
            { value: 'fr', label: 'France' },
            { value: 'jp', label: 'Japan' },
          ]}
          fullWidth
        />
      </FormField>
      <FormField htmlFor="terms">
        <Checkbox id="terms">
          I agree to the Terms of Service and Privacy Policy
        </Checkbox>
      </FormField>
      <FormActions>
        <Button variant="primary" fullWidth>Create Account</Button>
      </FormActions>
    </Form>
  ),
};

export const ContactForm: Story = {
  render: () => (
    <Form style={{ maxWidth: '500px' }}>
      <FormRow>
        <FormField label="First Name" required htmlFor="contactFirst">
          <Input id="contactFirst" placeholder="First name" />
        </FormField>
        <FormField label="Last Name" required htmlFor="contactLast">
          <Input id="contactLast" placeholder="Last name" />
        </FormField>
      </FormRow>
      <FormField label="Email" required htmlFor="contactEmail">
        <Input id="contactEmail" type="email" placeholder="your@email.com" />
      </FormField>
      <FormField label="Subject" htmlFor="subject">
        <Dropdown
          id="subject"
          placeholder="Select a subject"
          options={[
            { value: 'general', label: 'General Inquiry' },
            { value: 'support', label: 'Technical Support' },
            { value: 'billing', label: 'Billing Question' },
            { value: 'feedback', label: 'Feedback' },
          ]}
          fullWidth
        />
      </FormField>
      <FormField
        label="Message"
        required
        htmlFor="message"
        hint="Please be as detailed as possible"
      >
        <Textarea id="message" placeholder="How can we help you?" rows={5} />
      </FormField>
      <FormActions align="between">
        <Button variant="ghost">Clear Form</Button>
        <Button variant="primary">Send Message</Button>
      </FormActions>
    </Form>
  ),
};

export const SettingsForm: Story = {
  render: () => (
    <Form style={{ maxWidth: '500px' }}>
      <FormField
        label="Display Name"
        htmlFor="displayName"
        hint="This is how others will see you"
      >
        <Input id="displayName" defaultValue="John Doe" />
      </FormField>
      <FormField label="Email" htmlFor="settingsEmail">
        <Input id="settingsEmail" type="email" defaultValue="john@example.com" />
      </FormField>
      <FormField label="Timezone" htmlFor="timezone">
        <Dropdown
          id="timezone"
          defaultValue="est"
          options={[
            { value: 'pst', label: 'Pacific Time (PT)' },
            { value: 'mst', label: 'Mountain Time (MT)' },
            { value: 'cst', label: 'Central Time (CT)' },
            { value: 'est', label: 'Eastern Time (ET)' },
            { value: 'utc', label: 'UTC' },
          ]}
          fullWidth
        />
      </FormField>
      <FormField label="Notifications" htmlFor="notifications">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Checkbox id="email-notifs" defaultChecked>Email notifications</Checkbox>
          <Checkbox id="push-notifs" defaultChecked>Push notifications</Checkbox>
          <Checkbox id="sms-notifs">SMS notifications</Checkbox>
        </div>
      </FormField>
      <FormActions>
        <Button variant="ghost">Reset to Defaults</Button>
        <Button variant="primary">Save Settings</Button>
      </FormActions>
    </Form>
  ),
};
