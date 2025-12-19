import { useContext } from 'react';
import { OutletContext } from './context';

/**
 * Outlet component - renders child routes in nested route layouts
 *
 * Usage:
 * ```tsx
 * function AppLayout() {
 *   return (
 *     <div>
 *       <header>App Header</header>
 *       <main>
 *         <Outlet /> {/* Child routes render here *\/}
 *       </main>
 *     </div>
 *   );
 * }
 * ```
 */
export function Outlet() {
  const context = useContext(OutletContext);

  if (!context) {
    return null;
  }

  return <>{context.children}</>;
}
