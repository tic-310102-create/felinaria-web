import { Fragment, useEffect, useRef, useState } from 'react';
import { apkConfig } from './descargables.js';
import { useLanguage } from './i18n/useLanguage.js';
import iconoFelinaria from '../images/icono_felinaria.webp';
import { Imagen, SelectorIdioma } from './components/SiteMedia.jsx';
import ApprenticeCarousel from './components/ApprenticeCarousel.jsx';
import DevelopmentTeam from './components/DevelopmentTeam.jsx';
import SystemRequirements from './components/SystemRequirements.jsx';
import WorldExploration from './components/WorldExploration.jsx';
import { COATS as apariencias, APPRENTICE_IMAGES as imagenesAprendiz } from './apprentice.js';

const capturasDisponibles = new Set(__CONTROLES_IMAGENES__);
// Physical keys and bindings are independent of the interface language.
const controles = [
  { id: 'movement', imagen: 'movimiento-exploracion.jpg', acciones: [
    { id: 'move', teclas: ['W', 'A', 'S', 'D'] },
    { id: 'sprint', teclas: ['ShiftLeft', 'ShiftRight'], union: true },
  ] },
  { id: 'combat', imagen: 'combate-supervivencia.jpg', acciones: [
    { id: 'attack', teclas: ['Space', 'J'] }, { id: 'heal', teclas: ['Q', 'H'], union: true },
  ] },
  { id: 'interface', imagen: 'menus-interfaz.jpg', acciones: [
    { id: 'inventory', teclas: ['I', 'Tab'], union: true }, { id: 'map', teclas: ['M'] },
    { id: 'lore', teclas: ['L'] }, { id: 'pause', teclas: ['Escape'] },
  ] },
  { id: 'interaction', imagen: 'interaccion-dialogos.jpg', acciones: [
    { id: 'interact', teclas: ['E', 'Enter'], union: true },
    { id: 'advance', teclas: ['Space', 'Enter', 'E'] }, { id: 'answer', teclas: ['1', '2', '3'] },
  ] },
];
const personajes = [
  ['apprentice', 'aprendiz1.webp'], ['rastrojo', 'rastrojo.webp'], ['rosa', 'rosa.webp'],
  ['mentor', 'maestro.webp'], ['pack', 'perros-salvajes.webp'],
];
const mecanicas = [
  ['exploration', 'dialogos-narrativos.webp'], ['dialogue', 'interaccion-npc.webp'],
  ['morality', 'moral.webp'], ['combat', 'combate.webp'], ['creation', 'crear-protagonista.webp'],
];
// Decorative ambient plates that punctuate the chronicle without adding prose.
const laminasCronica = {
  rebellion: 'frontera-de-la-colonia.webp',
  meeting: 'sendero-de-los-murmullos.webp',
  kitten: 'paso-de-la-encrucijada.webp',
};
const enlaces = [
  ['home', 'inicio'], ['story', 'historia'], ['characters', 'personajes'], ['world', 'galeria'], ['niveles', 'mundo-lugares'],
  ['mechanics', 'mecanicas'], ['rewards', 'recompensas'], ['controls', 'controles'], ['requirements', 'requisitos'], ['downloads', 'descargables'], ['team', 'equipo'],
];

// Only documented key tokens are rendered as HTML; translations never inject HTML.
function TextoConTeclas({ texto }) {
  return texto.split(/(\{(?:E|M|Escape)\})/g).map((part, index) =>
    /^\{(?:E|M|Escape)\}$/.test(part) ? <kbd key={index}>{part.slice(1, -1)}</kbd> : part);
}

