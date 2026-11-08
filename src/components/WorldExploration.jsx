import { useRef, useState } from 'react';
import { Imagen, imageURL } from './SiteMedia.jsx';
import WorldImageViewer from './WorldImageViewer.jsx';
import metadata from '../image-metadata.json';
import { WORLD_MAP, WORLD_LEVELS } from '../world-data.js';

const LEVEL_SIZES = '(max-width: 700px) calc(100vw - 2rem), (max-width: 991px) 44vw, (max-width: 1327px) 32vw, (max-width: 1720px) 23vw, 380px';

export default function WorldExploration({ language, changeLanguage, c, t }) {
  const [selection, setSelection] = useState(null);
  const [failed, setFailed] = useState({});
  const openerRef = useRef(null);

  const open = (next, event) => { openerRef.current = event.currentTarget; setSelection(next); };
  const openLevel = (index, event) => open({ type: 'level', index }, event);
  const imageStatus = (file, isFailed) => setFailed((current) => ({ ...current, [file]: isFailed }));

  const levelCopy = (level) => c.world.levels[level.key];
  const levelItems = WORLD_LEVELS.map((level) => {
    const copy = levelCopy(level);
    return { file: level.file, thumbnail: level.thumbnail, title: copy.title, alt: copy.alt, description: copy.description };
  });

  let viewer = null;
  if (selection?.type === 'map') {
    viewer = { items: [{ ...WORLD_MAP, title: c.world.map.title, alt: c.world.map.alt, description: c.world.map.description }], index: 0, title: c.world.map.title };
  } else if (selection?.type === 'level') {
    const level = WORLD_LEVELS[selection.index];
    viewer = { items: levelItems, index: selection.index, title: t('world.levels.viewerTitle', { number: level.id, name: levelCopy(level).title }) };
  }

  const onNavigate = (index) => setSelection((current) => ({ ...current, index }));

  return (
    <section id="galeria" className="seccion exploracion">
      <div className="seccion__cabecera exploracion__cabecera">
        <p className="seccion__numero">{c.world.label}</p>
        <h2 className="seccion__titulo">{c.world.title}</h2>
        <p className="seccion__texto">{c.world.intro}</p>
      </div>
      <nav className="atlas-index" aria-label={c.world.indexLabel}>
        <a href="#mundo-mapa">{c.world.map.link}</a><a href="#mundo-lugares">{c.world.levels.link}</a>
      </nav>

      <section id="mundo-mapa" className="atlas-map" aria-labelledby="atlas-map-title">
        <div className="atlas-map__title">
          <h3 id="atlas-map-title">{c.world.map.title}</h3>
        </div>
        <div className="atlas-map__art">
          <button className="atlas-map__open" type="button" aria-haspopup="dialog" aria-label={c.world.map.open} onClick={(event) => open({ type: 'map' }, event)} style={{ maxWidth: metadata[WORLD_MAP.file].width + 34 }}>
            <Imagen archivo={WORLD_MAP.file} alt={c.world.map.alt} loading="eager" fetchPriority="auto" onError={() => imageStatus(WORLD_MAP.file, true)} onLoad={() => imageStatus(WORLD_MAP.file, false)} />
            <span className="atlas-map__action">{c.world.map.open}<span aria-hidden="true">↗</span></span>
            {failed[WORLD_MAP.file] && <span className="atlas-image-error" role="status">{c.world.imageError}</span>}
          </button>
        </div>
        <div className="atlas-map__reading">
          <p>{c.world.map.description}</p>
        </div>
      </section>

      <section id="mundo-lugares" className="atlas-levels" aria-labelledby="atlas-levels-title">
        <div className="atlas-heading"><p className="atlas-eyebrow">{c.world.levels.label}</p><h3 id="atlas-levels-title">{c.world.levels.title}</h3><p>{c.world.levels.intro}</p></div>
        <ol className="levels-grid">
          {WORLD_LEVELS.map((level, index) => {
            const copy = levelCopy(level);
            return (
              <li className="level-card" id={`nivel-${level.id}`} key={level.id}>
                <button type="button" className="level-card__media" aria-haspopup="dialog"
                  aria-label={t('world.levels.openAria', { number: level.id, name: copy.title })}
                  onClick={(event) => openLevel(index, event)}>
                  <Imagen archivo={level.file}
                    srcSet={`${imageURL(level.preview)} ${metadata[level.preview].width}w, ${imageURL(level.file)} ${metadata[level.file].width}w`}
                    sizes={LEVEL_SIZES} alt={copy.alt}
                    onError={() => imageStatus(level.file, true)} onLoad={() => imageStatus(level.file, false)} />
                  <span className="level-card__number" aria-hidden="true">{String(level.id).padStart(2, '0')}</span>
                  <span className="level-card__action" aria-hidden="true">{c.world.levels.open}<span>↗</span></span>
                  {failed[level.file] && <span className="atlas-image-error" role="status">{c.world.imageError}</span>}
                </button>
                <div className="level-card__body">
                  <p className="level-card__meta">
                    <span>{t('world.levels.number', { number: level.id })}</span>
                  </p>
                  <h4>{copy.title}</h4>
                  <p>{copy.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
      {viewer && <WorldImageViewer {...viewer} language={language} changeLanguage={changeLanguage} c={c} t={t} onNavigate={onNavigate} onClose={() => setSelection(null)} openerRef={openerRef} />}
    </section>
  );
}
