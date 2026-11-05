import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const json = (name) => JSON.parse(readFileSync(new URL(name, root), 'utf8'));
const es = json('src/i18n/es.json');
const en = json('src/i18n/en.json');

function leaves(value, path = '') {
  return Object.entries(value).flatMap(([key, item]) => {
    const name = path ? `${path}.${key}` : key;
    return typeof item === 'object' ? leaves(item, name) : [[name, item]];
  });
}

test('both locales cover every UI, tutorial and full-story key with nonempty text', () => {
  const spanish = new Map(leaves(es));
  const english = new Map(leaves(en));
  assert.deepEqual([...english.keys()].sort(), [...spanish.keys()].sort());
  assert.equal(Object.keys(es.story.passages).length, 44);
  for (const [key, text] of english) {
    assert.equal(typeof text, 'string', key);
    assert.ok(text.trim(), key);
    assert.ok(spanish.get(key).trim(), key);
  }
});

test('interpolation and actual keyboard tokens match across languages', () => {
  const spanish = new Map(leaves(es));
  for (const [key, text] of leaves(en)) {
    const tokens = (value) => (value.match(/\{\w+\}/g) ?? []).sort();
    assert.deepEqual(tokens(text), tokens(spanish.get(key)), key);
  }
});

test('gameplay copy describes action combat and five documented mechanics', () => {
  for (const copy of [es, en]) {
    assert.doesNotMatch(JSON.stringify(copy), /por turnos|cuadrícula|turn-based|grid-based/i);
    for (const key of ['exploration', 'dialogue', 'morality', 'combat', 'creation']) {
      assert.ok(copy.mechanics[key].title && copy.mechanics[key].description && copy.mechanics[key].alt);
    }
    assert.deepEqual(Object.keys(copy.mechanics.coats), ['white', 'gray', 'black', 'siamese']);
  }
});

test('all optimized full-resolution assets exist and retain their documented dimensions', () => {
  const metadata = json('src/image-metadata.json');
  const report = json('reports/image-optimization.json');
  assert.equal(report.length, 18);
  for (const row of report) {
    const name = row.optimized.split('/').at(-1);
    assert.ok(existsSync(new URL(row.optimized, root)), row.optimized);
    assert.deepEqual(metadata[name], { width: row.width, height: row.height });
    assert.ok(row.optimizedBytes < row.originalBytes, name);
    assert.match(row.backup, /^originales-locales\//);
  }
  // Installation icons remain PNG, with their original manifest sizes.
  const manifest = json('public/manifest.webmanifest');
  for (const icon of manifest.icons) assert.ok(existsSync(new URL(`public/${icon.src}`, root)));
});
