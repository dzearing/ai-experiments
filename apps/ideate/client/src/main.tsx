import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, ToastProvider } from '@ui-kit/react';
import { App } from './App';

// Import UI Kit styles
import '@ui-kit/react/style.css';

// Import app styles
import './styles/global.module.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="default" defaultMode="auto">
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
