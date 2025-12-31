import { useMemo } from 'react';
import { Text } from '@ui-kit/react';
import { MessageRow } from './MessageRow';
import type { SessionMessage, RoleFilter } from './types';
import styles from './ClaudeDiagnostics.module.css';

/**
 * Extract text from content that may be a string or an array of content blocks
 */
function extractTextContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === 'string') return block;
        if (block && typeof block === 'object' && 'text' in block) {
          return String(block.text);
        }
        return '';
      })
      .join('\n');
  }
  if (content && typeof content === 'object' && 'text' in content) {
    return String((content as { text: unknown }).text);
  }
  return JSON.stringify(content);
}

interface ActivityTabProps {
  messages: SessionMessage[];
  roleFilter: RoleFilter;
  searchQuery: string;
}

/**
 * Activity tab showing list of messages with filtering.
 * Messages are shown in chronological order (newest at bottom).
 */
export function ActivityTab({ messages, roleFilter, searchQuery }: ActivityTabProps) {
  // Filter messages based on role and search query
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      // Filter by role
      if (roleFilter !== 'all' && msg.role !== roleFilter) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const contentMatch = extractTextContent(msg.content).toLowerCase().includes(query);
        const senderMatch = msg.senderName?.toLowerCase().includes(query);
        if (!contentMatch && !senderMatch) {
          return false;
        }
      }

      return true;
    });
  }, [messages, roleFilter, searchQuery]);

  if (filteredMessages.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text color="soft">
          {messages.length === 0
            ? 'No messages in this session'
            : 'No messages match your filter'}
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.activityTab}>
      {filteredMessages.map((message) => (
        <MessageRow key={message.id} message={message} />
      ))}
    </div>
  );
}
