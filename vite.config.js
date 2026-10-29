import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { apkConfig } from './src/descargables.js';

const root = fileURLToPath(new URL('.', import.meta.url));
// Si una imagen nueva pasa a formar parte de la interfaz, añadirla a esta lista.
const files = ['logo-felinaria.svg', 'icono_felinaria.png',
  'colonia-sol.png', 'colonia-de-la-luna.png', 'colonia-del-oleaje.png', 'manada-del-colmillo.png',
  'aprendiz1.png', 'aprendiz2.png', 'aprendiz3.png', 'aprendiz4.png',
  'maestro.png', 'rastrojo.png', 'rosa.png', 'perros-salvajes.png'];
const source = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)));
const capturasControles = ['movimiento-exploracion.jpg', 'combate-supervivencia.jpg', 'menus-interfaz.jpg', 'interaccion-dialogos.jpg'];
const capturasDisponibles = capturasControles.filter((nombre) =>
  existsSync(fileURLToPath(new URL(`public/images/controles/${nombre}`, import.meta.url))));
const apkArchivoPresente = existsSync(fileURLToPath(new URL(`public/${apkConfig.ruta}`, import.meta.url)));

// Mantiene los recursos originales con sus nombres, y genera un precaché con los nombres
// reales (incluidos los hashes) de CSS/JS que Vite produce en cada compilación.
function felinariaOffline() {
  return {
    name: 'felinaria-offline',
    apply: 'build',
    generateBundle(_options, bundle) {
      const hash = createHash('sha256');
      for (const file of ['index.html', 'sw.js', 'public/manifest.webmanifest',
        'public/icons/icon-192.png', 'public/icons/icon-512.png']) {
        hash.update(source(file));
      }

      for (const file of files) {
        const image = source(`images/${file}`);
        hash.update(image);
        this.emitFile({ type: 'asset', fileName: `images/${file}`, source: image });
      }

      // Public/ se copia al build: solo precargar capturas originales que ya existan.
      for (const nombre of capturasDisponibles) hash.update(source(`public/images/controles/${nombre}`));

      const buildFiles = Object.values(bundle).map((entry) => entry.fileName).sort();
      for (const entry of Object.values(bundle)) {
        hash.update(entry.type === 'chunk' ? entry.code : entry.source);
      }
      const precache = [
        'index.html', 'manifest.webmanifest',
        'icons/icon-192.png', 'icons/icon-512.png',
        ...files.map((file) => `images/${file}`),
        ...capturasDisponibles.map((nombre) => `images/controles/${nombre}`),
        ...buildFiles,
      ];
      const sw = source('sw.js').toString('utf8')
        .replace('__FELINARIA_VERSION__', hash.digest('hex').slice(0, 16))
        .replace('__FELINARIA_PRECACHE__', JSON.stringify([...new Set(precache)]));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: sw });
    },
  };
}

export default defineConfig({
  root,
  base: './',
  define: {
    __CONTROLES_IMAGENES__: JSON.stringify(capturasDisponibles),
    __APK_ARCHIVO_PRESENTE__: JSON.stringify(apkArchivoPresente),
  },
  plugins: [react(), felinariaOffline()],
});
