import type { Meta, StoryObj } from '@storybook/react';
import { Link } from './Link';
import { Card } from '../Card';

const meta: Meta<typeof Link> = {
  title: 'Components/Link',
  component: Link,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Link is used to navigate to other pages or external resources. It provides consistent styling and behavior for all navigation elements.

### When to use
- For navigation between pages
- For linking to external websites
- For anchor links within a page
- Within text content for inline references

### When NOT to use
- For actions that don't navigate (use Button instead)
- For form submissions (use Button with type="submit")
- For toggling UI elements (use Button with appropriate ARIA)

### Accessibility
- Inherits all native anchor element accessibility
- External links announce "Opens in new window"
- Supports keyboard navigation (Tab to focus, Enter to activate)
- Clear focus indicators
- Proper color contrast for all variants

### Related components
- **Button**: For actions that don't navigate
- **Breadcrumb**: For hierarchical navigation
- **Navigation**: For site-wide navigation patterns
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'subtle', 'inline'],
      description: 'Visual style of the link',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size of the link text',
    },
    external: {
      control: 'boolean',
      description: 'Shows external icon and opens in new tab',
    },
    active: {
      control: 'boolean',
      description: 'Indicates current/active page',
    },
    href: {
      control: 'text',
      description: 'URL to navigate to',
    },
    children: {
      control: 'text',
      description: 'Link text content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LinkUsage: Story = {
  args: {
    href: '#',
    children: 'Click me',
    variant: 'primary',
  },
};

export const Examples: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-large20)' }}>
      {/* Variants */}
      <section>
        <h3 style={{ marginBottom: 'var(--spacing-large10)' }}>Link Variants</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing)' }}>
          <div>
            <Link href="#" variant="primary">Primary link - for main navigation</Link>
          </div>
          <div>
            <Link href="#" variant="subtle">Subtle link - for secondary actions</Link>
          </div>
          <div>
            <p style={{ margin: 0 }}>
              This paragraph contains an <Link href="#" variant="inline">inline link</Link> that flows with the text.
            </p>
          </div>
        </div>
      </section>

      {/* Sizes */}
      <section>
        <h3 style={{ marginBottom: 'var(--spacing-large10)' }}>Link Sizes</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing)', alignItems: 'flex-start' }}>
          <Link href="#" size="small">Small link text</Link>
          <Link href="#" size="medium">Medium link text (default)</Link>
          <Link href="#" size="large">Large link text</Link>
        </div>
      </section>

      {/* External Links */}
      <section>
        <h3 style={{ marginBottom: 'var(--spacing-large10)' }}>External Links</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing)' }}>
          <Link href="https://www.example.com" external>
            Visit external website
          </Link>
          <Link href="https://docs.example.com" external variant="subtle">
            Read documentation
          </Link>
          <p style={{ margin: 0 }}>
            Learn more in our <Link href="https://blog.example.com" external variant="inline">blog post</Link> about this feature.
          </p>
        </div>
      </section>

      {/* Navigation Examples */}
      <section>
        <h3 style={{ marginBottom: 'var(--spacing-large10)' }}>Navigation Patterns</h3>
        
        {/* Breadcrumb */}
        <div style={{ marginBottom: 'var(--spacing-large10)' }}>
          <nav aria-label="Breadcrumb">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-small10)' }}>
              <Link href="#" variant="subtle" size="small">Home</Link>
              <span style={{ color: 'var(--color-text-secondary)' }}>/</span>
              <Link href="#" variant="subtle" size="small">Products</Link>
              <span style={{ color: 'var(--color-text-secondary)' }}>/</span>
              <Link href="#" variant="subtle" size="small" active>Widgets</Link>
            </div>
          </nav>
        </div>

        {/* Side Navigation */}
        <div style={{ maxWidth: '200px' }}>
          <nav aria-label="Main navigation">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-small20)' }}>
              <Link href="#" variant="subtle">Dashboard</Link>
              <Link href="#" variant="subtle" active>Projects</Link>
              <Link href="#" variant="subtle">Team</Link>
              <Link href="#" variant="subtle">Settings</Link>
            </div>
          </nav>
        </div>
      </section>

      {/* In Content */}
      <section>
        <h3 style={{ marginBottom: 'var(--spacing-large10)' }}>Links in Content</h3>
        <Card>
          <div style={{ padding: 'var(--spacing-large10)' }}>
            <h4 style={{ marginTop: 0, marginBottom: 'var(--spacing)' }}>Article Title</h4>
            <p style={{ margin: 0, marginBottom: 'var(--spacing)', lineHeight: 'var(--line-height-large)' }}>
              This article discusses various topics including <Link href="#" variant="inline">machine learning</Link>, 
              {' '}<Link href="#" variant="inline">data science</Link>, and <Link href="#" variant="inline">artificial intelligence</Link>.
              For more information, visit our <Link href="https://docs.example.com" external variant="inline">documentation</Link>.
            </p>
            <Link href="#">Read more →</Link>
          </div>
        </Card>
      </section>

      {/* Link Lists */}
      <section>
        <h3 style={{ marginBottom: 'var(--spacing-large10)' }}>Link Lists</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-large20)' }}>
          <div>
            <h4 style={{ marginTop: 0, marginBottom: 'var(--spacing)' }}>Resources</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: 'var(--spacing-small10)' }}>
                <Link href="#" variant="primary">Getting Started Guide</Link>
              </li>
              <li style={{ marginBottom: 'var(--spacing-small10)' }}>
                <Link href="#" variant="primary">API Reference</Link>
              </li>
              <li style={{ marginBottom: 'var(--spacing-small10)' }}>
                <Link href="#" variant="primary">Video Tutorials</Link>
              </li>
              <li>
                <Link href="https://github.com/example" external variant="primary">
                  GitHub Repository
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ marginTop: 0, marginBottom: 'var(--spacing)' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: 'var(--spacing-small10)' }}>
                <Link href="#" variant="subtle" size="small">Privacy Policy</Link>
              </li>
              <li style={{ marginBottom: 'var(--spacing-small10)' }}>
                <Link href="#" variant="subtle" size="small">Terms of Service</Link>
              </li>
              <li style={{ marginBottom: 'var(--spacing-small10)' }}>
                <Link href="#" variant="subtle" size="small">Cookie Settings</Link>
              </li>
              <li>
                <Link href="#" variant="subtle" size="small">Contact Support</Link>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* States Demo */}
      <section>
        <h3 style={{ marginBottom: 'var(--spacing-large10)' }}>Interactive States</h3>
        <p style={{ margin: 0, marginBottom: 'var(--spacing)', color: 'var(--color-text-secondary)' }}>
          Try hovering, focusing (Tab), and clicking the links below
        </p>
        <div style={{ display: 'flex', gap: 'var(--spacing-large10)', flexWrap: 'wrap' }}>
          <Link href="#">Normal state</Link>
          <Link href="#" active>Active state</Link>
          <Link href="https://visited-example.com">Visited state</Link>
          <Link href="#" external>External link</Link>
        </div>
      </section>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'This page demonstrates various Link component patterns and use cases. Links provide navigation between pages and to external resources with consistent styling.',
      },
    },
  },
};