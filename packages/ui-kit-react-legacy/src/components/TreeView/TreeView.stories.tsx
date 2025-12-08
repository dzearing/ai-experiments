import type { Meta, StoryObj } from '@storybook/react';
import { TreeView } from './TreeView';
import type { TreeNode, IconResolver } from './TreeView';
import { useState } from 'react';
import { FileIcon, FolderIcon, CodeIcon, ImageIcon } from '@claude-flow/ui-kit-icons';

const meta: Meta<typeof TreeView> = {
  title: 'Components/TreeView',
  component: TreeView,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    height: {
      control: { type: 'number', min: 100, max: 800, step: 50 },
      description: 'Height of the tree view container',
    },
    itemHeight: {
      control: { type: 'number', min: 20, max: 60, step: 4 },
      description: 'Height of each tree node',
    },
    iconResolver: {
      description: 'Custom function to resolve icons based on node type and properties',
      control: false,
    },
    defaultIconMap: {
      description: 'Map of type strings to icon components',
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData: TreeNode[] = [
  {
    id: '1',
    label: 'src',
    type: 'folder',
    children: [
      {
        id: '1-1',
        label: 'components',
        type: 'folder',
        children: [
          {
            id: '1-1-1',
            label: 'Button.tsx',
            type: 'file',
          },
          {
            id: '1-1-2',
            label: 'Card.tsx',
            type: 'file',
          },
          {
            id: '1-1-3',
            label: 'Dialog.tsx',
            type: 'file',
          },
        ],
      },
      {
        id: '1-2',
        label: 'utils',
        type: 'folder',
        children: [
          {
            id: '1-2-1',
            label: 'helpers.ts',
            type: 'file',
          },
          {
            id: '1-2-2',
            label: 'constants.ts',
            type: 'file',
          },
        ],
      },
      {
        id: '1-3',
        label: 'App.tsx',
        type: 'file',
      },
      {
        id: '1-4',
        label: 'index.tsx',
        type: 'file',
      },
    ],
  },
  {
    id: '2',
    label: 'public',
    type: 'folder',
    children: [
      {
        id: '2-1',
        label: 'index.html',
        type: 'file',
      },
      {
        id: '2-2',
        label: 'favicon.ico',
        type: 'file',
      },
    ],
  },
  {
    id: '3',
    label: 'package.json',
    type: 'file',
  },
  {
    id: '4',
    label: 'README.md',
    type: 'file',
  },
];

const largeData: TreeNode[] = Array.from({ length: 20 }, (_, i) => ({
  id: `folder-${i}`,
  label: `Folder ${i + 1}`,
  type: 'folder',
  children: Array.from({ length: 10 }, (_, j) => ({
    id: `folder-${i}-file-${j}`,
    label: `File ${j + 1}.ts`,
    type: 'file',
  })),
}));

export const Default: Story = {
  render: (args) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    
    return (
      <TreeView
        {...args}
        expandedNodes={expandedNodes}
        onExpandedNodesChange={setExpandedNodes}
        selectedNodeId={selectedNodeId}
        onNodeClick={(node) => setSelectedNodeId(node.id)}
      />
    );
  },
  args: {
    data: sampleData,
    height: 400,
    itemHeight: 32,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export const WithSelection: Story = {
  render: (args) => {
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '1-1']));

    return (
      <div style={{ width: '400px' }}>
        <TreeView
          {...args}
          selectedNodeId={selectedNodeId}
          expandedNodes={expandedNodes}
          onExpandedNodesChange={setExpandedNodes}
          onNodeClick={(node) => {
            setSelectedNodeId(node.id);
            console.log('Node clicked:', node);
          }}
          onNodeExpand={(node) => {
            console.log('Node expanded:', node);
          }}
          onNodeCollapse={(node) => {
            console.log('Node collapsed:', node);
          }}
        />
      </div>
    );
  },
  args: {
    data: sampleData,
    height: 400,
    itemHeight: 32,
  },
};

export const LargeDataset: Story = {
  render: (args) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    
    return (
      <TreeView
        {...args}
        expandedNodes={expandedNodes}
        onExpandedNodesChange={setExpandedNodes}
        selectedNodeId={selectedNodeId}
        onNodeClick={(node) => setSelectedNodeId(node.id)}
      />
    );
  },
  args: {
    data: largeData,
    height: 500,
    itemHeight: 32,
  },
};

export const SmallHeight: Story = {
  args: {
    data: sampleData,
    height: 200,
    itemHeight: 32,
  },
};

