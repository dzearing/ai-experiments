import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from './Stack';
import { Button } from '../Button';

/**
 * ## Why Stack over plain flexbox?
 *
 * Stack provides a semantic API for flexbox layouts with these advantages:
 *
 * 1. **Semantic props** - `direction="vertical"` is clearer than `flex-direction: column`
 * 2. **Design token integration** - Gap values map to spacing tokens for consistency
 * 3. **Reduced boilerplate** - No need to write `display: flex; flex-direction: column; gap: 16px;`
 * 4. **Consistency** - Teams use the same spacing scale across the entire app
 *
 * ### Comparison
 *
 * ```css
 * // Without Stack
 * .myContainer {
 *   display: flex;
 *   flex-direction: column;
 *   align-items: center;
 *   gap: 16px;
 * }
 * ```
 *
 * ```jsx
 * // With Stack
 * <Stack direction="vertical" align="center" gap="md">
 *   ...
 * </Stack>
 * ```
 */

const meta: Meta<typeof Stack> = {
  title: 'Layout/Stack',
  component: Stack,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Flexbox layout component for consistent spacing and alignment.

## When to Use

- Arranging items vertically or horizontally
- Consistent spacing between elements
- Aligning and distributing content

## Stack vs CSS Flexbox

| Approach | Benefit |
|----------|---------|
| **Stack** | Semantic API, design token spacing |
| **CSS flexbox** | Full control, custom layouts |

## Props

- **as**: HTML element to render (default: \`div\`, e.g., \`section\`, \`nav\`, \`article\`)
- **direction**: \`vertical\` or \`horizontal\`
- **gap**: Spacing between items (xs, sm, md, lg, xl)
- **align**: Cross-axis alignment
- **justify**: Main-axis distribution
- **wrap**: Allow items to wrap to next line
        `,
      },
    },
  },
  argTypes: {
    as: {
      control: 'select',
      options: ['div', 'section', 'article', 'nav', 'aside', 'header', 'footer', 'main'],
      description: 'HTML element to render',
    },
    direction: {
      control: 'select',
      options: ['vertical', 'horizontal'],
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'stretch'],
    },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'between', 'around'],
    },
    gap: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'],
    },
    wrap: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const Box = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: '16px', background: 'var(--controlPrimary-bg)', color: 'white', borderRadius: '4px' }}>
    {children}
  </div>
);

export const Vertical: Story = {
  args: {
    direction: 'vertical',
    gap: 'md',
    children: (
      <>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </>
    ),
  },
};

export const Horizontal: Story = {
  args: {
    direction: 'horizontal',
    gap: 'md',
    children: (
      <>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </>
    ),
  },
};

export const Centered: Story = {
  args: {
    direction: 'horizontal',
    align: 'center',
    justify: 'center',
    gap: 'lg',
    children: (
      <>
        <Box>A</Box>
        <Box>B</Box>
        <Box>C</Box>
      </>
    ),
  },
};

export const SpaceBetween: Story = {
  args: {
    direction: 'horizontal',
    justify: 'between',
    children: (
      <>
        <Box>Left</Box>
        <Box>Center</Box>
        <Box>Right</Box>
      </>
    ),
  },
};

export const GapSizes: Story = {
  render: () => (
    <Stack direction="vertical" gap="lg">
      <Stack direction="horizontal" gap="none">
        <Box>No</Box><Box>Gap</Box>
      </Stack>
      <Stack direction="horizontal" gap="xs">
        <Box>XS</Box><Box>Gap</Box>
      </Stack>
      <Stack direction="horizontal" gap="sm">
        <Box>SM</Box><Box>Gap</Box>
      </Stack>
      <Stack direction="horizontal" gap="md">
        <Box>MD</Box><Box>Gap</Box>
      </Stack>
      <Stack direction="horizontal" gap="lg">
        <Box>LG</Box><Box>Gap</Box>
      </Stack>
      <Stack direction="horizontal" gap="xl">
        <Box>XL</Box><Box>Gap</Box>
      </Stack>
    </Stack>
  ),
};

export const Wrapped: Story = {
  args: {
    direction: 'horizontal',
    wrap: true,
    gap: 'md',
    children: (
      <>
        {Array.from({ length: 10 }).map((_, i) => (
          <Box key={i}>Item {i + 1}</Box>
        ))}
      </>
    ),
  },
};

export const AsSemanticElement: Story = {
  render: () => (
    <Stack as="nav" direction="horizontal" gap="md" aria-label="Main navigation">
      <a href="#home" style={{ color: 'var(--body-link)' }}>Home</a>
      <a href="#about" style={{ color: 'var(--body-link)' }}>About</a>
      <a href="#contact" style={{ color: 'var(--body-link)' }}>Contact</a>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use the `as` prop to render Stack as a semantic element like `nav`, `section`, or `article` for better accessibility and SEO.',
      },
    },
  },
};

// Real-world examples

export const FormActions: Story = {
  render: () => (
    <Stack direction="horizontal" justify="end" gap="sm">
      <Button variant="default">Cancel</Button>
      <Button variant="primary">Save Changes</Button>
    </Stack>
  ),
};

