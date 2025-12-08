import { type ReactNode, useEffect, useState, createContext, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './Toast.module.css';

/**
 * Toast component - non-blocking notification messages
 *
 * Tokens used:
 * - --panel-background, --panel-border
 * - --status-info, --status-success, --status-warning, --status-error
 */

export type ToastVariant = 'default' | 'info' | 'success' | 'warning' | 'error';
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToastProps {
  /** Toast content */
  children: ReactNode;
  /** Whether toast is visible */
  open: boolean;
  /** Called when toast should close */
  onClose?: () => void;
  /** Toast variant */
  variant?: ToastVariant;
  /** Auto-dismiss duration in ms (0 to disable) */
  duration?: number;
  /** Optional title */
  title?: ReactNode;
  /** Optional action button */
  action?: ReactNode;
  /** Position on screen */
  position?: ToastPosition;
}

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export function Toast({
  children,
  open,
  onClose,
  variant = 'default',
  duration = 5000,
  title,
  action,
  position = 'bottom-right',
}: ToastProps) {
  const [visible, setVisible] = useState(open);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setExiting(false);
    } else if (visible) {
      setExiting(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setExiting(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open, visible]);

  useEffect(() => {
    if (open && duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  if (!visible) return null;

  const toast = (
    <div className={`${styles.container} ${styles[position]}`}>
      <div
        className={`${styles.toast} ${styles[variant]} ${exiting ? styles.exiting : ''}`}
        role="alert"
        aria-live="polite"
      >
        <div className={styles.content}>
          {title && <div className={styles.title}>{title}</div>}
          <div className={styles.message}>{children}</div>
        </div>
        {action && <div className={styles.action}>{action}</div>}
        {onClose && (
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(toast, document.body);
}

// Toast Queue System
interface ToastItem {
  id: string;
  variant: ToastVariant;
  title?: ReactNode;
  message: ReactNode;
  duration?: number;
  action?: ReactNode;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}

export function ToastProvider({
  children,
  position = 'bottom-right',
  maxToasts = 5,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => {
      const newToasts = [...prev, { ...toast, id }];
      // Limit to maxToasts
      if (newToasts.length > maxToasts) {
        return newToasts.slice(-maxToasts);
      }
      return newToasts;
    });
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {toasts.length > 0 &&
        createPortal(
          <div className={`${styles.container} ${styles[position]}`}>
            {toasts.map((toast) => (
              <ToastItem
                key={toast.id}
                {...toast}
                onClose={() => removeToast(toast.id)}
              />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

interface ToastItemProps extends ToastItem {
  onClose: () => void;
}

function ToastItem({ variant, title, message, duration = 5000, action, onClose }: ToastItemProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(onClose, 200);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={`${styles.toast} ${styles[variant]} ${exiting ? styles.exiting : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.message}>{message}</div>
      </div>
      {action && <div className={styles.action}>{action}</div>}
      <button type="button" className={styles.close} onClick={handleClose} aria-label="Close">
        <CloseIcon />
      </button>
    </div>
  );
}
