import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
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
      
      const contentLines = Math.ceil(message.content.length / charPerLine);
      
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
  
  // Calculate dynamic bottom padding
  const [bottomPadding, setBottomPadding] = useState(0);
  
  const updateBottomPadding = useCallback(() => {
    console.log('[SCROLL] updateBottomPadding called');
    if (scrollContainerRef.current && groupedMessages.length > 0) {
      const container = scrollContainerRef.current;
      const containerHeight = container.clientHeight;
      console.log('[SCROLL] Container height:', containerHeight);
      
      // Find the last user message in grouped messages
      let lastUserGroupIndex = -1;
      for (let i = groupedMessages.length - 1; i >= 0; i--) {
        if (groupedMessages[i].messages.some(m => m.role === 'user')) {
          lastUserGroupIndex = i;
          break;
        }
      }
      console.log('[SCROLL] Last user group index:', lastUserGroupIndex);
      
      if (lastUserGroupIndex >= 0) {
        // Measure all items to get accurate positions
        const allItems = rowVirtualizer.getVirtualItems();
        let userMessageStart = 0;
        
        // Find the start position of the user message
        for (let i = 0; i < lastUserGroupIndex; i++) {
          const item = allItems.find(vi => vi.index === i);
          if (item) {
            userMessageStart = item.start + item.size;
          } else {
            // Estimate if not virtualized
            userMessageStart += estimateSize(i);
          }
        }
        
        // If we can find the actual item, use its start position
        const userItem = allItems.find(vi => vi.index === lastUserGroupIndex);
        if (userItem) {
          userMessageStart = userItem.start;
        }
        
        console.log('[SCROLL] User message start position:', userMessageStart);
        
        // Calculate total height after user message (including the user message itself)
        let totalHeightFromUser = 0;
        for (let i = lastUserGroupIndex; i < groupedMessages.length; i++) {
          const item = allItems.find(vi => vi.index === i);
          if (item) {
            totalHeightFromUser += item.size;
          } else {
            // Estimate if not virtualized
            totalHeightFromUser += estimateSize(i);
          }
        }
        
        console.log('[SCROLL] Total height from user message to end:', totalHeightFromUser);
        
        // We want: when scrolled to bottom, user message is at top + 8px
        // So the total scrollable height should be: userMessageStart + containerHeight - 8
        // Current actual content height from user to end is: totalHeightFromUser
        // So padding needed is: (containerHeight - 8) - totalHeightFromUser
        const paddingNeeded = Math.max((containerHeight - 8) - totalHeightFromUser, 0);
        console.log('[SCROLL] Padding needed:', paddingNeeded);
        setBottomPadding(paddingNeeded);
      }
    } else {
      console.log('[SCROLL] updateBottomPadding prerequisites not met');
    }
  }, [groupedMessages, rowVirtualizer, scrollContainerRef, estimateSize]);

  // Scroll to position last user message at top
  const scrollToLastUserMessage = useCallback(() => {
    console.log('[SCROLL] scrollToLastUserMessage called');
    if (messages.length > 0 && scrollContainerRef.current && rowVirtualizer) {
      // Find the last user message
      let lastUserMessage = null;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          lastUserMessage = messages[i];
          console.log('[SCROLL] Found last user message:', lastUserMessage.id);
          break;
        }
      }
      
      if (lastUserMessage) {
        // Find the index in grouped messages
        const userMessageGroupIndex = groupedMessages.findIndex(
          group => group.messages.some(msg => msg.id === lastUserMessage.id)
        );
        console.log('[SCROLL] User message group index:', userMessageGroupIndex);
        
        if (userMessageGroupIndex !== -1) {
          // Update padding first
          updateBottomPadding();
          
          // Scroll to position the message 8px from top
          setTimeout(() => {
            const item = rowVirtualizer.getVirtualItems().find(
              vi => vi.index === userMessageGroupIndex
            );
            console.log('[SCROLL] Virtual item:', item);
            
            if (item && scrollContainerRef.current) {
              const targetScrollTop = item.start - 8;
              console.log('[SCROLL] Scrolling to position:', targetScrollTop);
              scrollContainerRef.current.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
              });
            } else {
              console.log('[SCROLL] Could not scroll - item or ref missing');
            }
          }, 100);
        }
      } else {
        console.log('[SCROLL] No user message found');
      }
    } else {
      console.log('[SCROLL] Prerequisites not met - messages:', messages.length, 'ref:', !!scrollContainerRef.current, 'virtualizer:', !!rowVirtualizer);
    }
  }, [messages, scrollContainerRef, groupedMessages, rowVirtualizer, updateBottomPadding]);

  // Scroll on initial load (once messages are loaded)
  useEffect(() => {
    if (messages.length > 0) {
      // Delay to ensure virtualizer is ready
      const timer = setTimeout(() => {
        scrollToLastUserMessage();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, []); // Only on mount

  // Track previous user message count to detect new user messages
  const prevUserMessageCount = useRef(0);
  
  // Handle new USER messages only
  useEffect(() => {
    if (messages.length > 0) {
      // Count current user messages
      const currentUserMessageCount = messages.filter(m => m.role === 'user').length;
      console.log('[SCROLL] User message count - prev:', prevUserMessageCount.current, 'current:', currentUserMessageCount);
      
      // Check if a new user message was added
      if (currentUserMessageCount > prevUserMessageCount.current) {
        console.log('[SCROLL] New user message detected, triggering scroll to top');
        scrollToLastUserMessage();
      }
      
      // Update the count for next comparison
      prevUserMessageCount.current = currentUserMessageCount;
    }
  }, [messages, scrollToLastUserMessage]); // Depend on messages array to check all changes
  
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
    <>
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
      {/* Dynamic padding to allow scrolling last user message to top */}
      <div style={{ height: `${bottomPadding}px` }} />
    </>
  );
}