import type { Meta, StoryObj } from '@storybook/react';
import {
  CompactTimelineLayout,
  MinimalEdgeLayout,
  SubtleEmphasisLayout,
  GroupSubtleLayout,
} from './layouts';

/**
 * # Chat UX Exploration
 *
 * Exploring improved chat message layouts for 1:1 conversations.
 *
 * ## Design Goals
 *
 * 1. **Reduce horizontal space** - Avatars and wide timestamps waste space
 * 2. **No need for sender identification** - In 1:1 convos, differentiate by styling alone
 * 3. **User messages should stand out** - Use primary surface to highlight user input
 * 4. **Avoid messaging bubbles** - Chat doesn't need to look like SMS
 * 5. **Time is secondary** - Show it subtly or on-demand
 *
 * ## Component Gap Analysis
 *
 * Components that would improve this implementation:
 *
 * 1. **ChatMessage** - A flexible message component that accepts layout variants
 *    (compact, document, minimal, subtle) as props
 *
 * 2. **ChatThread** - Container that handles message grouping, scroll behavior,
 *    and loading states with configurable layout prop
 *
 * 3. **TimeIndicator** - Smart timestamp that shows relative time, absolute time,
 *    or "just now" based on context, with configurable visibility (always/hover/hidden)
 *
 * 4. **MessageGroup** - Groups consecutive messages from same sender with
 *    optional separator on speaker change
 */

type LayoutType = 'compact-timeline' | 'minimal-edge' | 'subtle-emphasis' | 'group-subtle';

interface ChatUXExplorationProps {
  layout: LayoutType;
}

function ChatUXExplorationComponent({ layout }: ChatUXExplorationProps) {
  switch (layout) {
    case 'compact-timeline':
      return <CompactTimelineLayout />;
    case 'minimal-edge':
      return <MinimalEdgeLayout />;
    case 'subtle-emphasis':
      return <SubtleEmphasisLayout />;
    case 'group-subtle':
      return <GroupSubtleLayout />;
    default:
      return <CompactTimelineLayout />;
  }
}

const meta: Meta<typeof ChatUXExplorationComponent> = {
  title: 'Example Pages/Ideate Ideas/Chat UX Exploration',
  component: ChatUXExplorationComponent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## Chat UX Layout Variations

These explorations address common issues with chat UIs:

### Layout 1: Compact Timeline
- Sender name + time inline, very subtle
- Speaker changes marked with divider
- User name colored to differentiate
- Dense but scannable

### Layout 2: Minimal Edge-Aligned
- User messages right-aligned with primary background
- AI messages left-aligned, no background
- Clear visual separation by alignment
- Time below each message

### Layout 3: Subtle Emphasis
- Full-width messages, both left-aligned
- User messages have primary background tint
- Time appears on hover (top-right corner)
- Cleanest reading flow

### Layout 4: Group Chat (Subtle)
- Multiple participants with colored avatars
- Sender name shown above message
- Consecutive messages compacted
- Time and actions on hover
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatUXExplorationComponent>;

export const CompactTimeline: Story = {
  name: '1. Compact Timeline',
  args: {
    layout: 'compact-timeline',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Compact Timeline** - Sender name and time appear inline. Speaker changes are marked with a subtle divider line. User's name is colored with the primary accent to differentiate without needing avatars.

**Best for:** Dense conversations where scanning quickly is important.
        `,
      },
    },
  },
};

export const MinimalEdge: Story = {
  name: '2. Minimal Edge-Aligned',
  args: {
    layout: 'minimal-edge',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Minimal Edge-Aligned** - User messages appear on the right with primary background. AI messages on the left with no background. Time appears below each message. Clear visual distinction through alignment.

**Best for:** Traditional chat feel without the bubble aesthetic.
        `,
      },
    },
  },
};

export const SubtleEmphasis: Story = {
  name: '3. Subtle Emphasis',
  args: {
    layout: 'subtle-emphasis',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Subtle Emphasis** - Both message types are full-width and left-aligned. User messages have a subtle primary background tint. Time appears on hover in the top-right corner. Cleanest reading experience.

**Best for:** Focus on content with minimal visual noise.
        `,
      },
    },
  },
};

export const GroupSubtle: Story = {
  name: '4. Group Chat (Subtle)',
  args: {
    layout: 'group-subtle',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Group Chat (Subtle Emphasis variant)** - Extends the Subtle Emphasis layout for multiple participants.

- Small colored avatar indicator for each participant
- Sender name shown above message content
- Consecutive messages from same sender are compacted (avatar hidden, name hidden)
- User messages have primary background, others have transparent background
- Time appears on hover
- Header shows participant avatars stacked

**Best for:** Group conversations where you need to identify speakers while maintaining a clean layout.
        `,
      },
    },
  },
};
