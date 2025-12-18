import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PageTransition } from './PageTransition';
import { Button } from '../Button';

const meta: Meta<typeof PageTransition> = {
  title: 'Animation/PageTransition',
  component: PageTransition,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Wrapper for animating page-level route transitions in single-page applications.

## When to Use

- Animating route changes in React Router or similar navigation
- Page-level view transitions in multi-view applications
- Wizard or stepper flows with animated step changes
- Tab panel content transitions with direction awareness
- Any full-page content swap requiring smooth animation

## Variants

| Direction | Use Case |
|-----------|----------|
| \`forward\` | Navigating to next page or deeper route (slide left, enter from right) |
| \`back\` | Going back to previous page (slide right, enter from left) |
| \`auto\` (via historyIndex) | Automatically detects direction based on history position |

## Direction Modes

- **Forward**: Old page slides out left, new page enters from right (default)
- **Back**: Old page slides out right, new page enters from left
- **historyIndex**: Automatically determines direction by comparing indices

## Accessibility

- Respects \`prefers-reduced-motion\` system setting
- Focus management: maintains or moves focus appropriately after transition
- Announces page change to screen readers
- Optional scroll-to-top for long pages (default: true)
- GPU-accelerated animations for smooth performance

## Usage

### With React Router (Recommended)

Use the \`useHistoryIndex\` hook for automatic direction detection with React Router:

\`\`\`tsx
import { useLocation, useNavigationType } from 'react-router-dom';
import { PageTransition, useHistoryIndex } from '@ui-kit/react';

function App() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const historyIndex = useHistoryIndex({
    locationKey: location.key,
    navigationType,
  });

  return (
    <PageTransition
      transitionKey={location.key}
      historyIndex={historyIndex}
    >
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </PageTransition>
  );
}
\`\`\`

### Basic Usage (Manual Direction)

\`\`\`tsx
import { PageTransition } from '@ui-kit/react';
import { useState } from 'react';

const [page, setPage] = useState('home');

<PageTransition transitionKey={page} direction="forward">
  {page === 'home' ? <HomePage /> : <AboutPage />}
</PageTransition>
\`\`\`

### With Callbacks

\`\`\`tsx
<PageTransition
  transitionKey={page}
  onTransitionStart={() => console.log('started')}
  onTransitionEnd={() => console.log('ended')}
>
  <Page />
</PageTransition>
\`\`\`
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '400px', border: '1px solid var(--panel-border)', borderRadius: '8px', overflow: 'hidden' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    transitionKey: {
      control: 'text',
      description: 'Unique key that triggers transitions when changed',
    },
    direction: {
      control: 'select',
      options: ['forward', 'back'],
      description: 'Animation direction (ignored if historyIndex is provided)',
      table: {
        defaultValue: { summary: 'forward' },
      },
    },
    duration: {
      control: 'number',
      description: 'Transition duration in milliseconds',
      table: {
        defaultValue: { summary: '300' },
      },
    },
    scrollToTop: {
      control: 'boolean',
      description: 'Whether to scroll to top after transition starts',
      table: {
        defaultValue: { summary: 'true' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample page components
const Page1 = () => (
  <div style={{ padding: '32px', background: 'var(--page-bg)', height: '100%' }}>
    <h2 style={{ margin: '0 0 16px 0' }}>Page 1</h2>
    <p>This is the first page. Navigate to see the transition animation.</p>
  </div>
);

const Page2 = () => (
  <div style={{ padding: '32px', background: 'var(--page-bg)', height: '100%' }}>
    <h2 style={{ margin: '0 0 16px 0' }}>Page 2</h2>
    <p>This is the second page. The old page slides out while this one slides in.</p>
  </div>
);

const Page3 = () => (
  <div style={{ padding: '32px', background: 'var(--page-bg)', height: '100%' }}>
    <h2 style={{ margin: '0 0 16px 0' }}>Page 3</h2>
    <p>This is the third page. Try going back to see the reverse animation.</p>
  </div>
);

export const Default: Story = {
  render: () => {
    const [pageKey, setPageKey] = useState('page1');

    const pages = {
      page1: <Page1 />,
      page2: <Page2 />,
      page3: <Page3 />,
    };

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', background: 'var(--panel-bg)', borderBottom: '1px solid var(--panel-border)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" onClick={() => setPageKey('page1')}>Page 1</Button>
            <Button size="sm" onClick={() => setPageKey('page2')}>Page 2</Button>
            <Button size="sm" onClick={() => setPageKey('page3')}>Page 3</Button>
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <PageTransition transitionKey={pageKey} direction="forward">
            {pages[pageKey as keyof typeof pages]}
          </PageTransition>
        </div>
      </div>
    );
  },
};

export const WithHistoryIndex: Story = {
  render: () => {
    const [pageIndex, setPageIndex] = useState(0);
    const [historyIndex, setHistoryIndex] = useState(0);

    const pages = [
      { key: 'home', component: <Page1 /> },
      { key: 'about', component: <Page2 /> },
      { key: 'contact', component: <Page3 /> },
    ];

    const goForward = () => {
      if (pageIndex < pages.length - 1) {
        setPageIndex(prev => prev + 1);
        setHistoryIndex(prev => prev + 1);
      }
    };

    const goBack = () => {
      if (pageIndex > 0) {
        setPageIndex(prev => prev - 1);
        setHistoryIndex(prev => prev - 1);
      }
    };

    const currentPage = pages[pageIndex];

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', background: 'var(--panel-bg)', borderBottom: '1px solid var(--panel-border)' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button size="sm" onClick={goBack} disabled={pageIndex === 0}>
              Back
            </Button>
            <Button size="sm" onClick={goForward} disabled={pageIndex === pages.length - 1}>
              Forward
            </Button>
            <span style={{ marginLeft: '16px', color: 'var(--panel-text-soft)' }}>
              Page {pageIndex + 1} of {pages.length} (History Index: {historyIndex})
            </span>
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <PageTransition
            transitionKey={currentPage.key}
            historyIndex={historyIndex}
          >
            {currentPage.component}
          </PageTransition>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Using historyIndex automatically detects forward/back navigation and applies the appropriate animation direction.',
      },
    },
  },
};

export const CustomDuration: Story = {
  render: () => {
    const [pageKey, setPageKey] = useState('page1');
    const [duration, setDuration] = useState(300);

    const pages = {
      page1: <Page1 />,
      page2: <Page2 />,
      page3: <Page3 />,
    };

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', background: 'var(--panel-bg)', borderBottom: '1px solid var(--panel-border)' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
            <Button size="sm" onClick={() => setPageKey('page1')}>Page 1</Button>
            <Button size="sm" onClick={() => setPageKey('page2')}>Page 2</Button>
            <Button size="sm" onClick={() => setPageKey('page3')}>Page 3</Button>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label>Duration: {duration}ms</label>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={{ width: '200px' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <PageTransition transitionKey={pageKey} duration={duration}>
            {pages[pageKey as keyof typeof pages]}
          </PageTransition>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Customize the transition duration to match your application\'s feel.',
      },
    },
  },
};

export const WithCallbacks: Story = {
  render: () => {
    const [pageKey, setPageKey] = useState('page1');
    const [log, setLog] = useState<string[]>([]);

    const pages = {
      page1: <Page1 />,
      page2: <Page2 />,
      page3: <Page3 />,
    };

    const addLog = (message: string) => {
      setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`].slice(-5));
    };

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', background: 'var(--panel-bg)', borderBottom: '1px solid var(--panel-border)' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <Button size="sm" onClick={() => setPageKey('page1')}>Page 1</Button>
            <Button size="sm" onClick={() => setPageKey('page2')}>Page 2</Button>
            <Button size="sm" onClick={() => setPageKey('page3')}>Page 3</Button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--panel-text-soft)' }}>
            {log.length === 0 ? (
              <div>Click a page to see transition events...</div>
            ) : (
              log.map((entry, i) => <div key={i}>{entry}</div>)
            )}
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <PageTransition
            transitionKey={pageKey}
            onTransitionStart={() => addLog('Transition started')}
            onTransitionEnd={() => addLog('Transition ended')}
          >
            {pages[pageKey as keyof typeof pages]}
          </PageTransition>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Use callbacks to track transition lifecycle events for analytics or loading states.',
      },
    },
  },
};

