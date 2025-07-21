import type { ButtonHTMLAttributes, ReactNode } from 'react';
import cx from 'classnames';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cx(styles.root, styles[variant], styles[size], className)} {...props}>
      {children}
    </button>
  );
}
