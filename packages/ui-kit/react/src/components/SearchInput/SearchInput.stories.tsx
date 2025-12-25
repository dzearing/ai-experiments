import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { SearchInput } from './SearchInput';
import { Input } from '../Input';
import { Button } from '../Button';

const meta = {
  title: 'Inputs/SearchInput',
  component: SearchInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A pill-shaped input with an integrated search icon, designed specifically for search functionality.

## When to Use

- File browsers and folder selection dialogs
- Navigation search bars
- Filter inputs in lists and tables
- Global search in application headers
- Quick lookup fields

## Sizes

Heights match other controls for consistent alignment:

- **sm** (28px): Compact UI, toolbars, table headers
- **md** (36px): Default size for most search use cases
- **lg** (44px): Hero search, prominent search bars

## Accessibility

- Native \`type="search"\` for better semantics and screen reader support
- Focuses on Enter key for form submission
- Placeholder text provides context for search purpose
- Search icon is \`aria-hidden\` (decorative)

## Usage

\`\`\`tsx
import { SearchInput } from '@ui-kit/react';

<SearchInput
  placeholder="Search files..."
  onChange={(e) => setQuery(e.target.value)}
/>

// Full width in a toolbar
<SearchInput
  size="sm"
  fullWidth
  placeholder="Filter results..."
/>
\`\`\`
        `,
      },
    },
  },
  args: {
    onChange: fn(),
    onFocus: fn(),
    onBlur: fn(),
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant matching control heights',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether the input should take full width',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
  },
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with controls
export const Default: Story = {
  args: {
    placeholder: 'Search...',
    size: 'md',
  },
};

// Size variants
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <SearchInput size="sm" placeholder="Small" />
      <SearchInput size="md" placeholder="Medium" />
      <SearchInput size="lg" placeholder="Large" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Three size variants: sm (28px), md (36px), lg (44px). Heights match other control components.',
      },
    },
  },
};

// Full width
export const FullWidth: Story = {
  args: {
    placeholder: 'Search files and folders...',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Use `fullWidth` to make the search input expand to fill its container.',
      },
    },
  },
};

// In a toolbar context
export const InToolbar: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        padding: '8px 16px',
        background: 'var(--soft-bg)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <Button size="sm" variant="ghost">Back</Button>
      <Button size="sm" variant="ghost">Forward</Button>
      <div style={{ flex: 1 }} />
      <SearchInput size="sm" placeholder="Search..." style={{ width: '200px' }} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'SearchInput integrates well in toolbar layouts, commonly used for filtering content.',
      },
    },
  },
};

// Alignment with other controls
export const AlignmentTest: Story = {
  name: 'Alignment with Other Controls',
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <Input size="md" placeholder="Input" style={{ width: '150px' }} />
      <SearchInput size="md" placeholder="Search..." />
      <Button size="md">Submit</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'SearchInput aligns perfectly with Input, Button, and other controls of the same size.',
      },
    },
  },
};

// With value
export const WithValue: Story = {
  args: {
    placeholder: 'Search...',
    defaultValue: 'Documents',
  },
  parameters: {
    docs: {
      description: {
        story: 'SearchInput with a pre-filled value.',
      },
    },
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    placeholder: 'Search disabled...',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state prevents user interaction.',
      },
    },
  },
};

// File browser example
export const FileBrowserExample: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        padding: '8px 16px',
        background: 'var(--soft-bg)',
        borderRadius: 'var(--radius-md)',
        width: '500px',
      }}
    >
      <Button size="sm" variant="ghost">Back</Button>
      <Button size="sm" variant="ghost">Forward</Button>
      <Button size="sm" variant="ghost">Up</Button>
      <div
        style={{
          flex: 1,
          padding: '4px 12px',
          background: 'var(--base-bg)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
          color: 'var(--base-fg)',
        }}
      >
        /Users/Documents/Projects
      </div>
      <SearchInput size="sm" placeholder="Search" style={{ width: '150px' }} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example usage in a file browser toolbar, similar to OS file dialogs.',
      },
    },
  },
};
