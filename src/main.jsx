import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import '../css/style.css';

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
      console.error('No se pudo registrar la aplicación sin conexión:', error);
    }
  }, { once: true });
}
