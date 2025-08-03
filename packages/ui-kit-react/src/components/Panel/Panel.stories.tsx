import type { Meta, StoryObj } from '@storybook/react';
import { Panel } from './Panel';
import { Button } from '../Button';
import { Input } from '../Input';
import { Dropdown } from '../Dropdown';
import React from 'react';

const meta: Meta<typeof Panel> = {
  title: 'Components/Panel',
  component: Panel,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'select',
      options: ['none', 'small', 'medium', 'large'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Panel>;

export const PanelUsage: Story = {
  args: {
    title: 'Panel Title',
    children: (
      <p>This is the panel content. Panels are used to group related content and provide visual hierarchy in your interface.</p>
    ),
  },
};

export const WithActions: Story = {
  args: {
    title: 'User Settings',
    actions: (
      <>
        <Button variant="neutral">Cancel</Button>
        <Button variant="primary">Save</Button>
      </>
    ),
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input label="Username" defaultValue="john.doe" fullWidth />
        <Input label="Email" type="email" defaultValue="john@example.com" fullWidth />
      </div>
    ),
  },
};

export const WithFooter: Story = {
  args: {
    title: 'Order Summary',
    footer: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Total: $129.99</span>
        <Button variant="primary">Checkout</Button>
      </div>
    ),
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Product A</span>
          <span>$49.99</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Product B</span>
          <span>$79.99</span>
        </div>
      </div>
    ),
  },
};

export const Collapsible: Story = {
  render: () => {
    const [collapsed, setCollapsed] = React.useState(false);
    
    return (
      <Panel
        title="Collapsible Panel"
        collapsible
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        actions={
          <span style={{ fontSize: '0.875rem', color: 'var(--color-body-text-soft40)' }}>
            {collapsed ? 'Collapsed' : 'Expanded'}
          </span>
        }
      >
        <p>This panel can be collapsed and expanded by clicking the arrow icon in the header.</p>
        <p>The collapsed state can be controlled programmatically.</p>
      </Panel>
    );
  },
};

export const NoBorder: Story = {
  args: {
    title: 'Borderless Panel',
    bordered: false,
    children: (
      <p>This panel has no border for a more subtle appearance. Use this variant when the panel is placed on a contrasting background.</p>
    ),
  },
};

export const PaddingSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Panel title="No Padding" padding="none">
        <div style={{ padding: '1rem', background: 'var(--color-primary-soft10)' }}>
          Custom padded content
        </div>
      </Panel>
      
      <Panel title="Small Padding" padding="small">
        Small padding content
      </Panel>
      
      <Panel title="Medium Padding (default)" padding="medium">
        Medium padding content
      </Panel>
      
      <Panel title="Large Padding" padding="large">
        Large padding content
      </Panel>
    </div>
  ),
};

export const ComplexForm: Story = {
  render: () => {
    const [country, setCountry] = React.useState('');
    
    return (
      <Panel
        title="Shipping Information"
        actions={
          <Button variant="neutral">Reset</Button>
        }
        footer={
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button variant="neutral">Back</Button>
            <Button variant="primary">Continue to Payment</Button>
          </div>
        }
      >
        <form style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <Input label="First Name" required fullWidth />
          <Input label="Last Name" required fullWidth />
          <div style={{ gridColumn: 'span 2' }}>
            <Input label="Street Address" required fullWidth />
          </div>
          <Input label="City" required fullWidth />
          <Input label="Postal Code" required fullWidth />
          <div style={{ gridColumn: 'span 2' }}>
            <Dropdown
              label="Country"
              required
              fullWidth
              options={[
                { value: 'us', label: 'United States' },
                { value: 'ca', label: 'Canada' },
                { value: 'mx', label: 'Mexico' },
              ]}
              value={country}
              onChange={setCountry}
            />
          </div>
        </form>
      </Panel>
    );
  },
};

export const NestedPanels: Story = {
  render: () => (
    <Panel title="Main Panel" padding="large">
      <p style={{ marginBottom: '1rem' }}>This is the main panel with nested panels inside.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Panel title="Nested Panel 1" padding="small" collapsible defaultCollapsed>
          <p>First nested panel content</p>
        </Panel>
        
        <Panel title="Nested Panel 2" padding="small" collapsible>
          <p>Second nested panel content</p>
        </Panel>
        
        <Panel title="Nested Panel 3" padding="small" collapsible>
          <p>Third nested panel content</p>
        </Panel>
      </div>
    </Panel>
  ),
};

export const Dashboard: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
      <Panel
        title="Revenue"
        actions={
          <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>+12.5%</span>
        }
      >
        <div style={{ fontSize: '2rem', fontWeight: 'var(--font-weight-semibold)' }}>$24,576</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-body-text-soft40)' }}>Last 30 days</div>
      </Panel>
      
      <Panel
        title="Users"
        actions={
          <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>+8.2%</span>
        }
      >
        <div style={{ fontSize: '2rem', fontWeight: 'var(--font-weight-semibold)' }}>1,428</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-body-text-soft40)' }}>Active users</div>
      </Panel>
      
      <Panel
        title="Conversion"
        actions={
          <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>-2.4%</span>
        }
      >
        <div style={{ fontSize: '2rem', fontWeight: 'var(--font-weight-semibold)' }}>3.2%</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-body-text-soft40)' }}>Conversion rate</div>
      </Panel>
    </div>
  ),
};