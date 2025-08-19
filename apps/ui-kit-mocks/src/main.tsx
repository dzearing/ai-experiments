import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.global.css';
import App from './App.tsx';
import { MockViewer } from './MockViewer.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/mock/*" element={<MockViewer />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
