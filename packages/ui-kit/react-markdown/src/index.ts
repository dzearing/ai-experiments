/**
 * @ui-kit/react-markdown
 *
 * Markdown renderer and editor components for React.
 * Built on TipTap, react-markdown, and Prism.js.
 */

// Components
export { MarkdownRenderer, type MarkdownRendererProps } from './components/MarkdownRenderer';
export { CodeBlock, type CodeBlockProps } from './components/MarkdownRenderer/renderers/CodeBlock';
export { Heading, type HeadingProps } from './components/MarkdownRenderer/renderers/Heading';
export { Link, type LinkProps } from './components/MarkdownRenderer/renderers/Link';

export { MarkdownEditor, type MarkdownEditorProps, type MarkdownEditorRef } from './components/MarkdownEditor';
export { useMarkdownEditor, type UseMarkdownEditorOptions } from './components/MarkdownEditor/useMarkdownEditor';

export { MarkdownToolbar, type MarkdownToolbarProps } from './components/MarkdownToolbar';

export {
  CollaborativeEditor,
  type CollaborativeEditorProps,
  type CollaborativeEditorRef,
} from './components/CollaborativeEditor';

export {
  MarkdownCoEditor,
  type MarkdownCoEditorProps,
  type MarkdownCoEditorRef,
} from './components/MarkdownCoEditor';

export { CollaboratorCursor, type CollaboratorCursorProps } from './components/CollaboratorCursor';

// Hooks
export { useStreamingMarkdown, type StreamingOptions, type StreamingState } from './hooks/useStreamingMarkdown';
export { useDeepLink, type UseDeepLinkReturn } from './hooks/useDeepLink';
export { useAIEdits, type UseAIEditsReturn } from './hooks/useAIEdits';
export { useCollaborators } from './hooks/useCollaborators';

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

export type {
  AIEdit,
  AIEditType,
  AIEditTarget,
  AIEditState,
  EditBatch,
  EditConflict,
  ConflictReport,
} from './types/aiEdit';

export type {
  SelectionRange,
  LineNumberState,
  EditorState,
  ToolbarItem,
  ToolbarConfig,
  ToolbarButton,
} from './types/editor';

export type {
  Collaborator,
  CollaboratorStatus,
  CollaboratorCursor as CollaboratorCursorType,
  CollaboratorEdit,
  StreamingEdit,
  CollaboratorState,
  UseCollaboratorsOptions,
  UseCollaboratorsReturn,
} from './types/collaborator';

export { COLLABORATOR_COLORS, getCollaboratorColor } from './types/collaborator';
