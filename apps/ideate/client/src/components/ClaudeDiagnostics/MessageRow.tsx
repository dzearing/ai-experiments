import { useState } from 'react';
import { Text, Chip, Code, Card, CopyButton } from '@ui-kit/react';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';
import type { SessionMessage } from './types';
import styles from './ClaudeDiagnostics.module.css';

interface MessageRowProps {
  message: SessionMessage;
}

/**
 * Format a timestamp to HH:MM:SS format
 */
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

/**
 * Extract text from content that may be a string or an array of content blocks
 */
function extractTextContent(content: unknown): string {
  // If it's already a string, return as-is
  if (typeof content === 'string') {
    return content;
  }

  // If it's an array of content blocks, extract text from each
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

  // If it's a single content block object
  if (content && typeof content === 'object' && 'text' in content) {
    return String((content as { text: unknown }).text);
  }

  // Fallback: stringify the content
  return JSON.stringify(content);
}

/**
 * Truncate text to a maximum length with ellipsis
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Get chip variant for message role
 */
function getRoleVariant(role: string): 'info' | 'success' | 'default' {
  switch (role) {
    case 'user':
      return 'info';
    case 'assistant':
      return 'success';
    default:
      return 'default';
  }
}

/**
 * Get display label for message role
 */
function getRoleLabel(role: string): string {
  switch (role) {
    case 'user':
      return 'REQUEST';
    case 'assistant':
      return 'RESPONSE';
    default:
      return role.toUpperCase();
  }
}

/**
 * Format duration in ms to human readable
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(0);
  return `${mins}m ${secs}s`;
}

/**
 * Format token count with commas
 */
function formatTokens(count: number): string {
  return count.toLocaleString();
}

/**
 * A single message row with expandable details.
 * Shows formatted preview by default, click to expand for full JSON.
 */
