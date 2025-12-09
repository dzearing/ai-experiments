/**
 * Syntax highlighting utilities using Prism.js
 *
 * Provides VS Code-like syntax highlighting with support for
 * multiple languages and custom themes.
 */

import Prism from 'prismjs';

// Import common languages - these are bundled with Prism
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-graphql';

export type SyntaxTheme = 'vs-code-light' | 'vs-code-dark' | 'github';

export interface Token {
  /** Token type from Prism */
  type: string;
  /** Token content */
  content: string;
  /** CSS class name for styling */
  className: string;
}

export interface HighlightedLine {
  /** Line number (1-based) */
  lineNumber: number;
  /** Tokens in this line */
  tokens: Token[];
  /** Whether this line should be highlighted */
  highlighted: boolean;
}

export interface HighlightResult {
  /** Highlighted lines */
  lines: HighlightedLine[];
  /** Detected or specified language */
  language: string;
}

// Language aliases for common variations
const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  rb: 'ruby',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  dockerfile: 'docker',
  cs: 'csharp',
  'c++': 'cpp',
  'c#': 'csharp',
};

/**
 * Normalize a language name to Prism's expected format
 */
function normalizeLanguage(lang: string): string {
  const lower = lang.toLowerCase().trim();
  return LANGUAGE_ALIASES[lower] || lower;
}

/**
 * Check if a language is supported by Prism
 */
export function isLanguageSupported(language: string): boolean {
  const normalized = normalizeLanguage(language);
  return normalized in Prism.languages;
}

/**
 * Get the Prism grammar for a language
 */
function getGrammar(language: string): Prism.Grammar | undefined {
  const normalized = normalizeLanguage(language);
  return Prism.languages[normalized];
}

/**
 * Convert Prism tokens to our Token format
 */
function convertTokens(
  tokens: (string | Prism.Token)[],
  parentType?: string
): Token[] {
  const result: Token[] = [];

  for (const token of tokens) {
    if (typeof token === 'string') {
      // Plain text token
      if (token) {
        result.push({
          type: parentType || 'plain',
          content: token,
          className: parentType ? `token ${parentType}` : 'token',
        });
      }
    } else {
      // Prism Token object
      const type = Array.isArray(token.type) ? token.type.join(' ') : token.type;
      const className = `token ${type}${token.alias ? ` ${Array.isArray(token.alias) ? token.alias.join(' ') : token.alias}` : ''}`;

      if (Array.isArray(token.content)) {
        // Nested tokens
        result.push(...convertTokens(token.content as (string | Prism.Token)[], type));
      } else if (typeof token.content === 'string') {
        result.push({
          type,
          content: token.content,
          className,
        });
      }
    }
  }

  return result;
}

/**
 * Highlight code and return structured result
 */
export function highlightCode(
  code: string,
  language: string,
  highlightLines: number[] = []
): HighlightResult {
  const normalizedLang = normalizeLanguage(language);
  const grammar = getGrammar(normalizedLang);

  // Split code into lines
  const codeLines = code.split('\n');
  const highlightSet = new Set(highlightLines);

  // If no grammar, return plain text
  if (!grammar) {
    return {
      lines: codeLines.map((line, index) => ({
        lineNumber: index + 1,
        tokens: [{ type: 'plain', content: line, className: 'token' }],
        highlighted: highlightSet.has(index + 1),
      })),
      language: normalizedLang,
    };
  }

  // Tokenize the entire code block
  const tokens = Prism.tokenize(code, grammar);

  // Convert to our token format and split by lines
  const allTokens = convertTokens(tokens);

  // Group tokens by line
  const lines: HighlightedLine[] = [];
  let currentLine: Token[] = [];
  let lineNumber = 1;

  for (const token of allTokens) {
    // Check if token contains newlines
    if (token.content.includes('\n')) {
      const parts = token.content.split('\n');

      for (let i = 0; i < parts.length; i++) {
        if (i > 0) {
          // Push current line and start new one
          lines.push({
            lineNumber,
            tokens: currentLine,
            highlighted: highlightSet.has(lineNumber),
          });
          lineNumber++;
          currentLine = [];
        }

        if (parts[i]) {
          currentLine.push({
            ...token,
            content: parts[i],
          });
        }
      }
    } else if (token.content) {
      currentLine.push(token);
    }
  }

  // Push last line
  if (currentLine.length > 0 || lines.length < codeLines.length) {
    lines.push({
      lineNumber,
      tokens: currentLine,
      highlighted: highlightSet.has(lineNumber),
    });
  }

  return {
    lines,
    language: normalizedLang,
  };
}

/**
 * Get highlighted HTML string (for simple use cases)
 */
export function highlightToHtml(code: string, language: string): string {
  const normalizedLang = normalizeLanguage(language);
  const grammar = getGrammar(normalizedLang);

  if (!grammar) {
    return escapeHtml(code);
  }

  return Prism.highlight(code, grammar, normalizedLang);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * List of supported languages
 */
export const SUPPORTED_LANGUAGES = [
  'typescript',
  'javascript',
  'jsx',
  'tsx',
  'css',
  'json',
  'markdown',
  'bash',
  'python',
  'java',
  'c',
  'cpp',
  'csharp',
  'go',
  'rust',
  'sql',
  'yaml',
  'docker',
  'graphql',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
