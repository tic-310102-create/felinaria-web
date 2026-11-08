# Informe: mapa definitivo, ocho niveles y descarga APK

Sección `#galeria` simplificada a dos bloques —**El mundo de Felinaria** (mapa + crónica) y **Niveles del mapa** (ocho tarjetas)— con la presentación de las cuatro regiones retirada y la descarga real del APK de Android activada. Bilingüe (ES/EN), responsive de 320 a 1920 px y funcional sin conexión.

## 1. Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/components/WorldExploration.jsx` | Mapa a dos columnas (título→mapa→crónica→descripción) y eliminación total de la sección `atlas-regions` (estado `selectedRegion`, `openRegion`, visor de regiones, leyenda del mapa y chips de región de las tarjetas) |
| `css/world.css` | Grid de áreas `art/title/reading` 60/40 (≥901 px) y apilado título→mapa→crónica→descripción (≤900 px); retirados los estilos `.atlas-regions*`, `.atlas-region*`, `.atlas-map__legend*`, `.level-card__region` |
| `src/i18n/es.json` / `en.json` | Descripciones definitivas de los 8 niveles, textos del mapa (`tagline`/`description`), textos de descarga APK; eliminadas las claves ya no usadas: `gallery`, `world.regions`, `world.views`, `world.map.legend`, `world.levels.regionLabel`, `world.viewer.original` |
| `src/descargables.js` | `disponible: true` (el archivo real existe verificado) |
| `public/downloads/felinaria-android.apk` | APK real publicado (copia byte a byte de `APK_MOVIL_FELINARIA/FELINARIA.apk`) |
| `tests/world.test.js` | 2 pruebas ajustadas legítimamente por la sección eliminada + 1 nueva con los textos oficiales (total 10) |
| `tools/test_world_browser.py` | Aserciones de ausencia de regiones, `check_map_layout()`, descripciones exactas en tarjetas y visor, verificación HTTP del APK |
| `tools/test_world_offline.py` | Bucles de regiones sustituidos por niveles con descripciones; helper de reintento corregido (`Locator.wait_for_function` no existe en Python) |
| `tools/validate-world-build.mjs` | Comprueba APK en `dist/` idéntico al original y ausente del precaché |
| `tools/test_apk_crossbrowser.py` | Descarga real del APK y humo de interfaz (8 niveles + visor) en Chromium, Firefox y WebKit |
| `README.md`, `INFORME_REDISENO_MUNDO.md` | Documentación actualizada |

Sin cambios: `App.jsx`, `vite.config.js`, `sw.js` (ya excluía `.apk` de precaché y runtime), `world-data.js` (los datos de regiones se conservan como datos, sin renderizar).

## 2. Componentes eliminados o ajustados

- **Eliminados**: bloque `#mundo-regiones` completo (encabezado «Cuatro regiones, un mundo compartido», 4 tarjetas con imagen/nombre/descripción, botones «Explorar región», subniveles con miniaturas, visor de regiones con sus 7 vistas), enlace `#mundo-regiones` del índice `atlas-index`, leyenda de regiones del mapa y chip de región en cada tarjeta de nivel.
- **Ajustados**: `WorldExploration` (dos modales disponibles: mapa y niveles), tarjetas de nivel (meta «Nivel N» sin chip), índice del atlas (Mapa · Niveles).
- **Conservados**: `WORLD_REGIONS` y sus imágenes WebP (datos y recursos en el repositorio y en el precaché; sin enlaces rotos porque ya no se referencian), visor con zoom/pan, foco y ciclado entre niveles.

## 3. Resultado del nuevo diseño del mapa

- **Escritorio (≥901 px)**: dos columnas ≈60/40 — izquierda `images/mapa-felinaria.webp` con marco dorado fino, sombra ambiental, proporciones originales (sin recorte ni deformación, tope de ancho a su resolución) y botón que lo abre en el visor; derecha: **El mundo de Felinaria** · *Crónica del territorio* · descripción exacta + nota de rótulos.
- **Móvil/tablet (≤900 px)**: una sola columna en el orden título → mapa → crónica → descripción; el texto nunca excede el ancho de pantalla (0 desbordamientos verificados).
- Sin listado de regiones, sin tarjetas de regiones, sin marcadores inventados.

## 4. Confirmación de los ocho niveles y sus descripciones

Orden 1→8 correcto, imágenes exactas y descripciones literales (asertadas por `npm test` y por navegador en ES; traducidas naturalmente en EN):

