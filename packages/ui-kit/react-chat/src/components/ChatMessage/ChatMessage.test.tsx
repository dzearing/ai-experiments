import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatMessage, type ChatMessageToolCall } from './ChatMessage';

describe('ChatMessage', () => {
  const defaultProps = {
    id: 'msg-1',
    content: 'Hello, world!',
    timestamp: new Date('2024-01-15T10:30:00'),
    senderName: 'Test User',
  };

  describe('rendering', () => {
    it('renders message content', () => {
      render(<ChatMessage {...defaultProps} />);
      expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    });

    it('renders sender name', () => {
      render(<ChatMessage {...defaultProps} />);
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('renders formatted timestamp', () => {
      render(<ChatMessage {...defaultProps} />);
      // The timestamp should be formatted as HH:MM
      expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
    });

    it('renders with data-message-id attribute', () => {
      render(<ChatMessage {...defaultProps} />);
      const message = document.querySelector('[data-message-id="msg-1"]');
      expect(message).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<ChatMessage {...defaultProps} className="custom-class" />);
      const message = document.querySelector('[data-message-id="msg-1"]');
      expect(message).toHaveClass('custom-class');
    });
  });

  describe('avatar', () => {
    it('renders default Avatar with sender name fallback', () => {
      render(<ChatMessage {...defaultProps} />);
      // Avatar should show initials from sender name
      expect(screen.getByText('TU')).toBeInTheDocument();
    });

    it('renders custom avatar when provided', () => {
      render(
        <ChatMessage
          {...defaultProps}
          avatar={<div data-testid="custom-avatar">🤖</div>}
        />
      );
      expect(screen.getByTestId('custom-avatar')).toBeInTheDocument();
    });

    it('applies sender color to avatar', () => {
      render(<ChatMessage {...defaultProps} senderColor="#ff0000" />);
      const senderName = screen.getByText('Test User');
      expect(senderName).toHaveStyle({ color: '#ff0000' });
    });
  });

  describe('consecutive messages', () => {
    it('hides avatar for consecutive messages', () => {
      render(<ChatMessage {...defaultProps} isConsecutive />);
      // Avatar column should have hidden class (visibility: hidden)
      const avatarColumn = document.querySelector('[class*="avatarColumn"]');
      expect(avatarColumn?.className).toMatch(/hidden/);
    });

    it('shows avatar for non-consecutive messages', () => {
      render(<ChatMessage {...defaultProps} isConsecutive={false} />);
      const avatarColumn = document.querySelector('[class*="avatarColumn"]');
      expect(avatarColumn?.className).not.toMatch(/hidden/);
    });
  });

  describe('own messages', () => {
    it('applies highlighted class for own messages', () => {
      render(<ChatMessage {...defaultProps} isOwn />);
      const message = document.querySelector('[data-message-id="msg-1"]');
      expect(message?.className).toMatch(/highlighted/);
    });

    it('does not apply highlighted class for other messages', () => {
      render(<ChatMessage {...defaultProps} isOwn={false} />);
      const message = document.querySelector('[data-message-id="msg-1"]');
      expect(message?.className).not.toMatch(/highlighted/);
    });
  });

  describe('markdown rendering', () => {
    it('renders markdown content by default', () => {
      render(<ChatMessage {...defaultProps} content="**bold** text" />);
      // MarkdownRenderer should process the content
      const strong = document.querySelector('strong');
      expect(strong).toBeInTheDocument();
      expect(strong).toHaveTextContent('bold');
    });

    it('renders plain text when renderMarkdown is false', () => {
      render(
        <ChatMessage {...defaultProps} content="**not bold**" renderMarkdown={false} />
      );
      // Should render as plain text, not parsed
      expect(screen.getByText('**not bold**')).toBeInTheDocument();
    });

    it('renders plain text with correct class for line breaks', () => {
      render(
        <ChatMessage
          {...defaultProps}
          content={'Line 1\nLine 2'}
          renderMarkdown={false}
        />
      );
      const plainText = document.querySelector('[class*="plainText"]');
      expect(plainText).toBeInTheDocument();
      // The plainText class has white-space: pre-wrap in CSS
      expect(plainText?.className).toMatch(/plainText/);
    });
  });

  describe('streaming indicator', () => {
    it('shows streaming indicator when isStreaming is true', () => {
      render(<ChatMessage {...defaultProps} isStreaming />);
      expect(screen.getByLabelText('Generating response')).toBeInTheDocument();
    });

    it('hides streaming indicator when isStreaming is false', () => {
      render(<ChatMessage {...defaultProps} isStreaming={false} />);
      expect(screen.queryByLabelText('Generating response')).not.toBeInTheDocument();
    });

    it('renders three animated dots for streaming', () => {
      render(<ChatMessage {...defaultProps} isStreaming />);
      const dots = document.querySelectorAll('[class*="streamingDot"]');
      expect(dots).toHaveLength(3);
    });
  });

  describe('tool calls', () => {
    const toolCalls: ChatMessageToolCall[] = [
      { name: 'search_web', input: { query: 'test' }, output: 'Results...' },
      { name: 'read_file', input: { path: '/test.txt' } },
    ];

    it('renders tool calls section when toolCalls provided', () => {
      render(<ChatMessage {...defaultProps} toolCalls={toolCalls} />);
      expect(screen.getByText('search_web')).toBeInTheDocument();
      expect(screen.getByText('read_file')).toBeInTheDocument();
    });

    it('shows completed status for tool calls with output', () => {
      render(<ChatMessage {...defaultProps} toolCalls={toolCalls} />);
      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    it('does not render tool calls section when empty', () => {
      render(<ChatMessage {...defaultProps} toolCalls={[]} />);
      const toolCallsSection = document.querySelector('[class*="toolCalls"]');
      expect(toolCallsSection).not.toBeInTheDocument();
    });

    it('does not render tool calls section when undefined', () => {
      render(<ChatMessage {...defaultProps} />);
      const toolCallsSection = document.querySelector('[class*="toolCalls"]');
      expect(toolCallsSection).not.toBeInTheDocument();
    });
  });

  describe('menu', () => {
    const menuItems = [
      { label: 'Edit', value: 'edit' },
      { label: 'Delete', value: 'delete' },
    ];

    it('renders timestamp as button when menu items provided', () => {
      render(<ChatMessage {...defaultProps} menuItems={menuItems} />);
      const timestampButton = screen.getByRole('button');
      expect(timestampButton).toBeInTheDocument();
    });

    it('renders timestamp as span when no menu items', () => {
      render(<ChatMessage {...defaultProps} />);
      const timestampButton = screen.queryByRole('button');
      expect(timestampButton).not.toBeInTheDocument();
    });

    it('calls onMenuSelect with value and message id', async () => {
      const user = userEvent.setup();
      const onMenuSelect = vi.fn();
      render(
        <ChatMessage
          {...defaultProps}
          menuItems={menuItems}
          onMenuSelect={onMenuSelect}
        />
      );

      // Click the timestamp button to open menu
      const timestampButton = screen.getByRole('button');
      await user.click(timestampButton);

      // Click a menu item
      const editItem = await screen.findByText('Edit');
      await user.click(editItem);

      expect(onMenuSelect).toHaveBeenCalledWith('edit', 'msg-1');
    });
  });

  describe('timestamp formatting', () => {
    it('formats Date object correctly', () => {
      const timestamp = new Date('2024-01-15T14:30:00');
      render(<ChatMessage {...defaultProps} timestamp={timestamp} />);
      // Should show time in HH:MM format
      expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
    });

    it('formats number timestamp correctly', () => {
      const timestamp = new Date('2024-01-15T14:30:00').getTime();
      render(<ChatMessage {...defaultProps} timestamp={timestamp} />);
      expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
    });

    it('formats string timestamp correctly', () => {
      render(<ChatMessage {...defaultProps} timestamp="2024-01-15T14:30:00" />);
      expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('streaming indicator has aria-label', () => {
      render(<ChatMessage {...defaultProps} isStreaming />);
      const indicator = screen.getByLabelText('Generating response');
      expect(indicator).toBeInTheDocument();
    });

    it('message has data-message-id for identification', () => {
      render(<ChatMessage {...defaultProps} id="unique-id" />);
      expect(document.querySelector('[data-message-id="unique-id"]')).toBeInTheDocument();
    });
  });
});
