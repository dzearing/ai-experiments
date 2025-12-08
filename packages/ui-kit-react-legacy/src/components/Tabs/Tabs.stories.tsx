import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabItem } from './Tabs';
import { useState } from 'react';
import { Button } from '../Button';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultTabs: TabItem[] = [
  {
    id: 'tab1',
    label: 'index.tsx',
    closable: true,
    content: (
      <div style={{ padding: 'var(--spacing)' }}>
        <h3>index.tsx</h3>
        <p>Main application entry point</p>
        <pre style={{ 
          background: 'var(--color-panel-background)', 
          padding: 'var(--spacing)',
          borderRadius: 'var(--radius-container)',
          overflow: 'auto'
        }}>
{`import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root')
);
root.render(<App />);`}
        </pre>
      </div>
    ),
  },
  {
    id: 'tab2',
    label: 'App.tsx',
    closable: true,
    content: (
      <div style={{ padding: 'var(--spacing)' }}>
        <h3>App.tsx</h3>
        <p>Root application component</p>
        <pre style={{ 
          background: 'var(--color-panel-background)', 
          padding: 'var(--spacing)',
          borderRadius: 'var(--radius-container)',
          overflow: 'auto'
        }}>
{`function App() {
  return (
    <div className="app">
      <h1>Hello World</h1>
    </div>
  );
}`}
        </pre>
      </div>
    ),
  },
  {
    id: 'tab3',
    label: 'styles.css',
    closable: true,
    content: (
      <div style={{ padding: 'var(--spacing)' }}>
        <h3>styles.css</h3>
        <p>Global application styles</p>
        <pre style={{ 
          background: 'var(--color-panel-background)', 
          padding: 'var(--spacing)',
          borderRadius: 'var(--radius-container)',
          overflow: 'auto'
        }}>
{`.app {
  font-family: system-ui;
  padding: 2rem;
  text-align: center;
}`}
        </pre>
      </div>
    ),
  },
  {
    id: 'tab4',
    label: 'package.json',
    disabled: true,
    content: null,
  },
];

export const Default: Story = {
  args: {
    tabs: defaultTabs,
    activeTabId: 'tab1',
  },
};

export const WithToolbar: Story = {
  args: {
    tabs: defaultTabs,
    activeTabId: 'tab1',
    toolbar: (
      <>
        <Button size="small" variant="outline">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Button>
        <Button size="small" variant="outline">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 3L3 13M3 3l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Button>
      </>
    ),
  },
};

export const ManyTabs: Story = {
  args: {
    tabs: [
      ...defaultTabs,
      { id: 'tab5', label: 'README.md', closable: true, content: <div style={{ padding: 'var(--spacing)' }}>README content</div> },
      { id: 'tab6', label: 'tsconfig.json', closable: true, content: <div style={{ padding: 'var(--spacing)' }}>TypeScript config</div> },
      { id: 'tab7', label: 'vite.config.ts', closable: true, content: <div style={{ padding: 'var(--spacing)' }}>Vite config</div> },
      { id: 'tab8', label: '.eslintrc.js', closable: true, content: <div style={{ padding: 'var(--spacing)' }}>ESLint config</div> },
      { id: 'tab9', label: '.prettierrc', closable: true, content: <div style={{ padding: 'var(--spacing)' }}>Prettier config</div> },
      { id: 'tab10', label: 'components/Button.tsx', closable: true, content: <div style={{ padding: 'var(--spacing)' }}>Button component</div> },
    ],
    activeTabId: 'tab1',
  },
};

export const WithIcons: Story = {
  args: {
    tabs: [
      {
        id: 'tab1',
        label: 'index.tsx',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="3" width="10" height="10" rx="2" />
          </svg>
        ),
        closable: true,
        content: <div style={{ padding: 'var(--spacing)' }}>TypeScript file content</div>,
      },
      {
        id: 'tab2',
        label: 'styles.css',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="8" r="5" />
          </svg>
        ),
        closable: true,
        content: <div style={{ padding: 'var(--spacing)' }}>CSS file content</div>,
      },
      {
        id: 'tab3',
        label: 'data.json',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 4h8v8H4z" />
          </svg>
        ),
        closable: true,
        content: <div style={{ padding: 'var(--spacing)' }}>JSON file content</div>,
      },
    ],
    activeTabId: 'tab1',
  },
};

export const Sizes: Story = {
  args: {
    tabs: defaultTabs,
  },
  render: () => {
    const [activeSmall, setActiveSmall] = useState('tab1');
    const [activeMedium, setActiveMedium] = useState('tab1');
    const [activeLarge, setActiveLarge] = useState('tab1');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-large20)', height: '600px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: 'var(--spacing-small10)' }}>Small</h3>
          <Tabs
            size="small"
            tabs={defaultTabs}
            activeTabId={activeSmall}
            onTabChange={setActiveSmall}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: 'var(--spacing-small10)' }}>Medium (default)</h3>
          <Tabs
            tabs={defaultTabs}
            activeTabId={activeMedium}
            onTabChange={setActiveMedium}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: 'var(--spacing-small10)' }}>Large</h3>
          <Tabs
            size="large"
            tabs={defaultTabs}
            activeTabId={activeLarge}
            onTabChange={setActiveLarge}
          />
        </div>
      </div>
    );
  },
};

export const Interactive: Story = {
  args: {
    tabs: [],
  },
  render: () => {
    const [tabs, setTabs] = useState<TabItem[]>([
      { id: 'welcome', label: 'Welcome', content: <div style={{ padding: 'var(--spacing)' }}>Welcome tab content</div> },
    ]);
    const [activeTabId, setActiveTabId] = useState('welcome');
    const [tabCounter, setTabCounter] = useState(1);

    const addTab = () => {
      const newTab: TabItem = {
        id: `tab-${tabCounter}`,
        label: `Tab ${tabCounter}`,
        closable: true,
        content: <div style={{ padding: 'var(--spacing)' }}>Content for Tab {tabCounter}</div>,
      };
      setTabs([...tabs, newTab]);
      setActiveTabId(newTab.id);
      setTabCounter(tabCounter + 1);
    };

    const closeTab = (tabId: string) => {
      const newTabs = tabs.filter(tab => tab.id !== tabId);
      setTabs(newTabs);
      if (tabId === activeTabId && newTabs.length > 0) {
        const lastTab = newTabs[newTabs.length - 1];
        if (lastTab) {
          setActiveTabId(lastTab.id);
        }
      }
    };

    return (
      <div style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
        <Tabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          onTabClose={closeTab}
          toolbar={
            <Button size="small" variant="outline" onClick={addTab}>
              Add Tab
            </Button>
          }
        />
      </div>
    );
  },
};