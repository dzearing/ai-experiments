import type { Meta, StoryObj } from '@storybook/react';
import { Banner, BannerIcons } from './Banner';
import { StoryExample } from '../../utils/StoryExample';
import { Button } from '../Button';

const meta: Meta<typeof Banner> = {
  title: 'Components/Banner',
  component: Banner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Displays important system-wide messages, alerts, and notifications.',
      },
      source: {
        type: 'code',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['error', 'warning', 'info', 'success'],
      description: 'The visual style of the banner',
      table: {
        defaultValue: { summary: 'info' },
      },
    },
    children: {
      control: 'text',
      description: 'The content to display in the banner',
    },
    dismissible: {
      control: 'boolean',
      description: 'Whether the banner can be dismissed with an X button (defaults to false)',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    position: {
      control: 'select',
      options: ['fixed', 'relative'],
      description: 'Positioning of the banner (fixed at top or relative)',
      table: {
        defaultValue: { summary: 'fixed' },
      },
    },
    icon: {
      control: false,
      description: 'Custom icon to display',
    },
    onDismiss: {
      action: 'dismissed',
      description: 'Callback when banner is dismissed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story for autodocs
export const Default: Story = {
  args: {
    variant: 'info',
    children: 'This is an informational banner message that can be dismissed.',
    dismissible: true,
    position: 'relative',
    icon: BannerIcons.info,
  },
  parameters: {
    docs: {
      source: {
        code: `<Banner 
  variant="info" 
  icon={BannerIcons.info} 
  dismissible 
  position="relative"
>
  This is an informational banner message.
</Banner>`,
      },
    },
  },
};

// Basic Variants
export const BasicVariants: Story = {
  name: 'Basic Variants',
  parameters: {
    docs: {
      description: {
        story: 'Banner supports four semantic variants to communicate different types of messages.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-small10)' }}>
      <Banner variant="error" icon={BannerIcons.error} dismissible={false} position="relative">
        Connection lost. Please check your internet connection.
      </Banner>
      <Banner variant="warning" icon={BannerIcons.warning} dismissible position="relative">
        Your session expires in 5 minutes. Save your work to avoid data loss.
      </Banner>
      <Banner variant="info" icon={BannerIcons.info} dismissible position="relative">
        New keyboard shortcuts available. Press ? to view.
      </Banner>
      <Banner variant="success" icon={BannerIcons.success} dismissible position="relative">
        All systems operational. Performance is optimal.
      </Banner>
    </div>
  ),
};

// Banners with Actions
export const WithActions: Story = {
  name: 'With Actions',
  parameters: {
    docs: {
      description: {
        story: 'Include action buttons for banners that require user response.',
      },
    },
  },
  render: () => (
    <Banner variant="warning" icon={BannerIcons.warning} dismissible={false} position="relative">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-large10)', flex: 1 }}>
        <span style={{ flex: 1 }}>Suspicious login attempt detected from new location.</span>
        <div style={{ display: 'flex', gap: 'var(--spacing-small10)', flexShrink: 0 }}>
          <Button size="small" variant="primary">Review Activity</Button>
          <Button size="small" variant="outline">Ignore</Button>
        </div>
      </div>
    </Banner>
  ),
};

// With Inline Links
export const WithInlineLinks: Story = {
  name: 'With Inline Links',
  parameters: {
    docs: {
      description: {
        story: 'Include inline links for additional information without leaving the page.',
      },
    },
  },
  render: () => (
    <Banner variant="info" icon={BannerIcons.info} dismissible position="relative">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-large10)' }}>
        <span style={{ flex: 1 }}>
          We've updated our privacy policy to comply with new regulations.
          <a href="#" style={{ marginLeft: 'var(--spacing-small10)', color: 'inherit', fontWeight: 'var(--font-weight-semibold)' }}>Learn more →</a>
        </span>
      </div>
    </Banner>
  ),
};

// Rate Limit Warning
export const RateLimitWarning: Story = {
  name: 'Rate Limit Warning',
  parameters: {
    docs: {
      description: {
        story: 'Display usage metrics and time-sensitive information.',
      },
    },
  },
  render: () => (
    <Banner variant="warning" icon={BannerIcons.warning} dismissible position="relative">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-large10)' }}>
        <span style={{ flex: 1 }}>API rate limit: 80% used (400/500 requests)</span>
        <span style={{ fontSize: 'var(--font-size-small10)', opacity: 0.8 }}>Resets in 15 minutes</span>
      </div>
    </Banner>
  ),
};

