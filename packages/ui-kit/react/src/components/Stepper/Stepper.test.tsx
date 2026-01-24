import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Stepper } from './Stepper';

const basicSteps = [
  { label: 'Account' },
  { label: 'Profile' },
  { label: 'Review' },
  { label: 'Complete' },
];

const stepsWithDescriptions = [
  { label: 'Account', description: 'Create your account' },
  { label: 'Profile', description: 'Add your details' },
  { label: 'Complete', description: 'Finish setup' },
];

/**
 * Helper to check if an element's className contains a CSS module class name
 * CSS modules hash class names like 'md' to '_md_abc123'
 */
function hasClass(element: Element, className: string): boolean {
  const pattern = new RegExp(`(^|\\s)_?${className}(_[a-z0-9]+)?($|\\s)`, 'i');

  return pattern.test(element.className);
}

describe('Stepper', () => {
  // Rendering tests
  it('renders the correct number of steps', () => {
    render(<Stepper steps={basicSteps} current={0} />);
    const list = screen.getByRole('list');
    const items = screen.getAllByRole('listitem');

    expect(items).toHaveLength(4);
    expect(list).toBeInTheDocument();
  });

  it('renders step labels', () => {
    render(<Stepper steps={basicSteps} current={0} />);

    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('renders step descriptions when provided', () => {
    render(<Stepper steps={stepsWithDescriptions} current={0} />);

    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByText('Add your details')).toBeInTheDocument();
    expect(screen.getByText('Finish setup')).toBeInTheDocument();
  });

  it('renders step numbers by default', () => {
    render(<Stepper steps={basicSteps} current={0} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('hides step numbers when showNumbers is false', () => {
    render(<Stepper steps={basicSteps} current={0} showNumbers={false} />);

    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  // Orientation tests
  it('applies horizontal orientation class by default', () => {
    render(<Stepper steps={basicSteps} current={0} />);
    const list = screen.getByRole('list');

    expect(hasClass(list, 'horizontal')).toBe(true);
  });

  it('applies vertical orientation class when specified', () => {
    render(<Stepper steps={basicSteps} current={0} orientation="vertical" />);
    const list = screen.getByRole('list');

    expect(hasClass(list, 'vertical')).toBe(true);
  });

  // Size tests
  it('applies md size class by default', () => {
    render(<Stepper steps={basicSteps} current={0} />);
    const list = screen.getByRole('list');

    expect(hasClass(list, 'md')).toBe(true);
  });

  it('applies sm size class', () => {
    render(<Stepper steps={basicSteps} current={0} size="sm" />);
    const list = screen.getByRole('list');

    expect(hasClass(list, 'sm')).toBe(true);
  });

  it('applies lg size class', () => {
    render(<Stepper steps={basicSteps} current={0} size="lg" />);
    const list = screen.getByRole('list');

    expect(hasClass(list, 'lg')).toBe(true);
  });

  // State tests
  it('marks completed steps correctly', () => {
    render(<Stepper steps={basicSteps} current={2} />);
    const items = screen.getAllByRole('listitem');

    expect(hasClass(items[0], 'complete')).toBe(true);
    expect(hasClass(items[1], 'complete')).toBe(true);
    expect(hasClass(items[2], 'current')).toBe(true);
    expect(hasClass(items[3], 'complete')).toBe(false);
    expect(hasClass(items[3], 'current')).toBe(false);
  });

  it('handles first step correctly', () => {
    render(<Stepper steps={basicSteps} current={0} />);
    const items = screen.getAllByRole('listitem');

    expect(hasClass(items[0], 'current')).toBe(true);
    expect(hasClass(items[0], 'complete')).toBe(false);
    expect(hasClass(items[1], 'current')).toBe(false);
    expect(hasClass(items[1], 'complete')).toBe(false);
  });

  it('handles last step correctly', () => {
    render(<Stepper steps={basicSteps} current={3} />);
    const items = screen.getAllByRole('listitem');

    expect(hasClass(items[0], 'complete')).toBe(true);
    expect(hasClass(items[1], 'complete')).toBe(true);
    expect(hasClass(items[2], 'complete')).toBe(true);
    expect(hasClass(items[3], 'current')).toBe(true);
  });

  it('respects step status override', () => {
    const stepsWithStatus = [
      { label: 'Account', status: 'complete' as const },
      { label: 'Payment', status: 'error' as const },
      { label: 'Review' },
    ];

    render(<Stepper steps={stepsWithStatus} current={1} />);
    const items = screen.getAllByRole('listitem');

    expect(hasClass(items[0], 'complete')).toBe(true);
    expect(hasClass(items[1], 'error')).toBe(true);
  });

  // Clickable behavior tests
  it('makes steps clickable when clickable prop is true', () => {
    const handleClick = vi.fn();

    render(
      <Stepper
        steps={basicSteps}
        current={0}
        clickable
        onStepClick={handleClick}
      />
    );

    const items = screen.getAllByRole('listitem');

    expect(hasClass(items[0], 'clickable')).toBe(true);
  });

  it('calls onStepClick when clickable step is clicked', () => {
    const handleClick = vi.fn();

    render(
      <Stepper
        steps={basicSteps}
        current={0}
        clickable
        onStepClick={handleClick}
      />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);

    expect(handleClick).toHaveBeenCalledWith(1);
  });

  it('does not call onStepClick when disabled step is clicked', () => {
    const handleClick = vi.fn();
    const stepsWithDisabled = [
      { label: 'Account' },
      { label: 'Profile', disabled: true },
      { label: 'Complete' },
    ];

    render(
      <Stepper
        steps={stepsWithDisabled}
        current={0}
        clickable
        onStepClick={handleClick}
      />
    );

    const items = screen.getAllByRole('listitem');
    const disabledIndicator = items[1].querySelector('[aria-disabled="true"]');

    if (disabledIndicator) {
      fireEvent.click(disabledIndicator);
    }

    expect(handleClick).not.toHaveBeenCalled();
  });

  // Keyboard navigation tests
  it('activates step on Enter key when clickable', () => {
    const handleClick = vi.fn();

    render(
      <Stepper
        steps={basicSteps}
        current={0}
        clickable
        onStepClick={handleClick}
      />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.keyDown(buttons[1], { key: 'Enter' });

    expect(handleClick).toHaveBeenCalledWith(1);
  });

  it('activates step on Space key when clickable', () => {
    const handleClick = vi.fn();

    render(
      <Stepper
        steps={basicSteps}
        current={0}
        clickable
        onStepClick={handleClick}
      />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.keyDown(buttons[1], { key: ' ' });

    expect(handleClick).toHaveBeenCalledWith(1);
  });

  // Accessibility tests
  it('has correct ARIA role', () => {
    render(<Stepper steps={basicSteps} current={0} />);

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('has default aria-label', () => {
    render(<Stepper steps={basicSteps} current={0} />);
    const list = screen.getByRole('list');

    expect(list).toHaveAttribute('aria-label', 'Progress steps');
  });

  it('accepts custom aria-label', () => {
    render(<Stepper steps={basicSteps} current={0} aria-label="Setup wizard" />);
    const list = screen.getByRole('list');

    expect(list).toHaveAttribute('aria-label', 'Setup wizard');
  });

  it('marks current step with aria-current', () => {
    render(<Stepper steps={basicSteps} current={1} />);
    const items = screen.getAllByRole('listitem');

    expect(items[0]).not.toHaveAttribute('aria-current');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[2]).not.toHaveAttribute('aria-current');
  });

  // Props passthrough tests
  it('passes through className', () => {
    render(<Stepper steps={basicSteps} current={0} className="custom-class" />);
    const list = screen.getByRole('list');

    expect(list).toHaveClass('custom-class');
  });

  it('passes through data attributes', () => {
    render(<Stepper steps={basicSteps} current={0} data-testid="stepper" />);

    expect(screen.getByTestId('stepper')).toBeInTheDocument();
  });

  // Edge cases
  it('handles single step', () => {
    render(<Stepper steps={[{ label: 'Only Step' }]} current={0} />);
    const items = screen.getAllByRole('listitem');

    expect(items).toHaveLength(1);
    expect(hasClass(items[0], 'current')).toBe(true);
  });

  it('renders custom icons when provided', () => {
    const stepsWithIcons = [
      { label: 'Account', icon: <span data-testid="custom-icon">★</span> },
      { label: 'Complete' },
    ];

    render(<Stepper steps={stepsWithIcons} current={0} />);

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
