import type { Meta, StoryObj } from '@storybook/react';
import { useState, useMemo } from 'react';
import { Button } from '@ui-kit/react';
import { ItemPickerDialog, type FolderEntry } from './ItemPickerDialog';
import { MockItemProvider, DiskItemProvider, type Item } from '../../providers';

// Mock file system data including both files and folders
const mockProviderData: Record<string, Item[]> = {
  '/Users/alice': [
    { id: '/Users/alice/Documents', name: 'Documents', path: '/Users/alice/Documents', type: 'folder', hasChildren: true },
    { id: '/Users/alice/Downloads', name: 'Downloads', path: '/Users/alice/Downloads', type: 'folder', hasChildren: false },
    { id: '/Users/alice/Projects', name: 'Projects', path: '/Users/alice/Projects', type: 'folder', hasChildren: true },
    { id: '/Users/alice/.bashrc', name: '.bashrc', path: '/Users/alice/.bashrc', type: 'file', size: 1234 },
    { id: '/Users/alice/notes.txt', name: 'notes.txt', path: '/Users/alice/notes.txt', type: 'file', size: 567 },
  ],
  '/Users/alice/Documents': [
    { id: '/Users/alice/Documents/Work', name: 'Work', path: '/Users/alice/Documents/Work', type: 'folder', hasChildren: false },
    { id: '/Users/alice/Documents/Personal', name: 'Personal', path: '/Users/alice/Documents/Personal', type: 'folder', hasChildren: false },
    { id: '/Users/alice/Documents/resume.pdf', name: 'resume.pdf', path: '/Users/alice/Documents/resume.pdf', type: 'file', size: 50000 },
    { id: '/Users/alice/Documents/report.docx', name: 'report.docx', path: '/Users/alice/Documents/report.docx', type: 'file', size: 25000 },
  ],
  '/Users/alice/Projects': [
    { id: '/Users/alice/Projects/react-app', name: 'react-app', path: '/Users/alice/Projects/react-app', type: 'folder', hasChildren: true },
    { id: '/Users/alice/Projects/node-api', name: 'node-api', path: '/Users/alice/Projects/node-api', type: 'folder', hasChildren: false },
  ],
  '/Users/alice/Projects/react-app': [
    { id: '/Users/alice/Projects/react-app/src', name: 'src', path: '/Users/alice/Projects/react-app/src', type: 'folder', hasChildren: true },
    { id: '/Users/alice/Projects/react-app/public', name: 'public', path: '/Users/alice/Projects/react-app/public', type: 'folder', hasChildren: false },
    { id: '/Users/alice/Projects/react-app/package.json', name: 'package.json', path: '/Users/alice/Projects/react-app/package.json', type: 'file', size: 1500 },
    { id: '/Users/alice/Projects/react-app/tsconfig.json', name: 'tsconfig.json', path: '/Users/alice/Projects/react-app/tsconfig.json', type: 'file', size: 800 },
    { id: '/Users/alice/Projects/react-app/README.md', name: 'README.md', path: '/Users/alice/Projects/react-app/README.md', type: 'file', size: 2000 },
  ],
  '/Users/alice/Projects/react-app/src': [
    { id: '/Users/alice/Projects/react-app/src/components', name: 'components', path: '/Users/alice/Projects/react-app/src/components', type: 'folder', hasChildren: false },
    { id: '/Users/alice/Projects/react-app/src/App.tsx', name: 'App.tsx', path: '/Users/alice/Projects/react-app/src/App.tsx', type: 'file', size: 3000 },
    { id: '/Users/alice/Projects/react-app/src/index.tsx', name: 'index.tsx', path: '/Users/alice/Projects/react-app/src/index.tsx', type: 'file', size: 500 },
    { id: '/Users/alice/Projects/react-app/src/styles.css', name: 'styles.css', path: '/Users/alice/Projects/react-app/src/styles.css', type: 'file', size: 1200 },
  ],
};

const meta: Meta<typeof ItemPickerDialog> = {
  title: 'Pickers/ItemPickerDialog',
  component: ItemPickerDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A versatile dialog for browsing and selecting files and/or folders.

## Use Cases

- **Folder Picker**: Select a directory (use \`filter: { types: ['folder'] }\`)
- **File Picker**: Select files (use \`filter: { types: ['file'] }\`)
- **Mixed Picker**: Select either files or folders
- **Extension Filter**: Select specific file types (use \`filter: { extensions: ['.ts', '.tsx'] }\`)

## Features

- Tree view navigation with expand/collapse
- Breadcrumb navigation for quick parent access
- Direct path input for power users
- Keyboard navigation (arrows, Home, End, PageUp, PageDown)
- Loading and error states
- Real file system or mock data support

## Quick Start

\`\`\`tsx
import { ItemPickerDialog, DiskItemProvider } from '@ui-kit/react-pickers';

// For real file system (requires server)
const provider = new DiskItemProvider({ baseUrl: '/api/fs' });

// Folder picker
<ItemPickerDialog
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onSelect={(path) => console.log('Selected:', path)}
  provider={provider}
  filter={{ types: ['folder'] }}
  title="Select Folder"
/>

// File picker
<ItemPickerDialog
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onSelect={(path) => console.log('Selected:', path)}
  provider={provider}
  filter={{ types: ['file'], extensions: ['.ts', '.tsx'] }}
  title="Select TypeScript File"
/>
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Reusable demo wrapper
const PickerDemo = (props: Partial<React.ComponentProps<typeof ItemPickerDialog>> & {
  providerType?: 'mock' | 'disk';
  buttonLabel?: string;
}) => {
  const { providerType = 'mock', buttonLabel = 'Open Picker', ...restProps } = props;
  const [open, setOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string>('');

  const provider = useMemo(() => {
    if (providerType === 'disk') {
      return new DiskItemProvider({ baseUrl: '/api/fs' });
    }
    return new MockItemProvider(mockProviderData, { delay: 300 });
  }, [providerType]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Button onClick={() => setOpen(true)}>{buttonLabel}</Button>
      {selectedPath && (
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--base-fg-soft)' }}>
          Selected: <code style={{ fontFamily: 'var(--font-mono)' }}>{selectedPath}</code>
        </div>
      )}
      <ItemPickerDialog
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(path) => {
          setSelectedPath(path);
          setOpen(false);
        }}
        provider={provider}
        {...restProps}
      />
    </div>
  );
};

// =========================================
// Folders Only (Mock)
// =========================================

export const FoldersOnly: Story = {
  render: () => (
    <PickerDemo
      providerType="mock"
      filter={{ types: ['folder'] }}
      title="Select Folder"
      buttonLabel="Select Folder"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
Use \`filter: { types: ['folder'] }\` to show only folders.

\`\`\`tsx
<ItemPickerDialog
  provider={provider}
  filter={{ types: ['folder'] }}
  title="Select Folder"
/>
\`\`\`
        `,
      },
    },
  },
};

