/**
 * Estructura de la aplicación: sesión, menú lateral y navegación entre vistas.
 *
 * Cada vista es un módulo con un método mount(contenedor).
 * Para agregar una pantalla nueva:
 *   1. Crea public/js/mi-modulo.js (IIFE con mount(contenedor), como inicio.js).
 *   2. Cárgalo en app.html antes de app.js.
 *   3. Regístralo en VIEWS y agrega su enlace en el menú de app.html.
 */
(() => {
  const VIEWS = {
    resumen: { title: 'Menú principal', module: () => Inicio },
    cargar: { title: 'Cargar datos', module: () => Cargar },
    alumnos: { title: 'Alumnos', module: () => Alumnos },
    perfil: { title: 'Perfil', module: () => Perfil }
  };
  const DEFAULT_VIEW = 'resumen';

  const $ = (id) => document.getElementById(id);

  if (!UI.getToken()) {
    location.replace('/');
    return;
  }

  UI.hydrateIcons(document);

  // ---------- Usuario ----------
  function renderUser(user) {
    if (!user) return;
    $('userName').textContent = user.nombre;
    $('userHandle').textContent = '@' + user.usuario;
    $('userAvatar').textContent = UI.initials(user.nombre);
  }

  async function refreshUser() {
    try {
      const { user } = await UI.api('/auth/me');
      UI.setUser(user);
      renderUser(user);
      // Tema guardado en la cuenta (#49 · M-13); theme.js ya aplicó el del navegador sin parpadeo.
      if (window.SemaTheme && user.tema) SemaTheme.setPreference(user.tema);
    } catch (err) {
      if (err.status !== 401) UI.toast(err.message, 'error');
    }
  }

  // Perfil avisa cuando cambian el nombre o el usuario (#33): el menú se actualiza sin cerrar sesión.
  window.addEventListener('sema:user', (e) => renderUser(e.detail));

  // El botón ◐ de la barra superior cambia la misma preferencia de la cuenta (#49).
  window.addEventListener('themepreference', async (e) => {
    try {
      const { user } = await UI.api('/cuenta/preferencias', { method: 'PUT', body: { tema: e.detail.tema } });
      UI.setUser(user);
      window.dispatchEvent(new CustomEvent('sema:preferencias', { detail: user }));
    } catch (err) {
      if (err.status !== 401) UI.toast(`No se guardó el tema en tu cuenta: ${err.message}`, 'error');
    }
  });

  // ---------- Menú lateral (móvil) ----------
  const sidebar = $('sidebar');
  const backdrop = $('sidebarBackdrop');
  const menuBtn = $('menuBtn');

  function setSidebar(open) {
    sidebar.classList.toggle('open', open);
    backdrop.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', () => setSidebar(!sidebar.classList.contains('open')));
  backdrop.addEventListener('click', () => setSidebar(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) setSidebar(false);
  });

  // ---------- Cerrar sesión ----------
  $('logoutBtn').addEventListener('click', async () => {
    const ok = await UI.confirm({
      title: '¿Cerrar sesión?',
      message: 'Tendrás que volver a escribir tu contraseña para entrar.',
      confirmText: 'Cerrar sesión'
    });
    if (!ok) return;
    UI.clearSession();
    location.replace('/');
  });

  // ---------- Navegación ----------
  function navigate() {
    const [requested, param] = location.hash.slice(1).split('/');
    const key = VIEWS[requested] ? requested : DEFAULT_VIEW;
    const view = VIEWS[key];

    document.querySelectorAll('[data-view]').forEach((link) => {
      const active = link.dataset.view === key;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    $('pageTitle').textContent = view.title;
    document.title = `${view.title} · SEMA`;

    // Cada vista recibe un contenedor nuevo: si una petición de la vista anterior termina
    // tarde, su `root.isConnected` es false y ya no pinta encima de la vista actual.
    const container = document.createElement('div');
    container.className = 'view-root';
    $('view').replaceChildren(container);
    view.module().mount(container, param ? decodeURIComponent(param) : undefined);
    setSidebar(false);
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', navigate);

  renderUser(UI.getUser());
  navigate();
  refreshUser();
})();
