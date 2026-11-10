import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const json = (name) => JSON.parse(readFileSync(new URL(name, root), 'utf8'));
const es = json('src/i18n/es.json');
const en = json('src/i18n/en.json');
const metadata = json('src/image-metadata.json');
const report = json('reports/rewards-image-optimization.json');

const REWARD_ITEMS = ['sword', 'morality', 'potion'];
const REWARD_IMAGES = ['espada-de-rosa.webp', 'barra-de-moral.webp', 'pocion-de-curacion.webp'];

test('both locales expose the rewards section with the definitive Spanish texts', () => {
  assert.ok(es.rewards && en.rewards);
  assert.equal(es.nav.rewards, 'Recompensas');
  assert.equal(en.nav.rewards, 'Rewards');
  assert.equal(es.rewards.title, 'Recompensas');
  assert.equal(en.rewards.title, 'Rewards');
  assert.equal(es.rewards.sword.name, 'Espada de Rosa');
  assert.equal(es.rewards.sword.label, 'Recompensa de combate');
  assert.equal(es.rewards.sword.condition, 'Derrotar a Rosa');
  assert.equal(es.rewards.sword.description,
    'Arma obtenida como recompensa después de derrotar a Rosa. Su característica rosa carmesí representa el enfrentamiento que marca una nueva etapa en la aventura del protagonista.');
  assert.equal(es.rewards.morality.name, 'Moral');
  assert.equal(es.rewards.morality.label, 'Progresión por buenas acciones');
  assert.equal(es.rewards.morality.value, '25/50');
  assert.equal(es.rewards.morality.description,
    'La moral aumenta cuando el protagonista realiza buenas acciones en beneficio de su colonia. Representa el impacto positivo de sus decisiones y su compromiso con la comunidad.');
  assert.equal(es.rewards.potion.name, 'Poción de curación');
  assert.equal(es.rewards.potion.label, 'Consumible');
  assert.equal(es.rewards.potion.value, '+25 PV');
  assert.equal(es.rewards.potion.source, 'Cofres del mapa');
  assert.equal(es.rewards.potion.description,
    'Objeto consumible que se encuentra dentro de los cofres distribuidos por los escenarios de Felinaria. Al utilizarla, restaura 25 puntos de vida al personaje, sin superar su salud máxima.');
  for (const locale of [es, en]) {
    for (const item of REWARD_ITEMS) {
      for (const key of ['name', 'label', 'description', 'alt']) {
        assert.ok(locale.rewards[item][key]?.trim(), `${item}.${key}`);
      }
    }
    for (const key of ['label', 'title', 'intro']) assert.ok(locale.rewards[key].trim(), key);
  }
});

test('reward artwork exists and is registered with its real dimensions', () => {
  assert.equal(report.length, REWARD_IMAGES.length);
  for (const file of REWARD_IMAGES) {
    assert.ok(existsSync(new URL(`images/${file}`, root)), file);
    const dims = metadata[file];
    assert.ok(dims && dims.width > 0 && dims.height > 0, file);
    const row = report.find((item) => item.optimized === `images/${file}`);
    assert.ok(row, file);
    assert.deepEqual(dims, { width: row.width, height: row.height });
    assert.ok(!existsSync(new URL(row.original, root)), `${row.original} should be archived`);
    assert.match(row.backup, /^originales-locales\//);
    assert.ok(existsSync(new URL(row.backup, root)), row.backup);
  }
});
