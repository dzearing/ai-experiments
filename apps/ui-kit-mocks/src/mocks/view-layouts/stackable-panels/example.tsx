import React, { useState } from 'react';
import { ViewTemplate, Panel } from './ViewTemplate';
import { Button, Card, Input, Dropdown, Stack, TreeView } from '@claude-flow/ui-kit-react';
import type { DropdownOption, TreeNode } from '@claude-flow/ui-kit-react';
import { 
  HomeIcon, 
  FolderIcon, 
  ListTaskIcon, 
  CalendarIcon, 
  TableIcon,
  GearIcon,
  CheckIcon,
  ClockIcon
} from '@claude-flow/ui-kit-icons';
import styles from './example.module.css';

// Available panel types
type PanelType = 'nav' | 'filters' | 'details' | 'activity';

interface PanelConfig {
  id: PanelType;
  title: string;
  side: 'left' | 'right';
  width: string;
  order: number;
}

const PANEL_CONFIGS: PanelConfig[] = [
  { id: 'nav', title: 'Navigation', side: 'left', width: '200px', order: 0 },
  { id: 'filters', title: 'Filters', side: 'left', width: '240px', order: 1 },
  { id: 'details', title: 'Details', side: 'right', width: '320px', order: 0 },
  { id: 'activity', title: 'Activity', side: 'right', width: '280px', order: 1 }
];

const StackablePanelsExample: React.FC = () => {
  // Start with only Navigation and Details panels (2 panels by default)
  const [activePanels, setActivePanels] = useState<PanelType[]>(['nav', 'details']);
  const [newPanels, setNewPanels] = useState<PanelType[]>([]);
  
  const togglePanel = (panelId: PanelType) => {
    setActivePanels(prev => {
      if (prev.includes(panelId)) {
        // Remove from new panels when removing
        setNewPanels(current => current.filter(id => id !== panelId));
        return prev.filter(id => id !== panelId);
      } else {
        // Mark as new panel when adding
        setNewPanels(current => [...current, panelId]);
        // Clear new panel flag after animation completes
        setTimeout(() => {
          setNewPanels(current => current.filter(id => id !== panelId));
        }, 500);
        return [...prev, panelId];
      }
    });
  };

  const removePanel = (panelId: PanelType) => {
    setNewPanels(current => current.filter(id => id !== panelId));
    setActivePanels(prev => prev.filter(id => id !== panelId));
  };

  const getPanelComponent = (id: PanelType): React.ReactNode => {
    switch (id) {
      case 'nav':
        return <NavigationPanel />;
      case 'filters':
        return <FiltersPanel />;
      case 'details':
        return <DetailsPanel />;
      case 'activity':
        return <ActivityPanel />;
      default:
        return null;
    }
  };

  const createPanel = (config: PanelConfig): Panel => ({
    id: config.id,
    title: config.title,
    content: getPanelComponent(config.id),
    width: config.width,
    order: config.order,
    dismissable: true,
    onDismiss: () => removePanel(config.id),
    isNew: newPanels.includes(config.id)
  });

  const leftPanels = PANEL_CONFIGS
    .filter(config => config.side === 'left' && activePanels.includes(config.id))
    .map(createPanel);

  const rightPanels = PANEL_CONFIGS
    .filter(config => config.side === 'right' && activePanels.includes(config.id))
    .map(createPanel);

  const availablePanels = PANEL_CONFIGS.filter(config => !activePanels.includes(config.id));
  
  const addRandomPanel = (side: 'left' | 'right') => {
    const availableForSide = availablePanels.filter(p => 
      PANEL_CONFIGS.find(c => c.id === p.id)?.side === side
    );
    if (availableForSide.length > 0) {
      const randomPanel = availableForSide[Math.floor(Math.random() * availableForSide.length)];
      togglePanel(randomPanel.id as PanelType);
    }
  };

  return (
    <ViewTemplate
      header={
        <Header 
          activePanels={activePanels}
        />
      }
      leftPanels={leftPanels}
      rightPanels={rightPanels}
      mainContent={<MainContent />}
      footer={<Footer activePanelCount={activePanels.length} />}
      onAddLeftPanel={() => addRandomPanel('left')}
      onAddRightPanel={() => addRandomPanel('right')}
      canAddLeft={availablePanels.some(p => PANEL_CONFIGS.find(c => c.id === p.id)?.side === 'left')}
      canAddRight={availablePanels.some(p => PANEL_CONFIGS.find(c => c.id === p.id)?.side === 'right')}
    />
  );
};

