import type { Meta, StoryObj } from '@storybook/react';
import { Dialog } from './Dialog';
import { Button } from '../Button';
import { Input } from '../Input';
import { Spinner } from '../Spinner';
import { Stack } from '../Stack';
import React from 'react';

const meta: Meta<typeof Dialog> = {
  title: 'Components/Dialog',
  component: Dialog,
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
type Story = StoryObj<typeof Dialog>;

export const DialogUsage: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="Dialog Title"
          description="This is a dialog description that provides context."
          actions={
            <>
              <Button variant="neutral" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Confirm
              </Button>
            </>
          }
        >
          <p>Dialog content goes here. You can put any content inside the dialog.</p>
        </Dialog>
      </>
    );
  },
};

export const Sizes: Story = {
  render: () => {
    const [smallOpen, setSmallOpen] = React.useState(false);
    const [mediumOpen, setMediumOpen] = React.useState(false);
    const [largeOpen, setLargeOpen] = React.useState(false);
    
    return (
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Button onClick={() => setSmallOpen(true)}>Small Dialog</Button>
        <Button onClick={() => setMediumOpen(true)}>Medium Dialog</Button>
        <Button onClick={() => setLargeOpen(true)}>Large Dialog</Button>
        
        <Dialog
          open={smallOpen}
          onClose={() => setSmallOpen(false)}
          title="Small Dialog"
          size="small"
          actions={
            <Button variant="primary" onClick={() => setSmallOpen(false)}>
              Close
            </Button>
          }
        >
          <p>This is a small dialog, perfect for simple confirmations.</p>
        </Dialog>
        
        <Dialog
          open={mediumOpen}
          onClose={() => setMediumOpen(false)}
          title="Medium Dialog"
          size="medium"
          actions={
            <Button variant="primary" onClick={() => setMediumOpen(false)}>
              Close
            </Button>
          }
        >
          <p>This is a medium dialog, the default size for most use cases.</p>
        </Dialog>
        
        <Dialog
          open={largeOpen}
          onClose={() => setLargeOpen(false)}
          title="Large Dialog"
          size="large"
          actions={
            <Button variant="primary" onClick={() => setLargeOpen(false)}>
              Close
            </Button>
          }
        >
          <p>This is a large dialog, suitable for complex forms or detailed content.</p>
        </Dialog>
      </div>
    );
  },
};

export const ConfirmationDialog: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    const [result, setResult] = React.useState<string>('');
    
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>Delete Item</Button>
        {result && <p style={{ marginTop: '1rem' }}>{result}</p>}
        
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="Delete Item?"
          description="This action cannot be undone."
          size="small"
          actions={
            <>
              <Button variant="neutral" onClick={() => {
                setOpen(false);
                setResult('Cancelled');
              }}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => {
                setOpen(false);
                setResult('Deleted!');
              }}>
                Delete
              </Button>
            </>
          }
        >
          <p>Are you sure you want to delete this item? All associated data will be permanently removed.</p>
        </Dialog>
      </>
    );
  },
};

export const FormDialog: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    
    return (
      <>
        <Button onClick={() => setOpen(true)}>Edit Profile</Button>
        
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="Edit Profile"
          actions={
            <>
              <Button variant="neutral" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Save Changes
              </Button>
            </>
          }
        >
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input 
              label="Name"
              defaultValue="John Doe"
              fullWidth
            />
            <Input 
              label="Email"
              type="email"
              defaultValue="john@example.com"
              fullWidth
            />
            <Input 
              label="Bio"
              placeholder="Tell us about yourself"
              fullWidth
            />
          </form>
        </Dialog>
      </>
    );
  },
};

export const NoCloseButton: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="Processing..."
          showCloseButton={false}
        >
          <Stack align="center" gap="large" style={{ padding: 'var(--spacing-large20)' }}>
            <Spinner size="large" />
            <p>Please wait while we process your request...</p>
          </Stack>
        </Dialog>
      </>
    );
  },
};

export const LongContent: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    
    return (
      <>
        <Button onClick={() => setOpen(true)}>Terms of Service</Button>
        
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="Terms of Service"
          actions={
            <>
              <Button variant="neutral" onClick={() => setOpen(false)}>
                Decline
              </Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Accept
              </Button>
            </>
          }
        >
          <div>
            <h3>1. Introduction</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            
            <h3>2. Terms of Use</h3>
            <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            
            <h3>3. Privacy Policy</h3>
            <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
            
            <h3>4. Disclaimers</h3>
            <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            
            <h3>5. Contact Information</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          </div>
        </Dialog>
      </>
    );
  },
};