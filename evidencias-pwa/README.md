# Evidencias reales para la entrega de Felinaria

Las capturas automáticas de esta carpeta provienen de **Chromium ejecutando el build real mediante `npm run preview`**. Muestran la página con conexión y sin conexión; no simulan Chrome DevTools ni una instalación nativa.

Capturas obtenidas de la página real:

- `sitio-en-linea.png`: recorrido completo de las ocho secciones.
- `sitio-offline.png`: inicio con el aviso de desconexión.
- `galeria-offline.png`: los tres bocetos cargados sin Internet.
- `sitio-offline-movil.png`: vista móvil sin conexión.
- `menu-offline-movil.png`: menú móvil desplegado sin conexión.
- `brave-en-linea.png` y `brave-offline.png`: página real abierta en Brave, antes y después de desconectar el navegador.
- `brave-instalar-disponible.png` y `chrome-instalar-disponible.png`: el botón real «Instalar Felinaria» cuando cada navegador ofrecía su diálogo nativo. **Captura histórica**: ese control flotante de la esquina inferior derecha fue retirado a petición del usuario; hoy la instalación se lanza desde el icono de la barra de direcciones del navegador o desde el botón «Instalar Felinaria Web» de la sección Descargables.
- `brave-ayuda-instalacion.png`: instrucciones que mostraba el control retirado si Brave no ofrecía el evento de instalación en esa visita (también histórica; la guía equivalente vive ahora en «Ver tutorial de instalación» de Descargables).
- `brave-instalacion-aceptada.png`: estado «Felinaria ya está instalada en esta ventana» en la sección Descargables **después de aceptar el diálogo nativo de Brave** (instalación real, no simulada; la aceptación se confirmó mediante automatización de la interfaz del navegador y el evento `appinstalled`). La ventana independiente de la aplicación se comprobó con `display-mode: standalone` y su título «Felinaria · El último presagio».

## Capturas que debes hacer manualmente en Chrome

Primero ejecuta `npm run build`, luego `npm run preview` y abre **la dirección que muestre Vite** (normalmente `http://localhost:4173/`; si está ocupado, Vite puede elegir otro puerto). Confirma que la página dice Felinaria. Espera unos segundos a que `sw.js` termine de instalarse, recarga la página y pulsa **F12**.

1. **Manifest** (`01-manifest-chrome.png`): en **Application → Manifest**, muestra `name`, `short_name`, `start_url`, `scope`, `standalone`, colores, orientación, idioma e iconos. Si hace falta, toma una segunda captura desplazándote dentro del panel.
2. **Service Workers** (`02-service-worker-chrome.png`): en **Application → Service Workers**, muestra el registro `sw.js`, su estado **activated** y que controla la página. No marques *Bypass for network* durante la prueba offline.
3. **Cache Storage** (`03-cache-storage-chrome.png`): en **Application → Cache Storage → felinaria-…**, muestra `index.html`, manifiesto, iconos, logo, bocetos y archivos `assets/` de CSS y JS.
4. **Sitio offline** (`04-offline-chrome.png`): en **Network** activa **Offline**, recarga y deja visibles el sitio, el aviso «Sin conexión…» y la opción Offline de DevTools. Verifica también menú, historia y galería. En esta carpeta ya se incluyen capturas automáticas auténticas de la página online y offline, pero la captura con el panel Network visible debes tomarla tú.
5. **Aplicación instalada** (`05-instalacion-chrome.png`): desactiva Offline y, en una ventana normal de Chrome, abre **⋮ → Enviar, guardar y compartir → Instalar página como aplicación…**. El icono de instalación de la barra no siempre aparece. Abre la aplicación instalada y captura su ventana independiente y el icono/nombre que le asignó Chrome. Si el navegador usa el nombre largo del manifiesto, consérvalo en la evidencia; `short_name` es «Felinaria».

Guarda aquí los PNG obtenidos en Chrome sin retocarlos ni sustituirlos por montajes. Si se evalúa en móvil, toma también una captura adicional de la aplicación instalada y funcionando sin conexión en el teléfono. Consulta el detalle de pruebas y la rúbrica en [`../DOCUMENTACION_PWA_FELINARIA.md`](../DOCUMENTACION_PWA_FELINARIA.md).

Para acreditar la instalación **en Brave**, ya existe una verificación automática completa registrada en [`../DOCUMENTACION_PWA_FELINARIA.md`](../DOCUMENTACION_PWA_FELINARIA.md): en un perfil normal (no incógnito) se recibió `beforeinstallprompt`, se pulsó «Instalar» en el diálogo nativo, se confirmó `appinstalled` y se abrió la ventana independiente. Puedes repetirlo manualmente con el **icono de instalación de la barra de direcciones** o con el botón **«Instalar Felinaria Web»** de la sección Descargables (visible solo cuando el navegador ofrece el evento). Si no aparece, usa el tutorial «Ver tutorial de instalación». No uses una ventana privada: en incógnito Chrome/Brave responden `in-incognito` y no emiten el evento. Para ver la app registrada, abre `brave://apps`.

Si Brave muestra un icono de **cuadrado con flecha ↗** en la barra de direcciones, ese es el **icono de instalación**: su nombre accesible medido en esta máquina es «Instalar Felinaria: El Último Presagio» y pulsarlo abre el diálogo nativo. Si el navegador dice «Abrir en la aplicación», entonces Felinaria ya está instalada en ese perfil: compruébalo en `brave://apps`. Revisa también la URL exacta de la pestaña.
