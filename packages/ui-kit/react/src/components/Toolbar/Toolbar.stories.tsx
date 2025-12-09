import type { Meta, StoryObj } from '@storybook/react';
import { Toolbar, ToolbarGroup, ToolbarDivider, ToolbarSpacer, ButtonGroup } from './Toolbar';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Panel } from '../Panel';

/**
 * # Toolbar
 *
 * Horizontal bar for organizing actions and tools.
 *
 * ## Features
 *
 * - Groups for organizing related actions
 * - Dividers for visual separation
 * - Spacers for flexible alignment
 * - ButtonGroup for connected buttons
 * - Size variants (sm, md, lg)
 * - Multiple visual variants
 * - Horizontal and vertical orientations
 *
 * ## Usage
 *
 * ```tsx
 * import { Toolbar, ToolbarGroup, ToolbarDivider, ToolbarSpacer, ButtonGroup } from '@ui-kit/react';
 *
 * <Toolbar>
 *   <ToolbarGroup>
 *     <IconButton aria-label="Undo">↩️</IconButton>
 *     <IconButton aria-label="Redo">↪️</IconButton>
 *   </ToolbarGroup>
 *   <ToolbarDivider />
 *   <ButtonGroup>
 *     <Button>Bold</Button>
 *     <Button>Italic</Button>
 *   </ButtonGroup>
 *   <ToolbarSpacer />
 *   <Button>Save</Button>
 * </Toolbar>
 * ```
 *
 * @see [Example: File Explorer](/docs/example-pages-fileexplorer--docs)
 */

const meta: Meta<typeof Toolbar> = {
  title: 'Layout/Toolbar',
  component: Toolbar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The Toolbar component organizes actions in a horizontal (or vertical) bar.

## Subcomponents

| Component | Description |
|-----------|-------------|
| **Toolbar** | Container for toolbar items |
| **ToolbarGroup** | Groups related items together |
| **ToolbarDivider** | Visual separator between groups |
| **ToolbarSpacer** | Flexible space to push items apart |
| **ButtonGroup** | Connected buttons that appear as one unit |

## Variants

| Variant | Description |
|---------|-------------|
| **default** | Minimal styling |
| **bordered** | Border around the toolbar |
| **floating** | Elevated with shadow |
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toolbar>;

// Icon components for examples
const UndoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 8a6 6 0 1 1 1.5 4l1-1A4.5 4.5 0 1 0 3.5 8H6L2.5 11.5 2 11l-2-3h2z" />
  </svg>
);

const RedoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M14 8a6 6 0 1 0-1.5 4l-1-1A4.5 4.5 0 1 1 12.5 8H10l3.5 3.5.5-.5 2-3h-2z" />
  </svg>
);

const BoldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 2h5.5a3.5 3.5 0 0 1 2.45 6A3.5 3.5 0 0 1 9.5 14H4V2zm2 5h3.5a1.5 1.5 0 0 0 0-3H6v3zm0 2v3h3.5a1.5 1.5 0 0 0 0-3H6z" />
  </svg>
);

const ItalicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M6 2h6v2h-2.5L7 12h2v2H3v-2h2.5L8 4H6V2z" />
  </svg>
);

const UnderlineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 2v6a4 4 0 0 0 8 0V2h2v6a6 6 0 0 1-12 0V2h2zm-2 12h12v2H2v-2z" />
  </svg>
);

const AlignLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 2h12v2H2V2zm0 4h8v2H2V6zm0 4h10v2H2v-2zm0 4h6v2H2v-2z" />
  </svg>
);

const AlignCenterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 2h12v2H2V2zm2 4h8v2H4V6zm1 4h6v2H5v-2zm2 4h2v2H7v-2z" />
  </svg>
);

const AlignRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 2h12v2H2V2zm4 4h8v2H6V6zm2 4h6v2H8v-2zm4 4h2v2h-2v-2z" />
  </svg>
);

export const Default: Story = {
  render: () => (
    <Toolbar>
      <IconButton aria-label="Undo" size="sm"><UndoIcon /></IconButton>
      <IconButton aria-label="Redo" size="sm"><RedoIcon /></IconButton>
      <ToolbarDivider />
      <IconButton aria-label="Bold" size="sm"><BoldIcon /></IconButton>
      <IconButton aria-label="Italic" size="sm"><ItalicIcon /></IconButton>
      <IconButton aria-label="Underline" size="sm"><UnderlineIcon /></IconButton>
      <ToolbarDivider />
      <IconButton aria-label="Align Left" size="sm"><AlignLeftIcon /></IconButton>
      <IconButton aria-label="Align Center" size="sm"><AlignCenterIcon /></IconButton>
      <IconButton aria-label="Align Right" size="sm"><AlignRightIcon /></IconButton>
    </Toolbar>
  ),
};

