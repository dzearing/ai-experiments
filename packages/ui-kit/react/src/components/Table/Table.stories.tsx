import { useState, useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { Table, type TableColumn, type TableSort } from './Table';
import { Chip } from '../Chip';
import { Avatar } from '../Avatar';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Input } from '../Input';
import { Button } from '../Button';

/**
 * # Table
 *
 * Display tabular data with sorting and selection support.
 *
 * ## Features
 *
 * - Sortable columns with click to toggle
 * - Single and multi-select row selection
 * - Custom cell renderers
 * - Loading and empty states
 * - Sticky header support
 * - Bordered and striped styles
 *
 * ## Usage
 *
 * ```tsx
 * import { Table, type TableColumn } from '@ui-kit/react';
 *
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * const columns: TableColumn<User>[] = [
 *   { id: 'name', header: 'Name', accessor: 'name', sortable: true },
 *   { id: 'email', header: 'Email', accessor: 'email' },
 * ];
 *
 * <Table
 *   columns={columns}
 *   data={users}
 *   getRowKey={(user) => user.id}
 *   selectable
 *   onSelectionChange={(keys) => console.log(keys)}
 * />
 * ```
 *
 * @see [Example: Data Management](/docs/example-pages-datamanagement--docs)
 */

const meta: Meta<typeof Table> = {
  title: 'Data Display/Table',
  component: Table,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Display tabular data with sorting, selection, and custom cell rendering.

## When to Use

- Data grids showing structured records (users, products, orders)
- Admin panels with sortable and filterable lists
- Reports and dashboards with tabular data
- Comparison tables (features, pricing plans)
- Any interface requiring organized row/column data display

## Variants

| Feature | Use Case |
|---------|----------|
| \`bordered\` | Add borders around cells for visual structure |
| \`striped\` | Alternate row backgrounds for better scanning |
| \`stickyHeader\` | Keep header visible while scrolling long tables |
| \`selectable\` | Enable row selection (single or multi-select) |
| \`sortable\` | Click column headers to sort data |

## Sizes

The \`size\` prop controls row density:
- **sm**: Compact rows for dense data display
- **md**: Default comfortable spacing (recommended)
- **lg**: Spacious rows for touch interfaces

## Accessibility

- Semantic \`<table>\` structure with proper \`<thead>\`, \`<tbody>\`, \`<th>\`, \`<td>\` elements
- Sortable columns have \`aria-sort\` attributes (ascending, descending, none)
- Keyboard navigation: Tab through sortable headers, Enter/Space to sort
- Row selection: Click row or checkbox, indicated with \`aria-selected\`
- Multi-select has select-all checkbox in header
- RTL support with CSS logical properties

## Usage

\`\`\`tsx
import { Table, type TableColumn } from '@ui-kit/react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const columns: TableColumn<User>[] = [
  { id: 'name', header: 'Name', accessor: 'name', sortable: true },
  { id: 'email', header: 'Email', accessor: 'email' },
  { id: 'role', header: 'Role', accessor: 'role' },
];

<Table
  columns={columns}
  data={users}
  getRowKey={(user) => user.id}
  selectable
  onSelectionChange={(keys) => console.log(keys)}
  sort={sort}
  onSortChange={setSort}
/>
\`\`\`
        `,
      },
    },
  },
  args: {
    onSortChange: fn(),
    onSelectionChange: fn(),
  },
  argTypes: {
    bordered: {
      control: 'boolean',
      description: 'Show borders around cells',
    },
    striped: {
      control: 'boolean',
      description: 'Alternate row backgrounds',
    },
    stickyHeader: {
      control: 'boolean',
      description: 'Keep header fixed when scrolling',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
    selectable: {
      control: 'boolean',
      description: 'Enable row selection',
    },
    multiSelect: {
      control: 'boolean',
      description: 'Allow multiple row selection',
    },
    maxHeight: {
      control: 'text',
      description: 'Max height for scrollable table',
    },
    emptyMessage: {
      control: 'text',
      description: 'Message shown when no data',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

// Sample data types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
}

// Sample user data
const userData: User[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'active', joinDate: '2023-01-15' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'Developer', status: 'active', joinDate: '2023-03-22' },
  { id: '3', name: 'Carol Williams', email: 'carol@example.com', role: 'Designer', status: 'inactive', joinDate: '2023-02-10' },
  { id: '4', name: 'David Brown', email: 'david@example.com', role: 'Developer', status: 'pending', joinDate: '2023-06-05' },
  { id: '5', name: 'Eve Davis', email: 'eve@example.com', role: 'Manager', status: 'active', joinDate: '2022-11-30' },
];

// Sample product data
const productData: Product[] = [
  { id: '1', name: 'Laptop Pro', category: 'Electronics', price: 1299.99, stock: 45, rating: 4.8 },
  { id: '2', name: 'Wireless Mouse', category: 'Electronics', price: 49.99, stock: 150, rating: 4.5 },
  { id: '3', name: 'Standing Desk', category: 'Furniture', price: 599.99, stock: 23, rating: 4.7 },
  { id: '4', name: 'Monitor 27"', category: 'Electronics', price: 399.99, stock: 67, rating: 4.6 },
  { id: '5', name: 'Ergonomic Chair', category: 'Furniture', price: 449.99, stock: 31, rating: 4.4 },
  { id: '6', name: 'Keyboard', category: 'Electronics', price: 129.99, stock: 89, rating: 4.3 },
];

// Basic columns
const basicColumns: TableColumn<User>[] = [
  { id: 'name', header: 'Name', accessor: 'name' },
  { id: 'email', header: 'Email', accessor: 'email' },
  { id: 'role', header: 'Role', accessor: 'role' },
];

export const Default: Story = {
  render: () => (
    <Table
      columns={basicColumns}
      data={userData}
      getRowKey={(user) => user.id}
    />
  ),
};

// Sortable table
export const Sortable: Story = {
  render: () => {
    const [sort, setSort] = useState<TableSort | null>(null);

    const sortableColumns: TableColumn<User>[] = [
      { id: 'name', header: 'Name', accessor: 'name', sortable: true },
      { id: 'email', header: 'Email', accessor: 'email', sortable: true },
      { id: 'role', header: 'Role', accessor: 'role', sortable: true },
      { id: 'joinDate', header: 'Join Date', accessor: 'joinDate', sortable: true },
    ];

    const sortedData = useMemo(() => {
      if (!sort) return userData;
      return [...userData].sort((a, b) => {
        const aValue = a[sort.columnId as keyof User];
        const bValue = b[sort.columnId as keyof User];
        const direction = sort.direction === 'asc' ? 1 : -1;
        return aValue < bValue ? -direction : aValue > bValue ? direction : 0;
      });
    }, [sort]);

    return (
      <Stack gap="md">
        <Table
          columns={sortableColumns}
          data={sortedData}
          getRowKey={(user) => user.id}
          sort={sort}
          onSortChange={setSort}
        />
        <Text size="sm" color="soft">
          Sort: {sort ? `${sort.columnId} (${sort.direction})` : 'none'}
        </Text>
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Click column headers to sort. Click again to toggle direction, third click clears sort.',
      },
    },
  },
};

