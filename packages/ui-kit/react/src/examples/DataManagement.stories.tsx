import { useState, useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Button,
  Chip,
  Divider,
  Heading,
  Input,
  Panel,
  Stack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Text,
  IconButton,
} from '../index';
import { Table, type TableColumn, type TableSort } from '../components/Table';
import { Menu, type MenuItem } from '../components/Menu';
import { Toolbar, ToolbarGroup, ToolbarDivider, ToolbarSpacer, ButtonGroup } from '../components/Toolbar';
import { List, ListItem, ListItemText } from '../components/List';
import { Accordion, AccordionItem, AccordionHeader, AccordionContent } from '../components/Accordion';

/**
 * # Data Management
 *
 * A comprehensive data management interface demonstrating tables,
 * filtering, and bulk operations.
 *
 * ## Components Used
 * - **Table**: Sortable, selectable data grid
 * - **Toolbar**: Action bar with filters
 * - **Menu**: Bulk action menus
 * - **Tabs**: Data category switching
 * - **Accordion**: Filter panels
 */

// Sample data types
interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  salary: number;
}

interface Project {
  id: string;
  name: string;
  client: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  progress: number;
  deadline: string;
  budget: number;
}

// Icons
const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M1.5 1h13l-5 6v5l-3 2V7l-5-6z"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zm-.82 4.74a6 6 0 1 1 1.06-1.06l3.04 3.04-1.06 1.06-3.04-3.04z"/>
  </svg>
);

const ExportIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1L4 5h3v6h2V5h3L8 1zm-5 9v4h10v-4h-1v3H4v-3H3z"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M7 7V1h2v6h6v2H9v6H7V9H1V7h6z"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M13.65 2.35A8 8 0 1 0 16 8h-2a6 6 0 1 1-1.76-4.24L10 6h6V0l-2.35 2.35z"/>
  </svg>
);

