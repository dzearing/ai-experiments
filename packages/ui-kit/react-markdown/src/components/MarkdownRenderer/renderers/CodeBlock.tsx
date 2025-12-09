/**
 * CodeBlock component
 *
 * Renders code blocks with syntax highlighting, line numbers,
 * and optional collapse functionality.
 *
 * Surfaces used:
 * - inset (code block background)
 *
 * Tokens used:
 * - --inset-bg, --inset-border, --inset-text
 * - --font-mono
 * - --space-2, --space-3, --space-4
 * - --radius-md
 * - --syntax-* tokens for highlighting
 */

import { useState, useMemo, useCallback } from 'react';
import { highlightCode, type HighlightedLine } from '../../../utils/syntaxHighlighter';
import { isLineInRange } from '../../../utils/deepLinkParser';
import type { DeepLink } from '../../../types/deepLink';
import styles from './CodeBlock.module.css';

export interface CodeBlockProps {
  /** Code content */
  code: string;
  /** Language for syntax highlighting */
  language?: string;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Lines to highlight (1-based) */
  highlightLines?: number[];
  /** Active deep link for highlighting */
  activeDeepLink?: DeepLink | null;
  /** Enable collapsing */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Max height before scroll (in px) */
  maxHeight?: number;
  /** Callback when line is clicked */
  onLineClick?: (lineNumber: number) => void;
  /** Additional class name */
  className?: string;
}

export function CodeBlock({
  code,
  language = '',
  showLineNumbers = true,
  highlightLines = [],
  activeDeepLink,
  collapsible = false,
  defaultCollapsed = false,
  maxHeight,
  onLineClick,
  className,
}: CodeBlockProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Combine explicit highlight lines with deep link range
  const allHighlightLines = useMemo(() => {
    const lines = new Set(highlightLines);

    if (activeDeepLink && (activeDeepLink.type === 'line' || activeDeepLink.type === 'line-range')) {
      const start = activeDeepLink.startLine ?? 0;
      const end = activeDeepLink.endLine ?? start;
      for (let i = start; i <= end; i++) {
        lines.add(i);
      }
    }

    return Array.from(lines);
  }, [highlightLines, activeDeepLink]);

  // Highlight the code
  const highlighted = useMemo(
    () => highlightCode(code, language, allHighlightLines),
    [code, language, allHighlightLines]
  );

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleLineClick = useCallback(
    (lineNumber: number) => {
      onLineClick?.(lineNumber);
    },
    [onLineClick]
  );

  // Determine if we should show collapsed view
  const lineCount = highlighted.lines.length;
  const shouldShowCollapsed = collapsible && isCollapsed && lineCount > 5;
  const visibleLines = shouldShowCollapsed ? highlighted.lines.slice(0, 3) : highlighted.lines;

  return (
    <div
      className={`${styles.codeBlock} ${className || ''}`}
      data-language={highlighted.language}
    >
      {/* Header with language and collapse button */}
      {(language || collapsible) && (
        <div className={styles.header}>
          {language && <span className={styles.language}>{highlighted.language}</span>}
          {collapsible && (
            <button
              className={styles.collapseButton}
              onClick={handleToggleCollapse}
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? 'Expand code' : 'Collapse code'}
            >
              {isCollapsed ? '▶' : '▼'}
            </button>
          )}
        </div>
      )}

      {/* Code content */}
      <div
        className={styles.codeContent}
        style={{ maxHeight: maxHeight ? `${maxHeight}px` : undefined }}
      >
        <pre className={styles.pre}>
          <code className={styles.code}>
            {visibleLines.map((line) => (
              <CodeLine
                key={line.lineNumber}
                line={line}
                showLineNumber={showLineNumbers}
                isHighlighted={line.highlighted || isLineInRange(line.lineNumber, activeDeepLink ?? null)}
                onClick={() => handleLineClick(line.lineNumber)}
              />
            ))}
            {shouldShowCollapsed && (
              <div className={styles.collapsedIndicator}>
                <button onClick={handleToggleCollapse} className={styles.expandButton}>
                  ... {lineCount - 3} more lines
                </button>
              </div>
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}

interface CodeLineProps {
  line: HighlightedLine;
  showLineNumber: boolean;
  isHighlighted: boolean;
  onClick: () => void;
}

function CodeLine({ line, showLineNumber, isHighlighted, onClick }: CodeLineProps) {
  return (
    <div
      className={`${styles.line} ${isHighlighted ? styles.highlighted : ''}`}
      data-line={line.lineNumber}
      onClick={onClick}
    >
      {showLineNumber && (
        <span className={styles.lineNumber} aria-hidden="true">
          {line.lineNumber}
        </span>
      )}
      <span className={styles.lineContent}>
        {line.tokens.length > 0 ? (
          line.tokens.map((token, index) => (
            <span key={index} className={token.className}>
              {token.content}
            </span>
          ))
        ) : (
          // Empty line - render a non-breaking space to maintain height
          '\u00A0'
        )}
      </span>
    </div>
  );
}

export default CodeBlock;
