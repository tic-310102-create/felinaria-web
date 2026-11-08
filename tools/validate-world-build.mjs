import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { WORLD_NEW_IMAGES } from '../src/world-data.js';
import { apkConfig } from '../src/descargables.js';

const root = new URL('../', import.meta.url);
const text = (path) => readFileSync(new URL(path, root), 'utf8');
const metadata = JSON.parse(text('src/image-metadata.json'));
const report = JSON.parse(text('reports/world-image-optimization.json'));
const sw = text('dist/sw.js');
const precache = JSON.parse(sw.match(/const PRECACHE = (\[[\s\S]*?\]);/)[1]);
const version = sw.match(/const CACHE_NAME = '([^']+)'/)[1];
assert.notEqual(version, report.baselineCache);
for (const file of Object.keys(metadata).filter((file) => file !== 'icono_felinaria.webp')) {
  assert.ok(precache.includes(`images/${file}`), `Missing cached image: ${file}`);
  const original = readFileSync(new URL(`images/${file}`, root));
  const published = readFileSync(new URL(`dist/images/${file}`, root));
  assert.deepEqual(published, original, `Published image changed: ${file}`);
}
for (const file of WORLD_NEW_IMAGES) assert.ok(precache.includes(`images/${file}`));
assert.ok(precache.some((file) => file.startsWith('assets/') && file.endsWith('.js')));
assert.ok(precache.some((file) => file.startsWith('assets/') && file.endsWith('.css')));
assert.ok(precache.includes('icons/icon-192.png') && precache.includes('icons/icon-512.png'));
assert.ok(!precache.some((file) => /originales-locales|\.jpe?g$|\.apk$/i.test(file)));
assert.ok(!readdirSync(new URL('dist/images/', root)).some((name) => /\.jpe?g$/i.test(name)));
assert.ok(!existsSync(new URL('dist/originales-locales/', root)));
const js = precache.filter((file) => file.endsWith('.js')).map((file) => text(`dist/${file}`)).join('\n');
assert.ok(js.includes('Explora Felinaria') && js.includes('Explore Felinaria'));
assert.ok(sw.includes("url.pathname.toLowerCase().endsWith('.apk')"));

// The real APK ships with the site but never enters the precache.
const apkPath = `dist/${apkConfig.ruta}`;
let apkPublished = false;
if (apkConfig.disponible) {
  const source = readFileSync(new URL(`public/${apkConfig.ruta}`, root));
  const published = readFileSync(new URL(apkPath, root));
  assert.equal(published.length, source.length, 'Published APK size differs from the original');
  assert.deepEqual(published, source, 'Published APK bytes differ from the original');
  assert.equal(source.toString('ascii', 0, 2), 'PK', 'The published APK is not a valid zip/APK');
  assert.ok(source.length > 1_000_000, 'The published APK is suspiciously small');
  apkPublished = true;
}
assert.ok(!precache.some((file) => file.toLowerCase().endsWith('.apk')));

// Existing lazy-loaded artwork stays available even while old clients receive the new worker.
let previousArtworkPreserved = null;
const baseline = `${report.backup}/baseline-dist/`;
if (existsSync(new URL(`${baseline}sw.js`, root))) {
  const oldPrecache = JSON.parse(text(`${baseline}sw.js`).match(/const PRECACHE = (\[[\s\S]*?\]);/)[1]);
  const images = oldPrecache.filter((file) => /\.(webp|png|svg)$/.test(file));
  for (const file of images) {
    assert.ok(precache.includes(file), `Previous client's artwork removed: ${file}`);
    const hash = (data) => createHash('sha256').update(data).digest('hex');
    assert.equal(hash(readFileSync(new URL(`${baseline}${file}`, root))), hash(readFileSync(new URL(`dist/${file}`, root))));
  }
  previousArtworkPreserved = true;
}
console.log(JSON.stringify({ version, resources: precache.length, cachedWebP: precache.filter((f) => f.endsWith('.webp')).length, newFullImages: WORLD_NEW_IMAGES.length, bilingualBundle: true, originalsPublished: false, apkPublished, apkExcludedFromPrecache: true, previousArtworkPreserved }, null, 2));
