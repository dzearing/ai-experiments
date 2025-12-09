import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Sizer } from './Sizer';
import { Panel } from '../Panel';
import { Text } from '../Text';

/**
 * # Sizer
 *
 * A drag handle for resizing adjacent panels or sections.
 *
 * ## Features
 *
 * - Horizontal (side-by-side) and vertical (stacked) orientations
 * - Keyboard accessible (arrow keys to resize)
 * - Double-click support for collapse/expand
 * - Visual grip indicator
 * - Focus and hover states
 *
 * ## Usage
 *
 * ```tsx
 * import { Sizer } from '@ui-kit/react';
 *
 * function ResizablePanels() {
 *   const [leftWidth, setLeftWidth] = useState(300);
 *
 *   return (
 *     <div style={{ display: 'flex', height: '400px' }}>
 *       <Panel style={{ width: leftWidth }}>Left Panel</Panel>
 *       <Sizer
 *         orientation="horizontal"
 *         onResize={(delta) => setLeftWidth((w) => w + delta)}
 *       />
 *       <Panel style={{ flex: 1 }}>Right Panel</Panel>
 *     </div>
 *   );
 * }
 * ```
 *
 * @see [Example: Application Layout](/docs/example-pages-applicationlayout--docs)
 * @see [SplitPane](/docs/layout-splitpane--docs)
 */

const meta: Meta<typeof Sizer> = {
  title: 'Layout/Sizer',
  component: Sizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The Sizer component provides a draggable handle for resizing adjacent elements.

## Keyboard Support

| Key | Action |
|-----|--------|
| Arrow keys | Resize by 10px |
| Shift + Arrow keys | Resize by 50px |

## Best Practices

1. Always provide min/max constraints to prevent panels from collapsing completely
2. Use the \`onDoubleClick\` prop to implement collapse/expand functionality
3. Consider persisting panel sizes to localStorage for user preference
        `,
      },
    },
  },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    size: {
      control: { type: 'range', min: 4, max: 20, step: 1 },
    },
    showGrip: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Sizer>;

// Interactive demo with horizontal sizer
function HorizontalDemo() {
  const [leftWidth, setLeftWidth] = useState(250);
  const minWidth = 100;
  const maxWidth = 500;

  const handleResize = (delta: number) => {
    setLeftWidth((w) => Math.max(minWidth, Math.min(maxWidth, w + delta)));
  };

  return (
    <div style={{ display: 'flex', height: '300px', border: '1px solid var(--page-border)', borderRadius: 'var(--radius-md)' }}>
      <Panel
        style={{
          width: `${leftWidth}px`,
          flexShrink: 0,
          borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
        }}
        padding="md"
      >
        <Text weight="medium">Left Panel</Text>
        <Text size="sm" color="soft" style={{ marginTop: 'var(--space-2)' }}>
          Width: {leftWidth}px
        </Text>
        <Text size="sm" color="soft" style={{ marginTop: 'var(--space-1)' }}>
          Drag the sizer to resize
        </Text>
      </Panel>
      <Sizer orientation="horizontal" onResize={handleResize} />
      <Panel
        style={{
          flex: 1,
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
        }}
        padding="md"
      >
        <Text weight="medium">Right Panel</Text>
        <Text size="sm" color="soft" style={{ marginTop: 'var(--space-2)' }}>
          Flexible width
        </Text>
      </Panel>
    </div>
  );
}

export const Horizontal: Story = {
  render: () => <HorizontalDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Horizontal sizer for side-by-side panels. Drag left/right to resize.',
      },
    },
  },
};

// Interactive demo with vertical sizer
function VerticalDemo() {
  const [topHeight, setTopHeight] = useState(150);
  const minHeight = 80;
  const maxHeight = 300;

  const handleResize = (delta: number) => {
    setTopHeight((h) => Math.max(minHeight, Math.min(maxHeight, h + delta)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '400px', border: '1px solid var(--page-border)', borderRadius: 'var(--radius-md)' }}>
      <Panel
        style={{
          height: `${topHeight}px`,
          flexShrink: 0,
          borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
        }}
        padding="md"
      >
        <Text weight="medium">Top Panel</Text>
        <Text size="sm" color="soft" style={{ marginTop: 'var(--space-2)' }}>
          Height: {topHeight}px
        </Text>
      </Panel>
      <Sizer orientation="vertical" onResize={handleResize} />
      <Panel
        style={{
          flex: 1,
          borderRadius: '0 0 var(--radius-md) var(--radius-md)',
        }}
        padding="md"
      >
        <Text weight="medium">Bottom Panel</Text>
        <Text size="sm" color="soft" style={{ marginTop: 'var(--space-2)' }}>
          Flexible height
        </Text>
      </Panel>
    </div>
  );
}