// With groups
export const WithGroups: Story = {
  render: () => (
    <Toolbar variant="bordered">
      <ToolbarGroup>
        <IconButton aria-label="Undo" size="sm"><UndoIcon /></IconButton>
        <IconButton aria-label="Redo" size="sm"><RedoIcon /></IconButton>
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup>
        <IconButton aria-label="Bold" size="sm"><BoldIcon /></IconButton>
        <IconButton aria-label="Italic" size="sm"><ItalicIcon /></IconButton>
        <IconButton aria-label="Underline" size="sm"><UnderlineIcon /></IconButton>
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup>
        <IconButton aria-label="Align Left" size="sm"><AlignLeftIcon /></IconButton>
        <IconButton aria-label="Align Center" size="sm"><AlignCenterIcon /></IconButton>
        <IconButton aria-label="Align Right" size="sm"><AlignRightIcon /></IconButton>
      </ToolbarGroup>
    </Toolbar>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use `ToolbarGroup` to visually organize related actions.',
      },
    },
  },
};

// With spacer
export const WithSpacer: Story = {
  render: () => (
    <Toolbar variant="bordered" style={{ width: '100%' }}>
      <ToolbarGroup>
        <IconButton aria-label="Undo" size="sm"><UndoIcon /></IconButton>
        <IconButton aria-label="Redo" size="sm"><RedoIcon /></IconButton>
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup>
        <IconButton aria-label="Bold" size="sm"><BoldIcon /></IconButton>
        <IconButton aria-label="Italic" size="sm"><ItalicIcon /></IconButton>
      </ToolbarGroup>
      <ToolbarSpacer />
      <Button size="sm" variant="primary">Save</Button>
    </Toolbar>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use `ToolbarSpacer` to push items to opposite ends of the toolbar.',
      },
    },
  },
};

// Button groups
export const WithButtonGroup: Story = {
  render: () => (
    <Toolbar variant="bordered">
      <ButtonGroup>
        <Button size="sm" variant="outline"><AlignLeftIcon /></Button>
        <Button size="sm" variant="outline"><AlignCenterIcon /></Button>
        <Button size="sm" variant="outline"><AlignRightIcon /></Button>
      </ButtonGroup>
      <ToolbarDivider />
      <ButtonGroup>
        <Button size="sm" variant="outline"><BoldIcon /></Button>
        <Button size="sm" variant="outline"><ItalicIcon /></Button>
        <Button size="sm" variant="outline"><UnderlineIcon /></Button>
      </ButtonGroup>
    </Toolbar>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use `ButtonGroup` to connect buttons visually into a single unit.',
      },
    },
  },
};

// Variants
export const Variants: Story = {
  render: () => (
    <Stack gap="lg">
      <div>
        <Text size="sm" weight="medium" style={{ marginBottom: 'var(--space-2)' }}>Default</Text>
        <Toolbar>
          <IconButton aria-label="Undo" size="sm"><UndoIcon /></IconButton>
          <IconButton aria-label="Redo" size="sm"><RedoIcon /></IconButton>
          <ToolbarDivider />
          <Button size="sm">Action</Button>
        </Toolbar>
      </div>
      <div>
        <Text size="sm" weight="medium" style={{ marginBottom: 'var(--space-2)' }}>Bordered</Text>
        <Toolbar variant="bordered">
          <IconButton aria-label="Undo" size="sm"><UndoIcon /></IconButton>
          <IconButton aria-label="Redo" size="sm"><RedoIcon /></IconButton>
          <ToolbarDivider />
          <Button size="sm">Action</Button>
        </Toolbar>
      </div>
      <div>
        <Text size="sm" weight="medium" style={{ marginBottom: 'var(--space-2)' }}>Floating</Text>
        <Toolbar variant="floating">
          <IconButton aria-label="Undo" size="sm"><UndoIcon /></IconButton>
          <IconButton aria-label="Redo" size="sm"><RedoIcon /></IconButton>
          <ToolbarDivider />
          <Button size="sm">Action</Button>
        </Toolbar>
      </div>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Toolbar supports default, bordered, and floating variants.',
      },
    },
  },
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <Stack gap="lg">
      <div>
        <Text size="sm" weight="medium" style={{ marginBottom: 'var(--space-2)' }}>Small</Text>
        <Toolbar variant="bordered" size="sm">
          <IconButton aria-label="Undo" size="sm"><UndoIcon /></IconButton>
          <IconButton aria-label="Redo" size="sm"><RedoIcon /></IconButton>
          <ToolbarDivider />
          <Button size="sm">Action</Button>
        </Toolbar>
      </div>
      <div>
        <Text size="sm" weight="medium" style={{ marginBottom: 'var(--space-2)' }}>Medium</Text>
        <Toolbar variant="bordered" size="md">
          <IconButton aria-label="Undo"><UndoIcon /></IconButton>
          <IconButton aria-label="Redo"><RedoIcon /></IconButton>
          <ToolbarDivider />
          <Button>Action</Button>
        </Toolbar>
      </div>
      <div>
        <Text size="sm" weight="medium" style={{ marginBottom: 'var(--space-2)' }}>Large</Text>
        <Toolbar variant="bordered" size="lg">
          <IconButton aria-label="Undo" size="lg"><UndoIcon /></IconButton>
          <IconButton aria-label="Redo" size="lg"><RedoIcon /></IconButton>
          <ToolbarDivider />
          <Button size="lg">Action</Button>
        </Toolbar>
      </div>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Toolbar supports sm, md, and lg sizes.',
      },
    },
  },
};

