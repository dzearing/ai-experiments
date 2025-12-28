import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BusyIndicator } from './BusyIndicator';

describe('BusyIndicator', () => {
  it('renders correctly', () => {
    render(<BusyIndicator />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders default 3 dots', () => {
    const { container } = render(<BusyIndicator />);
    const dots = container.querySelectorAll('span[class*="dot"]');
    expect(dots).toHaveLength(3);
  });

  it('renders custom dot count', () => {
    const { container } = render(<BusyIndicator count={5} />);
    const dots = container.querySelectorAll('span[class*="dot"]');
    expect(dots).toHaveLength(5);
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<BusyIndicator size="sm" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<BusyIndicator size="md" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<BusyIndicator size="lg" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<BusyIndicator variant="default" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<BusyIndicator variant="primary" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    render(<BusyIndicator label="AI is thinking" />);
    const indicator = screen.getByRole('status');
    expect(indicator).toHaveAttribute('aria-label', 'AI is thinking');
  });

  it('includes screen reader text', () => {
    render(<BusyIndicator label="Working" />);
    expect(screen.getByText('Working')).toBeInTheDocument();
  });

  it('uses default label when not specified', () => {
    render(<BusyIndicator />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Processing');
  });

  it('supports custom className', () => {
    const { container } = render(<BusyIndicator className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('passes additional HTML attributes', () => {
    render(<BusyIndicator data-testid="busy-indicator" />);
    expect(screen.getByTestId('busy-indicator')).toBeInTheDocument();
  });
});