export default function App() {
  const { language, changeLanguage, c, t } = useLanguage();
  const idiomaProps = { language, changeLanguage, c };
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [historiaAbierta, setHistoriaAbierta] = useState(false);
  const [sinConexion, setSinConexion] = useState(() => !navigator.onLine);
  const [instalacionDisponible, setInstalacionDisponible] = useState(false);
  const [resultadoInstalacion, setResultadoInstalacion] = useState(null);
  const [instalada, setInstalada] = useState(() => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true);
  const solicitudInstalacion = useRef(null);
  const cabeceraRef = useRef(null);
  const botonMenuRef = useRef(null);
  const visorRef = useRef(null);
  const retornoFocoRef = useRef(null);
  const galeriaRef = useRef(null);
  const mecanicaRef = useRef(null);
  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const [galeriaAbierta, setGaleriaAbierta] = useState(false);
  const [galeriaIndice, setGaleriaIndice] = useState(0);
  const [mecanicaAmpliada, setMecanicaAmpliada] = useState(null);
  const [aparienciaIndice, setAparienciaIndice] = useState(0);
  const [tutorialPwaAbierto, setTutorialPwaAbierto] = useState(false);
  const [tutorialApkAbierto, setTutorialApkAbierto] = useState(false);
  const apkPublicada = apkConfig.disponible && __APK_ARCHIVO_PRESENTE__;

  useEffect(() => {
    const actualizarConexion = () => setSinConexion(!navigator.onLine);
    window.addEventListener('online', actualizarConexion);
    window.addEventListener('offline', actualizarConexion);
    return () => {
      window.removeEventListener('online', actualizarConexion);
      window.removeEventListener('offline', actualizarConexion);
    };
  }, []);

  useEffect(() => {
    if (!menuAbierto) return;
    const cerrarFuera = (evento) => {
      if (!cabeceraRef.current?.contains(evento.target)) setMenuAbierto(false);
    };
    const cerrarConEscape = (evento) => {
      // A modal owns Escape while open, even if the navigation was left expanded.
      if (evento.key === 'Escape' && !document.querySelector('dialog[open]')) {
        setMenuAbierto(false);
        botonMenuRef.current?.focus();
      }
    };
    document.addEventListener('click', cerrarFuera);
    document.addEventListener('keydown', cerrarConEscape);
    return () => {
      document.removeEventListener('click', cerrarFuera);
      document.removeEventListener('keydown', cerrarConEscape);
    };
  }, [menuAbierto]);

  useEffect(() => {
    const tamanoEscritorio = window.matchMedia('(min-width: 1321px)');
    const cerrarEnEscritorio = () => {
      if (tamanoEscritorio.matches) setMenuAbierto(false);
    };
    tamanoEscritorio.addEventListener('change', cerrarEnEscritorio);
    return () => tamanoEscritorio.removeEventListener('change', cerrarEnEscritorio);
  }, []);

  useEffect(() => {
    if (!menuAbierto || !window.matchMedia('(max-width: 1320px)').matches) return;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [menuAbierto]);

  useEffect(() => {
    if (imagenAmpliada === null) return;
    const visor = visorRef.current;
    visor.showModal();
    const cerrarConEscape = (evento) => { evento.preventDefault(); setImagenAmpliada(null); };
    visor.addEventListener('cancel', cerrarConEscape);
    return () => {
      visor.removeEventListener('cancel', cerrarConEscape);
      if (visor.open) visor.close();
      retornoFocoRef.current?.focus();
    };
  }, [imagenAmpliada]);

  useEffect(() => {
    if (!galeriaAbierta) return;
    const dialogo = galeriaRef.current;
    dialogo.showModal();
    const cerrarConEscape = (evento) => { evento.preventDefault(); setGaleriaAbierta(false); };
    const navegarConFlechas = (evento) => {
      if (evento.key === 'ArrowRight') setGaleriaIndice((i) => (i + 1) % imagenesAprendiz.length);
      if (evento.key === 'ArrowLeft') setGaleriaIndice((i) => (i - 1 + imagenesAprendiz.length) % imagenesAprendiz.length);
    };
    dialogo.addEventListener('cancel', cerrarConEscape);
    dialogo.addEventListener('keydown', navegarConFlechas);
    return () => {
      dialogo.removeEventListener('cancel', cerrarConEscape);
      dialogo.removeEventListener('keydown', navegarConFlechas);
      if (dialogo.open) dialogo.close();
      retornoFocoRef.current?.focus();
    };
  }, [galeriaAbierta]);

  useEffect(() => {
    if (mecanicaAmpliada === null) return;
    const dialogo = mecanicaRef.current;
    dialogo.showModal();
    const cerrar = (evento) => { evento.preventDefault(); setMecanicaAmpliada(null); };
    dialogo.addEventListener('cancel', cerrar);
    return () => {
      dialogo.removeEventListener('cancel', cerrar);
      if (dialogo.open) dialogo.close();
      retornoFocoRef.current?.focus();
    };
  }, [mecanicaAmpliada]);

  useEffect(() => {
    const prepararInstalacion = (evento) => {
      evento.preventDefault();
      solicitudInstalacion.current = evento;
      setInstalacionDisponible(true);
      setResultadoInstalacion(null);
    };
    const confirmarInstalacion = () => {
      solicitudInstalacion.current = null;
      setInstalacionDisponible(false);
      setResultadoInstalacion(null);
      setInstalada(true);
    };
    window.addEventListener('beforeinstallprompt', prepararInstalacion);
    window.addEventListener('appinstalled', confirmarInstalacion);
    return () => {
      window.removeEventListener('beforeinstallprompt', prepararInstalacion);
      window.removeEventListener('appinstalled', confirmarInstalacion);
    };
  }, []);

  const instalar = async () => {
    const evento = solicitudInstalacion.current;
    if (!evento) return;
    solicitudInstalacion.current = null;
    setInstalacionDisponible(false);
    try {
      await evento.prompt();
      const decision = await evento.userChoice;
      setResultadoInstalacion(decision?.outcome === 'accepted' ? 'accepted' : 'cancelled');
    } catch {
      setResultadoInstalacion('error');
    }
  };

  const abrirMecanica = (indice, evento) => {
    retornoFocoRef.current = evento.currentTarget;
    setMecanicaAmpliada(indice);
  };

  return (
    <>
      <header className={`cabecera${menuAbierto ? ' cabecera--menu-abierto' : ''}`} ref={cabeceraRef}>
        <div className="cabecera__interior">
          <a href="#inicio" className="marca" onClick={() => setMenuAbierto(false)}>
            <Imagen archivo="icono_felinaria.webp" src={iconoFelinaria} alt="" width="32" height="32" loading="eager" />
            <span className="marca__nombre">Felinaria</span>
          </a>
          <button className="boton-menu" id="botonMenu" ref={botonMenuRef} type="button" aria-expanded={menuAbierto} aria-controls="navPrincipal" aria-label={menuAbierto ? c.nav.close : c.nav.open} onClick={() => setMenuAbierto(!menuAbierto)}>
            <span className="boton-menu__icono" aria-hidden="true" />{c.nav.menu}
          </button>
          <nav className={`nav-principal${menuAbierto ? ' abierto' : ''}`} id="navPrincipal" aria-label={c.nav.label}>
            <ul>{enlaces.map(([key, id]) => <li key={key}><a href={`#${id}`} onClick={() => setMenuAbierto(false)}>{c.nav[key]}</a></li>)}</ul>
            <SelectorIdioma {...idiomaProps} />
          </nav>
        </div>
      </header>
      <button
        className={`menu-fondo${menuAbierto ? ' visible' : ''}`}
        type="button"
        tabIndex={-1}
        aria-label={c.nav.close}
        onClick={() => setMenuAbierto(false)}
      />

      <main>
        <section id="inicio" className="hero">
          <div className="hero__ambiente" aria-hidden="true">
            <Imagen archivo="aldea-del-sol.webp" alt="" loading="eager" fetchPriority="high" />
          </div>
          <div className="hero__contenido">
            <p className="hero__ojo">{c.hero.eyebrow}</p>
            <h1 className="hero__titulo">Felinaria</h1>
            <p className="hero__omen">{c.hero.omen}</p>
            <p className="hero__subtitulo">{c.hero.subtitle}</p>
            <div className="hero__ficha">
              <span className="ficha ficha--rating"><Imagen archivo="E10+.webp" alt={c.hero.rating} loading="eager" /></span><span className="ficha">{c.hero.genre}</span><span className="ficha">{c.hero.combat}</span>
            </div>
          </div>
        </section>

        <section id="historia" className="seccion">
          <div className="seccion__cabecera"><p className="seccion__numero">{c.story.label}</p><h2 className="seccion__titulo">{c.story.title}</h2></div>
          <div className="historia__cuerpo">
            <div className="historia__texto">
              {c.story.intro.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              <p className="historia__objetivo"><strong>{c.story.objectiveLabel}</strong> {c.story.objective}</p>
            </div>
            <figure className="historia__lamina" aria-hidden="true">
              <Imagen archivo="colonia-sol.webp" alt="" loading="lazy" />
            </figure>
            <button type="button" className="historia__boton" id="botonHistoria" aria-expanded={historiaAbierta} aria-controls="historiaCompleta" onClick={() => setHistoriaAbierta(!historiaAbierta)}>{historiaAbierta ? c.story.hide : c.story.show}</button>
            <div className="historia__completa" id="historiaCompleta" hidden={!historiaAbierta}>
              {Object.entries(c.story.passages).map(([key, paragraph]) => <Fragment key={key}>
                {laminasCronica[key] && <figure className="historia__lamina historia__lamina--cronica" aria-hidden="true"><Imagen archivo={laminasCronica[key]} alt="" loading="lazy" /></figure>}
                {key === 'prophecy'
                  ? <blockquote className="historia__profecia">{paragraph}</blockquote>
                  : <p>{paragraph}</p>}
              </Fragment>)}
            </div>
          </div>
        </section>

        <section id="personajes" className="seccion">
          <div className="seccion__cabecera"><p className="seccion__numero">{c.characters.label}</p><h2 className="seccion__titulo">{c.characters.title}</h2></div>
          <div className="personajes">
            {personajes.map(([key, archivo]) => <article className="tarjeta-personaje" key={key}>
              {key === 'apprentice' ? <ApprenticeCarousel images={imagenesAprendiz} c={c} t={t} suspended={galeriaAbierta} onOpen={(indice, evento) => { retornoFocoRef.current = evento.currentTarget; setGaleriaIndice(indice); setGaleriaAbierta(true); }} /> : <div className="tarjeta-personaje__retrato"><Imagen archivo={archivo} alt={c.characters[key].alt} /></div>}
              <h3 className="tarjeta-personaje__nombre">{c.characters[key].name}</h3>
              <p className="tarjeta-personaje__rol">{c.characters[key].role}</p>
              <p className="tarjeta-personaje__descripcion">{c.characters[key].description}</p>
            </article>)}
          </div>
        </section>

        <WorldExploration {...idiomaProps} t={t} />

        <section id="mecanicas" className="seccion">
          <div className="seccion__cabecera">
            <p className="seccion__numero">{c.mechanics.label}</p><h2 className="seccion__titulo">{c.mechanics.title}</h2>
            <p className="seccion__texto">{c.mechanics.subtitle}</p>
          </div>
          <div className="mecanicas mecanicas--visuales">
            {mecanicas.map(([key, archivo], index) => <article className={`mecanica${key === 'creation' ? ' mecanica--creacion' : ''}`} key={key}>
              <div className="mecanica__principal">
                <button type="button" className="mecanica__captura" aria-label={t('common.enlarge', { title: c.mechanics[key].title })} onClick={(evento) => abrirMecanica(index, evento)}>
                  <Imagen archivo={archivo} alt={c.mechanics[key].alt} />
                  <span className="mecanica__ampliar" aria-hidden="true">{c.mechanics.enlargeHint} <span>↗</span></span>
                </button>
                <div className="mecanica__texto"><h3>{c.mechanics[key].title}</h3><p>{c.mechanics[key].description}</p></div>
              </div>
              {key === 'creation' && <div className="creacion" aria-label={c.mechanics.appearanceLabel}>
                <div className="creacion__retrato"><Imagen archivo={imagenesAprendiz[aparienciaIndice]} alt={t('mechanics.appearanceAlt', { coat: c.mechanics.coats[apariencias[aparienciaIndice]] })} /></div>
                <p className="creacion__seleccion" role="status">{c.mechanics.coats[apariencias[aparienciaIndice]]}</p>
                <div className="creacion__variantes" role="group" aria-label={c.mechanics.appearanceLabel}>
                  {apariencias.map((coat, i) => <button key={coat} type="button" aria-pressed={aparienciaIndice === i} aria-label={t('mechanics.selectCoat', { coat: c.mechanics.coats[coat] })} onClick={() => setAparienciaIndice(i)}>
                    <Imagen archivo={imagenesAprendiz[i]} alt="" /><span>{c.mechanics.coats[coat]}</span>
                  </button>)}
                </div>
                <p className="creacion__nota">{c.mechanics.demoNote}</p>
              </div>}
            </article>)}
          </div>
          <p className="inspiraciones">{c.mechanics.inspirations}</p>
        </section>

        <section id="recompensas" className="seccion">
          <div className="seccion__cabecera">
            <p className="seccion__numero">{c.rewards.label}</p>
            <h2 className="seccion__titulo">{c.rewards.title}</h2>
            <p className="seccion__texto">{c.rewards.intro}</p>
          </div>
          <div className="recompensas">
            <article className="recompensa recompensa--espada">
              <figure className="recompensa__lamina"><Imagen archivo="espada-de-rosa.webp" alt={c.rewards.sword.alt} loading="lazy" /></figure>
              <div className="recompensa__cuerpo">
                <p className="recompensa__etiqueta">{c.rewards.sword.label}</p>
                <h3 className="recompensa__nombre">{c.rewards.sword.name}</h3>
                <p className="recompensa__texto">{c.rewards.sword.description}</p>
                <p className="recompensa__condicion"><span>{c.rewards.sword.conditionLabel}</span>{c.rewards.sword.condition}</p>
              </div>
            </article>
            <article className="recompensa recompensa--moral">
              <div className="recompensa__cuerpo">
                <p className="recompensa__etiqueta">{c.rewards.morality.label}</p>
                <h3 className="recompensa__nombre">{c.rewards.morality.name}</h3>
                <p className="recompensa__texto">{c.rewards.morality.description}</p>
                <p className="recompensa__valor">{c.rewards.morality.value}</p>
              </div>
              <figure className="recompensa__lamina recompensa__lamina--barra"><Imagen archivo="barra-de-moral.webp" alt={c.rewards.morality.alt} loading="lazy" /></figure>
            </article>
            <article className="recompensa recompensa--pocion">
              <figure className="recompensa__lamina recompensa__lamina--frasco"><Imagen archivo="pocion-de-curacion.webp" alt={c.rewards.potion.alt} loading="lazy" /></figure>
              <div className="recompensa__cuerpo">
                <p className="recompensa__etiqueta">{c.rewards.potion.label}</p>
                <h3 className="recompensa__nombre">{c.rewards.potion.name}</h3>
                <p className="recompensa__texto">{c.rewards.potion.description}</p>
                <p className="recompensa__valor recompensa__valor--vida">{c.rewards.potion.value}</p>
                <p className="recompensa__condicion"><span>{c.rewards.potion.sourceLabel}</span>{c.rewards.potion.source}</p>
              </div>
            </article>
          </div>
        </section>

        <section id="controles" className="seccion">
          <div className="seccion__cabecera"><p className="seccion__numero">{c.controls.label}</p><h2 className="seccion__titulo">{c.controls.title}</h2><p className="seccion__texto">{c.controls.subtitle}</p></div>
          <div className="controles">
            {controles.map((grupo, indice) => <details className="controles__grupo" key={grupo.id}>
              <summary><span>{c.controls.groups[grupo.id]}</span><span className="controles__conteo">{grupo.acciones.length} {grupo.acciones.length === 1 ? c.controls.action : c.controls.actions}</span></summary>
              <div className="controles__contenido">
                <dl className="controles__acciones">{grupo.acciones.map((accion) => {
                  const copy = c.controls.items[accion.id];
                  return <div className="controles__accion" key={accion.id}>
                    <dt>{copy.name}</dt><dd>
                      <p><span className="controles__etiqueta">{c.controls.keyboard}</span>{' '}
                        {accion.teclas.map((tecla, teclaIndice) => <span key={tecla}>
                          {teclaIndice > 0 ? (teclaIndice === accion.teclas.length - 1 && accion.union ? ` ${c.controls.or} ` : ', ') : ''}
                          <kbd>{c.controls.keys[tecla] ?? tecla}</kbd>
                        </span>)}{copy.alternative ? ` ${copy.alternative}.` : '.'}
                      </p>
                      {copy.gamepad && <p><span className="controles__etiqueta">{c.controls.gamepad}</span> {copy.gamepad}</p>}
                      {copy.detail && <p className="controles__detalle"><TextoConTeclas texto={copy.detail} /></p>}
                    </dd>
                  </div>;
                })}</dl>
                {capturasDisponibles.has(grupo.imagen) && <figure className="controles__referencia">
                  <button type="button" className="controles__ampliar" aria-label={t('common.enlarge', { title: c.controls.groups[grupo.id] })} onClick={(evento) => { retornoFocoRef.current = evento.currentTarget; setImagenAmpliada(indice); }}>
                    <img src={`${import.meta.env.BASE_URL}images/controles/${grupo.imagen}`} alt={t('controls.capture', { title: c.controls.groups[grupo.id] })} loading="lazy" decoding="async" />
                  </button><figcaption>{c.controls.hint}</figcaption>
                </figure>}
              </div>
            </details>)}
          </div>
        </section>

        <SystemRequirements copy={c.requirements} />

        <section id="descargables" className="seccion">
          <div className="seccion__cabecera"><p className="seccion__numero">{c.downloads.label}</p><h2 className="seccion__titulo">{c.downloads.title}</h2><p className="seccion__texto">{c.downloads.subtitle}</p></div>
          <div className="descargables">
            <article className="descargables__tarjeta descargables__tarjeta--web">
              <div className="descargables__cabecera">
                <img className="descargables__icono" src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt={c.downloads.webAlt} width="64" height="64" decoding="async" />
                <div><p className="descargables__tipo">{c.downloads.webType}</p><h3>{c.downloads.webName}</h3></div><span className="descargables__estado">{c.downloads.available}</span>
              </div>
              <p>{c.downloads.webDescription}</p><p className="descargables__compatibilidad">{c.downloads.webCompatibility}</p>
              <div className="descargables__acciones">
                {instalada ? <span className="descargables__instalada" role="status">{c.downloads.installed}</span>
                  : resultadoInstalacion ? <span className="descargables__instalada" role="status">{c.downloads.results[resultadoInstalacion]}</span>
                    : instalacionDisponible && !sinConexion ? <button type="button" className="descargables__boton" onClick={instalar}>{c.downloads.install}</button>
                      : <p className="descargables__instruccion">{c.downloads.manual}</p>}
                <button type="button" className="descargables__boton descargables__boton--secundario" aria-expanded={tutorialPwaAbierto} aria-controls="tutorialPwa" onClick={() => setTutorialPwaAbierto(!tutorialPwaAbierto)}>{tutorialPwaAbierto ? c.downloads.hideWebTutorial : c.downloads.showWebTutorial}</button>
              </div>
              <div className="descargables__tutorial" id="tutorialPwa" hidden={!tutorialPwaAbierto}>
                <p>{c.downloads.webTutorialIntro}</p>
                {[['Android', 'androidTutorial'], [c.downloads.pcLabel, 'pcTutorial'], [c.downloads.iosLabel, 'iosTutorial']].map(([label, key]) => <details key={key}>
                  <summary>{label}</summary><ol>{c.downloads[key].map((step, i) => <li key={i}>{step}</li>)}</ol>
                </details>)}
              </div>
            </article>
            <article className="descargables__tarjeta descargables__tarjeta--android">
              <div className="descargables__cabecera">
                <svg className="descargables__icono" role="img" aria-label={c.downloads.apkAlt} viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="15" y="3" width="34" height="58" rx="4" /><path d="M26 9h12M29 55h6M23 34a9 9 0 0 1 18 0v9H23zM26 24l-3-4m15 4 3-4M28 36h1m7 0h1" strokeLinecap="round" /></svg>
                <div><p className="descargables__tipo">{c.downloads.apkType}</p><h3>{c.downloads.apkName}</h3></div><span className="descargables__estado">{apkPublicada ? c.downloads.available : c.downloads.development}</span>
              </div>
              <p>{c.downloads.apkDescription}</p><p className="descargables__compatibilidad">{c.downloads.apkCompatibility}</p>
              <div className="descargables__acciones">
                {apkPublicada && !sinConexion ? <a className="descargables__boton" href={`${import.meta.env.BASE_URL}${apkConfig.ruta}`} download={apkConfig.nombreArchivo}>{c.downloads.downloadApk}</a>
                  : <button type="button" className="descargables__boton" disabled>{apkPublicada ? c.downloads.apkOffline : c.downloads.apkSoon}</button>}
                <button type="button" className="descargables__boton descargables__boton--secundario" aria-expanded={tutorialApkAbierto} aria-controls="tutorialApk" onClick={() => setTutorialApkAbierto(!tutorialApkAbierto)}>{tutorialApkAbierto ? c.downloads.hideApkTutorial : c.downloads.showApkTutorial}</button>
              </div>
              <div className="descargables__tutorial" id="tutorialApk" hidden={!tutorialApkAbierto}><ol>{c.downloads.apkTutorial.map((step, i) => <li key={i}>{step}</li>)}</ol><p className="descargables__advertencia">{c.downloads.warning}</p></div>
            </article>
          </div>
        </section>

        <DevelopmentTeam copy={c.team} />
      </main>

      <footer className="pie">
        <h2 className="pie__institucion">{c.team.label}</h2>
        <p>{c.team.copyright}</p>
      </footer>
      <div className="aviso-sin-conexion" role="status" hidden={!sinConexion}>{c.status.offline}</div>

      {imagenAmpliada !== null && <dialog className="visor-controles" ref={visorRef} aria-label={t('controls.viewer', { title: c.controls.groups[controles[imagenAmpliada].id] })} onClick={(evento) => { if (evento.target === evento.currentTarget) setImagenAmpliada(null); }}>
        <div className="dialogo__barra"><SelectorIdioma {...idiomaProps} /><button type="button" className="visor-controles__cerrar" onClick={() => setImagenAmpliada(null)}>{c.common.close} <span aria-hidden="true">×</span></button></div>
        <img src={`${import.meta.env.BASE_URL}images/controles/${controles[imagenAmpliada].imagen}`} alt={t('controls.capture', { title: c.controls.groups[controles[imagenAmpliada].id] })} decoding="async" />
      </dialog>}

      {galeriaAbierta && <dialog className="galeria-personajes" ref={galeriaRef} aria-label={c.characters.galleryLabel} onClick={(evento) => { if (evento.target === evento.currentTarget) setGaleriaAbierta(false); }}>
        <div className="dialogo__barra"><SelectorIdioma {...idiomaProps} /><button type="button" className="galeria-personajes__cerrar" onClick={() => setGaleriaAbierta(false)}>{c.common.close} <span aria-hidden="true">×</span></button></div>
        <figure className="galeria-personajes__lienzo"><Imagen archivo={imagenesAprendiz[galeriaIndice]} alt={t('mechanics.appearanceAlt', { coat: c.mechanics.coats[apariencias[galeriaIndice]] })} loading="eager" /></figure>
        <div className="galeria-personajes__pie">
          <button type="button" className="galeria-personajes__flecha" aria-label={c.common.previous} onClick={() => setGaleriaIndice((i) => (i - 1 + imagenesAprendiz.length) % imagenesAprendiz.length)}>‹</button>
          <ul className="galeria-personajes__miniaturas">{imagenesAprendiz.map((nombre, i) => <li key={nombre}><button type="button" className={`galeria-personajes__miniatura${i === galeriaIndice ? ' activa' : ''}`} aria-label={t('common.selectImage', { index: i + 1, count: imagenesAprendiz.length })} aria-current={i === galeriaIndice ? 'true' : undefined} onClick={() => setGaleriaIndice(i)}><Imagen archivo={nombre} alt="" /></button></li>)}</ul>
          <button type="button" className="galeria-personajes__flecha" aria-label={c.common.next} onClick={() => setGaleriaIndice((i) => (i + 1) % imagenesAprendiz.length)}>›</button>
        </div>
        <p className="galeria-personajes__contador" role="status">{galeriaIndice + 1} / {imagenesAprendiz.length}</p>
      </dialog>}

      {mecanicaAmpliada !== null && <dialog className="visor-controles visor-mecanica" ref={mecanicaRef} aria-label={t('mechanics.captureLabel', { title: c.mechanics[mecanicas[mecanicaAmpliada][0]].title })} onClick={(evento) => { if (evento.target === evento.currentTarget) setMecanicaAmpliada(null); }}>
        <div className="dialogo__barra"><SelectorIdioma {...idiomaProps} /><button type="button" className="visor-controles__cerrar" onClick={() => setMecanicaAmpliada(null)}>{c.common.close} <span aria-hidden="true">×</span></button></div>
        <Imagen archivo={mecanicas[mecanicaAmpliada][1]} alt={c.mechanics[mecanicas[mecanicaAmpliada][0]].alt} loading="eager" />
      </dialog>}
    </>
  );
}
