import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import './ThemeAwareColorSwatch.css';
/**
 * A theme-aware color swatch component that properly displays colors
 * from different themes using Shadow DOM encapsulation.
 *
 * This component ensures that color values are accurately displayed
 * regardless of the current page theme, maintaining design system integrity.
 */
export const ThemeAwareColorSwatch = ({ tokenName, theme, mode, label, showValue = true }) => {
    const [colorValue, setColorValue] = React.useState('');
    const swatchRef = React.useRef(null);
    React.useEffect(() => {
        // Create a theme preview element to get the computed value
        const getComputedColor = async () => {
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.visibility = 'hidden';
            document.body.appendChild(tempContainer);
            // Create theme preview element
            const themePreview = document.createElement('theme-preview');
            themePreview.setAttribute('theme', theme);
            themePreview.setAttribute('mode', mode);
            tempContainer.appendChild(themePreview);
            // Wait for Shadow DOM to be ready
            await new Promise(resolve => setTimeout(resolve, 100));
            try {
                const shadowRoot = themePreview.shadowRoot;
                if (shadowRoot) {
                    const wrapper = shadowRoot.querySelector('.theme-preview-wrapper');
                    if (wrapper) {
                        const computedStyle = getComputedStyle(wrapper);
                        const value = computedStyle.getPropertyValue(tokenName).trim();
                        setColorValue(value);
                    }
                }
            }
            catch (error) {
                console.error('Error computing color value:', error);
                setColorValue('--');
            }
            finally {
                document.body.removeChild(tempContainer);
            }
        };
        getComputedColor();
    }, [tokenName, theme, mode]);
    return (_jsxs("div", { className: "theme-aware-color-swatch", "data-theme": theme, "data-mode": mode, children: [_jsx("theme-preview", { theme: theme, mode: mode, children: _jsxs("div", { className: "swatch-preview", ref: swatchRef, style: {
                        backgroundColor: tokenName.includes('background') ? `var(${tokenName})` : 'var(--color-body-background)',
                        color: tokenName.includes('text') || tokenName.includes('link') ? `var(${tokenName})` : 'var(--color-body-text)',
                        borderColor: tokenName.includes('border') ? `var(${tokenName})` : 'var(--color-body-border)',
                        boxShadow: tokenName.includes('shadow') ? `0 4px 16px var(${tokenName})` : 'none'
                    }, children: [tokenName.includes('text') || tokenName.includes('link') ? 'Aa' : '', tokenName.includes('icon') ? '★' : ''] }) }), label && _jsx("div", { className: "swatch-label", children: label }), showValue && _jsx("div", { className: "swatch-value", children: colorValue })] }));
};
export default ThemeAwareColorSwatch;
//# sourceMappingURL=ThemeAwareColorSwatch.js.map