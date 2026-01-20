import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Import ui-kit theme and component CSS
import '@ui-kit/core/themes/default-light.css';
import '@ui-kit/react';
import '@ui-kit/react-chat';

import { App } from './App';

// Disable StrictMode in development to prevent double-invocation issues
// that cause duplicate API requests, especially for streaming connections
const isDevelopment = import.meta.env.DEV;

createRoot(document.getElementById('root')!).render(
  isDevelopment ? (
    <App />
  ) : (
    <StrictMode>
      <App />
    </StrictMode>
  )
);
