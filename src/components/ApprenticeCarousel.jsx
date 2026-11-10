import { useEffect, useState } from 'react';
import { Imagen } from './SiteMedia.jsx';
import { COATS } from '../apprentice.js';

const AUTOPLAY_INTERVAL = 5000;

export default function ApprenticeCarousel({ images, c, t, onOpen, suspended = false }) {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const total = images.length;
  const coat = c.mechanics.coats[COATS[index]];
  const running = auto && !suspended;
  const move = (step) => setIndex((current) => (current + step + total) % total);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const disable = (event) => { if (event.matches) setAuto(false); };
    query.addEventListener('change', disable);
    return () => query.removeEventListener('change', disable);
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % total), AUTOPLAY_INTERVAL);
    return () => window.clearInterval(timer);
  }, [running, total, index]);

  return (
    <div className="tarjeta-personaje__carrusel">
      <button type="button" className="tarjeta-personaje__galeria" aria-label={t('characters.viewGallery', { count: total })} onClick={(event) => onOpen(index, event)}>
        <span className="tarjeta-personaje__pista" style={{ transform: `translateX(-${index * 100}%)` }}>
          {images.map((file, position) => <Imagen key={file} archivo={file}
            alt={t('mechanics.appearanceAlt', { coat: c.mechanics.coats[COATS[position]] })}
            loading={position === 0 ? 'eager' : 'lazy'} className="tarjeta-personaje__slide"
            aria-hidden={position === index ? undefined : 'true'} />)}
        </span>
      </button>
      <button type="button" className="tarjeta-personaje__flecha tarjeta-personaje__flecha--anterior" aria-label={c.common.previous} onClick={() => move(-1)}>‹</button>
      <button type="button" className="tarjeta-personaje__flecha tarjeta-personaje__flecha--siguiente" aria-label={c.common.next} onClick={() => move(1)}>›</button>
      <div className="tarjeta-personaje__carrusel-pie">
        <p className="tarjeta-personaje__apariencia" role="status" aria-live={running ? 'off' : 'polite'}>{coat}</p>
        <div className="tarjeta-personaje__puntos" role="group" aria-label={c.mechanics.appearanceLabel}>
          {images.map((file, position) => <button key={file} type="button"
            aria-label={t('mechanics.selectCoat', { coat: c.mechanics.coats[COATS[position]] })}
            aria-pressed={position === index} onClick={() => setIndex(position)} />)}
        </div>
        <button type="button" className="tarjeta-personaje__autoplay" aria-label={`${auto ? c.mechanics.pauseAutoplay : c.mechanics.playAutoplay}. ${t('common.imageOf', { index: index + 1, count: total })}`} onClick={() => setAuto((value) => !value)}>
          <span className="tarjeta-personaje__cuenta" aria-hidden="true">{index + 1} / {total}</span>
          <span className={`tarjeta-personaje__autoplay-icono ${auto ? 'es-pausa' : 'es-play'}`} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
