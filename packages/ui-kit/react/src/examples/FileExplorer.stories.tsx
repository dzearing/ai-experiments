import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Button,
  Chip,
  Divider,
  Heading,
  Panel,
  Stack,
  Text,
  IconButton,
} from '../index';
import { TreeView, type TreeNode } from '../components/TreeView';
import { List, ListItem, ListItemText, ListDivider } from '../components/List';
import { Menu, type MenuItem } from '../components/Menu';
import { Toolbar, ToolbarGroup, ToolbarDivider, ToolbarSpacer } from '../components/Toolbar';
import { SplitPane } from '../components/SplitPane';
import { Accordion, AccordionItem, AccordionHeader, AccordionContent } from '../components/Accordion';

/**
 * # File Explorer
 *
 * A comprehensive file explorer interface demonstrating navigation,
 * tree views, and panel layouts.
 *
 * ## Components Used
 * - **SplitPane**: Resizable sidebar and content layout
 * - **TreeView**: Hierarchical folder navigation
 * - **List**: File listings with selection
 * - **Menu**: Context menus for file actions
 * - **Toolbar**: Action bar with file operations
 * - **Accordion**: Collapsible sidebar sections
 */

// Icons
const FolderIcon = () => <span style={{ fontSize: 14 }}>📁</span>;
const FileIcon = () => <span style={{ fontSize: 14 }}>📄</span>;
const ImageIcon = () => <span style={{ fontSize: 14 }}>🖼️</span>;
const CodeIcon = () => <span style={{ fontSize: 14 }}>📝</span>;
const PackageIcon = () => <span style={{ fontSize: 14 }}>📦</span>;

const NewFileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 1h5l4 4v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zm5 1v3h3L9 2zm-1 5H7v2H5v1h2v2h1V10h2V9H8V7z"/>
  </svg>
);

const NewFolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 3h4l1 1h7v9a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm6 4v2H6v1h2v2h1V10h2V9H9V7H8z"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1L4 5h3v5h2V5h3L8 1zm-5 9v4h10v-4h-1v3H4v-3H3z"/>
  </svg>
);

const GridViewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M1 1h6v6H1V1zm8 0h6v6H9V1zM1 9h6v6H1V9zm8 0h6v6H9V9z"/>
  </svg>
);

const ListViewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M1 2h14v2H1V2zm0 4h14v2H1V6zm0 4h14v2H1v-2zm0 4h14v2H1v-2z"/>
  </svg>
);

