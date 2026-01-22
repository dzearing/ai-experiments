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

import { useMemo, useCallback, useState, type ComponentType } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Chip, Tooltip, ImagePreview } from '@ui-kit/react';
import { parseDeepLink, navigateToHash } from '../../utils/deepLinkParser';
import { useStreamingMarkdown } from '../../hooks/useStreamingMarkdown';
import { useDeepLink } from '../../hooks/useDeepLink';
import { CodeBlock, type CodeBlockProps } from './renderers/CodeBlock';
import { Heading, type HeadingProps } from './renderers/Heading';
import { Link, type LinkProps } from './renderers/Link';
import { Table, TableHead, TableBody, TableRow, TableCell } from './renderers/Table';
import type { DeepLink } from '../../types/deepLink';
import styles from './MarkdownRenderer.module.css';

/**
 * Preprocess markdown content to convert Thing references to HTML spans
 * that can be rendered as Thing chips.
 *
 * Supported formats:
 * - ^[DisplayName](id:uuid) - new format with embedded ID
 * - ^ThingName or ^{Thing Name With Spaces} - legacy format
 */
function preprocessTopicReferences(content: string): string {
  // First, handle new format: ^[DisplayName](id:uuid)
  let processed = content.replace(
    /\^\[([^\]]+)\]\(id:([^)]+)\)/g,
    (_match, displayName, id) => {
      // Escape HTML special characters in the name
      const escapedName = displayName
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      return `<span data-thing-chip data-name="${escapedName}" data-id="${id}">^${escapedName}</span>`;
    }
  );

  // Then handle legacy format: ^{name with spaces} or ^simple-name or ^@scoped/package-name
  // The pattern handles:
  // - ^word (simple names)
  // - ^word-with-dashes
  // - ^@scoped/package (npm-style scoped packages)
  // - ^{words with spaces} (names in braces)
  processed = processed.replace(
    /\^(\{[^}]+\}|@[\w-]+\/[\w-]+|[\w@/.-]+)/g,
    (_match, name) => {
      // Remove braces if present
      const thingName = name.startsWith('{') && name.endsWith('}')
        ? name.slice(1, -1)
        : name;

      // Escape HTML special characters in the name
      const escapedName = thingName
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      return `<span data-thing-chip data-name="${escapedName}">^${escapedName}</span>`;
    }
  );

  return processed;
}

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
  /** Author name for image preview captions */
  imageAuthor?: string;
  /** Timestamp for image preview captions */
  imageTimestamp?: Date | number | string;
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
  imageAuthor,
  imageTimestamp,
  className,
}: MarkdownRendererProps) {
  // State for image preview
  const [previewImage, setPreviewImage] = useState<{ src: string; name: string } | null>(null);

  // Handle streaming
  const {
    displayContent: rawDisplayContent,
    isStreaming,
  } = useStreamingMarkdown(content, streaming, {
    speed: streamingSpeed,
    onComplete: onStreamComplete,
  });

  // Preprocess content to convert ^ThingName syntax to HTML spans
  const displayContent = useMemo(
    () => preprocessTopicReferences(rawDisplayContent),
    [rawDisplayContent]
  );

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
    // Only update URL hash if deep links are enabled
    if (enableDeepLinks) {
      const link: DeepLink = {
        type: 'line',
        hash: `L${lineNumber}`,
        startLine: lineNumber,
        endLine: lineNumber,
      };
      navigateToHash(link);
    }
    onDeepLinkClick?.(`#L${lineNumber}`);
  }, [enableDeepLinks, onDeepLinkClick]);

  // Handle heading click
  const handleHeadingClick = useCallback((slug: string) => {
    // Only update URL hash if deep links are enabled
    if (enableDeepLinks) {
      const link: DeepLink = {
        type: 'heading',
        hash: slug,
        slug,
      };
      navigateToHash(link);
    }
    onDeepLinkClick?.(`#${slug}`);
  }, [enableDeepLinks, onDeepLinkClick]);

  // Handle internal link click
  const handleInternalLinkClick = useCallback((href: string) => {
    if (href.startsWith('#')) {
      // If there's a callback, let it handle the link (e.g., #resolve action links)
      // Don't navigate/scroll - the callback decides what to do
      if (onDeepLinkClick) {
        onDeepLinkClick(href);
        return;
      }

      // No callback - try to scroll to deep link if it's a valid format
      const hash = href.slice(1);
      const link = parseDeepLink(hash);
      if (link) {
        scrollToLink(link);
      }
    }
  }, [scrollToLink, onDeepLinkClick]);

  // Create markdown component overrides
  const markdownComponents = useMemo(() => ({
    // In react-markdown v9+, code blocks are rendered as <pre><code>...</code></pre>
    // Inline code is rendered as just <code>...</code>
    // We handle code blocks in the 'pre' component and inline code in the 'code' component

    // Pre wrapper for code blocks
    pre: ({ children }: any) => {
      // The children is a code element with the actual code content
      // Extract code element props
      const codeElement = children?.props;
      if (!codeElement) {
        return <pre>{children}</pre>;
      }

      const { className: codeClassName, children: codeChildren } = codeElement;

      // Extract language from className (e.g., "language-typescript")
      const match = /language-(\w+)/.exec(codeClassName || '');
      const language = match ? match[1] : '';

      // Get the code content
      const code = String(codeChildren).replace(/\n$/, '');
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

    // Inline code only (code blocks are handled by 'pre')
    code: ({ children, ...props }: any) => {
      return (
        <code className={styles.inlineCode} {...props}>
          {children}
        </code>
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
          showAnchor={enableDeepLinks}
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
          showAnchor={enableDeepLinks}
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
          showAnchor={enableDeepLinks}
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
          showAnchor={enableDeepLinks}
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
          showAnchor={enableDeepLinks}
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
          showAnchor={enableDeepLinks}
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
    u: ({ children }: any) => <u className={styles.underline}>{children}</u>,

    // Custom span handler for image chips
    span: (spanProps: any) => {
      const { node, children, ...props } = spanProps;

      // Check if this is an image chip (data-image-chip attribute exists)
      // In rehype/hast, data attributes are camelCased in node.properties
      // In the rendered props, they may be passed differently
      const nodeProps = node?.properties || {};
      const hasImageChip = 'dataImageChip' in nodeProps ||
        'data-image-chip' in props ||
        props['dataImageChip'] !== undefined;

      if (hasImageChip) {
        const name = nodeProps['dataName'] || props['data-name'] || props['dataName'] || children;
        const thumbnailUrl = nodeProps['dataThumbnailUrl'] || props['data-thumbnail-url'] || props['dataThumbnailUrl'];

        if (thumbnailUrl) {
          return (
            <Tooltip
              content={
                <img
                  src={thumbnailUrl}
                  alt={String(name)}
                  className={styles.imageChipPreview}
                />
              }
              position="top"
              multiline
            >
              <button
                type="button"
                className={styles.imageChipWrapper}
                onClick={() => setPreviewImage({ src: thumbnailUrl, name: String(name) })}
                aria-label={`Preview ${name}`}
              >
                <Chip size="sm">
                  {name}
                </Chip>
              </button>
            </Tooltip>
          );
        }

        return (
          <Chip size="sm">
            {name}
          </Chip>
        );
      }

      // Check if this is a thing chip (data-thing-chip attribute exists)
      const hasThingChip = 'dataThingChip' in nodeProps ||
        'data-thing-chip' in props ||
        props['dataThingChip'] !== undefined;

      if (hasThingChip) {
        const name = nodeProps['dataName'] || props['data-name'] || props['dataName'] || children;
        const thingType = nodeProps['dataType'] || props['data-type'] || props['dataType'] || 'item';

        // Map thing type to chip variant
        const getThingVariant = (type: string): 'primary' | 'success' | 'warning' | 'info' => {
          switch (type) {
            case 'category': return 'primary';
            case 'project': return 'success';
            case 'feature': return 'warning';
            default: return 'info';
          }
        };

        return (
          <Chip size="sm" variant={getThingVariant(thingType)}>
            ^{name}
          </Chip>
        );
      }

      // Default span rendering
      return <span {...props}>{children}</span>;
    },
  }), [
    customComponents,
    showLineNumbers,
    collapsibleCodeBlocks,
    effectiveActiveLink,
    enableDeepLinks,
    handleLineClick,
    handleHeadingClick,
    handleInternalLinkClick,
    setPreviewImage,
  ]);

  return (
    <>
      <div className={`${styles.markdown} ${className || ''}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={markdownComponents}
        >
          {displayContent}
        </ReactMarkdown>

        {/* Streaming cursor */}
        {isStreaming && <span className={styles.streamingCursor} aria-hidden="true" />}
      </div>

      {/* Image preview */}
      <ImagePreview
        open={previewImage !== null}
        onClose={() => setPreviewImage(null)}
        src={previewImage?.src || ''}
        name={previewImage?.name}
        username={imageAuthor}
        timestamp={imageTimestamp}
      />
    </>
  );
}

export default MarkdownRenderer;