function DataManagementPage() {
  const [activeTab, setActiveTab] = useState('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [employeeSort, setEmployeeSort] = useState<TableSort | null>(null);
  const [projectSort, setProjectSort] = useState<TableSort | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Sample employee data
  const employeeData: Employee[] = [
    { id: '1', name: 'Alice Johnson', email: 'alice@company.com', department: 'Engineering', role: 'Senior Developer', status: 'active', joinDate: '2022-03-15', salary: 95000 },
    { id: '2', name: 'Bob Smith', email: 'bob@company.com', department: 'Engineering', role: 'Developer', status: 'active', joinDate: '2023-01-10', salary: 75000 },
    { id: '3', name: 'Carol Williams', email: 'carol@company.com', department: 'Design', role: 'Lead Designer', status: 'active', joinDate: '2021-08-20', salary: 85000 },
    { id: '4', name: 'David Brown', email: 'david@company.com', department: 'Marketing', role: 'Marketing Manager', status: 'inactive', joinDate: '2020-05-12', salary: 80000 },
    { id: '5', name: 'Eve Davis', email: 'eve@company.com', department: 'Engineering', role: 'Junior Developer', status: 'pending', joinDate: '2024-01-02', salary: 60000 },
    { id: '6', name: 'Frank Miller', email: 'frank@company.com', department: 'HR', role: 'HR Specialist', status: 'active', joinDate: '2022-11-08', salary: 65000 },
    { id: '7', name: 'Grace Lee', email: 'grace@company.com', department: 'Design', role: 'UI Designer', status: 'active', joinDate: '2023-06-15', salary: 70000 },
    { id: '8', name: 'Henry Wilson', email: 'henry@company.com', department: 'Finance', role: 'Financial Analyst', status: 'active', joinDate: '2021-02-28', salary: 78000 },
  ];

  // Sample project data
  const projectData: Project[] = [
    { id: '1', name: 'Website Redesign', client: 'Acme Corp', status: 'active', progress: 65, deadline: '2024-03-15', budget: 150000 },
    { id: '2', name: 'Mobile App v2', client: 'TechStart', status: 'planning', progress: 10, deadline: '2024-06-01', budget: 200000 },
    { id: '3', name: 'API Integration', client: 'GlobalTech', status: 'completed', progress: 100, deadline: '2024-01-30', budget: 75000 },
    { id: '4', name: 'Dashboard Analytics', client: 'DataDriven', status: 'active', progress: 40, deadline: '2024-04-20', budget: 120000 },
    { id: '5', name: 'E-commerce Platform', client: 'RetailPlus', status: 'on-hold', progress: 25, deadline: '2024-05-15', budget: 300000 },
    { id: '6', name: 'CRM System', client: 'SalesForce', status: 'active', progress: 80, deadline: '2024-02-28', budget: 180000 },
  ];

  // Filter data
  const filteredEmployees = useMemo(() => {
    let result = employeeData;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.email.toLowerCase().includes(query) ||
        e.role.toLowerCase().includes(query)
      );
    }

    if (departmentFilter) {
      result = result.filter(e => e.department === departmentFilter);
    }

    if (statusFilter) {
      result = result.filter(e => e.status === statusFilter);
    }

    return result;
  }, [searchQuery, departmentFilter, statusFilter]);

  // Sort data
  const sortedEmployees = useMemo(() => {
    if (!employeeSort) return filteredEmployees;
    return [...filteredEmployees].sort((a, b) => {
      const aValue = a[employeeSort.columnId as keyof Employee];
      const bValue = b[employeeSort.columnId as keyof Employee];
      const direction = employeeSort.direction === 'asc' ? 1 : -1;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * direction;
      }
      return aValue < bValue ? -direction : aValue > bValue ? direction : 0;
    });
  }, [filteredEmployees, employeeSort]);

  const sortedProjects = useMemo(() => {
    if (!projectSort) return projectData;
    return [...projectData].sort((a, b) => {
      const aValue = a[projectSort.columnId as keyof Project];
      const bValue = b[projectSort.columnId as keyof Project];
      const direction = projectSort.direction === 'asc' ? 1 : -1;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * direction;
      }
      return aValue < bValue ? -direction : aValue > bValue ? direction : 0;
    });
  }, [projectSort]);

  // Employee columns
  const employeeColumns: TableColumn<Employee>[] = [
    { id: 'name', header: 'Name', accessor: 'name', sortable: true },
    { id: 'email', header: 'Email', accessor: 'email', sortable: true },
    { id: 'department', header: 'Department', accessor: 'department', sortable: true },
    { id: 'role', header: 'Role', accessor: 'role', sortable: true },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (value) => {
        const variant = value === 'active' ? 'success' : value === 'pending' ? 'warning' : 'outline';
        return <Chip size="sm" variant={variant}>{String(value)}</Chip>;
      },
    },
    { id: 'joinDate', header: 'Join Date', accessor: 'joinDate', sortable: true },
    {
      id: 'salary',
      header: 'Salary',
      accessor: 'salary',
      sortable: true,
      align: 'right',
      cell: (value) => `$${Number(value).toLocaleString()}`,
    },
  ];

  // Project columns
  const projectColumns: TableColumn<Project>[] = [
    { id: 'name', header: 'Project', accessor: 'name', sortable: true },
    { id: 'client', header: 'Client', accessor: 'client', sortable: true },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (value) => {
        const variants: Record<string, 'success' | 'warning' | 'info' | 'outline'> = {
          'completed': 'success',
          'active': 'info',
          'planning': 'warning',
          'on-hold': 'outline',
        };
        return <Chip size="sm" variant={variants[String(value)] || 'outline'}>{String(value)}</Chip>;
      },
    },
    {
      id: 'progress',
      header: 'Progress',
      accessor: 'progress',
      sortable: true,
      align: 'center',
      cell: (value) => (
        <Stack direction="row" gap="sm" align="center">
          <div style={{ width: 60, height: 6, background: 'var(--inset-bg)', borderRadius: 3 }}>
            <div style={{
              width: `${value}%`,
              height: '100%',
              background: 'var(--controlPrimary-bg)',
              borderRadius: 3
            }} />
          </div>
          <Text size="sm">{value}%</Text>
        </Stack>
      ),
    },
    { id: 'deadline', header: 'Deadline', accessor: 'deadline', sortable: true },
    {
      id: 'budget',
      header: 'Budget',
      accessor: 'budget',
      sortable: true,
      align: 'right',
      cell: (value) => `$${Number(value).toLocaleString()}`,
    },
  ];

  // Bulk action menu items
  const bulkActions: MenuItem[] = [
    { id: 'export', label: 'Export Selected', icon: <ExportIcon /> },
    { id: 'edit', label: 'Bulk Edit' },
    { type: 'divider' },
    { id: 'archive', label: 'Archive' },
    { id: 'delete', label: 'Delete', danger: true },
  ];

  const departments = ['Engineering', 'Design', 'Marketing', 'HR', 'Finance'];
  const statuses = ['active', 'inactive', 'pending'];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '1px solid var(--panel-border)',
        background: 'var(--panel-bg)'
      }}>
        <Stack direction="row" justify="between" align="center">
          <div>
            <Heading level={2}>Data Management</Heading>
            <Text color="soft">Manage employees, projects, and resources</Text>
          </div>
          <Stack direction="row" gap="sm">
            <IconButton aria-label="Refresh" size="sm"><RefreshIcon /></IconButton>
            <Button size="sm" variant="primary" leftIcon={<PlusIcon />}>
              Add New
            </Button>
          </Stack>
        </Stack>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--panel-border)' }}>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList style={{ paddingLeft: 'var(--space-4)' }}>
            <Tab value="employees">
              Employees
              <Chip size="sm" variant="outline" style={{ marginLeft: 'var(--space-2)' }}>
                {employeeData.length}
              </Chip>
            </Tab>
            <Tab value="projects">
              Projects
              <Chip size="sm" variant="outline" style={{ marginLeft: 'var(--space-2)' }}>
                {projectData.length}
              </Chip>
            </Tab>
            <Tab value="reports">Reports</Tab>
          </TabList>
        </Tabs>
      </div>

      {/* Toolbar */}
      <Toolbar style={{ padding: 'var(--space-2) var(--space-4)', borderBottom: '1px solid var(--panel-border)' }}>
        <ToolbarGroup>
          <div style={{ width: 300 }}>
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="sm"
            />
          </div>
        </ToolbarGroup>
        <ToolbarGroup>
          <Button
            size="sm"
            variant={showFilters ? 'default' : 'ghost'}
            leftIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
            {(departmentFilter || statusFilter) && (
              <Chip size="sm" variant="info" style={{ marginLeft: 'var(--space-1)' }}>
                {[departmentFilter, statusFilter].filter(Boolean).length}
              </Chip>
            )}
          </Button>
        </ToolbarGroup>
        <ToolbarSpacer />
        <ToolbarGroup>
          {(selectedEmployees.length > 0 || selectedProjects.length > 0) && (
            <>
              <Text size="sm" color="soft">
                {activeTab === 'employees' ? selectedEmployees.length : selectedProjects.length} selected
              </Text>
              <Menu items={bulkActions} onSelect={(id) => console.log('Bulk action:', id)}>
                <Button size="sm" variant="outline">Actions</Button>
              </Menu>
              <ToolbarDivider />
            </>
          )}
          <ButtonGroup>
            <Button size="sm" variant="outline" leftIcon={<ExportIcon />}>Export</Button>
          </ButtonGroup>
        </ToolbarGroup>
      </Toolbar>

      {/* Filter Panel */}
      {showFilters && activeTab === 'employees' && (
        <Panel style={{ margin: 'var(--space-3) var(--space-4)', marginBottom: 0 }}>
          <Accordion allowMultiple defaultExpandedItems={['department', 'status']}>
            <AccordionItem id="department">
              <AccordionHeader itemId="department">Department</AccordionHeader>
              <AccordionContent itemId="department">
                <Stack direction="row" gap="sm" style={{ padding: 'var(--space-2) 0' }}>
                  <Chip
                    size="sm"
                    variant={!departmentFilter ? 'default' : 'outline'}
                    onClick={() => setDepartmentFilter(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    All
                  </Chip>
                  {departments.map((dept) => (
                    <Chip
                      key={dept}
                      size="sm"
                      variant={departmentFilter === dept ? 'default' : 'outline'}
                      onClick={() => setDepartmentFilter(departmentFilter === dept ? null : dept)}
                      style={{ cursor: 'pointer' }}
                    >
                      {dept}
                    </Chip>
                  ))}
                </Stack>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem id="status">
              <AccordionHeader itemId="status">Status</AccordionHeader>
              <AccordionContent itemId="status">
                <Stack direction="row" gap="sm" style={{ padding: 'var(--space-2) 0' }}>
                  <Chip
                    size="sm"
                    variant={!statusFilter ? 'default' : 'outline'}
                    onClick={() => setStatusFilter(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    All
                  </Chip>
                  {statuses.map((status) => (
                    <Chip
                      key={status}
                      size="sm"
                      variant={statusFilter === status ? 'default' : 'outline'}
                      onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                      style={{ cursor: 'pointer' }}
                    >
                      {status}
                    </Chip>
                  ))}
                </Stack>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Panel>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-4)' }}>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabPanels>
            <TabPanel value="employees">
              <Table
                columns={employeeColumns}
                data={sortedEmployees}
                getRowKey={(e) => e.id}
                selectable
                multiSelect
                selectedKeys={selectedEmployees}
                onSelectionChange={setSelectedEmployees}
                sort={employeeSort}
                onSortChange={setEmployeeSort}
                bordered
                stickyHeader
                maxHeight="calc(100vh - 350px)"
                emptyMessage="No employees match your filters"
              />
            </TabPanel>
            <TabPanel value="projects">
              <Table
                columns={projectColumns}
                data={sortedProjects}
                getRowKey={(p) => p.id}
                selectable
                multiSelect
                selectedKeys={selectedProjects}
                onSelectionChange={setSelectedProjects}
                sort={projectSort}
                onSortChange={setProjectSort}
                bordered
                stickyHeader
                maxHeight="calc(100vh - 300px)"
              />
            </TabPanel>
            <TabPanel value="reports">
              <Panel padding="lg">
                <Stack gap="md">
                  <Heading level={4}>Available Reports</Heading>
                  <Divider />
                  <List variant="divided">
                    <ListItem
                      leading={<span>📊</span>}
                      trailing={<Button size="sm" variant="outline">Generate</Button>}
                    >
                      <ListItemText
                        primary="Employee Summary Report"
                        secondary="Overview of all employees by department and status"
                      />
                    </ListItem>
                    <ListItem
                      leading={<span>📈</span>}
                      trailing={<Button size="sm" variant="outline">Generate</Button>}
                    >
                      <ListItemText
                        primary="Project Status Report"
                        secondary="Detailed progress and budget analysis"
                      />
                    </ListItem>
                    <ListItem
                      leading={<span>💰</span>}
                      trailing={<Button size="sm" variant="outline">Generate</Button>}
                    >
                      <ListItemText
                        primary="Budget Allocation Report"
                        secondary="Financial overview across all projects"
                      />
                    </ListItem>
                    <ListItem
                      leading={<span>📅</span>}
                      trailing={<Button size="sm" variant="outline">Generate</Button>}
                    >
                      <ListItemText
                        primary="Timeline Report"
                        secondary="Project deadlines and milestones"
                      />
                    </ListItem>
                  </List>
                </Stack>
              </Panel>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>

      {/* Footer */}
      <div style={{
        padding: 'var(--space-2) var(--space-4)',
        borderTop: '1px solid var(--panel-border)',
        background: 'var(--inset-bg)'
      }}>
        <Stack direction="row" justify="between">
          <Text size="sm" color="soft">
            Showing {activeTab === 'employees' ? sortedEmployees.length : sortedProjects.length} of{' '}
            {activeTab === 'employees' ? employeeData.length : projectData.length} items
          </Text>
          <Text size="sm" color="soft">
            Last updated: {new Date().toLocaleDateString()}
          </Text>
        </Stack>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Example Pages/DataManagement',
  component: DataManagementPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## Building a Data Management Interface

This example demonstrates how to build a comprehensive data management interface with tables, filtering, and bulk operations.

### Key Features

#### Sortable Table
Use the **Table** component with sorting enabled:

\`\`\`tsx
<Table
  columns={columns}
  data={sortedData}
  sort={sort}
  onSortChange={setSort}
  selectable
  multiSelect
/>
\`\`\`

#### Filtering with Accordion
Use **Accordion** for collapsible filter sections:

\`\`\`tsx
<Accordion allowMultiple>
  <AccordionItem id="department">
    <AccordionHeader>Department</AccordionHeader>
    <AccordionContent>
      <Stack direction="row" gap="sm">
        {departments.map(dept => (
          <Chip onClick={() => setFilter(dept)}>{dept}</Chip>
        ))}
      </Stack>
    </AccordionContent>
  </AccordionItem>
</Accordion>
\`\`\`

#### Bulk Actions with Menu
Show bulk actions when items are selected:

\`\`\`tsx
{selectedItems.length > 0 && (
  <Menu items={bulkActions} onSelect={handleBulkAction}>
    <Button>Actions</Button>
  </Menu>
)}
\`\`\`

#### Tabbed Interface
Use **Tabs** for different data categories:

\`\`\`tsx
<Tabs value={activeTab} onChange={setActiveTab}>
  <TabList>
    <Tab value="employees">
      Employees
      <Chip size="sm">{count}</Chip>
    </Tab>
  </TabList>
  <TabPanels>
    <TabPanel value="employees">
      <Table ... />
    </TabPanel>
  </TabPanels>
</Tabs>
\`\`\`

### Components Used

| Component | Purpose |
|-----------|---------|
| Table | Data grid with sort and selection |
| Toolbar | Search and action bar |
| Menu | Bulk action dropdown |
| Tabs | Data category switching |
| Accordion | Collapsible filter panels |
| Chip | Status badges and filter chips |
| List | Report listings |
| Input | Search field |
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {};
