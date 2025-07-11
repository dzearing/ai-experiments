import { forwardRef } from 'react';
import { useTheme } from '../../contexts/ThemeContextV2';

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
  ({ variant = 'secondary', size = 'md', fullWidth = false, className = '', children, as: Component = 'button', ...props }, ref) => {
    const { currentStyles } = useTheme();
    const styles = currentStyles;

    const sizeClasses = {
      sm: 'px-3 h-8 text-sm',
      md: 'px-4 h-10',
      lg: 'px-6 h-12 text-lg'
    };

    const variantClasses = {
      primary: `${styles.primaryButton} ${styles.primaryButtonText} ${styles.primaryButtonHover} font-medium`,
      secondary: `bg-neutral-300/60 dark:bg-neutral-600/40 ${styles.textColor} hover:bg-neutral-400/60 dark:hover:bg-neutral-600/60 border border-transparent font-medium`,
      ghost: `${styles.textColor} hover:${styles.contentBg} hover:opacity-80 font-medium`,
      circular: `bg-white/80 dark:bg-neutral-800/80 ${styles.textColor} border border-neutral-200/50 dark:border-neutral-700/50 shadow-sm hover:bg-white/90 dark:hover:bg-neutral-800/90 font-medium`,
      outline: `${styles.contentBg} ${styles.contentBorder} border ${styles.textColor} hover:bg-gray-100 dark:hover:bg-gray-700`,
      danger: `bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800 border border-transparent font-medium`
    };

    const isIconButton = className.includes('icon-button');
    
    return (
      <Component
        ref={ref}
        className={`
          inline-flex items-center justify-center whitespace-nowrap select-none
          ${!isIconButton && variant !== 'circular' ? sizeClasses[size] : ''}
          ${variantClasses[variant]}
          ${variant === 'circular' ? 'rounded-full' : styles.buttonRadius}
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

export type { ButtonProps };