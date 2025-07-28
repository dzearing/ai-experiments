import { forwardRef } from 'react';
import { useTheme } from '../../contexts/ThemeContextV2';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', ...props }, ref) => {
    const { currentStyles } = useTheme();
    const styles = currentStyles;

    const checkbox = (
      <input
        ref={ref}
        type="checkbox"
        className={`
          h-4 w-4 rounded border-gray-300
          text-blue-600 
          focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0
          dark:border-gray-600 dark:bg-gray-700
          dark:focus-visible:ring-blue-600 dark:focus-visible:ring-offset-gray-800
          ${className}
        `}
        {...props}
      />
    );

    if (!label) {
      return checkbox;
    }

    return (
      <label className={`flex items-center gap-3 cursor-pointer ${styles.textColor}`}>
        {checkbox}
        <span>{label}</span>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
