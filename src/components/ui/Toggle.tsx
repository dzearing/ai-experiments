import { useTheme } from '../../contexts/ThemeContextV2';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onChange, label, disabled = false, className = '' }: ToggleProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {label && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className="relative inline-block w-10 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        <div className={`absolute inset-0 ${checked ? 'bg-blue-600 dark:bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-700'} rounded-full transition-colors`} />
        <div className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}