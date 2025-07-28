import { useTheme } from '../contexts/ThemeContext';
import { themes } from '../config/themes';
import { useEffect } from 'react';

export function ThemeSwitcher() {
  const { currentTheme, setTheme, nextTheme, previousTheme } = useTheme();
  const currentIndex = themes.findIndex((t) => t.id === currentTheme.id);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          nextTheme();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          previousTheme();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextTheme, previousTheme]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Theme Switcher</h3>
          <span className="text-xs text-gray-500">
            {currentIndex + 1} / {themes.length}
          </span>
        </div>

        <div className="mb-3">
          <h4 className="font-medium text-gray-900">{currentTheme.name}</h4>
          <p className="text-xs text-gray-600 mt-1">{currentTheme.description}</p>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={previousTheme}
            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={nextTheme}
            className="flex-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md text-sm font-medium transition-colors"
          >
            Next →
          </button>
        </div>

        <div className="space-y-1 max-h-40 overflow-y-auto">
          {themes.map((theme, index) => (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                theme.id === currentTheme.id
                  ? 'bg-gray-900 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="font-medium">
                {index + 1}. {theme.name}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Use Ctrl/Cmd + Arrow keys or click to switch themes
        </div>
      </div>
    </div>
  );
}
