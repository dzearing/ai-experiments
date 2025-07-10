import { useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ClaudeMessage } from './ClaudeMessage';
import type { ClaudeMessage as ClaudeMessageType } from '../../contexts/ClaudeCodeContext';

interface VirtualMessageListProps {
  messages: ClaudeMessageType[];
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  onSuggestedResponse?: (response: string) => void;
  sessionId: string;
}

export function VirtualMessageList({ messages, scrollContainerRef, onSuggestedResponse, sessionId }: VirtualMessageListProps) {
  console.log('VirtualMessageList render, messages count:', messages.length);
  console.log('Messages:', messages.map(m => ({
    ...m,
    content: m.content.substring(0, 50) + (m.content.length > 50 ? '...' : '')
  })));
  
  const measurementsCache = useRef<Record<string, number>>({});
  const shouldAutoScroll = useRef(true);
  const isUserScrolling = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  // Estimate initial size based on message content
  const estimateSize = useCallback((index: number) => {
    const message = messages[index];
    if (!message) return 150; // Default height
    
    // Use cached measurement if available
    if (measurementsCache.current[message.id]) {
      return measurementsCache.current[message.id];
    }
    
    // Rough estimation based on content length and type
    const baseHeight = 80; // Base height for message wrapper
    const charPerLine = 80;
    const lineHeight = 24;
    const codeBlockHeight = 200; // Estimated height for code blocks
    
    let contentLines = Math.ceil(message.content.length / charPerLine);
    
    // Add extra height for code blocks
    const codeBlockCount = (message.content.match(/```/g) || []).length / 2;
    const estimatedHeight = baseHeight + (contentLines * lineHeight) + (codeBlockCount * codeBlockHeight);
    
    return Math.min(estimatedHeight, 800); // Cap at reasonable max height
  }, [messages]);
  
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize,
    overscan: 5,
    measureElement: (element) => {
      // Cache the measurement
      const messageId = element.getAttribute('data-message-id');
      const htmlElement = element as HTMLElement;
      if (messageId && htmlElement.offsetHeight) {
        measurementsCache.current[messageId] = htmlElement.offsetHeight;
      }
      return htmlElement.offsetHeight;
    },
  });
  
  // Handle auto-scroll to bottom for new messages
  useEffect(() => {
    if (shouldAutoScroll.current && messages.length > 0 && scrollContainerRef.current) {
      const scrollToBottom = () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      };
      
      // Use RAF to ensure DOM has updated
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToBottom);
      });
    }
  }, [messages.length, scrollContainerRef]);
  
  // Detect user scrolling
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    
    const handleScroll = () => {
      isUserScrolling.current = true;
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Check if scrolled to bottom
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px threshold
      
      shouldAutoScroll.current = isAtBottom;
      
      // Reset user scrolling flag after scroll ends
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrolling.current = false;
      }, 150);
    };
    
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [scrollContainerRef]);
  
  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  
  return (
    <div
      style={{
        height: `${totalSize}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {virtualItems.map((virtualItem) => {
        const message = messages[virtualItem.index];
        
        return (
          <div
            key={virtualItem.key}
            data-message-id={message.id}
            ref={rowVirtualizer.measureElement}
            data-index={virtualItem.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ClaudeMessage 
              message={message} 
              onSuggestedResponse={onSuggestedResponse}
              isLatestAssistantMessage={
                message.role === 'assistant' && 
                virtualItem.index === messages.length - 1 &&
                !message.isStreaming
              }
              sessionId={sessionId}
            />
          </div>
        );
      })}
    </div>
  );
}