// Vertical orientation
export const Vertical: Story = {
  render: () => (
    <div style={{ display: 'flex', height: 300 }}>
      <Toolbar orientation="vertical" variant="bordered">
        <IconButton aria-label="Undo" size="sm"><UndoIcon /></IconButton>
        <IconButton aria-label="Redo" size="sm"><RedoIcon /></IconButton>
        <ToolbarDivider />
        <IconButton aria-label="Bold" size="sm"><BoldIcon /></IconButton>
        <IconButton aria-label="Italic" size="sm"><ItalicIcon /></IconButton>
        <IconButton aria-label="Underline" size="sm"><UnderlineIcon /></IconButton>
        <ToolbarSpacer />
        <IconButton aria-label="Settings" size="sm">⚙️</IconButton>
      </Toolbar>
      <Panel style={{ flex: 1, marginLeft: 'var(--space-3)', padding: 'var(--space-3)' }}>
        <Text color="soft">Content area</Text>
      </Panel>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Set `orientation="vertical"` for a vertical toolbar layout.',
      },
    },
  },
};

// Text editor toolbar
export const TextEditor: Story = {
  render: () => (
    <Panel style={{ width: 600 }}>
      <Toolbar variant="bordered" style={{ borderBottom: '1px solid var(--panel-border)' }}>
        <ToolbarGroup>
          <IconButton aria-label="Undo" size="sm"><UndoIcon /></IconButton>
          <IconButton aria-label="Redo" size="sm"><RedoIcon /></IconButton>
        </ToolbarGroup>
        <ToolbarDivider />
        <ButtonGroup>
          <Button size="sm" variant="outline"><BoldIcon /></Button>
          <Button size="sm" variant="outline"><ItalicIcon /></Button>
          <Button size="sm" variant="outline"><UnderlineIcon /></Button>
        </ButtonGroup>
        <ToolbarDivider />
        <ButtonGroup>
          <Button size="sm" variant="outline"><AlignLeftIcon /></Button>
          <Button size="sm" variant="outline"><AlignCenterIcon /></Button>
          <Button size="sm" variant="outline"><AlignRightIcon /></Button>
        </ButtonGroup>
        <ToolbarSpacer />
        <Button size="sm" variant="primary">Publish</Button>
      </Toolbar>
      <div style={{ padding: 'var(--space-3)', minHeight: 200 }}>
        <Text color="soft">Start typing...</Text>
      </div>
    </Panel>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A practical text editor toolbar combining multiple features.',
      },
    },
  },
};

// File actions toolbar
export const FileActions: Story = {
  render: () => (
    <Toolbar variant="floating" style={{ width: 'fit-content' }}>
      <IconButton aria-label="New File" size="sm">📄</IconButton>
      <IconButton aria-label="Open Folder" size="sm">📁</IconButton>
      <IconButton aria-label="Save" size="sm">💾</IconButton>
      <ToolbarDivider />
      <IconButton aria-label="Cut" size="sm">✂️</IconButton>
      <IconButton aria-label="Copy" size="sm">📋</IconButton>
      <IconButton aria-label="Paste" size="sm">📎</IconButton>
      <ToolbarDivider />
      <IconButton aria-label="Search" size="sm">🔍</IconButton>
      <IconButton aria-label="Settings" size="sm">⚙️</IconButton>
    </Toolbar>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A floating toolbar with file action icons.',
      },
    },
  },
};
