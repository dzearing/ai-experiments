/**
 * Shared types for chat UX exploration mocks
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatLayoutProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onSendMessage?: (message: string) => void;
}

/**
 * Types for group chat with multiple participants
 */
export interface Participant {
  id: string;
  name: string;
  initials: string;
  color: string;
  isCurrentUser?: boolean;
}

export interface GroupChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
}

export interface GroupChatLayoutProps {
  messages: GroupChatMessage[];
  participants: Participant[];
  isLoading?: boolean;
  onSendMessage?: (message: string) => void;
}

/**
 * Sample conversation demonstrating various message types
 */
export const sampleMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello! How can I help you today?',
    timestamp: new Date(Date.now() - 1800000), // 30 min ago
  },
  {
    id: '2',
    role: 'user',
    content: 'Can you explain how React context works?',
    timestamp: new Date(Date.now() - 1750000),
  },
  {
    id: '3',
    role: 'assistant',
    content: `React Context provides a way to pass data through the component tree without having to pass props down manually at every level.

**When to use Context:**
- Theme data (dark/light mode)
- User authentication state
- Language preferences
- Any data needed by many components

**Basic usage:**

\`\`\`tsx
const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}
\`\`\`

Would you like me to explain more about the useContext hook?`,
    timestamp: new Date(Date.now() - 1700000),
  },
  {
    id: '4',
    role: 'user',
    content: 'Yes please, and when should I avoid using context?',
    timestamp: new Date(Date.now() - 1650000),
  },
  {
    id: '5',
    role: 'assistant',
    content: `Great question! Let me cover both.

**Using useContext:**

\`\`\`tsx
function Button() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Click me</button>;
}
\`\`\`

**When to avoid Context:**

1. **Frequently changing data** - Context changes trigger re-renders in all consumers
2. **Local state** - If data is only needed by nearby components, props are simpler
3. **Complex state logic** - Consider useReducer or state management libraries

A good rule: if you're only passing props through 2-3 levels, props are fine. Context shines when data needs to skip many levels.`,
    timestamp: new Date(Date.now() - 1600000),
  },
  {
    id: '6',
    role: 'user',
    content: 'That makes sense. Thanks!',
    timestamp: new Date(Date.now() - 60000),
  },
  {
    id: '7',
    role: 'assistant',
    content: 'Happy to help! Let me know if you have any other questions about React or anything else.',
    timestamp: new Date(Date.now() - 30000),
  },
];

/**
 * Sample participants for group chat
 */
export const sampleParticipants: Participant[] = [
  { id: 'user', name: 'You', initials: 'ME', color: '#3b82f6', isCurrentUser: true },
  { id: 'alex', name: 'Alex Chen', initials: 'AC', color: '#8b5cf6' },
  { id: 'sarah', name: 'Sarah Miller', initials: 'SM', color: '#ec4899' },
  { id: 'james', name: 'James Wilson', initials: 'JW', color: '#10b981' },
];

/**
 * Sample group conversation about project planning
 */
export const sampleGroupMessages: GroupChatMessage[] = [
  {
    id: '1',
    senderId: 'alex',
    content: 'Hey team, I wanted to discuss the new feature requirements for the dashboard.',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    senderId: 'sarah',
    content: 'Sure! I was looking at the mockups yesterday. I think we should prioritize the data visualization components first.',
    timestamp: new Date(Date.now() - 3500000),
  },
  {
    id: '3',
    senderId: 'user',
    content: 'Agreed. The charts are the most requested feature from users.',
    timestamp: new Date(Date.now() - 3400000),
  },
  {
    id: '4',
    senderId: 'james',
    content: `I can start on the chart components. Here's what I'm thinking for the API:

\`\`\`typescript
interface ChartProps {
  data: DataPoint[];
  type: 'line' | 'bar' | 'pie';
  options?: ChartOptions;
}
\`\`\`

Does this look reasonable?`,
    timestamp: new Date(Date.now() - 3300000),
  },
  {
    id: '5',
    senderId: 'alex',
    content: 'Looks good! Maybe we should also add a `theme` prop for dark/light mode support?',
    timestamp: new Date(Date.now() - 3200000),
  },
  {
    id: '6',
    senderId: 'user',
    content: 'Good call. We can pull from the existing theme context.',
    timestamp: new Date(Date.now() - 3100000),
  },
  {
    id: '7',
    senderId: 'sarah',
    content: 'I can handle the integration with the theme system. Should have something ready for review by Thursday.',
    timestamp: new Date(Date.now() - 3000000),
  },
  {
    id: '8',
    senderId: 'james',
    content: 'Perfect. I\'ll sync up with you once I have the base components done.',
    timestamp: new Date(Date.now() - 2900000),
  },
  {
    id: '9',
    senderId: 'alex',
    content: 'Great teamwork everyone. Let\'s touch base again tomorrow.',
    timestamp: new Date(Date.now() - 2800000),
  },
];
