import type { Meta, StoryObj } from '@storybook/react';
import { Link } from './Link';

const meta = {
  title: 'Typography/Link',
  component: Link,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Styled anchor element for navigation and external links.

## When to Use

- In-page navigation
- External links
- Text links within content
- Navigation menus

## Link vs Button

| Component | Use Case |
|-----------|----------|
| **Link** | Navigation to URL or anchor |
| **Button** | Actions, form submissions |

## Features

- **external**: Opens in new tab with proper rel attributes
- **noUnderline**: Remove underline for navigation-style links
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    href: '#',
    children: 'Click here',
  },
};

export const External: Story = {
  args: {
    href: 'https://anthropic.com',
    children: 'Visit Anthropic',
    external: true,
  },
};

export const NoUnderline: Story = {
  args: {
    href: '#',
    children: 'Subtle link',
    noUnderline: true,
  },
};

export const InParagraph: Story = {
  render: () => (
    <p style={{ color: 'var(--body-text)', maxWidth: '500px' }}>
      Lorem ipsum dolor sit amet, <Link href="#">consectetur adipiscing elit</Link>.
      Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      Read more in our <Link href="https://docs.example.com" external>documentation</Link>.
    </p>
  ),
};

export const Navigation: Story = {
  render: () => (
    <nav style={{ display: 'flex', gap: '16px' }}>
      <Link href="#" noUnderline>Home</Link>
      <Link href="#" noUnderline>Products</Link>
      <Link href="#" noUnderline>About</Link>
      <Link href="#" noUnderline>Contact</Link>
    </nav>
  ),
};
