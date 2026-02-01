import type { Meta, StoryObj } from '@storybook/react';
import { LayoutDemo } from './LayoutDemo';

/**
 * Interactive demo showing all layout components working together.
 *
 * This example demonstrates:
 * - **TitleBar**: App-level navigation with logo, title, tabs, and user profile
 * - **SidePanel**: Collapsible navigation in push mode
 * - **ContentLayout**: Page wrapper with header, content, and max-width constraints
 * - **PageHeader**: Page-level navigation with breadcrumbs and actions
 *
 * Try:
 * - Switching tabs in the TitleBar (Work/Web)
 * - Collapsing the sidebar with the chevron button
 * - Clicking navigation items to change pages
 * - Expanding the sidebar with the menu button (when collapsed)
 */

const meta: Meta<typeof LayoutDemo> = {
  title: 'Coworker/Layout Demo',
  component: LayoutDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A comprehensive demo showing all layout components integrated in a realistic application structure.

## Components Used

| Component | Purpose | Position |
|-----------|---------|----------|
| TitleBar | App-level navigation | Top |
| SidePanel | Navigation sidebar | Left (push mode) |
| ContentLayout | Page structure | Main area |
| PageHeader | Page navigation | Inside ContentLayout header |

## Layout Structure

\`\`\`
+------------------------------------------+
|              TitleBar                     |
|  [Logo] Title  | [Work] [Web] | [Profile] |
+----------+----------------------------------+
| SidePanel |       ContentLayout            |
|           +--------------------------------+
| [Nav]     |      PageHeader                |
| [Items]   |      [Breadcrumbs] [Actions]   |
|           +--------------------------------+
|           |      Main Content              |
|           |                                |
+----------+----------------------------------+
\`\`\`

## Interactions

- **Tab switching**: TitleBar tabs toggle between Work and Web modes
- **Sidebar collapse**: Chevron button collapses sidebar (push mode)
- **Sidebar expand**: Menu button in PageHeader actions expands sidebar
- **Navigation**: List items update the current page
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