export const CustomItemHeight: Story = {
  args: {
    data: sampleData,
    height: 400,
    itemHeight: 40,
  },
};

export const EmptyState: Story = {
  args: {
    data: [],
    height: 400,
    itemHeight: 32,
  },
};

export const SingleFile: Story = {
  args: {
    data: [
      {
        id: '1',
        label: 'standalone-file.js',
        type: 'file',
      },
    ],
    height: 100,
    itemHeight: 32,
  },
};

export const DeeplyNested: Story = {
  args: {
    data: [
      {
        id: '1',
        label: 'root',
        type: 'folder',
        children: [
          {
            id: '1-1',
            label: 'level-1',
            type: 'folder',
            children: [
              {
                id: '1-1-1',
                label: 'level-2',
                type: 'folder',
                children: [
                  {
                    id: '1-1-1-1',
                    label: 'level-3',
                    type: 'folder',
                    children: [
                      {
                        id: '1-1-1-1-1',
                        label: 'deep-file.txt',
                        type: 'file',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    height: 300,
    itemHeight: 32,
  },
};

// Example with custom icon types
const customIconData: TreeNode[] = [
  {
    id: '1',
    label: 'project',
    type: 'folder',
    children: [
      {
        id: '1-1',
        label: 'src',
        type: 'folder',
        children: [
          {
            id: '1-1-1',
            label: 'App.tsx',
            type: 'typescript',
          },
          {
            id: '1-1-2',
            label: 'styles.css',
            type: 'css',
          },
          {
            id: '1-1-3',
            label: 'index.html',
            type: 'html',
          },
        ],
      },
      {
        id: '1-2',
        label: 'assets',
        type: 'folder',
        children: [
          {
            id: '1-2-1',
            label: 'logo.png',
            type: 'image',
          },
          {
            id: '1-2-2',
            label: 'background.jpg',
            type: 'image',
          },
        ],
      },
      {
        id: '1-3',
        label: 'docs',
        type: 'folder',
        children: [
          {
            id: '1-3-1',
            label: 'README.md',
            type: 'markdown',
          },
          {
            id: '1-3-2',
            label: 'API.md',
            type: 'markdown',
          },
        ],
      },
      {
        id: '1-4',
        label: 'archive.zip',
        type: 'archive',
      },
    ],
  },
];

export const CustomIconMapping: Story = {
  render: (args) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '1-1', '1-2', '1-3']));
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    
    // Custom icon map for different file types
    const customIconMap = {
      folder: FolderIcon,
      typescript: CodeIcon,
      javascript: CodeIcon,
      css: CodeIcon,
      html: CodeIcon,
      image: ImageIcon,
      markdown: FileIcon, // Using FileIcon as fallback for markdown
      archive: FileIcon, // Using FileIcon as fallback for archive
      file: FileIcon, // fallback
    };
    
    return (
      <TreeView
        {...args}
        defaultIconMap={customIconMap}
        expandedNodes={expandedNodes}
        onExpandedNodesChange={setExpandedNodes}
        selectedNodeId={selectedNodeId}
        onNodeClick={(node) => setSelectedNodeId(node.id)}
      />
    );
  },
  args: {
    data: customIconData,
    height: 400,
    itemHeight: 32,
  },
};

export const CustomIconResolver: Story = {
  render: (args) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '1-1']));
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    
    // Custom icon resolver based on file extension
    const customIconResolver: IconResolver = (type: string, node: TreeNode) => {
      // Extract file extension from label
      const extension = node.label.split('.').pop()?.toLowerCase();
      
      // Map extensions to icons
      switch (extension) {
        case 'ts':
        case 'tsx':
        case 'js':
        case 'jsx':
          return CodeIcon;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
          return ImageIcon;
        case 'md':
        case 'mdx':
        case 'txt':
        case 'doc':
        case 'pdf':
          return FileIcon; // Using FileIcon as fallback for document types
        case 'zip':
        case 'rar':
        case 'tar':
        case 'gz':
          return FileIcon; // Using FileIcon as fallback for archive types
        default:
          // Use type-based fallback
          return type === 'folder' ? FolderIcon : FileIcon;
      }
    };
    
    return (
      <TreeView
        {...args}
        iconResolver={customIconResolver}
        expandedNodes={expandedNodes}
        onExpandedNodesChange={setExpandedNodes}
        selectedNodeId={selectedNodeId}
        onNodeClick={(node) => setSelectedNodeId(node.id)}
      />
    );
  },
  args: {
    data: sampleData,
    height: 400,
    itemHeight: 32,
  },
};