import { useLayoutEffect, useRef, useState } from 'react';
import { Imagen, SelectorIdioma } from './SiteMedia.jsx';
import metadata from '../image-metadata.json';

export default function WorldImageViewer({ items, index, title, description, onNavigate, onClose, openerRef, language, changeLanguage, c, t }) {
  const dialogRef = useRef(null);
  const stageRef = useRef(null);
  const closeRef = useRef(null);
  const drag = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 1, height: 1 });
  const [userScale, setUserScale] = useState(null);
  const [failed, setFailed] = useState(null);
  const item = items[index];
  const dimensions = metadata[item.file];
  const stageAspect = useRef(dimensions.width / dimensions.height);
  const fit = Math.min(1, stageSize.width / dimensions.width, stageSize.height / dimensions.height);
  const scale = userScale === null ? fit : Math.max(fit, userScale);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const body = document.body;
    const previousOverflow = body.style.overflowY;
    body.style.overflowY = 'hidden';
    dialog.showModal();
    // showModal() takes focus before React's autofocus runs: park it on the close button.
    closeRef.current?.focus({ preventScroll: true });
    setStageSize({ width: stageRef.current.clientWidth, height: stageRef.current.clientHeight });
    return () => {
      if (dialog.open) dialog.close();
      body.style.overflowY = previousOverflow;
      openerRef.current?.focus({ preventScroll: true });
    };
  }, [openerRef]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const update = () => setStageSize({ width: stage.clientWidth, height: stage.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    setUserScale(null);
    stageRef.current?.scrollTo({ left: 0, top: 0, behavior: 'instant' });
  }, [item.file]);

  const zoomIn = () => setUserScale(Math.min(2, Math.max(scale * 1.5, scale + 0.1)));
  const zoomOut = () => setUserScale(Math.max(fit, scale / 1.5));
  const reset = () => { setUserScale(null); stageRef.current?.scrollTo({ left: 0, top: 0, behavior: 'instant' }); };
  const onKeyDown = (event) => {
    if (event.target.closest('.selector-idioma')) return;
    if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomIn(); }
    if (event.key === '-') { event.preventDefault(); zoomOut(); }
    if (event.key === '0') { event.preventDefault(); reset(); }
    if (stageRef.current.contains(event.target)) return; // Arrow keys pan the focused scroll area natively.
    if (items.length > 1 && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      onNavigate((index + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length);
    }
  };
  const stopDrag = (event) => {
    drag.current = null;
    event.currentTarget.dataset.dragging = 'false';
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <dialog className="world-viewer" ref={dialogRef} aria-labelledby="world-viewer-title" aria-describedby="world-viewer-help" onCancel={(event) => { event.preventDefault(); onClose(); }} onKeyDown={onKeyDown} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="world-viewer__bar">
        <SelectorIdioma language={language} changeLanguage={changeLanguage} c={c} />
        <button className="atlas-button" type="button" ref={closeRef} autoFocus onClick={onClose}>{c.common.close} <span aria-hidden="true">×</span></button>
      </div>
      <div className="world-viewer__heading">
        <p className="atlas-eyebrow">{c.world.artLabel}</p>
        <h2 id="world-viewer-title">{title}</h2>
      </div>
      <div className="world-viewer__tools" role="group" aria-label={c.world.viewer.zoomControls}>
        <button className="atlas-button atlas-button--square" type="button" aria-label={c.world.viewer.zoomOut} disabled={scale <= fit + 0.001} onClick={zoomOut}>−</button>
        <output aria-live="polite" aria-label={c.world.viewer.zoomLevel}>{Math.round(scale * 100)}%</output>
        <button className="atlas-button atlas-button--square" type="button" aria-label={c.world.viewer.zoomIn} disabled={scale >= 2} onClick={zoomIn}>+</button>
        <button className="atlas-button" type="button" onClick={reset}>{c.world.viewer.fit}</button>
      </div>
      <div className="world-viewer__stage" ref={stageRef} tabIndex="0" role="region" aria-label={c.world.viewer.panLabel} data-zoomed={scale > fit + 0.001} style={{ aspectRatio: stageAspect.current }}
        onPointerDown={(event) => {
          if (event.pointerType !== 'mouse' || event.button !== 0 || scale <= fit + 0.001) return;
          event.preventDefault();
          event.currentTarget.focus({ preventScroll: true });
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.dataset.dragging = 'true';
          drag.current = { x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop };
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          event.currentTarget.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
          event.currentTarget.scrollTop = drag.current.top - (event.clientY - drag.current.y);
        }} onPointerUp={stopDrag} onPointerCancel={stopDrag}>
        <div className="world-viewer__canvas" style={{ width: dimensions.width * scale, height: dimensions.height * scale }}>
          <Imagen archivo={item.file} alt={item.alt} loading="eager" draggable="false" style={{ width: dimensions.width * scale, height: dimensions.height * scale }} onError={() => setFailed(item.file)} onLoad={() => setFailed(null)} />
          {failed === item.file && <p className="atlas-image-error" role="status">{c.world.imageError}</p>}
        </div>
      </div>
      <div className="world-viewer__caption" aria-live="polite"><strong>{item.title}</strong><span>{item.description}</span></div>
      {description && <p className="world-viewer__description">{description}</p>}
      {items.length > 1 && <div className="world-viewer__navigation">
        <button className="atlas-button atlas-button--square" type="button" aria-label={c.common.previous} onClick={() => onNavigate((index - 1 + items.length) % items.length)}>‹</button>
        <div className="world-viewer__thumbnails" role="group" aria-label={c.world.viewer.views}>
          {items.map((view, i) => <button type="button" key={view.file} aria-pressed={index === i} aria-label={view.title} onClick={() => onNavigate(i)}>
            <Imagen archivo={view.thumbnail ?? view.file} alt="" /><span>{view.title}</span>
          </button>)}
        </div>
        <button className="atlas-button atlas-button--square" type="button" aria-label={c.common.next} onClick={() => onNavigate((index + 1) % items.length)}>›</button>
      </div>}
      <p className="world-viewer__count" role="status">{t('world.viewer.viewCount', { index: index + 1, count: items.length })}</p>
      <p id="world-viewer-help" className="world-viewer__help">{c.world.viewer.help}</p>
    </dialog>
  );
}
