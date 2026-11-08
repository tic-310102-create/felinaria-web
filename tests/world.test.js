import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { WORLD_MAP, WORLD_REGIONS, WORLD_LEVELS, WORLD_NEW_IMAGES, levelsForRegion } from '../src/world-data.js';

const root = new URL('../', import.meta.url);
const json = (name) => JSON.parse(readFileSync(new URL(name, root), 'utf8'));
const metadata = json('src/image-metadata.json');
const report = json('reports/world-image-optimization.json');
const OFFICIAL_ORDER = [
  [1, 'apprenticeCamp'], [2, 'borderCrossing'], [3, 'crossroadsPass'], [4, 'sunColonyActTwo'],
  [5, 'whispersPath'], [6, 'tideColony'], [7, 'brokenPass'], [8, 'greatAlphaDen'],
];

test('all eight supplied world images are real WebP, full resolution and uniquely accounted for', () => {
  assert.equal(report.images.length, 8);
  assert.equal(new Set(report.images.map((row) => row.sha256Original)).size, 8);
  assert.equal(new Set(report.images.map((row) => row.sha256Pixels)).size, 8);
  const supplied = report.images.map((row) => row.optimized.split('/').at(-1));
  for (const file of supplied) {
    assert.equal(WORLD_NEW_IMAGES.filter((entry) => entry === file).length, 1, file);
    assert.ok(existsSync(new URL(`images/${file}`, root)));
    assert.ok(metadata[file]);
  }
  for (const file of WORLD_NEW_IMAGES) assert.ok(metadata[file], file);
  for (const row of report.images) {
    const data = readFileSync(new URL(row.optimized, root));
    assert.equal(data.toString('ascii', 0, 4), 'RIFF');
    assert.equal(data.toString('ascii', 8, 12), 'WEBP');
    assert.equal(data.length, row.optimizedBytes);
    assert.ok(row.optimizedBytes < row.originalBytes);
    assert.deepEqual(metadata[row.optimized.split('/').at(-1)], { width: row.width, height: row.height });
    assert.match(row.backup, /^originales-locales\//);
    assert.equal(row.format, 'JPEG');
  }
  assert.deepEqual(metadata[WORLD_MAP.file], { width: 880, height: 687 });
});

test('the four original regions and their art remain preserved as data', () => {
  assert.deepEqual(WORLD_REGIONS.map((r) => [r.id, r.views[0].file]), [
    ['sun', 'colonia-sol.webp'], ['moon', 'colonia-de-la-luna.webp'],
    ['tide', 'colonia-del-oleaje.webp'], ['fang', 'manada-del-colmillo.webp'],
  ]);
  assert.deepEqual(WORLD_REGIONS.map((r) => r.views.length), [2, 1, 2, 2]);
  for (const region of WORLD_REGIONS) for (const view of region.views) {
    assert.ok(existsSync(new URL(`images/${view.file}`, root)));
    assert.ok(metadata[view.file]);
  }
});

test('the eight official levels keep their fixed order and confirmed regions only', () => {
  assert.deepEqual(WORLD_LEVELS.map((level) => [level.id, level.key]), OFFICIAL_ORDER);
  assert.equal(new Set(WORLD_LEVELS.map((level) => level.file)).size, 8);
  assert.deepEqual(WORLD_LEVELS.map((level) => level.region),
    ['sun', undefined, undefined, 'sun', undefined, 'tide', undefined, 'fang']);
  for (const level of WORLD_LEVELS) {
    assert.equal(level.coordinates, undefined);
    if (level.region) assert.ok(['sun', 'moon', 'tide', 'fang'].includes(level.region));
  }
  assert.deepEqual(levelsForRegion('sun').map((level) => level.id), [1, 4]);
  assert.deepEqual(levelsForRegion('tide').map((level) => level.id), [6]);
  assert.deepEqual(levelsForRegion('fang').map((level) => level.id), [8]);
  assert.deepEqual(levelsForRegion('moon'), []);
  assert.equal(WORLD_LEVELS[7].file, 'guarida-del-gran-alfa.webp');
});

test('every level has full, preview and thumbnail artwork with matching proportions', () => {
  for (const level of WORLD_LEVELS) {
    const full = metadata[level.file];
    assert.ok(existsSync(new URL(`images/${level.file}`, root)));
    assert.ok(full.width > 0 && full.height > 0);
    for (const file of [level.preview, level.thumbnail]) {
      const size = metadata[file];
      assert.ok(existsSync(new URL(`images/${file}`, root)));
      assert.ok(size.width > 0 && size.height > 0 && size.width < full.width, file);
      assert.ok(Math.abs(size.width / size.height - full.width / full.height) < 0.01, file);
    }
  }
});

test('both languages describe the map, the eight levels and the viewer controls', () => {
  for (const code of ['es', 'en']) {
    const c = json(`src/i18n/${code}.json`);
    assert.ok(c.world.title && c.world.map.title && c.world.map.alt && c.world.imageError);
    assert.ok(c.world.map.description && c.world.map.open);
    // The mini chronicle label, caption and technical illustration note were retired.
    assert.equal(c.world.map.tagline, undefined, code);
    assert.equal(c.world.map.caption, undefined, code);
    assert.equal(c.world.artTextNote, undefined, code);
    for (const level of WORLD_LEVELS) {
      const copy = c.world.levels[level.key];
      assert.ok(copy && copy.title && copy.description && copy.alt, `${code} ${level.key}`);
    }
    for (const key of ['link', 'label', 'title', 'intro', 'open', 'openAria', 'viewerTitle', 'number', 'note']) {
      assert.ok(c.world.levels[key], `${code} ${key}`);
    }
    for (const key of ['zoomControls', 'zoomIn', 'zoomOut', 'fit', 'panLabel', 'help', 'viewCount']) assert.ok(c.world.viewer[key]);
    // The four-region presentation was retired: none of its copy may linger in either locale.
    assert.equal(c.gallery, undefined, code);
    assert.equal(c.world.regions, undefined, code);
    assert.equal(c.world.views, undefined, code);
    assert.equal(c.world.levels.regionLabel, undefined, code);
    assert.equal(c.world.map.legend, undefined, code);
    assert.equal(c.world.viewer.original, undefined, code);
  }
});

const OFFICIAL_ES = {
  apprenticeCamp: 'Lugar sagrado donde el Gran Roble cobija el adiestramiento inicial de los aprendices felinos y el Maestro Mentor custodia las tradiciones ancestrales (Nivel 1).',
  borderCrossing: 'Murallones y desfiladeros rocosos donde la Comandante Rosa y las avanzadas de la Manada del Colmillo intentan romper las defensas coloniales (Nivel 2).',
  crossroadsPass: 'Vasto cruce indómito donde el encuentro con el cachorro indefenso desata el dilema moral entre la piedad y la justicia colonial (Nivel 3).',
  sunColonyActTwo: 'El asentamiento principal en estado de emergencia, donde el Consejo de Líderes y el Gran Roble convocan la asamblea ante la inminente invasión canina (Nivel 4).',
  whispersPath: 'Espeso bosque penumbroso cubierto por densas brumas y criaturas hostiles que acechan las rutas intermedias del reino (Nivel 5).',
  tideColony: 'Asentamiento costero de pescadores y vigías marítimos donde el sabio Líder Costeño forja la alianza de resistencia felina (Nivel 6).',
  brokenPass: 'Puente colapsado y desfiladero derruido que cruza los abismos montañosos hacia las fortificaciones del territorio enemigo (Nivel 7).',
  greatAlphaDen: 'Bastión fortificado y cámara volcánica central donde el Gran Alfa Rastrojo aguarda para el enfrentamiento decisivo por Felinaria (Nivel 8).',
};

test('Spanish map chronicle and level descriptions match the definitive texts', () => {
  const es = json('src/i18n/es.json');
  assert.equal(es.world.map.title, 'El mundo de Felinaria');
  assert.equal(es.world.map.description,
    'El videojuego se desarrolla en un mundo de fantasía organizado en Colonias de gatos, con espacios destinados a la vida de la comunidad, entrenamiento y exploración. En este mapa se representan las principales regiones y colonias que conforman el mundo del videojuego, así como las rutas que conectan los distintos territorios. La Colonia del Sol funciona como el principal punto de partida del protagonista, mientras que las demás regiones permiten representar las relaciones comerciales, territoriales y políticas entre las diferentes comunidades.');
  for (const [key, description] of Object.entries(OFFICIAL_ES)) {
    assert.equal(es.world.levels[key].description, description, key);
  }
  const en = json('src/i18n/en.json');
  for (const key of Object.keys(OFFICIAL_ES)) assert.ok(en.world.levels[key].description.trim(), key);
});
