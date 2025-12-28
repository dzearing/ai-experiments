import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypingIndicator } from './TypingIndicator';

describe('TypingIndicator', () => {
  it('renders correctly', () => {
    render(<TypingIndicator />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders default 3 dots', () => {
    const { container } = render(<TypingIndicator />);
    const dots = container.querySelectorAll('span[class*="dot"]');
    expect(dots).toHaveLength(3);
  });

  it('renders custom dot count', () => {
    const { container } = render(<TypingIndicator count={5} />);
    const dots = container.querySelectorAll('span[class*="dot"]');
    expect(dots).toHaveLength(5);
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<TypingIndicator size="sm" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<TypingIndicator size="md" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<TypingIndicator size="lg" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<TypingIndicator variant="default" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<TypingIndicator variant="primary" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    render(<TypingIndicator label="AI is typing" />);
    const indicator = screen.getByRole('status');
    expect(indicator).toHaveAttribute('aria-label', 'AI is typing');
  });

  it('includes screen reader text', () => {
    render(<TypingIndicator label="Processing" />);
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('uses default label when not specified', () => {
    render(<TypingIndicator />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Typing');
  });

  it('supports custom className', () => {
    const { container } = render(<TypingIndicator className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('passes additional HTML attributes', () => {
    render(<TypingIndicator data-testid="typing-indicator" />);
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
  });
});
