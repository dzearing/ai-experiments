import React from 'react';
import styles from './IconCatalog.module.css';

interface SyntaxHighlightProps {
  code: string;
  language?: 'jsx' | 'bash' | 'javascript';
}

export const SyntaxHighlight: React.FC<SyntaxHighlightProps> = ({ code, language = 'jsx' }) => {
  const highlightCode = (code: string, language: string) => {
    if (language === 'bash') {
      return highlightBash(code);
    }
    return highlightJSX(code);
  };

  const highlightBash = (code: string) => {
    const lines = code.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('#')) {
        return <div key={i} className={styles.codeComment}>{line}</div>;
      }
      
      const parts = line.split(' ');
      if (parts[0] === 'pnpm' || parts[0] === 'npm' || parts[0] === 'yarn') {
        return (
          <div key={i}>
            <span style={{ color: 'var(--color-info)' }}>{parts[0]}</span>
            {parts.slice(1).map((part, j) => {
              if (part.startsWith('@')) {
                return <span key={j} style={{ color: 'var(--color-success)' }}> {part}</span>;
              }
              return <span key={j}> {part}</span>;
            })}
          </div>
        );
      }
      
      return <div key={i}>{line}</div>;
    });
  };

  const highlightJSX = (code: string) => {
    const lines = code.split('\n');
    return lines.map((line, i) => {
      // Comment lines
      if (line.trim().startsWith('//')) {
        return <div key={i} className={styles.codeComment}>{line}</div>;
      }

      // Import statements
      if (line.includes('import ')) {
        const highlighted = line
          .replace(/import/g, '<span class="keyword">import</span>')
          .replace(/from/g, '<span class="keyword">from</span>')
          .replace(/(['"].*?['"])/g, '<span class="string">$1</span>')
          .replace(/\{([^}]+)\}/g, (_match, content: string) => {
            const items = content.split(',').map((item: string) => 
              `<span class="variable">${item.trim()}</span>`
            ).join(', ');
            return `<span class="punctuation">{</span> ${items} <span class="punctuation">}</span>`;
          });
        
        return <div key={i} dangerouslySetInnerHTML={{ __html: highlighted }} />;
      }

      // Function declarations
      if (line.includes('function ')) {
        const highlighted = line
          .replace(/function/g, '<span class="keyword">function</span>')
          .replace(/(\w+)\s*\(/g, '<span class="function">$1</span>(');
        
        return <div key={i} dangerouslySetInnerHTML={{ __html: highlighted }} />;
      }

      // Return statements
      if (line.includes('return')) {
        const highlighted = line
          .replace(/return/g, '<span class="keyword">return</span>');
        
        return <div key={i} dangerouslySetInnerHTML={{ __html: highlighted }} />;
      }

      // JSX tags
      if (line.includes('<') && line.includes('>')) {
        const highlighted = line
          .replace(/<(\/?)([\w]+)([^>]*)>/g, (_match, slash: string, tag: string, attrs: string) => {
            let result = `<span class="tag">&lt;${slash}${tag}</span>`;
            
            if (attrs) {
              const attrHighlighted = attrs
                .replace(/(\w+)=/g, '<span class="attribute">$1</span>=')
                .replace(/(\{[^}]+\})/g, '<span class="punctuation">$1</span>')
                .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>');
              result += attrHighlighted;
            }
            
            result += `<span class="tag">&gt;</span>`;
            return result;
          });
        
        return <div key={i} dangerouslySetInnerHTML={{ __html: highlighted }} />;
      }

      // Default
      return <div key={i}>{line}</div>;
    });
  };

  return (
    <div className={styles.codeBlock} style={{ whiteSpace: 'pre', fontFamily: 'var(--font-family-mono)' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .keyword { color: var(--color-primary); font-weight: 500; }
        .string { color: var(--color-success); }
        .variable { color: var(--color-info); }
        .function { color: var(--color-warning); }
        .punctuation { color: var(--color-body-text-soft40); }
        .tag { color: var(--color-error); }
        .attribute { color: var(--color-warning); }
      `}} />
      {highlightCode(code, language)}
    </div>
  );
};