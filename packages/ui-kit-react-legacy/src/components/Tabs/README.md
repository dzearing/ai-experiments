# Tabs Component

A VS Code-style tab component with horizontal scrolling, closable tabs, and toolbar support.

## Features

- **VS Code-like appearance**: Active tab connects visually to content area
- **Horizontal scrolling**: Handles overflow with smooth scrolling
- **Closable tabs**: Optional close button on each tab
- **Keyboard navigation**: Arrow keys, Home, and End key support
- **Toolbar area**: Optional toolbar section for additional controls
- **Size variants**: Small, medium (default), and large sizes
- **Accessible**: ARIA attributes and keyboard navigation

## Usage

```tsx
import { Tabs } from '@claude-flow/ui-kit-react';

const tabs = [
  {
    id: 'tab1',
    label: 'File 1',
    closable: true,
    content: <div>Content for tab 1</div>
  },
  {
    id: 'tab2',
    label: 'File 2',
    closable: true,
    content: <div>Content for tab 2</div>
  }
];

function Example() {
  const [activeTab, setActiveTab] = useState('tab1');
  
  return (
    <Tabs
      tabs={tabs}
      activeTabId={activeTab}
      onTabChange={setActiveTab}
      onTabClose={(tabId) => {
        // Handle tab close
      }}
    />
  );
}
```

## Props

- `tabs`: Array of tab items with id, label, content, and optional properties
- `activeTabId`: Currently active tab ID (controlled)
- `onTabChange`: Callback when tab selection changes
- `onTabClose`: Callback when a tab is closed
- `toolbar`: Optional toolbar content rendered on the right
- `size`: Tab size variant ('small' | 'medium' | 'large')
- `className`: Additional CSS class for the root element
- `tabBarClassName`: Additional CSS class for the tab bar
- `contentClassName`: Additional CSS class for the content area

## Tab Item Properties

- `id`: Unique identifier for the tab
- `label`: Display text for the tab
- `icon`: Optional icon element
- `closable`: Whether the tab can be closed
- `disabled`: Whether the tab is disabled
- `content`: React node to render as tab content

## Keyboard Navigation

- **Arrow Left/Right**: Navigate between tabs
- **Home**: Go to first tab
- **End**: Go to last tab
- **Tab**: Focus management within tab list

## Design Tokens

The component uses design tokens for consistent theming:
- Panel surface for tab bar background
- Body surface for active tab and content
- Primary color for active tab indicator
- Proper contrast ratios for accessibility