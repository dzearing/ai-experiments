import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { List, ListItem, ListItemText, ListGroup, ListDivider } from './List';
import { Avatar } from '../Avatar';
import { Chip } from '../Chip';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Panel } from '../Panel';

/**
 * # List
 *
 * Display collections of items with consistent styling and optional selection.
 *
 * ## Features
 *
 * - Multiple density options (compact, comfortable, spacious)
 * - Single and multi-select modes
 * - Leading and trailing content slots
 * - Grouped items with headers
 * - Dividers between sections
 *
 * ## Usage
 *
 * ```tsx
 * import { List, ListItem, ListItemText } from '@ui-kit/react';
 *
 * <List selectable onSelectionChange={(value) => console.log(value)}>
 *   <ListItem value="1" leading={<Avatar />}>
 *     <ListItemText primary="Item 1" secondary="Description" />
 *   </ListItem>
 *   <ListItem value="2" leading={<Avatar />}>
 *     <ListItemText primary="Item 2" secondary="Description" />
 *   </ListItem>
 * </List>
 * ```
 *
 * @see [Example: File Explorer](/docs/example-pages-fileexplorer--docs)
 */

const meta: Meta<typeof List> = {
  title: 'Data Display/List',
  component: List,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Display collections of items with optional selection, leading/trailing content, and grouping.

## When to Use

- Navigation menus and sidebars with clickable items
- Settings panels with list of options or preferences
- Contact or user lists with avatars and status indicators
- File explorers showing files and folders
- Inbox or message lists with metadata

## Variants

| Variant | Use Case |
|---------|----------|
| \`default\` | Clean list without borders |
| \`bordered\` | Single border around entire list |
| \`divided\` | Dividers between individual items |

## Sizes (Density)

- **compact** (4px 8px): Dense lists, dropdown menus, space-constrained UIs
- **comfortable** (8px 12px): Default spacing for most use cases
- **spacious** (12px 16px): Touch-friendly interfaces, emphasis on items

## Accessibility

- Uses \`role="listbox"\` for selectable lists, \`role="list"\` otherwise
- List items have \`role="option"\` when selectable
- \`aria-selected\` indicates selection state to screen readers
- \`aria-multiselectable\` set when multi-select is enabled
- Keyboard navigation with Tab, arrow keys, and Enter/Space
- Disabled items marked with \`aria-disabled\`

## Usage

\`\`\`tsx
import { List, ListItem, ListItemText } from '@ui-kit/react';

// Simple list
<List>
  <ListItem>Item 1</ListItem>
  <ListItem>Item 2</ListItem>
</List>

// Selectable with icons
<List selectable onSelectionChange={(value) => console.log(value)}>
  <ListItem value="1" leading={<Icon />}>
    <ListItemText primary="Title" secondary="Description" />
  </ListItem>
</List>

// Multi-select with groups
<List selectable multiSelect>
  <ListGroup label="Category">
    <ListItem value="a">Item A</ListItem>
    <ListItem value="b">Item B</ListItem>
  </ListGroup>
</List>
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof List>;

// Basic list
export const Default: Story = {
  render: () => (
    <Panel style={{ width: 320 }}>
      <List>
        <ListItem>First item</ListItem>
        <ListItem>Second item</ListItem>
        <ListItem>Third item</ListItem>
        <ListItem>Fourth item</ListItem>
      </List>
    </Panel>
  ),
};

// Selectable list
export const Selectable: Story = {
  render: () => {
    const [selected, setSelected] = useState<string>('');

    return (
      <Stack gap="md">
        <Panel style={{ width: 320 }}>
          <List
            selectable
            value={selected}
            onSelectionChange={(value) => setSelected(value as string)}
          >
            <ListItem value="inbox">Inbox</ListItem>
            <ListItem value="sent">Sent</ListItem>
            <ListItem value="drafts">Drafts</ListItem>
            <ListItem value="trash">Trash</ListItem>
          </List>
        </Panel>
        <Text size="sm" color="soft">Selected: {selected || 'none'}</Text>
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Enable selection with the `selectable` prop.',
      },
    },
  },
};

// Multi-select list
export const MultiSelect: Story = {
  render: () => {
    const [selected, setSelected] = useState<string[]>([]);

    return (
      <Stack gap="md">
        <Panel style={{ width: 320 }}>
          <List
            selectable
            multiSelect
            value={selected}
            onSelectionChange={(value) => setSelected(value as string[])}
          >
            <ListItem value="react">React</ListItem>
            <ListItem value="vue">Vue</ListItem>
            <ListItem value="angular">Angular</ListItem>
            <ListItem value="svelte">Svelte</ListItem>
          </List>
        </Panel>
        <Text size="sm" color="soft">Selected: {selected.join(', ') || 'none'}</Text>
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Enable multi-selection with `multiSelect` prop.',
      },
    },
  },
};

// List with leading/trailing content
export const WithLeadingTrailing: Story = {
  render: () => (
    <Panel style={{ width: 360 }}>
      <List>
        <ListItem
          leading={<Avatar size="sm" fallback="JD" />}
          trailing={<Chip size="sm" variant="success">Online</Chip>}
        >
          <ListItemText primary="John Doe" secondary="john@example.com" />
        </ListItem>
        <ListItem
          leading={<Avatar size="sm" fallback="SK" />}
          trailing={<Chip size="sm" variant="outline">Away</Chip>}
        >
          <ListItemText primary="Sarah Kim" secondary="sarah@example.com" />
        </ListItem>
        <ListItem
          leading={<Avatar size="sm" fallback="MR" />}
          trailing={<Chip size="sm" variant="error">Offline</Chip>}
        >
          <ListItemText primary="Mike Ross" secondary="mike@example.com" />
        </ListItem>
      </List>
    </Panel>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Add icons, avatars, or other content with `leading` and `trailing` props.',
      },
    },
  },
};

// Density variants
export const Densities: Story = {
  render: () => (
    <Stack gap="lg" direction="row">
      <Panel style={{ width: 200 }}>
        <Text size="sm" weight="medium" style={{ padding: 'var(--space-2)' }}>Compact</Text>
        <List density="compact">
          <ListItem>Item 1</ListItem>
          <ListItem>Item 2</ListItem>
          <ListItem>Item 3</ListItem>
        </List>
      </Panel>
      <Panel style={{ width: 200 }}>
        <Text size="sm" weight="medium" style={{ padding: 'var(--space-2)' }}>Comfortable</Text>
        <List density="comfortable">
          <ListItem>Item 1</ListItem>
          <ListItem>Item 2</ListItem>
          <ListItem>Item 3</ListItem>
        </List>
      </Panel>
      <Panel style={{ width: 200 }}>
        <Text size="sm" weight="medium" style={{ padding: 'var(--space-2)' }}>Spacious</Text>
        <List density="spacious">
          <ListItem>Item 1</ListItem>
          <ListItem>Item 2</ListItem>
          <ListItem>Item 3</ListItem>
        </List>
      </Panel>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Control item spacing with the `density` prop.',
      },
    },
  },
};

// Variants
export const Variants: Story = {
  render: () => (
    <Stack gap="lg" direction="row">
      <Panel style={{ width: 200 }}>
        <Text size="sm" weight="medium" style={{ padding: 'var(--space-2)' }}>Default</Text>
        <List variant="default">
          <ListItem>Item 1</ListItem>
          <ListItem>Item 2</ListItem>
          <ListItem>Item 3</ListItem>
        </List>
      </Panel>
      <div style={{ width: 200 }}>
        <Text size="sm" weight="medium" style={{ padding: 'var(--space-2)' }}>Bordered</Text>
        <List variant="bordered">
          <ListItem>Item 1</ListItem>
          <ListItem>Item 2</ListItem>
          <ListItem>Item 3</ListItem>
        </List>
      </div>
      <Panel style={{ width: 200 }}>
        <Text size="sm" weight="medium" style={{ padding: 'var(--space-2)' }}>Divided</Text>
        <List variant="divided">
          <ListItem>Item 1</ListItem>
          <ListItem>Item 2</ListItem>
          <ListItem>Item 3</ListItem>
        </List>
      </Panel>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Choose between default, bordered, or divided variants.',
      },
    },
  },
};

// Grouped list
export const WithGroups: Story = {
  render: () => (
    <Panel style={{ width: 320 }}>
      <List>
        <ListGroup label="Favorites" collapsible>
          <ListItem>Home</ListItem>
          <ListItem>Dashboard</ListItem>
          <ListItem>Settings</ListItem>
        </ListGroup>
        <ListGroup label="Recent" collapsible defaultCollapsed>
          <ListItem>Project A</ListItem>
          <ListItem>Project B</ListItem>
          <ListItem>Project C</ListItem>
        </ListGroup>
      </List>
    </Panel>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Group items with collapsible headers using `ListGroup`.',
      },
    },
  },
};

// With dividers
export const WithDividers: Story = {
  render: () => (
    <Panel style={{ width: 320 }}>
      <List>
        <ListItem leading={<span>📥</span>}>Inbox</ListItem>
        <ListItem leading={<span>📤</span>}>Sent</ListItem>
        <ListItem leading={<span>📝</span>}>Drafts</ListItem>
        <ListDivider />
        <ListItem leading={<span>⭐</span>}>Starred</ListItem>
        <ListItem leading={<span>📌</span>}>Important</ListItem>
        <ListDivider />
        <ListItem leading={<span>🗑️</span>}>Trash</ListItem>
        <ListItem leading={<span>⚠️</span>}>Spam</ListItem>
      </List>
    </Panel>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use `ListDivider` to separate groups of items.',
      },
    },
  },
};

// Interactive list with actions
export const Interactive: Story = {
  render: () => {
    const [items, setItems] = useState([
      { id: '1', name: 'Task 1', completed: false },
      { id: '2', name: 'Task 2', completed: true },
      { id: '3', name: 'Task 3', completed: false },
    ]);

    const toggleItem = (id: string) => {
      setItems(items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ));
    };

    return (
      <Panel style={{ width: 320 }}>
        <List>
          {items.map(item => (
            <ListItem
              key={item.id}
              onClick={() => toggleItem(item.id)}
              leading={
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleItem(item.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              }
              trailing={
                item.completed && <Chip size="sm" variant="success">Done</Chip>
              }
            >
              <Text style={{ textDecoration: item.completed ? 'line-through' : 'none' }}>
                {item.name}
              </Text>
            </ListItem>
          ))}
        </List>
      </Panel>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Create interactive lists with click handlers and dynamic content.',
      },
    },
  },
};
