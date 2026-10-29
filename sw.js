/* Publicado en la raíz por Vite: las rutas del precaché se generan al compilar. */
const CACHE_NAME = 'felinaria-__FELINARIA_VERSION__';
const PRECACHE = __FELINARIA_PRECACHE__;
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap';
const scopedURL = (path) => new URL(path, self.registration.scope).href;

async function cacheFonts(cache) {
  // Google Fonts se descarga al instalar para conservar la tipografía sin conexión.
  // Un bloqueo del proveedor no impide instalar el resto de la aplicación.
  try {
    const response = await fetch(FONT_CSS);
    if (!response.ok) return;
    const css = await response.clone().text();
    await cache.put(FONT_CSS, response);
    const urls = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)]
      .map((match) => match[1]))];
    await Promise.allSettled(urls.map(async (url) => {
      const font = await fetch(url);
      if (font.ok) await cache.put(url, font);
    }));
  } catch (_) {
    // El contenido local sigue disponible aunque las fuentes externas fallen.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE.map(scopedURL));
    await cacheFonts(cache);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('felinaria-') && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const local = url.origin === self.location.origin && url.pathname.startsWith(new URL(self.registration.scope).pathname);
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  // Una APK es una descarga bajo demanda: no precargarla ni guardarla en runtime.
  if (local && url.pathname.toLowerCase().endsWith('.apk')) return;
  if (!local && !font) return;

  if (request.mode === 'navigate' && local) {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch (_) {
        return (await caches.match(scopedURL('index.html'))) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    // Vite añade crossorigin a JS/CSS. El servidor responde con Vary: Origin,
    // mientras que el precaché se descargó sin esa cabecera: la URL sí coincide.
    const cached = await caches.match(request, { ignoreVary: local });
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      const cache = await caches.open(CACHE_NAME);
      event.waitUntil(cache.put(request, response.clone()));
    }
    return response;
  })());
});