export const Vertical: Story = {
  render: () => <VerticalDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Vertical sizer for stacked panels. Drag up/down to resize.',
      },
    },
  },
};

// Demo with double-click to collapse
function CollapsibleDemo() {
  const [leftWidth, setLeftWidth] = useState(250);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const minWidth = 50;
  const expandedWidth = 250;

  const handleResize = (delta: number) => {
    if (isCollapsed) return;
    setLeftWidth((w) => Math.max(minWidth, Math.min(400, w + delta)));
  };

  const handleDoubleClick = () => {
    if (isCollapsed) {
      setLeftWidth(expandedWidth);
      setIsCollapsed(false);
    } else {
      setLeftWidth(minWidth);
      setIsCollapsed(true);
    }
  };

  return (
    <div style={{ display: 'flex', height: '300px', border: '1px solid var(--page-border)', borderRadius: 'var(--radius-md)' }}>
      <Panel
        style={{
          width: `${leftWidth}px`,
          flexShrink: 0,
          borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
          transition: 'width var(--duration-normal) var(--ease-default)',
          overflow: 'hidden',
        }}
        padding="md"
      >
        {!isCollapsed && (
          <>
            <Text weight="medium">Sidebar</Text>
            <Text size="sm" color="soft" style={{ marginTop: 'var(--space-2)' }}>
              Double-click sizer to collapse
            </Text>
          </>
        )}
      </Panel>
      <Sizer
        orientation="horizontal"
        onResize={handleResize}
        onDoubleClick={handleDoubleClick}
      />
      <Panel
        style={{
          flex: 1,
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
        }}
        padding="md"
      >
        <Text weight="medium">Main Content</Text>
        <Text size="sm" color="soft" style={{ marginTop: 'var(--space-2)' }}>
          {isCollapsed ? 'Double-click sizer to expand sidebar' : 'Sidebar is expanded'}
        </Text>
      </Panel>
    </div>
  );
}

export const Collapsible: Story = {
  render: () => <CollapsibleDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Double-click the sizer to collapse/expand the sidebar panel.',
      },
    },
  },
};

// Basic examples
export const Default: Story = {
  args: {
    orientation: 'horizontal',
  },
  render: (args) => (
    <div style={{ display: 'flex', height: '100px', alignItems: 'center' }}>
      <div style={{ padding: 'var(--space-4)', background: 'var(--panel-bg)' }}>
        Left
      </div>
      <Sizer {...args} />
      <div style={{ padding: 'var(--space-4)', background: 'var(--panel-bg)' }}>
        Right
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    orientation: 'horizontal',
    disabled: true,
  },
  render: (args) => (
    <div style={{ display: 'flex', height: '100px', alignItems: 'center' }}>
      <div style={{ padding: 'var(--space-4)', background: 'var(--panel-bg)' }}>
        Left
      </div>
      <Sizer {...args} />
      <div style={{ padding: 'var(--space-4)', background: 'var(--panel-bg)' }}>
        Right
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A disabled sizer that cannot be dragged.',
      },
    },
  },
};

export const NoGrip: Story = {
  args: {
    orientation: 'horizontal',
    showGrip: false,
    size: 4,
  },
  render: (args) => (
    <div style={{ display: 'flex', height: '100px', alignItems: 'center' }}>
      <div style={{ padding: 'var(--space-4)', background: 'var(--panel-bg)' }}>
        Left
      </div>
      <Sizer {...args} />
      <div style={{ padding: 'var(--space-4)', background: 'var(--panel-bg)' }}>
        Right
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A minimal sizer without the grip indicator.',
      },
    },
  },
};
