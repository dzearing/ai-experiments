import { forwardRef } from 'react';
import { Button, type ButtonProps } from './Button';

interface IconButtonProps extends Omit<ButtonProps, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'md', className = '', children, variant, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    };

    const isCircular = variant === 'circular';

    return (
      <Button
        ref={ref}
        className={`icon-button ${sizeClasses[size]} ${isCircular ? 'rounded-full' : ''} p-0 flex items-center justify-center ${className}`}
        variant={variant}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';
