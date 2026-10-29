# Felinaria: El Último Presagio — documentación de la PWA

## Objetivo de la actividad

Presentar el sitio de Felinaria como una **Progressive Web App (PWA)** instalable, capaz de mostrar sus secciones principales después de una primera carga con conexión. Se mantiene el diseño de la página React: Inicio, Historia, Personajes, Mecánicas, **Controles**, Galería, **Descargables** y Equipo.

## Tecnologías y archivos

- **React 19** y **React DOM**: interfaz e interacciones de `src/App.jsx`.
- **Vite 7**: desarrollo y compilación de producción; `vite.config.js` conserva las imágenes originales y genera la lista de precaché con los nombres reales de los archivos compilados.
- **CSS**: `css/style.css`, con Cinzel y EB Garamond de Google Fonts y fuentes de respaldo Georgia/Times New Roman.
- **Manifiesto**: `public/manifest.webmanifest`, enlazado una sola vez en `index.html`.
- **Service Worker**: fuente `sw.js`, publicada como `dist/sw.js` por el build y registrada desde `src/main.jsx` solo en producción. No se utiliza `vite-plugin-pwa` ni se ejecuta el JavaScript anterior `js/main.js`.

## Manifiesto e iconos

| Propiedad | Valor |
| --- | --- |
| `name` | `Felinaria: El Último Presagio` |
| `short_name` | `Felinaria` |
| `start_url` / `scope` | `./` / `./`, relativos a la ubicación de publicación |
| `display` | `standalone` |
| `theme_color` / `background_color` | `#15120D` / `#15120D` |
| `orientation` | `any` |
| `lang` | `es-MX` |

Los iconos `public/icons/icon-192.png` y `public/icons/icon-512.png` son PNG reales, con fondo de tinta, generados a partir del emblema proporcionado en `images/icono_felinaria.png`. Sus dibujos están centrados y dentro del círculo seguro de radio **40 %** del tamaño requerido para `purpose: "any maskable"` (radios máximos medidos: **37,52 %** y **37,02 %**, respectivamente). El mismo PNG original aparece junto a Felinaria en la cabecera y como favicon; `images/logo-felinaria.svg` y los tres bocetos originales se conservan.

El nombre breve **Felinaria** está disponible para el icono/acceso directo. Algunos navegadores muestran el `name` completo durante la instalación; debe comprobarse en el dispositivo de entrega qué etiqueta utiliza su interfaz.

## Service Worker, caché y actualizaciones

Al compilar, `felinariaOffline()` inserta en `dist/sw.js` una versión derivada del contenido y una lista de rutas relativas al ámbito. Incluye:

- `index.html` y `manifest.webmanifest`.
- Los dos iconos PNG de instalación.
- `images/icono_felinaria.png`, `images/logo-felinaria.svg` y los tres `boceto-*.svg`.
- Los ocho retratos de la sección Personajes (`aprendiz1.png` a `aprendiz4.png`, `maestro.png`, `rastrojo.png`, `rosa.png` y `perros-salvajes.png`).
- Las cuatro capturas de la sección Controles (`images/controles/movimiento-exploracion.jpg`, `combate-supervivencia.jpg`, `menus-interfaz.jpg` e `interaccion-dialogos.jpg`) **cuando existen** en el repositorio.
- El favicon PNG compilado, el JavaScript de React y el CSS compilado, con los hashes emitidos por Vite (los nombres cambian entre versiones).

La lista explícita de `images/` está en `vite.config.js`: si se utiliza una nueva imagen en la interfaz, se añade allí para publicarla con el mismo nombre y precargarla. Las capturas de controles se detectan automáticamente con `existsSync` y, si faltan, la interfaz muestra el marcador «Captura original pendiente de incorporar» sin enlaces rotos. **Nunca se cachea ningún archivo `.apk`**: el worker devuelve las peticiones locales de APK sin almacenarlas, para que la descarga futura vaya siempre por la red. No se cachean `node_modules`, `src/` ni archivos de desarrollo. La instalación comprueba todos los recursos locales antes de activar el worker. El worker también intenta descargar la hoja de Google Fonts y sus archivos de fuente; si el proveedor no responde, la instalación local continúa y las familias de respaldo mantienen el texto legible.

Para las navegaciones, el worker intenta la red y, si falla, responde con el `index.html` precargado. Los demás archivos usan la copia almacenada cuando existe. Una versión nueva activa el worker actualizado, elimina las cachés obsoletas con prefijo propio `felinaria-` y toma el control. `src/main.jsx` recarga **una sola vez** una pestaña que ya tenía un worker anterior, para mostrar el build nuevo. En desarrollo (`npm run dev`) no se registra el worker.

