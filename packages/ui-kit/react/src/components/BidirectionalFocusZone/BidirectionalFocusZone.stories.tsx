import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { BidirectionalFocusZone } from './BidirectionalFocusZone';
import { Button } from '../Button';
import { Stack } from '../Stack';

const meta: Meta<typeof BidirectionalFocusZone> = {
  title: 'Focus Management/BidirectionalFocusZone',
  component: BidirectionalFocusZone,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A container that enables bidirectional arrow key navigation between focusable elements.
Implements the [WAI-ARIA Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) with roving tabindex.

## When to Use

- Icon grids or color palettes
- Toolbars with multiple buttons
- Card grids with focusable items
- Any 2D layout of focusable elements
- Calendar date pickers
- Emoji pickers

## Behavior

This is a **behavior-only component** with no visual styling. It wraps your existing grid
layout and adds keyboard navigation. The component:

- Manages \`tabindex\` on child focusable elements (roving tabindex)
- Intercepts arrow key events for grid navigation
- Auto-detects grid columns from element positions (or accepts explicit \`columns\` prop)

## Accessibility

| Key | Action |
|-----|--------|
| **ArrowRight** | Move to next element (previous in RTL) |
| **ArrowLeft** | Move to previous element (next in RTL) |
| **ArrowDown** | Move to element below |
| **ArrowUp** | Move to element above |
| **Home** | Move to first element |
| **End** | Move to last element |
| **PageDown** | Move down by 5 rows |
| **PageUp** | Move up by 5 rows |
| **Tab** | Exit zone to next focusable element |
| **Shift+Tab** | Exit zone to previous focusable element |

- Implements roving tabindex pattern (only one element is tabbable at a time)
- RTL-aware: arrow keys automatically flip in RTL mode
- Focus is restored when re-entering the zone

## Usage

\`\`\`tsx
import { BidirectionalFocusZone } from '@ui-kit/react';

// Wrap any grid of focusable elements
<BidirectionalFocusZone columns={4}>
  {icons.map(icon => (
    <button key={icon.name} onClick={() => selectIcon(icon)}>
      <Icon name={icon.name} />
    </button>
  ))}
</BidirectionalFocusZone>

// With explicit columns and wrap disabled
<BidirectionalFocusZone columns={6} wrap={false}>
  {items.map(item => (
    <button key={item.id}>{item.label}</button>
  ))}
</BidirectionalFocusZone>
\`\`\`
        `,
      },
    },
  },
  args: {
    onFocusChange: fn(),
  },
  argTypes: {
    columns: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Number of columns for grid calculation. Auto-detected if not provided.',
    },
    wrap: {
      control: 'boolean',
      description: 'Whether to wrap focus at boundaries (default: true)',
    },
    dir: {
      control: 'select',
      options: ['ltr', 'rtl'],
      description: 'Text direction override. Auto-detected from document if not provided.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the focus zone. Arrow keys will perform default browser behavior.',
    },
    defaultFocus: {
      control: 'select',
      options: ['first', 'last', 0, 1, 2],
      description: 'Initial focus target when tabbing into the zone.',
    },
    onFocusChange: {
      action: 'focusChange',
      description: 'Callback fired when focus moves to a new element.',
    },
  },
} satisfies Meta<typeof BidirectionalFocusZone>;

export default meta;
type Story = StoryObj<typeof meta>;

// Styles for demo
const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 'var(--space-2)',
  padding: 'var(--space-2)',
};

const cellStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--space-4)',
  background: 'var(--card-bg)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'all var(--duration-fast)',
};

export const Default: Story = {
  render: (args) => (
    <BidirectionalFocusZone {...args} style={gridStyle}>
      {Array.from({ length: 12 }).map((_, i) => (
        <button key={i} style={cellStyle}>
          {i + 1}
        </button>
      ))}
    </BidirectionalFocusZone>
  ),
  args: {
    columns: 4,
    wrap: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic 4-column grid. Click any cell and use arrow keys to navigate. Try Home, End, PageUp, and PageDown.',
      },
    },
  },
};

