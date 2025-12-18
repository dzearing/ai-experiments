import type { Preview } from '@storybook/react';
import { ThemeProvider, ToastProvider } from '@ui-kit/react';
import { BrowserRouter } from 'react-router-dom';

// Import UI Kit styles
import '@ui-kit/react/style.css';

// Import app styles
import '../src/styles/global.module.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <ThemeProvider defaultTheme="default" defaultMode="auto">
          <ToastProvider>
            <Story />
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    ),
  ],
};

export default preview;
