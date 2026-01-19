/**
 * ClickablePath component - renders file paths as clickable buttons.
 * Used by FileListResult and SearchResultsDisplay for interactive file navigation.
 */

/**
 * Props for the ClickablePath component.
 */
export interface ClickablePathProps {
  /** File path to display */
  path: string;
  /** Optional line number to display and pass to click handler */
  lineNumber?: number;
  /** Callback when the path is clicked */
  onClick: (path: string, line?: number) => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * Renders a file path as a clickable button with optional line number.
 *
 * Display format: `path` or `path:lineNumber` when line provided.
 * Styled with underline on hover, cursor pointer, using design tokens.
 */
export function ClickablePath({
  path,
  lineNumber,
  onClick,
  className = '',
}: ClickablePathProps) {
  const handleClick = () => {
    onClick(path, lineNumber);
  };

  const displayText = lineNumber !== undefined ? `${path}:${lineNumber}` : path;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        margin: 0,
        font: 'inherit',
        color: 'var(--color-body-link)',
        cursor: 'pointer',
        textDecoration: 'none',
        textAlign: 'left',
        wordBreak: 'break-word',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.textDecoration = 'underline';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.textDecoration = 'none';
      }}
    >
      {displayText}
    </button>
  );
}

export default ClickablePath;
