import { useState, useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TreeView, type TreeNode, type IconResolver } from './TreeView';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Panel } from '../Panel';

/**
 * # TreeView
 *
 * Virtualized hierarchical tree navigation component for large data structures.
 *
 * ## Features
 *
 * - **Virtualization**: Handles 10,000+ nodes efficiently
 * - **Full keyboard navigation**: Arrow keys, Home/End, PageUp/PageDown
 * - **Expand/collapse**: Click chevron or use Arrow Left/Right
 * - **Selection**: Single selection with keyboard or mouse
 * - **Custom icons**: Icon resolver system for file types
 * - **Controlled and uncontrolled modes**
 *
 * ## Keyboard Navigation
 *
 * | Key | Action |
 * |-----|--------|
 * | Arrow Up/Down | Navigate between nodes |
 * | Arrow Right | Expand node or move to first child |
 * | Arrow Left | Collapse node or move to parent |
 * | Home | Jump to first node |
 * | End | Jump to last node |
 * | PageUp/PageDown | Navigate by page |
 * | Enter | Select and toggle expand |
 * | Space | Select only |
 *
 * ## Usage
 *
 * ```tsx
 * import { TreeView, type TreeNode } from '@ui-kit/react';
 *
 * const data: TreeNode[] = [
 *   {
 *     id: 'folder-1',
 *     label: 'Documents',
 *     type: 'folder',
 *     children: [
 *       { id: 'file-1', label: 'Resume.pdf', type: 'file' },
 *     ],
 *   },
 * ];
 *
 * <TreeView
 *   data={data}
 *   height={400}
 *   selectable
 *   onSelect={(id, node) => console.log(id, node)}
 * />
 * ```
 *
 * @see [Example: File Explorer](/docs/example-pages-fileexplorer--docs)
 */

const meta: Meta<typeof TreeView> = {
  title: 'Navigation/TreeView',
  component: TreeView,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The TreeView component displays hierarchical data with virtualization for large datasets.

## Virtualization

The component uses windowed rendering to efficiently handle trees with thousands of nodes.
Only visible nodes (plus a small buffer) are rendered to the DOM.

## Node Structure

Each node has the following properties:
- \`id\`: Unique identifier (required)
- \`label\`: Display text (required)
- \`type\`: Node type for icon resolution (optional)
- \`icon\`: Custom icon element (optional, overrides iconResolver)
- \`children\`: Nested child nodes (optional)
- \`disabled\`: Whether node is disabled (optional)
        `,
      },
    },
  },
  argTypes: {
    height: {
      control: { type: 'number', min: 100, max: 800, step: 50 },
      description: 'Height of the tree view container (required for virtualization)',
    },
    itemHeight: {
      control: { type: 'number', min: 24, max: 48, step: 4 },
      description: 'Height of each tree node',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TreeView>;

// Sample file tree data
const fileTreeData: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    type: 'folder',
    children: [
      {
        id: 'components',
        label: 'components',
        type: 'folder',
        children: [
          { id: 'button', label: 'Button.tsx', type: 'typescript' },
          { id: 'input', label: 'Input.tsx', type: 'typescript' },
          { id: 'modal', label: 'Modal.tsx', type: 'typescript' },
        ],
      },
      {
        id: 'hooks',
        label: 'hooks',
        type: 'folder',
        children: [
          { id: 'useState', label: 'useState.ts', type: 'typescript' },
          { id: 'useEffect', label: 'useEffect.ts', type: 'typescript' },
        ],
      },
      { id: 'index', label: 'index.ts', type: 'typescript' },
      { id: 'app', label: 'App.tsx', type: 'typescript' },
    ],
  },
  {
    id: 'public',
    label: 'public',
    type: 'folder',
    children: [
      { id: 'favicon', label: 'favicon.ico', type: 'image' },
      { id: 'indexhtml', label: 'index.html', type: 'html' },
    ],
  },
  { id: 'package', label: 'package.json', type: 'json' },
  { id: 'readme', label: 'README.md', type: 'markdown' },
];

