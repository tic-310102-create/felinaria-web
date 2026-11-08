import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { languages } from './i18n/catalog.js';
import '../css/style.css';
import '../css/world.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// El worker se publica solo con el build; Vite sirve la app sin worker en desarrollo.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let refreshed = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !refreshed) {
      refreshed = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}sw.js`,
        { updateViaCache: 'none' },
      );
      // Comprueba actualizaciones también al volver a una pestaña que llevaba abierta.
      const update = () => registration.update().catch(() => {});
      update();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine) update();
      });
    } catch (error) {
      const language = document.documentElement.lang === 'en' ? 'en' : 'es';
      console.error(languages[language].status.workerError, error);
    }
  }, { once: true });
}
