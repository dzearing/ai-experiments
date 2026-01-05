import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ItemPicker } from './ItemPicker';
import type { FolderEntry } from '../ItemPickerDialog';

// Mock file system for demonstration
const mockFileSystem: Record<string, FolderEntry[]> = {
  '': [
    { name: 'Users', path: '/Users', hasChildren: true },
    { name: 'var', path: '/var', hasChildren: true },
    { name: 'opt', path: '/opt', hasChildren: true },
  ],
  '/Users': [
    { name: 'alice', path: '/Users/alice', hasChildren: true },
    { name: 'bob', path: '/Users/bob', hasChildren: true },
  ],
  '/Users/alice': [
    { name: 'Documents', path: '/Users/alice/Documents', hasChildren: true },
    { name: 'Projects', path: '/Users/alice/Projects', hasChildren: true },
  ],
  '/Users/alice/Projects': [
    { name: 'react-app', path: '/Users/alice/Projects/react-app', hasChildren: true },
    { name: 'node-api', path: '/Users/alice/Projects/node-api', hasChildren: false },
  ],
};

// Mock list directory function
const mockListDirectory = async (path: string): Promise<FolderEntry[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockFileSystem[path] || [];
};

const meta: Meta<typeof ItemPicker> = {
  title: 'Pickers/ItemPicker',
  component: ItemPicker,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A specialized input for selecting file/folder paths with clear visual indication and optional validation.

## When to Use

- Selecting local folder paths for project configuration
- Configuring workspace directories
- Setting output or source directories
- Any file system path input in desktop/Electron contexts

## Features

- **"Select path" button** when no value is set - clear call-to-action
- **Folder icon** for clear visual indication of purpose
- **Path validation** support for verifying paths exist
- **Native browse** support via \`onBrowse\` prop for Electron contexts
- **Keyboard support** - Enter to confirm, Escape to cancel

## Sizes

- **sm** (28px): Compact UI, settings panels
- **md** (36px): Default size for most use cases
- **lg** (44px): Prominent path selection, touch interfaces

## Accessibility

- Uses semantic input element with proper labeling
- \`aria-invalid\` set when validation errors occur
- \`aria-describedby\` links to error message
- Focus management when entering/exiting edit mode

## Usage

\`\`\`tsx
import { ItemPicker } from '@ui-kit/react-pickers';

// Basic usage
<ItemPicker
  value={path}
  onChange={setPath}
  label="Project Directory"
/>

// With validation
<ItemPicker
  value={path}
  onChange={setPath}
  validatePath={async (p) => await checkPathExists(p)}
/>

// With native file dialog (Electron)
<ItemPicker
  value={path}
  onChange={setPath}
  onBrowse={() => electron.dialog.showOpenDialog({ properties: ['openDirectory'] })}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    value: {
      control: 'text',
      description: 'Current path value',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when editing',
      table: {
        defaultValue: { summary: '/path/to/item' },
      },
    },
    label: {
      control: 'text',
      description: 'Label text above the picker',
    },
    selectLabel: {
      control: 'text',
      description: 'Button label when no path is set',
      table: {
        defaultValue: { summary: 'Select path' },
      },
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the picker',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper for controlled state
const ControlledItemPicker = (props: React.ComponentProps<typeof ItemPicker>) => {
  const [value, setValue] = useState(props.value || '');
  return <ItemPicker {...props} value={value} onChange={setValue} />;
};

export const Default: Story = {
  render: (args) => <ControlledItemPicker {...args} />,
  args: {
    label: 'Project Directory',
    placeholder: '/path/to/project',
  },
};

export const WithValue: Story = {
  render: (args) => <ControlledItemPicker {...args} />,
  args: {
    label: 'Working Directory',
    value: '/Users/dev/projects/my-app',
  },
};

export const WithError: Story = {
  render: (args) => <ControlledItemPicker {...args} />,
  args: {
    label: 'Output Directory',
    value: '/invalid/path/here',
    error: 'Path does not exist',
  },
};

export const Disabled: Story = {
  render: (args) => <ControlledItemPicker {...args} />,
  args: {
    label: 'Locked Directory',
    value: '/locked/path',
    disabled: true,
  },
};

export const DisabledEmpty: Story = {
  render: (args) => <ControlledItemPicker {...args} />,
  args: {
    label: 'No Directory Set',
    disabled: true,
  },
};

export const CustomSelectLabel: Story = {
  render: (args) => <ControlledItemPicker {...args} />,
  args: {
    label: 'Repository',
    selectLabel: 'Choose repository',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px' }}>
      <ControlledItemPicker
        label="Small"
        size="sm"
        value="/small/path"
        onChange={() => {}}
      />
      <ControlledItemPicker
        label="Medium (default)"
        size="md"
        value="/medium/path"
        onChange={() => {}}
      />
      <ControlledItemPicker
        label="Large"
        size="lg"
        value="/large/path"
        onChange={() => {}}
      />
    </div>
  ),
};

export const SizesEmpty: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px' }}>
      <ControlledItemPicker
        label="Small"
        size="sm"
        onChange={() => {}}
      />
      <ControlledItemPicker
        label="Medium (default)"
        size="md"
        onChange={() => {}}
      />
      <ControlledItemPicker
        label="Large"
        size="lg"
        onChange={() => {}}
      />
    </div>
  ),
};

export const WithValidation: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const validatePath = async (path: string): Promise<boolean> => {
      // Simulated validation - in real use, this would check the file system
      await new Promise((resolve) => setTimeout(resolve, 500));
      return path.startsWith('/') && !path.includes('invalid');
    };

    return (
      <div style={{ maxWidth: '400px' }}>
        <ItemPicker
          label="Validated Path"
          value={value}
          onChange={setValue}
          validatePath={validatePath}
          placeholder="Try /valid/path or /invalid/path"
        />
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--base-fg-soft)', marginTop: 'var(--space-2)' }}>
          Paths starting with "/" and not containing "invalid" are valid.
        </p>
      </div>
    );
  },
};

export const WithBrowseCallback: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const handleBrowse = async (): Promise<string | null> => {
      // Simulated native dialog - in real use, this would open an OS file picker
      await new Promise((resolve) => setTimeout(resolve, 300));
      return '/Users/selected/from/dialog';
    };

    return (
      <div style={{ maxWidth: '400px' }}>
        <ItemPicker
          label="With Native Browse"
          value={value}
          onChange={setValue}
          onBrowse={handleBrowse}
          selectLabel="Browse..."
        />
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--base-fg-soft)', marginTop: 'var(--space-2)' }}>
          Click "Browse..." to simulate native file dialog selection.
        </p>
      </div>
    );
  },
};

export const WithItemDialog: Story = {
  render: () => {
    const [value, setValue] = useState('');

    return (
      <div style={{ maxWidth: '400px' }}>
        <ItemPicker
          label="Project Directory"
          value={value}
          onChange={setValue}
          onListDirectory={mockListDirectory}
          selectLabel="Browse..."
          dialogTitle="Select Project Directory"
        />
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--base-fg-soft)', marginTop: 'var(--space-2)' }}>
          Click "Browse..." to open the item picker dialog.
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'When `onListDirectory` is provided, clicking the button opens an item picker dialog instead of entering edit mode.',
      },
    },
  },
};