## Funcionamiento sin conexión

Después de abrir el build con Internet y esperar la activación del worker, se puede recargar offline la página inicial. El indicador discreto existente **«Sin conexión · contenido disponible sin Internet»** aparece al informar el navegador de desconexión y desaparece al reconectar. Se mantienen la navegación por las ocho secciones (incluidas **Controles** y **Descargables**), el menú móvil hasta 1140 px, el botón para abrir/cerrar la historia, los personajes con sus retratos y la galería de El aprendiz, las mecánicas, el logotipo y los tres bocetos de la galería. Con las capturas de controles publicadas, estas quedan en el precaché y su visor ampliado funciona sin conexión; los tutoriales de instalación de Descargables también son consultables offline. No se necesita una segunda página offline.

## Instalación y procedimiento de evaluación (Chrome y Brave)

1. En la carpeta del proyecto, ejecutar `npm run build` y `npm run preview`. Abrir **la dirección que indique Vite** (habitualmente `http://localhost:4173/`, pero cambiará si el puerto está ocupado) y confirmar que el título sea Felinaria. También se puede fijar un origen para la prueba con `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` y abrir `http://127.0.0.1:4173/`. Para pruebas de instalación fuera de `localhost`, publicar mediante **HTTPS**.
2. Abrir **F12 → Application → Manifest**. Revisar nombre completo, nombre corto, idioma, ruta inicial/ámbito, colores, `standalone`, orientación e iconos de 192 y 512 px; comprobar la vista previa maskable.
3. En **Application → Service Workers**, verificar `sw.js`, estado **activated** y que controle la página. Recargar una vez si acaba de instalarse.
4. En **Application → Cache Storage**, abrir `felinaria-…`: buscar HTML, manifiesto, iconos, logo PNG y SVG, bocetos, JS/CSS con hashes y, si hubo conexión al proveedor, las fuentes. En **Network**, comprobar que no haya respuestas 404.
5. En **Network**, activar **Offline**, recargar y recorrer Inicio, Historia, Personajes, Mecánicas, Controles, Galería, Descargables y Equipo. Abrir/cerrar historia y menú móvil; verificar el aviso, las imágenes y el diseño. Desactivar Offline y confirmar que el aviso desaparece y la página sigue funcionando.
6. En una ventana normal de Chrome, abrir **⋮ → Enviar, guardar y compartir → Instalar página como aplicación…**. El icono de instalación de la barra de direcciones solo aparece en algunos sitios; no es imprescindible. Abrir la aplicación instalada, comprobar el emblema del gato, el nombre mostrado por ese navegador y la ventana independiente (`standalone`). Repetir la consulta offline desde la aplicación instalada.

La instalación se realiza con el **icono de instalación de la propia barra de direcciones del navegador** (en Brave se identificó como «Instalar Felinaria: El Último Presagio») o desde el menú del navegador. La sección **Descargables** muestra, cuando el navegador emite `beforeinstallprompt`, el botón **«Instalar Felinaria Web»** junto al estado de instalación; sin ese evento muestra el tutorial paso a paso, sin simular una descarga. El control flotante en la esquina inferior derecha que existió inicialmente fue **retirado a petición del usuario**; no se modifica el icono de la barra del navegador. La instalación desaparece en modo `standalone` y durante la vista offline, para no tapar el contenido. En escritorio, `localhost` es un origen seguro para estas pruebas; en un teléfono se necesita un origen seguro publicado por HTTPS.

**Si no ves «Instalar página como aplicación…»:** comprueba que no estés en modo incógnito, confirma que la pestaña muestra Felinaria y no otro proyecto y recarga tras activarse `sw.js`. Si `localhost:4173` está ocupado, Vite puede asignar otro puerto; usa exactamente la dirección que imprime o el origen fijado `http://127.0.0.1:4173/` con el comando de arriba. Si ya se instaló en ese perfil de Chrome, revísalo en `chrome://apps`. En **Application → Manifest** y **Service Workers** comprueba los errores concretos si persiste el problema.