export const CardContent: Story = {
  render: () => (
    <div style={{
      maxWidth: '320px',
      padding: 'var(--space-4)',
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: 'var(--radius-md)',
    }}>
      <Stack direction="vertical" gap="md">
        <div style={{
          height: '120px',
          background: 'linear-gradient(135deg, var(--controlPrimary-bg), var(--info-icon))',
          borderRadius: 'var(--radius-sm)',
        }} />
        <Stack direction="vertical" gap="xs">
          <h3 style={{ margin: 0, fontWeight: 600 }}>Card Title</h3>
          <p style={{ margin: 0, color: 'var(--page-text-soft)', fontSize: '14px' }}>
            This card uses Stack for consistent vertical spacing between elements.
          </p>
        </Stack>
        <Stack direction="horizontal" justify="between" align="center">
          <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>5 min read</span>
          <Button variant="ghost" size="small">Read More</Button>
        </Stack>
      </Stack>
    </div>
  ),
};

export const NavigationHeader: Story = {
  render: () => (
    <div style={{
      padding: 'var(--space-3) var(--space-4)',
      background: 'var(--card-bg)',
      borderBottom: '1px solid var(--card-border)',
    }}>
      <Stack direction="horizontal" justify="between" align="center">
        <Stack direction="horizontal" align="center" gap="md">
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'var(--controlPrimary-bg)',
          }} />
          <span style={{ fontWeight: 600 }}>My App</span>
        </Stack>
        <Stack direction="horizontal" gap="sm">
          <Button variant="ghost" size="small">Docs</Button>
          <Button variant="ghost" size="small">Pricing</Button>
          <Button variant="primary" size="small">Sign In</Button>
        </Stack>
      </Stack>
    </div>
  ),
};

export const SettingsRow: Story = {
  render: () => (
    <div style={{ maxWidth: '400px' }}>
      <Stack direction="vertical" gap="none">
        {[
          { label: 'Email notifications', description: 'Receive email updates' },
          { label: 'Push notifications', description: 'Get push alerts' },
          { label: 'SMS alerts', description: 'Text message notifications' },
        ].map((item, i) => (
          <div key={i} style={{
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: i < 2 ? '1px solid var(--card-border)' : 'none',
          }}>
            <Stack direction="horizontal" justify="between" align="center">
              <Stack direction="vertical" gap="xs">
                <span style={{ fontWeight: 500 }}>{item.label}</span>
                <span style={{ fontSize: '13px', color: 'var(--page-text-soft)' }}>
                  {item.description}
                </span>
              </Stack>
              <input type="checkbox" defaultChecked={i < 2} />
            </Stack>
          </div>
        ))}
      </Stack>
    </div>
  ),
};

export const ProfileSection: Story = {
  render: () => (
    <div style={{ maxWidth: '300px' }}>
      <Stack direction="vertical" align="center" gap="md">
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'var(--controlPrimary-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '28px',
          fontWeight: 600,
        }}>
          JD
        </div>
        <Stack direction="vertical" align="center" gap="xs">
          <span style={{ fontWeight: 600, fontSize: '18px' }}>John Doe</span>
          <span style={{ color: 'var(--page-text-soft)', fontSize: '14px' }}>john@example.com</span>
        </Stack>
        <Stack direction="horizontal" gap="lg">
          <Stack direction="vertical" align="center" gap="xs">
            <span style={{ fontWeight: 700, fontSize: '20px' }}>128</span>
            <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>Posts</span>
          </Stack>
          <Stack direction="vertical" align="center" gap="xs">
            <span style={{ fontWeight: 700, fontSize: '20px' }}>1.4k</span>
            <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>Followers</span>
          </Stack>
          <Stack direction="vertical" align="center" gap="xs">
            <span style={{ fontWeight: 700, fontSize: '20px' }}>256</span>
            <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>Following</span>
          </Stack>
        </Stack>
        <Button variant="primary" style={{ width: '100%' }}>Follow</Button>
      </Stack>
    </div>
  ),
};

export const NotificationList: Story = {
  render: () => (
    <div style={{
      maxWidth: '350px',
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '1px solid var(--card-border)',
        fontWeight: 600,
      }}>
        Notifications
      </div>
      <Stack direction="vertical" gap="none">
        {[
          { icon: '📦', title: 'Order shipped', time: '2m ago', unread: true },
          { icon: '💬', title: 'New comment on your post', time: '1h ago', unread: true },
          { icon: '👋', title: 'Welcome to the platform!', time: '2d ago', unread: false },
        ].map((item, i) => (
          <div key={i} style={{
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: i < 2 ? '1px solid var(--card-border)' : 'none',
            background: item.unread ? 'var(--info-bg)' : 'transparent',
          }}>
            <Stack direction="horizontal" gap="sm" align="start">
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <Stack direction="vertical" gap="xs" style={{ flex: 1 }}>
                <span style={{ fontWeight: item.unread ? 500 : 400 }}>{item.title}</span>
                <span style={{ fontSize: '12px', color: 'var(--page-text-soft)' }}>{item.time}</span>
              </Stack>
              {item.unread && (
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--controlPrimary-bg)',
                }} />
              )}
            </Stack>
          </div>
        ))}
      </Stack>
    </div>
  ),
};
