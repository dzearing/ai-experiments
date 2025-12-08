import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from './Stack';
import { Button } from '../Button';
import { Card } from '../Card';
import { Input } from '../Input';
import { Link } from '../Link';
import { Checkbox } from '../Checkbox';

const meta: Meta<typeof Stack> = {
  title: 'Components/Stack',
  component: Stack,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Stack is a layout component that arranges its children vertically or horizontally with consistent spacing.

### When to use
- To create consistent spacing between elements
- For form layouts with multiple fields
- For button groups or navigation items
- To build card layouts or lists
- Any time you need consistent spacing between items

### When NOT to use
- For complex grid layouts (use Grid component)
- When items need different spacing between them
- For centering a single item (use CSS flexbox directly)

### Accessibility
- Stack is a layout primitive with no semantic meaning
- Use appropriate semantic HTML with the 'as' prop when needed
- Ensure proper heading hierarchy when stacking content sections

### Related components
- **Grid**: For two-dimensional layouts
- **Card**: Often used with Stack for content organization
- **Spacer**: For adding flexible space between items
        `,
      },
    },
  },
  argTypes: {
    direction: {
      control: 'select',
      options: ['vertical', 'horizontal'],
      description: 'Direction of the stack',
    },
    gap: {
      control: 'select',
      options: ['none', 'small', 'medium', 'large', 'xlarge'],
      description: 'Gap between items',
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'stretch'],
      description: 'Alignment along the cross axis',
    },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'],
      description: 'Alignment along the main axis',
    },
    wrap: {
      control: 'boolean',
      description: 'Whether items should wrap',
    },
    as: {
      control: 'select',
      options: ['div', 'section', 'article', 'nav', 'aside', 'header', 'footer', 'main'],
      description: 'HTML element to render',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const StackUsage: Story = {
  args: {
    direction: 'vertical',
    gap: 'medium',
    children: (
      <>
        <div style={{ background: 'var(--color-panel-background)', padding: 'var(--spacing)', border: '1px solid var(--color-panel-border)' }}>Item 1</div>
        <div style={{ background: 'var(--color-panel-background)', padding: 'var(--spacing)', border: '1px solid var(--color-panel-border)' }}>Item 2</div>
        <div style={{ background: 'var(--color-panel-background)', padding: 'var(--spacing)', border: '1px solid var(--color-panel-border)' }}>Item 3</div>
      </>
    ),
  },
};

export const Examples: Story = {
  render: () => (
    <Stack gap="xlarge">
      {/* Form Layout */}
      <section>
        <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-large10)' }}>Form Layout</h3>
        <Card style={{ maxWidth: '400px' }}>
          <Stack gap="medium" style={{ padding: 'var(--spacing-large10)' }}>
            <Stack gap="small">
              <label htmlFor="name" style={{ fontWeight: 'var(--font-weight-medium)' }}>Name</label>
              <Input id="name" placeholder="Enter your name" />
            </Stack>
            
            <Stack gap="small">
              <label htmlFor="email" style={{ fontWeight: 'var(--font-weight-medium)' }}>Email</label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </Stack>
            
            <Stack gap="small">
              <label htmlFor="message" style={{ fontWeight: 'var(--font-weight-medium)' }}>Message</label>
              <textarea 
                id="message" 
                placeholder="Enter your message"
                rows={4}
                style={{
                  padding: 'var(--spacing-small10)',
                  border: '1px solid var(--color-input-border)',
                  borderRadius: 'var(--radius-small10)',
                  fontSize: 'var(--font-size-normal)',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </Stack>
            
            <Checkbox>I agree to the terms and conditions</Checkbox>
            
            <Stack direction="horizontal" gap="small" justify="end">
              <Button variant="neutral">Cancel</Button>
              <Button>Submit</Button>
            </Stack>
          </Stack>
        </Card>
      </section>

      {/* Button Groups */}
      <section>
        <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-large10)' }}>Button Groups</h3>
        <Stack gap="large">
          <div>
            <h4 style={{ marginTop: 0, marginBottom: 'var(--spacing)' }}>Horizontal Button Group</h4>
            <Stack direction="horizontal" gap="small">
              <Button variant="primary">Save</Button>
              <Button variant="neutral">Save as Draft</Button>
              <Button variant="danger">Delete</Button>
            </Stack>
          </div>
          
          <div>
            <h4 style={{ marginTop: 0, marginBottom: 'var(--spacing)' }}>Centered Actions</h4>
            <Stack direction="horizontal" gap="medium" justify="center">
              <Button size="large">Get Started</Button>
              <Button size="large" variant="neutral">Learn More</Button>
            </Stack>
          </div>
          
          <div>
            <h4 style={{ marginTop: 0, marginBottom: 'var(--spacing)' }}>Space Between</h4>
            <Stack direction="horizontal" justify="space-between">
              <Button variant="neutral">Back</Button>
              <Stack direction="horizontal" gap="small">
                <Button variant="neutral">Save Draft</Button>
                <Button>Continue</Button>
              </Stack>
            </Stack>
          </div>
        </Stack>
      </section>

      {/* Card List */}
      <section>
        <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-large10)' }}>Card List</h3>
        <Stack gap="medium">
          <Card>
            <Stack gap="small" style={{ padding: 'var(--spacing-large10)' }}>
              <h4 style={{ margin: 0 }}>Project Alpha</h4>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                A comprehensive redesign of our main application
              </p>
              <Stack direction="horizontal" gap="medium">
                <Link href="#" size="small">View Details</Link>
                <Link href="#" size="small" variant="subtle">Edit</Link>
              </Stack>
            </Stack>
          </Card>
          
          <Card>
            <Stack gap="small" style={{ padding: 'var(--spacing-large10)' }}>
              <h4 style={{ margin: 0 }}>Project Beta</h4>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                Performance optimization and infrastructure updates
              </p>
              <Stack direction="horizontal" gap="medium">
                <Link href="#" size="small">View Details</Link>
                <Link href="#" size="small" variant="subtle">Edit</Link>
              </Stack>
            </Stack>
          </Card>
          
          <Card>
            <Stack gap="small" style={{ padding: 'var(--spacing-large10)' }}>
              <h4 style={{ margin: 0 }}>Project Gamma</h4>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                New feature development for Q2 release
              </p>
              <Stack direction="horizontal" gap="medium">
                <Link href="#" size="small">View Details</Link>
                <Link href="#" size="small" variant="subtle">Edit</Link>
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </section>

      {/* Navigation */}
      <section>
        <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-large10)' }}>Navigation Patterns</h3>
        <Stack gap="large">
          <div>
            <h4 style={{ marginTop: 0, marginBottom: 'var(--spacing)' }}>Horizontal Navigation</h4>
            <Stack as="nav" direction="horizontal" gap="large">
              <Link href="#" variant="subtle">Home</Link>
              <Link href="#" variant="subtle" active>Products</Link>
              <Link href="#" variant="subtle">About</Link>
              <Link href="#" variant="subtle">Contact</Link>
            </Stack>
          </div>
          
          <div>
            <h4 style={{ marginTop: 0, marginBottom: 'var(--spacing)' }}>Vertical Navigation</h4>
            <Stack as="nav" gap="small" style={{ maxWidth: '200px' }}>
              <Link href="#" variant="subtle">Dashboard</Link>
              <Link href="#" variant="subtle" active>Projects</Link>
              <Link href="#" variant="subtle">Team</Link>
              <Link href="#" variant="subtle">Settings</Link>
            </Stack>
          </div>
        </Stack>
      </section>

      {/* Responsive Layout */}
      <section>
        <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-large10)' }}>Responsive Layout</h3>
        <Stack direction="horizontal" gap="medium" wrap>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} style={{ flex: '1 1 250px' }}>
              <Stack gap="small" style={{ padding: 'var(--spacing-large10)' }}>
                <h4 style={{ margin: 0 }}>Card {i}</h4>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                  This card will wrap when the container is too narrow
                </p>
                <Button size="small" fullWidth>Action</Button>
              </Stack>
            </Card>
          ))}
        </Stack>
      </section>

      {/* Alignment Examples */}
      <section>
        <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-large10)' }}>Alignment Options</h3>
        <Stack gap="large">
          <div>
            <h4 style={{ marginTop: 0, marginBottom: 'var(--spacing)' }}>Cross-axis Alignment</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-large10)' }}>
              <div>
                <h5 style={{ marginTop: 0, marginBottom: 'var(--spacing-small10)' }}>align="start"</h5>
                <div style={{ background: 'var(--color-panel-background)', padding: 'var(--spacing)', height: '150px' }}>
                  <Stack direction="horizontal" align="start" gap="small" style={{ height: '100%' }}>
                    <Button size="small">Button</Button>
                    <Button size="medium">Button</Button>
                    <Button size="large">Button</Button>
                  </Stack>
                </div>
              </div>
              
              <div>
                <h5 style={{ marginTop: 0, marginBottom: 'var(--spacing-small10)' }}>align="center"</h5>
                <div style={{ background: 'var(--color-panel-background)', padding: 'var(--spacing)', height: '150px' }}>
                  <Stack direction="horizontal" align="center" gap="small" style={{ height: '100%' }}>
                    <Button size="small">Button</Button>
                    <Button size="medium">Button</Button>
                    <Button size="large">Button</Button>
                  </Stack>
                </div>
              </div>
              
              <div>
                <h5 style={{ marginTop: 0, marginBottom: 'var(--spacing-small10)' }}>align="end"</h5>
                <div style={{ background: 'var(--color-panel-background)', padding: 'var(--spacing)', height: '150px' }}>
                  <Stack direction="horizontal" align="end" gap="small" style={{ height: '100%' }}>
                    <Button size="small">Button</Button>
                    <Button size="medium">Button</Button>
                    <Button size="large">Button</Button>
                  </Stack>
                </div>
              </div>
            </div>
          </div>
        </Stack>
      </section>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Stack is a fundamental layout component for consistent spacing. Use it to build forms, lists, navigation, and any layout that needs regular spacing between items.',
      },
    },
  },
};