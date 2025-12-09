import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Collapse } from './Collapse';
import { Fade, FadeIn } from './Fade';
import { Slide, SlideIn } from './Slide';
import { Scale, ScaleIn } from './Scale';
import { Transition, AnimatePresence } from './Transition';
import { Button } from '../Button';
import { Panel } from '../Panel';
import { Stack } from '../Stack';
import { Text } from '../Text';

/**
 * # Animation Components
 *
 * A collection of animation utilities for creating smooth enter/exit transitions.
 *
 * ## Components
 *
 * - **Collapse**: Animates height for expand/collapse effects
 * - **Fade**: Animates opacity for enter/exit
 * - **Slide**: Animates position for enter/exit
 * - **Scale**: Animates scale for enter/exit
 * - **Transition**: Flexible wrapper for custom animations
 * - **AnimatePresence**: Keeps elements in DOM during exit animations
 *
 * ## Hooks
 *
 * - **useAnimatePresence**: Hook for managing mount/unmount animations
 * - **useAnimationState**: Hook for programmatic animation control
 *
 * ## Usage
 *
 * All animation components follow a similar pattern:
 *
 * ```tsx
 * import { Fade } from '@ui-kit/react';
 *
 * function MyComponent() {
 *   const [isVisible, setIsVisible] = useState(false);
 *
 *   return (
 *     <>
 *       <Button onClick={() => setIsVisible(!isVisible)}>Toggle</Button>
 *       <Fade isVisible={isVisible}>
 *         <Panel>Content that fades in/out</Panel>
 *       </Fade>
 *     </>
 *   );
 * }
 * ```
 *
 * @see [Example: Application Layout](/docs/example-pages-applicationlayout--docs)
 */

const meta: Meta = {
  title: 'Animation/Overview',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Animation components provide smooth enter/exit transitions for UI elements.

## Key Features

- **CSS-based**: Uses CSS transitions and keyframes for smooth 60fps animations
- **Reduced motion**: Respects \`prefers-reduced-motion\` user preference
- **Hooks included**: Use \`useAnimatePresence\` for custom animation logic
- **Duration control**: All durations are customizable
- **Callbacks**: \`onEnterComplete\` and \`onExitComplete\` for sequencing

## Best Practices

1. Use \`duration={200}\` for most UI transitions
2. Use \`duration={300}\` for larger/more complex animations
3. Use \`duration={100}\` for micro-interactions (hover states)
4. Always provide reduced motion alternatives
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

// Collapse Story
function CollapseDemo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Stack gap="md">
      <Button onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Collapse' : 'Expand'}
      </Button>
      <Collapse isOpen={isOpen}>
        <Panel padding="lg">
          <Text>
            This content animates its height when expanding and collapsing.
            Perfect for accordions, expandable sections, and disclosure widgets.
          </Text>
          <Text style={{ marginTop: 'var(--space-2)' }}>
            The animation smoothly transitions from 0 height to auto height,
            preserving the natural content dimensions.
          </Text>
        </Panel>
      </Collapse>
    </Stack>
  );
}

export const CollapseAnimation: Story = {
  render: () => <CollapseDemo />,
  parameters: {
    docs: {
      description: {
        story: `
The **Collapse** component animates height for expand/collapse effects.
Ideal for accordions, expandable sections, and disclosure widgets.

\`\`\`tsx
<Collapse isOpen={isExpanded} duration={200}>
  <Panel>Expandable content</Panel>
</Collapse>
\`\`\`
        `,
      },
    },
  },
};

// Fade Story
function FadeDemo() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Stack gap="md">
      <Button onClick={() => setIsVisible(!isVisible)}>
        {isVisible ? 'Hide' : 'Show'}
      </Button>
      <Fade isVisible={isVisible}>
        <Panel padding="lg">
          <Text>This content fades in and out smoothly.</Text>
        </Panel>
      </Fade>
    </Stack>
  );
}

export const FadeAnimation: Story = {
  render: () => <FadeDemo />,
  parameters: {
    docs: {
      description: {
        story: `
The **Fade** component animates opacity for enter/exit transitions.
The simplest animation for showing/hiding content.

\`\`\`tsx
<Fade isVisible={isVisible} duration={200}>
  <Panel>Fading content</Panel>
</Fade>
\`\`\`
        `,
      },
    },
  },
};

// Slide Story
function SlideDemo() {
  const [isVisible, setIsVisible] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right'>('up');

  return (
    <Stack gap="md">
      <Stack direction="row" gap="sm">
        <Button onClick={() => setIsVisible(!isVisible)}>
          {isVisible ? 'Hide' : 'Show'}
        </Button>
        <Button variant="outline" onClick={() => setDirection('up')}>Up</Button>
        <Button variant="outline" onClick={() => setDirection('down')}>Down</Button>
        <Button variant="outline" onClick={() => setDirection('left')}>Left</Button>
        <Button variant="outline" onClick={() => setDirection('right')}>Right</Button>
      </Stack>
      <div style={{ position: 'relative', minHeight: '100px' }}>
        <Slide isVisible={isVisible} direction={direction} distance={30}>
          <Panel padding="lg">
            <Text>This content slides from the {direction}.</Text>
          </Panel>
        </Slide>
      </div>
    </Stack>
  );
}

export const SlideAnimation: Story = {
  render: () => <SlideDemo />,
  parameters: {
    docs: {
      description: {
        story: `
The **Slide** component animates position for enter/exit transitions.
Supports 4 directions: up, down, left, right.

\`\`\`tsx
<Slide isVisible={isVisible} direction="up" distance={20}>
  <Panel>Sliding content</Panel>
</Slide>
\`\`\`
        `,
      },
    },
  },
};

