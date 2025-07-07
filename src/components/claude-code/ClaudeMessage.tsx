import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContextV2';
import type { ClaudeMessage as ClaudeMessageType } from '../../contexts/ClaudeCodeContext';

interface ClaudeMessageProps {
  message: ClaudeMessageType;
}

export const ClaudeMessage = memo(function ClaudeMessage({ message }: ClaudeMessageProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  
  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    // This is a basic implementation - you might want to use a proper markdown parser
    const lines = content.split('\n');
    const formatted = [];
    let inCodeBlock = false;
    let codeContent = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeContent = [];
        } else {
          // End of code block
          formatted.push(
            <pre 
              key={`code-${i}`}
              className={`${styles.contentBg} ${styles.contentBorder} border ${styles.borderRadius} p-4 my-2 overflow-x-auto`}
            >
              <code className={`text-sm ${styles.textColor}`}>
                {codeContent.join('\n')}
              </code>
            </pre>
          );
          inCodeBlock = false;
          codeContent = [];
        }
      } else if (inCodeBlock) {
        codeContent.push(line);
      } else {
        // Regular text with basic formatting
        let formattedLine = line;
        
        // Bold
        formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Inline code
        formattedLine = formattedLine.replace(
          /`([^`]+)`/g, 
          `<code class="px-1 py-0.5 ${styles.contentBg} ${styles.textColor} ${styles.borderRadius} text-sm">$1</code>`
        );
        
        formatted.push(
          <div 
            key={`line-${i}`} 
            className={line ? 'mb-2' : 'mb-4'}
            dangerouslySetInnerHTML={{ __html: formattedLine || '&nbsp;' }}
          />
        );
      }
    }
    
    return formatted;
  };
  
  const getMessageStyles = () => {
    switch (message.role) {
      case 'user':
        return {
          container: `${styles.contentBg} ${styles.contentBorder} border`,
          header: styles.textColor,
          content: styles.textColor,
          icon: '👤'
        };
      case 'assistant':
        return {
          container: `${styles.cardBg} ${styles.cardBorder} border`,
          header: styles.primaryText,
          content: styles.textColor,
          icon: '🤖'
        };
      case 'system':
        return {
          container: `${styles.warningBg} ${styles.contentBorder} border`,
          header: styles.warningText,
          content: styles.warningText,
          icon: '⚠️'
        };
    }
  };
  
  const messageStyles = getMessageStyles();
  
  return (
    <div className={`mx-4 my-2 p-4 ${styles.borderRadius} ${messageStyles.container} ${styles.cardShadow}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{messageStyles.icon}</span>
          <span className={`font-medium ${messageStyles.header}`}>
            {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Claude' : 'System'}
          </span>
        </div>
        <span className={`text-xs ${styles.mutedText}`}>
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
      
      {/* Tool Use Indicators */}
      {message.toolUse && message.toolUse.length > 0 && (
        <div className="mb-2 space-y-1">
          {message.toolUse.map((tool, index) => (
            <div 
              key={index}
              className={`inline-flex items-center gap-2 px-2 py-1 text-xs ${styles.borderRadius} ${
                tool.status === 'pending' 
                  ? `${styles.warningBg} ${styles.warningText}` 
                  : tool.status === 'error'
                  ? `bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400`
                  : `${styles.successBg} ${styles.successText}`
              }`}
            >
              <span className="font-medium">{tool.name}</span>
              {tool.status === 'pending' && (
                <span className="animate-pulse">...</span>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Content */}
      <div className={messageStyles.content}>
        {message.isStreaming && message.content === '' ? (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '100ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '200ms' }}>.</span>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {formatContent(message.content)}
          </div>
        )}
        
        {message.isStreaming && message.content && (
          <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
        )}
      </div>
    </div>
  );
});