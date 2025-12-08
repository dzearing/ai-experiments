import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from './Toast';
import { Button } from '../Button';
import React from 'react';

const meta: Meta<typeof Toast> = {
  title: 'Components/Toast',
  component: Toast,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const ToastUsage: Story = {
  args: {
    message: 'This is a toast notification',
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Toast 
        variant="info" 
        message="This is an informational message" 
      />
      <Toast 
        variant="success" 
        message="Your changes have been saved successfully" 
      />
      <Toast 
        variant="warning" 
        message="Please review your input before continuing" 
      />
      <Toast 
        variant="error" 
        message="An error occurred while processing your request" 
      />
    </div>
  ),
};

export const WithTitles: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Toast 
        variant="info" 
        title="Information"
        message="This is an informational message with more details" 
      />
      <Toast 
        variant="success" 
        title="Success!"
        message="Your profile has been updated successfully" 
      />
      <Toast 
        variant="warning" 
        title="Warning"
        message="Your session will expire in 5 minutes" 
      />
      <Toast 
        variant="error" 
        title="Error"
        message="Failed to save changes. Please try again." 
      />
    </div>
  ),
};

export const NonClosable: Story = {
  render: () => (
    <Toast 
      variant="info" 
      title="System Update"
      message="The system will undergo maintenance at midnight"
      closable={false}
    />
  ),
};

export const LongContent: Story = {
  render: () => (
    <Toast 
      variant="warning" 
      title="Important Notice"
      message="This is a longer message that provides more detailed information about the warning. It may span multiple lines to ensure all necessary information is communicated to the user."
    />
  ),
};

export const Interactive: Story = {
  render: () => {
    const [showToast, setShowToast] = React.useState(true);
    
    return (
      <div>
        {showToast ? (
          <Toast 
            variant="success" 
            title="File Uploaded"
            message="Your file has been uploaded successfully"
            onClose={() => setShowToast(false)}
          />
        ) : (
          <Button onClick={() => setShowToast(true)}>
            Show Toast
          </Button>
        )}
      </div>
    );
  },
};