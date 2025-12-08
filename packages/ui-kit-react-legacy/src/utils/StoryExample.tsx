import React from 'react';
import styles from './StoryExample.module.css';

export interface StoryExampleProps {
  /** Example content to render */
  children: React.ReactNode;
  /** Whether to render in an iframe for isolation (useful for fixed/absolute positioning) */
  iframe?: boolean;
  /** Height of the iframe when iframe=true */
  height?: string;
  /** Width of the iframe when iframe=true */
  width?: string;
  /** Title for the iframe (for accessibility) */
  title?: string;
  /** Custom class name */
  className?: string;
  /** Whether to show a border around the frame */
  bordered?: boolean;
}

/**
 * StoryExample provides a consistent example container that matches Storybook's
 * built-in example styling. Optionally renders content in an iframe for cases
 * where isolation is needed (e.g., fixed positioning elements).
 * 
 * Use this for all component examples to maintain visual consistency across
 * documentation while providing the flexibility to isolate problematic examples.
 */
export const StoryExample: React.FC<StoryExampleProps> = ({
  children,
  iframe = false,
  height = '200px',
  width = '100%',
  title = 'Story Example',
  className
}) => {
  const containerClasses = [
    styles.container,
    iframe && styles.iframeContainer,
    className,
  ].filter(Boolean).join(' ');

  if (iframe) {
    // For iframe mode, create a complete HTML document with the content
    const htmlContent = typeof children === 'string' ? children : '';
    
    const fullHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <style>
      * {
        box-sizing: border-box;
      }
      
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #f0f2f4;
        color: #262626;
        font-size: 14px;
        line-height: 1.5;
        min-height: 100vh;
        position: relative;
      }
      
      /* CSS custom properties */
      :root {
        --color-body-background: #f0f2f4;
        --color-body-text: #262626;
        --color-body-border: #d9d9d9;
        --color-panel-background: #ffffff;
        --color-panel-text: #262626;
        --color-panel-border: #d9d9d9;
        --spacing: 16px;
        --spacing-small20: 4px;
        --spacing-small10: 8px;
        --spacing-large10: 24px;
        --spacing-large20: 32px;
        --font-size-normal: 14px;
        --font-size-small10: 12px;
        --font-weight-medium: 500;
        --radius-small10: 4px;
        --duration-enter: 300ms;
        --easing-enter: ease-out;
        --easing-default: ease;
        --focusRing-width: 2px;
        --focusRing-color: #328ce7;
        --focusRing-offset: 2px;
        
        /* Notice tokens for Banner component */
        --color-noticeDanger-background: #f1e1e1;
        --color-noticeDanger-text: #750a0a;
        --color-noticeDanger-border: #df9f9f;
        --color-noticeDanger-icon: #d31212;
        
        --color-noticeWarning-background: #f3ece0;
        --color-noticeWarning-text: #7a4f05;
        --color-noticeWarning-border: #e2c99c;
        --color-noticeWarning-icon: #be7b08;
        
        --color-noticeInfo-background: #dfe7f4;
        --color-noticeInfo-text: #06327a;
        --color-noticeInfo-border: #9cb7e2;
        --color-noticeInfo-icon: #0a5adb;
        
        --color-noticeSuccess-background: #e0f2ed;
        --color-noticeSuccess-text: #0a7552;
        --color-noticeSuccess-border: #9fdfca;
        --color-noticeSuccess-icon: #0e9c6d;
        
        --shadow-soft10: 0 1px 3px rgba(0, 0, 0, 0.12);
      }
      
      /* Banner styles */
      .banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        width: 100%;
        min-height: 36px;
        display: flex;
        align-items: center;
        padding: var(--spacing-small20) var(--spacing-large10);
        background: var(--color-panel-background);
        border-bottom: 1px solid var(--color-panel-border);
        z-index: 1000;
        transform: translateY(-100%);
        transition: transform var(--duration-enter) var(--easing-enter);
        box-shadow: var(--shadow-soft10);
      }

      .banner.visible {
        transform: translateY(0);
      }

      .banner.error {
        background: var(--color-noticeDanger-background);
        border-color: var(--color-noticeDanger-border);
        color: var(--color-noticeDanger-text);
      }

      .banner.warning {
        background: var(--color-noticeWarning-background);
        border-color: var(--color-noticeWarning-border);
        color: var(--color-noticeWarning-text);
      }

      .banner.info {
        background: var(--color-noticeInfo-background);
        border-color: var(--color-noticeInfo-border);
        color: var(--color-noticeInfo-text);
      }

      .banner.success {
        background: var(--color-noticeSuccess-background);
        border-color: var(--color-noticeSuccess-border);
        color: var(--color-noticeSuccess-text);
      }

      .banner-icon {
        flex-shrink: 0;
        width: 16px;
        height: 16px;
        margin-right: var(--spacing-small10);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .banner.error .banner-icon {
        color: var(--color-noticeDanger-icon);
      }

      .banner.warning .banner-icon {
        color: var(--color-noticeWarning-icon);
      }

      .banner.info .banner-icon {
        color: var(--color-noticeInfo-icon);
      }

      .banner.success .banner-icon {
        color: var(--color-noticeSuccess-icon);
      }

      .banner-content {
        flex: 1;
        font-size: var(--font-size-small10);
        line-height: var(--line-height-normal);
        font-weight: var(--font-weight-medium);
      }

      .banner:nth-child(2) {
        top: 36px;
      }

      .banner:nth-child(3) {
        top: 72px;
      }

      .banner:nth-child(4) {
        top: 108px;
      }
      
      /* Demo content */
      .demo-content {
        padding: 150px 20px 20px;
        text-align: center;
        color: #666;
      }
    </style>
  </head>
  <body>
    ${htmlContent}
    
    <script>
      // Animate banners in sequence
      setTimeout(() => {
        const banners = document.querySelectorAll('.banner');
        banners.forEach((banner, index) => {
          setTimeout(() => {
            banner.classList.add('visible');
          }, index * 200);
        });
      }, 100);
    </script>
  </body>
</html>`;

    return (
      <div className={containerClasses}>
        <iframe
          className={styles.iframe}
          style={{ width, height }}
          title={title}
          srcDoc={fullHtml}
          sandbox="allow-scripts"
        />
        <div className={styles.iframeLabel}>
          iframe
        </div>
      </div>
    );
  }

  // For non-iframe mode, render the content directly
  return (
    <div className={containerClasses}>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};