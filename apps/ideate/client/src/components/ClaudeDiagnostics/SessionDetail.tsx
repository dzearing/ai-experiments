import { useState, useEffect } from 'react';
import { Tabs, Spinner, Text, Chip } from '@ui-kit/react';
import { ActivityTab } from './ActivityTab';
import { ContextTab } from './ContextTab';
import type { ClaudeSession, SessionMessage, RoleFilter } from './types';
import styles from './ClaudeDiagnostics.module.css';

interface SessionDetailProps {
  session: ClaudeSession;
  messages: SessionMessage[];
  isLoading: boolean;
  roleFilter: RoleFilter;
  searchQuery: string;
}

/**
 * Get chip variant for session type
 */
function getTypeVariant(type: ClaudeSession['type']): 'info' | 'success' | 'warning' {
  switch (type) {
    case 'facilitator':
      return 'info';
    case 'chatroom':
      return 'success';
    case 'ideaagent':
      return 'warning';
    default:
      return 'info';
  }
}

/**
 * Detail panel showing selected session's content.
 * Has sub-tabs for Activity and Context.
 */
export function SessionDetail({
  session,
  messages,
  isLoading,
  roleFilter,
  searchQuery,
}: SessionDetailProps) {
  const [activeTab, setActiveTab] = useState('activity');

  // Reset to activity tab when session changes
  useEffect(() => {
    setActiveTab('activity');
  }, [session.id]);

  const tabItems = [
    {
      value: 'activity',
      label: 'Activity',
      content: isLoading ? (
        <div className={styles.loadingState}>
          <Spinner size="lg" />
          <Text color="soft">Loading messages...</Text>
        </div>
      ) : (
        <ActivityTab
          messages={messages}
          roleFilter={roleFilter}
          searchQuery={searchQuery}
        />
      ),
    },
    {
      value: 'context',
      label: 'Context',
      content: <ContextTab session={session} messages={messages} />,
    },
  ];

  return (
    <div className={styles.sessionDetailPane}>
      {/* Header */}
      <header className={styles.detailHeader}>
        <Text size="base" weight="semibold">{session.name}</Text>
        <Chip size="sm" variant={getTypeVariant(session.type)}>{session.type}</Chip>
      </header>

      {/* Sub-tabs */}
      <div className={styles.tabContent}>
        <Tabs
          items={tabItems}
          value={activeTab}
          onChange={setActiveTab}
          variant="underline"
        />
      </div>
    </div>
  );
}
