// Abre y cierra el menú de navegación en pantallas pequeñas.
const botonMenu = document.getElementById('botonMenu');
const navPrincipal = document.getElementById('navPrincipal');

botonMenu.addEventListener('click', () => {
  const abierto = navPrincipal.classList.toggle('abierto');
  botonMenu.setAttribute('aria-expanded', abierto);
});

// Cierra el menú al elegir un enlace (útil en móvil).
navPrincipal.querySelectorAll('a').forEach((enlace) => {
  enlace.addEventListener('click', () => {
    navPrincipal.classList.remove('abierto');
    botonMenu.setAttribute('aria-expanded', 'false');
  });
});

// Muestra u oculta la historia completa.
const botonHistoria = document.getElementById('botonHistoria');
const historiaCompleta = document.getElementById('historiaCompleta');

botonHistoria.addEventListener('click', () => {
  const abrir = historiaCompleta.hidden;
  historiaCompleta.hidden = !abrir;
  botonHistoria.setAttribute('aria-expanded', abrir);
  botonHistoria.textContent = abrir ? 'Ocultar historia completa' : 'Leer la historia completa';
});
