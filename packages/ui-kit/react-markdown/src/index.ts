/**
 * @ui-kit/react-markdown
 *
 * Markdown renderer and editor components for React.
 * Built on react-markdown and Prism.js.
 */

// Components
export { MarkdownRenderer, type MarkdownRendererProps } from './components/MarkdownRenderer';
export { CodeBlock, type CodeBlockProps } from './components/MarkdownRenderer/renderers/CodeBlock';
export { Heading, type HeadingProps } from './components/MarkdownRenderer/renderers/Heading';
export { Link, type LinkProps } from './components/MarkdownRenderer/renderers/Link';

export { MarkdownEditor, type MarkdownEditorProps, type MarkdownEditorRef, type CoAuthor } from './components/MarkdownEditor';

export {
  MarkdownCoEditor,
  type MarkdownCoEditorProps,
  type MarkdownCoEditorRef,
  type ViewMode,
} from './components/MarkdownCoEditor';

// Hooks
export { useStreamingMarkdown, type StreamingOptions, type StreamingState } from './hooks/useStreamingMarkdown';
export { useDeepLink, type UseDeepLinkReturn } from './hooks/useDeepLink';

// Utilities
export {
  parseDeepLink,
  createDeepLink,
  slugify,
  parseCurrentHash,
  setUrlHash,
  navigateToHash,
  isLineInRange,
} from './utils/deepLinkParser';

export {
  highlightCode,
  highlightToHtml,
  isLanguageSupported,
  SUPPORTED_LANGUAGES,
  type Token,
  type HighlightedLine,
  type HighlightResult,
  type SyntaxTheme,
  type SupportedLanguage,
} from './utils/syntaxHighlighter';

// Types
export type {
  DeepLink,
  DeepLinkType,
  DeepLinkOptions,
  DeepLinkState,
} from './types/deepLink';