export const Default: Story = {
  render: () => (
    <Panel style={{ width: 300 }}>
      <TreeView
        data={fileTreeData}
        height={400}
        defaultExpandedIds={['src', 'components']}
        aria-label="File tree"
      />
    </Panel>
  ),
};

// Selectable tree
export const Selectable: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

    return (
      <Stack gap="md">
        <Panel style={{ width: 300 }}>
          <TreeView
            data={fileTreeData}
            height={350}
            selectable
            selectedId={selectedId}
            onSelect={(id, node) => {
              setSelectedId(id);
              setSelectedNode(node);
            }}
            defaultExpandedIds={['src', 'components']}
            aria-label="Selectable file tree"
          />
        </Panel>
        <Text size="sm" color="soft">
          Selected: {selectedNode?.label || 'none'}
        </Text>
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Enable selection with the `selectable` prop. Use arrow keys to navigate and Enter/Space to select.',
      },
    },
  },
};

// Large dataset (10,000+ nodes)
export const LargeDataset: Story = {
  render: () => {
    // Generate a large tree with 10,000+ nodes
    const largeData = useMemo((): TreeNode[] => {
      const folders: TreeNode[] = [];
      for (let i = 0; i < 100; i++) {
        const children: TreeNode[] = [];
        for (let j = 0; j < 100; j++) {
          children.push({
            id: `folder-${i}-file-${j}`,
            label: `File ${j + 1}.ts`,
            type: 'typescript',
          });
        }
        folders.push({
          id: `folder-${i}`,
          label: `Folder ${i + 1}`,
          type: 'folder',
          children,
        });
      }
      return folders;
    }, []);

    const [expandedIds, setExpandedIds] = useState<string[]>(['folder-0', 'folder-1']);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Count visible nodes
    const countNodes = (nodes: TreeNode[], expanded: string[]): number => {
      let count = 0;
      for (const node of nodes) {
        count++;
        if (node.children && expanded.includes(node.id)) {
          count += countNodes(node.children, expanded);
        }
      }
      return count;
    };

    const visibleCount = countNodes(largeData, expandedIds);

    return (
      <Stack gap="md">
        <Text size="sm" color="soft">
          10,000 nodes total • {visibleCount} visible • Try scrolling and using keyboard navigation
        </Text>
        <Panel style={{ width: 350 }}>
          <TreeView
            data={largeData}
            height={500}
            selectable
            expandedIds={expandedIds}
            onExpandedChange={setExpandedIds}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
            aria-label="Large file tree with 10,000 nodes"
          />
        </Panel>
        <Stack direction="row" gap="sm">
          <button onClick={() => setExpandedIds([])}>Collapse All</button>
          <button onClick={() => setExpandedIds(largeData.map(n => n.id))}>
            Expand All Folders
          </button>
        </Stack>
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'The TreeView efficiently handles 10,000+ nodes through virtualization. Only visible nodes are rendered.',
      },
    },
  },
};

// With custom icons via emoji
export const WithIcons: Story = {
  render: () => {
    const iconData: TreeNode[] = [
      {
        id: 'project',
        label: 'my-project',
        icon: <span>📦</span>,
        children: [
          {
            id: 'src',
            label: 'src',
            icon: <span>📁</span>,
            children: [
              { id: 'app', label: 'App.tsx', icon: <span>⚛️</span> },
              { id: 'index', label: 'index.ts', icon: <span>📄</span> },
              { id: 'styles', label: 'styles.css', icon: <span>🎨</span> },
            ],
          },
          {
            id: 'assets',
            label: 'assets',
            icon: <span>📁</span>,
            children: [
              { id: 'logo', label: 'logo.png', icon: <span>🖼️</span> },
              { id: 'favicon', label: 'favicon.ico', icon: <span>⭐</span> },
            ],
          },
          { id: 'readme', label: 'README.md', icon: <span>📝</span> },
          { id: 'package', label: 'package.json', icon: <span>📦</span> },
        ],
      },
    ];

    return (
      <Panel style={{ width: 300 }}>
        <TreeView
          data={iconData}
          height={350}
          selectable
          defaultExpandedIds={['project', 'src', 'assets']}
          aria-label="File tree with icons"
        />
      </Panel>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Pass custom icons via the `icon` property on each node.',
      },
    },
  },
};