export const ComplexContent: Story = {
  render: () => {
    const [pageKey, setPageKey] = useState('dashboard');

    const Dashboard = () => (
      <div style={{ padding: '32px', background: 'var(--page-bg)', height: '100%', overflow: 'auto' }}>
        <h1 style={{ margin: '0 0 24px 0' }}>Dashboard</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{
              padding: '24px',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '8px'
            }}>
              <h3 style={{ margin: '0 0 8px 0' }}>Metric {i}</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{Math.floor(Math.random() * 1000)}</div>
            </div>
          ))}
        </div>
      </div>
    );

    const Settings = () => (
      <div style={{ padding: '32px', background: 'var(--page-bg)', height: '100%', overflow: 'auto' }}>
        <h1 style={{ margin: '0 0 24px 0' }}>Settings</h1>
        <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {['Profile', 'Privacy', 'Notifications', 'Security', 'Billing'].map(section => (
            <div key={section} style={{
              padding: '16px',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '8px'
            }}>
              <h3 style={{ margin: '0 0 8px 0' }}>{section}</h3>
              <p style={{ margin: 0, color: 'var(--card-text-soft)' }}>Configure {section.toLowerCase()} settings</p>
            </div>
          ))}
        </div>
      </div>
    );

    const pages = {
      dashboard: <Dashboard />,
      settings: <Settings />,
    };

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', background: 'var(--panel-bg)', borderBottom: '1px solid var(--panel-border)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" onClick={() => setPageKey('dashboard')}>Dashboard</Button>
            <Button size="sm" onClick={() => setPageKey('settings')}>Settings</Button>
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <PageTransition transitionKey={pageKey}>
            {pages[pageKey as keyof typeof pages]}
          </PageTransition>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'PageTransition works with complex page layouts including grids, cards, and scrollable content.',
      },
    },
  },
};