interface HeaderProps {
  activePanels: PanelType[];
}

const Header: React.FC<HeaderProps> = ({ 
  activePanels
}) => {
  return (
    <div className={styles.headerContent}>
      <h1 className={styles.headerTitle}>View Template Example</h1>
      <div className={styles.headerInfo}>
        {activePanels.length} panel{activePanels.length !== 1 ? 's' : ''} active
      </div>
    </div>
  );
};

const NavigationPanel: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('dashboard');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['projects', 'reports']));

  const treeData: TreeNode[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      type: 'dashboard'
    },
    {
      id: 'projects',
      label: 'Projects',
      type: 'folder',
      children: [
        {
          id: 'project-1',
          label: 'Project Alpha',
          type: 'project'
        },
        {
          id: 'project-2',
          label: 'Project Beta',
          type: 'project'
        },
        {
          id: 'project-3',
          label: 'Project Gamma',
          type: 'project'
        }
      ]
    },
    {
      id: 'tasks',
      label: 'Tasks',
      type: 'folder',
      children: [
        {
          id: 'tasks-active',
          label: 'Active Tasks',
          type: 'tasklist'
        },
        {
          id: 'tasks-completed',
          label: 'Completed',
          type: 'tasklist'
        },
        {
          id: 'tasks-archived',
          label: 'Archived',
          type: 'tasklist'
        }
      ]
    },
    {
      id: 'calendar',
      label: 'Calendar',
      type: 'calendar'
    },
    {
      id: 'reports',
      label: 'Reports',
      type: 'folder',
      children: [
        {
          id: 'report-weekly',
          label: 'Weekly Report',
          type: 'report'
        },
        {
          id: 'report-monthly',
          label: 'Monthly Report',
          type: 'report'
        },
        {
          id: 'report-quarterly',
          label: 'Quarterly Report',
          type: 'report'
        }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      type: 'settings'
    }
  ];

  const iconMap = {
    dashboard: HomeIcon,
    folder: FolderIcon,
    project: FolderIcon,
    tasklist: ListTaskIcon,
    calendar: CalendarIcon,
    report: TableIcon,
    settings: GearIcon
  };

  const handleNodeClick = (node: TreeNode) => {
    setSelectedNodeId(node.id);
    console.log('Selected node:', node.label);
  };

  return (
    <div className={styles.navPanelContent}>
      <TreeView
        data={treeData}
        itemHeight={32}
        selectedNodeId={selectedNodeId}
        onNodeClick={handleNodeClick}
        expandedNodes={expandedNodes}
        onExpandedNodesChange={setExpandedNodes}
        defaultIconMap={iconMap}
        className={styles.navTree}
      />
    </div>
  );
};

