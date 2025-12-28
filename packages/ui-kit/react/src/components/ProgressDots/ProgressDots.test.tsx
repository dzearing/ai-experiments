import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressDots } from './ProgressDots';

describe('ProgressDots', () => {
  // Rendering tests
  it('renders the correct number of dots', () => {
    render(<ProgressDots current={0} total={5} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.children).toHaveLength(5);
  });

  it('renders with default size', () => {
    render(<ProgressDots current={0} total={3} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveClass('md');
  });

  // Size variants
  it('applies sm size class', () => {
    render(<ProgressDots current={0} total={3} size="sm" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveClass('sm');
  });

  it('applies md size class', () => {
    render(<ProgressDots current={0} total={3} size="md" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveClass('md');
  });

  it('applies lg size class', () => {
    render(<ProgressDots current={0} total={3} size="lg" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveClass('lg');
  });

  // State tests
  it('marks completed steps correctly', () => {
    render(<ProgressDots current={2} total={5} />);
    const progressbar = screen.getByRole('progressbar');
    const dots = progressbar.children;

    // First two dots should be complete
    expect(dots[0]).toHaveClass('complete');
    expect(dots[1]).toHaveClass('complete');

    // Current dot should have current class
    expect(dots[2]).toHaveClass('current');

    // Remaining dots should not have complete or current
    expect(dots[3]).not.toHaveClass('complete');
    expect(dots[3]).not.toHaveClass('current');
    expect(dots[4]).not.toHaveClass('complete');
    expect(dots[4]).not.toHaveClass('current');
  });

  it('handles first step correctly', () => {
    render(<ProgressDots current={0} total={3} />);
    const progressbar = screen.getByRole('progressbar');
    const dots = progressbar.children;

    expect(dots[0]).toHaveClass('current');
    expect(dots[0]).not.toHaveClass('complete');
    expect(dots[1]).not.toHaveClass('current');
    expect(dots[1]).not.toHaveClass('complete');
  });

  it('handles last step correctly', () => {
    render(<ProgressDots current={4} total={5} />);
    const progressbar = screen.getByRole('progressbar');
    const dots = progressbar.children;

    // All previous dots should be complete
    expect(dots[0]).toHaveClass('complete');
    expect(dots[1]).toHaveClass('complete');
    expect(dots[2]).toHaveClass('complete');
    expect(dots[3]).toHaveClass('complete');

    // Last dot is current
    expect(dots[4]).toHaveClass('current');
  });

  // Accessibility tests
  it('has correct ARIA role', () => {
    render(<ProgressDots current={1} total={5} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('has correct ARIA progress values', () => {
    render(<ProgressDots current={2} total={5} />);
    const progressbar = screen.getByRole('progressbar');

    expect(progressbar).toHaveAttribute('aria-valuenow', '3'); // 0-based index + 1
    expect(progressbar).toHaveAttribute('aria-valuemin', '1');
    expect(progressbar).toHaveAttribute('aria-valuemax', '5');
  });

  it('has default aria-label', () => {
    render(<ProgressDots current={0} total={3} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-label', 'Progress');
  });

  it('accepts custom aria-label', () => {
    render(<ProgressDots current={0} total={3} aria-label="Setup wizard progress" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-label', 'Setup wizard progress');
  });

  // Props passthrough
  it('passes through className', () => {
    render(<ProgressDots current={0} total={3} className="custom-class" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveClass('custom-class');
  });

  it('passes through data attributes', () => {
    render(<ProgressDots current={0} total={3} data-testid="progress-dots" />);
    expect(screen.getByTestId('progress-dots')).toBeInTheDocument();
  });

  // Edge cases
  it('handles single step', () => {
    render(<ProgressDots current={0} total={1} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.children).toHaveLength(1);
    expect(progressbar.children[0]).toHaveClass('current');
  });
});
