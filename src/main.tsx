import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/main.css';
import { Capacitor } from '@capacitor/core';

// 📱 네이티브 앱(Capacitor) 환경 표식: 태블릿/폴더블/DeX 등에서도 데스크탑용 카드 프레임 없이 화면을 꽉 채우도록 CSS 분기
if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('native-app');
}

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
