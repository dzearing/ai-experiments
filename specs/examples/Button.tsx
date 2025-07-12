// Button.tsx - Example CSS Modules migration
import { forwardRef } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'circular' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  as?: any;
  to?: string;
  href?: string;
  target?: string;
  rel?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'secondary', 
    size = 'md', 
    fullWidth = false, 
    className = '', 
    children, 
    as: Component = 'button', 
    ...props 
  }, ref) => {
    const isIconButton = className.includes('icon-button');
    
    // Build class list
    const classes = [
      styles.button,
      styles[variant],
      !isIconButton && variant !== 'circular' ? styles[size] : '',
      fullWidth ? styles.fullWidth : '',
      className
    ].filter(Boolean).join(' ');
    
    return (
      <Component
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Button.displayName = 'Button';

export type { ButtonProps };