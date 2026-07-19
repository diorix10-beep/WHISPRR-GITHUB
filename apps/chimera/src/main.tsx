import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Cache-busting mechanism for PWA / Service Worker caches
const APP_VERSION = 'v6';

// Migration: clear old WHISPRR key if it exists
const legacyVersion = localStorage.getItem('whisprr_app_version');
if (legacyVersion) {
  localStorage.removeItem('whisprr_app_version');
  localStorage.removeItem('chimera_app_version'); // force re-check
}

const currentVersion = localStorage.getItem('chimera_app_version');

if (currentVersion !== APP_VERSION) {
  localStorage.setItem('chimera_app_version', APP_VERSION);

  // Unregister all service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }

  // Purge all caches
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    });
  }

  // Reload after a short delay to apply cache clearing
  // But ONLY if we came from a stale version (not a fresh install)
  if (currentVersion !== null || legacyVersion !== null) {
    setTimeout(() => {
      window.location.reload();
    }, 300);
  } else {
    // Fresh install — no stale cache to clear, render immediately
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

