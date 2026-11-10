import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { APPRENTICE_IMAGES, COATS } from '../src/apprentice.js';

const root = new URL('../', import.meta.url);
const json = (name) => JSON.parse(readFileSync(new URL(name, root), 'utf8'));
const metadata = json('src/image-metadata.json');
const report = json('reports/apprentice-image-optimization.json');
const es = json('src/i18n/es.json');
const en = json('src/i18n/en.json');

test('the four official coats use the correct apprentice artwork', () => {
  assert.deepEqual(COATS, ['white', 'gray', 'black', 'siamese']);
  assert.deepEqual(APPRENTICE_IMAGES, ['aprendiz1.webp', 'aprendiz2.webp', 'aprendiz3.webp', 'aprendiz5.webp']);
  assert.equal(APPRENTICE_IMAGES.length, COATS.length);
  assert.ok(!APPRENTICE_IMAGES.includes('aprendiz4.webp'));
  assert.equal(APPRENTICE_IMAGES.at(-1), 'aprendiz5.webp');
});

test('apprentice and E10+ artwork is registered, emitted as WebP and archived', () => {
  for (const file of [...APPRENTICE_IMAGES, 'E10+.webp']) {
    const dims = metadata[file];
    assert.ok(dims && dims.width > 0 && dims.height > 0, file);
    const data = readFileSync(new URL(`images/${file}`, root));
    assert.equal(data.subarray(0, 4).toString(), 'RIFF', file);
    assert.equal(data.subarray(8, 12).toString(), 'WEBP', file);
  }
  assert.deepEqual(metadata['aprendiz5.webp'], { width: 1087, height: 1447 });
  assert.deepEqual(metadata['E10+.webp'], { width: 439, height: 662 });
  assert.equal(report.length, 1);
  assert.equal(report[0].optimized, 'images/aprendiz5.webp');
  assert.ok(!existsSync(new URL(report[0].original, root)), 'the original PNG is archived');
  assert.match(report[0].backup, /^originales-locales\/characters-\d{8}-\d{6}\/images\/aprendiz5\.png$/);
  assert.ok(existsSync(new URL(report[0].backup, root)), report[0].backup);
});

test('the E10+ rating replaces the textual classification in both languages', () => {
  assert.equal(es.hero.rating, 'Clasificación E10+');
  assert.equal(en.hero.rating, 'Rated E10+');
});
