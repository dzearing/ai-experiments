import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Accordion, AccordionItem, AccordionHeader, AccordionContent } from './Accordion';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Button } from '../Button';

/**
 * # Accordion
 *
 * Collapsible content panels for organizing information.
 *
 * ## Features
 *
 * - Animated expand/collapse with height transition
 * - Single or multiple expanded panels
 * - Controlled and uncontrolled modes
 * - Disabled panels
 * - Multiple visual variants
 * - Icon support in headers
 *
 * ## Usage
 *
 * ```tsx
 * import { Accordion, AccordionItem, AccordionHeader, AccordionContent } from '@ui-kit/react';
 *
 * <Accordion>
 *   <AccordionItem id="item-1">
 *     <AccordionHeader itemId="item-1">Section 1</AccordionHeader>
 *     <AccordionContent itemId="item-1">Content for section 1</AccordionContent>
 *   </AccordionItem>
 *   <AccordionItem id="item-2">
 *     <AccordionHeader itemId="item-2">Section 2</AccordionHeader>
 *     <AccordionContent itemId="item-2">Content for section 2</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 * ```
 *
 * @see [Example: Settings Page](/docs/example-pages-settingspage--docs)
 */

const meta: Meta<typeof Accordion> = {
  title: 'Data Display/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Collapsible content panels for organizing and revealing information progressively.

## When to Use

- Organizing related content in limited vertical space
- FAQs and help documentation with expandable answers
- Settings pages with categorized options
- Multi-step forms where sections can be collapsed after completion
- Mobile interfaces where screen space is limited

## Variants

| Variant | Use Case |
|---------|----------|
| \`default\` | Minimal styling, blends with page background |
| \`bordered\` | Single border around all items for visual containment |
| \`separated\` | Individual borders with spacing for distinct sections |

## Behavior

- **Single expand** (default): Only one panel open at a time
- **Multiple expand**: Set \`allowMultiple={true}\` for independent panels
- **Controlled mode**: Use \`expandedItems\` and \`onExpandedChange\` for full control

## Accessibility

- Uses semantic \`button\` elements for headers with proper ARIA attributes
- Keyboard support: Tab to focus, Enter/Space to toggle, arrow keys for navigation
- \`aria-expanded\` indicates panel state to screen readers
- \`aria-controls\` links header to content panel
- Disabled items are marked with \`aria-disabled\` and cannot be toggled

## Usage

\`\`\`tsx
import { Accordion, AccordionItem, AccordionHeader, AccordionContent } from '@ui-kit/react';

<Accordion allowMultiple>
  <AccordionItem id="item-1">
    <AccordionHeader itemId="item-1">Section Title</AccordionHeader>
    <AccordionContent itemId="item-1">
      Panel content goes here
    </AccordionContent>
  </AccordionItem>
</Accordion>
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

// Basic accordion
export const Default: Story = {
  render: () => (
    <div style={{ width: 400 }}>
      <Accordion>
        <AccordionItem id="item-1">
          <AccordionHeader itemId="item-1">What is React?</AccordionHeader>
          <AccordionContent itemId="item-1">
            <Text>
              React is a JavaScript library for building user interfaces. It lets you compose complex UIs from small, isolated pieces of code called "components".
            </Text>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id="item-2">
          <AccordionHeader itemId="item-2">What are hooks?</AccordionHeader>
          <AccordionContent itemId="item-2">
            <Text>
              Hooks are functions that let you "hook into" React state and lifecycle features from function components. They don't work inside classes.
            </Text>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id="item-3">
          <AccordionHeader itemId="item-3">What is JSX?</AccordionHeader>
          <AccordionContent itemId="item-3">
            <Text>
              JSX is a syntax extension for JavaScript that looks similar to HTML. It's used with React to describe what the UI should look like.
            </Text>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

// Allow multiple expanded
export const AllowMultiple: Story = {
  render: () => (
    <div style={{ width: 400 }}>
      <Accordion allowMultiple defaultExpandedItems={['item-1', 'item-2']}>
        <AccordionItem id="item-1">
          <AccordionHeader itemId="item-1">Personal Information</AccordionHeader>
          <AccordionContent itemId="item-1">
            <Text>Name, email, phone number, and address details.</Text>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id="item-2">
          <AccordionHeader itemId="item-2">Account Settings</AccordionHeader>
          <AccordionContent itemId="item-2">
            <Text>Username, password, and security options.</Text>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id="item-3">
          <AccordionHeader itemId="item-3">Notification Preferences</AccordionHeader>
          <AccordionContent itemId="item-3">
            <Text>Email, SMS, and push notification settings.</Text>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Set `allowMultiple={true}` to allow multiple panels to be expanded simultaneously.',
      },
    },
  },
};

// Bordered variant
export const Bordered: Story = {
  render: () => (
    <div style={{ width: 400 }}>
      <Accordion variant="bordered">
        <AccordionItem id="shipping">
          <AccordionHeader itemId="shipping">Shipping Information</AccordionHeader>
          <AccordionContent itemId="shipping">
            <Text>
              We offer free standard shipping on orders over $50. Express shipping is available for an additional fee.
            </Text>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id="returns">
          <AccordionHeader itemId="returns">Return Policy</AccordionHeader>
          <AccordionContent itemId="returns">
            <Text>
              Items can be returned within 30 days of purchase for a full refund. Items must be in original condition.
            </Text>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id="warranty">
          <AccordionHeader itemId="warranty">Warranty</AccordionHeader>
          <AccordionContent itemId="warranty">
            <Text>
              All products come with a 1-year manufacturer's warranty covering defects in materials and workmanship.
            </Text>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The bordered variant adds a single border around all items.',
      },
    },
  },
};

// Separated variant
export const Separated: Story = {
  render: () => (
    <div style={{ width: 400 }}>
      <Accordion variant="separated">
        <AccordionItem id="overview">
          <AccordionHeader itemId="overview">Project Overview</AccordionHeader>
          <AccordionContent itemId="overview">
            <Text>
              A high-level summary of the project goals, timeline, and key stakeholders involved.
            </Text>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id="requirements">
          <AccordionHeader itemId="requirements">Requirements</AccordionHeader>
          <AccordionContent itemId="requirements">
            <Text>
              Detailed functional and non-functional requirements that define what the project should deliver.
            </Text>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id="timeline">
          <AccordionHeader itemId="timeline">Timeline & Milestones</AccordionHeader>
          <AccordionContent itemId="timeline">
            <Text>
              Key dates and milestones for the project, including deliverables and review points.
            </Text>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The separated variant gives each item individual borders with spacing.',
      },
    },
  },
};

// With icons
export const WithIcons: Story = {
  render: () => (
    <div style={{ width: 400 }}>
      <Accordion variant="bordered">
        <AccordionItem id="general">
          <AccordionHeader itemId="general" icon={<span>⚙️</span>}>
            General Settings
          </AccordionHeader>
          <AccordionContent itemId="general">
            <Text>Language, timezone, and display preferences.</Text>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id="security">
          <AccordionHeader itemId="security" icon={<span>🔒</span>}>
            Security
          </AccordionHeader>
          <AccordionContent itemId="security">
            <Text>Password, two-factor authentication, and session management.</Text>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id="notifications">
          <AccordionHeader itemId="notifications" icon={<span>🔔</span>}>
            Notifications
          </AccordionHeader>
          <AccordionContent itemId="notifications">
            <Text>Email alerts, push notifications, and digest settings.</Text>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Add icons to headers with the `icon` prop.',
      },
    },
  },
};

// Disabled items
export const WithDisabled: Story = {
  render: () => (
    <div style={{ width: 400 }}>
      <Accordion variant="bordered">
        <AccordionItem id="basic">
          <AccordionHeader itemId="basic">Basic Plan</AccordionHeader>
          <AccordionContent itemId="basic">
            <Text>Free tier with limited features.</Text>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id="pro" disabled>
          <AccordionHeader itemId="pro" disabled>
            Pro Plan (Coming Soon)
          </AccordionHeader>
          <AccordionContent itemId="pro">
            <Text>Advanced features for power users.</Text>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id="enterprise">
          <AccordionHeader itemId="enterprise">Enterprise Plan</AccordionHeader>
          <AccordionContent itemId="enterprise">
            <Text>Custom solutions for large organizations.</Text>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Disable individual items with the `disabled` prop.',
      },
    },
  },
};

// Controlled accordion
export const Controlled: Story = {
  render: () => {
    const [expanded, setExpanded] = useState<string[]>(['item-1']);

    return (
      <Stack gap="md" style={{ width: 400 }}>
        <Stack direction="row" gap="sm">
          <Button size="sm" onClick={() => setExpanded(['item-1'])}>Open First</Button>
          <Button size="sm" onClick={() => setExpanded(['item-2'])}>Open Second</Button>
          <Button size="sm" onClick={() => setExpanded([])}>Close All</Button>
        </Stack>
        <Accordion
          expandedItems={expanded}
          onExpandedChange={setExpanded}
        >
          <AccordionItem id="item-1">
            <AccordionHeader itemId="item-1">First Section</AccordionHeader>
            <AccordionContent itemId="item-1">
              <Text>Content for the first section.</Text>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem id="item-2">
            <AccordionHeader itemId="item-2">Second Section</AccordionHeader>
            <AccordionContent itemId="item-2">
              <Text>Content for the second section.</Text>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Text size="sm" color="soft">
          Expanded: {expanded.join(', ') || 'none'}
        </Text>
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Use `expandedItems` and `onExpandedChange` for controlled mode.',
      },
    },
  },
};

// Nested accordion
export const Nested: Story = {
  render: () => (
    <div style={{ width: 400 }}>
      <Accordion variant="bordered">
        <AccordionItem id="frontend">
          <AccordionHeader itemId="frontend">Frontend</AccordionHeader>
          <AccordionContent itemId="frontend">
            <Accordion>
              <AccordionItem id="react">
                <AccordionHeader itemId="react">React</AccordionHeader>
                <AccordionContent itemId="react">
                  <Text size="sm">A JavaScript library for building user interfaces.</Text>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem id="vue">
                <AccordionHeader itemId="vue">Vue</AccordionHeader>
                <AccordionContent itemId="vue">
                  <Text size="sm">A progressive framework for building user interfaces.</Text>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id="backend">
          <AccordionHeader itemId="backend">Backend</AccordionHeader>
          <AccordionContent itemId="backend">
            <Accordion>
              <AccordionItem id="node">
                <AccordionHeader itemId="node">Node.js</AccordionHeader>
                <AccordionContent itemId="node">
                  <Text size="sm">A JavaScript runtime built on Chrome's V8 engine.</Text>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem id="python">
                <AccordionHeader itemId="python">Python</AccordionHeader>
                <AccordionContent itemId="python">
                  <Text size="sm">A versatile programming language for backends.</Text>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Accordions can be nested for hierarchical organization.',
      },
    },
  },
};
