import { useEffect, useRef, useState } from 'react';
import { apkConfig } from './descargables.js';

const imagen = (nombre) => `${import.meta.env.BASE_URL}images/${nombre}`;
const capturasDisponibles = new Set(__CONTROLES_IMAGENES__);
const controles = [
  {
    titulo: 'Movimiento y Exploración',
    imagen: 'movimiento-exploracion.jpg',
    acciones: [
      { nombre: 'Moverse', teclas: ['W', 'A', 'S', 'D'], alternativa: 'o flechas', mando: 'stick izquierdo o cruceta (D-Pad).' },
      { nombre: 'Correr / Sprint', teclas: ['Shift izquierdo', 'Shift derecho'], union: 'o', mando: 'LB / RB en Xbox; L1 / R1 en PlayStation.' },
    ],
  },
  {
    titulo: 'Combate y Supervivencia',
    imagen: 'combate-supervivencia.jpg',
    acciones: [
      { nombre: 'Atacar con arma', teclas: ['Espacio', 'J'], alternativa: 'o clic izquierdo' },
      { nombre: 'Curación rápida (poción)', teclas: ['Q', 'H'], union: 'o' },
    ],
  },
  {
    titulo: 'Menús e Interfaz',
    imagen: 'menus-interfaz.jpg',
    acciones: [
      { nombre: 'Inventario', teclas: ['I', 'Tab'], union: 'o', detalle: <>Para equipar un arma o amuleto: <kbd>E</kbd> o clic sobre el objeto desde el inventario, conforme a los controles documentados.</> },
      { nombre: 'Mapa de la región', teclas: ['M'], detalle: <>Cierra con <kbd>M</kbd> o <kbd>Escape</kbd>.</> },
      { nombre: 'Códice de Historia / Lore', teclas: ['L'], detalle: 'Permite consultar crónicas y leyendas descubiertas.' },
      { nombre: 'Menú de Pausa / Opciones', teclas: ['Escape'], mando: 'Start / Options.' },
    ],
  },
  {
    titulo: 'Interacción y Diálogos',
    imagen: 'interaccion-dialogos.jpg',
    acciones: [
      { nombre: 'Interactuar con NPCs, cofres y pistas', teclas: ['E', 'Enter'], union: 'o' },
      { nombre: 'Avanzar diálogos', teclas: ['Espacio', 'Enter', 'E'], alternativa: 'o clic' },
      { nombre: 'Elegir respuestas morales', teclas: ['1', '2', '3'], alternativa: 'o clic sobre la opción correspondiente' },
    ],
  },
];

const imagenesAprendiz = ['aprendiz1.png', 'aprendiz2.png', 'aprendiz3.png', 'aprendiz4.png'];