**En Brave de escritorio:** usa una ventana normal y la dirección exacta de Felinaria. Cuando aparezca **«Instalar Felinaria»** en la esquina inferior derecha, púlsalo para abrir el diálogo nativo. Si aparece **«Cómo instalar»**, el navegador no ha ofrecido el evento en esa visita: abre las indicaciones y prueba **menú principal (☰) → Guardar y compartir → Instalar [nombre de la aplicación]…**. Para consultar instalaciones anteriores, abre `brave://apps` o **Más herramientas → Mostrar aplicaciones**. Si falta la opción, comprueba el título y la URL (en esta máquina `localhost:4173` y `127.0.0.1:4173` corresponden a sitios distintos), recarga después de que se active `sw.js` y revisa **F12 → Application → Manifest / Service Workers**. [Guía oficial de Brave (español)](https://support.brave.app/hc/es/articles/39077114659597--C%C3%B3mo-instalo-y-uso-aplicaciones-web-en-Brave).

Si Brave muestra un **cuadrado con flecha hacia fuera (↗)** donde Chrome muestra el icono de instalar, ese es el **icono de instalación de la barra de direcciones**: en esta máquina su nombre accesible medido con UI Automation es **«Instalar Felinaria: El Último Presagio»** y pulsarlo abre el diálogo nativo. Comprueba el estado en `brave://apps`: en el perfil normal de esta máquina Felinaria **no** estaba instalada (solo aparecía «Fierro 40k - Recetario»). Si Brave dijera «Abrir en la aplicación», sería porque ese perfil ya la tiene instalada. Si allí figura otra aplicación, verifica la URL completa de la pestaña antes de instalar Felinaria; `localhost` y `127.0.0.1` no son el mismo origen.

## Evidencias para entregar

Las instrucciones y las capturas auténticas disponibles están en [`evidencias-pwa/README.md`](evidencias-pwa/README.md). Para completar la entrega, tomar capturas **reales** de las pestañas Manifest, Service Workers y Cache Storage de Chrome DevTools, del sitio con Offline activado y de la aplicación instalada. Las capturas automáticas incluidas muestran únicamente la página real en Chromium: no representan la interfaz de F12 ni una instalación nativa.

## Resultados de las pruebas realizadas

| Verificación | Resultado |
| --- | --- |
| `npm run build` con Vite 7 | Correcto; 30 módulos transformados y `dist/sw.js` generado. |
| `npm run preview` y carga de la página | Correctos; React muestra las ocho secciones y los recursos cargan sin errores HTTP. |
| Manifiesto y criterios técnicos de instalación | Una referencia al manifiesto, dos PNG válidos, colores/ámbito correctos; Chromium CDP `Page.getAppManifest` y `Page.getInstallabilityErrors` sin errores. |
| Registro y control del worker | Un registro, `activated`, controla la página. |
| Precaché | 20 recursos locales (HTML, manifiesto, iconos, cinco imágenes, ocho retratos de personajes, JS/CSS con hash) más las fuentes de Google cuando el proveedor responde; todas responden **200**, sin 404. Ningún `.apk` en la caché. |
| Sin conexión en `preview` | Recarga, imagen de cabecera, tres bocetos, fuentes, texto, CSS, menú móvil y botón de historia: correctos. El aviso aparece y desaparece al reconectar. |
| Actualización real entre builds | El worker nuevo reemplazó al anterior, dejó **una** caché vigente y se observó una sola recarga de actualización, sin bucle. |
| Publicación en subcarpeta | El build servido en `/dist/` mantuvo `start_url`, `scope` y contenido offline correctos. |
| **Instalación nativa aceptada en Brave** | **VERIFICADA de extremo a extremo**: perfil normal (no incógnito), `beforeinstallprompt` con `platforms: ["web"]`, botón «Instalar Felinaria», diálogo nativo pulsado («Instalar»), evento `appinstalled`, estado «Felinaria ya está instalada en esta ventana» y **ventana independiente** abierta con `display-mode: standalone` y título «Felinaria · El último presagio», sin errores JS. Captura en `evidencias-pwa/brave-instalacion-aceptada.png`; la ventana independiente se comprobó por `matchMedia('(display-mode: standalone)')` y su título «Felinaria · El último presagio» (el contenido de esa ventana es idéntico al de la captura, al no incluir las capturas de página el marco del navegador). |
| Causa del fallo anterior de instalación | Los contextos de navegador por defecto de la automatización se reportan como incógnito y `Page.getInstallabilityErrors` devolvió **`in-incognito`**: en ese estado Chrome/Brave no emiten `beforeinstallprompt`. Usando un perfil persistente (normal) el evento se emite y la instalación se completa. |
| Icono ↗ de Brave (pendiente anterior) | Resuelto: el elemento de la barra de direcciones se identificó como botón **«Instalar Felinaria: El Último Presagio»** (icono de instalación). `brave://apps` del perfil normal no listaba Felinaria. |
| Chrome 156, perfil normal frente a incógnito | Perfil normal: manifiesto sin errores, worker activo, `beforeinstallprompt` recibido y ningún error de instalabilidad. Sesión privada: Chrome respondió `in-incognito`, como se esperaba. |
| Brave 1.98, perfil normal | Manifiesto sin errores, sin errores de instalabilidad, `beforeinstallprompt` recibido, un worker activo, imágenes cargadas y recarga offline **200** servida por el worker; instalación nativa aceptada (fila 1 de esta tabla). |
| Menú responsive | Hamburguesa hasta **1140 px** (probado en 360, 390, 768, 820, 1024, 1025, 1100, 1140, 1141, 1280 y 1920 px): sin desplazamiento horizontal, navegación con ≥32 px de margen frente a la marca, menú desplazable en pantallas cortas y cierres por Escape, clic fuera y navegación correctos. |
| Sección Controles | 4 grupos con 2/2/4/3 acciones, teclas documentadas sin inventar comandos de mando y visor modal (abre, Escape cierra, foco vuelve al botón). |
| Imágenes de controles (mecanismo) | Probado con cuatro JPG temporales: las cuatro se renderizan, el visor las amplía (incluido el primer grupo), entran en el precaché (`images/controles/*.jpg`) y quedan visibles en recarga offline; retiradas después, la interfaz vuelve al marcador «Captura original pendiente de incorporar». **Faltan las capturas reales del usuario.** |
| Sección Descargables | PWA con estado e instalación reales; APK con estado «En desarrollo», botón deshabilitado y sin enlaces `.apk` (tampoco en la caché). Tutoriales expandibles verificados. |

## Problemas encontrados y soluciones

1. El manifiesto original usaba `name: "Felinaria"` y `lang: "es"`. Se ajustaron al nombre completo y a `es-MX`; el nombre corto se conservó.
2. Los iconos anteriores eran válidos pero representaban el SVG antiguo. El emblema PNG solicitado tenía contenido demasiado próximo al borde para usarlo sin margen maskable; se generaron los dos tamaños centrados con fondo original y área segura, y se actualizó el favicon y la cabecera.
3. El nuevo PNG no estaba en la lista explícita de imágenes de Vite. Se añadió a esa lista para servirlo y precargarlo junto con los SVG originales.
4. El sistema existente de Service Worker y manejo offline superó las pruebas de funcionamiento y actualización; **no fue reemplazado**.
5. En Brave de algunos perfiles no se mostraba una opción visible de instalación. Se añadió primero un control discreto flotante que llamaba a `beforeinstallprompt.prompt()` solo cuando Brave/Chrome ofrecía el evento; de otro modo presentaba «Cómo instalar» con una guía verificable. **Ese control flotante fue retirado después a petición del usuario** (prefiere el icono de instalación de la barra del navegador): la llamada al diálogo nativo vive ahora en el botón «Instalar Felinaria Web» de la sección Descargables, que se oculta sin evento y deja el tutorial como guía.
6. La aceptación nativa de la instalación seguía «pendiente» porque la automatización ejecutaba el navegador en un contexto que Chrome/Brave clasifican como **incógnito** (`in-incognito`), estado en el que no se emite `beforeinstallprompt`. Ejecutando Brave con un **perfil persistente normal** se recibió el evento, se pulsó «Instalar» en el diálogo nativo mediante automatización de la interfaz (UI Automation) y se confirmaron `appinstalled`, el estado en la interfaz y la ventana independiente.
7. El visor de controles no se abría cuando se ampliaba el **primer** grupo: la condición `if (!imagenAmpliada)` trataba el índice `0` como ausente. Se cambió a `imagenAmpliada === null` y la prueba cubre ahora abrir, cerrar con Escape y devolver el foco desde el primer grupo.
8. Ninguna de las cuatro capturas originales de controles existe todavía en el repositorio. La interfaz las detecta automáticamente en `public/images/controles/` (con los nombres `movimiento-exploracion.jpg`, `combate-supervivencia.jpg`, `menus-interfaz.jpg` e `interaccion-dialogos.jpg`); mientras falten se muestra el marcador de pendiente. El mecanismo se verificó con archivos temporales que se retiraron: **no se ha fabricado ningún contenido de imagen**.