export const IconGrid: Story = {
  render: (args) => {
    const icons = ['H1', 'H2', 'H3', 'B', 'I', 'U', 'S', 'Q', '{}', '<>', '[]', '//'];
    return (
      <div style={{ maxWidth: '300px' }}>
        <p style={{ marginBottom: 'var(--space-4)', color: 'var(--body-text-soft)' }}>
          Click any icon, then use arrow keys to navigate:
        </p>
        <BidirectionalFocusZone
          {...args}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--space-1)',
          }}
        >
          {icons.map((icon, i) => (
            <button
              key={i}
              style={{
                ...cellStyle,
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'monospace',
              }}
            >
              {icon}
            </button>
          ))}
        </BidirectionalFocusZone>
      </div>
    );
  },
  args: {
    columns: 4,
    wrap: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Formatting toolbar icons in a grid. Common use case for text editors and rich text formatting palettes.',
      },
    },
  },
};

export const Toolbar: Story = {
  render: (args) => (
    <div>
      <p style={{ marginBottom: 'var(--space-4)', color: 'var(--body-text-soft)' }}>
        A toolbar with horizontal arrow key navigation:
      </p>
      <BidirectionalFocusZone
        {...args}
        style={{
          display: 'flex',
          gap: 'var(--space-1)',
          padding: 'var(--space-2)',
          background: 'var(--card-bg)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--card-border)',
        }}
      >
        <Button variant="ghost" size="sm">Cut</Button>
        <Button variant="ghost" size="sm">Copy</Button>
        <Button variant="ghost" size="sm">Paste</Button>
        <div style={{ width: '1px', background: 'var(--card-border)', margin: '0 var(--space-1)' }} />
        <Button variant="ghost" size="sm">Undo</Button>
        <Button variant="ghost" size="sm">Redo</Button>
      </BidirectionalFocusZone>
    </div>
  ),
  args: {
    columns: 7, // All items in one row
    wrap: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Horizontal toolbar with left/right arrow navigation. The divider is skipped during navigation (non-focusable).',
      },
    },
  },
};

export const CardGrid: Story = {
  render: (args) => {
    const cards = [
      { title: 'Dashboard', desc: 'View analytics' },
      { title: 'Projects', desc: 'Manage work' },
      { title: 'Settings', desc: 'Configure app' },
      { title: 'Profile', desc: 'Edit account' },
      { title: 'Reports', desc: 'Generate reports' },
      { title: 'Help', desc: 'Get support' },
    ];
    return (
      <div style={{ maxWidth: '500px' }}>
        <p style={{ marginBottom: 'var(--space-4)', color: 'var(--body-text-soft)' }}>
          Navigate cards with arrow keys:
        </p>
        <BidirectionalFocusZone
          {...args}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-3)',
          }}
        >
          {cards.map((card, i) => (
            <button
              key={i}
              style={{
                padding: 'var(--space-4)',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>{card.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--body-text-soft)' }}>{card.desc}</div>
            </button>
          ))}
        </BidirectionalFocusZone>
      </div>
    );
  },
  args: {
    columns: 3,
    wrap: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Navigation cards in a 3-column grid. Useful for dashboard quick-access menus or feature discovery panels.',
      },
    },
  },
};

export const WithFocusCallback: Story = {
  render: (args) => {
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);
    const items = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape', 'Honeydew'];

    return (
      <Stack direction="vertical" gap="md">
        <div style={{ color: 'var(--body-text-soft)' }}>
          Focused: {focusedIndex >= 0 ? `${items[focusedIndex]} (index ${focusedIndex})` : 'None'}
        </div>
        <BidirectionalFocusZone
          {...args}
          onFocusChange={(index) => setFocusedIndex(index)}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--space-2)',
          }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              style={{
                ...cellStyle,
                background: focusedIndex === i ? 'var(--controlPrimary-bg)' : 'var(--card-bg)',
                color: focusedIndex === i ? 'var(--controlPrimary-text)' : 'inherit',
              }}
            >
              {item}
            </button>
          ))}
        </BidirectionalFocusZone>
      </Stack>
    );
  },
  args: {
    columns: 4,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the `onFocusChange` callback. The focused item index updates as you navigate, enabling custom focus highlighting.',
      },
    },
  },
};

