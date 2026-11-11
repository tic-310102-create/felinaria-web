import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { requirementRows, specRows, teamMembers } from '../src/showcase-data.js';

const root = new URL('../', import.meta.url);
const json = (name) => JSON.parse(readFileSync(new URL(name, root), 'utf8'));
const es = json('src/i18n/es.json');
const en = json('src/i18n/en.json');
const app = readFileSync(new URL('src/App.jsx', root), 'utf8');
const requirements = readFileSync(new URL('src/components/SystemRequirements.jsx', root), 'utf8');
const team = readFileSync(new URL('src/components/DevelopmentTeam.jsx', root), 'utf8');

test('development team keeps the six documented members in alphabetical order', () => {
  const expected = [
    ['Aldair Alejandro Ramos Díaz', 'Desarrollador Android y Firebase'],
    ['Brandon Eduardo Bernal Hernández', 'Desarrollador web y PWA'],
    ['Diana Laura Bernal Arias', 'Product Owner y diseñadora conceptual y narrativa'],
    ['Gilberto Alonso Mendoza Salas', 'Diseñador conceptual de personajes y objetos'],
    ['José Carlos Topete Sánchez', 'Programador de videojuegos Unity'],
    ['Sherlyn Vanessa Rosales García', 'Diseñadora UI/UX'],
  ];

  assert.equal(teamMembers.length, 6);
  assert.deepEqual(teamMembers.map((member) => member.id), ['aldair', 'brandon', 'diana', 'gilberto', 'jose-carlos', 'sherlyn']);
  assert.deepEqual(teamMembers.map((member) => [es.team.members[member.id].name, es.team.members[member.id].role]), expected);
  assert.deepEqual(teamMembers.map((member) => en.team.members[member.id].name), expected.map(([name]) => name));
  assert.equal(new Set(teamMembers.map((member) => member.initials)).size, 6);

  for (const member of teamMembers) {
    for (const group of member.groups) {
      assert.ok(es.team.members[member.id].groups[group].length > 0, `${member.id}.${group}`);
      assert.ok(en.team.members[member.id].groups[group].length > 0, `${member.id}.${group} EN`);
    }
  }

  const diana = teamMembers.find((member) => member.id === 'diana');
  assert.deepEqual(diana.groups, ['product', 'narrative']);
  assert.equal(es.team.members.diana.groups.narrative.length, 5);
  assert.match(es.team.members.diana.groups.narrative.join(' '), /cinco variantes de pieles/);
  assert.equal(es.team.members.gilberto.groups.responsibilities.length, 4);
  assert.match(es.team.members.gilberto.groups.responsibilities.join(' '), /animaciones de los personajes/);
  assert.match(en.team.members.gilberto.groups.responsibilities.join(' '), /character animations/);
  assert.equal(es.team.count, '6 integrantes');
  assert.equal(en.team.count, '6 members');
  assert.equal(es.team.title, 'EL EQUIPO DETRÁS DE FELINARIA');
  assert.equal(en.team.title, 'THE TEAM BEHIND FELINARIA');
  assert.match(team, /id="equipo"/);
  assert.match(app, /<DevelopmentTeam copy=\{c\.team\} \/>/);
});

test('system requirements use the project technical baseline and proportional estimates', () => {
  assert.deepEqual(specRows, ['name', 'genre', 'engine', 'size', 'platforms', 'distribution']);
  assert.deepEqual(requirementRows.map((row) => row.id), ['os', 'cpu', 'ram', 'gpu', 'storage', 'architecture', 'internet']);
  assert.deepEqual([...new Set(requirementRows.map((row) => row.status))].sort(), ['estimate', 'project', 'verified']);
  assert.equal(requirementRows.find((row) => row.id === 'architecture').status, 'verified');
  assert.equal(requirementRows.find((row) => row.id === 'internet').status, 'verified');

  assert.equal(es.requirements.title, 'Requisitos del sistema');
  assert.equal(es.requirements.specs.engine.value, 'Unity 6 · 6000.3.25f1');
  assert.equal(es.requirements.specs.size.value, '≈ 400 MB');
  assert.equal(es.requirements.specs.size.note, 'Tamaño de la build de Windows: 401.948.503 B (383 MiB).');
  assert.match(es.requirements.specs.platforms.note, /No existe una build Android del videojuego/);
  assert.equal(es.requirements.statuses.project, 'Base técnica del proyecto');
  assert.equal(en.requirements.statuses.project, 'Project technical baseline');
  assert.equal(es.requirements.statuses.pending, undefined);
  assert.equal(en.requirements.statuses.pending, undefined);
  assert.equal(es.nav.requirements, 'Requisitos');
  assert.equal(en.nav.requirements, 'Requirements');

  for (const row of requirementRows) {
    assert.ok(es.requirements.components[row.id]);
    assert.ok(es.requirements.rows[row.id].minimum);
    assert.ok(es.requirements.rows[row.id].recommended);
  }

  assert.match(es.requirements.rows.os.minimum, /Windows 10 21H1/);
  assert.match(es.requirements.rows.cpu.minimum, /i3-6100/);
  assert.equal(es.requirements.rows.ram.minimum, '4 GB de RAM.');
  assert.match(es.requirements.rows.gpu.minimum, /DirectX 12/);
  assert.match(es.requirements.rows.internet.minimum, /modo invitado local/);
  assert.doesNotMatch(es.requirements.minimumNote, /se completarán|pendiente/i);
  assert.doesNotMatch(es.requirements.sourceNote, /se completarán|pendiente/i);
  assert.match(requirements, /id="requisitos"/);
  assert.match(app, /<SystemRequirements copy=\{c\.requirements\} \/>/);
  assert.doesNotMatch(app, /Bernal Arias Diana Laura|pie__equipo/);
});