1. Campamento de Aprendices — `aldea-del-sol.webp` — «Lugar sagrado donde el Gran Roble cobija… (Nivel 1).»
2. Cruce de Frontera — `frontera-de-la-colonia.webp` — «Murallones y desfiladeros rocosos… (Nivel 2).»
3. Paso de la Encrucijada — `paso-de-la-encrucijada.webp` — «Vasto cruce indómito… (Nivel 3).»
4. Colonia del Sol (Acto II) — `colonia-sol.webp` — «El asentamiento principal en estado de emergencia… (Nivel 4).»
5. Sendero de Murmullos — `sendero-de-los-murmullos.webp` — «Espeso bosque penumbroso… (Nivel 5).»
6. Colonia de Oleaje — `colonia-del-oleaje-detalle.webp` — «Asentamiento costero de pescadores… (Nivel 6).»
7. El Paso Roto — `el-paso-roto.webp` — «Puente colapsado y desfiladero derruido… (Nivel 7).»
8. Guarida del Gran Alfa — `guarida-del-gran-alfa.webp` — «Bastión fortificado y cámara volcánica central… (Nivel 8).»

Cada tarjeta: numeración 01–08, imagen 4/3 `cover` con variantes 768/full, título, descripción completa sin recortes y acción «Ver escenario ↗». El visor muestra el nombre y la descripción completos, permite ampliar/paneir y navegar entre los 8 niveles; el foco se restaura al cerrar.

## 5. Cambios en traducciones

- ES: textos exactos exigidos (8 descripciones, «El mundo de Felinaria», «Crónica del territorio», crónica literal) + textos APK («Descargar APK para Android», descripción de descarga, tutorial ajustado al archivo real `felinaria-android.apk`).
- EN: traducciones naturales de todo lo anterior (p. ej. «Chronicle of the Territory», «…the wild lands of the omen…» alineado con «Felinaria – The Last Omen»).
- Paridad estricta ES/EN verificada por `content.test.js` (mismas claves, mismos tokens); claves eliminadas solo cuando ninguna vista las usaba (sin errores en consola ni `undefined` renderizados).

## 6. Resultado responsive

