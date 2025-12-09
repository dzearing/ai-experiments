import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Segmented, type SegmentOption } from './Segmented';

const basicOptions: SegmentOption[] = [
  { value: 'edit', label: 'Edit' },
  { value: 'preview', label: 'Preview' },
  { value: 'split', label: 'Split' },
];

describe('Segmented', () => {
  describe('rendering', () => {
    it('renders all options', () => {
      render(<Segmented options={basicOptions} />);

      expect(screen.getByRole('radio', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Preview' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Split' })).toBeInTheDocument();
    });

    it('renders with radiogroup role', () => {
      render(<Segmented options={basicOptions} aria-label="View mode" />);

      expect(screen.getByRole('radiogroup', { name: 'View mode' })).toBeInTheDocument();
    });

    it('applies defaultValue correctly', () => {
      render(<Segmented options={basicOptions} defaultValue="preview" />);

      expect(screen.getByRole('radio', { name: 'Preview' })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('radio', { name: 'Edit' })).toHaveAttribute('aria-checked', 'false');
    });

    it('selects first option when no defaultValue provided', () => {
      render(<Segmented options={basicOptions} />);

      expect(screen.getByRole('radio', { name: 'Edit' })).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('controlled mode', () => {
    it('uses controlled value when provided', () => {
      render(<Segmented options={basicOptions} value="split" />);

      expect(screen.getByRole('radio', { name: 'Split' })).toHaveAttribute('aria-checked', 'true');
    });

    it('calls onChange when segment is clicked', () => {
      const onChange = vi.fn();
      render(<Segmented options={basicOptions} value="edit" onChange={onChange} />);

      fireEvent.click(screen.getByRole('radio', { name: 'Preview' }));

      expect(onChange).toHaveBeenCalledWith('preview');
    });
  });

  describe('uncontrolled mode', () => {
    it('updates selection on click without onChange', () => {
      render(<Segmented options={basicOptions} defaultValue="edit" />);

      fireEvent.click(screen.getByRole('radio', { name: 'Preview' }));

      expect(screen.getByRole('radio', { name: 'Preview' })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('radio', { name: 'Edit' })).toHaveAttribute('aria-checked', 'false');
    });

    it('calls onChange when provided in uncontrolled mode', () => {
      const onChange = vi.fn();
      render(<Segmented options={basicOptions} defaultValue="edit" onChange={onChange} />);

      fireEvent.click(screen.getByRole('radio', { name: 'Preview' }));

      expect(onChange).toHaveBeenCalledWith('preview');
    });
  });

  describe('disabled state', () => {
    it('disables all segments when disabled prop is true', () => {
      render(<Segmented options={basicOptions} disabled />);

      expect(screen.getByRole('radio', { name: 'Edit' })).toBeDisabled();
      expect(screen.getByRole('radio', { name: 'Preview' })).toBeDisabled();
      expect(screen.getByRole('radio', { name: 'Split' })).toBeDisabled();
    });

    it('does not call onChange when disabled', () => {
      const onChange = vi.fn();
      render(<Segmented options={basicOptions} disabled onChange={onChange} />);

      fireEvent.click(screen.getByRole('radio', { name: 'Preview' }));

      expect(onChange).not.toHaveBeenCalled();
    });

    it('disables individual segments', () => {
      const optionsWithDisabled: SegmentOption[] = [
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B', disabled: true },
        { value: 'c', label: 'Option C' },
      ];
      render(<Segmented options={optionsWithDisabled} />);

      expect(screen.getByRole('radio', { name: 'Option A' })).not.toBeDisabled();
      expect(screen.getByRole('radio', { name: 'Option B' })).toBeDisabled();
      expect(screen.getByRole('radio', { name: 'Option C' })).not.toBeDisabled();
    });

    it('does not select disabled segment on click', () => {
      const onChange = vi.fn();
      const optionsWithDisabled: SegmentOption[] = [
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B', disabled: true },
      ];
      render(<Segmented options={optionsWithDisabled} defaultValue="a" onChange={onChange} />);

      fireEvent.click(screen.getByRole('radio', { name: 'Option B' }));

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByRole('radio', { name: 'Option A' })).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('keyboard navigation', () => {
    it('navigates with ArrowRight key', () => {
      render(<Segmented options={basicOptions} defaultValue="edit" />);
      const radioGroup = screen.getByRole('radiogroup');

      fireEvent.keyDown(radioGroup, { key: 'ArrowRight' });

      expect(screen.getByRole('radio', { name: 'Preview' })).toHaveAttribute('aria-checked', 'true');
    });

    it('navigates with ArrowLeft key', () => {
      render(<Segmented options={basicOptions} defaultValue="preview" />);
      const radioGroup = screen.getByRole('radiogroup');

      fireEvent.keyDown(radioGroup, { key: 'ArrowLeft' });

      expect(screen.getByRole('radio', { name: 'Edit' })).toHaveAttribute('aria-checked', 'true');
    });

    it('navigates to first option with Home key', () => {
      render(<Segmented options={basicOptions} defaultValue="split" />);
      const radioGroup = screen.getByRole('radiogroup');

      fireEvent.keyDown(radioGroup, { key: 'Home' });

      expect(screen.getByRole('radio', { name: 'Edit' })).toHaveAttribute('aria-checked', 'true');
    });

    it('navigates to last option with End key', () => {
      render(<Segmented options={basicOptions} defaultValue="edit" />);
      const radioGroup = screen.getByRole('radiogroup');

      fireEvent.keyDown(radioGroup, { key: 'End' });

      expect(screen.getByRole('radio', { name: 'Split' })).toHaveAttribute('aria-checked', 'true');
    });

    it('does not navigate past the last option', () => {
      render(<Segmented options={basicOptions} defaultValue="split" />);
      const radioGroup = screen.getByRole('radiogroup');

      fireEvent.keyDown(radioGroup, { key: 'ArrowRight' });

      expect(screen.getByRole('radio', { name: 'Split' })).toHaveAttribute('aria-checked', 'true');
    });

    it('does not navigate before the first option', () => {
      render(<Segmented options={basicOptions} defaultValue="edit" />);
      const radioGroup = screen.getByRole('radiogroup');

      fireEvent.keyDown(radioGroup, { key: 'ArrowLeft' });

      expect(screen.getByRole('radio', { name: 'Edit' })).toHaveAttribute('aria-checked', 'true');
    });

    it('skips disabled options during navigation', () => {
      const optionsWithDisabled: SegmentOption[] = [
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B', disabled: true },
        { value: 'c', label: 'Option C' },
      ];
      render(<Segmented options={optionsWithDisabled} defaultValue="a" />);
      const radioGroup = screen.getByRole('radiogroup');

      fireEvent.keyDown(radioGroup, { key: 'ArrowRight' });

      // Should skip Option B and go to Option C
      expect(screen.getByRole('radio', { name: 'Option C' })).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('with icons', () => {
    it('renders icons when provided', () => {
      const TestIcon = () => <svg data-testid="test-icon" />;
      const optionsWithIcons: SegmentOption[] = [
        { value: 'a', label: 'Option A', icon: <TestIcon /> },
      ];
      render(<Segmented options={optionsWithIcons} />);

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('hides labels in iconOnly mode but keeps them accessible', () => {
      const optionsWithIcons: SegmentOption[] = [
        { value: 'a', label: 'Option A', icon: <svg /> },
      ];
      render(<Segmented options={optionsWithIcons} iconOnly />);

      // Label should still be findable by role/name for accessibility
      expect(screen.getByRole('radio', { name: 'Option A' })).toBeInTheDocument();
    });
  });

  describe('tabIndex', () => {
    it('sets tabIndex 0 on active segment and -1 on others', () => {
      render(<Segmented options={basicOptions} defaultValue="preview" />);

      expect(screen.getByRole('radio', { name: 'Edit' })).toHaveAttribute('tabIndex', '-1');
      expect(screen.getByRole('radio', { name: 'Preview' })).toHaveAttribute('tabIndex', '0');
      expect(screen.getByRole('radio', { name: 'Split' })).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('custom className', () => {
    it('applies custom className to container', () => {
      render(<Segmented options={basicOptions} className="custom-class" />);

      expect(screen.getByRole('radiogroup')).toHaveClass('custom-class');
    });
  });
});