export const RTLSupport: Story = {
  render: (args) => (
    <div dir="rtl">
      <p style={{ marginBottom: 'var(--space-4)', color: 'var(--body-text-soft)', textAlign: 'right' }}>
        RTL mode: ArrowRight moves left, ArrowLeft moves right
      </p>
      <BidirectionalFocusZone
        {...args}
        dir="rtl"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-2)',
        }}
      >
        {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח'].map((char, i) => (
          <button key={i} style={cellStyle}>
            {char}
          </button>
        ))}
      </BidirectionalFocusZone>
    </div>
  ),
  args: {
    columns: 4,
    dir: 'rtl',
  },
  parameters: {
    docs: {
      description: {
        story: 'RTL mode: ArrowRight moves to the previous element (visually left), ArrowLeft moves to the next element (visually right). The `dir` prop can override auto-detection.',
      },
    },
  },
};

export const NoWrap: Story = {
  render: (args) => (
    <div>
      <p style={{ marginBottom: 'var(--space-4)', color: 'var(--body-text-soft)' }}>
        With wrap=false, focus stops at boundaries instead of wrapping around:
      </p>
      <BidirectionalFocusZone
        {...args}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-2)',
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <button key={i} style={cellStyle}>
            {i + 1}
          </button>
        ))}
      </BidirectionalFocusZone>
    </div>
  ),
  args: {
    columns: 4,
    wrap: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'With `wrap={false}`, focus stops at boundaries instead of wrapping. Pressing ArrowRight on the last item does nothing.',
      },
    },
  },
};

export const Disabled: Story = {
  render: (args) => (
    <div>
      <p style={{ marginBottom: 'var(--space-4)', color: 'var(--body-text-soft)' }}>
        When disabled, arrow keys perform default browser behavior:
      </p>
      <BidirectionalFocusZone
        {...args}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-2)',
          opacity: 0.5,
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <button key={i} style={cellStyle}>
            {i + 1}
          </button>
        ))}
      </BidirectionalFocusZone>
    </div>
  ),
  args: {
    columns: 4,
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'When `disabled={true}`, arrow key navigation is bypassed. Arrow keys perform their default browser behavior (e.g., scrolling).',
      },
    },
  },
};

export const DefaultFocusLast: Story = {
  render: (args) => (
    <div>
      <p style={{ marginBottom: 'var(--space-4)', color: 'var(--body-text-soft)' }}>
        Tab into the grid - the last item receives initial focus:
      </p>
      <BidirectionalFocusZone
        {...args}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-2)',
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <button key={i} style={cellStyle}>
            {i + 1}
          </button>
        ))}
      </BidirectionalFocusZone>
    </div>
  ),
  args: {
    columns: 4,
    defaultFocus: 'last',
  },
  parameters: {
    docs: {
      description: {
        story: 'Use `defaultFocus="last"` to focus the last element when tabbing into the zone. Also accepts `"first"` (default) or a specific index.',
      },
    },
  },
};

export const ColorPalette: Story = {
  render: (args) => {
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308',
      '#84cc16', '#22c55e', '#10b981', '#14b8a6',
      '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
      '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    ];
    const [selected, setSelected] = useState<string | null>(null);

    return (
      <Stack direction="vertical" gap="md">
        <div style={{ color: 'var(--body-text-soft)' }}>
          Selected: {selected ? <span style={{ color: selected }}>{selected}</span> : 'None'}
        </div>
        <BidirectionalFocusZone
          {...args}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: 'var(--space-1)',
          }}
        >
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setSelected(color)}
              style={{
                width: '32px',
                height: '32px',
                background: color,
                border: selected === color ? '2px solid var(--body-text)' : '2px solid transparent',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
              aria-label={color}
            />
          ))}
        </BidirectionalFocusZone>
      </Stack>
    );
  },
  args: {
    columns: 8,
  },
  parameters: {
    docs: {
      description: {
        story: 'Color picker palette with keyboard navigation. Click to select a color, or navigate with arrow keys. Each color swatch has an `aria-label` for accessibility.',
      },
    },
  },
};