const FiltersPanel: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const statusOptions: DropdownOption[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'archived', label: 'Archived' }
  ];

  const priorityOptions: DropdownOption[] = [
    { value: 'all', label: 'All' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  return (
    <div className={styles.panelContent}>
      <Stack gap="medium">
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="status-filter">
            Status
          </label>
          <Dropdown
            id="status-filter"
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Select status"
            fullWidth
          />
        </div>
        
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="priority-filter">
            Priority
          </label>
          <Dropdown
            id="priority-filter"
            options={priorityOptions}
            value={priorityFilter}
            onChange={setPriorityFilter}
            placeholder="Select priority"
            fullWidth
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Date Range</label>
          <Stack gap="small">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From date"
              aria-label="From date"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To date"
              aria-label="To date"
            />
          </Stack>
        </div>
      </Stack>
    </div>
  );
};

const DetailsPanel: React.FC = () => (
  <div className={styles.panelContent}>
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>Created:</span>
      <span className={styles.detailValue}>Jan 15, 2025</span>
    </div>
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>Modified:</span>
      <span className={styles.detailValue}>Jan 16, 2025</span>
    </div>
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>Owner:</span>
      <span className={styles.detailValue}>John Doe</span>
    </div>
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>Status:</span>
      <span className={`${styles.detailValue} ${styles.detailValueActive}`}>Active</span>
    </div>
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>Tags:</span>
      <div className={styles.detailTags}>
        <span className={styles.tag}>Design</span>
        <span className={styles.tag}>UI/UX</span>
        <span className={styles.tag}>Frontend</span>
      </div>
    </div>
  </div>
);

const ActivityPanel: React.FC = () => (
  <div className={styles.panelContent}>
    <div className={styles.activityList}>
      <div className={styles.activityItem}>
        <ClockIcon className={styles.activityIcon} />
        <div className={styles.activityContent}>
          <div className={styles.activityTime}>2 hours ago</div>
          <div className={styles.activityText}>File uploaded: design-specs.pdf</div>
        </div>
      </div>
      <div className={styles.activityItem}>
        <ClockIcon className={styles.activityIcon} />
        <div className={styles.activityContent}>
          <div className={styles.activityTime}>5 hours ago</div>
          <div className={styles.activityText}>Status changed to Active</div>
        </div>
      </div>
      <div className={styles.activityItem}>
        <ClockIcon className={styles.activityIcon} />
        <div className={styles.activityContent}>
          <div className={styles.activityTime}>Yesterday</div>
          <div className={styles.activityText}>Project created</div>
        </div>
      </div>
      <div className={styles.activityItem}>
        <ClockIcon className={styles.activityIcon} />
        <div className={styles.activityContent}>
          <div className={styles.activityTime}>2 days ago</div>
          <div className={styles.activityText}>Team member added: Jane Smith</div>
        </div>
      </div>
    </div>
  </div>
);

const MainContent: React.FC = () => {
  const cardData = [
    { 
      id: '1', 
      title: 'Dynamic Panels', 
      description: 'Add or remove panels dynamically. Start with just 2 panels and add more as needed.'
    },
    { 
      id: '2', 
      title: 'Dismissable Panels', 
      description: 'Each panel can be dismissed with a close button in its header.'
    },
    { 
      id: '3', 
      title: 'Flexible Layout', 
      description: 'Panels automatically stack on each side with smooth animations.'
    },
    { 
      id: '4', 
      title: 'Customizable', 
      description: 'Easy to add new panel types and configurations.'
    }
  ];

  return (
    <div className={styles.mainContent}>
      <Stack gap="large">
        <div>
          <h2 className={styles.mainTitle}>Dynamic Panel System</h2>
          <p className={styles.mainText}>
            This example demonstrates a flexible panel system where you can add and remove panels dynamically. 
            Start with just the essential panels and add more as your workflow requires. Each panel can be 
            dismissed individually using the close button in its header.
          </p>
        </div>
        
        <div className={styles.contentGrid}>
          {cardData.map((card) => (
            <Card key={card.id} className={styles.contentCard}>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardText}>{card.description}</p>
              <Button variant="neutral" size="small">
                Learn More
              </Button>
            </Card>
          ))}
        </div>

        <Card className={styles.featureSection}>
          <h3 className={styles.sectionTitle}>Features</h3>
          <Stack gap="small">
            <div className={styles.featureItem}>
              <CheckIcon className={styles.featureIcon} />
              <span>Start with minimal panels (2 by default)</span>
            </div>
            <div className={styles.featureItem}>
              <CheckIcon className={styles.featureIcon} />
              <span>Add panels dynamically with "Add Panel" button</span>
            </div>
            <div className={styles.featureItem}>
              <CheckIcon className={styles.featureIcon} />
              <span>Dismiss panels individually with close buttons</span>
            </div>
            <div className={styles.featureItem}>
              <CheckIcon className={styles.featureIcon} />
              <span>Panels remember their assigned side (left/right)</span>
            </div>
            <div className={styles.featureItem}>
              <CheckIcon className={styles.featureIcon} />
              <span>Smooth animations for panel transitions</span>
            </div>
            <div className={styles.featureItem}>
              <CheckIcon className={styles.featureIcon} />
              <span>Responsive layout adjusts to panel changes</span>
            </div>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
};

const Footer: React.FC<{ activePanelCount: number }> = ({ activePanelCount }) => (
  <div className={styles.footerContent}>
    <span className={styles.footerText}>Dynamic Panel Example</span>
    <span className={styles.footerStatus}>
      {PANEL_CONFIGS.length} panels available • {activePanelCount} active
    </span>
  </div>
);

export default StackablePanelsExample;