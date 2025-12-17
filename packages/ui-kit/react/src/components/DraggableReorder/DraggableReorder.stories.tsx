import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DraggableReorder } from './DraggableReorder';
import { Stack } from '../Stack';
import { Text } from '../Text';

const meta = {
  title: 'Layout/DraggableReorder',
  component: DraggableReorder,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A reusable component for drag-and-drop list reordering.

## Features

- **Drag Handle**: GripperIcon on the left for initiating drag
- **Smooth Animations**: CSS transform-based animations for fluid movement
- **Keyboard Support**: Space/Enter to grab, Arrow keys to move, Escape to cancel
- **Accessibility**: ARIA attributes and screen reader announcements

## Usage

\`\`\`tsx
import { DraggableReorder } from '@claude-flow/ui-kit-react';

const [items, setItems] = useState(['Item 1', 'Item 2', 'Item 3']);

<DraggableReorder
  items={items}
  onReorder={setItems}
  renderItem={(item) => <span>{item}</span>}
  keyExtractor={(item) => item}
/>
\`\`\`
        `,
      },
    },
  },
} satisfies Meta<typeof DraggableReorder>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic example with strings
const BasicExample = () => {
  const [items, setItems] = useState(['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry']);

  return (
    <Stack direction="vertical" gap="md" style={{ width: 300 }}>
      <Text weight="medium">Fruit List</Text>
      <DraggableReorder
        items={items}
        onReorder={setItems}
        renderItem={(item) => <Text>{item}</Text>}
        keyExtractor={(item) => item}
      />
      <Text size="sm" color="secondary">
        Order: {items.join(', ')}
      </Text>
    </Stack>
  );
};

export const Default: Story = {
  render: () => <BasicExample />,
};

// Example with objects
interface Task {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
}

const ObjectsExample = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Review pull request', priority: 'high' },
    { id: '2', title: 'Update documentation', priority: 'medium' },
    { id: '3', title: 'Fix bug in login', priority: 'high' },
    { id: '4', title: 'Add unit tests', priority: 'low' },
  ]);

  const priorityColors: Record<string, string> = {
    high: 'var(--danger-fg)',
    medium: 'var(--warning-fg)',
    low: 'var(--success-fg)',
  };

  return (
    <Stack direction="vertical" gap="md" style={{ width: 350 }}>
      <Text weight="medium">Task Priority List</Text>
      <DraggableReorder
        items={tasks}
        onReorder={setTasks}
        renderItem={(task) => (
          <Stack direction="horizontal" gap="sm" align="center" style={{ width: '100%' }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: priorityColors[task.priority],
                flexShrink: 0,
              }}
            />
            <Text style={{ flex: 1 }}>{task.title}</Text>
            <Text size="sm" color="secondary">{task.priority}</Text>
          </Stack>
        )}
        keyExtractor={(task) => task.id}
      />
    </Stack>
  );
};

export const WithObjects: Story = {
  render: () => <ObjectsExample />,
  parameters: {
    docs: {
      description: {
        story: 'DraggableReorder works with any data type. Use `keyExtractor` to provide unique keys.',
      },
    },
  },
};

// Disabled example
const DisabledExample = () => {
  const [items] = useState(['Item 1', 'Item 2', 'Item 3']);

  return (
    <Stack direction="vertical" gap="md" style={{ width: 250 }}>
      <Text weight="medium">Disabled List</Text>
      <DraggableReorder
        items={items}
        onReorder={() => {}}
        renderItem={(item) => <Text>{item}</Text>}
        keyExtractor={(item) => item}
        disabled
      />
    </Stack>
  );
};

export const Disabled: Story = {
  render: () => <DisabledExample />,
  parameters: {
    docs: {
      description: {
        story: 'When disabled, the drag handle shows a not-allowed cursor and dragging is prevented.',
      },
    },
  },
};

// Custom gap example
const CustomGapExample = () => {
  const [items, setItems] = useState(['Card 1', 'Card 2', 'Card 3']);

  return (
    <Stack direction="vertical" gap="md" style={{ width: 250 }}>
      <Text weight="medium">Custom Gap (12px)</Text>
      <DraggableReorder
        items={items}
        onReorder={setItems}
        renderItem={(item) => <Text>{item}</Text>}
        keyExtractor={(item) => item}
        gap={12}
      />
    </Stack>
  );
};

export const CustomGap: Story = {
  render: () => <CustomGapExample />,
  parameters: {
    docs: {
      description: {
        story: 'Use the `gap` prop to customize spacing between items.',
      },
    },
  },
};

// Many items example
const ManyItemsExample = () => {
  const [items, setItems] = useState(
    Array.from({ length: 10 }, (_, i) => `Item ${i + 1}`)
  );

  return (
    <Stack direction="vertical" gap="md" style={{ width: 250 }}>
      <Text weight="medium">Long List</Text>
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        <DraggableReorder
          items={items}
          onReorder={setItems}
          renderItem={(item) => <Text>{item}</Text>}
          keyExtractor={(item) => item}
        />
      </div>
    </Stack>
  );
};

export const ManyItems: Story = {
  render: () => <ManyItemsExample />,
  parameters: {
    docs: {
      description: {
        story: 'DraggableReorder handles long lists within scrollable containers.',
      },
    },
  },
};
