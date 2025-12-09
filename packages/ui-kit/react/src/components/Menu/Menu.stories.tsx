import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Menu, type MenuItem } from './Menu';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Panel } from '../Panel';

/**
 * # Menu
 *
 * A context menu / dropdown menu component for actions and navigation.
 *
 * ## Features
 *
 * - Click or right-click trigger modes
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - Item groups with labels
 * - Dividers between sections
 * - Keyboard shortcut display
 * - Disabled items
 * - Danger/destructive actions
 * - Icons support
 *
 * ## Usage
 *
 * ```tsx
 * import { Menu } from '@ui-kit/react';
 *
 * const items = [
 *   { id: 'edit', label: 'Edit', shortcut: 'Cmd+E' },
 *   { id: 'duplicate', label: 'Duplicate', shortcut: 'Cmd+D' },
 *   { type: 'divider' },
 *   { id: 'delete', label: 'Delete', danger: true },
 * ];
 *
 * <Menu items={items} onSelect={(id) => console.log(id)}>
 *   <Button>Open Menu</Button>
 * </Menu>
 * ```
 *
 * @see [Example: File Explorer](/docs/example-pages-fileexplorer--docs)
 */

const meta: Meta<typeof Menu> = {
  title: 'Overlays/Menu',
  component: Menu,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Menu component provides a dropdown or context menu for actions.

## Item Types

| Type | Description |
|------|-------------|
| **MenuItem** | Standard clickable item with label, icon, shortcut |
| **MenuDivider** | Visual separator between items |
| **MenuGroup** | Named group of items with a label |

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Arrow Down | Move to next item |
| Arrow Up | Move to previous item |
| Enter/Space | Select focused item |
| Escape | Close menu |
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Menu>;

// Basic menu
const basicItems: MenuItem[] = [
  { id: 'new', label: 'New File', shortcut: 'Cmd+N' },
  { id: 'open', label: 'Open...', shortcut: 'Cmd+O' },
  { id: 'save', label: 'Save', shortcut: 'Cmd+S' },
  { id: 'save-as', label: 'Save As...', shortcut: 'Cmd+Shift+S' },
];

export const Default: Story = {
  render: () => {
    const [selected, setSelected] = useState<string | null>(null);

    return (
      <Stack gap="md" align="center">
        <Menu items={basicItems} onSelect={setSelected}>
          <Button>Open Menu</Button>
        </Menu>
        {selected && (
          <Text size="sm" color="soft">
            Selected: {selected}
          </Text>
        )}
      </Stack>
    );
  },
};

// Menu with icons
const iconItems: MenuItem[] = [
  { id: 'cut', label: 'Cut', icon: <span>✂️</span>, shortcut: 'Cmd+X' },
  { id: 'copy', label: 'Copy', icon: <span>📋</span>, shortcut: 'Cmd+C' },
  { id: 'paste', label: 'Paste', icon: <span>📎</span>, shortcut: 'Cmd+V' },
];

export const WithIcons: Story = {
  render: () => (
    <Menu items={iconItems} onSelect={(id) => console.log(id)}>
      <Button>Edit Menu</Button>
    </Menu>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Menu items can include icons for better visual recognition.',
      },
    },
  },
};

// Menu with dividers and groups
const groupedItems = [
  { id: 'undo', label: 'Undo', shortcut: 'Cmd+Z' },
  { id: 'redo', label: 'Redo', shortcut: 'Cmd+Shift+Z' },
  { type: 'divider' as const },
  { id: 'cut', label: 'Cut', shortcut: 'Cmd+X' },
  { id: 'copy', label: 'Copy', shortcut: 'Cmd+C' },
  { id: 'paste', label: 'Paste', shortcut: 'Cmd+V' },
  { type: 'divider' as const },
  { id: 'select-all', label: 'Select All', shortcut: 'Cmd+A' },
];

