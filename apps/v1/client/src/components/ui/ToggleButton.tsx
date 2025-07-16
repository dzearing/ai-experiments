import { useTheme } from '../../contexts/ThemeContextV2';

interface ToggleButtonProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

export function ToggleButton({ checked, onChange, label, disabled = false, className = '' }: ToggleButtonProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`px-4 py-2 ${styles.borderRadius} transition-colors flex items-center gap-2 ${
        checked 
          ? `${styles.primaryButton} ${styles.primaryButtonText}` 
          : `bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600`
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <div className={`w-4 h-4 border-2 rounded ${
        checked 
          ? 'bg-white border-white' 
          : 'border-gray-500 dark:border-gray-400'
      } relative`}>
        {checked && (
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 16 16">
            <path 
              fill={checked ? (styles.primaryButton.includes('blue') ? '#3B82F6' : '#10B981') : 'none'}
              d="M13.5 3.5L6 11L2.5 7.5L3.9 6.1L6 8.2L12.1 2.1L13.5 3.5Z"
            />
          </svg>
        )}
      </div>
      <span className="capitalize">{label}</span>
    </button>
  );
}