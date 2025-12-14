import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Menu, type MenuItem, type MenuItemType } from './Menu';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Panel } from '../Panel';

/**
 * # Menu
 *
 * A versatile menu component for actions, navigation, and context menus with full
 * keyboard navigation, RTL support, and submenu capabilities.
 *
 * ## Features
 *
 * - Click or right-click trigger modes
 * - Full keyboard navigation (arrows, Home/End, PageUp/PageDown)
 * - Nested submenus with hover and keyboard expansion
 * - Item groups with labels
 * - Dividers between sections
 * - Keyboard shortcut display
 * - Disabled items
 * - Danger/destructive actions
 * - Icons support
 * - RTL support (automatically detected)
 * - Controlled and uncontrolled modes
 * - 8 position variants
 *
 * ## Usage
 *
 * ```tsx
 * import { Menu } from '@ui-kit/react';
 *
 * const items = [
 *   { value: 'edit', label: 'Edit', shortcut: 'Cmd+E' },
 *   { value: 'duplicate', label: 'Duplicate', shortcut: 'Cmd+D' },
 *   { type: 'divider' },
 *   { value: 'delete', label: 'Delete', danger: true },
 * ];
 *
 * <Menu items={items} onSelect={(value) => console.log(value)}>
 *   <Button>Open Menu</Button>
 * </Menu>
 * ```
 */

