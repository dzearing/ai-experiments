import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { RotatingCarousel } from './RotatingCarousel';
import { Panel } from '../Panel';
import { Text } from '../Text';
import { Stack } from '../Stack';
import storyStyles from './RotatingCarousel.stories.module.css';

/**
 * # RotatingCarousel
 *
 * Cycles through sets of content with crossfade animations.
 * Each set of items animates out while the next set animates in,
 * with staggered scale/fade effects for a smooth transition.
 */

const meta: Meta<typeof RotatingCarousel> = {
  title: 'Animation/RotatingCarousel',
  component: RotatingCarousel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Cycles through sets of content with crossfade animations. Each set of items
animates out while the next set animates in with staggered scale/fade effects.

## When to Use

- Showcasing multiple sets of examples or features
- Rotating through testimonials or quotes
- Displaying different product categories or options
- Creating visual interest with auto-rotating content
- Onboarding flows with multiple example sets

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| \`children\` | ReactNode | - | Content sets using \`RotatingCarousel.Set\` |
| \`sets\` | T[][] | - | Data-driven sets (alternative to children) |
| \`renderItem\` | (item, index, setIndex) => ReactNode | - | Render function for data sets |
| \`interval\` | number | 5000 | Time between rotations in ms |
| \`staggerDelay\` | number | 100 | Delay between each item's animation |
| \`animationDuration\` | number | 700 | Duration of enter/exit animations |
| \`pauseOnHover\` | boolean | false | Pause rotation when hovered |
| \`onSetChange\` | (index) => void | - | Callback when set changes |
| \`className\` | string | - | Applied to carousel layers (for grid/flex layout) |
| \`itemClassName\` | string | - | Applied to each item wrapper |
| \`minHeight\` | number \\| string | 180 | Minimum height to prevent layout shift |

## Layout

**Important:** The \`className\` prop is applied to the carousel layers, not the
container. This means your grid/flex layout styles will be inherited by both the
entering and exiting content layers for proper alignment.

\`\`\`css
/* Your grid layout */
.myGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
\`\`\`

\`\`\`tsx
<RotatingCarousel className={styles.myGrid} ... />
\`\`\`

## Accessibility

- Respects \`prefers-reduced-motion\` - animations complete instantly
- Content remains accessible during transitions
- Use \`pauseOnHover\` for users who need more time to read

## Usage

### With Data Sets

\`\`\`tsx
import { RotatingCarousel } from '@ui-kit/react';

const featureSets = [
  [{ name: 'Feature A' }, { name: 'Feature B' }],
  [{ name: 'Feature C' }, { name: 'Feature D' }],
];

<RotatingCarousel
  className={styles.grid}
  sets={featureSets}
  interval={4000}
  renderItem={(item) => <Card>{item.name}</Card>}
/>
\`\`\`

### With Children

\`\`\`tsx
<RotatingCarousel className={styles.grid} interval={3000}>
  <RotatingCarousel.Set>
    <Card>Item 1</Card>
    <Card>Item 2</Card>
  </RotatingCarousel.Set>
  <RotatingCarousel.Set>
    <Card>Item A</Card>
    <Card>Item B</Card>
  </RotatingCarousel.Set>
</RotatingCarousel>
\`\`\`
        `,
      },
    },
  },
  args: {
    onSetChange: fn(),
  },
  argTypes: {
    interval: {
      control: { type: 'number', min: 1000, max: 10000, step: 500 },
      description: 'Time between rotations in milliseconds',
    },
    staggerDelay: {
      control: { type: 'number', min: 0, max: 500, step: 50 },
      description: 'Delay between each item animation in milliseconds',
    },
    animationDuration: {
      control: { type: 'number', min: 200, max: 1500, step: 100 },
      description: 'Duration of enter/exit animations in milliseconds',
    },
    pauseOnHover: {
      control: 'boolean',
      description: 'Whether to pause rotation when mouse hovers over carousel',
    },
    minHeight: {
      control: { type: 'number', min: 100, max: 500, step: 20 },
      description: 'Minimum height to prevent layout shift',
    },
    children: {
      table: { disable: true },
    },
    sets: {
      table: { disable: true },
    },
    renderItem: {
      table: { disable: true },
    },
    onSetChange: {
      table: { disable: true },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data for stories
const cardSets = [
  [
    { title: 'Dashboard', description: 'Monitor your metrics' },
    { title: 'Analytics', description: 'Deep dive into data' },
    { title: 'Reports', description: 'Generate insights' },
  ],
  [
    { title: 'Settings', description: 'Configure your app' },
    { title: 'Users', description: 'Manage team access' },
    { title: 'Billing', description: 'Handle payments' },
  ],
  [
    { title: 'API', description: 'Developer tools' },
    { title: 'Webhooks', description: 'Event integrations' },
    { title: 'Logs', description: 'Debug and trace' },
  ],
];

// Default story with data sets
export const Default: Story = {
  render: (args) => (
    <RotatingCarousel
      {...args}
      className={storyStyles.threeColumnGrid}
      sets={cardSets}
      renderItem={(item, index) => (
        <Panel key={index} padding="lg">
          <Stack gap="xs">
            <Text weight="medium">{item.title}</Text>
            <Text size="sm" color="soft">{item.description}</Text>
          </Stack>
        </Panel>
      )}
    />
  ),
  args: {
    interval: 3000,
    staggerDelay: 200,
    animationDuration: 700,
    minHeight: 120,
  },
};

// Using children with RotatingCarousel.Set
export const WithChildren: Story = {
  render: (args) => (
    <RotatingCarousel {...args} className={storyStyles.threeColumnGrid} minHeight={120}>
      <RotatingCarousel.Set>
        <Panel padding="lg">
          <Stack gap="xs">
            <Text weight="medium">First Set - Item 1</Text>
            <Text size="sm" color="soft">Description for item 1</Text>
          </Stack>
        </Panel>
        <Panel padding="lg">
          <Stack gap="xs">
            <Text weight="medium">First Set - Item 2</Text>
            <Text size="sm" color="soft">Description for item 2</Text>
          </Stack>
        </Panel>
        <Panel padding="lg">
          <Stack gap="xs">
            <Text weight="medium">First Set - Item 3</Text>
            <Text size="sm" color="soft">Description for item 3</Text>
          </Stack>
        </Panel>
      </RotatingCarousel.Set>
      <RotatingCarousel.Set>
        <Panel padding="lg">
          <Stack gap="xs">
            <Text weight="medium">Second Set - Item A</Text>
            <Text size="sm" color="soft">Description for item A</Text>
          </Stack>
        </Panel>
        <Panel padding="lg">
          <Stack gap="xs">
            <Text weight="medium">Second Set - Item B</Text>
            <Text size="sm" color="soft">Description for item B</Text>
          </Stack>
        </Panel>
        <Panel padding="lg">
          <Stack gap="xs">
            <Text weight="medium">Second Set - Item C</Text>
            <Text size="sm" color="soft">Description for item C</Text>
          </Stack>
        </Panel>
      </RotatingCarousel.Set>
    </RotatingCarousel>
  ),
  args: {
    interval: 2500,
    staggerDelay: 200,
    animationDuration: 700,
  },
  parameters: {
    docs: {
      description: {
        story: `
Use \`RotatingCarousel.Set\` children for declarative content definition.
Each Set represents one rotation state.
        `,
      },
    },
  },
};

// Pause on hover
export const PauseOnHover: Story = {
  render: (args) => (
    <Stack gap="md">
      <Text size="sm" color="soft">
        Hover over the carousel to pause rotation
      </Text>
      <RotatingCarousel
        {...args}
        className={storyStyles.threeColumnGrid}
        sets={cardSets}
        pauseOnHover
        renderItem={(item, index) => (
          <Panel key={index} padding="lg">
            <Stack gap="xs">
              <Text weight="medium">{item.title}</Text>
              <Text size="sm" color="soft">{item.description}</Text>
            </Stack>
          </Panel>
        )}
      />
    </Stack>
  ),
  args: {
    interval: 2000,
    minHeight: 120,
  },
  parameters: {
    docs: {
      description: {
        story: `
Enable \`pauseOnHover\` to pause the rotation when the user hovers over the carousel.
Useful for content that needs more time to read.
        `,
      },
    },
  },
};

// Custom timing
export const CustomTiming: Story = {
  render: (args) => (
    <RotatingCarousel
      {...args}
      className={storyStyles.threeColumnGrid}
      sets={cardSets}
      interval={2000}
      staggerDelay={200}
      animationDuration={1000}
      renderItem={(item, index) => (
        <Panel key={index} padding="lg">
          <Stack gap="xs">
            <Text weight="medium">{item.title}</Text>
            <Text size="sm" color="soft">{item.description}</Text>
          </Stack>
        </Panel>
      )}
    />
  ),
  args: {
    minHeight: 120,
  },
  parameters: {
    docs: {
      description: {
        story: `
Customize timing with:
- \`interval\`: Time between rotations (2000ms here)
- \`staggerDelay\`: Delay between each item (200ms for more pronounced stagger)
- \`animationDuration\`: How long each item takes to animate (1000ms for slower effect)
        `,
      },
    },
  },
};

// Fast rotation
export const FastRotation: Story = {
  render: (args) => (
    <RotatingCarousel
      {...args}
      className={storyStyles.threeColumnGrid}
      sets={cardSets}
      interval={1500}
      staggerDelay={50}
      animationDuration={400}
      renderItem={(item, index) => (
        <Panel key={index} padding="lg">
          <Stack gap="xs">
            <Text weight="medium">{item.title}</Text>
            <Text size="sm" color="soft">{item.description}</Text>
          </Stack>
        </Panel>
      )}
    />
  ),
  args: {
    minHeight: 120,
  },
  parameters: {
    docs: {
      description: {
        story: `
A faster configuration for more dynamic presentations.
Short interval (1500ms), quick stagger (50ms), and fast animation (400ms).
        `,
      },
    },
  },
};

// Two columns layout
export const TwoColumns: Story = {
  render: (args) => {
    const twoColSets = [
      [
        { title: 'Left Item', description: 'First set left' },
        { title: 'Right Item', description: 'First set right' },
      ],
      [
        { title: 'Alpha', description: 'Second set left' },
        { title: 'Beta', description: 'Second set right' },
      ],
    ];

    return (
      <RotatingCarousel
        {...args}
        className={storyStyles.twoColumnGrid}
        sets={twoColSets}
        renderItem={(item, index) => (
          <Panel key={index} padding="lg">
            <Stack gap="xs">
              <Text weight="medium">{item.title}</Text>
              <Text size="sm" color="soft">{item.description}</Text>
            </Stack>
          </Panel>
        )}
      />
    );
  },
  args: {
    interval: 3000,
    minHeight: 100,
  },
  parameters: {
    docs: {
      description: {
        story: `
The carousel works with any grid configuration.
Here's a simple two-column layout.
        `,
      },
    },
  },
};

// Single item rotation (like testimonials)
export const SingleItem: Story = {
  render: (args) => {
    const testimonials = [
      [{ quote: '"This product changed everything for us."', author: 'Jane D., CEO' }],
      [{ quote: '"I can\'t imagine working without it now."', author: 'Mike S., Developer' }],
      [{ quote: '"The best tool we\'ve adopted this year."', author: 'Sarah L., Designer' }],
    ];

    return (
      <RotatingCarousel
        {...args}
        sets={testimonials}
        renderItem={(item, index) => (
          <Panel key={index} padding="xl" style={{ textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
            <Text size="lg" style={{ fontStyle: 'italic', marginBottom: 'var(--space-3)' }}>
              {item.quote}
            </Text>
            <Text size="sm" color="soft">{item.author}</Text>
          </Panel>
        )}
      />
    );
  },
  args: {
    interval: 4000,
    animationDuration: 800,
    minHeight: 150,
  },
  parameters: {
    docs: {
      description: {
        story: `
Single-item sets work great for testimonials or quotes.
Each set contains just one item that crossfades to the next.
        `,
      },
    },
  },
};

// Many items
export const ManyItems: Story = {
  render: (args) => {
    const manyItemSets = [
      Array.from({ length: 6 }, (_, i) => ({ title: `Set 1 - ${i + 1}` })),
      Array.from({ length: 6 }, (_, i) => ({ title: `Set 2 - ${String.fromCharCode(65 + i)}` })),
    ];

    return (
      <RotatingCarousel
        {...args}
        className={storyStyles.threeColumnGrid}
        sets={manyItemSets}
        staggerDelay={80}
        renderItem={(item, index) => (
          <Panel key={index} padding="md">
            <Text weight="medium" size="sm">{item.title}</Text>
          </Panel>
        )}
      />
    );
  },
  args: {
    interval: 4000,
    minHeight: 180,
  },
  parameters: {
    docs: {
      description: {
        story: `
With many items, the stagger effect becomes more pronounced.
Adjust \`staggerDelay\` based on item count for best visual effect.
        `,
      },
    },
  },
};