// Single select
export const SingleSelect: Story = {
  render: () => {
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

    return (
      <Stack gap="md">
        <Table
          columns={basicColumns}
          data={userData}
          getRowKey={(user) => user.id}
          selectable
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
        />
        <Text size="sm" color="soft">
          Selected: {selectedKeys.length > 0 ? selectedKeys.join(', ') : 'none'}
        </Text>
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Single selection mode - click a row or radio button to select.',
      },
    },
  },
};

// Multi select
export const MultiSelect: Story = {
  render: () => {
    const [selectedKeys, setSelectedKeys] = useState<string[]>(['1', '3']);

    return (
      <Stack gap="md">
        <Table
          columns={basicColumns}
          data={userData}
          getRowKey={(user) => user.id}
          selectable
          multiSelect
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
        />
        <Text size="sm" color="soft">
          Selected: {selectedKeys.length} row(s)
        </Text>
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Multi-selection with checkboxes and select all header.',
      },
    },
  },
};

// Custom cell renderers
export const CustomCells: Story = {
  render: () => {
    const columns: TableColumn<User>[] = [
      {
        id: 'name',
        header: 'User',
        accessor: 'name',
        cell: (value, row) => (
          <Stack direction="row" gap="sm" align="center">
            <Avatar size="sm" fallback={String(value).charAt(0)} />
            <Stack gap="xs">
              <Text weight="medium">{String(value)}</Text>
              <Text size="sm" color="soft">{row.email}</Text>
            </Stack>
          </Stack>
        ),
      },
      { id: 'role', header: 'Role', accessor: 'role' },
      {
        id: 'status',
        header: 'Status',
        accessor: 'status',
        cell: (value) => {
          const variant = value === 'active' ? 'success' : value === 'pending' ? 'warning' : 'outline';
          return <Chip size="sm" variant={variant}>{String(value)}</Chip>;
        },
      },
      { id: 'joinDate', header: 'Join Date', accessor: 'joinDate' },
    ];

    return (
      <Table
        columns={columns}
        data={userData}
        getRowKey={(user) => user.id}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Use custom cell renderers to display rich content like avatars, chips, and nested layouts.',
      },
    },
  },
};

// Bordered and striped
export const Variants: Story = {
  render: () => (
    <Stack gap="lg">
      <div>
        <Text size="sm" weight="medium" style={{ marginBottom: 'var(--space-2)' }}>Bordered</Text>
        <Table columns={basicColumns} data={userData.slice(0, 4)} getRowKey={(user) => user.id} bordered />
      </div>
      <div>
        <Text size="sm" weight="medium" style={{ marginBottom: 'var(--space-2)' }}>Striped</Text>
        <Table columns={basicColumns} data={userData.slice(0, 4)} getRowKey={(user) => user.id} striped />
      </div>
      <div>
        <Text size="sm" weight="medium" style={{ marginBottom: 'var(--space-2)' }}>Bordered + Striped</Text>
        <Table columns={basicColumns} data={userData.slice(0, 4)} getRowKey={(user) => user.id} bordered striped />
      </div>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Apply bordered or striped styles, or combine them.',
      },
    },
  },
};

