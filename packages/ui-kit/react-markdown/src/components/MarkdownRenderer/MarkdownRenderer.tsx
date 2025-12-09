/**
 * MarkdownRenderer component
 *
 * Renders markdown content with syntax highlighting, streaming support,
 * and deep-linking capabilities.
 *
 * Surfaces used:
 * - page (content background)
 * - inset (code blocks)
 *
 * Tokens used:
 * - --page-text, --page-link
 * - --font-sans, --font-mono
 * - --space-*, --radius-*
 * - --syntax-* tokens for code highlighting
 */

import { useMemo, useCallback, type ComponentType } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseDeepLink, navigateToHash } from '../../utils/deepLinkParser';
import { useStreamingMarkdown } from '../../hooks/useStreamingMarkdown';
import { useDeepLink } from '../../hooks/useDeepLink';
import { CodeBlock, type CodeBlockProps } from './renderers/CodeBlock';
import { Heading, type HeadingProps } from './renderers/Heading';
import { Link, type LinkProps } from './renderers/Link';
import { Table, TableHead, TableBody, TableRow, TableCell } from './renderers/Table';
import type { DeepLink } from '../../types/deepLink';
import styles from './MarkdownRenderer.module.css';

export interface MarkdownRendererProps {
  /** Markdown content to render */
  content: string;
  /** Enable streaming mode for AI responses */
  streaming?: boolean;
  /** Streaming speed (characters per frame) */
  streamingSpeed?: number;
  /** Streaming completion callback */
  onStreamComplete?: () => void;
  /** Enable deep linking (hash-based navigation) */
  enableDeepLinks?: boolean;
  /** Active deep link (e.g., "#L10-L20" or "#heading-slug") */
  activeDeepLink?: string;
  /** Callback when deep link is clicked */
  onDeepLinkClick?: (link: string) => void;
  /** Show line numbers in code blocks */
  showLineNumbers?: boolean;
  /** Enable code block collapsing */
  collapsibleCodeBlocks?: boolean;
  /** Custom component renderers */
  components?: {
    code?: ComponentType<CodeBlockProps>;
    heading?: ComponentType<HeadingProps>;
    link?: ComponentType<LinkProps>;
  };
  /** Additional class name */
  className?: string;
}

