import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { useNavigateHandler } from './hooks';

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** The path to navigate to */
  href: string;
  /** Replace instead of push to history */
  replace?: boolean;
  /** Link content */
  children?: ReactNode;
}

/**
 * Link component for client-side navigation
 *
 * Usage:
 * ```tsx
 * <Link href="/dashboard">Go to Dashboard</Link>
 * <Link href="/settings" replace>Settings</Link>
 * ```
 */
export function Link({ href, replace, children, onClick, ...rest }: LinkProps) {
  const handleClick = useNavigateHandler(href, { replace, onClick });

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
