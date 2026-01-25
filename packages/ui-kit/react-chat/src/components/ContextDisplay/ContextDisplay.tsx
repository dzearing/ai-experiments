import React from 'react';
import styles from './ContextDisplay.module.css';

/**
 * Category item for context usage breakdown
 */
export interface ContextCategory {
  name: string;
  tokens: number;
  percent: number;
  type: 'used' | 'free' | 'buffer' | 'system';
}

/**
 * Session information
 */
export interface ContextSession {
  sessionId: string;
  model: string;
  messageCount: number;
  inputTokens: number;
  outputTokens: number;
  ideaId?: string;
}

/**
 * Tool/MCP server info
 */
export interface ContextTool {
  name: string;
  tokens: number;
}

/**
 * Data structure for ContextDisplay component
 */
export interface ContextDisplayData {
  model: string;
  maxTokens: number;
  usedTokens: number;
  usedPercent: number;
  freeTokens: number;
  bufferTokens: number;
  bufferPercent: number;
  categories: ContextCategory[];
  session: ContextSession;
  tools?: ContextTool[];
  mcpServers?: ContextTool[];
}

/**
 * Props for the ContextDisplay component
 */
export interface ContextDisplayProps {
  data: ContextDisplayData;
  className?: string;
}

/**
 * Format token count with k suffix for thousands
 */
function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }

  return tokens.toString();
}

/**
 * Get status color indicator based on usage percentage
 */
function getStatusColor(percent: number): 'green' | 'yellow' | 'orange' | 'red' {
  if (percent < 50) return 'green';
  if (percent < 75) return 'yellow';
  if (percent < 90) return 'orange';

  return 'red';
}

/**
 * Generate cell types for the visual grid
 */
function generateCells(usedPercent: number, bufferPercent: number, total = 100): Array<'used' | 'free' | 'buffer'> {
  const usedCells = Math.round((usedPercent / 100) * total);
  const bufferCells = Math.round((bufferPercent / 100) * total);

  const cells: Array<'used' | 'free' | 'buffer'> = [];

  for (let i = 0; i < total; i++) {
    if (i < usedCells) {
      cells.push('used');
    } else if (i < total - bufferCells) {
      cells.push('free');
    } else {
      cells.push('buffer');
    }
  }

  return cells;
}

/**
 * ContextDisplay component
 *
 * Renders a visual display of context window usage similar to Claude Code's /context command.
 * Shows a visual grid, category breakdown, and session details.
 */
export function ContextDisplay({ data, className = '' }: ContextDisplayProps) {
  const cells = generateCells(data.usedPercent, data.bufferPercent);
  const statusColor = getStatusColor(data.usedPercent);
  const remainingPercent = ((data.freeTokens / data.maxTokens) * 100).toFixed(1);

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Header */}
      <div className={styles.headerRow}>
        <h3 className={styles.header}>Context Usage</h3>
        <span className={`${styles.statusIndicator} ${styles[statusColor]}`} />
      </div>

      {/* Main content: grid on left, categories on right */}
      <div className={styles.mainContent}>
        {/* Left: Grid */}
        <div className={styles.grid}>
          {cells.map((type, index) => (
            <span
              key={index}
              className={`${styles.cell} ${styles[type]}`}
              aria-label={type}
            />
          ))}
        </div>

        {/* Right: Categories grid */}
        <div className={styles.categories}>
          {data.categories.map((category, index) => {
            // Use 'system' styling for categories containing "system" in the name
            const dotType = category.name.toLowerCase().includes('system') ? 'system' : category.type;

            return (
              <React.Fragment key={index}>
                <span className={`${styles.categoryTile} ${styles[dotType]}`} />
                <span className={styles.categoryName}>{category.name}</span>
                <span className={styles.categoryValue}>
                  {formatTokens(category.tokens)} ({category.percent.toFixed(1)}%)
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Token summary - spans full width */}
      <span className={styles.tokenSummary}>
        <span className={styles.tokenLabel}>Remaining usable context:</span>{' '}
        {formatTokens(data.freeTokens)} ({remainingPercent}%)
      </span>

      {/* Session Details */}
      <div className={styles.section}>
        <h4 className={styles.sectionHeader}>Session Details</h4>
        <div className={styles.details}>
          <span className={styles.detailLabel}>Model</span>
          <span className={styles.detailValue}>{data.model}</span>
          <span className={styles.detailLabel}>Session ID</span>
          <span className={styles.detailValue}>
            <code>{data.session.sessionId}</code>
          </span>
          <span className={styles.detailLabel}>Message count</span>
          <span className={styles.detailValue}>{data.session.messageCount}</span>
          <span className={styles.detailLabel}>Input tokens</span>
          <span className={styles.detailValue}>{formatTokens(data.session.inputTokens)}</span>
          <span className={styles.detailLabel}>Output tokens</span>
          <span className={styles.detailValue}>{formatTokens(data.session.outputTokens)}</span>
          {data.session.ideaId && (
            <>
              <span className={styles.detailLabel}>Idea ID</span>
              <span className={styles.detailValue}>
                <code>{data.session.ideaId}</code>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Tools (if any) */}
      {data.tools && data.tools.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionHeader}>Available Tools</h4>
          <div className={styles.toolList}>
            {data.tools.slice(0, 10).map((tool, index) => (
              <React.Fragment key={index}>
                <span className={styles.toolName}>{tool.name}</span>
                <span className={styles.toolTokens}>~{tool.tokens} tokens</span>
              </React.Fragment>
            ))}
            {data.tools.length > 10 && (
              <>
                <span className={styles.toolName}>... and {data.tools.length - 10} more</span>
                <span className={styles.toolTokens} />
              </>
            )}
          </div>
        </div>
      )}

      {/* MCP Servers (if any) */}
      {data.mcpServers && data.mcpServers.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionHeader}>MCP Servers</h4>
          <div className={styles.toolList}>
            {data.mcpServers.map((server, index) => (
              <React.Fragment key={index}>
                <span className={styles.toolName}>{server.name}</span>
                <span className={styles.toolTokens}>~{server.tokens} tokens</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Warning if low */}
      {Number(remainingPercent) < 20 && (
        <div className={styles.warning}>
          Context is getting full. Consider using /clear to start fresh.
        </div>
      )}
    </div>
  );
}

export default ContextDisplay;