/**
 * Variable Width Grid - Flex Wrap Layout
 *
 * This story demonstrates anchor-based navigation for flex-wrap layouts with
 * variable-width items. Items wrap to new rows when they exceed container width.
 *
 * - **Left/Right**: Moves within the current row, updates horizontal anchor
 * - **Up/Down**: Finds the item in adjacent row closest to the horizontal anchor
 *
 * This ensures consistent vertical navigation even when items don't align vertically.
 */
export const VariableWidthGrid: Story = {
  render: (args) => {
    // Variable-width items in a flex-wrap layout
    const items = [
      { id: 1, label: 'Dashboard', width: 120 },
      { id: 2, label: 'Projects', width: 90 },
      { id: 3, label: 'Settings', width: 80 },
      { id: 4, label: 'Analytics & Reports', width: 160 },
      { id: 5, label: 'Users', width: 70 },
      { id: 6, label: 'Notifications', width: 110 },
      { id: 7, label: 'Help', width: 60 },
      { id: 8, label: 'Team Management', width: 140 },
      { id: 9, label: 'API Keys', width: 85 },
      { id: 10, label: 'Billing & Subscriptions', width: 170 },
      { id: 11, label: 'Security', width: 80 },
      { id: 12, label: 'Logs', width: 55 },
      { id: 13, label: 'Integrations', width: 105 },
      { id: 14, label: 'Export Data', width: 100 },
      { id: 15, label: 'Import', width: 70 },
      { id: 16, label: 'Preferences', width: 95 },
    ];

    return (
      <div style={{ maxWidth: '500px' }}>
        <p style={{ marginBottom: 'var(--space-4)', color: 'var(--body-text-soft)' }}>
          Variable-width items with anchor-based navigation. Press Up/Down to see how focus
          maintains horizontal position across rows:
        </p>
        <BidirectionalFocusZone
          {...args}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
            padding: 'var(--space-2)',
            background: 'var(--panel-bg)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          {items.map((item) => (
            <button
              key={item.id}
              style={{
                minWidth: `${item.width}px`,
                padding: 'var(--space-2) var(--space-3)',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </button>
          ))}
        </BidirectionalFocusZone>
      </div>
    );
  },
  args: {
    // No columns specified - uses position-based navigation with anchors
    wrap: true,
  },
  parameters: {
    docs: {
      description: {
        story: `Flex-wrap grid with variable-width items. Without the \`columns\` prop, the component uses **position-based navigation** with anchor percentages:

- **Left/Right arrows**: Navigate within the current visual row, updating the horizontal anchor
- **Up/Down arrows**: Find the item in the adjacent row closest to the current horizontal anchor position
- This ensures intuitive navigation even when items don't align vertically between rows

Try focusing an item on the right side, then pressing Down - notice how focus stays approximately in the same horizontal position.`,
      },
    },
  },
};

/**
 * Masonry Grid - True CSS Columns Layout
 *
 * A real masonry layout using CSS `column-count`. Items flow vertically
 * and fill columns, creating the classic Pinterest-style staggered effect.
 * Navigation uses position-based anchor system to handle the non-grid layout.
 */
