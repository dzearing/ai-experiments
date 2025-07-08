import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Disable StrictMode in development to prevent double-invocation issues
// that cause duplicate API requests, especially for Claude Code sessions
const isDevelopment = import.meta.env.DEV;

createRoot(document.getElementById('root')!).render(
  isDevelopment ? <App /> : <StrictMode><App /></StrictMode>,
)
