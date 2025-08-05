import { marked } from 'marked';

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true,
});

export function parseMarkdown(content: string): string {
  try {
    // Pre-process content to fix common URL issues
    let processedContent = content;

    // Fix URLs with angle brackets like <github.com/user/repo>
    processedContent = processedContent.replace(
      /<((?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})>/g,
      (_match, url) => {
        // If URL doesn't have protocol, add https://
        if (!url.match(/^https?:\/\//)) {
          return `[${url}](https://${url})`;
        }
        return `[${url}](${url})`;
      }
    );

    // Parse markdown to HTML
    let html = marked.parse(processedContent) as string;

    // Convert file paths to clickable links (e.g., /path/to/file.ts:123)
    html = html.replace(
      /(?<![">])((\/[\w\-\.\/]+)+\.[\w]+)(:\d+)?(?![<"])/g,
      (match, filePath, _fullPath, lineNumber) => {
        const line = lineNumber ? lineNumber.substring(1) : '';
        const vscodeUrl = `vscode://file${filePath}${line ? ':' + line : ''}`;
        return `<a href="${vscodeUrl}" class="file-link text-purple-600 dark:text-purple-400 hover:underline font-mono text-sm" title="Open in VSCode">${match}</a>`;
      }
    );

    // Post-process HTML to add custom styling
    // Add classes to elements for Tailwind styling
    html = html
      // Headers
      .replace(
        /<h1>/g,
        '<h1 class="text-2xl font-bold mt-4 mb-2 text-gray-900 dark:text-gray-100">'
      )
      .replace(
        /<h2>/g,
        '<h2 class="text-xl font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100">'
      )
      .replace(
        /<h3>/g,
        '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100">'
      )
      .replace(
        /<h4>/g,
        '<h4 class="text-base font-medium mt-4 mb-2 text-gray-900 dark:text-gray-100">'
      )
      .replace(
        /<h5>/g,
        '<h5 class="text-sm font-medium mt-4 mb-2 text-gray-900 dark:text-gray-100">'
      )
      .replace(
        /<h6>/g,
        '<h6 class="text-xs font-medium mt-4 mb-2 text-gray-900 dark:text-gray-100">'
      )
      // Code blocks
      .replace(
        /<pre>/g,
        '<pre class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-4 my-3 overflow-x-auto">'
      )
      .replace(/<code>/g, '<code class="text-sm text-gray-900 dark:text-gray-100">')
      // Inline code
      .replace(/<code([^>]*)>/g, (match, attrs) => {
        // Check if this is inside a pre tag by looking for class attribute
        if (attrs && attrs.includes('class=')) {
          return match; // Already has classes, likely in a pre block
        }
        return '<code class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded text-sm font-mono">';
      })
      // Lists
      .replace(/<ul>/g, '<ul class="list-disc ml-6 my-2 space-y-1">')
      .replace(/<ol>/g, '<ol class="list-decimal ml-6 my-2 space-y-1">')
      // Checkboxes
      .replace(/<li>\s*<input([^>]*type="checkbox"[^>]*)>/gi, (_match, attrs) => {
        const isChecked = attrs.includes('checked');
        return `<li class="list-none ml-0"><label class="flex items-start gap-2"><input type="checkbox" ${isChecked ? 'checked' : ''} disabled class="mt-1 rounded border-gray-300 dark:border-gray-600">`;
      })
      .replace(/(<\/label>)?<\/li>/g, (match, hasLabel) => {
        return hasLabel ? match : '</label></li>';
      })
      // Paragraphs
      .replace(/<p>/g, '<p class="mb-3 last:mb-0">')
      // Blockquotes
      .replace(
        /<blockquote>/g,
        '<blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-3">'
      )
      // Horizontal rules
      .replace(/<hr>/g, '<hr class="my-4 border-gray-300 dark:border-gray-600" />')
      // Strong
      .replace(/<strong>/g, '<strong class="font-semibold">');

    // Post-process links to fix any remaining issues
    html = html.replace(/<a ([^>]*href=")([^"]+)("[^>]*)>/g, (_match, before, href, after) => {
      let cleanHref = href.trim();

      // Remove any remaining angle brackets
      cleanHref = cleanHref.replace(/^&lt;|&gt;$/g, '');

      // If it looks like a URL without protocol, add https://
      if (!cleanHref.match(/^[a-zA-Z]+:\/\//) && cleanHref.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
        cleanHref = 'https://' + cleanHref;
      }

      // For VSCode links, ensure proper attributes
      if (cleanHref.startsWith('vscode://')) {
        // Remove target="_blank" if present
        after = after.replace(/target="_blank"/g, '').replace(/rel="noopener noreferrer"/g, '');
        // Add VSCode specific classes
        if (!after.includes('class=')) {
          after =
            ' class="file-link text-purple-600 dark:text-purple-400 hover:underline font-mono text-sm"' +
            after;
        }
      } else {
        // Ensure external links have proper attributes
        if (!after.includes('target="_blank"')) {
          after = ' target="_blank" rel="noopener noreferrer"' + after;
        }
        // Add link styling if not present
        if (!after.includes('class=')) {
          after = ' class="text-blue-600 dark:text-blue-400 hover:underline"' + after;
        }
      }

      return `<a ${before}${cleanHref}${after}>`;
    });

    return html;
  } catch (error) {
    console.error('Error parsing markdown:', error);
    // Return escaped content as fallback
    const div = document.createElement('div');
    div.textContent = content;
    return div.innerHTML;
  }
}
