# Felinaria: actualización bilingüe, mecánicas e imágenes

## A. Archivos y arquitectura

| Archivo o carpeta | Cambio |
|---|---|
| `src/App.jsx` | Interfaz única con textos traducibles, cinco mecánicas, visores, cuatro pelajes seleccionables y regiones actualizadas. Se conservan menús, historia, controles, tutoriales y eventos de instalación. |
| `src/i18n/es.json`, `en.json` | Catálogos completos: navegación, 44 pasajes de la historia, personajes, mecánicas, controles, regiones, descargas, mensajes y accesibilidad. |
| `src/i18n/catalog.js` | Resolución por claves e interpolación, sin HTML inyectado. |
| `src/i18n/useLanguage.js` | Preferencia persistente, idioma inicial español, metadatos y conservación de la sección consultada al cambiar de idioma. |
| `src/main.jsx` | Mensaje de error del registro del worker localizado; se mantiene el registro de producción existente. |
| `src/image-metadata.json` | Ancho y alto de los 18 WebP a resolución original. |
| `css/style.css` | Selector dorado accesible, ajuste del menú a 1240 px, tarjetas visuales y demostración de apariencias, respetando movimiento reducido. Los retratos conservan altura automática y proporción 3:4 al añadir dimensiones HTML. |
| `vite.config.js` | Precaché de los WebP y bundle bilingüe; favicon/emblema importado una sola vez por Vite. |
| `index.html` | Favicon WebP y descripción coherente con combate de acción. |
| `images/*.webp` | 18 conversiones; las copias PNG redundantes se archivan después de verificar los respaldos. |
| `.gitignore` | Excluye `originales-locales/`. |
| `package.json`, `tests/content.test.js` | `npm test` con el runner nativo de Node, sin instalar bibliotecas. |
| `tools/optimize_images.py` | Conversión, inventario, respaldo, hashes, comprobación del alfa y archivo seguro de originales. |
| `reports/` | Inventario JSON y tabla de pesos en Markdown. |
| `README.md` | Instrucciones actuales de ejecución, idiomas, recursos y pruebas. |

## B. Sistema ES / EN

- Un solo árbol React; no se duplican páginas por idioma.
- Idioma inicial `es`; se recupera `en` cuando hay una preferencia válida guardada.
- `localStorage` usa la clave `felinaria-language`, con `try/catch` tanto al leer como al escribir. Si el almacenamiento está bloqueado, la sesión permite cambiar de idioma igualmente.
- Los botones tienen `aria-pressed`, nombres accesibles localizados y foco visible. En tablet/móvil se encuentran dentro del menú; los visores incluyen el mismo selector para cambiar de idioma sin cerrarlos.
- El cambio no recarga la página ni reinicia los acordeones, tutoriales, selección de pelaje o imagen del visor. Se compensa la posición de la sección visible cuando cambia la longitud del texto.
- Se actualizan `document.documentElement.lang`, título y metadescripción.
- Los resultados de instalación se guardan como estados (`accepted`, `cancelled`, `error`), no como frases; por ello se traducen incluso si ya estaban visibles antes del cambio.
- Los controles físicos mantienen sus asignaciones. Solo se localizan etiquetas e instrucciones: `Space` y `Espacio` representan la misma tecla.

## C. Cinco mecánicas y regiones

| Mecánica | Recursos del propio proyecto |
|---|---|
| Exploración e interacción | `dialogos-narrativos.webp`: investigación junto al río y objetivos de exploración. |
| Diálogos y personajes | `interaccion-npc.webp`: encuentro y conversación con el mentor. |
| Decisiones y moral | `moral.webp`: tres elecciones con consecuencias morales. |
| Combate y supervivencia | `combate.webp`: ataque durante un enfrentamiento de acción. |
| Crea tu protagonista | `crear-protagonista.webp` y `aprendiz1.webp` a `aprendiz4.webp`: blanco, gris, negro y siamés. |

Cada captura puede ampliarse y cuenta con texto alternativo traducido. La quinta tarjeta muestra una apariencia destacada y cuatro miniaturas. Es una demostración visual de la web, claramente identificada; no controla Unity ni añade opciones de personalización.

Se eliminaron de la interfaz y metadatos las referencias a combate por turnos y cuadrículas. Las cuatro regiones usan las descripciones solicitadas y los nombres ingleses **Sun Colony**, **Moon Colony**, **Tide Colony** y **Fang Pack**.

## D. Optimización y respaldos

