import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { FontPicker } from './FontPicker';
import { Stack } from '../Stack';
import { Text } from '../Text';

const meta = {
  title: 'Inputs/FontPicker',
  component: FontPicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A specialized dropdown for selecting fonts. Each font option is rendered using its own typeface, making it easy to preview fonts before selection.

## When to Use

- Theme or style configuration panels
- Text editors and content management systems
- Design tools and customization interfaces
- Any UI where users need to select a font family

## Features

- **Font Preview**: Each option renders in its own font family
- **Searchable**: Built-in search to quickly find fonts
- **Categorized**: Fonts are grouped by type (System, Sans-Serif, Serif, Monospace, Display)
- **Google Fonts**: Includes popular Google Fonts with lazy loading
- **Customizable**: Add your own fonts or disable Google Fonts

## Sizes

Heights match other controls for consistent alignment:

- **sm** (28px): Compact UI, toolbars
- **md** (36px): Default size
- **lg** (44px): Hero sections, prominent controls

## Accessibility

- Full keyboard navigation
- ARIA labels for screen readers
- Searchable for quick access

## Usage

\`\`\`tsx
import { FontPicker } from '@claude-flow/ui-kit-react';

<FontPicker
  value={selectedFont}
  onChange={setSelectedFont}
  placeholder="Choose a font..."
/>
\`\`\`
        `,
      },
    },
  },
  args: {
    onChange: fn(),
  },
  argTypes: {
    value: {
      control: 'text',
      description: 'Currently selected font value',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no font is selected',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant',
    },
    includeGoogleFonts: {
      control: 'boolean',
      description: 'Whether to include Google Fonts in the list',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether to take full width of container',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the picker is disabled',
    },
  },
} satisfies Meta<typeof FontPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    placeholder: 'Select a font...',
  },
};

// Controlled example
const ControlledExample = () => {
  const [font, setFont] = useState('"Inter", sans-serif');

  return (
    <Stack direction="vertical" gap="md" style={{ width: 300 }}>
      <FontPicker
        value={font}
        onChange={setFont}
        placeholder="Select a font..."
      />
      <div
        style={{
          padding: 'var(--space-4)',
          background: 'var(--card-bg)',
          borderRadius: 'var(--radius-md)',
          fontFamily: font,
        }}
      >
        <p style={{ margin: 0 }}>
          The quick brown fox jumps over the lazy dog.
        </p>
        <p style={{ margin: '8px 0 0', fontWeight: 600 }}>
          ABCDEFGHIJKLMNOPQRSTUVWXYZ
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '12px', opacity: 0.7 }}>
          1234567890 !@#$%^&*()
        </p>
      </div>
      <Text size="sm" color="secondary">
        Selected: {font}
      </Text>
    </Stack>
  );
};

export const Controlled: Story = {
  render: () => <ControlledExample />,
  parameters: {
    docs: {
      description: {
        story: 'A controlled FontPicker with a live preview of the selected font.',
      },
    },
  },
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <Stack direction="vertical" gap="md" style={{ width: 250 }}>
      <FontPicker size="sm" placeholder="Small" />
      <FontPicker size="md" placeholder="Medium (default)" />
      <FontPicker size="lg" placeholder="Large" />
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'FontPicker supports three sizes: sm (28px), md (36px), and lg (44px).',
      },
    },
  },
};

// Without Google Fonts
export const SystemFontsOnly: Story = {
  args: {
    includeGoogleFonts: false,
    placeholder: 'System fonts only...',
  },
  parameters: {
    docs: {
      description: {
        story: 'When `includeGoogleFonts` is false, only system/web-safe fonts are shown.',
      },
    },
  },
};

// With custom fonts
const CustomFontsExample = () => {
  const [font, setFont] = useState('');

  return (
    <FontPicker
      value={font}
      onChange={setFont}
      customFonts={[
        { value: '"Comic Sans MS", cursive', label: 'Comic Sans', category: 'display' },
        { value: '"Papyrus", fantasy', label: 'Papyrus', category: 'display' },
        { value: '"Impact", sans-serif', label: 'Impact', category: 'display' },
      ]}
      placeholder="Including custom fonts..."
    />
  );
};

export const WithCustomFonts: Story = {
  render: () => <CustomFontsExample />,
  decorators: [
    (Story) => (
      <div style={{ width: 250 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'You can add custom fonts to the picker using the `customFonts` prop.',
      },
    },
  },
};

// Full width
export const FullWidth: Story = {
  args: {
    fullWidth: true,
    placeholder: 'Full width picker...',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 400 }}>
        <Story />
      </div>
    ),
  ],
};

// Disabled
export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled picker',
  },
};

// Pre-selected value
export const WithPreselectedValue: Story = {
  args: {
    value: '"JetBrains Mono", monospace',
  },
  parameters: {
    docs: {
      description: {
        story: 'FontPicker can be initialized with a pre-selected font value.',
      },
    },
  },
};

// Stack mode for font-family fallback lists
const StackModeExample = () => {
  const [fonts, setFonts] = useState<string[]>([
    '"Inter", sans-serif',
    'system-ui',
    'sans-serif',
  ]);

  return (
    <Stack direction="vertical" gap="md" style={{ width: 350 }}>
      <Text weight="medium">Font Stack Builder</Text>
      <FontPicker
        mode="stack"
        value={fonts}
        onChange={setFonts}
        placeholder="Add a font..."
      />
      <div
        style={{
          padding: 'var(--space-4)',
          background: 'var(--card-bg)',
          borderRadius: 'var(--radius-md)',
          fontFamily: fonts.join(', '),
        }}
      >
        <p style={{ margin: 0 }}>
          The quick brown fox jumps over the lazy dog.
        </p>
      </div>
    </Stack>
  );
};

export const StackMode: Story = {
  render: () => <StackModeExample />,
  parameters: {
    docs: {
      description: {
        story: `
Stack mode allows building a font-family fallback list. Users can add multiple fonts and reorder them to define the fallback priority.

\`\`\`tsx
<FontPicker
  mode="stack"
  value={fonts}
  onChange={setFonts}
  placeholder="Add a font..."
/>
\`\`\`

The resulting array can be joined to create a CSS font-family value.
        `,
      },
    },
  },
};

// Empty stack mode
const EmptyStackExample = () => {
  const [fonts, setFonts] = useState<string[]>([]);

  return (
    <Stack direction="vertical" gap="md" style={{ width: 350 }}>
      <Text weight="medium">Build Your Font Stack</Text>
      <FontPicker
        mode="stack"
        value={fonts}
        onChange={setFonts}
        placeholder="Start by selecting a primary font..."
      />
      {fonts.length > 0 && (
        <Text size="sm" color="secondary">
          Selected {fonts.length} font{fonts.length !== 1 ? 's' : ''}
        </Text>
      )}
    </Stack>
  );
};

export const StackModeEmpty: Story = {
  render: () => <EmptyStackExample />,
  parameters: {
    docs: {
      description: {
        story: 'Stack mode starting with no fonts selected.',
      },
    },
  },
};

// Disabled stack mode
const DisabledStackExample = () => {
  return (
    <div style={{ width: 350 }}>
      <FontPicker
        mode="stack"
        value={['"Inter", sans-serif', 'system-ui']}
        disabled
      />
    </div>
  );
};

export const StackModeDisabled: Story = {
  render: () => <DisabledStackExample />,
  parameters: {
    docs: {
      description: {
        story: 'Stack mode in disabled state shows the selected fonts but prevents interaction.',
      },
    },
  },
};