// Sticky header with scroll
export const StickyHeader: Story = {
  render: () => {
    // Create enough data to demonstrate scrolling and sticky header
    const extendedData = [
      ...userData,
      ...userData.map((u, i) => ({ ...u, id: `${u.id}-copy1-${i}` })),
      ...userData.map((u, i) => ({ ...u, id: `${u.id}-copy2-${i}` })),
      ...userData.map((u, i) => ({ ...u, id: `${u.id}-copy3-${i}` })),
      ...userData.map((u, i) => ({ ...u, id: `${u.id}-copy4-${i}` })),
    ];

    return (
      <Table
        columns={basicColumns}
        data={extendedData}
        getRowKey={(user) => user.id}
        stickyHeader
        maxHeight={300}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Enable sticky header with `stickyHeader` and set `maxHeight` for scrollable content. Scroll the table to see the header stay fixed.',
      },
    },
  },
};

// Loading state
export const Loading: Story = {
  render: () => (
    <Table
      columns={basicColumns}
      data={[]}
      getRowKey={(user) => user.id}
      loading
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Show a loading spinner while data is being fetched.',
      },
    },
  },
};

// Empty state
export const Empty: Story = {
  render: () => (
    <Table
      columns={basicColumns}
      data={[]}
      getRowKey={(user) => user.id}
      emptyMessage="No users found. Try adjusting your search criteria."
      bordered
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Customize the empty state message.',
      },
    },
  },
};

// Products table with numbers
export const ProductsTable: Story = {
  render: () => {
    const [sort, setSort] = useState<TableSort | null>(null);

    const columns: TableColumn<Product>[] = [
      { id: 'name', header: 'Product', accessor: 'name', sortable: true },
      { id: 'category', header: 'Category', accessor: 'category', sortable: true },
      {
        id: 'price',
        header: 'Price',
        accessor: 'price',
        sortable: true,
        align: 'right',
        cell: (value) => `$${Number(value).toFixed(2)}`,
      },
      {
        id: 'stock',
        header: 'Stock',
        accessor: 'stock',
        sortable: true,
        align: 'right',
        cell: (value) => {
          const stock = Number(value);
          const color = stock < 30 ? 'warning' : stock < 50 ? 'outline' : 'success';
          return <Chip size="sm" variant={color}>{stock}</Chip>;
        },
      },
      {
        id: 'rating',
        header: 'Rating',
        accessor: 'rating',
        sortable: true,
        align: 'center',
        cell: (value) => `⭐ ${value}`,
      },
    ];

    const sortedData = useMemo(() => {
      if (!sort) return productData;
      return [...productData].sort((a, b) => {
        const aValue = a[sort.columnId as keyof Product];
        const bValue = b[sort.columnId as keyof Product];
        const direction = sort.direction === 'asc' ? 1 : -1;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return (aValue - bValue) * direction;
        }
        return aValue < bValue ? -direction : aValue > bValue ? direction : 0;
      });
    }, [sort]);

    return (
      <Table
        columns={columns}
        data={sortedData}
        getRowKey={(product) => product.id}
        sort={sort}
        onSortChange={setSort}
        bordered
        striped
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'A practical example showing product inventory with various column alignments and custom renderers.',
      },
    },
  },
};

// RTL Support
export const RTLSupport: Story = {
  render: () => {
    const rtlColumns: TableColumn<User>[] = [
      { id: 'name', header: 'שם', accessor: 'name', sortable: true },
      { id: 'email', header: 'אימייל', accessor: 'email', sortable: true },
      { id: 'role', header: 'תפקיד', accessor: 'role' },
    ];

    return (
      <div dir="rtl">
        <Table
          columns={rtlColumns}
          data={userData.slice(0, 4)}
          getRowKey={(user) => user.id}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'RTL mode: text aligns to the end (right in RTL), column order is preserved. Uses CSS logical properties for proper mirroring.',
      },
    },
  },
};

// Alignment with other controls
export const AlignmentWithControls: Story = {
  name: 'Alignment with Other Controls',
  render: () => (
    <Stack gap="md">
      <Stack direction="row" gap="sm" align="center">
        <Input placeholder="Search..." style={{ width: 200 }} />
        <Button>Search</Button>
        <Button variant="outline">Clear</Button>
      </Stack>
      <Table
        columns={basicColumns}
        data={userData.slice(0, 3)}
        getRowKey={(user) => user.id}
      />
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Table used alongside other UI controls like Input and Button for filtering/searching patterns.',
      },
    },
  },
};
