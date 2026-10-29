# Felinaria · El último presagio

Sitio de presentación de **Felinaria**, migrado a React + Vite sin cambiar el diseño original. Toda la interfaz y sus interacciones viven en `src/App.jsx`; `css/style.css` conserva los estilos originales.

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

## Estructura

```text
felinaria-web/
├── css/style.css                 # Estilos originales + aviso de desconexión
├── images/                       # Emblema PNG, logotipo SVG y bocetos originales
├── public/
│   ├── icons/                    # PNG de 192 y 512 px basados en el logotipo
│   └── manifest.webmanifest
├── src/
│   ├── App.jsx                   # Toda la interfaz y las interacciones
│   └── main.jsx                  # Montaje de React y registro del worker
├── sw.js                         # Fuente del service worker de producción
├── vite.config.js                # Conserva los SVG y genera el precaché
├── index.html                    # Entrada de Vite y metadatos
├── package.json
└── package-lock.json
```

El build produce `dist/sw.js` con las rutas reales de los archivos JS y CSS de Vite, además de los iconos, las imágenes, el HTML y el manifiesto. Tras una primera visita con conexión a la versión de producción, la aplicación puede volver a abrirse offline. `js/main.js` se conserva como referencia del sitio anterior, pero no se carga: las interacciones se implementaron con React.

Para la entrega PWA, consulta [DOCUMENTACION_PWA_FELINARIA.md](DOCUMENTACION_PWA_FELINARIA.md) y las capturas e instrucciones en [evidencias-pwa/](evidencias-pwa/README.md).