export default function App() {
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
  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const [galeriaAbierta, setGaleriaAbierta] = useState(false);
  const [galeriaIndice, setGaleriaIndice] = useState(0);
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
      if (evento.key === 'Escape') {
        setMenuAbierto(false);
        botonMenuRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', cerrarFuera);
    document.addEventListener('keydown', cerrarConEscape);
    return () => {
      document.removeEventListener('pointerdown', cerrarFuera);
      document.removeEventListener('keydown', cerrarConEscape);
    };
  }, [menuAbierto]);

  useEffect(() => {
    const tamanoEscritorio = window.matchMedia('(min-width: 1141px)');
    const cerrarEnEscritorio = () => {
      if (tamanoEscritorio.matches) setMenuAbierto(false);
    };
    tamanoEscritorio.addEventListener('change', cerrarEnEscritorio);
    return () => tamanoEscritorio.removeEventListener('change', cerrarEnEscritorio);
  }, []);

  useEffect(() => {
    if (imagenAmpliada === null) return;
    const visor = visorRef.current;
    visor.showModal();
    const cerrarConEscape = (evento) => {
      evento.preventDefault();
      setImagenAmpliada(null);
    };
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
    const cerrarConEscape = (evento) => {
      evento.preventDefault();
      setGaleriaAbierta(false);
    };
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
      if (decision?.outcome === 'accepted') {
        setResultadoInstalacion('Instalación aceptada. Busca Felinaria entre tus aplicaciones.');
      } else {
        setResultadoInstalacion('Instalación cancelada. Puedes usar el tutorial de instalación cuando quieras.');
      }
    } catch {
      setResultadoInstalacion('No se pudo abrir el diálogo de instalación. Sigue el tutorial de instalación.');
    }
  };

  return (
    <>
      <header className="cabecera" ref={cabeceraRef}>
        <div className="cabecera__interior">
          <a href="#inicio" className="marca" onClick={() => setMenuAbierto(false)}>
            <img src={imagen('icono_felinaria.png')} alt="" width="32" height="32" />
            <span className="marca__nombre">Felinaria</span>
          </a>

          <button className="boton-menu" id="botonMenu" ref={botonMenuRef} type="button" aria-expanded={menuAbierto} aria-controls="navPrincipal" aria-label={menuAbierto ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'} onClick={() => setMenuAbierto(!menuAbierto)}>
            <span className="boton-menu__icono" aria-hidden="true" />Menú
          </button>

          <nav className={`nav-principal${menuAbierto ? ' abierto' : ''}`} id="navPrincipal" aria-label="Navegación principal">
            <ul>
              <li><a href="#inicio" onClick={() => setMenuAbierto(false)}>Inicio</a></li>
              <li><a href="#historia" onClick={() => setMenuAbierto(false)}>Historia</a></li>
              <li><a href="#personajes" onClick={() => setMenuAbierto(false)}>Personajes</a></li>
              <li><a href="#mecanicas" onClick={() => setMenuAbierto(false)}>Mecánicas</a></li>
              <li><a href="#controles" onClick={() => setMenuAbierto(false)}>Controles</a></li>
              <li><a href="#galeria" onClick={() => setMenuAbierto(false)}>Galería</a></li>
              <li><a href="#descargables" onClick={() => setMenuAbierto(false)}>Descargables</a></li>
              <li><a href="#equipo" onClick={() => setMenuAbierto(false)}>Equipo</a></li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <section id="inicio" className="hero">
          <p className="hero__ojo">RPG táctico narrativo · pixelart 2D</p>
          <h1 className="hero__titulo">Felinaria</h1>
          <p className="hero__subtitulo">
            Un aprendiz felino, una profecía olvidada y dos manadas al borde de una guerra
            que ninguna de las dos quiso empezar.
          </p>
          <div className="hero__ficha">
            <span className="ficha">Clasificación E10+</span>
            <span className="ficha">Aventura narrativa · RPG ligero</span>
            <span className="ficha">Combate táctico por turnos</span>
          </div>
        </section>

        <section id="historia" className="seccion">
          <div className="seccion__cabecera">
            <p className="seccion__numero">Historia</p>
            <h2 className="seccion__titulo">Una alianza que nadie esperaba</h2>
          </div>

          <div className="historia__cuerpo">
            <p>
              En las Colonias felinas, ser distinto puede costarte el hogar. Rosa fue expulsada
              de la suya sin más razón que la desconfianza de los demás. Rastrojo, un guerrero
              harto de las leyes de su propia Colonia, rompió con ella para aliarse con la Manada
              del Colmillo: los perros salvajes que durante generaciones fueron el enemigo de
              todo gato.
            </p>
            <p>
              En medio de ese conflicto, un joven aprendiz encuentra en una bolsa abandonada a un
              gatito blanco recién nacido: el hijo que Rosa perdió. Sin saberlo todavía, ese
              aprendiz es el cachorro que una vieja profecía señala como quien decidirá el destino
              de las Colonias.
            </p>
            <p className="historia__objetivo">
              <strong>Objetivo del jugador:</strong> guiar a este aprendiz —personalizable en
              pelaje y nombre— a través de batallas tácticas por turnos y decisiones narrativas
              que determinan si las Colonias sobreviven divididas o encuentran una forma de
              convivir con la Manada del Colmillo.
            </p>

            <button className="historia__boton" id="botonHistoria" aria-expanded={historiaAbierta} aria-controls="historiaCompleta" onClick={() => setHistoriaAbierta(!historiaAbierta)}>
              {historiaAbierta ? 'Ocultar historia completa' : 'Leer la historia completa'}
            </button>

            <div className="historia__completa" id="historiaCompleta" hidden={!historiaAbierta}>
              <p>En épocas antiguas, cuando el mundo era joven y los bosques no tenían nombre, existían los grandes felinos. Fuertes. Feroces. Dueños de la tierra. Pero ni su fuerza ni sus colmillos bastaron para protegerlos de los peligros que acechaban fuera de sus guaridas. Uno a uno fueron cayendo, hasta que los dioses, apiadados, decidieron darles un nuevo cuerpo. Pequeño. Veloz. Hecho para esconderse entre las raíces y sobrevivir en las profundidades del bosque.</p>
              <p>Así nacieron los gatos.</p>
              <p>Los gatos, temerosos de volver a ser cazados hasta la extinción, formaron Colonias: grupos donde cada gato tenía un lugar, una tarea y un propósito. Con el paso de las generaciones, las Colonias crecieron y se expandieron. Cada una desarrolló sus propias costumbres, sus propias creencias, su propia forma de sobrevivir. Algunas se establecieron junto a los ríos, donde el agua nunca se detenía. Otras entre los árboles más antiguos, cuyas ramas tocaban el cielo. Y unas pocas en las zonas más alejadas, donde pocos depredadores se atrevían a llegar.</p>
              <p>Durante muchas generaciones, las Colonias vivieron en paz. Intercambiaban presas, compartían información sobre los peligros del bosque y se ayudaban cuando algún territorio era amenazado. No eran amigas. Pero tampoco enemigas.</p>
              <p>Sin embargo, mantener la paz nunca fue sencillo. Las disputas por los territorios, el alimento y las decisiones de los líderes provocaron conflictos. Algunas Colonias llegaron incluso a enfrentarse entre sí. Con el tiempo, los gatos crearon reglas para evitar que aquellas disputas terminaran destruyéndolos. Las jerarquías y las tradiciones se volvieron una parte importante de la vida de las Colonias. Para algunos gatos, aquellas reglas representaban la razón por la que habían conseguido sobrevivir durante tantas generaciones.</p>
              <p>Pero no todos pensaban de la misma manera.</p>
              <p>En una época más reciente, un gato llamado Rastrojo comenzó a cuestionar el sistema de las Colonias. Rastrojo creía que las jerarquías solamente servían para que unos pocos gatos tuvieran poder sobre los demás. Para él, los territorios y las reglas no protegían a los gatos: los mantenían separados. Con el tiempo, su rechazo hacia las Colonias se convirtió en resentimiento.</p>
              <p>Rastrojo comenzó a reunir gatos que compartían sus ideas y atacó algunos de los límites territoriales. No buscaba conquistar una Colonia ni convertirse en su líder. Su objetivo era diferente: quería destruir las reglas que mantenían el orden entre ellas y demostrar que los gatos podían sobrevivir sin líderes, territorios ni jerarquías.</p>
              <p>Sin embargo, los ataques de Rastrojo provocaron conflictos y terminaron poniendo en peligro a muchos gatos. Las Colonias decidieron detenerlo y expulsarlo de sus territorios.</p>
              <p>Rastrojo desapareció en el bosque.</p>
              <p>Durante mucho tiempo nadie volvió a saber de él.</p>
              <p>Hasta que encontró aliados inesperados.</p>
              <p>En las zonas más alejadas del territorio vivía una comunidad de perros salvajes conocida como la Manada del Colmillo. Los perros no compartían las costumbres de los gatos y durante generaciones habían competido por los mismos territorios y recursos. Rastrojo se acercó a ellos y les ofreció un trato. Los perros lo ayudarían a debilitar a las Colonias y, a cambio, tendrían acceso a territorios que hasta entonces habían pertenecido a los gatos.</p>
              <p>La alianza comenzó a crecer en secreto.</p>
              <p>Pero Rastrojo no fue el único gato que guardaba rencor hacia las Colonias.</p>
              <p>Mucho antes de que comenzaran los ataques, una gata llamada Rosa había pertenecido a la Colonia del protagonista. Rosa era una gata inteligente y habilidosa, pero terminó siendo acusada de un acto que no había cometido. A pesar de intentar demostrar su inocencia, los líderes de la Colonia decidieron expulsarla.</p>
              <p>Para Rosa, aquello significó perderlo todo. Su hogar, su posición y a los gatos que alguna vez consideró su familia. Durante mucho tiempo vivió sola en el bosque. El resentimiento que sentía hacia la Colonia fue creciendo hasta convertirse en una parte de su vida.</p>
              <p>Fue entonces cuando Rastrojo la encontró.</p>
              <p>Él conocía su historia y sabía que había sido expulsada injustamente. Le contó que su situación era una prueba de que las Colonias estaban podridas desde sus raíces y que ningún gato debía volver a vivir bajo sus reglas. Rosa no confiaba completamente en él, pero compartía su resentimiento.</p>
              <p>Así comenzó una alianza que cambiaría el destino de las Colonias.</p>
              <p>Mientras Rastrojo reunía fuerzas junto a la Manada del Colmillo, Rosa se encargaba de obtener información sobre la Colonia que alguna vez había sido su hogar.</p>
              <p>Pero había algo que Rastrojo no le había contado.</p>
              <p>Él no quería simplemente demostrar que las Colonias estaban equivocadas.</p>
              <p>Quería destruirlas.</p>
              <p>Su verdadero objetivo era provocar suficientes conflictos para que los gatos comenzaran a desconfiar unos de otros. Si las Colonias dejaban de ayudarse, sería mucho más sencillo derrotarlas una por una.</p>
              <p>Rosa comenzó a darse cuenta de que el plan iba mucho más lejos de lo que había imaginado. Sin embargo, para entonces ya era demasiado tarde para abandonar la alianza sin consecuencias.</p>
              <p>Mientras estos acontecimientos ocurrían lejos de los ojos de los demás gatos, dentro de la Colonia del protagonista nacía un cachorro que sería considerado especial. Desde pequeño, algunos miembros de la Colonia comenzaron a relacionarlo con una antigua profecía.</p>
              <p>La profecía decía:</p>
              <blockquote className="historia__profecia">“Cuando llegue aquel que cambie el destino de las Colonias, los gatos deberán decidir qué están dispuestos a sacrificar para proteger aquello que consideran suyo.”</blockquote>
              <p>Nadie sabía exactamente qué significaba. Algunos pensaban que hablaba de un gran guerrero. Otros creían que se trataba de un futuro líder capaz de unir a las Colonias.</p>
              <p>El cachorro creció escuchando aquellas historias. Con el tiempo, comenzó a creer que su vida tenía un propósito especial. Cuando finalmente llegó el momento de convertirse en escudero, fue puesto bajo el entrenamiento del Señor de su Colonia. Allí aprendería a combatir, desplazarse por el territorio y proteger a otros gatos.</p>
              <p>Sin saberlo, mientras él se preparaba para convertirse en guerrero, Rastrojo y la Manada del Colmillo comenzaban a acercarse cada vez más al territorio.</p>
              <p>La primera señal del conflicto llegaría durante una misión.</p>
              <p>El protagonista sería enviado junto a otros gatos para revisar una zona cercana a los límites de la Colonia. Durante el recorrido encontrarían señales de que algo estaba alterando el equilibrio del bosque.</p>
              <p>Huellas de perros. Territorios marcados. Y rastros que pertenecían a gatos que ya no deberían encontrarse allí.</p>
              <p>Sin embargo, entre todo aquello habría algo que el protagonista no esperaba encontrar.</p>
              <p>Un pequeño maullido proveniente de unos arbustos.</p>
              <p>Al acercarse descubriría a un gatito atrapado dentro de una bolsa abandonada.</p>
              <p>Era completamente blanco.</p>
              <p>El protagonista no sabría quién era, de dónde había venido ni por qué estaba solo. Tampoco sabría que aquel pequeño estaba relacionado con una historia que la Colonia había intentado olvidar. Porque el gatito era hijo de Rosa.</p>
              <p>Y su existencia sería el detonante que terminaría conectando el pasado de Rosa, los planes de Rastrojo y el destino del protagonista.</p>
              <p>A partir de ese momento, el protagonista tendrá que decidir qué hacer con el gatito mientras los conflictos entre las Colonias aumentan.</p>
              <p>Lo que comenzó como una simple misión terminará revelando que la mayor amenaza para las Colonias no se encuentra únicamente fuera de sus territorios.</p>
              <p>También se encuentra en las heridas que dejaron atrás.</p>
            </div>
          </div>
        </section>

        <section id="personajes" className="seccion">
          <div className="seccion__cabecera">
            <p className="seccion__numero">Personajes</p>
            <h2 className="seccion__titulo">Quiénes cruzan la profecía</h2>
          </div>

          <div className="personajes">
            <article className="tarjeta-personaje">
              <button
                type="button"
                className="tarjeta-personaje__galeria"
                aria-label={`Ver las ${imagenesAprendiz.length} imágenes de El aprendiz`}
                onClick={(evento) => {
                  retornoFocoRef.current = evento.currentTarget;
                  setGaleriaIndice(0);
                  setGaleriaAbierta(true);
                }}
              >
                <img src={imagen('aprendiz1.png')} alt={`El aprendiz, imagen 1 de ${imagenesAprendiz.length}`} />
                <span className="tarjeta-personaje__galeria-aviso" aria-hidden="true">
                  {imagenesAprendiz.length} imágenes · clic para ver
                </span>
              </button>
              <h3 className="tarjeta-personaje__nombre">El aprendiz</h3>
              <p className="tarjeta-personaje__rol">Protagonista · personalizable</p>
              <p className="tarjeta-personaje__descripcion">
                El jugador elige su pelaje —blanco, gris, negro o siamés— y su nombre. Viste una
                túnica beige y una bufanda roja. Es, sin saberlo al inicio, el cachorro que la
                profecía señala.
              </p>
            </article>

            <article className="tarjeta-personaje">
              <div className="tarjeta-personaje__retrato">
                <img src={imagen('rastrojo.png')} alt="Rastrojo, guerrero exiliado" loading="lazy" />
              </div>
              <h3 className="tarjeta-personaje__nombre">Rastrojo</h3>
              <p className="tarjeta-personaje__rol">Guerrero exiliado</p>
              <p className="tarjeta-personaje__descripcion">
                Armadura oscura con detalles naranjas y una capa. Rompió con su Colonia y se alió
                con la Manada del Colmillo, convencido de que las viejas leyes felinas ya no
                protegen a nadie.
              </p>
            </article>

            <article className="tarjeta-personaje">
              <div className="tarjeta-personaje__retrato">
                <img src={imagen('rosa.png')} alt="Rosa, gata expulsada" loading="lazy" />
              </div>
              <h3 className="tarjeta-personaje__nombre">Rosa</h3>
              <p className="tarjeta-personaje__rol">Gata expulsada</p>
              <p className="tarjeta-personaje__descripcion">
                Desterrada injustamente de su Colonia, Rosa busca al hijo que perdió sin saber que
                el aprendiz ya lo encontró.
              </p>
            </article>

            <article className="tarjeta-personaje">
              <div className="tarjeta-personaje__retrato">
                <img src={imagen('maestro.png')} alt="El Señor de los cuervos, maestro del aprendiz" loading="lazy" />
              </div>
              <h3 className="tarjeta-personaje__nombre">Señor de los cuervos</h3>
              <p className="tarjeta-personaje__rol">Maestro</p>
              <p className="tarjeta-personaje__descripcion">
                Personaje encargado de guiar al protagonista durante su formación. Participa en la
                ceremonia, proporciona instrucciones y acompaña al protagonista durante el
                entrenamiento, siendo un instructor para el jugador para enseñarle las mecánicas
                básicas del juego como lo son aprender a moverse, atacar y usar los recursos del
                inventario.
              </p>
            </article>

            <article className="tarjeta-personaje">
              <div className="tarjeta-personaje__retrato">
                <img src={imagen('perros-salvajes.png')} alt="Perros salvajes de la Manada del Colmillo" loading="lazy" />
              </div>
              <h3 className="tarjeta-personaje__nombre">La Manada del Colmillo</h3>
              <p className="tarjeta-personaje__rol">Enemigos</p>
              <p className="tarjeta-personaje__descripcion">
                La Manada del Colmillo representa parte de los conflictos y enfrentamientos del
                juego. Los enemigos forman parte de las mecánicas de combate y pueden recibir daño
                hasta ser derrotados.
              </p>
            </article>
          </div>
        </section>

        <section id="mecanicas" className="seccion">
          <div className="seccion__cabecera">
            <p className="seccion__numero">Mecánicas</p>
            <h2 className="seccion__titulo">Cómo se juega Felinaria</h2>
          </div>

          <div className="mecanicas">
            <div className="dato-mecanica">
              <p className="dato-mecanica__etiqueta">Género</p>
              <p className="dato-mecanica__valor">RPG táctico narrativo</p>
            </div>
            <div className="dato-mecanica">
              <p className="dato-mecanica__etiqueta">Combate</p>
              <p className="dato-mecanica__valor">Por turnos, en cuadrícula</p>
            </div>
            <div className="dato-mecanica">
              <p className="dato-mecanica__etiqueta">Estética</p>
              <p className="dato-mecanica__valor">Pixelart 2D</p>
            </div>
            <div className="dato-mecanica">
              <p className="dato-mecanica__etiqueta">Mundo</p>
              <p className="dato-mecanica__valor">Colonias felinas en tensión</p>
            </div>
          </div>

          <p className="inspiraciones">
            Inspirado en Warrior Cats, Cattails, Cult of the Lamb y Fire Emblem, con un diseño de
            personajes que retoma el espíritu de los Felynes de Monster Hunter.
          </p>
        </section>

        <section id="controles" className="seccion">
          <div className="seccion__cabecera">
            <p className="seccion__numero">Controles</p>
            <h2 className="seccion__titulo">Controles del videojuego</h2>
            <p className="seccion__texto">Domina cada movimiento y prepárate para escribir tu propia historia.</p>
          </div>

          <div className="controles">
            {controles.map((grupo, indice) => (
              <details className="controles__grupo" key={grupo.titulo}>
                <summary>
                  <span>{grupo.titulo}</span>
                  <span className="controles__conteo">{grupo.acciones.length} {grupo.acciones.length === 1 ? 'acción' : 'acciones'}</span>
                </summary>
                <div className="controles__contenido">
                  <dl className="controles__acciones">
                    {grupo.acciones.map((accion) => (
                      <div className="controles__accion" key={accion.nombre}>
                        <dt>{accion.nombre}</dt>
                        <dd>
                          <p><span className="controles__etiqueta">Teclado</span>{' '}
                            {accion.teclas.map((tecla, teclaIndice) => (
                              <span key={`${tecla}-${teclaIndice}`}>
                                {teclaIndice > 0 ? (teclaIndice === accion.teclas.length - 1 && accion.union ? ` ${accion.union} ` : ', ') : ''}
                                <kbd>{tecla}</kbd>
                              </span>
                            ))}
                            {accion.alternativa ? ` ${accion.alternativa}.` : '.'}
                          </p>
                          {accion.mando && <p><span className="controles__etiqueta">Mando</span> {accion.mando}</p>}
                          {accion.detalle && <p className="controles__detalle">{accion.detalle}</p>}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {capturasDisponibles.has(grupo.imagen) && (
                    <figure className="controles__referencia">
                      <button type="button" className="controles__ampliar" aria-label={`Ampliar imagen de ${grupo.titulo}`} onClick={(evento) => { retornoFocoRef.current = evento.currentTarget; setImagenAmpliada(indice); }}>
                        <img src={`${import.meta.env.BASE_URL}images/controles/${grupo.imagen}`} alt={`Captura original de controles: ${grupo.titulo}`} loading="lazy" />
                      </button>
                      <figcaption>Pulsa la imagen para ampliarla</figcaption>
                    </figure>
                  )}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section id="galeria" className="seccion">
          <div className="seccion__cabecera">
            <p className="seccion__numero">Galería</p>
            <h2 className="seccion__titulo">Bocetos conceptuales</h2>
            <p className="seccion__texto">
              Primeros símbolos visuales del mundo de Felinaria, previos al arte final en pixelart.
            </p>
          </div>

          <div className="galeria">
            <figure className="galeria__lugar">
              <img src={imagen('colonia-sol.png')} alt="Boceto conceptual de la Colonia del Sol" loading="lazy" />
              <figcaption>
                <strong>Colonia del Sol</strong>
                <span>El comienzo de la aventura</span>
              </figcaption>
            </figure>
            <figure className="galeria__lugar">
              <img src={imagen('colonia-de-la-luna.png')} alt="Boceto conceptual de la Colonia de la Luna" loading="lazy" />
              <figcaption>
                <strong>Colonia de la Luna</strong>
                <span>Territorio de antiguos conflictos</span>
              </figcaption>
            </figure>
            <figure className="galeria__lugar">
              <img src={imagen('colonia-del-oleaje.png')} alt="Boceto conceptual de la Colonia del Oleaje" loading="lazy" />
              <figcaption>
                <strong>Colonia del Oleaje</strong>
                <span>Las tierras costeras</span>
              </figcaption>
            </figure>
            <figure className="galeria__lugar">
              <img src={imagen('manada-del-colmillo.png')} alt="Boceto conceptual de la Manada del Colmillo" loading="lazy" />
              <figcaption>
                <strong>Manada del Colmillo</strong>
                <span>Una amenaza más allá del mar</span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section id="descargables" className="seccion">
          <div className="seccion__cabecera">
            <p className="seccion__numero">Descargables</p>
            <h2 className="seccion__titulo">Lleva Felinaria contigo</h2>
            <p className="seccion__texto">Explora el universo de Felinaria desde tu navegador o instala nuestra futura aplicación móvil.</p>
          </div>

          <div className="descargables">
            <article className="descargables__tarjeta descargables__tarjeta--web">
              <div className="descargables__cabecera">
                <img className="descargables__icono" src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="Emblema de Felinaria Web" width="64" height="64" />
                <div>
                  <p className="descargables__tipo">Web instalable</p>
                  <h3>Felinaria Web</h3>
                </div>
                <span className="descargables__estado">Disponible</span>
              </div>
              <p>Instala Felinaria en tu dispositivo y consulta sus historias, personajes y contenido principal incluso sin conexión, después de la carga inicial.</p>
              <p className="descargables__compatibilidad">Para navegadores y dispositivos compatibles. En iPhone y iPad, utiliza las opciones de compartir del navegador.</p>

              <div className="descargables__acciones">
                {instalada ? (
                  <span className="descargables__instalada" role="status">Felinaria ya está instalada en esta ventana</span>
                ) : resultadoInstalacion ? (
                  <span className="descargables__instalada" role="status">{resultadoInstalacion}</span>
                ) : instalacionDisponible && !sinConexion ? (
                  <button type="button" className="descargables__boton" onClick={instalar}>Instalar Felinaria Web</button>
                ) : (
                  <p className="descargables__instruccion">Instálala desde el menú de tu navegador. Consulta el tutorial para encontrar la opción.</p>
                )}
                <button type="button" className="descargables__boton descargables__boton--secundario" aria-expanded={tutorialPwaAbierto} aria-controls="tutorialPwa" onClick={() => setTutorialPwaAbierto(!tutorialPwaAbierto)}>
                  {tutorialPwaAbierto ? 'Ocultar tutorial de instalación' : 'Ver tutorial de instalación'}
                </button>
              </div>

              <div className="descargables__tutorial" id="tutorialPwa" hidden={!tutorialPwaAbierto}>
                <p>La instalación se realiza desde el navegador; la opción puede variar según el dispositivo.</p>
                <details>
                  <summary>Android</summary>
                  <ol>
                    <li>Abre la página de Felinaria en un navegador compatible.</li>
                    <li>Abre el menú del navegador.</li>
                    <li>Busca «Instalar aplicación» o «Agregar a pantalla de inicio».</li>
                    <li>Confirma la instalación o creación del acceso.</li>
                    <li>Abre Felinaria desde su icono.</li>
                  </ol>
                </details>
                <details>
                  <summary>Windows / PC</summary>
                  <ol>
                    <li>Abre Felinaria en Chrome, Edge o Brave.</li>
                    <li>Utiliza la opción de instalación disponible en el navegador o su menú.</li>
                    <li>Confirma la instalación.</li>
                    <li>Abre Felinaria desde su acceso instalado.</li>
                  </ol>
                </details>
                <details>
                  <summary>iPhone / iPad</summary>
                  <ol>
                    <li>Abre Felinaria en un navegador compatible.</li>
                    <li>Abre el menú de compartir.</li>
                    <li>Selecciona «Añadir a pantalla de inicio» cuando esté disponible.</li>
                    <li>Confirma y abre Felinaria desde el icono.</li>
                  </ol>
                </details>
              </div>
            </article>

            <article className="descargables__tarjeta descargables__tarjeta--android">
              <div className="descargables__cabecera">
                <svg className="descargables__icono" role="img" aria-label="Dispositivo Android" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="15" y="3" width="34" height="58" rx="4" />
                  <path d="M26 9h12M29 55h6M23 34a9 9 0 0 1 18 0v9H23zM26 24l-3-4m15 4 3-4M28 36h1m7 0h1" strokeLinecap="round" />
                </svg>
                <div>
                  <p className="descargables__tipo">Aplicación Android</p>
                  <h3>Felinaria para Android</h3>
                </div>
                <span className="descargables__estado">{apkPublicada ? 'Disponible' : 'En desarrollo'}</span>
              </div>
              <p>Estamos desarrollando una versión para dispositivos Android. Próximamente podrás descargarla e instalarla directamente en tu teléfono.</p>
              <p className="descargables__compatibilidad">Aplicación independiente para Android. La APK no funciona directamente en iPhone ni iPad.</p>

              <div className="descargables__acciones">
                {apkPublicada && !sinConexion ? (
                  <a className="descargables__boton" href={`${import.meta.env.BASE_URL}${apkConfig.ruta}`} download={apkConfig.nombreArchivo}>Descargar APK</a>
                ) : (
                  <button type="button" className="descargables__boton" disabled>{apkPublicada ? 'Descarga no disponible sin conexión' : 'Descargar APK · Próximamente'}</button>
                )}
                <button type="button" className="descargables__boton descargables__boton--secundario" aria-expanded={tutorialApkAbierto} aria-controls="tutorialApk" onClick={() => setTutorialApkAbierto(!tutorialApkAbierto)}>
                  {tutorialApkAbierto ? 'Ocultar tutorial para Android' : 'Cómo instalar Felinaria en Android'}
                </button>
              </div>

              <div className="descargables__tutorial" id="tutorialApk" hidden={!tutorialApkAbierto}>
                <ol>
                  <li>Cuando se publique, pulsa «Descargar APK».</li>
                  <li>Espera a que finalice la descarga.</li>
                  <li>Abre el archivo desde Descargas o el gestor de archivos.</li>
                  <li>Si Android solicita autorizar instalaciones desde esa aplicación de origen, revisa la procedencia del archivo y concede el permiso únicamente si confías en él.</li>
                  <li>Confirma la instalación siguiendo los mensajes del sistema.</li>
                  <li>Abre Felinaria desde el menú de aplicaciones.</li>
                </ol>
                <p className="descargables__advertencia">Instala únicamente archivos APK provenientes de fuentes confiables. No desactives las protecciones generales del dispositivo.</p>
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer className="pie" id="equipo">
        <ul className="pie__equipo">
          <li>Bernal Arias Diana Laura</li>
          <li>Topete Sánchez José Carlos</li>
          <li>Ramos Díaz Aldair Alejandro</li>
          <li>Rosales García Sherlyn Vanessa</li>
          <li>Bernal Hernández Brandon Eduardo</li>
          <li>Mendoza Salas Gilberto Alonso</li>
        </ul>
        <p>© 2026 Felinaria.</p>
      </footer>

      <div className="aviso-sin-conexion" role="status" hidden={!sinConexion}>
        Sin conexión · contenido disponible sin Internet
      </div>

      {imagenAmpliada !== null && (
        <dialog className="visor-controles" ref={visorRef} aria-label={`Imagen ampliada de ${controles[imagenAmpliada].titulo}`} onClick={(evento) => { if (evento.target === evento.currentTarget) setImagenAmpliada(null); }}>
          <button type="button" className="visor-controles__cerrar" onClick={() => setImagenAmpliada(null)}>Cerrar <span aria-hidden="true">×</span></button>
          <img src={`${import.meta.env.BASE_URL}images/controles/${controles[imagenAmpliada].imagen}`} alt={`Captura original de controles: ${controles[imagenAmpliada].titulo}`} />
        </dialog>
      )}

      {galeriaAbierta && (
        <dialog className="galeria-personajes" ref={galeriaRef} aria-label="Galería de El aprendiz" onClick={(evento) => { if (evento.target === evento.currentTarget) setGaleriaAbierta(false); }}>
          <button type="button" className="galeria-personajes__cerrar" onClick={() => setGaleriaAbierta(false)}>Cerrar <span aria-hidden="true">×</span></button>
          <figure className="galeria-personajes__lienzo">
            <img src={imagen(imagenesAprendiz[galeriaIndice])} alt={`El aprendiz, imagen ${galeriaIndice + 1} de ${imagenesAprendiz.length}`} />
          </figure>
          <div className="galeria-personajes__pie">
            <button
              type="button"
              className="galeria-personajes__flecha"
              aria-label="Imagen anterior"
              onClick={() => setGaleriaIndice((i) => (i - 1 + imagenesAprendiz.length) % imagenesAprendiz.length)}
            >‹</button>
            <ul className="galeria-personajes__miniaturas">
              {imagenesAprendiz.map((nombre, indice) => (
                <li key={nombre}>
                  <button
                    type="button"
                    className={`galeria-personajes__miniatura${indice === galeriaIndice ? ' activa' : ''}`}
                    aria-label={`Ver imagen ${indice + 1} de ${imagenesAprendiz.length}`}
                    aria-current={indice === galeriaIndice ? 'true' : undefined}
                    onClick={() => setGaleriaIndice(indice)}
                  >
                    <img src={imagen(nombre)} alt="" loading="lazy" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="galeria-personajes__flecha"
              aria-label="Imagen siguiente"
              onClick={() => setGaleriaIndice((i) => (i + 1) % imagenesAprendiz.length)}
            >›</button>
          </div>
          <p className="galeria-personajes__contador" role="status">{galeriaIndice + 1} / {imagenesAprendiz.length}</p>
        </dialog>
      )}
    </>
  );
}
