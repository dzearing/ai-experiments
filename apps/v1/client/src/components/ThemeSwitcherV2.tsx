import { useTheme } from '../contexts/ThemeContextV2';
import { themesV2 } from '../config/themesV2';
import { useEffect, useState } from 'react';

export function ThemeSwitcherV2() {
  const {
    currentTheme,
    isDarkMode,
    setTheme,
    nextTheme,
    previousTheme,
    toggleDarkMode,
    backgroundEffectEnabled,
    toggleBackgroundEffect,
  } = useTheme();
  const currentIndex = themesV2.findIndex((t) => t.id === currentTheme.id);
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('themeSwitcherMinimized');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('themeSwitcherMinimized', isMinimized.toString());
  }, [isMinimized]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          toggleDarkMode();
        } else if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          toggleBackgroundEffect();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextTheme, previousTheme, toggleDarkMode, toggleBackgroundEffect]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Expand theme switcher"
        >
          <svg
            className="h-5 w-5 text-gray-700 dark:text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
        </button>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Theme Switcher
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {currentIndex + 1} / {themesV2.length}
              </span>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Minimize"
              >
                <svg
                  className="h-4 w-4 text-gray-500 dark:text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
            <button
              onClick={toggleDarkMode}
              className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
            `}
            >
              <span
                className={`
                inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform
                ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}
              `}
              />
            </button>
          </div>

          {/* Background Effect Toggle */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Background Effect</span>
            <button
              onClick={toggleBackgroundEffect}
              className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${backgroundEffectEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
            `}
            >
              <span
                className={`
                inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform
                ${backgroundEffectEnabled ? 'translate-x-6' : 'translate-x-1'}
              `}
              />
            </button>
          </div>

          <div className="mb-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">{currentTheme.name}</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {currentTheme.description}
            </p>
          </div>

          <div className="flex gap-2 mb-3">
            <button
              onClick={previousTheme}
              className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={nextTheme}
              className="flex-1 px-3 py-2 bg-gray-900 dark:bg-gray-600 hover:bg-gray-800 dark:hover:bg-gray-500 text-white rounded-md text-sm font-medium transition-colors"
            >
              Next →
            </button>
          </div>

          <div className="space-y-1 max-h-40 overflow-y-auto">
            {themesV2.map((theme, index) => (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                  theme.id === currentTheme.id
                    ? 'bg-gray-900 dark:bg-gray-600 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="font-medium">
                  {index + 1}. {theme.name}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            <div>Use Ctrl/Cmd + D to toggle dark mode</div>
            <div>Use Ctrl/Cmd + B to toggle background effect</div>
          </div>
        </div>
      )}
    </div>
  );
}
