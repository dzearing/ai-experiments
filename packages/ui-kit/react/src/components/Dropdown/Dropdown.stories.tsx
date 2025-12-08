import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown } from './Dropdown';
import { Button } from '../Button';

const meta: Meta<typeof Dropdown> = {
  title: 'Overlays/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Menu that appears below a trigger element with selectable options.

## When to Use

- Action menus (Edit, Delete, Share)
- Context menus
- Navigation dropdowns
- Selection from many options

## Dropdown vs Select

| Component | Use Case |
|-----------|----------|
| **Dropdown** | Actions, navigation, rich content |
| **Select** | Form input, value selection |

## Features

- **icon**: Add icons to menu items
- **shortcut**: Display keyboard shortcuts
- **divider**: Group related items with separators
- **disabled**: Disable specific items
        `,
      },
    },
  },
  argTypes: {
    position: {
      control: 'select',
      options: ['bottom-start', 'bottom-end', 'top-start', 'top-end'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// SVG Icon components for stories
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M11.498 2.502a2.5 2.5 0 013.536 3.536l-8.5 8.5a1 1 0 01-.39.242l-3 1a1 1 0 01-1.212-1.212l1-3a1 1 0 01.242-.39l8.5-8.5z"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 2a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V2zm2 0v8h6V2H6z"/>
    <path d="M2 4a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2v-1H8v1H2V6h1V4H2z"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M11 2.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM11 9.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM5 6a2.5 2.5 0 110 5 2.5 2.5 0 010-5z"/>
    <path d="M7.35 8.15l4 2.5-.7 1.1-4-2.5.7-1.1zM11.35 5.85l-4 2.5-.7-1.1 4-2.5.7 1.1z"/>
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5 2V1a1 1 0 011-1h4a1 1 0 011 1v1h3a1 1 0 110 2h-1v10a2 2 0 01-2 2H5a2 2 0 01-2-2V4H2a1 1 0 010-2h3zm1 0h4V1H6v1zM4 4v10h8V4H4z"/>
  </svg>
);

const UndoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 3a5 5 0 110 10 5 5 0 010-10zm0-2a7 7 0 100 14A7 7 0 008 1z"/>
    <path d="M8 4l-3 3 3 3v-2a2 2 0 010 4v1a3 3 0 100-6V4z"/>
  </svg>
);

const RedoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 3a5 5 0 100 10 5 5 0 000-10zm0-2a7 7 0 110 14A7 7 0 018 1z"/>
    <path d="M8 4l3 3-3 3v-2a2 2 0 100 4v1a3 3 0 110-6V4z"/>
  </svg>
);

const defaultItems = [
  { label: 'Edit', value: 'edit' },
  { label: 'Duplicate', value: 'duplicate' },
  { label: 'Archive', value: 'archive' },
  { label: 'Delete', value: 'delete' },
];

export const Default: Story = {
  render: () => (
    <Dropdown
      items={defaultItems}
      onSelect={(value) => console.log('Selected:', value)}
    >
      <Button>Actions</Button>
    </Dropdown>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Dropdown
      items={[
        { label: 'Edit', value: 'edit', icon: <EditIcon /> },
        { label: 'Copy', value: 'copy', icon: <CopyIcon /> },
        { label: 'Share', value: 'share', icon: <ShareIcon /> },
        { label: 'Delete', value: 'delete', icon: <DeleteIcon /> },
      ]}
      onSelect={(value) => console.log('Selected:', value)}
    >
      <Button>More Actions</Button>
    </Dropdown>
  ),
};

export const WithShortcuts: Story = {
  render: () => (
    <Dropdown
      items={[
        { label: 'Undo', value: 'undo', icon: <UndoIcon />, shortcut: '⌘Z' },
        { label: 'Redo', value: 'redo', icon: <RedoIcon />, shortcut: '⌘⇧Z', divider: true },
        { label: 'Cut', value: 'cut', shortcut: '⌘X' },
        { label: 'Copy', value: 'copy', icon: <CopyIcon />, shortcut: '⌘C' },
        { label: 'Paste', value: 'paste', shortcut: '⌘V', divider: true },
        { label: 'Delete', value: 'delete', icon: <DeleteIcon />, shortcut: '⌫' },
      ]}
      onSelect={(value) => console.log('Selected:', value)}
    >
      <Button>Edit Menu</Button>
    </Dropdown>
  ),
};

export const WithDividers: Story = {
  render: () => (
    <Dropdown
      items={[
        { label: 'New File', value: 'new', shortcut: '⌘N' },
        { label: 'Open', value: 'open', shortcut: '⌘O' },
        { label: 'Save', value: 'save', shortcut: '⌘S', divider: true },
        { label: 'Export as PDF', value: 'pdf' },
        { label: 'Export as PNG', value: 'png', divider: true },
        { label: 'Settings', value: 'settings' },
      ]}
      onSelect={(value) => console.log('Selected:', value)}
    >
      <Button variant="primary">File</Button>
    </Dropdown>
  ),
};

export const WithDisabled: Story = {
  render: () => (
    <Dropdown
      items={[
        { label: 'View', value: 'view' },
        { label: 'Edit', value: 'edit' },
        { label: 'Share', value: 'share', disabled: true },
        { label: 'Delete', value: 'delete', disabled: true },
      ]}
      onSelect={(value) => console.log('Selected:', value)}
    >
      <Button>Options</Button>
    </Dropdown>
  ),
};

export const Positions: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', padding: '100px' }}>
      <Dropdown
        items={defaultItems}
        onSelect={(v) => console.log(v)}
        position="bottom-start"
      >
        <Button variant="outline">Bottom Start</Button>
      </Dropdown>
      <Dropdown
        items={defaultItems}
        onSelect={(v) => console.log(v)}
        position="bottom-end"
      >
        <Button variant="outline">Bottom End</Button>
      </Dropdown>
    </div>
  ),
};

export const CompleteExample: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Dropdown
        items={[
          { label: 'Undo', value: 'undo', icon: <UndoIcon />, shortcut: '⌘Z' },
          { label: 'Redo', value: 'redo', icon: <RedoIcon />, shortcut: '⌘⇧Z', divider: true },
          { label: 'Cut', value: 'cut', shortcut: '⌘X' },
          { label: 'Copy', value: 'copy', icon: <CopyIcon />, shortcut: '⌘C' },
          { label: 'Paste', value: 'paste', shortcut: '⌘V' },
        ]}
        onSelect={(value) => console.log('Selected:', value)}
      >
        <Button>Edit</Button>
      </Dropdown>
      <Dropdown
        items={[
          { label: 'New File', value: 'new-file', shortcut: '⌘N' },
          { label: 'New Folder', value: 'new-folder', shortcut: '⌘⇧N', divider: true },
          { label: 'Open...', value: 'open', shortcut: '⌘O' },
          { label: 'Save', value: 'save', shortcut: '⌘S' },
          { label: 'Save As...', value: 'save-as', shortcut: '⌘⇧S', divider: true },
          { label: 'Close', value: 'close', shortcut: '⌘W' },
        ]}
        onSelect={(value) => console.log('Selected:', value)}
      >
        <Button>File</Button>
      </Dropdown>
      <Dropdown
        items={[
          { label: 'Share Link', value: 'share-link', icon: <ShareIcon /> },
          { label: 'Share via Email', value: 'share-email' },
          { label: 'Export', value: 'export', disabled: true },
        ]}
        onSelect={(value) => console.log('Selected:', value)}
      >
        <Button variant="primary">Share</Button>
      </Dropdown>
    </div>
  ),
};
