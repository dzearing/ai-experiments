export {
  parseDeepLink,
  createDeepLink,
  slugify,
  parseCurrentHash,
  setUrlHash,
  navigateToHash,
  isLineInRange,
} from './deepLinkParser';

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
} from './syntaxHighlighter';
