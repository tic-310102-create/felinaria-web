# Felinaria · El último presagio

Sitio de presentación de **Felinaria**, desarrollado con React + Vite y una identidad medieval oscura. La interfaz y sus interacciones viven en `src/App.jsx`: historia, personajes, cinco mecánicas visuales, controles, regiones, tutoriales e instalación PWA. Disponible en español e inglés, también sin conexión.

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
```

## Estructura

```text
felinaria-web/
├── css/style.css                 # Estética medieval, responsive, mecánicas y selector ES/EN
├── images/                       # WebP optimizados y SVG originales
├── originales-locales/           # Copias PNG verificadas; ignoradas por Git y fuera del build
├── reports/                      # Inventario, tamaños, hashes e informe de optimización
├── public/
│   ├── icons/                    # PNG de 192 y 512 px basados en el logotipo
│   └── manifest.webmanifest
├── src/
│   ├── App.jsx                   # Interfaz compartida por ambos idiomas
│   ├── i18n/                     # es.json, en.json, interpolación y persistencia
│   ├── image-metadata.json       # Dimensiones originales de los WebP
│   └── main.jsx                  # Montaje de React y registro del worker
├── sw.js                         # Fuente del service worker de producción
├── vite.config.js                # Publica WebP/SVG y genera el precaché versionado
├── tests/content.test.js         # Validación de idiomas, controles y recursos
├── tools/optimize_images.py      # Conversión con Pillow, respaldos y tabla de pesos
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
```

La opción `--archive-originals` verifica primero los SHA-256, dimensiones y alfa y luego retira solo las copias PNG duplicadas de `images/`, conservando sus respaldos.

Consulta el [informe de actualización bilingüe](INFORME_ACTUALIZACION_BILINGUE.md) y la [tabla de optimización](reports/OPTIMIZACION_IMAGENES.md). La [documentación PWA anterior](DOCUMENTACION_PWA_FELINARIA.md) y [sus evidencias](evidencias-pwa/README.md) describen etapas previas; las referencias históricas a PNG o a la galería antigua no representan los recursos actuales.
