import type { Meta, StoryObj } from '@storybook/react';
import { Toolbar, ToolbarGroup, ToolbarDivider, ToolbarSpacer, ButtonGroup } from './Toolbar';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Panel } from '../Panel';
import {
  UndoIcon,
  RedoIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  GearIcon,
} from '@ui-kit/icons';

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
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Horizontal or vertical bar for organizing actions and tools with groups and spacing.

## When to Use

- Text editor toolbars with formatting actions (bold, italic, alignment)
- Application command bars with file/edit operations
- Data table controls (filter, sort, export buttons)
- Media player controls (play, pause, volume, etc.)
- Form action bars with save/cancel buttons

## Variants

| Variant | Use Case |
|---------|----------|
| \`default\` | Minimal styling, blends with background |
| \`bordered\` | Border around entire toolbar for containment |
| \`floating\` | Elevated with shadow for overlay toolbars |

## Sizes

- **sm**: Compact toolbar with reduced spacing (8px padding)
- **md**: Default comfortable spacing (12px padding)
- **lg**: Spacious toolbar with generous spacing (16px padding)

## Accessibility

- \`role="toolbar"\` with \`aria-orientation\` for proper screen reader announcements
- Tab navigates between toolbar buttons
- Arrow keys for roving tabindex navigation (optional)
- Keyboard shortcuts displayed as hints on buttons
- Grouping helps screen readers announce related actions together

## Usage

\`\`\`tsx
import { Toolbar, ToolbarGroup, ToolbarDivider, ToolbarSpacer, ButtonGroup } from '@ui-kit/react';

<Toolbar variant="bordered">
  <ToolbarGroup>
    <IconButton aria-label="Undo">↩</IconButton>
    <IconButton aria-label="Redo">↪</IconButton>
  </ToolbarGroup>

  <ToolbarDivider />

  <ButtonGroup>
    <Button size="sm">Bold</Button>
    <Button size="sm">Italic</Button>
  </ButtonGroup>

  <ToolbarSpacer />

  <Button variant="primary">Save</Button>
</Toolbar>
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toolbar>;

export const Default: Story = {
  render: () => (
    <Toolbar>
      <IconButton aria-label="Undo" size="sm"><UndoIcon size={16} /></IconButton>
      <IconButton aria-label="Redo" size="sm"><RedoIcon size={16} /></IconButton>
      <ToolbarDivider />
      <IconButton aria-label="Bold" size="sm"><BoldIcon size={16} /></IconButton>
      <IconButton aria-label="Italic" size="sm"><ItalicIcon size={16} /></IconButton>
      <IconButton aria-label="Underline" size="sm"><UnderlineIcon size={16} /></IconButton>
      <ToolbarDivider />
      <IconButton aria-label="Align Left" size="sm"><AlignLeftIcon size={16} /></IconButton>
      <IconButton aria-label="Align Center" size="sm"><AlignCenterIcon size={16} /></IconButton>
      <IconButton aria-label="Align Right" size="sm"><AlignRightIcon size={16} /></IconButton>
    </Toolbar>
  ),
};

// With groups
export const WithGroups: Story = {
  render: () => (
    <Toolbar variant="bordered">
      <ToolbarGroup>
        <IconButton aria-label="Undo" size="sm"><UndoIcon size={16} /></IconButton>
        <IconButton aria-label="Redo" size="sm"><RedoIcon size={16} /></IconButton>
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup>
        <IconButton aria-label="Bold" size="sm"><BoldIcon size={16} /></IconButton>
        <IconButton aria-label="Italic" size="sm"><ItalicIcon size={16} /></IconButton>
        <IconButton aria-label="Underline" size="sm"><UnderlineIcon size={16} /></IconButton>
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup>
        <IconButton aria-label="Align Left" size="sm"><AlignLeftIcon size={16} /></IconButton>
        <IconButton aria-label="Align Center" size="sm"><AlignCenterIcon size={16} /></IconButton>
        <IconButton aria-label="Align Right" size="sm"><AlignRightIcon size={16} /></IconButton>
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
        <IconButton aria-label="Undo" size="sm"><UndoIcon size={16} /></IconButton>
        <IconButton aria-label="Redo" size="sm"><RedoIcon size={16} /></IconButton>
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup>
        <IconButton aria-label="Bold" size="sm"><BoldIcon size={16} /></IconButton>
        <IconButton aria-label="Italic" size="sm"><ItalicIcon size={16} /></IconButton>
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
        <Button size="sm" variant="outline"><AlignLeftIcon size={16} /></Button>
        <Button size="sm" variant="outline"><AlignCenterIcon size={16} /></Button>
        <Button size="sm" variant="outline"><AlignRightIcon size={16} /></Button>
      </ButtonGroup>
      <ToolbarDivider />
      <ButtonGroup>
        <Button size="sm" variant="outline"><BoldIcon size={16} /></Button>
        <Button size="sm" variant="outline"><ItalicIcon size={16} /></Button>
        <Button size="sm" variant="outline"><UnderlineIcon size={16} /></Button>
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
          <IconButton aria-label="Undo" size="sm"><UndoIcon size={16} /></IconButton>
          <IconButton aria-label="Redo" size="sm"><RedoIcon size={16} /></IconButton>
          <ToolbarDivider />
          <Button size="sm">Action</Button>
        </Toolbar>
      </div>
      <div>
        <Text size="sm" weight="medium" style={{ marginBottom: 'var(--space-2)' }}>Bordered</Text>
        <Toolbar variant="bordered">
          <IconButton aria-label="Undo" size="sm"><UndoIcon size={16} /></IconButton>
          <IconButton aria-label="Redo" size="sm"><RedoIcon size={16} /></IconButton>
          <ToolbarDivider />
          <Button size="sm">Action</Button>
        </Toolbar>
      </div>
      <div>
        <Text size="sm" weight="medium" style={{ marginBottom: 'var(--space-2)' }}>Floating</Text>
        <Toolbar variant="floating">
          <IconButton aria-label="Undo" size="sm"><UndoIcon size={16} /></IconButton>
          <IconButton aria-label="Redo" size="sm"><RedoIcon size={16} /></IconButton>
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
          <IconButton aria-label="Undo" size="sm"><UndoIcon size={16} /></IconButton>
          <IconButton aria-label="Redo" size="sm"><RedoIcon size={16} /></IconButton>
          <ToolbarDivider />
          <Button size="sm">Action</Button>
        </Toolbar>
      </div>
      <div>
        <Text size="sm" weight="medium" style={{ marginBottom: 'var(--space-2)' }}>Medium</Text>
        <Toolbar variant="bordered" size="md">
          <IconButton aria-label="Undo"><UndoIcon size={16} /></IconButton>
          <IconButton aria-label="Redo"><RedoIcon size={16} /></IconButton>
          <ToolbarDivider />
          <Button>Action</Button>
        </Toolbar>
      </div>
      <div>
        <Text size="sm" weight="medium" style={{ marginBottom: 'var(--space-2)' }}>Large</Text>
        <Toolbar variant="bordered" size="lg">
          <IconButton aria-label="Undo" size="lg"><UndoIcon size={16} /></IconButton>
          <IconButton aria-label="Redo" size="lg"><RedoIcon size={16} /></IconButton>
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
        <IconButton aria-label="Undo" size="sm"><UndoIcon size={16} /></IconButton>
        <IconButton aria-label="Redo" size="sm"><RedoIcon size={16} /></IconButton>
        <ToolbarDivider />
        <IconButton aria-label="Bold" size="sm"><BoldIcon size={16} /></IconButton>
        <IconButton aria-label="Italic" size="sm"><ItalicIcon size={16} /></IconButton>
        <IconButton aria-label="Underline" size="sm"><UnderlineIcon size={16} /></IconButton>
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
          <IconButton aria-label="Undo" size="sm"><UndoIcon size={16} /></IconButton>
          <IconButton aria-label="Redo" size="sm"><RedoIcon size={16} /></IconButton>
        </ToolbarGroup>
        <ToolbarDivider />
        <ButtonGroup>
          <Button size="sm" variant="outline"><BoldIcon size={16} /></Button>
          <Button size="sm" variant="outline"><ItalicIcon size={16} /></Button>
          <Button size="sm" variant="outline"><UnderlineIcon size={16} /></Button>
        </ButtonGroup>
        <ToolbarDivider />
        <ButtonGroup>
          <Button size="sm" variant="outline"><AlignLeftIcon size={16} /></Button>
          <Button size="sm" variant="outline"><AlignCenterIcon size={16} /></Button>
          <Button size="sm" variant="outline"><AlignRightIcon size={16} /></Button>
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