// Custom icon resolver
export const CustomIconResolver: Story = {
  render: () => {
    // Icon components
    const FolderIcon = () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="#E8A838">
        <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.379a1.5 1.5 0 0 1 1.06.44L8.061 3.56A.5.5 0 0 0 8.415 3.7H13.5A1.5 1.5 0 0 1 15 5.2v7.3a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z" />
      </svg>
    );

    const TypeScriptIcon = () => (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect width="16" height="16" rx="2" fill="#3178C6" />
        <text x="3" y="12" fontSize="10" fill="white" fontWeight="bold">TS</text>
      </svg>
    );

    const JsonIcon = () => (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect width="16" height="16" rx="2" fill="#F5A623" />
        <text x="2" y="12" fontSize="8" fill="white" fontWeight="bold">{'{}'}</text>
      </svg>
    );

    const MarkdownIcon = () => (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect width="16" height="16" rx="2" fill="#083FA1" />
        <text x="2" y="12" fontSize="9" fill="white" fontWeight="bold">MD</text>
      </svg>
    );

    // Icon resolver based on file extension/type
    const iconResolver: IconResolver = (type, node) => {
      // Check by type first
      switch (type) {
        case 'folder':
          return <FolderIcon />;
        case 'typescript':
          return <TypeScriptIcon />;
        case 'json':
          return <JsonIcon />;
        case 'markdown':
          return <MarkdownIcon />;
      }

      // Check by file extension
      const label = String(node.label);
      if (label.endsWith('.ts') || label.endsWith('.tsx')) {
        return <TypeScriptIcon />;
      }
      if (label.endsWith('.json')) {
        return <JsonIcon />;
      }
      if (label.endsWith('.md')) {
        return <MarkdownIcon />;
      }

      return null; // Fall back to default
    };

    return (
      <Panel style={{ width: 300 }}>
        <TreeView
          data={fileTreeData}
          height={350}
          selectable
          iconResolver={iconResolver}
          defaultExpandedIds={['src', 'components', 'hooks', 'public']}
          aria-label="File tree with custom icon resolver"
        />
      </Panel>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Use `iconResolver` to dynamically resolve icons based on node type or properties.',
      },
    },
  },
};

// Controlled expansion
export const ControlledExpansion: Story = {
  render: () => {
    const [expandedIds, setExpandedIds] = useState<string[]>(['src']);

    return (
      <Stack gap="md">
        <Stack direction="row" gap="sm">
          <button onClick={() => setExpandedIds([])}>Collapse All</button>
          <button onClick={() => setExpandedIds(['src', 'components', 'hooks', 'public'])}>
            Expand All
          </button>
        </Stack>
        <Panel style={{ width: 300 }}>
          <TreeView
            data={fileTreeData}
            height={350}
            selectable
            expandedIds={expandedIds}
            onExpandedChange={setExpandedIds}
            aria-label="Controlled file tree"
          />
        </Panel>
        <Text size="sm" color="soft">
          Expanded: {expandedIds.join(', ') || 'none'}
        </Text>
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Use `expandedIds` and `onExpandedChange` for controlled expansion.',
      },
    },
  },
};

// Expand all by default
export const ExpandAll: Story = {
  render: () => (
    <Panel style={{ width: 300 }}>
      <TreeView
        data={fileTreeData}
        height={400}
        selectable
        defaultExpandAll
        aria-label="Fully expanded file tree"
      />
    </Panel>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use `defaultExpandAll` to expand all nodes on mount.',
      },
    },
  },
};

