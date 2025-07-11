import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ClaudeMessage } from './ClaudeMessage';
import { ToolExecutionGroup } from '../chat/ToolExecutionGroup';
import type { ClaudeMessage as ClaudeMessageType } from '../../contexts/ClaudeCodeContext';

interface VirtualMessageListProps {
  messages: ClaudeMessageType[];
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  onSuggestedResponse?: (response: string) => void;
  sessionId: string;
}

interface GroupedMessage {
  type: 'single' | 'toolGroup';
  messages: ClaudeMessageType[];
  id: string;
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
  
  // Group consecutive tool messages
  const groupedMessages = useMemo<GroupedMessage[]>(() => {
    // First, sort messages by timestamp to ensure consistent order
    const sortedMessages = [...messages].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });
    
    const grouped: GroupedMessage[] = [];
    let currentToolGroup: ClaudeMessageType[] = [];
    
    sortedMessages.forEach((message) => {
      if (message.role === 'tool') {
        currentToolGroup.push(message);
      } else {
        // If we have accumulated tool messages, add them as a group
        if (currentToolGroup.length > 0) {
          grouped.push({
            type: 'toolGroup',
            messages: currentToolGroup,
            id: `tool-group-${currentToolGroup[0].id}`
          });
          currentToolGroup = [];
        }
        // Add non-tool message
        grouped.push({
          type: 'single',
          messages: [message],
          id: message.id
        });
      }
    });
    
    // Don't forget the last group if it's tools
    if (currentToolGroup.length > 0) {
      grouped.push({
        type: 'toolGroup',
        messages: currentToolGroup,
        id: `tool-group-${currentToolGroup[0].id}`
      });
    }
    
    return grouped;
  }, [messages]);
  
  // Estimate initial size based on message content
  const estimateSize = useCallback((index: number) => {
    const group = groupedMessages[index];
    if (!group) return 150; // Default height
    
    // Use cached measurement if available
    if (measurementsCache.current[group.id]) {
      return measurementsCache.current[group.id];
    }
    
    if (group.type === 'toolGroup') {
      // Estimate height for tool group
      const baseHeight = 40; // Header height
      const toolHeight = 60; // Height per tool
      return baseHeight + (group.messages.length * toolHeight);
    } else {
      // Single message estimation
      const message = group.messages[0];
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
    }
  }, [groupedMessages]);
  
  const rowVirtualizer = useVirtualizer({
    count: groupedMessages.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize,
    overscan: 5,
    measureElement: (element) => {
      // Cache the measurement
      const groupId = element.getAttribute('data-group-id');
      const htmlElement = element as HTMLElement;
      if (groupId && htmlElement.offsetHeight) {
        measurementsCache.current[groupId] = htmlElement.offsetHeight;
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
        const group = groupedMessages[virtualItem.index];
        
        return (
          <div
            key={virtualItem.key}
            data-group-id={group.id}
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
            {group.type === 'toolGroup' ? (
              <ToolExecutionGroup
                tools={group.messages}
                sessionId={sessionId}
              />
            ) : (
              <ClaudeMessage 
                message={group.messages[0]} 
                onSuggestedResponse={onSuggestedResponse}
                isLatestAssistantMessage={
                  group.messages[0].role === 'assistant' && 
                  !group.messages[0].isStreaming &&
                  // Find the last assistant message
                  messages.findLastIndex(m => m.role === 'assistant' && m.id === group.messages[0].id) === messages.length - 1
                }
                sessionId={sessionId}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}