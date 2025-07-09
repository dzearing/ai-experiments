import { memo, useMemo } from 'react';
import { marked } from 'marked';
import { ChatBubble } from '../chat/ChatBubble';
import { ToolExecution } from '../chat/ToolExecution';
import { SuggestedResponses } from '../chat/SuggestedResponses';
import { DancingBubbles } from '../ui/DancingBubbles';
import type { ClaudeMessage as ClaudeMessageType } from '../../contexts/ClaudeCodeContext';

interface ClaudeMessageProps {
  message: ClaudeMessageType;
  onSuggestedResponse?: (response: string) => void;
  isLatestAssistantMessage?: boolean;
}

export const ClaudeMessage = memo(function ClaudeMessage({ 
  message, 
  onSuggestedResponse,
  isLatestAssistantMessage = false 
}: ClaudeMessageProps) {
  // Handle content that might be an array or object
  let messageContent = message.content;
  if (typeof messageContent !== 'string') {
    if (Array.isArray(messageContent)) {
      messageContent = (messageContent as Array<any>)
        .filter(block => block?.type === 'text')
        .map(block => block?.text || '')
        .join('\n');
    } else if (messageContent && typeof messageContent === 'object' && 'text' in messageContent) {
      messageContent = (messageContent as any).text;
    } else {
      messageContent = String(messageContent);
    }
  }
  
  const formatContent = useMemo(() => (content: string) => {
    try {
      // Configure marked options for this parse
      marked.setOptions({
        breaks: true,
        gfm: true
      });
      
      // Parse markdown to HTML
      let html = marked.parse(content) as string;
      
      // Post-process HTML to add custom styling
      // Add classes to elements for Tailwind styling
      html = html
        // Headers
        .replace(/<h1>/g, '<h1 class="text-2xl font-bold mt-4 mb-2 text-gray-900 dark:text-gray-100">')
        .replace(/<h2>/g, '<h2 class="text-xl font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100">')
        .replace(/<h3>/g, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100">')
        .replace(/<h4>/g, '<h4 class="text-base font-medium mt-4 mb-2 text-gray-900 dark:text-gray-100">')
        .replace(/<h5>/g, '<h5 class="text-sm font-medium mt-4 mb-2 text-gray-900 dark:text-gray-100">')
        .replace(/<h6>/g, '<h6 class="text-xs font-medium mt-4 mb-2 text-gray-900 dark:text-gray-100">')
        // Code blocks
        .replace(/<pre>/g, '<pre class="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 my-3 overflow-x-auto">')
        .replace(/<code>/g, '<code class="text-sm text-gray-800 dark:text-gray-200">')
        // Inline code
        .replace(/<code([^>]*)>/g, (match, attrs) => {
          // Check if this is inside a pre tag by looking for class attribute
          if (attrs && attrs.includes('class=')) {
            return match; // Already has classes, likely in a pre block
          }
          return '<code class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded text-sm font-mono">';
        })
        // Lists
        .replace(/<ul>/g, '<ul class="list-disc list-inside ml-4 my-2 space-y-1">')
        .replace(/<ol>/g, '<ol class="list-decimal list-inside ml-4 my-2 space-y-1">')
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
        // Links
        .replace(/<a /g, '<a class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" ')
        // Blockquotes
        .replace(/<blockquote>/g, '<blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-3">')
        // Horizontal rules
        .replace(/<hr>/g, '<hr class="my-4 border-gray-300 dark:border-gray-600" />')
        // Strong
        .replace(/<strong>/g, '<strong class="font-semibold">');
      
      return <div className="prose prose-sm max-w-none dark:prose-invert markdown-content" dangerouslySetInnerHTML={{ __html: html }} />;
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return <div className="prose prose-sm max-w-none dark:prose-invert">{content}</div>;
    }
  }, []);
  
  // Show thinking indicator for streaming messages
  const isThinking = message.isStreaming && messageContent.startsWith('Claude is thinking');
  
  const getAvatar = () => {
    switch (message.role) {
      case 'user':
        return <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">U</div>;
      case 'assistant':
        return <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">C</div>;
      case 'system':
        return null;
    }
  };
  
  // System messages get special treatment
  if (message.role === 'system') {
    return (
      <div className="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
        {messageContent}
      </div>
    );
  }
  
  // Tool messages are rendered as tool executions
  if (message.role === 'tool') {
    return (
      <div className="px-4 py-2" data-testid="tool-execution">
        <ToolExecution
          name={message.name || 'Unknown Tool'}
          args={message.args}
          output=""
          status={message.status || 'complete'}
          expandedByDefault={false}
          executionTime={message.executionTime}
          data-testid="tool-execution"
        />
      </div>
    );
  }
  
  
  return (
    <>
      <ChatBubble
        variant={message.role === 'user' ? 'sent' : 'received'}
        showAvatar={true}
        avatar={getAvatar()}
        timestamp={message.timestamp}
        className="mx-4 my-2"
        data-testid={`message-${message.isStreaming ? 'streaming' : 'complete'}`}
      >
        {/* Message content */}
        {isThinking || (message.isStreaming && !messageContent) ? (
          <DancingBubbles />
        ) : (
          formatContent(messageContent)
        )}
        
        {/* Streaming cursor */}
        {message.isStreaming && !isThinking && messageContent && (
          <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
        )}
        
        {/* Debug info */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="text-xs text-gray-400 dark:text-gray-600 mt-2 font-mono">
            <div>ID: {message.id}</div>
            <div>Streaming: {String(message.isStreaming)}</div>
            <div>Greeting: {String(message.isGreeting || false)}</div>
            <div>Content type: {typeof message.content}</div>
            {typeof message.content !== 'string' && (
              <div>Raw content: {JSON.stringify(message.content).substring(0, 100)}...</div>
            )}
          </div>
        )}
        
        {/* Suggested responses for the latest assistant message */}
        {isLatestAssistantMessage && message.suggestedResponses && onSuggestedResponse && (
          <SuggestedResponses
            responses={message.suggestedResponses}
            onSelect={onSuggestedResponse}
            disabled={message.isStreaming}
          />
        )}
      </ChatBubble>
    </>
  );
});