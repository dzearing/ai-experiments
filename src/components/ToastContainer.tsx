import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContextV2';
import { Portal } from './Portal';
import { useState, useEffect } from 'react';

interface ToastState {
  opacity: number;
  isHovered: boolean;
  fadeTimeout?: NodeJS.Timeout;
  removeTimeout?: NodeJS.Timeout;
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  const [toastStates, setToastStates] = useState<Record<string, ToastState>>({});

  // Initialize or clean up toast states when toasts change
  useEffect(() => {
    // Add new toasts to state
    toasts.forEach(toast => {
      if (!toastStates[toast.id]) {
        setToastStates(prev => ({
          ...prev,
          [toast.id]: {
            opacity: 1,
            isHovered: false
          }
        }));

        // Start fade timer if duration is set
        if (toast.duration && toast.duration > 0) {
          const fadeTimeout = setTimeout(() => {
            setToastStates(prev => ({
              ...prev,
              [toast.id]: {
                ...prev[toast.id],
                opacity: 0
              }
            }));

            // Remove toast after fade completes
            const removeTimeout = setTimeout(() => {
              removeToast(toast.id);
            }, 5000); // 5 second fade duration

            setToastStates(prev => ({
              ...prev,
              [toast.id]: {
                ...prev[toast.id],
                removeTimeout
              }
            }));
          }, 5000); // Start fade after 5 seconds

          setToastStates(prev => ({
            ...prev,
            [toast.id]: {
              ...prev[toast.id],
              fadeTimeout
            }
          }));
        }
      }
    });

    // Clean up removed toasts
    const toastIds = toasts.map(t => t.id);
    Object.keys(toastStates).forEach(id => {
      if (!toastIds.includes(id)) {
        const state = toastStates[id];
        if (state.fadeTimeout) clearTimeout(state.fadeTimeout);
        if (state.removeTimeout) clearTimeout(state.removeTimeout);
        setToastStates(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
      }
    });
  }, [toasts, removeToast]);

  const handleMouseEnter = (toastId: string) => {
    const state = toastStates[toastId];
    if (!state) return;

    // Clear existing timers
    if (state.fadeTimeout) clearTimeout(state.fadeTimeout);
    if (state.removeTimeout) clearTimeout(state.removeTimeout);

    // Set opacity back to 1 and mark as hovered
    setToastStates(prev => ({
      ...prev,
      [toastId]: {
        opacity: 1,
        isHovered: true
      }
    }));
  };

  const handleMouseLeave = (toastId: string, duration?: number) => {
    const state = toastStates[toastId];
    if (!state) return;

    setToastStates(prev => ({
      ...prev,
      [toastId]: {
        ...prev[toastId],
        isHovered: false
      }
    }));

    // Restart the countdown if duration is set
    if (duration && duration > 0) {
      const fadeTimeout = setTimeout(() => {
        setToastStates(prev => ({
          ...prev,
          [toastId]: {
            ...prev[toastId],
            opacity: 0
          }
        }));

        const removeTimeout = setTimeout(() => {
          removeToast(toastId);
        }, 5000); // 5 second fade duration

        setToastStates(prev => ({
          ...prev,
          [toastId]: {
            ...prev[toastId],
            removeTimeout
          }
        }));
      }, 5000); // Start fade after 5 seconds

      setToastStates(prev => ({
        ...prev,
        [toastId]: {
          ...prev[toastId],
          fadeTimeout
        }
      }));
    }
  };

  const getToastStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-900/90 dark:bg-green-800/90 text-green-100 dark:text-green-100 border border-green-700 dark:border-green-600';
      case 'error':
        return 'bg-red-900/90 dark:bg-red-800/90 text-red-100 dark:text-red-100 border border-red-700 dark:border-red-600';
      case 'warning':
        return 'bg-yellow-900/90 dark:bg-yellow-800/90 text-yellow-100 dark:text-yellow-100 border border-yellow-700 dark:border-yellow-600';
      default:
        return `${styles.contentBg} ${styles.textColor} ${styles.contentBorder} border`;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <Portal>
      <div className="fixed bottom-8 right-8 z-50 pointer-events-none">
        <div className="flex flex-col-reverse gap-3 pointer-events-auto">
          {toasts.map(toast => {
            const state = toastStates[toast.id] || { opacity: 1, isHovered: false };
            return (
              <div
                key={toast.id}
                className="transition-all ease-in-out"
                style={{
                  opacity: state.opacity,
                  transform: 'translateY(0)',
                  transitionDuration: state.opacity === 0 ? '5000ms' : '300ms',
                  transitionProperty: 'opacity, transform'
                }}
                onMouseEnter={() => handleMouseEnter(toast.id)}
                onMouseLeave={() => handleMouseLeave(toast.id, toast.duration)}
              >
                <div className={`
                  flex items-start gap-3 px-4 py-3 ${styles.borderRadius} shadow-lg backdrop-blur-sm
                  ${getToastStyles(toast.type)} min-w-[350px] max-w-xl
                `}>
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(toast.type)}
                </div>
                <p className="flex-1 text-sm font-medium break-words">{toast.message}</p>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 mt-0.5 ml-2 hover:opacity-80 transition-opacity"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </Portal>
  );
}