// With disabled nodes
const dataWithDisabled: TreeNode[] = [
  {
    id: 'available',
    label: 'Available Features',
    type: 'folder',
    children: [
      { id: 'feature1', label: 'Feature 1' },
      { id: 'feature2', label: 'Feature 2' },
    ],
  },
  {
    id: 'premium',
    label: 'Premium Features (Locked)',
    type: 'folder',
    disabled: true,
    children: [
      { id: 'premium1', label: 'Premium Feature 1', disabled: true },
      { id: 'premium2', label: 'Premium Feature 2', disabled: true },
    ],
  },
];

export const WithDisabledNodes: Story = {
  render: () => (
    <Panel style={{ width: 300 }}>
      <TreeView
        data={dataWithDisabled}
        height={250}
        selectable
        defaultExpandAll
        aria-label="File tree with disabled nodes"
      />
    </Panel>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Nodes can be disabled to indicate unavailable options.',
      },
    },
  },
};

// Organization chart
const orgChartData: TreeNode[] = [
  {
    id: 'ceo',
    label: 'CEO - John Smith',
    icon: <span>👔</span>,
    children: [
      {
        id: 'cto',
        label: 'CTO - Sarah Johnson',
        icon: <span>💻</span>,
        children: [
          {
            id: 'eng-lead',
            label: 'Engineering Lead - Mike Brown',
            icon: <span>👷</span>,
            children: [
              { id: 'dev1', label: 'Alice - Developer', icon: <span>👩‍💻</span> },
              { id: 'dev2', label: 'Bob - Developer', icon: <span>👨‍💻</span> },
              { id: 'dev3', label: 'Carol - Developer', icon: <span>👩‍💻</span> },
            ],
          },
          {
            id: 'qa-lead',
            label: 'QA Lead - David Lee',
            icon: <span>🔍</span>,
            children: [
              { id: 'qa1', label: 'Eve - QA Engineer', icon: <span>🧪</span> },
            ],
          },
        ],
      },
      {
        id: 'cmo',
        label: 'CMO - Lisa Wang',
        icon: <span>📊</span>,
        children: [
          { id: 'marketing1', label: 'Marketing Manager', icon: <span>📣</span> },
        ],
      },
    ],
  },
];

export const OrganizationChart: Story = {
  render: () => (
    <Panel style={{ width: 350 }}>
      <TreeView
        data={orgChartData}
        height={400}
        selectable
        defaultExpandedIds={['ceo', 'cto']}
        aria-label="Organization chart"
      />
    </Panel>
  ),
  parameters: {
    docs: {
      description: {
        story: 'TreeView can represent any hierarchical data like organization charts.',
      },
    },
  },
};

// Keyboard navigation demo
export const KeyboardNavigation: Story = {
  render: () => (
    <Stack gap="md">
      <Panel padding="md" style={{ background: 'var(--inset-bg)' }}>
        <Text size="sm" weight="medium">Keyboard Shortcuts:</Text>
        <Stack gap="xs" style={{ marginTop: 'var(--space-2)' }}>
          <Text size="sm" color="soft">↑/↓ - Navigate up/down</Text>
          <Text size="sm" color="soft">→ - Expand or enter folder</Text>
          <Text size="sm" color="soft">← - Collapse or go to parent</Text>
          <Text size="sm" color="soft">Home/End - Jump to first/last</Text>
          <Text size="sm" color="soft">PageUp/PageDown - Navigate by page</Text>
          <Text size="sm" color="soft">Enter - Select & toggle</Text>
          <Text size="sm" color="soft">Space - Select only</Text>
        </Stack>
      </Panel>
      <Panel style={{ width: 300 }}>
        <TreeView
          data={fileTreeData}
          height={300}
          selectable
          defaultExpandedIds={['src']}
          aria-label="File tree - click and use keyboard to navigate"
        />
      </Panel>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full keyboard navigation support. Click the tree and use arrow keys to navigate.',
      },
    },
  },
};