// =========================================
// Files Only (Mock)
// =========================================

export const FilesOnly: Story = {
  render: () => (
    <PickerDemo
      providerType="mock"
      filter={{ types: ['file'] }}
      title="Select File"
      buttonLabel="Select File"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
Use \`filter: { types: ['file'] }\` to show only files. Folders are still shown for navigation but can't be selected.

\`\`\`tsx
<ItemPickerDialog
  provider={provider}
  filter={{ types: ['file'] }}
  title="Select File"
/>
\`\`\`
        `,
      },
    },
  },
};

// =========================================
// Files and Folders (Mock)
// =========================================

export const FilesAndFolders: Story = {
  render: () => (
    <PickerDemo
      providerType="mock"
      title="Select Item"
      buttonLabel="Select File or Folder"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
Without a filter, both files and folders are shown and selectable.

\`\`\`tsx
<ItemPickerDialog
  provider={provider}
  title="Select Item"
/>
\`\`\`
        `,
      },
    },
  },
};

// =========================================
// TypeScript Files Only (Mock)
// =========================================

export const TypeScriptFilesOnly: Story = {
  render: () => (
    <PickerDemo
      providerType="mock"
      filter={{ types: ['file', 'folder'], extensions: ['.ts', '.tsx'] }}
      title="Select TypeScript File"
      buttonLabel="Select .ts/.tsx File"
      initialPath="/Users/alice/Projects/react-app"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
Use \`filter: { extensions: ['.ts', '.tsx'] }\` to filter by file extension. Include 'folder' in types to allow navigation.

\`\`\`tsx
<ItemPickerDialog
  provider={provider}
  filter={{ types: ['file', 'folder'], extensions: ['.ts', '.tsx'] }}
  title="Select TypeScript File"
/>
\`\`\`
        `,
      },
    },
  },
};

// =========================================
// Real File System - Folders
// =========================================

export const DiskFoldersOnly: Story = {
  render: () => (
    <PickerDemo
      providerType="disk"
      filter={{ types: ['folder'] }}
      title="Select Folder"
      buttonLabel="Browse Folders (Real FS)"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
Uses \`DiskItemProvider\` to browse your **real file system**. In Storybook, this works via built-in middleware.

\`\`\`tsx
const provider = new DiskItemProvider({ baseUrl: '/api/fs' });

<ItemPickerDialog
  provider={provider}
  filter={{ types: ['folder'] }}
  title="Select Folder"
/>
\`\`\`
        `,
      },
    },
  },
};

// =========================================
// Real File System - Files and Folders
// =========================================

export const DiskFilesAndFolders: Story = {
  render: () => (
    <PickerDemo
      providerType="disk"
      title="Select Item"
      buttonLabel="Browse Files (Real FS)"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Browse real file system with both files and folders visible.',
      },
    },
  },
};

// =========================================
// Legacy: Using onListDirectory callback
// =========================================

const mockListDirectory = async (path: string): Promise<FolderEntry[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const items = mockProviderData[path] || [];
  return items
    .filter(item => item.type === 'folder')
    .map(item => ({
      name: item.name,
      path: item.path,
      hasChildren: item.hasChildren,
      type: item.type,
    }));
};

export const LegacyCallback: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [selectedPath, setSelectedPath] = useState<string>('');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Button onClick={() => setOpen(true)}>Open (Legacy API)</Button>
        {selectedPath && (
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--base-fg-soft)' }}>
            Selected: <code style={{ fontFamily: 'var(--font-mono)' }}>{selectedPath}</code>
          </div>
        )}
        <ItemPickerDialog
          open={open}
          onClose={() => setOpen(false)}
          onSelect={(path) => {
            setSelectedPath(path);
            setOpen(false);
          }}
          onListDirectory={mockListDirectory}
          title="Select Folder (Legacy)"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
The legacy \`onListDirectory\` callback API is still supported for backwards compatibility.

\`\`\`tsx
// Legacy API (deprecated)
<ItemPickerDialog
  onListDirectory={async (path) => fetchFolders(path)}
/>

// Preferred: Use provider
<ItemPickerDialog
  provider={new DiskItemProvider({ baseUrl: '/api/fs' })}
/>
\`\`\`
        `,
      },
    },
  },
};
