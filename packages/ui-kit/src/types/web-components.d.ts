/**
 * TypeScript declarations for custom web components
 */

import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'theme-preview': {
        theme?: string;
        mode?: 'light' | 'dark';
        children?: React.ReactNode;
      };
    }
  }

  namespace React.JSX {
    interface IntrinsicElements {
      'theme-preview': {
        theme?: string;
        mode?: 'light' | 'dark';
        children?: React.ReactNode;
      };
    }
  }
}