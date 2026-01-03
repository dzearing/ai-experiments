import { useState } from 'react';
import { Text, Chip, Code, Card, CopyButton } from '@ui-kit/react';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';
import type { SessionMessage, RawSDKEvent } from './types';
import styles from './ClaudeDiagnostics.module.css';

interface ApiCallViewProps {
  /** User message (request) */
  request: SessionMessage;
  /** Assistant message (response) - may be undefined if still pending */
  response?: SessionMessage;
}

/**
 * Format timestamp to HH:MM:SS.mmm format
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0');
}

/**
 * Format duration in ms to human readable
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(1);
  return `${mins}m ${secs}s`;
}

/**
 * Format token count with commas
 */
function formatTokens(count: number): string {
  return count.toLocaleString();
}

/**
 * Extract text from content
 */
function extractTextContent(content: unknown): string {
  if (typeof content === 'string') return content;
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
  return JSON.stringify(content, null, 2);
}

/**
 * Get SDK event type color
 */
function getEventChipVariant(type: string): 'info' | 'success' | 'warning' | 'error' | 'default' {
  if (type === 'assistant') return 'success';
  if (type === 'user') return 'info';
  if (type === 'system') return 'warning';
  if (type === 'error' || type.includes('error')) return 'error';
  return 'default';
}

/**
 * ApiCallView - Shows a single API call (request/response pair) with full details
 */