// Custom Icon
export const CustomIcon: Story = {
  name: 'Custom Icon',
  parameters: {
    docs: {
      description: {
        story: 'Use custom icons for specific use cases not covered by the default variants.',
      },
    },
  },
  render: () => (
    <Banner 
      variant="error" 
      dismissible={false} 
      position="relative"
      icon={
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8.5 1.5a.5.5 0 0 0-1 0v1.134a5.502 5.502 0 0 0-4.9 4.889A.5.5 0 0 0 3.098 8h1.008a.5.5 0 0 0 .492-.41 3.502 3.502 0 0 1 6.804 0 .5.5 0 0 0 .492.41h1.008a.5.5 0 0 0 .498-.477 5.502 5.502 0 0 0-4.9-4.889V1.5z" />
          <path d="M8 5.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM4.646 11.646a.5.5 0 0 1 .708 0L8 14.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z" />
        </svg>
      }
    >
      No internet connection. Working in offline mode.
    </Banner>
  ),
};

// Dismissible Examples
export const DismissibleExamples: Story = {
  name: 'Dismissible Examples',
  parameters: {
    docs: {
      description: {
        story: 'Examples of dismissible banners with different variants. Click the X button to dismiss.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing)' }}>
      <Banner variant="error" icon={BannerIcons.error} dismissible position="relative">
        Critical error: Database connection lost. Click X to dismiss this notification.
      </Banner>
      <Banner variant="warning" icon={BannerIcons.warning} dismissible position="relative">
        Warning: Your session will expire in 10 minutes. Save your work.
      </Banner>
      <Banner variant="success" icon={BannerIcons.success} dismissible position="relative">
        Success! Your changes have been saved. You can dismiss this message.
      </Banner>
    </div>
  ),
};

// Fixed Positioning
export const FixedPositioning: Story = {
  name: 'Fixed Positioning',
  parameters: {
    docs: {
      description: {
        story: 'Multiple fixed banners stack automatically. This example is shown in an iframe to prevent the fixed banners from covering other documentation content.',
      },
    },
  },
  render: () => (
    <StoryExample 
      iframe
      height="250px"
      title="Fixed Banners Demo"
    >
      {`
        <div class="banner error visible">
          <div class="banner-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fill-rule="evenodd" d="M8 14.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM6.97 5.97a.75.75 0 00-1.061 1.06L6.878 8l-.97.97a.75.75 0 101.061 1.06L8 9.061l1.03.97a.75.75 0 101.061-1.06L9.122 8l.97-.97a.75.75 0 00-1.061-1.06L8 6.939 6.97 5.97z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="banner-content">Database connection failed. Some features may be unavailable.</div>
        </div>
        
        <div class="banner warning visible" style="top: 36px;">
          <div class="banner-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fill-rule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 01-1.299 2.25H2.804a1.5 1.5 0 01-1.298-2.25l5.195-9zM8 4a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 4zm0 7a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="banner-content">High server load detected. Response times may be slower.</div>
        </div>
        
        <div class="banner info visible" style="top: 72px;">
          <div class="banner-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fill-rule="evenodd" d="M8 14.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM8 4.75a.75.75 0 100 1.5.75.75 0 000-1.5zM6.75 8.25a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v2.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25v-2h-.25a.75.75 0 01-.75-.75z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="banner-content">Scheduled maintenance: Sunday 2:00 AM - 4:00 AM UTC.</div>
        </div>
        
        <div class="demo-content">
          <h2>Page Content</h2>
          <p>Page content is pushed down by the stacked banners.</p>
          <p>When using fixed positioning, multiple banners automatically stack with proper spacing.</p>
        </div>
      `}
    </StoryExample>
  ),
};

// Inline in Form
export const InlineInForm: Story = {
  name: 'Inline in Form',
  parameters: {
    docs: {
      description: {
        story: 'Use relative positioning for contextual banners within specific page sections or forms.',
      },
    },
  },
  render: () => (
    <div style={{ maxWidth: '500px' }}>
      <form style={{ marginBottom: 'var(--spacing-large10)' }}>
        <div style={{ marginBottom: 'var(--spacing-large10)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-small20)', fontWeight: 'var(--font-weight-medium)' }}>Name</label>
          <input 
            type="text" 
            placeholder="Enter your name" 
            style={{ 
              width: '100%', 
              padding: 'var(--spacing-small10) var(--spacing)', 
              border: '1px solid var(--color-input-border)',
              borderRadius: 'var(--radius-small10)',
              fontSize: 'var(--font-size-normal)'
            }} 
          />
        </div>
        <div style={{ marginBottom: 'var(--spacing-large10)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-small20)', fontWeight: 'var(--font-weight-medium)' }}>Email</label>
          <input 
            type="email" 
            placeholder="Enter your email" 
            style={{ 
              width: '100%', 
              padding: 'var(--spacing-small10) var(--spacing)',
              border: '1px solid var(--color-input-border)',
              borderRadius: 'var(--radius-small10)',
              fontSize: 'var(--font-size-normal)'
            }} 
          />
        </div>
        <Button type="button" fullWidth>Submit</Button>
      </form>
      <Banner variant="success" icon={BannerIcons.success} dismissible position="relative">
        Form submitted successfully. We'll contact you within 24 hours.
      </Banner>
    </div>
  ),
};