La [tabla completa de los 18 archivos](reports/OPTIMIZACION_IMAGENES.md) detalla nombres originales y optimizados, formato, pesos y reducción. Los datos exactos, dimensiones y SHA-256 están en [image-optimization.json](reports/image-optimization.json).

**28 527 376 bytes → 3 586 734 bytes: reducción del 87,43 %.** Se utilizó WebP con calidad 86 sin disminuir las dimensiones. El canal alfa de todos los archivos se comparó píxel por píxel con su original; no se añadieron fondos opacos a las ilustraciones.

Originales: `originales-locales/20261105-112609/images/`. También hay una copia de los archivos principales anteriores al cambio en `originales-locales/20261105-112609/project-snapshot/`.

Se verificaron los respaldos antes de retirar los duplicados PNG de `images/`. Este directorio local está excluido de Git y nunca se publica en el build. Los únicos PNG del build son `icons/icon-192.png` y `icons/icon-512.png`; se mantienen los SVG originales. No hay dos copias del favicon/emblema en el build.

## E. PWA y caché bilingüe

Se conserva el Service Worker existente y su mecanismo de actualización. El plugin de Vite genera un hash a partir de HTML, worker, manifiesto, iconos, recursos y bundles. Cambiar imágenes, textos traducidos o código produce una nueva versión de caché. La activación elimina las versiones anteriores con el prefijo de Felinaria.

Los catálogos se importan en el bundle JavaScript, sin consultas a servicios externos. Se comprobó que el bundle cacheado contiene ambos idiomas y que las **18 imágenes WebP** se encuentran en Cache Storage, junto a los recursos esenciales. No se cachean respaldos ni APK.

Prueba ejecutada en `npm run preview`:

1. Abrir producción con conexión y esperar un worker activo que controle la página.
2. Comprobar manifiesto e iconos y la retirada de una caché antigua de prueba.
3. Seleccionar inglés, desconectar la red y recargar: la página continúa en inglés.
4. Alternar ES/EN sin conexión y abrir historia, controles y tutoriales.
5. Decodificar todas las imágenes, elegir los cuatro pelajes y utilizar los dos tipos de visor sin red.
6. Cerrar el perfil persistente del navegador y reabrirlo sin conexión: inglés se conserva.
7. Seleccionar español y recargar offline: español también se conserva.

Chromium no informó errores de instalabilidad mediante `Page.getInstallabilityErrors`. La sesión automatizada no emitió `beforeinstallprompt`, por lo que **no se afirma haber ejecutado una instalación nativa nueva**. Se probaron por eventos simulados las respuestas de aceptación, cancelación, error y `appinstalled`, incluyendo su traducción posterior.

## F. Validación y límites

- `npm test`: **4 pruebas aprobadas**: paridad de claves, pasajes completos, interpolaciones y teclas, mecánicas documentadas y recursos/dimensiones.
- `npm run build`: **correcto**, incluyendo después de archivar los originales.
- `npm run preview`: navegación y funcionalidad verificadas en la compilación de producción.
- ES y EN comprobados a **360, 390, 430, 768, 820, 1024, 1280, 1440 y 1920 px**, con zoom/escala al 100 %.
- Se revisaron capturas de escritorio, tablet y móvil, y se probaron visores a **740×320, 844×390 y 360×480**.
- Sin desplazamiento horizontal accidental, errores JavaScript ni respuestas HTTP locales de error durante la verificación.
- Persistencia tras recarga y reapertura del perfil, funcionamiento con almacenamiento bloqueado, metadatos, teclas, foco, estado de acordeones y selección de apariencias: correctos.
- Conservación de la posición de la región consultada al cambiar ES/EN desde el menú móvil, y `prefers-reduced-motion`: comprobados también con `npm run dev`.
- No se añadieron dependencias de ejecución. Pillow solo se necesita para volver a convertir originales, no para ejecutar o compilar la web.

### Revisión manual pendiente

- Confirmar el aviso y la instalación nativa en un navegador de escritorio compatible, y en dispositivos Android/iOS físicos; la automatización validó elegibilidad, worker, caché, eventos y persistencia, no una instalación nueva del sistema operativo.
- Revisión en Safari y Firefox reales; las pruebas de navegador se realizaron con Chromium.
- Las cinco capturas del juego contienen rótulos en español dibujados en la imagen. Se conservan intactos y se explica esta limitación con texto HTML en ambos idiomas.
- Los JPG opcionales de la sección Controles no estaban presentes en el proyecto. Se conserva su detección condicional, su visor y sus traducciones; las cinco mecánicas sí cuentan con capturas reales disponibles.

## Continuar trabajando

```sh
npm run dev
npm test
npm run build
npm run preview
```