export function MessageRow({ message }: MessageRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [showRawEvents, setShowRawEvents] = useState(false);
  const [showSessionInfo, setShowSessionInfo] = useState(false);

  /**
   * Format a single tool call for clipboard
   */
  const formatToolCall = (tc: { name: string; input: Record<string, unknown>; output?: string }) => {
    let text = `Tool: ${tc.name}\nInput:\n${JSON.stringify(tc.input, null, 2)}`;
    if (tc.output) {
      const outputStr = typeof tc.output === 'string' ? tc.output : JSON.stringify(tc.output, null, 2);
      text += `\nOutput:\n${outputStr}`;
    }
    return text;
  };

  return (
    <div className={styles.messageRow}>
      {/* Collapsed Header */}
      <div className={styles.messageHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <Text size="sm" color="soft" className={styles.timestamp}>
          {formatTime(message.timestamp)}
        </Text>
        <Chip size="sm" variant={getRoleVariant(message.role)}>{getRoleLabel(message.role)}</Chip>
        {message.diagnostics?.durationMs !== undefined && (
          <Text size="xs" color="soft">({formatDuration(message.diagnostics.durationMs)})</Text>
        )}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <Chip size="sm" variant="warning">{message.toolCalls.length} tools</Chip>
        )}
        {message.senderName && (
          <Text size="sm" weight="medium">{message.senderName}</Text>
        )}
        <Text size="sm" color="soft" className={styles.messagePreview}>
          {!isExpanded && truncate(extractTextContent(message.content).replace(/\n/g, ' '), 80)}
        </Text>
        <span className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
          <ChevronRightIcon size={16} />
        </span>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className={styles.messageDetail}>
          {/* Full Content */}
          <Card className={styles.messageContentCard}>
            <Code block>{extractTextContent(message.content)}</Code>
          </Card>

          {/* Tool Calls */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className={styles.toolCallsSection}>
              <div className={styles.toolCallsHeader}>
                <Text size="sm" weight="semibold" color="soft">Tool Calls ({message.toolCalls.length})</Text>
                <CopyButton
                  variant="ghost"
                  getContent={() => message.toolCalls!.map((tc, i) => `--- Tool Call ${i + 1} ---\n${formatToolCall(tc)}`).join('\n\n')}
                >
                  Copy All
                </CopyButton>
              </div>
              {message.toolCalls.map((tc, index) => (
                <Card key={index} className={styles.toolCall}>
                  <div className={styles.toolCallHeader}>
                    <Text size="sm" weight="medium">{tc.name}</Text>
                    <CopyButton
                      variant="ghost"
                      getContent={() => formatToolCall(tc)}
                      aria-label="Copy this tool call"
                    />
                  </div>
                  <Code block>{JSON.stringify(tc.input, null, 2)}</Code>
                  {tc.output && (
                    <Code block>{typeof tc.output === 'string' ? tc.output : JSON.stringify(tc.output, null, 2)}</Code>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Diagnostics (if available) */}
          {message.diagnostics && (
            <div className={styles.diagnosticsSection}>
              <Text size="sm" weight="semibold" color="soft">API Details</Text>
              <div className={styles.diagnosticStats}>
                {/* Model */}
                {message.diagnostics.model && (
                  <div className={styles.diagnosticStat}>
                    <Text size="xs" color="soft">Model</Text>
                    <Text size="sm" weight="medium">{message.diagnostics.model}</Text>
                  </div>
                )}
                {/* Token Usage */}
                {message.diagnostics.tokenUsage && (
                  <>
                    <div className={styles.diagnosticStat}>
                      <Text size="xs" color="soft">Input Tokens</Text>
                      <Text size="sm" weight="medium">{formatTokens(message.diagnostics.tokenUsage.inputTokens)}</Text>
                    </div>
                    <div className={styles.diagnosticStat}>
                      <Text size="xs" color="soft">Output Tokens</Text>
                      <Text size="sm" weight="medium">{formatTokens(message.diagnostics.tokenUsage.outputTokens)}</Text>
                    </div>
                  </>
                )}
                {/* Cost */}
                {message.diagnostics.totalCostUsd !== undefined && (
                  <div className={styles.diagnosticStat}>
                    <Text size="xs" color="soft">Cost</Text>
                    <Text size="sm" weight="medium">${message.diagnostics.totalCostUsd.toFixed(4)}</Text>
                  </div>
                )}
                {message.diagnostics.iterations !== undefined && (
                  <div className={styles.diagnosticStat}>
                    <Text size="xs" color="soft">Iterations</Text>
                    <Text size="sm" weight="medium">{message.diagnostics.iterations}</Text>
                  </div>
                )}
                {message.diagnostics.durationMs !== undefined && (
                  <div className={styles.diagnosticStat}>
                    <Text size="xs" color="soft">Duration</Text>
                    <Text size="sm" weight="medium">{message.diagnostics.durationMs}ms</Text>
                  </div>
                )}
                {message.diagnostics.responseLength !== undefined && (
                  <div className={styles.diagnosticStat}>
                    <Text size="xs" color="soft">Response Length</Text>
                    <Text size="sm" weight="medium">{message.diagnostics.responseLength}</Text>
                  </div>
                )}
              </div>
              {message.diagnostics.error && (
                <Card className={styles.diagnosticError}>
                  <span className={styles.errorText}>Error: {typeof message.diagnostics.error === 'string' ? message.diagnostics.error : JSON.stringify(message.diagnostics.error)}</span>
                </Card>
              )}
            </div>
          )}

          {/* Session Info (if available) */}
          {message.diagnostics?.sessionInfo && (
            <div className={styles.systemPromptSection}>
              <div className={styles.sectionHeader} onClick={(e) => { e.stopPropagation(); setShowSessionInfo(!showSessionInfo); }}>
                <span className={`${styles.expandIcon} ${showSessionInfo ? styles.expanded : ''}`}>
                  <ChevronRightIcon size={14} />
                </span>
                <Text size="sm" weight="semibold" color="soft">
                  Session Info ({message.diagnostics.sessionInfo.tools.length} tools, {message.diagnostics.sessionInfo.mcpServers.length} MCP servers)
                </Text>
              </div>
              {showSessionInfo && (
                <Card className={styles.systemPromptCard}>
                  <Text size="xs" color="soft">Session ID</Text>
                  <Text size="sm" weight="medium">{message.diagnostics.sessionInfo.sessionId}</Text>
                  <Text size="xs" color="soft" style={{ marginTop: 'var(--space-2)' }}>Tools</Text>
                  <Code block className={styles.systemPromptCode}>
                    {message.diagnostics.sessionInfo.tools.join('\n')}
                  </Code>
                  <Text size="xs" color="soft" style={{ marginTop: 'var(--space-2)' }}>MCP Servers</Text>
                  <Code block className={styles.systemPromptCode}>
                    {JSON.stringify(message.diagnostics.sessionInfo.mcpServers, null, 2)}
                  </Code>
                </Card>
              )}
            </div>
          )}

          {/* Raw SDK Events (if available) */}
          {message.diagnostics?.rawEvents && message.diagnostics.rawEvents.length > 0 && (
            <div className={styles.systemPromptSection}>
              <div className={styles.sectionHeader} onClick={(e) => { e.stopPropagation(); setShowRawEvents(!showRawEvents); }}>
                <span className={`${styles.expandIcon} ${showRawEvents ? styles.expanded : ''}`}>
                  <ChevronRightIcon size={14} />
                </span>
                <Text size="sm" weight="semibold" color="soft">
                  SDK Events ({message.diagnostics.rawEvents.length})
                </Text>
                <CopyButton
                  variant="ghost"
                  getContent={() => JSON.stringify(message.diagnostics!.rawEvents, null, 2)}
                  aria-label="Copy SDK events"
                />
              </div>
              {showRawEvents && (
                <Card className={styles.systemPromptCard}>
                  {message.diagnostics.rawEvents.map((event, index) => (
                    <div key={index} style={{ marginBottom: 'var(--space-2)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--soft-border)' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                        <Text size="xs" color="soft">{new Date(event.timestamp).toLocaleTimeString()}</Text>
                        <Chip size="sm" variant="info">{event.type}</Chip>
                        {event.subtype && <Chip size="sm" variant="default">{event.subtype}</Chip>}
                      </div>
                      <Code block className={styles.systemPromptCode}>
                        {JSON.stringify(event.data, null, 2)}
                      </Code>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}

          {/* System Prompt (if available) */}
          {message.diagnostics?.systemPrompt && (
            <div className={styles.systemPromptSection}>
              <div className={styles.sectionHeader} onClick={(e) => { e.stopPropagation(); setShowSystemPrompt(!showSystemPrompt); }}>
                <span className={`${styles.expandIcon} ${showSystemPrompt ? styles.expanded : ''}`}>
                  <ChevronRightIcon size={14} />
                </span>
                <Text size="sm" weight="semibold" color="soft">System Prompt</Text>
                <CopyButton
                  variant="ghost"
                  content={message.diagnostics.systemPrompt}
                  aria-label="Copy system prompt"
                />
              </div>
              {showSystemPrompt && (
                <Card className={styles.systemPromptCard}>
                  <Code block className={styles.systemPromptCode}>{message.diagnostics.systemPrompt}</Code>
                </Card>
              )}
            </div>
          )}

          {/* Raw JSON */}
          <div className={styles.rawJsonSection}>
            <Text size="sm" weight="semibold" color="soft">Raw JSON</Text>
            <Code block className={styles.rawJson}>{JSON.stringify(message, null, 2)}</Code>
          </div>
        </div>
      )}
    </div>
  );
}