export function ApiCallView({ request, response }: ApiCallViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [showRawEvents, setShowRawEvents] = useState(false);

  const diagnostics = response?.diagnostics;
  const rawEvents = diagnostics?.rawEvents || [];

  // Calculate stats
  const duration = diagnostics?.durationMs;
  const inputTokens = diagnostics?.tokenUsage?.inputTokens;
  const outputTokens = diagnostics?.tokenUsage?.outputTokens;
  const cost = diagnostics?.totalCostUsd;
  const model = diagnostics?.model;
  const toolCalls = response?.toolCalls || [];

  return (
    <div className={styles.apiCallRow}>
      {/* Header - Always visible */}
      <div className={styles.apiCallHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <span className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
          <ChevronRightIcon size={16} />
        </span>

        <Text size="sm" color="soft" className={styles.timestamp}>
          {formatTime(request.timestamp)}
        </Text>

        {/* Stats chips */}
        {duration !== undefined && (
          <Chip size="sm" variant="default">{formatDuration(duration)}</Chip>
        )}

        {model && (
          <Chip size="sm" variant="info">{model}</Chip>
        )}

        {inputTokens !== undefined && outputTokens !== undefined && (
          <Chip size="sm" variant="default">
            {formatTokens(inputTokens)} → {formatTokens(outputTokens)} tokens
          </Chip>
        )}

        {cost !== undefined && cost > 0 && (
          <Chip size="sm" variant="warning">${cost.toFixed(4)}</Chip>
        )}

        {toolCalls.length > 0 && (
          <Chip size="sm" variant="success">{toolCalls.length} tool{toolCalls.length > 1 ? 's' : ''}</Chip>
        )}

        {/* Preview */}
        <Text size="sm" color="soft" className={styles.messagePreview}>
          {!isExpanded && extractTextContent(request.content).slice(0, 60).replace(/\n/g, ' ')}...
        </Text>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className={styles.apiCallDetail}>
          {/* System Prompt */}
          {diagnostics?.systemPrompt && (
            <div className={styles.apiCallSection}>
              <div
                className={styles.sectionHeader}
                onClick={(e) => { e.stopPropagation(); setShowSystemPrompt(!showSystemPrompt); }}
              >
                <span className={`${styles.expandIcon} ${showSystemPrompt ? styles.expanded : ''}`}>
                  <ChevronRightIcon size={14} />
                </span>
                <Text size="xs" weight="semibold" color="soft">SYSTEM PROMPT</Text>
                <Text size="xs" color="soft">({diagnostics.systemPrompt.length.toLocaleString()} chars)</Text>
                <CopyButton
                  variant="ghost"
                  content={diagnostics.systemPrompt}
                  aria-label="Copy system prompt"
                />
              </div>
              {showSystemPrompt && (
                <Card className={styles.apiCallCard}>
                  <Code block className={styles.apiCallCode}>{diagnostics.systemPrompt}</Code>
                </Card>
              )}
            </div>
          )}

          {/* Request (User Input) */}
          <div className={styles.apiCallSection}>
            <div className={styles.sectionHeaderStatic}>
              <Text size="xs" weight="semibold" color="soft">REQUEST (User Input)</Text>
              <Text size="xs" color="soft">{formatTime(request.timestamp)}</Text>
              <CopyButton
                variant="ghost"
                content={extractTextContent(request.content)}
                aria-label="Copy request"
              />
            </div>
            <Card className={styles.apiCallCard}>
              <Code block>{extractTextContent(request.content)}</Code>
            </Card>
          </div>

          {/* Response (Assistant Output) */}
          {response && (
            <div className={styles.apiCallSection}>
              <div className={styles.sectionHeaderStatic}>
                <Text size="xs" weight="semibold" color="soft">RESPONSE (Assistant Output)</Text>
                <Text size="xs" color="soft">{formatTime(response.timestamp)}</Text>
                <CopyButton
                  variant="ghost"
                  content={extractTextContent(response.content)}
                  aria-label="Copy response"
                />
              </div>
              <Card className={styles.apiCallCard}>
                <Code block>{extractTextContent(response.content)}</Code>
              </Card>
            </div>
          )}

          {/* Tool Calls */}
          {toolCalls.length > 0 && (
            <div className={styles.apiCallSection}>
              <div className={styles.sectionHeaderStatic}>
                <Text size="xs" weight="semibold" color="soft">TOOL CALLS ({toolCalls.length})</Text>
                <CopyButton
                  variant="ghost"
                  getContent={() => JSON.stringify(toolCalls, null, 2)}
                  aria-label="Copy tool calls"
                />
              </div>
              {toolCalls.map((tc, index) => (
                <Card key={index} className={styles.toolCallCard}>
                  <div className={styles.toolCallHeader}>
                    <Chip size="sm" variant="info">{tc.name}</Chip>
                    <CopyButton
                      variant="ghost"
                      getContent={() => JSON.stringify({ name: tc.name, input: tc.input, output: tc.output }, null, 2)}
                      aria-label="Copy this tool call"
                    />
                  </div>
                  <Text size="xs" weight="semibold" color="soft">Input:</Text>
                  <Code block className={styles.toolCallCode}>{JSON.stringify(tc.input, null, 2)}</Code>
                  {tc.output && (
                    <>
                      <Text size="xs" weight="semibold" color="soft" style={{ marginTop: 'var(--space-2)' }}>Output:</Text>
                      <Code block className={styles.toolCallCode}>
                        {typeof tc.output === 'string' ? tc.output : JSON.stringify(tc.output, null, 2)}
                      </Code>
                    </>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Raw SDK Events */}
          {rawEvents.length > 0 && (
            <div className={styles.apiCallSection}>
              <div
                className={styles.sectionHeader}
                onClick={(e) => { e.stopPropagation(); setShowRawEvents(!showRawEvents); }}
              >
                <span className={`${styles.expandIcon} ${showRawEvents ? styles.expanded : ''}`}>
                  <ChevronRightIcon size={14} />
                </span>
                <Text size="xs" weight="semibold" color="soft">SDK EVENTS ({rawEvents.length})</Text>
                <CopyButton
                  variant="ghost"
                  getContent={() => JSON.stringify(rawEvents, null, 2)}
                  aria-label="Copy SDK events"
                />
              </div>
              {showRawEvents && (
                <div className={styles.sdkEventsContainer}>
                  {rawEvents.map((event: RawSDKEvent, index: number) => (
                    <div key={index} className={styles.sdkEventRow}>
                      <div className={styles.sdkEventHeader}>
                        <Text size="xs" color="soft" className={styles.sdkEventTime}>
                          {formatTime(event.timestamp)}
                        </Text>
                        <Chip size="sm" variant={getEventChipVariant(event.type)}>{event.type}</Chip>
                        {event.subtype && (
                          <Chip size="sm" variant="default">{event.subtype}</Chip>
                        )}
                      </div>
                      <Code block className={styles.sdkEventData}>
                        {JSON.stringify(event.data, null, 2)}
                      </Code>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats Summary */}
          {diagnostics && (
            <div className={styles.apiCallStats}>
              {model && (
                <div className={styles.statItem}>
                  <Text size="xs" color="soft">Model</Text>
                  <Text size="sm" weight="medium">{model}</Text>
                </div>
              )}
              {duration !== undefined && (
                <div className={styles.statItem}>
                  <Text size="xs" color="soft">Duration</Text>
                  <Text size="sm" weight="medium">{formatDuration(duration)}</Text>
                </div>
              )}
              {inputTokens !== undefined && (
                <div className={styles.statItem}>
                  <Text size="xs" color="soft">Input Tokens</Text>
                  <Text size="sm" weight="medium">{formatTokens(inputTokens)}</Text>
                </div>
              )}
              {outputTokens !== undefined && (
                <div className={styles.statItem}>
                  <Text size="xs" color="soft">Output Tokens</Text>
                  <Text size="sm" weight="medium">{formatTokens(outputTokens)}</Text>
                </div>
              )}
              {cost !== undefined && cost > 0 && (
                <div className={styles.statItem}>
                  <Text size="xs" color="soft">Cost</Text>
                  <Text size="sm" weight="medium">${cost.toFixed(4)}</Text>
                </div>
              )}
              {diagnostics.iterations !== undefined && (
                <div className={styles.statItem}>
                  <Text size="xs" color="soft">Iterations</Text>
                  <Text size="sm" weight="medium">{diagnostics.iterations}</Text>
                </div>
              )}
            </div>
          )}

          {/* Session Info */}
          {diagnostics?.sessionInfo && (
            <div className={styles.apiCallSection}>
              <Text size="xs" weight="semibold" color="soft">SESSION INFO</Text>
              <Card className={styles.apiCallCard}>
                <Text size="xs" color="soft">Session ID: {diagnostics.sessionInfo.sessionId}</Text>
                <Text size="xs" color="soft" style={{ marginTop: 'var(--space-1)' }}>
                  Tools ({diagnostics.sessionInfo.tools.length}): {diagnostics.sessionInfo.tools.join(', ')}
                </Text>
                {diagnostics.sessionInfo.mcpServers.length > 0 && (
                  <Text size="xs" color="soft" style={{ marginTop: 'var(--space-1)' }}>
                    MCP Servers: {diagnostics.sessionInfo.mcpServers.map(s => `${s.name} (${s.status})`).join(', ')}
                  </Text>
                )}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