const meta: Meta<typeof Menu> = {
  title: 'Overlays/Menu',
  component: Menu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Contextual overlay displaying a list of actions triggered by click or right-click.

## When to Use

- Context menus with actions for specific items (edit, delete, share)
- Dropdown menus for application actions (user profile, settings)
- More actions overflow menus (...) in toolbars or cards
- Filter or sorting options for data tables
- Navigation menus with grouped sections
- File menus with nested submenus

## Variants

| Item Type | Use Case |
|-----------|----------|
| \`MenuItem\` | Standard clickable action with optional icon and keyboard shortcut |
| \`MenuDivider\` | Visual separator between groups of related actions |
| \`MenuGroup\` | Named group of items with header label |
| \`danger\` | Destructive actions (delete, remove, sign out) styled in red |
| \`disabled\` | Unavailable actions that cannot be clicked |
| \`items\` | Nested submenu items |

## Positioning

8 position options: bottom-start, bottom-end, top-start, top-end, right-start, right-end, left-start, left-end. Auto-flips to stay in viewport.

## Keyboard Navigation

| Key | Action |
|-----|--------|
| **Enter/Space** | Open menu, select item, or expand submenu |
| **Escape** | Close menu or submenu |
| **ArrowDown** | Move to next item |
| **ArrowUp** | Move to previous item |
| **ArrowRight** (LTR) / **ArrowLeft** (RTL) | Expand submenu |
| **ArrowLeft** (LTR) / **ArrowRight** (RTL) | Close submenu |
| **Home** | Move to first item |
| **End** | Move to last item |
| **PageUp/Down** | Move up/down by 10 items |

## RTL Support

RTL is automatically detected from the DOM. In RTL mode, menu aligns to start (right), submenus expand to the left, and arrow key behavior is reversed.

## Accessibility

- \`role="menu"\` and \`role="menuitem"\` for proper screen reader announcements
- Focus trap keeps focus within menu while open
- Click outside or Escape closes menu
        `,
      },
    },
  },
  argTypes: {
    position: {
      control: 'select',
      options: ['bottom-start', 'bottom-end', 'top-start', 'top-end', 'right-start', 'right-end', 'left-start', 'left-end'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Menu>;

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

const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M1 3.5A1.5 1.5 0 012.5 2h3.172a1.5 1.5 0 011.06.44l.829.828a.5.5 0 00.353.147H13.5A1.5 1.5 0 0115 4.914V12.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5v-9z"/>
  </svg>
);

// Basic menu items
const basicItems: MenuItem[] = [
  { value: 'new', label: 'New File', shortcut: 'Cmd+N' },
  { value: 'open', label: 'Open...', shortcut: 'Cmd+O' },
  { value: 'save', label: 'Save', shortcut: 'Cmd+S' },
  { value: 'save-as', label: 'Save As...', shortcut: 'Cmd+Shift+S' },
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
  { value: 'edit', label: 'Edit', icon: <EditIcon />, shortcut: 'Cmd+E' },
  { value: 'copy', label: 'Copy', icon: <CopyIcon />, shortcut: 'Cmd+C' },
  { value: 'share', label: 'Share', icon: <ShareIcon /> },
  { value: 'delete', label: 'Delete', icon: <DeleteIcon /> },
];

export const WithIcons: Story = {
  render: () => (
    <Menu items={iconItems} onSelect={(value) => console.log(value)}>
      <Button>More Actions</Button>
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

// Menu with shortcuts and dividers
const shortcutItems: MenuItemType[] = [
  { value: 'undo', label: 'Undo', icon: <UndoIcon />, shortcut: '⌘Z' },
  { value: 'redo', label: 'Redo', icon: <RedoIcon />, shortcut: '⌘⇧Z' },
  { type: 'divider' },
  { value: 'cut', label: 'Cut', shortcut: '⌘X' },
  { value: 'copy', label: 'Copy', icon: <CopyIcon />, shortcut: '⌘C' },
  { value: 'paste', label: 'Paste', shortcut: '⌘V' },
  { type: 'divider' },
  { value: 'select-all', label: 'Select All', shortcut: '⌘A' },
];

export const WithShortcuts: Story = {
  render: () => (
    <Menu items={shortcutItems} onSelect={(value) => console.log(value)}>
      <Button>Edit Menu</Button>
    </Menu>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Display keyboard shortcuts alongside menu items.',
      },
    },
  },
};

export const WithDividers: Story = {
  render: () => (
    <Menu items={shortcutItems} onSelect={(value) => console.log(value)}>
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
const menuWithGroups: MenuItemType[] = [
  {
    type: 'group',
    label: 'File',
    items: [
      { value: 'new', label: 'New' },
      { value: 'open', label: 'Open' },
      { value: 'save', label: 'Save' },
    ],
  },
  {
    type: 'group',
    label: 'Edit',
    items: [
      { value: 'cut', label: 'Cut' },
      { value: 'copy', label: 'Copy' },
      { value: 'paste', label: 'Paste' },
    ],
  },
];

export const WithGroups: Story = {
  render: () => (
    <Menu items={menuWithGroups} onSelect={(value) => console.log(value)}>
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

// Menu with danger items
const dangerItems: MenuItem[] = [
  { value: 'view', label: 'View Details' },
  { value: 'edit', label: 'Edit' },
  { value: 'share', label: 'Share', disabled: true },
  { value: 'archive', label: 'Archive' },
  { value: 'delete', label: 'Delete', danger: true },
];

export const WithDangerItems: Story = {
  render: () => (
    <Menu items={dangerItems} onSelect={(value) => console.log(value)}>
      <Button>Actions</Button>
    </Menu>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Items can be marked as dangerous/destructive (red styling) or disabled.',
      },
    },
  },
};

// Menu with submenus
const submenuItems: MenuItem[] = [
  { value: 'new-file', label: 'New File', shortcut: '⌘N' },
  {
    value: 'new-template',
    label: 'New From Template',
    icon: <FolderIcon />,
    items: [
      { value: 'template-react', label: 'React Component' },
      { value: 'template-ts', label: 'TypeScript Module' },
      { value: 'template-test', label: 'Test File' },
      { value: 'template-story', label: 'Story File' },
    ],
  },
  { value: 'open', label: 'Open...', shortcut: '⌘O' },
  {
    value: 'recent',
    label: 'Recent Files',
    items: [
      { value: 'recent-app', label: 'App.tsx' },
      { value: 'recent-index', label: 'index.ts' },
      { value: 'recent-styles', label: 'styles.css' },
    ],
  },
  { value: 'save', label: 'Save', shortcut: '⌘S' },
  {
    value: 'export',
    label: 'Export',
    items: [
      { value: 'export-pdf', label: 'PDF' },
      { value: 'export-png', label: 'PNG' },
      { value: 'export-svg', label: 'SVG' },
      { value: 'export-json', label: 'JSON' },
    ],
  },
];

export const WithSubmenus: Story = {
  render: () => (
    <Menu items={submenuItems} onSelect={(value) => console.log(value)}>
      <Button>File</Button>
    </Menu>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Items can have nested submenus that expand on hover or keyboard navigation.',
      },
    },
  },
};

// Nested submenus
const nestedItems: MenuItem[] = [
  { value: 'view', label: 'View' },
  {
    value: 'insert',
    label: 'Insert',
    items: [
      { value: 'insert-text', label: 'Text' },
      {
        value: 'insert-shape',
        label: 'Shape',
        items: [
          { value: 'shape-rect', label: 'Rectangle' },
          { value: 'shape-circle', label: 'Circle' },
          { value: 'shape-triangle', label: 'Triangle' },
        ],
      },
      { value: 'insert-image', label: 'Image' },
      { value: 'insert-video', label: 'Video' },
    ],
  },
  { value: 'format', label: 'Format' },
];

export const NestedSubmenus: Story = {
  render: () => (
    <Menu items={nestedItems} onSelect={(value) => console.log(value)}>
      <Button>Edit</Button>
    </Menu>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Submenus can be nested multiple levels deep.',
      },
    },
  },
};