function FileExplorerPage() {
  const [selectedFile, setSelectedFile] = useState<string | null>('readme');
  const [selectedFolder, setSelectedFolder] = useState<string | null>('src');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // File tree data
  const fileTree: TreeNode[] = [
    {
      id: 'project',
      label: 'my-project',
      icon: <FolderIcon />,
      children: [
        {
          id: 'src',
          label: 'src',
          icon: <FolderIcon />,
          children: [
            {
              id: 'components',
              label: 'components',
              icon: <FolderIcon />,
              children: [
                { id: 'button', label: 'Button.tsx', icon: <CodeIcon /> },
                { id: 'input', label: 'Input.tsx', icon: <CodeIcon /> },
                { id: 'modal', label: 'Modal.tsx', icon: <CodeIcon /> },
                { id: 'table', label: 'Table.tsx', icon: <CodeIcon /> },
              ],
            },
            {
              id: 'hooks',
              label: 'hooks',
              icon: <FolderIcon />,
              children: [
                { id: 'useState', label: 'useState.ts', icon: <CodeIcon /> },
                { id: 'useEffect', label: 'useEffect.ts', icon: <CodeIcon /> },
              ],
            },
            { id: 'index', label: 'index.ts', icon: <CodeIcon /> },
            { id: 'app', label: 'App.tsx', icon: <CodeIcon /> },
          ],
        },
        {
          id: 'public',
          label: 'public',
          icon: <FolderIcon />,
          children: [
            { id: 'favicon', label: 'favicon.ico', icon: <ImageIcon /> },
            { id: 'logo', label: 'logo.png', icon: <ImageIcon /> },
            { id: 'indexhtml', label: 'index.html', icon: <FileIcon /> },
          ],
        },
        {
          id: 'assets',
          label: 'assets',
          icon: <FolderIcon />,
          children: [
            { id: 'image1', label: 'hero.jpg', icon: <ImageIcon /> },
            { id: 'image2', label: 'banner.png', icon: <ImageIcon /> },
            { id: 'image3', label: 'icon.svg', icon: <ImageIcon /> },
          ],
        },
        { id: 'package', label: 'package.json', icon: <PackageIcon /> },
        { id: 'readme', label: 'README.md', icon: <FileIcon /> },
        { id: 'gitignore', label: '.gitignore', icon: <FileIcon /> },
        { id: 'tsconfig', label: 'tsconfig.json', icon: <CodeIcon /> },
      ],
    },
  ];

  // Files in current directory (simulated)
  const currentFiles = [
    { id: 'f1', name: 'README.md', type: 'file', size: '2.4 KB', modified: 'Dec 15, 2024' },
    { id: 'f2', name: 'package.json', type: 'file', size: '1.2 KB', modified: 'Dec 14, 2024' },
    { id: 'f3', name: 'tsconfig.json', type: 'file', size: '0.8 KB', modified: 'Dec 10, 2024' },
    { id: 'f4', name: '.gitignore', type: 'file', size: '0.3 KB', modified: 'Dec 5, 2024' },
    { id: 'f5', name: 'src', type: 'folder', size: '--', modified: 'Dec 15, 2024' },
    { id: 'f6', name: 'public', type: 'folder', size: '--', modified: 'Dec 12, 2024' },
    { id: 'f7', name: 'assets', type: 'folder', size: '--', modified: 'Dec 8, 2024' },
  ];

  // Context menu items
  const fileContextMenu: MenuItem[] = [
    { id: 'open', label: 'Open', shortcut: 'Enter' },
    { id: 'open-with', label: 'Open With...' },
    { type: 'divider' },
    { id: 'cut', label: 'Cut', shortcut: 'Cmd+X' },
    { id: 'copy', label: 'Copy', shortcut: 'Cmd+C' },
    { id: 'paste', label: 'Paste', shortcut: 'Cmd+V', disabled: true },
    { type: 'divider' },
    { id: 'rename', label: 'Rename', shortcut: 'Enter' },
    { id: 'delete', label: 'Delete', shortcut: 'Cmd+Backspace', danger: true },
  ];

  // Sidebar content
  const Sidebar = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'var(--space-2)', borderBottom: '1px solid var(--panel-border)' }}>
        <Text size="sm" weight="medium">Explorer</Text>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Accordion defaultExpandedItems={['folders', 'quickAccess']}>
          <AccordionItem id="folders">
            <AccordionHeader itemId="folders">Folders</AccordionHeader>
            <AccordionContent itemId="folders">
              <TreeView
                data={fileTree}
                selectable
                selectedId={selectedFolder}
                onSelect={(id) => setSelectedFolder(id)}
                defaultExpandedIds={['project', 'src']}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem id="quickAccess">
            <AccordionHeader itemId="quickAccess">Quick Access</AccordionHeader>
            <AccordionContent itemId="quickAccess">
              <List density="compact">
                <ListItem leading={<span>📁</span>}>Desktop</ListItem>
                <ListItem leading={<span>📁</span>}>Documents</ListItem>
                <ListItem leading={<span>📁</span>}>Downloads</ListItem>
                <ListItem leading={<span>⭐</span>}>Favorites</ListItem>
              </List>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem id="tags">
            <AccordionHeader itemId="tags">Tags</AccordionHeader>
            <AccordionContent itemId="tags">
              <Stack gap="xs" style={{ padding: 'var(--space-2)' }}>
                <Chip size="sm" variant="success">Work</Chip>
                <Chip size="sm" variant="info">Personal</Chip>
                <Chip size="sm" variant="warning">Important</Chip>
              </Stack>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );

  // Main content
  const MainContent = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Toolbar variant="bordered" size="sm" style={{ borderBottom: '1px solid var(--panel-border)' }}>
        <ToolbarGroup>
          <IconButton aria-label="New File" size="sm"><NewFileIcon /></IconButton>
          <IconButton aria-label="New Folder" size="sm"><NewFolderIcon /></IconButton>
          <IconButton aria-label="Upload" size="sm"><UploadIcon /></IconButton>
        </ToolbarGroup>
        <ToolbarDivider />
        <ToolbarGroup>
          <IconButton
            aria-label="List View"
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            onClick={() => setViewMode('list')}
          >
            <ListViewIcon />
          </IconButton>
          <IconButton
            aria-label="Grid View"
            size="sm"
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            onClick={() => setViewMode('grid')}
          >
            <GridViewIcon />
          </IconButton>
        </ToolbarGroup>
        <ToolbarSpacer />
        <Text size="sm" color="soft">7 items</Text>
      </Toolbar>

      {/* Breadcrumb */}
      <div style={{ padding: 'var(--space-2)', borderBottom: '1px solid var(--panel-border)' }}>
        <Stack direction="row" gap="xs" align="center">
          <Text size="sm" color="soft">my-project</Text>
          <Text size="sm" color="soft">/</Text>
          <Text size="sm" weight="medium">src</Text>
        </Stack>
      </div>

      {/* File list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Menu items={fileContextMenu} onSelect={(id) => console.log('Action:', id)} contextMenu>
          <List
            selectable
            value={selectedFile}
            onSelectionChange={(value) => setSelectedFile(value as string)}
            density="comfortable"
          >
            {currentFiles.map((file) => (
              <ListItem
                key={file.id}
                value={file.id}
                leading={file.type === 'folder' ? <FolderIcon /> : <FileIcon />}
                trailing={
                  <Stack direction="row" gap="md">
                    <Text size="sm" color="soft" style={{ width: 80 }}>{file.size}</Text>
                    <Text size="sm" color="soft" style={{ width: 100 }}>{file.modified}</Text>
                  </Stack>
                }
              >
                <ListItemText primary={file.name} />
              </ListItem>
            ))}
          </List>
        </Menu>
      </div>

      {/* Status bar */}
      <div style={{
        padding: 'var(--space-1) var(--space-2)',
        borderTop: '1px solid var(--panel-border)',
        background: 'var(--inset-bg)'
      }}>
        <Stack direction="row" justify="between">
          <Text size="xs" color="soft">
            {selectedFile ? `Selected: ${selectedFile}` : '7 items'}
          </Text>
          <Text size="xs" color="soft">4.7 KB used</Text>
        </Stack>
      </div>
    </div>
  );

  // Details panel
  const DetailsPanel = () => (
    <Panel style={{ height: '100%' }}>
      <div style={{ padding: 'var(--space-2)', borderBottom: '1px solid var(--panel-border)' }}>
        <Text size="sm" weight="medium">Details</Text>
      </div>
      <div style={{ padding: 'var(--space-3)' }}>
        {selectedFile ? (
          <Stack gap="md">
            <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
              <span style={{ fontSize: 48 }}>📄</span>
            </div>
            <Heading level={4}>README.md</Heading>
            <Divider />
            <Stack gap="sm">
              <Stack direction="row" justify="between">
                <Text size="sm" color="soft">Type</Text>
                <Text size="sm">Markdown</Text>
              </Stack>
              <Stack direction="row" justify="between">
                <Text size="sm" color="soft">Size</Text>
                <Text size="sm">2.4 KB</Text>
              </Stack>
              <Stack direction="row" justify="between">
                <Text size="sm" color="soft">Modified</Text>
                <Text size="sm">Dec 15, 2024</Text>
              </Stack>
              <Stack direction="row" justify="between">
                <Text size="sm" color="soft">Created</Text>
                <Text size="sm">Nov 1, 2024</Text>
              </Stack>
            </Stack>
            <Divider />
            <Stack gap="xs">
              <Text size="sm" weight="medium">Tags</Text>
              <Stack direction="row" gap="xs">
                <Chip size="sm" variant="success">Documentation</Chip>
                <Chip size="sm" variant="outline">+ Add</Chip>
              </Stack>
            </Stack>
          </Stack>
        ) : (
          <Text color="soft" size="sm">Select a file to view details</Text>
        )}
      </div>
    </Panel>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* App Header */}
      <div style={{
        padding: 'var(--space-2) var(--space-3)',
        borderBottom: '1px solid var(--panel-border)',
        background: 'var(--panel-bg)'
      }}>
        <Stack direction="row" justify="between" align="center">
          <Stack direction="row" gap="md" align="center">
            <Heading level={4}>File Explorer</Heading>
          </Stack>
          <Stack direction="row" gap="sm">
            <Button size="sm" variant="ghost">Settings</Button>
            <Button size="sm" variant="primary">Sync</Button>
          </Stack>
        </Stack>
      </div>

      {/* Main Layout */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <SplitPane
          first={<Sidebar />}
          second={
            <SplitPane
              first={<MainContent />}
              second={<DetailsPanel />}
              defaultSize="70%"
              minSize={300}
              collapsible
            />
          }
          defaultSize={250}
          minSize={180}
          maxSize={350}
          collapsible
        />
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Example Pages/FileExplorer',
  component: FileExplorerPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## Building a File Explorer

This example demonstrates how to build a file explorer interface similar to VS Code or Finder.

### Layout Structure

Use nested **SplitPane** components to create the three-panel layout:

\`\`\`
┌─────────┬──────────────────┬─────────┐
│         │                  │         │
│ Sidebar │   Main Content   │ Details │
│ (Tree)  │   (File List)    │  Panel  │
│         │                  │         │
└─────────┴──────────────────┴─────────┘
\`\`\`

### Sidebar with TreeView

Use **TreeView** inside an **Accordion** for collapsible sections:

\`\`\`tsx
<Accordion>
  <AccordionItem id="folders">
    <AccordionHeader>Folders</AccordionHeader>
    <AccordionContent>
      <TreeView
        data={fileTree}
        selectable
        defaultExpandedIds={['src']}
      />
    </AccordionContent>
  </AccordionItem>
</Accordion>
\`\`\`

### Context Menu

Wrap the file list with **Menu** using \`contextMenu\` prop:

\`\`\`tsx
<Menu items={contextMenuItems} contextMenu onSelect={handleAction}>
  <List selectable>{/* file items */}</List>
</Menu>
\`\`\`

### Toolbar with View Toggle

Use **Toolbar** with **IconButton** for view mode switching:

\`\`\`tsx
<Toolbar>
  <IconButton
    variant={viewMode === 'list' ? 'default' : 'ghost'}
    onClick={() => setViewMode('list')}
  />
</Toolbar>
\`\`\`

### Components Used

| Component | Purpose |
|-----------|---------|
| SplitPane | Main layout with resizable panels |
| TreeView | Folder hierarchy navigation |
| Accordion | Collapsible sidebar sections |
| List, ListItem | File listings |
| Menu | Context menu for file actions |
| Toolbar | Action bar |
| IconButton | View mode toggles |
| Chip | Tags and badges |
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {};
