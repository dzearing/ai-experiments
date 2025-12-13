import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SplitPane } from './SplitPane';
import { Panel } from '../Panel';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { TreeView, type TreeNode } from '../TreeView';
import { List, ListItem } from '../List';
import { Button } from '../Button';

/**
 * # SplitPane
 *
 * Resizable panel layout for side-by-side or stacked content.
 *
 * ## Features
 *
 * - Horizontal (side-by-side) and vertical (stacked) orientations
 * - Drag to resize with min/max constraints
 * - Double-click to collapse/expand first pane
 * - Controlled and uncontrolled modes
 * - Customizable sizer handle
 *
 * ## Usage
 *
 * ```tsx
 * import { SplitPane } from '@ui-kit/react';
 *
 * <SplitPane
 *   first={<Sidebar />}
 *   second={<MainContent />}
 *   defaultSize={250}
 *   minSize={150}
 *   maxSize={400}
 *   collapsible
 * />
 * ```
 *
 * @see [Example: File Explorer](/docs/example-pages-fileexplorer--docs)
 */

const meta: Meta<typeof SplitPane> = {
  title: 'Layout/SplitPane',
  component: SplitPane,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Resizable two-panel layout for side-by-side or stacked content with built-in Sizer.

## When to Use

- Application layouts with resizable sidebar and main content
- Code editors with file explorer and editor panes
- Email clients with message list and reading pane
- Documentation sites with navigation and content areas
- Any interface requiring user-adjustable panel sizes

## Variants

| Orientation | Use Case |
|-------------|----------|
| \`horizontal\` | Panels side by side (resize left/right) |
| \`vertical\` | Panels stacked vertically (resize up/down) |

## Sizing Options

- **Pixel value**: \`defaultSize={250}\` for fixed initial size
- **Percentage**: \`defaultSize="30%"\` for responsive initial size
- **Controlled**: Use \`size\` prop with \`onSizeChange\` callback

## Accessibility

- Built-in Sizer with proper ARIA roles and keyboard support
- Tab to focus sizer, Arrow keys to resize
- Double-click sizer to collapse/expand first panel (when \`collapsible={true}\`)
- \`minSize\` and \`maxSize\` prevent panels from becoming unusable
- Maintains focus and reading order for screen readers

## Usage

\`\`\`tsx
import { SplitPane } from '@ui-kit/react';

// Basic usage
<SplitPane
  first={<Sidebar />}
  second={<MainContent />}
  defaultSize={250}
  minSize={150}
  maxSize={400}
/>

// Collapsible sidebar
<SplitPane
  first={<Sidebar />}
  second={<MainContent />}
  defaultSize={250}
  collapsible
  onCollapsedChange={(collapsed) => console.log(collapsed)}
/>

// Vertical split
<SplitPane
  orientation="vertical"
  first={<TopPanel />}
  second={<BottomPanel />}
  defaultSize="60%"
/>
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SplitPane>;

// Sample file tree for examples
const fileTreeData: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    icon: <span>📁</span>,
    children: [
      {
        id: 'components',
        label: 'components',
        icon: <span>📁</span>,
        children: [
          { id: 'button', label: 'Button.tsx', icon: <span>📄</span> },
          { id: 'input', label: 'Input.tsx', icon: <span>📄</span> },
          { id: 'modal', label: 'Modal.tsx', icon: <span>📄</span> },
        ],
      },
      { id: 'index', label: 'index.ts', icon: <span>📄</span> },
      { id: 'app', label: 'App.tsx', icon: <span>⚛️</span> },
    ],
  },
  {
    id: 'public',
    label: 'public',
    icon: <span>📁</span>,
    children: [
      { id: 'favicon', label: 'favicon.ico', icon: <span>🖼️</span> },
      { id: 'indexhtml', label: 'index.html', icon: <span>📄</span> },
    ],
  },
  { id: 'package', label: 'package.json', icon: <span>📦</span> },
];

// Placeholder panels
const Sidebar = ({ title = 'Sidebar' }: { title?: string }) => (
  <Panel style={{ height: '100%', padding: 'var(--space-3)' }}>
    <Text weight="medium" style={{ marginBottom: 'var(--space-2)' }}>{title}</Text>
    <TreeView
      data={fileTreeData}
      selectable
      defaultExpandedIds={['src', 'components']}
    />
  </Panel>
);

const MainContent = ({ title = 'Main Content' }: { title?: string }) => (
  <Panel style={{ height: '100%', padding: 'var(--space-3)' }}>
    <Text weight="medium" style={{ marginBottom: 'var(--space-2)' }}>{title}</Text>
    <Text color="soft">
      This is the main content area. Drag the handle to resize the panels.
    </Text>
  </Panel>
);

export const Default: Story = {
  render: () => (
    <div style={{ height: 400, border: '1px solid var(--panel-border)' }}>
      <SplitPane
        first={<Sidebar />}
        second={<MainContent />}
        defaultSize={250}
      />
    </div>
  ),
};

// With size constraints
export const WithConstraints: Story = {
  render: () => (
    <div style={{ height: 400, border: '1px solid var(--panel-border)' }}>
      <SplitPane
        first={<Sidebar title="Constrained Sidebar" />}
        second={<MainContent title="Resize is constrained" />}
        defaultSize={250}
        minSize={150}
        maxSize={400}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use `minSize` and `maxSize` to limit how far panels can be resized.',
      },
    },
  },
};

// Collapsible
export const Collapsible: Story = {
  render: () => (
    <div style={{ height: 400, border: '1px solid var(--panel-border)' }}>
      <SplitPane
        first={<Sidebar title="Double-click to collapse" />}
        second={<MainContent title="Collapsible sidebar" />}
        defaultSize={250}
        minSize={150}
        collapsible
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Enable `collapsible` to allow double-clicking the sizer to collapse/expand the first pane.',
      },
    },
  },
};

// Controlled
export const Controlled: Story = {
  render: () => {
    const [size, setSize] = useState(250);
    const [collapsed, setCollapsed] = useState(false);

    return (
      <Stack gap="md" style={{ height: 400 }}>
        <Stack direction="row" gap="sm" align="center">
          <Button size="sm" onClick={() => setSize(150)}>Small (150px)</Button>
          <Button size="sm" onClick={() => setSize(250)}>Medium (250px)</Button>
          <Button size="sm" onClick={() => setSize(350)}>Large (350px)</Button>
          <Button size="sm" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? 'Expand' : 'Collapse'}
          </Button>
          <Text size="sm" color="soft">Size: {size}px, Collapsed: {String(collapsed)}</Text>
        </Stack>
        <div style={{ flex: 1, border: '1px solid var(--panel-border)' }}>
          <SplitPane
            first={<Sidebar />}
            second={<MainContent />}
            size={size}
            onSizeChange={setSize}
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
            minSize={100}
            collapsible
          />
        </div>
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Use controlled mode with `size`, `collapsed`, and their callbacks for full control.',
      },
    },
  },
};

// Vertical orientation
export const Vertical: Story = {
  render: () => (
    <div style={{ height: 500, border: '1px solid var(--panel-border)' }}>
      <SplitPane
        orientation="vertical"
        first={
          <Panel style={{ height: '100%', padding: 'var(--space-3)' }}>
            <Text weight="medium">Top Panel</Text>
            <Text color="soft" size="sm">This panel is on top.</Text>
          </Panel>
        }
        second={
          <Panel style={{ height: '100%', padding: 'var(--space-3)' }}>
            <Text weight="medium">Bottom Panel</Text>
            <Text color="soft" size="sm">This panel is on the bottom. Drag to resize vertically.</Text>
          </Panel>
        }
        defaultSize={200}
        minSize={100}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Set `orientation="vertical"` for stacked panels.',
      },
    },
  },
};

// Percentage default size
export const PercentageSize: Story = {
  render: () => (
    <div style={{ height: 400, border: '1px solid var(--panel-border)' }}>
      <SplitPane
        first={<Sidebar title="30% width" />}
        second={<MainContent title="70% width" />}
        defaultSize="30%"
        minSize={150}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use percentage strings like `"30%"` for the default size.',
      },
    },
  },
};

// Nested split panes
export const Nested: Story = {
  render: () => (
    <div style={{ height: 500, border: '1px solid var(--panel-border)' }}>
      <SplitPane
        first={<Sidebar />}
        second={
          <SplitPane
            orientation="vertical"
            first={
              <Panel style={{ height: '100%', padding: 'var(--space-3)' }}>
                <Text weight="medium">Editor</Text>
                <Text color="soft" size="sm" style={{ marginTop: 'var(--space-2)' }}>
                  Main editing area with nested vertical split.
                </Text>
              </Panel>
            }
            second={
              <Panel style={{ height: '100%', padding: 'var(--space-3)' }}>
                <Text weight="medium">Terminal</Text>
                <Text color="soft" size="sm" style={{ marginTop: 'var(--space-2)' }}>
                  Output or terminal panel below.
                </Text>
              </Panel>
            }
            defaultSize="70%"
            minSize={100}
            collapsible
          />
        }
        defaultSize={250}
        minSize={150}
        collapsible
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'SplitPane can be nested to create complex layouts like IDE interfaces.',
      },
    },
  },
};

// File explorer example
export const FileExplorerLayout: Story = {
  render: () => {
    const [selectedFile, setSelectedFile] = useState<string | null>(null);

    const files = [
      { id: '1', name: 'README.md', size: '2.4 KB', modified: '2024-01-15' },
      { id: '2', name: 'package.json', size: '1.2 KB', modified: '2024-01-14' },
      { id: '3', name: 'tsconfig.json', size: '0.8 KB', modified: '2024-01-10' },
      { id: '4', name: '.gitignore', size: '0.3 KB', modified: '2024-01-05' },
    ];

    return (
      <div style={{ height: 450, border: '1px solid var(--panel-border)' }}>
        <SplitPane
          first={
            <Panel style={{ height: '100%' }}>
              <div style={{ padding: 'var(--space-2)', borderBottom: '1px solid var(--panel-border)' }}>
                <Text size="sm" weight="medium">Explorer</Text>
              </div>
              <TreeView
                data={fileTreeData}
                selectable
                selectedId={selectedFile}
                onSelect={(id) => setSelectedFile(id)}
                defaultExpandedIds={['src']}
              />
            </Panel>
          }
          second={
            <SplitPane
              orientation="vertical"
              first={
                <Panel style={{ height: '100%' }}>
                  <div style={{ padding: 'var(--space-2)', borderBottom: '1px solid var(--panel-border)' }}>
                    <Text size="sm" weight="medium">
                      {selectedFile ? `File: ${selectedFile}` : 'Select a file'}
                    </Text>
                  </div>
                  <div style={{ padding: 'var(--space-3)' }}>
                    {selectedFile ? (
                      <Text color="soft" size="sm">Contents of {selectedFile} would appear here...</Text>
                    ) : (
                      <Text color="soft" size="sm">Select a file from the tree to view its contents.</Text>
                    )}
                  </div>
                </Panel>
              }
              second={
                <Panel style={{ height: '100%' }}>
                  <div style={{ padding: 'var(--space-2)', borderBottom: '1px solid var(--panel-border)' }}>
                    <Text size="sm" weight="medium">Files</Text>
                  </div>
                  <List density="compact" selectable>
                    {files.map((file) => (
                      <ListItem key={file.id} value={file.id}>
                        <Stack direction="row" justify="between" style={{ width: '100%' }}>
                          <Text size="sm">{file.name}</Text>
                          <Text size="sm" color="soft">{file.size}</Text>
                        </Stack>
                      </ListItem>
                    ))}
                  </List>
                </Panel>
              }
              defaultSize="60%"
              minSize={100}
              collapsible
            />
          }
          defaultSize={220}
          minSize={150}
          maxSize={350}
          collapsible
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'A practical file explorer layout combining TreeView, List, and nested SplitPanes.',
      },
    },
  },
};