export function MarkdownRenderer({
  content,
  streaming = false,
  streamingSpeed = 3,
  onStreamComplete,
  enableDeepLinks = true,
  activeDeepLink: activeDeepLinkProp,
  onDeepLinkClick,
  showLineNumbers = true,
  collapsibleCodeBlocks = false,
  components: customComponents,
  className,
}: MarkdownRendererProps) {
  // Handle streaming
  const {
    displayContent,
    isStreaming,
  } = useStreamingMarkdown(content, streaming, {
    speed: streamingSpeed,
    onComplete: onStreamComplete,
  });

  // Handle deep linking
  const {
    activeLink,
    scrollToLink,
  } = useDeepLink(enableDeepLinks);

  // Parse prop-based deep link
  const parsedDeepLink = useMemo(() => {
    if (activeDeepLinkProp) {
      const hash = activeDeepLinkProp.startsWith('#')
        ? activeDeepLinkProp.slice(1)
        : activeDeepLinkProp;
      return parseDeepLink(hash);
    }
    return null;
  }, [activeDeepLinkProp]);

  // Use prop-based or URL-based active link
  const effectiveActiveLink = parsedDeepLink || activeLink;

  // Handle line click in code blocks
  const handleLineClick = useCallback((lineNumber: number) => {
    const link: DeepLink = {
      type: 'line',
      hash: `L${lineNumber}`,
      startLine: lineNumber,
      endLine: lineNumber,
    };
    navigateToHash(link);
    onDeepLinkClick?.(`#L${lineNumber}`);
  }, [onDeepLinkClick]);

  // Handle heading click
  const handleHeadingClick = useCallback((slug: string) => {
    const link: DeepLink = {
      type: 'heading',
      hash: slug,
      slug,
    };
    navigateToHash(link);
    onDeepLinkClick?.(`#${slug}`);
  }, [onDeepLinkClick]);

  // Handle internal link click
  const handleInternalLinkClick = useCallback((href: string) => {
    if (href.startsWith('#')) {
      const hash = href.slice(1);
      const link = parseDeepLink(hash);
      if (link) {
        scrollToLink(link);
        onDeepLinkClick?.(href);
      }
    }
  }, [scrollToLink, onDeepLinkClick]);

  // Create markdown component overrides
  const markdownComponents = useMemo(() => ({
    // Code blocks
    code: ({ node, inline, className: codeClassName, children, ...props }: any) => {
      // Extract language from className (e.g., "language-typescript")
      const match = /language-(\w+)/.exec(codeClassName || '');
      const language = match ? match[1] : '';

      // Inline code
      if (inline) {
        return (
          <code className={styles.inlineCode} {...props}>
            {children}
          </code>
        );
      }

      // Code block
      const code = String(children).replace(/\n$/, '');
      const CodeComponent = customComponents?.code || CodeBlock;

      return (
        <CodeComponent
          code={code}
          language={language}
          showLineNumbers={showLineNumbers}
          activeDeepLink={effectiveActiveLink}
          collapsible={collapsibleCodeBlocks}
          onLineClick={handleLineClick}
        />
      );
    },

    // Headings
    h1: ({ children }: any) => {
      const HeadingComponent = customComponents?.heading || Heading;
      return (
        <HeadingComponent
          level={1}
          activeDeepLink={effectiveActiveLink}
          onHeadingClick={handleHeadingClick}
        >
          {children}
        </HeadingComponent>
      );
    },
    h2: ({ children }: any) => {
      const HeadingComponent = customComponents?.heading || Heading;
      return (
        <HeadingComponent
          level={2}
          activeDeepLink={effectiveActiveLink}
          onHeadingClick={handleHeadingClick}
        >
          {children}
        </HeadingComponent>
      );
    },
    h3: ({ children }: any) => {
      const HeadingComponent = customComponents?.heading || Heading;
      return (
        <HeadingComponent
          level={3}
          activeDeepLink={effectiveActiveLink}
          onHeadingClick={handleHeadingClick}
        >
          {children}
        </HeadingComponent>
      );
    },
    h4: ({ children }: any) => {
      const HeadingComponent = customComponents?.heading || Heading;
      return (
        <HeadingComponent
          level={4}
          activeDeepLink={effectiveActiveLink}
          onHeadingClick={handleHeadingClick}
        >
          {children}
        </HeadingComponent>
      );
    },
    h5: ({ children }: any) => {
      const HeadingComponent = customComponents?.heading || Heading;
      return (
        <HeadingComponent
          level={5}
          activeDeepLink={effectiveActiveLink}
          onHeadingClick={handleHeadingClick}
        >
          {children}
        </HeadingComponent>
      );
    },
    h6: ({ children }: any) => {
      const HeadingComponent = customComponents?.heading || Heading;
      return (
        <HeadingComponent
          level={6}
          activeDeepLink={effectiveActiveLink}
          onHeadingClick={handleHeadingClick}
        >
          {children}
        </HeadingComponent>
      );
    },

    // Links
    a: ({ href, children, title }: any) => {
      const LinkComponent = customComponents?.link || Link;
      return (
        <LinkComponent
          href={href || ''}
          title={title}
          onInternalLinkClick={handleInternalLinkClick}
        >
          {children}
        </LinkComponent>
      );
    },

    // Tables
    table: ({ children }: any) => <Table>{children}</Table>,
    thead: ({ children }: any) => <TableHead>{children}</TableHead>,
    tbody: ({ children }: any) => <TableBody>{children}</TableBody>,
    tr: ({ children }: any) => <TableRow>{children}</TableRow>,
    th: ({ children, style }: any) => (
      <TableCell isHeader align={style?.textAlign}>
        {children}
      </TableCell>
    ),
    td: ({ children, style }: any) => (
      <TableCell align={style?.textAlign}>{children}</TableCell>
    ),

    // Lists
    ul: ({ children }: any) => <ul className={styles.list}>{children}</ul>,
    ol: ({ children }: any) => <ol className={styles.orderedList}>{children}</ol>,
    li: ({ children }: any) => <li className={styles.listItem}>{children}</li>,

    // Other elements
    p: ({ children }: any) => <p className={styles.paragraph}>{children}</p>,
    blockquote: ({ children }: any) => (
      <blockquote className={styles.blockquote}>{children}</blockquote>
    ),
    hr: () => <hr className={styles.divider} />,
    img: ({ src, alt, title }: any) => (
      <img src={src} alt={alt} title={title} className={styles.image} />
    ),
    strong: ({ children }: any) => <strong className={styles.strong}>{children}</strong>,
    em: ({ children }: any) => <em className={styles.emphasis}>{children}</em>,
    del: ({ children }: any) => <del className={styles.strikethrough}>{children}</del>,
  }), [
    customComponents,
    showLineNumbers,
    collapsibleCodeBlocks,
    effectiveActiveLink,
    handleLineClick,
    handleHeadingClick,
    handleInternalLinkClick,
  ]);

  return (
    <div className={`${styles.markdown} ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {displayContent}
      </ReactMarkdown>

      {/* Streaming cursor */}
      {isStreaming && <span className={styles.streamingCursor} aria-hidden="true" />}
    </div>
  );
}

export default MarkdownRenderer;
