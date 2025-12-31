import { Card, Text, RelativeTime, Table, type TableColumn } from '@ui-kit/react';
import type { ClaudeSession, SessionMessage } from './types';
import styles from './ClaudeDiagnostics.module.css';

interface ContextTabProps {
  session: ClaudeSession;
  messages: SessionMessage[];
}

interface MetadataRow {
  label: string;
  value: string | number;
}

/**
 * Format a timestamp to a readable date/time
 */
function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

const metadataColumns: TableColumn<MetadataRow>[] = [
  {
    id: 'label',
    header: 'Property',
    accessor: 'label',
    width: 150,
  },
  {
    id: 'value',
    header: 'Value',
    accessor: 'value',
  },
];

/**
 * Context tab showing session metadata and diagnostics.
 */
export function ContextTab({ session, messages }: ContextTabProps) {
  // Calculate statistics from messages
  const stats = {
    totalMessages: messages.length,
    userMessages: messages.filter((m) => m.role === 'user').length,
    assistantMessages: messages.filter((m) => m.role === 'assistant').length,
    messagesWithTools: messages.filter((m) => m.toolCalls && m.toolCalls.length > 0).length,
  };

  // Get diagnostics from assistant messages (facilitator only)
  const diagnosticsMessages = messages.filter(
    (m) => m.role === 'assistant' && m.diagnostics
  );

  const avgDuration = diagnosticsMessages.length > 0
    ? Math.round(
        diagnosticsMessages.reduce((sum, m) => sum + (m.diagnostics?.durationMs || 0), 0) /
        diagnosticsMessages.length
      )
    : null;

  // Build session info rows
  const sessionInfoRows: MetadataRow[] = [
    { label: 'Session ID', value: session.id },
    { label: 'Type', value: session.type },
    { label: 'Name', value: session.name },
  ];

  // Build statistics rows
  const statsRows: MetadataRow[] = [
    { label: 'Total Messages', value: stats.totalMessages },
    { label: 'User Messages', value: stats.userMessages },
    { label: 'Assistant Messages', value: stats.assistantMessages },
  ];
  if (stats.messagesWithTools > 0) {
    statsRows.push({ label: 'Messages with Tools', value: stats.messagesWithTools });
  }

  // Build type-specific rows
  const typeSpecificRows: MetadataRow[] = [];
  if (session.type === 'facilitator' && session.metadata?.userId) {
    typeSpecificRows.push({ label: 'User ID', value: session.metadata.userId as string });
    if (session.metadata.workspaceName) {
      typeSpecificRows.push({ label: 'Workspace', value: session.metadata.workspaceName as string });
    }
  }
  if (session.type === 'chatroom') {
    if (session.metadata?.participantCount !== undefined) {
      typeSpecificRows.push({ label: 'Participants', value: session.metadata.participantCount as number });
    }
    if (session.metadata?.workspaceId) {
      typeSpecificRows.push({ label: 'Workspace ID', value: session.metadata.workspaceId as string });
    }
  }
  if (session.type === 'ideaagent' && session.metadata?.ideaTitle) {
    typeSpecificRows.push({ label: 'Idea Title', value: session.metadata.ideaTitle as string });
  }

  // Build diagnostics rows
  const diagnosticsRows: MetadataRow[] = [];
  if (diagnosticsMessages.length > 0) {
    diagnosticsRows.push({ label: 'Tracked Responses', value: diagnosticsMessages.length });
    if (avgDuration !== null) {
      diagnosticsRows.push({ label: 'Avg Response Time', value: `${avgDuration}ms` });
    }
  }

  return (
    <div className={styles.contextTab}>
      {/* Session Info */}
      <Card className={styles.contextSection}>
        <Text size="sm" weight="semibold" className={styles.sectionTitle}>Session Information</Text>
        <Table<MetadataRow>
          columns={metadataColumns}
          data={sessionInfoRows}
          getRowKey={(row) => row.label}
          size="sm"
        />
        <div className={styles.lastActivityRow}>
          <Text size="sm" color="soft">Last Activity</Text>
          <RelativeTime timestamp={session.lastActivity} format="long" size="sm" />
        </div>
      </Card>

      {/* Type-specific metadata */}
      {typeSpecificRows.length > 0 && (
        <Card className={styles.contextSection}>
          <Text size="sm" weight="semibold" className={styles.sectionTitle}>
            {session.type === 'facilitator' && 'Facilitator Details'}
            {session.type === 'chatroom' && 'Chat Room Details'}
            {session.type === 'ideaagent' && 'Idea Agent Details'}
          </Text>
          <Table<MetadataRow>
            columns={metadataColumns}
            data={typeSpecificRows}
            getRowKey={(row) => row.label}
            size="sm"
          />
        </Card>
      )}

      {/* Message Statistics */}
      <Card className={styles.contextSection}>
        <Text size="sm" weight="semibold" className={styles.sectionTitle}>Message Statistics</Text>
        <Table<MetadataRow>
          columns={metadataColumns}
          data={statsRows}
          getRowKey={(row) => row.label}
          size="sm"
        />
      </Card>

      {/* Performance Diagnostics */}
      {diagnosticsMessages.length > 0 && (
        <Card className={styles.contextSection}>
          <Text size="sm" weight="semibold" className={styles.sectionTitle}>Performance Diagnostics</Text>
          <Table<MetadataRow>
            columns={metadataColumns}
            data={diagnosticsRows}
            getRowKey={(row) => row.label}
            size="sm"
          />

          {/* Recent diagnostic entries */}
          <div className={styles.diagnosticsList}>
            <Text size="xs" color="soft" className={styles.sectionSubtitle}>Recent Responses</Text>
            {diagnosticsMessages.slice(-5).reverse().map((msg) => (
              <Card
                key={msg.id}
                className={`${styles.diagnosticEntry} ${msg.diagnostics?.error ? styles.hasError : ''}`}
              >
                <div className={styles.diagnosticStats}>
                  <div className={styles.diagnosticStat}>
                    <Text size="xs" color="soft">Time</Text>
                    <Text size="sm">{formatDateTime(msg.timestamp)}</Text>
                  </div>
                  {msg.diagnostics?.durationMs !== undefined && (
                    <div className={styles.diagnosticStat}>
                      <Text size="xs" color="soft">Duration</Text>
                      <Text size="sm" weight="medium">{msg.diagnostics.durationMs}ms</Text>
                    </div>
                  )}
                  {msg.diagnostics?.iterations !== undefined && (
                    <div className={styles.diagnosticStat}>
                      <Text size="xs" color="soft">Iterations</Text>
                      <Text size="sm" weight="medium">{msg.diagnostics.iterations}</Text>
                    </div>
                  )}
                </div>
                {msg.diagnostics?.error && (
                  <span className={styles.errorText}>
                    Error: {msg.diagnostics.error}
                  </span>
                )}
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