export const MasonryGrid: Story = {
  render: (args) => {
    const items = [
      { id: 1, label: 'Short', height: 60, color: '#3b82f6' },
      { id: 2, label: 'Tall card with more content', height: 120, color: '#ef4444' },
      { id: 3, label: 'Medium', height: 80, color: '#22c55e' },
      { id: 4, label: 'Tiny', height: 50, color: '#f59e0b' },
      { id: 5, label: 'Extra tall item here', height: 140, color: '#8b5cf6' },
      { id: 6, label: 'Small', height: 65, color: '#ec4899' },
      { id: 7, label: 'Medium height', height: 90, color: '#06b6d4' },
      { id: 8, label: 'Short', height: 55, color: '#84cc16' },
      { id: 9, label: 'Tall', height: 110, color: '#f97316' },
      { id: 10, label: 'Very short', height: 45, color: '#6366f1' },
      { id: 11, label: 'Medium card', height: 85, color: '#14b8a6' },
      { id: 12, label: 'Tallest card in the grid', height: 150, color: '#a855f7' },
    ];

    return (
      <div style={{ maxWidth: '500px' }}>
        <p style={{ marginBottom: 'var(--space-4)', color: 'var(--body-text-soft)' }}>
          True masonry layout using CSS columns. Items stack vertically to fill gaps:
        </p>
        <BidirectionalFocusZone
          {...args}
          style={{
            columnCount: 3,
            columnGap: '12px',
            padding: 'var(--space-3)',
            background: 'var(--panel-bg)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          {items.map((item) => (
            <button
              key={item.id}
              style={{
                display: 'block',
                width: '100%',
                height: `${item.height}px`,
                marginBottom: '12px',
                background: item.color,
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: 'white',
                fontWeight: 500,
                fontSize: '13px',
                padding: 'var(--space-2)',
                textAlign: 'left',
                breakInside: 'avoid',
              }}
            >
              {item.label}
            </button>
          ))}
        </BidirectionalFocusZone>
      </div>
    );
  },
  args: {
    // Uses masonry layout mode - items flow vertically within columns
    layout: 'masonry',
    wrap: true,
  },
  parameters: {
    docs: {
      description: {
        story: `A **true masonry layout** using CSS \`column-count\` with \`layout="masonry"\`. Unlike a regular grid:

- Items flow **vertically** within columns, then wrap to the next column
- **Up/Down** moves within the current column (updates vertical anchor)
- **Left/Right** moves between columns, finding the closest item by vertical position
- This maintains a **vertical center of gravity** when navigating horizontally

This is the classic "masonry" or "waterfall" layout commonly seen in image galleries.`,
      },
    },
  },
};

/**
 * Photo Gallery - Real-world Variable Layout
 *
 * Simulates a photo gallery with landscape and portrait orientations,
 * demonstrating how anchor-based navigation handles real-world scenarios.
 */
export const PhotoGallery: Story = {
  render: (args) => {
    const photos = [
      { id: 1, aspect: 'landscape', color: '#3b82f6' },
      { id: 2, aspect: 'portrait', color: '#ef4444' },
      { id: 3, aspect: 'landscape', color: '#22c55e' },
      { id: 4, aspect: 'square', color: '#f59e0b' },
      { id: 5, aspect: 'landscape', color: '#8b5cf6' },
      { id: 6, aspect: 'portrait', color: '#ec4899' },
      { id: 7, aspect: 'square', color: '#06b6d4' },
      { id: 8, aspect: 'landscape', color: '#84cc16' },
      { id: 9, aspect: 'portrait', color: '#f97316' },
      { id: 10, aspect: 'landscape', color: '#6366f1' },
      { id: 11, aspect: 'square', color: '#14b8a6' },
      { id: 12, aspect: 'landscape', color: '#a855f7' },
    ];

    const getSize = (aspect: string) => {
      switch (aspect) {
        case 'landscape':
          return { width: 120, height: 80 };
        case 'portrait':
          return { width: 70, height: 100 };
        case 'square':
        default:
          return { width: 90, height: 90 };
      }
    };

    return (
      <div style={{ maxWidth: '500px' }}>
        <p style={{ marginBottom: 'var(--space-4)', color: 'var(--body-text-soft)' }}>
          Photo gallery with mixed aspect ratios. Navigate with arrow keys:
        </p>
        <BidirectionalFocusZone
          {...args}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
            alignItems: 'flex-start',
            padding: 'var(--space-3)',
            background: 'var(--panel-bg)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          {photos.map((photo) => {
            const size = getSize(photo.aspect);
            return (
              <button
                key={photo.id}
                style={{
                  width: `${size.width}px`,
                  height: `${size.height}px`,
                  background: photo.color,
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  opacity: 0.85,
                  transition: 'opacity var(--duration-fast), transform var(--duration-fast)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.opacity = '0.85';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                aria-label={`Photo ${photo.id} (${photo.aspect})`}
              />
            );
          })}
        </BidirectionalFocusZone>
      </div>
    );
  },
  args: {
    // No columns - position-based navigation
    wrap: true,
  },
  parameters: {
    docs: {
      description: {
        story: `A photo gallery simulation with landscape, portrait, and square images. This demonstrates real-world anchor-based navigation where:

- Photos of different sizes create an irregular grid
- Up/Down navigation intelligently finds the closest photo in the target row
- Horizontal anchor is maintained across vertical movements for consistent UX`,
      },
    },
  },
};
