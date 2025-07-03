import { ButtonHTMLAttributes, ElementType, forwardRef } from 'react';
import { useTheme } from '../../contexts/ThemeContextV2';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  as?: ElementType;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', fullWidth = false, className = '', children, as: Component = 'button', ...props }, ref) => {
    const { currentStyles } = useTheme();
    const styles = currentStyles;

    const sizeClasses = {
      sm: 'px-3 h-8 text-sm',
      md: 'px-4 h-10',
      lg: 'px-6 h-12 text-lg'
    };

    const variantClasses = {
      primary: `${styles.primaryButton} ${styles.primaryButtonText} ${styles.primaryButtonHover}`,
      secondary: `bg-neutral-600/40 text-white dark:text-white hover:bg-neutral-600/60 border border-transparent`,
      ghost: `${styles.textColor} hover:${styles.contentBg} hover:opacity-80`
    };

    return (
      <Component
        ref={ref}
        className={`
          inline-flex items-center justify-center
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${styles.buttonRadius}
          transition-all
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Button.displayName = 'Button';