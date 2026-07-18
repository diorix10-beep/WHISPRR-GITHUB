import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Cache-busting mechanism for PWA / Service Worker caches
const APP_VERSION = 'v5';
const currentVersion = localStorage.getItem('chimera_app_version');

if (currentVersion !== APP_VERSION) {
  localStorage.setItem('chimera_app_version', APP_VERSION);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    });
  }
  // Short delay to allow SW and cache deletion to complete, then reload
  setTimeout(() => {
    window.location.reload();
  }, 300);
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

