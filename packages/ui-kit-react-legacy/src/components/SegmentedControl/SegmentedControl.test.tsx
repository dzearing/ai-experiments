import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SegmentedControl, SegmentOption } from './SegmentedControl';

describe('SegmentedControl', () => {
  const defaultOptions: SegmentOption[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const defaultProps = {
    options: defaultOptions,
    value: 'option1',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all options', () => {
      render(<SegmentedControl {...defaultProps} />);
      
      expect(screen.getByRole('radio', { name: 'Option 1' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Option 2' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Option 3' })).toBeInTheDocument();
    });

    it('renders with icons', () => {
      const optionsWithIcons: SegmentOption[] = [
        { value: 'list', label: 'List', icon: <span data-testid="list-icon">📋</span> },
        { value: 'grid', label: 'Grid', icon: <span data-testid="grid-icon">⊞</span> },
      ];
      
      render(
        <SegmentedControl
          options={optionsWithIcons}
          value="list"
          onChange={vi.fn()}
        />
      );
      
      expect(screen.getByTestId('list-icon')).toBeInTheDocument();
      expect(screen.getByTestId('grid-icon')).toBeInTheDocument();
    });

    it('applies correct size classes', () => {
      const { container } = render(
        <SegmentedControl {...defaultProps} size="large" />
      );
      
      // CSS modules transform class names, so we check for the pattern
      const className = container.firstChild?.className || '';
      expect(className).toMatch(/size-large/);
    });

    it('applies correct variant classes', () => {
      const { container } = render(
        <SegmentedControl {...defaultProps} variant="underline" />
      );
      
      // CSS modules transform class names, so we check for the pattern
      const className = container.firstChild?.className || '';
      expect(className).toMatch(/variant-underline/);
    });

    it('applies fullWidth class when specified', () => {
      const { container } = render(
        <SegmentedControl {...defaultProps} fullWidth />
      );
      
      // CSS modules transform class names, so we check for the pattern
      const className = container.firstChild?.className || '';
      expect(className).toMatch(/fullWidth/);
    });
  });

  describe('Selection', () => {
    it('marks selected option with aria-checked', () => {
      render(<SegmentedControl {...defaultProps} />);
      
      const option1 = screen.getByRole('radio', { name: 'Option 1' });
      const option2 = screen.getByRole('radio', { name: 'Option 2' });
      
      expect(option1).toHaveAttribute('aria-checked', 'true');
      expect(option2).toHaveAttribute('aria-checked', 'false');
    });

    it('calls onChange when clicking an option', async () => {
      const onChange = vi.fn();
      render(<SegmentedControl {...defaultProps} onChange={onChange} />);
      
      const option2 = screen.getByRole('radio', { name: 'Option 2' });
      await userEvent.click(option2);
      
      expect(onChange).toHaveBeenCalledWith('option2');
    });

    it('does not call onChange when clicking selected option', async () => {
      const onChange = vi.fn();
      render(<SegmentedControl {...defaultProps} onChange={onChange} />);
      
      const option1 = screen.getByRole('radio', { name: 'Option 1' });
      await userEvent.click(option1);
      
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not call onChange when clicking disabled option', async () => {
      const onChange = vi.fn();
      const optionsWithDisabled: SegmentOption[] = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2', disabled: true },
      ];
      
      render(
        <SegmentedControl
          options={optionsWithDisabled}
          value="option1"
          onChange={onChange}
        />
      );
      
      const option2 = screen.getByRole('radio', { name: 'Option 2' });
      await userEvent.click(option2);
      
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not allow selection when control is disabled', async () => {
      const onChange = vi.fn();
      render(<SegmentedControl {...defaultProps} onChange={onChange} disabled />);
      
      const option2 = screen.getByRole('radio', { name: 'Option 2' });
      await userEvent.click(option2);
      
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates with arrow keys', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(<SegmentedControl {...defaultProps} onChange={onChange} />);
      
      const option1 = screen.getByRole('radio', { name: 'Option 1' });
      option1.focus();
      
      await user.keyboard('{ArrowRight}');
      expect(onChange).toHaveBeenCalledWith('option2');
      
      // Reset mock and update the component to reflect the new value
      onChange.mockClear();
      rerender(<SegmentedControl {...defaultProps} value="option2" onChange={onChange} />);
      
      const option2 = screen.getByRole('radio', { name: 'Option 2' });
      option2.focus();
      
      // Now we're on option2, so going left should go to option1
      await user.keyboard('{ArrowLeft}');
      expect(onChange).toHaveBeenCalledWith('option1');
    });

    it('wraps around when navigating past edges', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <SegmentedControl
          {...defaultProps}
          value="option3"
          onChange={onChange}
        />
      );
      
      const option3 = screen.getByRole('radio', { name: 'Option 3' });
      option3.focus();
      
      await user.keyboard('{ArrowRight}');
      expect(onChange).toHaveBeenCalledWith('option1');
    });

    it('navigates to first/last with Home/End keys', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <SegmentedControl
          {...defaultProps}
          value="option2"
          onChange={onChange}
        />
      );
      
      const option2 = screen.getByRole('radio', { name: 'Option 2' });
      option2.focus();
      
      await user.keyboard('{Home}');
      expect(onChange).toHaveBeenCalledWith('option1');
      
      onChange.mockClear();
      
      await user.keyboard('{End}');
      expect(onChange).toHaveBeenCalledWith('option3');
    });

    it('skips disabled options during navigation', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      const optionsWithDisabled: SegmentOption[] = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2', disabled: true },
        { value: 'option3', label: 'Option 3' },
      ];
      
      render(
        <SegmentedControl
          options={optionsWithDisabled}
          value="option1"
          onChange={onChange}
        />
      );
      
      const option1 = screen.getByRole('radio', { name: 'Option 1' });
      option1.focus();
      
      await user.keyboard('{ArrowRight}');
      expect(onChange).toHaveBeenCalledWith('option3');
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA roles', () => {
      render(<SegmentedControl {...defaultProps} />);
      
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      expect(screen.getAllByRole('radio')).toHaveLength(3);
    });

    it('supports aria-label', () => {
      render(<SegmentedControl {...defaultProps} ariaLabel="View options" />);
      
      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-label', 'View options');
    });

    it('supports aria-labelledby', () => {
      render(
        <>
          <label id="label">Choose view</label>
          <SegmentedControl {...defaultProps} ariaLabelledBy="label" />
        </>
      );
      
      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-labelledby', 'label');
    });

    it('marks disabled options with aria-disabled', () => {
      const optionsWithDisabled: SegmentOption[] = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2', disabled: true },
      ];
      
      render(
        <SegmentedControl
          options={optionsWithDisabled}
          value="option1"
          onChange={vi.fn()}
        />
      );
      
      const option2 = screen.getByRole('radio', { name: 'Option 2' });
      expect(option2).toHaveAttribute('aria-disabled', 'true');
    });

    it('supports custom aria-label per option', () => {
      const optionsWithAriaLabels: SegmentOption[] = [
        { value: 'list', label: '📋', ariaLabel: 'List view' },
        { value: 'grid', label: '⊞', ariaLabel: 'Grid view' },
      ];
      
      render(
        <SegmentedControl
          options={optionsWithAriaLabels}
          value="list"
          onChange={vi.fn()}
        />
      );
      
      expect(screen.getByRole('radio', { name: 'List view' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Grid view' })).toBeInTheDocument();
    });

    it('only selected option has tabIndex 0', () => {
      render(<SegmentedControl {...defaultProps} />);
      
      const option1 = screen.getByRole('radio', { name: 'Option 1' });
      const option2 = screen.getByRole('radio', { name: 'Option 2' });
      
      expect(option1).toHaveAttribute('tabIndex', '0');
      expect(option2).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Form Integration', () => {
    it('renders hidden input when name is provided', () => {
      const { container } = render(
        <SegmentedControl {...defaultProps} name="viewMode" />
      );
      
      const hiddenInput = container.querySelector('input[type="hidden"]');
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput).toHaveAttribute('name', 'viewMode');
      expect(hiddenInput).toHaveAttribute('value', 'option1');
    });

    it('updates hidden input value when selection changes', () => {
      const { container, rerender } = render(
        <SegmentedControl {...defaultProps} name="viewMode" />
      );
      
      const hiddenInput = container.querySelector('input[type="hidden"]');
      expect(hiddenInput).toHaveAttribute('value', 'option1');
      
      rerender(
        <SegmentedControl {...defaultProps} name="viewMode" value="option2" />
      );
      
      expect(hiddenInput).toHaveAttribute('value', 'option2');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty options array', () => {
      render(
        <SegmentedControl
          options={[]}
          value=""
          onChange={vi.fn()}
        />
      );
      
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('handles single option', () => {
      const singleOption: SegmentOption[] = [
        { value: 'only', label: 'Only Option' },
      ];
      
      render(
        <SegmentedControl
          options={singleOption}
          value="only"
          onChange={vi.fn()}
        />
      );
      
      expect(screen.getByRole('radio', { name: 'Only Option' })).toBeInTheDocument();
    });

    it('handles all disabled options', () => {
      const allDisabledOptions: SegmentOption[] = [
        { value: 'option1', label: 'Option 1', disabled: true },
        { value: 'option2', label: 'Option 2', disabled: true },
      ];
      
      const onChange = vi.fn();
      render(
        <SegmentedControl
          options={allDisabledOptions}
          value="option1"
          onChange={onChange}
        />
      );
      
      const option1 = screen.getByRole('radio', { name: 'Option 1' });
      fireEvent.keyDown(option1, { key: 'ArrowRight' });
      
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});