import type { Meta, StoryObj } from '@storybook/react';
import { LinkButton } from './LinkButton';

// Simple icon components for stories
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ExternalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 3H3v10h10v-3M9 3h4v4M13 3L7 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const meta: Meta<typeof LinkButton> = {
  title: 'Actions/LinkButton',
  component: LinkButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
DEPRECATED: Anchor element styled as a button. Use Button with as="a" instead.

## When to Use

**This component is deprecated.** Use \`<Button as="a" href="...">\` instead for all new code.

## Migration Guide

\`\`\`tsx
// ❌ Old way (deprecated)
import { LinkButton } from '@ui-kit/react';

<LinkButton href="/dashboard" variant="primary">
  Go to Dashboard
</LinkButton>

// ✅ New way (recommended)
import { Button } from '@ui-kit/react';

<Button as="a" href="/dashboard" variant="primary">
  Go to Dashboard
</Button>
\`\`\`

## Why Migrate

- **Consistency**: Single Button component for both buttons and links
- **Bundle size**: Fewer components to ship and maintain
- **Type safety**: Better TypeScript support with discriminated unions
- **Maintenance**: One component API to learn and document

## Variants

All Button variants work when used as a link (primary, default, danger, ghost, outline).

## Sizes

- **sm** (28px): Compact inline links
- **md** (36px): Default size
- **lg** (44px): Prominent navigation links

## Accessibility

- Renders semantic \`<a>\` element with href
- Supports all standard anchor attributes (target, rel, etc.)
- Focus visible indicator for keyboard navigation
- Button styling does not affect link semantics

## Usage

\`\`\`tsx
// Migration: Replace LinkButton with Button as="a"
import { Button } from '@ui-kit/react';

<Button as="a" href="/page" variant="primary">
  Navigate
</Button>

<Button as="a" href="https://external.com" target="_blank" rel="noopener">
  External Link
</Button>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'danger', 'ghost', 'outline'],
      description: 'Visual style variant',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    fullWidth: {
      control: 'boolean',
      description: 'Expand to fill container width',
    },
    href: {
      control: 'text',
      description: 'Link destination URL',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Link Button',
    href: '#',
    variant: 'default',
    size: 'md',
  },
};

export const DeprecationNotice: Story = {
  render: () => (
    <div style={{
      maxWidth: '600px',
      padding: '24px',
      background: 'var(--warning-bg)',
      border: '1px solid var(--warning-border)',
      borderRadius: '8px',
      color: 'var(--warning-text)'
    }}>
      <h3 style={{ margin: '0 0 12px 0' }}>⚠️ Deprecated Component</h3>
      <p style={{ margin: '0 0 16px 0' }}>
        LinkButton is deprecated. Use <code>Button as="a"</code> instead:
      </p>
      <pre style={{
        background: 'var(--inset-bg)',
        color: 'var(--inset-text)',
        padding: '12px',
        borderRadius: '4px',
        overflow: 'auto',
        margin: '0 0 16px 0'
      }}>
{`// Instead of this:
<LinkButton href="/page">Click</LinkButton>

// Use this:
<Button as="a" href="/page">Click</Button>`}
      </pre>
      <p style={{ margin: 0, fontSize: '14px' }}>
        See the component description above for the full migration guide.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'This component is deprecated. Please migrate to Button with as="a".',
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <LinkButton href="#" variant="default">Default</LinkButton>
      <LinkButton href="#" variant="primary">Primary</LinkButton>
      <LinkButton href="#" variant="danger">Danger</LinkButton>
      <LinkButton href="#" variant="ghost">Ghost</LinkButton>
      <LinkButton href="#" variant="outline">Outline</LinkButton>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <LinkButton href="#" size="sm">Small</LinkButton>
      <LinkButton href="#" size="md">Medium</LinkButton>
      <LinkButton href="#" size="lg">Large</LinkButton>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
      <LinkButton href="#" variant="primary" icon={<ArrowRightIcon />}>
        Continue
      </LinkButton>
      <LinkButton href="#" variant="default" iconAfter={<ExternalIcon />}>
        Open in new tab
      </LinkButton>
      <LinkButton href="#" variant="outline" icon={<ArrowRightIcon />} iconAfter={<ExternalIcon />}>
        Both icons
      </LinkButton>
    </div>
  ),
};

export const FullWidth: Story = {
  args: {
    children: 'Full Width Link',
    href: '#',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export const ExternalLinks: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
      <LinkButton
        href="https://example.com"
        target="_blank"
        rel="noopener noreferrer"
        iconAfter={<ExternalIcon />}
      >
        Open in new tab
      </LinkButton>

      <LinkButton
        href="https://example.com"
        target="_blank"
        rel="noopener noreferrer"
        variant="primary"
      >
        External link (primary)
      </LinkButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use target="_blank" with rel="noopener noreferrer" for external links. Consider adding an external icon for clarity.',
      },
    },
  },
};

export const AsNavigationLinks: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <LinkButton href="#home" variant="ghost" size="sm">Home</LinkButton>
      <LinkButton href="#about" variant="ghost" size="sm">About</LinkButton>
      <LinkButton href="#services" variant="ghost" size="sm">Services</LinkButton>
      <LinkButton href="#contact" variant="ghost" size="sm">Contact</LinkButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'LinkButton can be used for navigation menus with ghost variant for minimal styling.',
      },
    },
  },
};

export const MigrationComparison: Story = {
  render: () => {
    // Note: Importing Button here for comparison
    // In real migration, you'd just replace LinkButton with Button
    const { Button } = require('../Button/Button');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
        <div>
          <h4 style={{ margin: '0 0 12px 0' }}>Old way (LinkButton - deprecated):</h4>
          <LinkButton href="#old" variant="primary" icon={<ArrowRightIcon />}>
            Go to Dashboard
          </LinkButton>
        </div>

        <div>
          <h4 style={{ margin: '0 0 12px 0' }}>New way (Button as="a" - recommended):</h4>
          <Button as="a" href="#new" variant="primary" icon={<ArrowRightIcon />}>
            Go to Dashboard
          </Button>
        </div>

        <p style={{ margin: 0, padding: '16px', background: 'var(--info-bg)', color: 'var(--info-text)', borderRadius: '4px' }}>
          These render identically. The new approach uses the same Button component for both buttons and links, reducing bundle size and API surface.
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of the old (LinkButton) and new (Button as="a") approaches. They render identically.',
      },
    },
  },
};
