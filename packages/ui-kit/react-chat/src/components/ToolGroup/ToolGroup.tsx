import { useState, memo, type ReactNode } from 'react';
import { Chip, Spinner } from '@ui-kit/react';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { ChevronUpIcon } from '@ui-kit/icons/ChevronUpIcon';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { XCircleIcon } from '@ui-kit/icons/XCircleIcon';
import styles from './ToolGroup.module.css';

// =============================================================================
// TYPES
// =============================================================================

export type ToolStatus = 'running' | 'complete' | 'error';

export interface SummarySegment {
  /** The text content of this segment */
  text: string;
  /** Whether this is a label (soft) or value (bold) */
  type: 'label' | 'value';
}

export interface ToolCall {
  /** Unique identifier for the tool call */
  id: string;
  /** Name of the tool (e.g., 'Grep', 'Read', 'Bash') */
  name: string;
  /** Icon to display for this tool (optional - shows default based on status if not provided) */
  icon?: ReactNode;
  /** Summary segments for the tool call description (use this OR description) */
  summary?: SummarySegment[];
  /** Pre-formatted description as ReactNode (use this OR summary) */
  description?: ReactNode;
  /** Current status of the tool call */
  status: ToolStatus;
  /** Output from the tool call (shown when expanded) */
  output?: string;
  /** Duration in milliseconds (shown as timing info) */
  duration?: number;
}

export interface ToolGroupProps {
  /** Array of tool calls to display in this group */
  tools: ToolCall[];
  /** Whether the group should start expanded */
  initialExpanded?: boolean;
  /** Callback when the group expansion state changes */
  onExpandChange?: (expanded: boolean) => void;
  /** Callback when a tool's expansion state changes */
  onToolExpandChange?: (toolId: string, expanded: boolean) => void;
  /** Additional class name */
  className?: string;
}

export interface ToolItemProps {
  /** The tool call to display */
  tool: ToolCall;
  /** Whether this tool's output is expanded */
  isExpanded: boolean;
  /** Callback when the tool is clicked */
  onToggle: () => void;
  /** Whether to show the output section */
  showOutput?: boolean;
  /** Whether to render as interactive button (default: true). Set false when nested in another button. */
  interactive?: boolean;
}

// =============================================================================
// TOOL ITEM COMPONENT
// =============================================================================

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
  return `(${(ms / 1000).toFixed(1)}s)`;
}

/**
 * Individual tool item within a group.
 * Displays tool status, icon, summary, and expandable output.
 */
export const ToolItem = memo(function ToolItem({
  tool,
  isExpanded,
  onToggle,
  showOutput = true,
  interactive = true,
}: ToolItemProps) {
  const hasOutput = showOutput && tool.output;

  // Render the description - supports both summary segments and pre-formatted description
  const renderDescription = () => {
    if (tool.description) {
      return tool.description;
    }

    if (tool.summary) {
      return tool.summary.map((segment, i) => (
        <span
          key={i}
          className={
            segment.type === 'label' ? styles.toolLabel : styles.toolValue
          }
        >
          {segment.text}
        </span>
      ));
    }

    // Fallback to tool name
    return tool.name;
  };

  const headerContent = (
    <>
      <span className={styles.toolStatus}>
        {tool.status === 'running' && <Spinner size="sm" inherit />}
        {tool.status === 'complete' && (
          <CheckCircleIcon className={styles.successIcon} />
        )}
        {tool.status === 'error' && (
          <XCircleIcon className={styles.errorIcon} />
        )}
      </span>
      {tool.icon && <span className={styles.toolIcon}>{tool.icon}</span>}
      <span className={styles.toolSummary}>
        {renderDescription()}
      </span>
      {tool.duration !== undefined && tool.status !== 'running' && (
        <span className={styles.toolDuration}>
          {formatDuration(tool.duration)}
        </span>
      )}
      {hasOutput && interactive && (
        <span className={styles.toolChevron}>
          {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </span>
      )}
    </>
  );

  return (
    <div className={styles.toolItem}>
      {interactive ? (
        <button
          className={styles.toolItemHeader}
          onClick={onToggle}
          aria-expanded={hasOutput ? isExpanded : undefined}
        >
          {headerContent}
        </button>
      ) : (
        <div className={styles.toolItemHeader}>
          {headerContent}
        </div>
      )}
      {isExpanded && hasOutput && (
        <div className={styles.toolOutput}>
          <pre>{tool.output}</pre>
        </div>
      )}
    </div>
  );
});

ToolItem.displayName = 'ToolItem';

// =============================================================================
// TOOL GROUP COMPONENT
// =============================================================================

/**
 * ToolGroup component
 *
 * Groups consecutive tool calls together with a collapsible interface.
 * Shows the active tool when collapsed, with a badge indicating total count.
 *
 * ## Features
 * - Collapsed state shows only the active/last tool
 * - Badge shows total tool count
 * - Expandable to see all tools
 * - Each tool can show its output when clicked
 * - Hover highlights entire row
 *
 * ## Tool States
 * - Running: Spinner animation
 * - Complete: Green checkmark
 * - Error: Red X
 */
export const ToolGroup = memo(function ToolGroup({
  tools,
  initialExpanded = false,
  onExpandChange,
  onToolExpandChange,
  className,
}: ToolGroupProps) {
  const [isGroupExpanded, setIsGroupExpanded] = useState(initialExpanded);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  const activeTool = tools[tools.length - 1];
  const hasMultipleTools = tools.length > 1;
  const allComplete = tools.every((t) => t.status !== 'running');

  const handleGroupExpand = (expanded: boolean) => {
    setIsGroupExpanded(expanded);
    onExpandChange?.(expanded);
  };

  const toggleTool = (id: string) => {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      const newState = !next.has(id);

      if (newState) {
        next.add(id);
      } else {
        next.delete(id);
      }

      onToolExpandChange?.(id, newState);

      return next;
    });
  };

  const containerClassName = className
    ? `${styles.toolGroup} ${className}`
    : styles.toolGroup;

  return (
    <div className={containerClassName}>
      {!isGroupExpanded ? (
        // Collapsed state - show only active tool
        <div className={styles.toolGroupCollapsed}>
          <button
            className={styles.toolGroupHeader}
            onClick={() => handleGroupExpand(true)}
            aria-label={
              hasMultipleTools
                ? `Expand to see all ${tools.length} tools`
                : `Expand ${activeTool.name} details`
            }
          >
            <ToolItem
              tool={activeTool}
              isExpanded={false}
              onToggle={() => {}}
              showOutput={false}
              interactive={false}
            />
            <span className={styles.toolGroupExpandBtn}>
              {hasMultipleTools && (
                <Chip size="sm" variant={allComplete ? 'success' : 'info'}>
                  {tools.length} tools
                </Chip>
              )}
              <ChevronDownIcon className={styles.groupChevron} />
            </span>
          </button>
        </div>
      ) : (
        // Expanded state - show all tools
        <div className={styles.toolGroupExpanded}>
          <button
            className={styles.toolGroupCollapseBtn}
            onClick={() => handleGroupExpand(false)}
          >
            <Chip size="sm" variant={allComplete ? 'success' : 'info'}>
              {tools.length} tools
            </Chip>
            <ChevronUpIcon className={styles.groupChevron} />
          </button>
          <div className={styles.toolList}>
            {tools.map((tool) => (
              <ToolItem
                key={tool.id}
                tool={tool}
                isExpanded={expandedTools.has(tool.id)}
                onToggle={() => toggleTool(tool.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

ToolGroup.displayName = 'ToolGroup';

export default ToolGroup;
