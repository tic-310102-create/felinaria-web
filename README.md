# Felinaria · El último presagio

Sitio de presentación de **Felinaria**, desarrollado con React + Vite y una identidad medieval oscura. La interfaz vive en `src/App.jsx` y en `src/components/` (atlas «Explora Felinaria» con el mapa del mundo y su crónica, los ocho niveles del mapa y visor de imágenes): historia, personajes, cinco mecánicas visuales, controles, tutoriales, descargas (Felinaria Web y APK de Android) e instalación PWA. Disponible en español e inglés, también sin conexión.

## Ejecutar

Las dependencias y `package-lock.json` ya están preparados. En la carpeta del proyecto:

```sh
npm run dev
```

Abrir la dirección que muestra Vite (habitualmente `http://localhost:5173/`). Para generar y servir la versión de producción:

```sh
npm run build
npm run preview
```

Validaciones de contenido, traducciones y recursos, sin dependencias de pruebas adicionales:

```sh
npm test
npm run test:build        # valida dist, precaché y versionado
```

Las pruebas de interfaz y offline requieren Playwright (Python) y un build completado. La de interfaz necesita un preview en el puerto 4200 (p. ej. con `with_server.py`):

```sh
python tools/test_world_browser.py    # ES/EN, responsive, APK y regresiones
python tools/test_world_offline.py    # actualización PWA y atlas sin conexión (levanta su propio servidor)
python tools/test_apk_crossbrowser.py # descarga APK en Chromium, Firefox y WebKit
```

El APK de Android se publica en `public/downloads/felinaria-android.apk` (copiado de `APK_MOVIL_FELINARIA/`); `npm run test:build` comprueba que llega a `dist/` byte a byte y que nunca entra en el precaché del service worker.

## Estructura

```text
felinaria-web/
├── css/style.css                 # Estética medieval, responsive, mecánicas y selector ES/EN
├── css/world.css                 # Atlas: mapa con crónica, niveles y visor
├── images/                       # WebP optimizados y SVG originales
├── originales-locales/           # Copias PNG y JPEG verificadas; ignoradas por Git y fuera del build
├── reports/                      # Inventario, tamaños, hashes e informes de validación
├── APK_MOVIL_FELINARIA/          # Instalador Android original (fuente de public/downloads/)
├── public/
│   ├── icons/                    # PNG de 192 y 512 px basados en el logotipo
│   ├── downloads/                # felinaria-android.apk publicado (fuera del precaché)
│   └── manifest.webmanifest
├── src/
│   ├── App.jsx                   # Interfaz compartida por ambos idiomas
│   ├── components/               # WorldExploration, WorldImageViewer, SiteMedia
│   ├── descargables.js           # Configuración real de la descarga APK
│   ├── world-data.js             # Ocho niveles oficiales y datos de regiones confirmadas, sin coordenadas inferidas
│   ├── i18n/                     # es.json, en.json, interpolación y persistencia
│   ├── image-metadata.json       # Dimensiones originales de los WebP
│   └── main.jsx                  # Montaje de React y registro del worker
├── sw.js                         # Fuente del service worker de producción
├── vite.config.js                # Publica WebP/SVG y genera el precaché versionado
├── tests/*.test.js               # 10 pruebas de idiomas, recursos, atlas y textos oficiales (node --test)
├── tools/                        # Conversión de imágenes, build y pruebas Playwright
├── index.html                    # Entrada de Vite y metadatos
├── package.json
└── package-lock.json
```

El build produce `dist/sw.js` con las rutas reales de los archivos JS y CSS de Vite, además de los iconos, las imágenes, el HTML y el manifiesto. Tras una primera visita con conexión a la versión de producción, la aplicación puede volver a abrirse offline. `js/main.js` se conserva como referencia del sitio anterior, pero no se carga: las interacciones se implementaron con React.

## Idiomas y recursos

El selector ES/EN está en la navegación y en los visores de imágenes. Se recuerda con `localStorage` (`felinaria-language`); nuevos visitantes comienzan en español. Los dos catálogos se incluyen en el mismo bundle, por lo que cambiar de idioma no necesita Internet. También se actualizan `lang`, título y metadescripción.

Las imágenes WebP conservan resolución y transparencia. Los PNG originales están en `originales-locales/20261105-112609/images/`; se retiraron de `images/` únicamente sus copias duplicadas. Los iconos de instalación de 192 y 512 px siguen siendo PNG. Los respaldos locales no se incluyen en Git ni en `dist/`.

Para regenerar los WebP desde originales disponibles en `images/` o en el respaldo local, se requiere Python con Pillow y soporte WebP:

```sh
python tools/optimize_images.py
python tools/optimize_world_images.py --ensure-variants   # WebP del atlas y variantes 768/240
```

La opción `--archive-originals` verifica primero los SHA-256, dimensiones y alfa y luego retira solo las copias PNG duplicadas de `images/`, conservando sus respaldos.

Consulta el [informe de rediseño del mundo](INFORME_REDISENO_MUNDO.md), el [inventario del atlas](reports/WORLD_IMAGES.md), el [informe de actualización bilingüe](INFORME_ACTUALIZACION_BILINGUE.md) y la [tabla de optimización](reports/OPTIMIZACION_IMAGENES.md). La [documentación PWA anterior](DOCUMENTACION_PWA_FELINARIA.md) y [sus evidencias](evidencias-pwa/README.md) describen etapas previas; las referencias históricas a PNG o a la galería antigua no representan los recursos actuales.
