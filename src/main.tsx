import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/main.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

// 🛡️ 브라우저 백그라운드 전환 시 Firebase Auth/IndexedDB의 'Database is closing/hidden' 무해화
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && typeof event.reason.message === 'string' && event.reason.message.includes('Database is closing/hidden')) {
    event.preventDefault();
  }
});

createRoot(rootEl).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