- 12 anchos pedidos (320…1920) × 2 idiomas + **85 anchos intermedios por idioma**: 0 desbordamientos horizontales, columnas correctas de niveles (4/2/1) y layout de mapa 2 col ≥901 / 1 col ≤900 con orden título→mapa→crónica verificado.
- Landscape (568×320 … 1920×500), táctil real (menú, mapa, niveles, navegación del visor), `prefers-reduced-motion`, botón APK con target de 48 px (`min-height: 3rem`), menú móvil y selector ES/EN operativos, fallback localizado de imagen.
- Capturas clave: `%TEMP%\opencode\felinaria-world-qa\` (revisadas: mapa 1440/390 y cuadrícula 1440).

## 7. Estado offline

- PWA conservada íntegramente: actualización con cliente cálido y frío, caché nueva `felinaria-7e6ba23e8b4ebc19` (42 WebP; mapa, 8 niveles, variantes 768/240), sin JPEG/`originales-locales`/`.apk` en la caché.
- Sin red: mapa + crónica, visores con sus descripciones, 8 niveles ES/EN, preferencia de idioma persistente, instalabilidad sin errores, 0 errores de consola. El service worker ignora `.apk` (precache y runtime): la web funciona offline y la descarga APK requiere conexión.

## 8. Ubicación exacta del APK

- Origen: `APK_MOVIL_FELINARIA/FELINARIA.apk` (conservado intacto como copia original).
- Publicado en: `public/downloads/felinaria-android.apk` → llega a `dist/downloads/felinaria-android.apk` en el build.
- Configuración: `src/descargables.js` → `disponible: true`, `ruta: 'downloads/felinaria-android.apk'`.

## 9. Tamaño del APK

- **38.371.606 bytes (≈36,6 MiB)**; SHA-256 `8a9d768a2d8f4bd239f9d09576fd31cd8e9d1300281838fee81c48d30786a90b` idéntico en origen, publicado y `dist/`.
- Estructura verificada: cabecera `PK`, 1.191 entradas, `zipfile.testzip()` sin errores, `AndroidManifest.xml`, `classes.dex`, `resources.arsc` y `META-INF/` presentes.
- **Firma criptográfica verificada** con `apksigner verify --verbose` (código de salida 0): esquema **v2 verdadero** (v1, v3, v3.1, v3.2 y v4 falsos), 1 firmante, certificado `C=US, O=Android, CN=Android Debug` (firma de **depuración**), SHA-256 del certificado `6f4fec37e614b5f02be92f501d2f54a0807fbb5dff57f586b8d44acd77e445fe`.
- **Compatibilidad** con `aapt2 dump badging`: paquete `com.utnay.felinaria`, versionCode 1, versionName 1.0.0, **minSdkVersion 26 (Android 8.0.0)**, targetSdkVersion 36, ABI nativas `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`, etiquetas ES «Felinaria: El Último Presagio» / EN «Felinaria: The Last Omen».

## 10. Comprobación de descarga

- `GET /downloads/felinaria-android.apk` sobre el preview → **200**, cuerpo `PK…` de 38.371.606 bytes (no es una página HTML de error).
- El botón muestra «Disponible», es un enlace `<a download>` con `download="felinaria-android.apk"` y etiqueta «Descargar APK para Android»; sin conexión queda deshabilitado con «Descarga no disponible sin conexión». El APK **no** entra en el precaché (verificado por `test:build` y por la prueba offline).
- **Tres motores de navegador**: `tools/test_apk_crossbrowser.py` descarga el archivo real desde el botón en **Chromium, Firefox y WebKit** (`expect_download`): 38.371.606 bytes con SHA-256 idéntico en los tres, además de 8 niveles y visor operativos. Informe: `reports/world-crossbrowser-validation.json`.

## 11. `npm test`

**10/10 en verde** (4 de contenido/idiomas + 6 de mundo: WebP, datos de regiones, orden oficial, variantes, paridad ES/EN sin claves regionales y texto oficial ES).

## 12. `npm run build`

Build correcto (≈2,5 s); versión de caché `felinaria-7e6ba23e8b4ebc19`. `npm run test:build` → `resources: 49, cachedWebP: 42, apkPublished: true, apkExcludedFromPrecache: true, previousArtworkPreserved: true`. Pruebas de navegador y offline completas en verde (informes en `reports/world-browser-validation.json` y `reports/world-offline-validation.json`, con `consoleErrors: []`, `httpErrors: []`, `regionsRetired: true`, `apkPublished: true`). `tools/test_apk_crossbrowser.py` en verde con Chromium, Firefox y WebKit (`reports/world-crossbrowser-validation.json`).

## 13. Pruebas pendientes

Completadas en la ejecución final:

- **Firma verificada**: `apksigner verify --verbose` → esquema **v2 verdadero** (v1/v3/v3.1/v3.2/v4 falsos), 1 firmante, certificado de depuración `CN=Android Debug` (SHA-256 `6f4fec37e614b5f02be92f501d2f54a0807fbb5dff57f586b8d44acd77e445fe`), código de salida 0.
- **Compatibilidad declarada**: `minSdkVersion 26` (Android 8.0), `targetSdkVersion 36`, ABIs arm64-v8a/armeabi-v7a/x86/x86_64 (`aapt2 dump badging`).
- **Instalación y arranque reales en Android 13 (API 33, emulador Pixel_7)**: `adb install -r` → `Success`; `pm path` y `firstInstallTime` confirmados; la app arranca (`SplashActivity` en primer plano, proceso activo), el splash completo se renderiza —logo, «FELINARIA · EL ÚLTIMO PRESAGIO», «Verificando colonia — 100 %», botón «Entrar a la colonia»— y `logcat` no registra `FATAL EXCEPTION`. Captura limpia: `%TEMP%\opencode\felinaria-world-qa\apk-emulator-splash.png`. Nota: el System UI del emulador (renderizado por software) emite su propio diálogo ANR que no es imputable al APK.
- **Descarga en tres motores**: Chromium, Firefox y WebKit descargan el APK byte a byte con SHA-256 idéntico y la interfaz responde (ver §10).
- Se corrigió durante la ejecución un fallo del helper de reintento de imágenes offline (`Locator.wait_for_function` no existe en la API Python de Playwright); la prueba pasó tras sustituirlo por una espera con `evaluate`.

Siguen pendientes (no disponibles en este entorno):

- Instalación en un **dispositivo Android físico** (flujo de permisos «instalar apps de origen desconocido»).
- **Safari/iOS**: WebKit de escritorio ya está probado, pero el navegador iOS no puede ejecutarse aquí.
- **Certificado de release**: la firma actual es de depuración (`Android Debug`); para distribuir fuera de pruebas debe re-firmarse con una clave propia.

No se realizaron commits ni push: todo queda en el árbol de trabajo (`git status`).