// Context menu (right-click)
export const ContextMenu: Story = {
  render: () => {
    const contextItems: MenuItem[] = [
      { value: 'open', label: 'Open' },
      { value: 'open-new-tab', label: 'Open in New Tab' },
      { value: 'copy-link', label: 'Copy Link' },
      { value: 'bookmark', label: 'Add Bookmark' },
    ];

    return (
      <Menu items={contextItems} onSelect={(value) => console.log(value)} contextMenu>
        <Panel padding="lg" style={{ width: 300, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text color="soft">Right-click anywhere in this area</Text>
        </Panel>
      </Menu>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Set `contextMenu={true}` to trigger the menu on right-click instead of left-click.',
      },
    },
  },
};

// Controlled mode
export const ControlledMode: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const items: MenuItem[] = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ];

    return (
      <Stack gap="md" align="center">
        <Stack gap="sm" direction="row">
          <Button variant="outline" onClick={() => setIsOpen(true)}>Open Menu</Button>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Close Menu</Button>
        </Stack>
        <Menu
          items={items}
          onSelect={(value) => {
            console.log(value);
            setIsOpen(false);
          }}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        >
          <Button>Controlled Menu</Button>
        </Menu>
        <Text size="sm" color="soft">
          Menu is {isOpen ? 'open' : 'closed'}
        </Text>
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Use `isOpen` and `onOpenChange` props to control the menu state externally.',
      },
    },
  },
};

// RTL Support
export const RTLSupport: Story = {
  render: () => (
    <div dir="rtl" style={{ textAlign: 'right' }}>
      <Menu
        items={[
          { value: 'edit', label: 'עריכה' },
          {
            value: 'share',
            label: 'שיתוף',
            items: [
              { value: 'share-link', label: 'קישור' },
              { value: 'share-email', label: 'אימייל' },
              { value: 'share-message', label: 'הודעה' },
            ],
          },
          { value: 'delete', label: 'מחיקה', danger: true },
        ]}
        onSelect={(value) => console.log(value)}
      >
        <Button>פעולות</Button>
      </Menu>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'RTL is automatically detected from the DOM. In RTL mode, submenus expand to the left and arrow key behavior is reversed.',
      },
    },
  },
};

// Different positions
export const Positions: Story = {
  render: () => {
    const items: MenuItem[] = [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
      { value: '3', label: 'Option 3' },
    ];

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '100px' }}>
        <Menu items={items} onSelect={() => {}} position="bottom-start">
          <Button variant="outline" size="sm">Bottom Start</Button>
        </Menu>
        <Menu items={items} onSelect={() => {}} position="bottom-end">
          <Button variant="outline" size="sm">Bottom End</Button>
        </Menu>
        <Menu items={items} onSelect={() => {}} position="top-start">
          <Button variant="outline" size="sm">Top Start</Button>
        </Menu>
        <Menu items={items} onSelect={() => {}} position="top-end">
          <Button variant="outline" size="sm">Top End</Button>
        </Menu>
        <Menu items={items} onSelect={() => {}} position="right-start">
          <Button variant="outline" size="sm">Right Start</Button>
        </Menu>
        <Menu items={items} onSelect={() => {}} position="right-end">
          <Button variant="outline" size="sm">Right End</Button>
        </Menu>
        <Menu items={items} onSelect={() => {}} position="left-start">
          <Button variant="outline" size="sm">Left Start</Button>
        </Menu>
        <Menu items={items} onSelect={() => {}} position="left-end">
          <Button variant="outline" size="sm">Left End</Button>
        </Menu>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Control menu position relative to the trigger element with 8 position options.',
      },
    },
  },
};

