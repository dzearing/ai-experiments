import { memo } from 'react';
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
    console.warn('ClaudeMessage received non-string content:', messageContent);
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
  
  const formatContent = (content: string) => {
    // Simple markdown-like formatting
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
              className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 my-2 overflow-x-auto"
            >
              <code className="text-sm text-gray-800 dark:text-gray-200">
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
          '<code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded text-sm">$1</code>'
        );
        
        if (line || formattedLine) {
          formatted.push(
            <div 
              key={`line-${i}`} 
              dangerouslySetInnerHTML={{ __html: formattedLine }}
            />
          );
        }
      }
    }
    
    return formatted;
  };
  
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
  
  return (
    <>
      <ChatBubble
        variant={message.role === 'user' ? 'sent' : 'received'}
        showAvatar={true}
        avatar={getAvatar()}
        timestamp={message.timestamp}
        className="mx-4 my-2"
      >
        {/* Show tool executions if any */}
        {message.toolExecutions && message.toolExecutions.length > 0 && (
          <div className="mb-2">
            {message.toolExecutions.map((tool, index) => {
              // Safely convert args and result to strings
              let argsString = '';
              if (tool.args) {
                if (typeof tool.args === 'string') {
                  argsString = tool.args;
                } else if (typeof tool.args === 'object') {
                  // Check if it's the problematic {name, input} object
                  if (tool.args.name && tool.args.input) {
                    argsString = `${tool.args.name}: ${tool.args.input}`;
                  } else {
                    argsString = JSON.stringify(tool.args, null, 2);
                  }
                } else {
                  argsString = String(tool.args);
                }
              }
              
              let resultString = '';
              if (tool.result) {
                if (typeof tool.result === 'string') {
                  resultString = tool.result;
                } else if (typeof tool.result === 'object') {
                  resultString = JSON.stringify(tool.result, null, 2);
                } else {
                  resultString = String(tool.result);
                }
              }
              
              return (
                <ToolExecution
                  key={index}
                  name={tool.name}
                  args={argsString}
                  output={resultString}
                  status={tool.status}
                  error={tool.isSuccess ? undefined : 'Tool execution failed'}
                  expandedByDefault={false}
                  executionTime={tool.executionTime}
                />
              );
            })}
          </div>
        )}
        
        {/* Message content */}
        {isThinking || (message.isStreaming && !messageContent) ? (
          <DancingBubbles />
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {formatContent(messageContent)}
          </div>
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