export const WithDividers: Story = {
  render: () => (
    <Menu items={groupedItems} onSelect={(id) => console.log(id)}>
      <Button>Edit Menu</Button>
    </Menu>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use dividers to visually separate groups of related actions.',
      },
    },
  },
};

// Menu with groups
const menuWithGroups = [
  {
    type: 'group' as const,
    label: 'File',
    items: [
      { id: 'new', label: 'New' },
      { id: 'open', label: 'Open' },
    ],
  },
  {
    type: 'group' as const,
    label: 'Edit',
    items: [
      { id: 'cut', label: 'Cut' },
      { id: 'copy', label: 'Copy' },
      { id: 'paste', label: 'Paste' },
    ],
  },
];

export const WithGroups: Story = {
  render: () => (
    <Menu items={menuWithGroups} onSelect={(id) => console.log(id)}>
      <Button>Grouped Menu</Button>
    </Menu>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Group items with labels for better organization of complex menus.',
      },
    },
  },
};

// Menu with disabled and danger items
const statusItems: MenuItem[] = [
  { id: 'view', label: 'View Details' },
  { id: 'edit', label: 'Edit' },
  { id: 'share', label: 'Share', disabled: true },
  { id: 'archive', label: 'Archive' },
  { id: 'delete', label: 'Delete', danger: true },
];

export const DisabledAndDanger: Story = {
  render: () => (
    <Menu items={statusItems} onSelect={(id) => console.log(id)}>
      <Button>Actions</Button>
    </Menu>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Items can be disabled or marked as dangerous/destructive actions.',
      },
    },
  },
};

// Context menu (right-click)
export const ContextMenu: Story = {
  render: () => {
    const contextItems: MenuItem[] = [
      { id: 'open', label: 'Open' },
      { id: 'open-new-tab', label: 'Open in New Tab' },
      { id: 'copy-link', label: 'Copy Link' },
      { id: 'bookmark', label: 'Add Bookmark' },
    ];

    return (
      <Menu items={contextItems} onSelect={(id) => console.log(id)} contextMenu>
        <Panel padding="lg" style={{ width: 300, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text color="soft">Right-click anywhere in this area</Text>
        </Panel>
      </Menu>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Set `contextMenu={true}` to trigger the menu on right-click.',
      },
    },
  },
};

// Different positions
export const Positions: Story = {
  render: () => {
    const items: MenuItem[] = [
      { id: '1', label: 'Option 1' },
      { id: '2', label: 'Option 2' },
      { id: '3', label: 'Option 3' },
    ];

    return (
      <Stack gap="md" direction="row">
        <Menu items={items} onSelect={() => {}} position="bottom-start">
          <Button variant="outline">Bottom Start</Button>
        </Menu>
        <Menu items={items} onSelect={() => {}} position="bottom-end">
          <Button variant="outline">Bottom End</Button>
        </Menu>
        <Menu items={items} onSelect={() => {}} position="top-start">
          <Button variant="outline">Top Start</Button>
        </Menu>
        <Menu items={items} onSelect={() => {}} position="right-start">
          <Button variant="outline">Right Start</Button>
        </Menu>
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Control menu position relative to the trigger element.',
      },
    },
  },
};

// With IconButton trigger
export const WithIconButton: Story = {
  render: () => {
    const items: MenuItem[] = [
      { id: 'settings', label: 'Settings', icon: <span>⚙️</span> },
      { id: 'profile', label: 'Profile', icon: <span>👤</span> },
      { id: 'help', label: 'Help', icon: <span>❓</span> },
      { type: 'divider' as const } as any,
      { id: 'logout', label: 'Log Out', icon: <span>🚪</span>, danger: true },
    ];

    return (
      <Menu items={items} onSelect={(id) => console.log(id)}>
        <IconButton aria-label="More options">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <circle cx="10" cy="4" r="2" />
            <circle cx="10" cy="10" r="2" />
            <circle cx="10" cy="16" r="2" />
          </svg>
        </IconButton>
      </Menu>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Menu can be triggered by any element, including icon buttons.',
      },
    },
  },
};