// Keyboard navigation demo
export const KeyboardNavigation: Story = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <Text size="sm" color="soft" style={{ marginBottom: '16px', display: 'block' }}>
        Tab to the button, press Enter to open, use arrows to navigate, Enter to select, Escape to close.
      </Text>
      <Menu
        items={[
          { value: '1', label: 'Item 1' },
          { value: '2', label: 'Item 2' },
          { value: '3', label: 'Item 3 (disabled)', disabled: true },
          { value: '4', label: 'Item 4' },
          {
            value: 'submenu',
            label: 'Submenu',
            items: [
              { value: 'a', label: 'Sub Item A' },
              { value: 'b', label: 'Sub Item B' },
              { value: 'c', label: 'Sub Item C' },
            ],
          },
          { value: '5', label: 'Item 5' },
        ]}
        onSelect={(value) => console.log('Selected:', value)}
      >
        <Button>Test Keyboard</Button>
      </Menu>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full keyboard navigation support including arrow keys, Home/End, PageUp/PageDown, Enter/Space for selection, and Escape to close.',
      },
    },
  },
};

// With IconButton trigger
export const WithIconButton: Story = {
  render: () => {
    const items: MenuItem[] = [
      { value: 'settings', label: 'Settings', icon: <span>⚙️</span> },
      { value: 'profile', label: 'Profile', icon: <span>👤</span> },
      { value: 'help', label: 'Help', icon: <span>❓</span> },
      { value: 'logout', label: 'Log Out', icon: <span>🚪</span>, danger: true },
    ];

    return (
      <Menu items={items} onSelect={(value) => console.log(value)}>
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
        story: 'Menu can be triggered by any element, including icon buttons for "more options" patterns.',
      },
    },
  },
};

// Complete example
export const CompleteExample: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Menu
        items={[
          { value: 'undo', label: 'Undo', icon: <UndoIcon />, shortcut: '⌘Z' },
          { value: 'redo', label: 'Redo', icon: <RedoIcon />, shortcut: '⌘⇧Z' },
          { type: 'divider' },
          { value: 'cut', label: 'Cut', shortcut: '⌘X' },
          { value: 'copy', label: 'Copy', icon: <CopyIcon />, shortcut: '⌘C' },
          { value: 'paste', label: 'Paste', shortcut: '⌘V' },
        ]}
        onSelect={(value) => console.log(value)}
      >
        <Button>Edit</Button>
      </Menu>
      <Menu
        items={[
          { value: 'new-file', label: 'New File', shortcut: '⌘N' },
          { value: 'new-folder', label: 'New Folder', shortcut: '⌘⇧N' },
          { type: 'divider' },
          { value: 'open', label: 'Open...', shortcut: '⌘O' },
          {
            value: 'recent',
            label: 'Recent Files',
            items: [
              { value: 'recent-1', label: 'App.tsx' },
              { value: 'recent-2', label: 'index.ts' },
              { value: 'recent-3', label: 'styles.css' },
            ],
          },
          { type: 'divider' },
          { value: 'save', label: 'Save', shortcut: '⌘S' },
          { value: 'save-as', label: 'Save As...', shortcut: '⌘⇧S' },
          { type: 'divider' },
          { value: 'close', label: 'Close', shortcut: '⌘W' },
        ]}
        onSelect={(value) => console.log(value)}
      >
        <Button>File</Button>
      </Menu>
      <Menu
        items={[
          { value: 'share-link', label: 'Share Link', icon: <ShareIcon /> },
          { value: 'share-email', label: 'Share via Email' },
          { type: 'divider' },
          { value: 'export', label: 'Export', disabled: true },
          { value: 'delete', label: 'Delete', danger: true, icon: <DeleteIcon /> },
        ]}
        onSelect={(value) => console.log(value)}
      >
        <Button variant="primary">Share</Button>
      </Menu>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A complete example showing multiple menus with various features combined.',
      },
    },
  },
};
