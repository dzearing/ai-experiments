import type { Meta, StoryObj } from '@storybook/react';
import { Grid } from './Grid';

const meta: Meta<typeof Grid> = {
  title: 'Layout/Grid',
  component: Grid,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
CSS Grid layout container for creating responsive, multi-column layouts.

## When to Use

- Product catalogs or image galleries with equal-width items
- Dashboard layouts with metric cards or statistics
- Form layouts with multiple input fields per row
- Team member directories or contact lists
- Any content requiring responsive grid arrangement

## Variants

| Mode | Use Case |
|------|----------|
| \`auto\` columns | Responsive grid that fits as many columns as possible based on \`minColumnWidth\` |
| Fixed columns | Explicit number of columns (e.g., \`columns={3}\`) |

## Column Behavior

- **auto** (default): Automatically fits columns using \`repeat(auto-fill, minmax(minColumnWidth, 1fr))\`
- **Fixed number**: Creates exact number of columns (e.g., \`columns={4}\`)
- **minColumnWidth**: Controls minimum width of auto columns (default: 200px)

## Accessibility

- Uses semantic CSS Grid without affecting DOM structure
- Maintains logical reading order for screen readers
- Grid gap provides visual separation without extra elements
- Responsive behavior works with browser zoom and text scaling

## Usage

\`\`\`tsx
import { Grid } from '@ui-kit/react';

// Auto-responsive grid
<Grid columns="auto" minColumnWidth="250px" gap="md">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>

// Fixed 3-column grid
<Grid columns={3} gap="lg">
  <Card>Column 1</Card>
  <Card>Column 2</Card>
  <Card>Column 3</Card>
</Grid>

// Custom alignment
<Grid columns={2} gap="md" align="center" justify="stretch">
  <div>Content</div>
</Grid>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    columns: {
      control: 'number',
    },
    gap: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'],
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'stretch'],
    },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'stretch'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const Box = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: '16px', background: 'var(--controlPrimary-bg)', color: 'white', borderRadius: '4px', textAlign: 'center' }}>
    {children}
  </div>
);

export const AutoColumns: Story = {
  args: {
    columns: 'auto',
    minColumnWidth: '150px',
    gap: 'md',
    children: (
      <>
        {Array.from({ length: 8 }).map((_, i) => (
          <Box key={i}>Item {i + 1}</Box>
        ))}
      </>
    ),
  },
};

export const FixedColumns: Story = {
  args: {
    columns: 3,
    gap: 'md',
    children: (
      <>
        {Array.from({ length: 6 }).map((_, i) => (
          <Box key={i}>Item {i + 1}</Box>
        ))}
      </>
    ),
  },
};

export const TwoColumns: Story = {
  args: {
    columns: 2,
    gap: 'lg',
    children: (
      <>
        <Box>Left</Box>
        <Box>Right</Box>
        <Box>Left</Box>
        <Box>Right</Box>
      </>
    ),
  },
};

export const FourColumns: Story = {
  args: {
    columns: 4,
    gap: 'sm',
    children: (
      <>
        {Array.from({ length: 8 }).map((_, i) => (
          <Box key={i}>{i + 1}</Box>
        ))}
      </>
    ),
  },
};

export const ResponsiveCards: Story = {
  args: {
    columns: 'auto',
    minColumnWidth: '250px',
    gap: 'lg',
    children: (
      <>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ padding: '24px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px' }}>
            <h3>Card {i + 1}</h3>
            <p style={{ color: 'var(--page-text-soft)', marginTop: '8px' }}>
              This is a responsive card that will adjust based on container width.
            </p>
          </div>
        ))}
      </>
    ),
  },
};

// Real-world examples

export const ProductGrid: Story = {
  render: () => (
    <Grid columns="auto" minColumnWidth="200px" gap="lg">
      {[
        { name: 'Wireless Headphones', price: '$199', image: 'var(--info-bg)' },
        { name: 'Smart Watch', price: '$299', image: 'var(--success-bg)' },
        { name: 'Laptop Stand', price: '$79', image: 'var(--warning-bg)' },
        { name: 'USB-C Hub', price: '$49', image: 'var(--danger-bg)' },
        { name: 'Webcam HD', price: '$129', image: 'var(--info-bg)' },
        { name: 'Keyboard', price: '$149', image: 'var(--success-bg)' },
      ].map((product, i) => (
        <div key={i} style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <div style={{ height: '120px', background: product.image }} />
          <div style={{ padding: '16px' }}>
            <div style={{ fontWeight: 500 }}>{product.name}</div>
            <div style={{ color: 'var(--controlPrimary-bg)', fontWeight: 600, marginTop: '8px' }}>
              {product.price}
            </div>
          </div>
        </div>
      ))}
    </Grid>
  ),
};

export const ImageGallery: Story = {
  render: () => (
    <Grid columns="auto" minColumnWidth="150px" gap="sm">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            aspectRatio: '1',
            background: `hsl(${i * 30}, 60%, 50%)`,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
          }}
        >
          {i + 1}
        </div>
      ))}
    </Grid>
  ),
};

export const DashboardLayout: Story = {
  render: () => (
    <Grid columns={3} gap="md">
      {/* Main stats row */}
      {[
        { label: 'Total Users', value: '12,345', change: '+12%', color: 'var(--success-icon)' },
        { label: 'Revenue', value: '$45,678', change: '+8%', color: 'var(--info-icon)' },
        { label: 'Conversion', value: '3.2%', change: '-2%', color: 'var(--danger-icon)' },
      ].map((stat, i) => (
        <div key={i} style={{
          padding: '20px',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ color: 'var(--page-text-soft)', fontSize: '13px' }}>{stat.label}</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{stat.value}</div>
          <div style={{ color: stat.color, fontSize: '13px', marginTop: '4px' }}>{stat.change}</div>
        </div>
      ))}
    </Grid>
  ),
};

export const TeamMembers: Story = {
  render: () => (
    <Grid columns="auto" minColumnWidth="160px" gap="md">
      {[
        { name: 'Alice', role: 'Designer', initials: 'AL' },
        { name: 'Bob', role: 'Developer', initials: 'BO' },
        { name: 'Carol', role: 'PM', initials: 'CA' },
        { name: 'David', role: 'Developer', initials: 'DA' },
        { name: 'Eve', role: 'QA', initials: 'EV' },
        { name: 'Frank', role: 'DevOps', initials: 'FR' },
      ].map((member, i) => (
        <div key={i} style={{
          padding: '20px',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--controlPrimary-bg)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            fontWeight: 600,
          }}>
            {member.initials}
          </div>
          <div style={{ fontWeight: 500 }}>{member.name}</div>
          <div style={{ color: 'var(--page-text-soft)', fontSize: '13px' }}>{member.role}</div>
        </div>
      ))}
    </Grid>
  ),
};

export const FormLayout: Story = {
  render: () => (
    <div style={{ maxWidth: '600px' }}>
      <Grid columns={2} gap="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontWeight: 500 }}>First Name</label>
          <input
            type="text"
            placeholder="John"
            style={{
              padding: '10px 12px',
              border: '1px solid var(--inset-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--inset-bg)',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontWeight: 500 }}>Last Name</label>
          <input
            type="text"
            placeholder="Doe"
            style={{
              padding: '10px 12px',
              border: '1px solid var(--inset-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--inset-bg)',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
          <label style={{ fontWeight: 500 }}>Email</label>
          <input
            type="email"
            placeholder="john.doe@example.com"
            style={{
              padding: '10px 12px',
              border: '1px solid var(--inset-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--inset-bg)',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontWeight: 500 }}>City</label>
          <input
            type="text"
            placeholder="New York"
            style={{
              padding: '10px 12px',
              border: '1px solid var(--inset-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--inset-bg)',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontWeight: 500 }}>ZIP Code</label>
          <input
            type="text"
            placeholder="10001"
            style={{
              padding: '10px 12px',
              border: '1px solid var(--inset-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--inset-bg)',
            }}
          />
        </div>
      </Grid>
    </div>
  ),
};
