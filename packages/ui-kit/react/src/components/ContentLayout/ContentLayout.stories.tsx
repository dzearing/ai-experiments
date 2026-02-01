import type { Meta, StoryObj } from '@storybook/react';
import { ContentLayout } from './ContentLayout';
import { PageHeader } from '../PageHeader/PageHeader';
import { Button } from '../Button/Button';
import { TitleBar } from '../TitleBar/TitleBar';

const meta = {
  title: 'Layout/ContentLayout',
  component: ContentLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Page layout wrapper with header, content, and footer slots.

## When to Use

- Standard page structure with consistent padding and max-width
- Pages that need header/footer areas
- Content that should be centered and constrained

## Best Practices

- Use PageHeader component in the header slot
- Choose appropriate maxWidth for content type (forms: md, content: lg, dashboards: xl)
- Adjust padding based on content density

## Usage

\`\`\`jsx
<ContentLayout
  header={<PageHeader title="Dashboard" />}
  maxWidth="lg"
  padding="md"
>
  <YourContent />
</ContentLayout>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ContentLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

// Placeholder content for demos
const DemoContent = ({ minHeight = '400px' }: { minHeight?: string }) => (
  <div
    style={{
      minHeight,
      padding: '24px',
      background: 'var(--soft-bg)',
      borderRadius: '8px',
      border: '1px dashed var(--soft-border)',
    }}
  >
    <h2 style={{ margin: '0 0 16px', color: 'var(--base-fg)' }}>Main Content Area</h2>
    <p style={{ color: 'var(--base-fg-soft)', margin: 0 }}>
      This is where your page content goes. The ContentLayout component
      handles max-width constraints and padding automatically.
    </p>
  </div>
);

const DemoFooter = () => (
  <div
    style={{
      padding: '16px 24px',
      borderTop: '1px solid var(--soft-border)',
      background: 'var(--soft-bg)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <span style={{ color: 'var(--base-fg-soft)', fontSize: '14px' }}>
      2024 Your Company
    </span>
    <div style={{ display: 'flex', gap: '16px' }}>
      <a href="#" style={{ color: 'var(--link-fg)', fontSize: '14px' }}>Privacy</a>
      <a href="#" style={{ color: 'var(--link-fg)', fontSize: '14px' }}>Terms</a>
    </div>
  </div>
);

export const Default: Story = {
  args: {
    children: <DemoContent />,
  },
};

export const WithHeader: Story = {
  args: {
    header: (
      <PageHeader
        title="Dashboard"
        description="Overview of your workspace"
      />
    ),
    children: <DemoContent />,
  },
};

export const WithHeaderAndFooter: Story = {
  args: {
    header: (
      <PageHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Settings' },
        ]}
        title="Account Settings"
        actions={<Button variant="primary">Save</Button>}
      />
    ),
    footer: <DemoFooter />,
    children: <DemoContent />,
  },
};

export const MaxWidthSmall: Story = {
  args: {
    header: <PageHeader title="Sign Up Form" />,
    maxWidth: 'sm',
    children: <DemoContent minHeight="300px" />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Maximum width of 640px. Ideal for forms, login pages, and focused content.',
      },
    },
  },
};

export const MaxWidthMedium: Story = {
  args: {
    header: <PageHeader title="Article Content" />,
    maxWidth: 'md',
    children: <DemoContent minHeight="300px" />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Maximum width of 768px. Good for articles, documentation, and readable content.',
      },
    },
  },
};

export const MaxWidthLarge: Story = {
  args: {
    header: <PageHeader title="Dashboard (Default)" />,
    maxWidth: 'lg',
    children: <DemoContent minHeight="300px" />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Maximum width of 1024px. Default size, suitable for most applications.',
      },
    },
  },
};

export const MaxWidthXL: Story = {
  args: {
    header: <PageHeader title="Wide Dashboard" />,
    maxWidth: 'xl',
    children: <DemoContent minHeight="300px" />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Maximum width of 1280px. For data-heavy pages, dashboards, and wide content.',
      },
    },
  },
};

export const MaxWidthFull: Story = {
  args: {
    header: <PageHeader title="Full Width" />,
    maxWidth: 'full',
    children: <DemoContent minHeight="300px" />,
  },
  parameters: {
    docs: {
      description: {
        story: 'No width constraint. Uses 100% of available width.',
      },
    },
  },
};

export const PaddingNone: Story = {
  args: {
    header: <PageHeader title="No Padding" />,
    padding: 'none',
    children: <DemoContent minHeight="200px" />,
  },
};

export const PaddingSmall: Story = {
  args: {
    header: <PageHeader title="Small Padding (8px)" />,
    padding: 'sm',
    children: <DemoContent minHeight="200px" />,
  },
};

export const PaddingMedium: Story = {
  args: {
    header: <PageHeader title="Medium Padding (16px)" />,
    padding: 'md',
    children: <DemoContent minHeight="200px" />,
  },
};

export const PaddingLarge: Story = {
  args: {
    header: <PageHeader title="Large Padding (24px)" />,
    padding: 'lg',
    children: <DemoContent minHeight="200px" />,
  },
};

// Full page layout with TitleBar outside ContentLayout
export const FullPageLayout: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TitleBar
        logo={<span style={{ fontSize: '20px' }}>C</span>}
        title="Coworker"
        tabs={[
          { value: 'work', label: 'Work' },
          { value: 'web', label: 'Web' },
        ]}
        activeTab="work"
        actions={
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--primary-bg)',
              color: 'var(--primary-fg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
            }}
          >
            JD
          </div>
        }
      />
      <ContentLayout
        header={
          <PageHeader
            breadcrumbs={[
              { label: 'Dashboard', href: '/' },
              { label: 'Projects', href: '/projects' },
              { label: 'Project Alpha' },
            ]}
            title="Project Alpha"
            description="AI-powered project management demo"
            actions={
              <>
                <Button variant="outline">Share</Button>
                <Button variant="primary">New Task</Button>
              </>
            }
          />
        }
        footer={<DemoFooter />}
      >
        <DemoContent minHeight="calc(100vh - 300px)" />
      </ContentLayout>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Full application layout showing TitleBar above ContentLayout.
Note: TitleBar is placed outside ContentLayout as it spans the full viewport width.
        `,
      },
    },
  },
};
