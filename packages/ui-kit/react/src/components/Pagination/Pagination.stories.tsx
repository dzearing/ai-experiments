import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Pagination } from './Pagination';

const meta = {
  title: 'Navigation/Pagination',
  component: Pagination,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Navigation for paginated content lists.

## When to Use

- Long lists broken into pages
- Search results
- Data tables with many rows

## Configuration

| Prop | Purpose |
|------|---------|
| **totalPages** | Total number of pages |
| **siblingCount** | Number of page buttons around current |
| **showFirstLast** | Show first/last page buttons |

## Best Practices

- Keep page sizes consistent
- Consider "load more" for infinite scroll alternatives
- Show total count when helpful
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

const PaginationDemo = (props: Omit<React.ComponentProps<typeof Pagination>, 'currentPage' | 'onPageChange'> & { initialPage?: number }) => {
  const { initialPage = 1, ...rest } = props;
  const [page, setPage] = useState(initialPage);
  return <Pagination {...rest} currentPage={page} onPageChange={setPage} />;
};

export const Default: Story = {
  render: () => <PaginationDemo totalPages={10} />,
};

export const ManyPages: Story = {
  render: () => <PaginationDemo totalPages={50} initialPage={25} />,
};

export const FewPages: Story = {
  render: () => <PaginationDemo totalPages={3} />,
};

export const WithFirstLast: Story = {
  render: () => <PaginationDemo totalPages={20} showFirstLast initialPage={10} />,
};

export const MoreSiblings: Story = {
  render: () => <PaginationDemo totalPages={30} siblingCount={2} initialPage={15} />,
};

export const CustomLabels: Story = {
  render: () => (
    <PaginationDemo
      totalPages={10}
      previousLabel="Prev"
      nextLabel="Next"
    />
  ),
};

export const FirstPage: Story = {
  render: () => <PaginationDemo totalPages={10} initialPage={1} />,
};

export const LastPage: Story = {
  render: () => <PaginationDemo totalPages={10} initialPage={10} />,
};
