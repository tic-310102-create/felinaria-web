// No map coordinates: region memberships appear only where the game content confirms them.
export const WORLD_MAP = { file: 'mapa-felinaria.webp', textKey: 'map' };

export const WORLD_REGIONS = [
  { id: 'sun', views: [
    { file: 'colonia-sol.webp', textKey: 'original' },
    { file: 'aldea-del-sol.webp', textKey: 'sunVillage' },
  ] },
  { id: 'moon', views: [{ file: 'colonia-de-la-luna.webp', textKey: 'original' }] },
  { id: 'tide', views: [
    { file: 'colonia-del-oleaje.webp', textKey: 'original' },
    { file: 'colonia-del-oleaje-detalle.webp', textKey: 'tideSettlement' },
  ] },
  { id: 'fang', views: [
    { file: 'manada-del-colmillo.webp', textKey: 'original' },
    { file: 'guarida-del-gran-alfa.webp', textKey: 'alphaDen' },
  ] },
];

const variant = (file, size) => file.replace(/\.webp$/, `-${size}.webp`);

// Official progression of the eight playable levels, in order.
export const WORLD_LEVELS = [
  { id: 1, key: 'apprenticeCamp', file: 'aldea-del-sol.webp', region: 'sun' },
  { id: 2, key: 'borderCrossing', file: 'frontera-de-la-colonia.webp' },
  { id: 3, key: 'crossroadsPass', file: 'paso-de-la-encrucijada.webp' },
  { id: 4, key: 'sunColonyActTwo', file: 'colonia-sol.webp', region: 'sun' },
  { id: 5, key: 'whispersPath', file: 'sendero-de-los-murmullos.webp' },
  { id: 6, key: 'tideColony', file: 'colonia-del-oleaje-detalle.webp', region: 'tide' },
  { id: 7, key: 'brokenPass', file: 'el-paso-roto.webp' },
  { id: 8, key: 'greatAlphaDen', file: 'guarida-del-gran-alfa.webp', region: 'fang' },
].map((level) => ({ ...level, preview: variant(level.file, 768), thumbnail: variant(level.file, 240) }));

export const levelsForRegion = (regionId) => WORLD_LEVELS.filter((level) => level.region === regionId);

export const WORLD_NEW_IMAGES = [...new Set([
  WORLD_MAP.file,
  ...WORLD_LEVELS.map((level) => level.file),
  ...WORLD_REGIONS.flatMap((region) => region.views.slice(1).map((view) => view.file)),
])];