// Scale Story
function ScaleDemo() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Stack gap="md">
      <Button onClick={() => setIsVisible(!isVisible)}>
        {isVisible ? 'Hide' : 'Show'}
      </Button>
      <Scale isVisible={isVisible} initialScale={0.9} origin="top">
        <Panel padding="lg">
          <Text>This content scales in and out from the top.</Text>
        </Panel>
      </Scale>
    </Stack>
  );
}

export const ScaleAnimation: Story = {
  render: () => <ScaleDemo />,
  parameters: {
    docs: {
      description: {
        story: `
The **Scale** component animates scale for enter/exit transitions.
Supports different transform origins for varied effects.

\`\`\`tsx
<Scale isVisible={isVisible} initialScale={0.9} origin="top">
  <Panel>Scaling content</Panel>
</Scale>
\`\`\`

**Origin options**: center, top, bottom, left, right, top-left, top-right, bottom-left, bottom-right
        `,
      },
    },
  },
};

// One-way animations
function OneWayDemo() {
  const [key, setKey] = useState(0);

  return (
    <Stack gap="lg">
      <Button onClick={() => setKey(k => k + 1)}>Replay Animations</Button>

      <Stack direction="row" gap="md" key={key}>
        <FadeIn delay={0}>
          <Panel padding="md">
            <Text weight="medium">FadeIn</Text>
            <Text size="sm" color="soft">delay: 0ms</Text>
          </Panel>
        </FadeIn>

        <FadeIn delay={100}>
          <Panel padding="md">
            <Text weight="medium">FadeIn</Text>
            <Text size="sm" color="soft">delay: 100ms</Text>
          </Panel>
        </FadeIn>

        <SlideIn direction="up" delay={200}>
          <Panel padding="md">
            <Text weight="medium">SlideIn</Text>
            <Text size="sm" color="soft">delay: 200ms</Text>
          </Panel>
        </SlideIn>

        <ScaleIn delay={300} origin="bottom">
          <Panel padding="md">
            <Text weight="medium">ScaleIn</Text>
            <Text size="sm" color="soft">delay: 300ms</Text>
          </Panel>
        </ScaleIn>
      </Stack>
    </Stack>
  );
}

export const OneWayAnimations: Story = {
  render: () => <OneWayDemo />,
  parameters: {
    docs: {
      description: {
        story: `
**FadeIn**, **SlideIn**, and **ScaleIn** are one-way animations that play on mount.
Perfect for staggered entrance animations.

\`\`\`tsx
<Stack direction="row">
  <FadeIn delay={0}><Card>1</Card></FadeIn>
  <FadeIn delay={100}><Card>2</Card></FadeIn>
  <FadeIn delay={200}><Card>3</Card></FadeIn>
</Stack>
\`\`\`
        `,
      },
    },
  },
};

// AnimatePresence Story
function AnimatePresenceDemo() {
  const [items, setItems] = useState([1, 2, 3]);
  const [nextId, setNextId] = useState(4);

  const addItem = () => {
    setItems([...items, nextId]);
    setNextId(nextId + 1);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item !== id));
  };

  return (
    <Stack gap="md">
      <Button onClick={addItem}>Add Item</Button>
      <Stack gap="sm">
        {items.map((item) => (
          <Fade key={item} isVisible={true} duration={200}>
            <Panel padding="md">
              <Stack direction="row" justify="between" align="center">
                <Text>Item {item}</Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item)}
                >
                  Remove
                </Button>
              </Stack>
            </Panel>
          </Fade>
        ))}
      </Stack>
    </Stack>
  );
}

export const AnimatePresenceExample: Story = {
  render: () => <AnimatePresenceDemo />,
  parameters: {
    docs: {
      description: {
        story: `
Use **AnimatePresence** to keep elements in the DOM during exit animations.
This allows smooth exit transitions before removal.

\`\`\`tsx
import { AnimatePresence } from '@ui-kit/react';

function List({ items }) {
  return (
    <AnimatePresence>
      {items.map(item => (
        <Fade key={item.id} isVisible={true}>
          <ListItem>{item.name}</ListItem>
        </Fade>
      ))}
    </AnimatePresence>
  );
}
\`\`\`
        `,
      },
    },
  },
};

// Combined animations
function CombinedDemo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Stack gap="md">
      <Button onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Close Modal' : 'Open Modal'}
      </Button>

      <Fade isVisible={isOpen} duration={150}>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setIsOpen(false)}
        >
          <Scale
            isVisible={isOpen}
            initialScale={0.95}
            duration={200}
          >
            <Panel
              padding="xl"
              style={{ minWidth: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Text weight="bold" size="lg">Modal Title</Text>
              <Text color="soft" style={{ marginTop: 'var(--space-2)' }}>
                This modal uses a combination of Fade (for backdrop)
                and Scale (for the content) animations.
              </Text>
              <Button
                style={{ marginTop: 'var(--space-4)' }}
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            </Panel>
          </Scale>
        </div>
      </Fade>
    </Stack>
  );
}

export const CombinedAnimations: Story = {
  render: () => <CombinedDemo />,
  parameters: {
    docs: {
      description: {
        story: `
Combine multiple animation components for complex effects.
This example uses **Fade** for the backdrop and **Scale** for the modal content.

\`\`\`tsx
<Fade isVisible={isOpen} duration={150}>
  <Backdrop>
    <Scale isVisible={isOpen} initialScale={0.95} duration={200}>
      <Modal>Content</Modal>
    </Scale>
  </Backdrop>
</Fade>
\`\`\`
        `,
      },
    },
  },
};
