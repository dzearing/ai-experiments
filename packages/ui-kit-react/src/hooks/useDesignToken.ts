import { useEffect, useState } from 'react';

/**
 * Hook to access design token values
 * @param token - The CSS variable name (e.g., 'color-body-text', 'spacing-md')
 * @param element - Optional element to read the computed style from (defaults to document.documentElement)
 * @returns The computed value of the CSS variable
 */
export function useDesignToken(token: string, element?: HTMLElement): string {
  const [value, setValue] = useState('');

  useEffect(() => {
    const targetElement = element || document.documentElement;
    const variableName = token.startsWith('--') ? token : `--${token}`;
    
    const updateValue = () => {
      const computedValue = getComputedStyle(targetElement).getPropertyValue(variableName);
      setValue(computedValue.trim());
    };

    // Initial value
    updateValue();

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      updateValue();
    });

    observer.observe(targetElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-theme-type', 'class', 'style']
    });

    return () => {
      observer.disconnect();
    };
  }, [token, element]);

  return value;
}