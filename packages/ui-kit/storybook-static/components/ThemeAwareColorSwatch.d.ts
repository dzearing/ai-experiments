import React from 'react';
import './ThemeAwareColorSwatch.css';
interface ThemeAwareColorSwatchProps {
    tokenName: string;
    theme: string;
    mode: 'light' | 'dark';
    label?: string;
    showValue?: boolean;
}
/**
 * A theme-aware color swatch component that properly displays colors
 * from different themes using Shadow DOM encapsulation.
 *
 * This component ensures that color values are accurately displayed
 * regardless of the current page theme, maintaining design system integrity.
 */
export declare const ThemeAwareColorSwatch: React.FC<ThemeAwareColorSwatchProps>;
export default ThemeAwareColorSwatch;
//# sourceMappingURL=ThemeAwareColorSwatch.d.ts.map