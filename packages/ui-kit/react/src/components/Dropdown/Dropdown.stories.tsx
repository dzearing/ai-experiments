import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown, type DropdownOption } from './Dropdown';
import { Stack } from '../Stack';
import { Text } from '../Text';

/**
 * # Dropdown
 *
 * A select-like component with single/multi-select, search, and type-to-select capabilities.
 *
 * ## Features
 *
 * - Single and multi-select modes
 * - Searchable/filterable options
 * - Type-to-select (native select behavior)
 * - Custom option and value rendering
 * - Chip display for multi-select
 * - Full keyboard navigation
 * - Clearable option
 * - Loading and error states
 *
 * ## Usage
 *
 * ```tsx
 * import { Dropdown } from '@ui-kit/react';
 *
 * const options = [
 *   { value: 'react', label: 'React' },
 *   { value: 'vue', label: 'Vue' },
 *   { value: 'angular', label: 'Angular' },
 * ];
 *
 * <Dropdown
 *   options={options}
 *   value={selected}
 *   onChange={setSelected}
 *   placeholder="Select a framework..."
 * />
 * ```
 */

const meta: Meta<typeof Dropdown> = {
  title: 'Inputs/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Select-like component for choosing from a list of options with advanced features.

## When to Use

- Single selection from many options
- Multi-selection with tag display
- Searchable dropdowns for large lists
- Custom option rendering
- Form inputs requiring selection

## Dropdown vs Menu vs Select

| Component | Use Case |
|-----------|----------|
| **Dropdown** | Selection with search, multi-select, rich rendering |
| **Menu** | Actions and navigation (context menus, file menus) |
| **Select** | Simple native HTML select for basic forms |

## Keyboard Navigation

| Key | Action |
|-----|--------|
| **Enter/Space** | Open dropdown, select option |
| **Escape** | Close dropdown |
| **ArrowDown/Up** | Navigate options |
| **Home/End** | Jump to first/last option |
| **Backspace** | Remove last chip (multi-select, empty search) |
| **Type characters** | Type-to-select (jumps to matching option) |

## Type-to-Select

When the dropdown is closed or in non-searchable mode, typing characters will jump to matching options (like a native select). The search buffer resets after 1 second of inactivity.
        `,
      },
    },
  },
  argTypes: {
    mode: {
      control: 'select',
      options: ['single', 'multi'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    position: {
      control: 'select',
      options: ['bottom-start', 'bottom-end', 'top-start', 'top-end'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

// Icon components
const ReactIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="8" cy="8" r="1.5" />
    <ellipse cx="8" cy="8" rx="7" ry="2.5" fill="none" stroke="currentColor" strokeWidth="1" />
    <ellipse cx="8" cy="8" rx="7" ry="2.5" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(60 8 8)" />
    <ellipse cx="8" cy="8" rx="7" ry="2.5" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(120 8 8)" />
  </svg>
);

const VueIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 12.5L2 2h3l3 5.5L11 2h3L8 12.5z" />
  </svg>
);

const AngularIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1L1 4l1 9 6 3 6-3 1-9-7-3zm0 2.5l4 8.5H9.5L8.5 10h-1L6.5 12H4l4-8.5z" />
  </svg>
);

// Basic options
const frameworkOptions: DropdownOption[] = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'SolidJS' },
  { value: 'preact', label: 'Preact' },
];

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>();

    return (
      <Stack gap="md" align="center" style={{ width: 300 }}>
        <Dropdown
          options={frameworkOptions}
          value={value}
          onChange={(v) => setValue(v as string)}
          placeholder="Select a framework..."
          fullWidth
        />
        {value && (
          <Text size="sm" color="soft">
            Selected: {value}
          </Text>
        )}
      </Stack>
    );
  },
};

export const WithPlaceholder: Story = {
  render: () => (
    <Dropdown
      options={frameworkOptions}
      placeholder="Choose your favorite framework..."
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Customize the placeholder text shown when no option is selected.',
      },
    },
  },
};

// With icons
const iconOptions: DropdownOption[] = [
  { value: 'react', label: 'React', icon: <ReactIcon /> },
  { value: 'vue', label: 'Vue', icon: <VueIcon /> },
  { value: 'angular', label: 'Angular', icon: <AngularIcon /> },
];

export const WithIcons: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>();

    return (
      <Dropdown
        options={iconOptions}
        value={value}
        onChange={(v) => setValue(v as string)}
        placeholder="Select a framework..."
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Options can include icons for visual identification.',
      },
    },
  },
};

export const Searchable: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>();
    const countries = [
      { value: 'us', label: 'United States' },
      { value: 'uk', label: 'United Kingdom' },
      { value: 'ca', label: 'Canada' },
      { value: 'au', label: 'Australia' },
      { value: 'de', label: 'Germany' },
      { value: 'fr', label: 'France' },
      { value: 'jp', label: 'Japan' },
      { value: 'kr', label: 'South Korea' },
      { value: 'br', label: 'Brazil' },
      { value: 'mx', label: 'Mexico' },
      { value: 'in', label: 'India' },
      { value: 'cn', label: 'China' },
    ];

    return (
      <Stack gap="md" style={{ width: 300 }}>
        <Dropdown
          options={countries}
          value={value}
          onChange={(v) => setValue(v as string)}
          placeholder="Search countries..."
          searchable
          fullWidth
        />
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Enable `searchable` to filter options by typing.',
      },
    },
  },
};

export const MultiSelect: Story = {
  render: () => {
    const [values, setValues] = useState<string[]>([]);

    return (
      <Stack gap="md" style={{ width: 350 }}>
        <Dropdown
          options={frameworkOptions}
          mode="multi"
          value={values}
          onChange={(v) => setValues(v as string[])}
          placeholder="Select frameworks..."
          fullWidth
        />
        {values.length > 0 && (
          <Text size="sm" color="soft">
            Selected: {values.join(', ')}
          </Text>
        )}
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Multi-select mode displays selected items as removable chips.',
      },
    },
  },
};

export const MultiSelectWithSearch: Story = {
  render: () => {
    const [values, setValues] = useState<string[]>(['react']);
    const languages = [
      { value: 'js', label: 'JavaScript' },
      { value: 'ts', label: 'TypeScript' },
      { value: 'py', label: 'Python' },
      { value: 'go', label: 'Go' },
      { value: 'rust', label: 'Rust' },
      { value: 'java', label: 'Java' },
      { value: 'csharp', label: 'C#' },
      { value: 'cpp', label: 'C++' },
      { value: 'ruby', label: 'Ruby' },
      { value: 'php', label: 'PHP' },
    ];

    return (
      <Stack gap="md" style={{ width: 350 }}>
        <Dropdown
          options={languages}
          mode="multi"
          value={values}
          onChange={(v) => setValues(v as string[])}
          placeholder="Select languages..."
          searchable
          fullWidth
        />
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Combine multi-select with search for large option sets.',
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <Stack gap="md" align="start">
      <Dropdown options={frameworkOptions} placeholder="Small" size="sm" />
      <Dropdown options={frameworkOptions} placeholder="Medium (default)" size="md" />
      <Dropdown options={frameworkOptions} placeholder="Large" size="lg" />
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Three size variants to match your design needs.',
      },
    },
  },
};

export const States: Story = {
  render: () => (
    <Stack gap="md" align="start">
      <Dropdown options={frameworkOptions} placeholder="Normal" />
      <Dropdown options={frameworkOptions} placeholder="Disabled" disabled />
      <Dropdown options={frameworkOptions} placeholder="Error" error />
      <Dropdown options={frameworkOptions} placeholder="Loading..." loading />
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Various states: disabled, error, and loading.',
      },
    },
  },
};

export const Clearable: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>('react');

    return (
      <Stack gap="md" style={{ width: 300 }}>
        <Dropdown
          options={frameworkOptions}
          value={value}
          onChange={(v) => setValue(v as string)}
          placeholder="Select a framework..."
          clearable
          fullWidth
        />
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Enable `clearable` to show a clear button when there is a selection.',
      },
    },
  },
};

export const DisabledOptions: Story = {
  render: () => {
    const options: DropdownOption[] = [
      { value: 'free', label: 'Free Plan' },
      { value: 'pro', label: 'Pro Plan' },
      { value: 'enterprise', label: 'Enterprise Plan', disabled: true },
      { value: 'custom', label: 'Custom Plan', disabled: true },
    ];

    return (
      <Dropdown
        options={options}
        placeholder="Select a plan..."
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Individual options can be disabled.',
      },
    },
  },
};

export const TypeToSelect: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>();
    const fruits = [
      { value: 'apple', label: 'Apple' },
      { value: 'apricot', label: 'Apricot' },
      { value: 'banana', label: 'Banana' },
      { value: 'blueberry', label: 'Blueberry' },
      { value: 'cherry', label: 'Cherry' },
      { value: 'coconut', label: 'Coconut' },
      { value: 'date', label: 'Date' },
      { value: 'grape', label: 'Grape' },
      { value: 'kiwi', label: 'Kiwi' },
      { value: 'lemon', label: 'Lemon' },
      { value: 'mango', label: 'Mango' },
      { value: 'orange', label: 'Orange' },
      { value: 'peach', label: 'Peach' },
      { value: 'pear', label: 'Pear' },
      { value: 'strawberry', label: 'Strawberry' },
    ];

    return (
      <Stack gap="md" style={{ width: 300 }}>
        <Text size="sm" color="soft">
          Focus the dropdown and type "ap" to jump to Apple, then keep typing "r" for Apricot
        </Text>
        <Dropdown
          options={fruits}
          value={value}
          onChange={(v) => setValue(v as string)}
          placeholder="Select a fruit..."
          fullWidth
        />
        {value && (
          <Text size="sm" color="soft">
            Selected: {value}
          </Text>
        )}
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Type characters to jump to matching options (like native select). The buffer resets after 1 second.',
      },
    },
  },
};

export const CustomOptionRender: Story = {
  render: () => {
    const users: DropdownOption[] = [
      { value: 'alice', label: 'Alice Johnson', data: { role: 'Admin', avatar: 'A' } },
      { value: 'bob', label: 'Bob Smith', data: { role: 'Developer', avatar: 'B' } },
      { value: 'carol', label: 'Carol White', data: { role: 'Designer', avatar: 'C' } },
      { value: 'david', label: 'David Brown', data: { role: 'Manager', avatar: 'D' } },
    ];

    const [value, setValue] = useState<string | undefined>();

    return (
      <Dropdown
        options={users}
        value={value}
        onChange={(v) => setValue(v as string)}
        placeholder="Select a user..."
        renderOption={(option, state) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: state.selected ? 'var(--controlPrimary-bg)' : 'var(--controlSubtle-bg)',
                color: state.selected ? 'var(--controlPrimary-text)' : 'var(--body-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              {(option.data as { avatar: string }).avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{option.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--body-text-soft)' }}>
                {(option.data as { role: string }).role}
              </div>
            </div>
          </div>
        )}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Use `renderOption` to customize how options are displayed.',
      },
    },
  },
};

export const ControlledValue: Story = {
  render: () => {
    const [value, setValue] = useState<string>('vue');

    return (
      <Stack gap="md" style={{ width: 300 }}>
        <Stack gap="sm" direction="row">
          <button onClick={() => setValue('react')}>Set React</button>
          <button onClick={() => setValue('vue')}>Set Vue</button>
          <button onClick={() => setValue('angular')}>Set Angular</button>
        </Stack>
        <Dropdown
          options={frameworkOptions}
          value={value}
          onChange={(v) => setValue(v as string)}
          fullWidth
        />
        <Text size="sm" color="soft">
          Current value: {value}
        </Text>
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Control the selected value externally.',
      },
    },
  },
};

export const FullWidth: Story = {
  render: () => (
    <div style={{ width: 400 }}>
      <Dropdown
        options={frameworkOptions}
        placeholder="Full width dropdown"
        fullWidth
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use `fullWidth` to make the dropdown fill its container.',
      },
    },
  },
};

export const CompleteExample: Story = {
  render: () => {
    const [framework, setFramework] = useState<string | undefined>();
    const [languages, setLanguages] = useState<string[]>([]);

    const languageOptions: DropdownOption[] = [
      { value: 'js', label: 'JavaScript' },
      { value: 'ts', label: 'TypeScript' },
      { value: 'css', label: 'CSS' },
      { value: 'html', label: 'HTML' },
    ];

    return (
      <Stack gap="lg" style={{ width: 350 }}>
        <Stack gap="sm">
          <Text size="sm" weight="medium">Framework</Text>
          <Dropdown
            options={frameworkOptions}
            value={framework}
            onChange={(v) => setFramework(v as string)}
            placeholder="Select a framework..."
            searchable
            clearable
            fullWidth
          />
        </Stack>
        <Stack gap="sm">
          <Text size="sm" weight="medium">Languages</Text>
          <Dropdown
            options={languageOptions}
            mode="multi"
            value={languages}
            onChange={(v) => setLanguages(v as string[])}
            placeholder="Select languages..."
            searchable
            fullWidth
          />
        </Stack>
        <Stack gap="sm">
          <Text size="sm" color="soft">
            Framework: {framework || 'None'}
          </Text>
          <Text size="sm" color="soft">
            Languages: {languages.length > 0 ? languages.join(', ') : 'None'}
          </Text>
        </Stack>
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'A complete example showing single and multi-select dropdowns in a form.',
      },
    },
  },
};
