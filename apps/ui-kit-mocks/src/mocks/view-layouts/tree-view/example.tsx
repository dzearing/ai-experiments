import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { TreeView, TreeNode } from './TreeView';
import { Button } from '@claude-flow/ui-kit-react';
import { AddIcon, RefreshIcon, ExpandIcon, CollapseIcon } from '@claude-flow/ui-kit-icons';
import styles from './example.module.css';

// Generate a large dataset for virtualization demo
const generateLargeDataset = (depth: number = 3, breadth: number = 5): TreeNode[] => {
  let nodeId = 0;
  
  const generateNodes = (level: number, parentPath: string = ''): TreeNode[] => {
    if (level === 0) return [];
    
    return Array.from({ length: breadth }, (_, i) => {
      const id = `node-${++nodeId}`;
      const path = parentPath ? `${parentPath}/${i}` : `${i}`;
      const isFile = level === 1 && i % 3 === 0;
      
      const node: TreeNode = {
        id,
        label: isFile ? `file-${path}.ts` : `folder-${path}`,
        type: isFile ? 'file' : 'folder',
      };
      
      if (!isFile && level > 1) {
        node.children = generateNodes(level - 1, path);
      }
      
      return node;
    });
  };
  
  return generateNodes(depth);
};

const TreeViewExample: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [treeHeight, setTreeHeight] = useState(400);
  const [itemHeight, setItemHeight] = useState(32);
  const [dataSize, setDataSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [lastAction, setLastAction] = useState('');

  // Generate different sized datasets
  const treeData = useMemo(() => {
    switch (dataSize) {
      case 'small':
        return [
          {
            id: '1',
            label: 'src',
            type: 'folder' as const,
            children: [
              {
                id: '2',
                label: 'components',
                type: 'folder' as const,
                children: [
                  { id: '3', label: 'Button.tsx', type: 'file' as const },
                  { id: '4', label: 'Card.tsx', type: 'file' as const },
                ]
              },
              { id: '5', label: 'App.tsx', type: 'file' as const },
              { id: '6', label: 'index.ts', type: 'file' as const },
            ]
          },
          {
            id: '7',
            label: 'public',
            type: 'folder' as const,
            children: [
              { id: '8', label: 'index.html', type: 'file' as const },
              { id: '9', label: 'favicon.ico', type: 'file' as const },
            ]
          },
          { id: '10', label: 'package.json', type: 'file' as const },
          { id: '11', label: 'README.md', type: 'file' as const },
        ];
      case 'medium':
        return generateLargeDataset(4, 5);
      case 'large':
        return generateLargeDataset(5, 8);
      default:
        return [];
    }
  }, [dataSize]);

  // Reset expanded nodes when data size changes
  useEffect(() => {
    setExpandedNodes(new Set());
    setSelectedNodeId(null);
  }, [dataSize]);

  // Helper function to get all folder IDs recursively
  const getAllFolderIds = useCallback((nodes: TreeNode[]): string[] => {
    const ids: string[] = [];
    const traverse = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'folder') {
          ids.push(node.id);
          if (node.children) {
            traverse(node.children);
          }
        }
      });
    };
    traverse(nodes);
    return ids;
  }, []);

  const handleNodeClick = (node: TreeNode) => {
    setSelectedNodeId(node.id);
    setLastAction(`Selected: ${node.label}`);
  };

  const handleNodeExpand = (node: TreeNode) => {
    setLastAction(`Expanded: ${node.label}`);
  };

  const handleNodeCollapse = (node: TreeNode) => {
    setLastAction(`Collapsed: ${node.label}`);
  };

  const handleExpandedNodesChange = (nodes: Set<string>) => {
    setExpandedNodes(nodes);
  };

  const handleExpandAll = () => {
    const allFolderIds = getAllFolderIds(treeData);
    setExpandedNodes(new Set(allFolderIds));
    setLastAction(`Expanded all ${allFolderIds.length} folders`);
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set());
    setLastAction('Collapsed all folders');
  };

  return (
    <div className={styles.exampleContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Virtualized Tree View</h2>
        <p className={styles.description}>
          A high-performance tree view component with virtualization for handling large datasets efficiently.
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.label}>Data Size:</label>
          <div className={styles.buttonGroup}>
            <Button
              variant={dataSize === 'small' ? 'primary' : 'neutral'}
              size="small"
              onClick={() => setDataSize('small')}
            >
              Small (~10 nodes)
            </Button>
            <Button
              variant={dataSize === 'medium' ? 'primary' : 'neutral'}
              size="small"
              onClick={() => setDataSize('medium')}
            >
              Medium (~150 nodes)
            </Button>
            <Button
              variant={dataSize === 'large' ? 'primary' : 'neutral'}
              size="small"
              onClick={() => setDataSize('large')}
            >
              Large (~500+ nodes)
            </Button>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.label}>Tree Height:</label>
          <div className={styles.buttonGroup}>
            <Button
              variant={treeHeight === 300 ? 'primary' : 'neutral'}
              size="small"
              onClick={() => setTreeHeight(300)}
            >
              300px
            </Button>
            <Button
              variant={treeHeight === 400 ? 'primary' : 'neutral'}
              size="small"
              onClick={() => setTreeHeight(400)}
            >
              400px
            </Button>
            <Button
              variant={treeHeight === 600 ? 'primary' : 'neutral'}
              size="small"
              onClick={() => setTreeHeight(600)}
            >
              600px
            </Button>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.label}>Item Height:</label>
          <div className={styles.buttonGroup}>
            <Button
              variant={itemHeight === 28 ? 'primary' : 'neutral'}
              size="small"
              onClick={() => setItemHeight(28)}
            >
              Compact (28px)
            </Button>
            <Button
              variant={itemHeight === 32 ? 'primary' : 'neutral'}
              size="small"
              onClick={() => setItemHeight(32)}
            >
              Default (32px)
            </Button>
            <Button
              variant={itemHeight === 40 ? 'primary' : 'neutral'}
              size="small"
              onClick={() => setItemHeight(40)}
            >
              Comfortable (40px)
            </Button>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.label}>Actions:</label>
          <div className={styles.buttonGroup}>
            <Button
              variant="neutral"
              size="small"
              onClick={handleExpandAll}
              icon={<ExpandIcon />}
            >
              Expand All
            </Button>
            <Button
              variant="neutral"
              size="small"
              onClick={handleCollapseAll}
              icon={<CollapseIcon />}
            >
              Collapse All
            </Button>
            <Button
              variant="neutral"
              size="small"
              onClick={() => {
                setSelectedNodeId(null);
                setLastAction('Selection cleared');
              }}
              icon={<RefreshIcon />}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.status}>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Selected:</span>
          <span className={styles.statusValue}>
            {selectedNodeId || 'None'}
          </span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Expanded Folders:</span>
          <span className={styles.statusValue}>{expandedNodes.size}</span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Last Action:</span>
          <span className={styles.statusValue}>
            {lastAction || 'No actions yet'}
          </span>
        </div>
      </div>

      <div className={styles.demoSection}>
        <h3 className={styles.sectionTitle}>Interactive Demo</h3>
        <TreeView
          data={treeData}
          height={treeHeight}
          itemHeight={itemHeight}
          selectedNodeId={selectedNodeId}
          onNodeClick={handleNodeClick}
          onNodeExpand={handleNodeExpand}
          onNodeCollapse={handleNodeCollapse}
          expandedNodes={expandedNodes}
          onExpandedNodesChange={handleExpandedNodesChange}
        />
      </div>

      <div className={styles.features}>
        <h3 className={styles.sectionTitle}>Features</h3>
        <ul className={styles.featureList}>
          <li>🚀 <strong>Virtualization:</strong> Efficiently renders only visible nodes for optimal performance</li>
          <li>📁 <strong>Hierarchical Structure:</strong> Supports nested folders and files</li>
          <li>🎯 <strong>Keyboard Navigation:</strong> Full keyboard support with all standard tree navigation keys</li>
          <li>♿ <strong>Accessibility:</strong> ARIA attributes and proper roles for screen readers</li>
          <li>🎨 <strong>Theming:</strong> Fully integrated with ui-kit design tokens</li>
          <li>📱 <strong>Responsive:</strong> Adapts to different screen sizes</li>
          <li>⚡ <strong>Performance:</strong> Handles thousands of nodes smoothly</li>
          <li>🔄 <strong>Smooth Scrolling:</strong> Buffer zone for seamless scrolling experience</li>
        </ul>

        <h4 className={styles.subSectionTitle}>Keyboard Navigation</h4>
        <div className={styles.keyboardGuide}>
          <div className={styles.keyboardSection}>
            <h5 className={styles.keyboardTitle}>Navigation</h5>
            <ul className={styles.keyboardList}>
              <li><kbd>↑</kbd> <kbd>↓</kbd> Navigate and select up/down</li>
              <li><kbd>Page Up</kbd> <kbd>Page Down</kbd> Jump by page</li>
              <li><kbd>Home</kbd> <kbd>End</kbd> Go to first/last item</li>
            </ul>
          </div>
          <div className={styles.keyboardSection}>
            <h5 className={styles.keyboardTitle}>Tree Operations</h5>
            <ul className={styles.keyboardList}>
              <li><kbd>→</kbd> Expand folder or move to first child</li>
              <li><kbd>←</kbd> Collapse folder or move to parent</li>
              <li><kbd>Enter</kbd> <kbd>Space</kbd> Toggle expand/select</li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.usage}>
        <h3 className={styles.sectionTitle}>Usage Example</h3>
        <pre className={styles.codeBlock}>
{`import { TreeView } from './TreeView';

const MyFileExplorer = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  
  const treeData = [
    {
      id: '1',
      label: 'src',
      type: 'folder',
      children: [
        { id: '2', label: 'App.tsx', type: 'file' },
        { id: '3', label: 'index.ts', type: 'file' }
      ]
    }
  ];
  
  return (
    <TreeView
      data={treeData}
      height={400}
      itemHeight={32}
      selectedNodeId={selectedNode?.id}
      onNodeClick={setSelectedNode}
    />
  );
};`}
        </pre>
      </div>
    </div>
  );
};

export default TreeViewExample;