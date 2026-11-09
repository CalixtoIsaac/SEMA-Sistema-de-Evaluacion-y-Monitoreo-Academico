/**
 * UI kit: utilidades compartidas por todas las pantallas.
 *
 *  Seguridad     UI.escape(texto)
 *  Sesión        UI.getToken() · UI.getUser() · UI.setSession() · UI.setUser() · UI.clearSession()
 *  API           UI.api('/ruta', { method, body })  → agrega el token y lanza Error si falla
 *                UI.upload('/ruta', archivo, 'campo') → envía un archivo (multipart) con el token
 *  Semáforo      UI.badgeEstado(estado, { motivo, titulo }) · UI.estadoTexto(estado) · UI.tendencia(valor)
 *  Componentes   UI.toast() · UI.confirm() · UI.formModal() · UI.setBusy()
 *  Iconos        UI.icon('nombre') · UI.hydrateIcons(raiz)
 *  Formato       UI.formatDate() · UI.initials()
 */
const UI = (() => {
  const TOKEN_KEY = 'app.token';
  const USER_KEY = 'app.user';
  const MESSAGE_KEY = 'app.authMessage';
  let uid = 0;

  // ---------- Seguridad ----------
  const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  /** Escapa un valor antes de insertarlo en HTML. Úsalo SIEMPRE con datos del usuario. */
  function escape(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
  }

  // ---------- Almacenamiento seguro (no falla si está bloqueado) ----------
  const store = {
    get(area, key) { try { return window[area].getItem(key); } catch { return null; } },
    set(area, key, value) { try { window[area].setItem(key, value); } catch { /* sin persistencia */ } },
    remove(area, key) { try { window[area].removeItem(key); } catch { /* nada */ } }
  };

  // ---------- Sesión ----------
  function getToken() { return store.get('localStorage', TOKEN_KEY); }
  function getUser() {
    try { return JSON.parse(store.get('localStorage', USER_KEY)) || null; } catch { return null; }
  }
  function setUser(user) { store.set('localStorage', USER_KEY, JSON.stringify(user)); }
  function setSession(token, user) {
    store.set('localStorage', TOKEN_KEY, token);
    setUser(user);
  }
  /** Cierra la sesión. El mensaje opcional se muestra en la pantalla de login. */
  function clearSession(message) {
    store.remove('localStorage', TOKEN_KEY);
    store.remove('localStorage', USER_KEY);
    if (message) store.set('sessionStorage', MESSAGE_KEY, message);
  }
  function takeAuthMessage() {
    const msg = store.get('sessionStorage', MESSAGE_KEY);
    store.remove('sessionStorage', MESSAGE_KEY);
    return msg;
  }

  // ---------- API ----------
  /**
   * Llama a la API del servidor.
   *   await UI.api('/alumnos')                                → GET
   *   await UI.api('/alumnos', { method: 'POST', body: {...} }) → POST con JSON
   * Si el servidor responde con error, lanza un Error con su mensaje.
   * Si la sesión ya no es válida, vuelve al login.
   */
  async function api(path, { method = 'GET', body } = {}) {
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
    if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

    let res;
    try {
      res = await fetch('/api' + path, {
        method,
        headers,
        body: body === undefined ? undefined : (isForm ? body : JSON.stringify(body))
      });
    } catch {
      throw new Error('No se pudo contactar al servidor. Revisa que esté en ejecución.');
    }

    const text = await res.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = { error: text }; }
    }

    if (res.status === 401 && data && data.code === 'AUTH_REQUIRED') {
      clearSession(data.error);
      location.replace('/');
    }
    if (!res.ok) {
      const err = new Error((data && data.error) || `Error ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  /** Sube un archivo como multipart/form-data. El navegador pone el Content-Type con su boundary. */
  function upload(path, file, field = 'archivo') {
    const form = new FormData();
    form.append(field, file, file.name);
    return api(path, { method: 'POST', body: form });
  }

  // ---------- Iconos (trazos de 24×24) ----------
  const ICONS = {
    logo: '<path d="M12 3 3 8l9 5 9-5z"/><path d="m3 13 9 5 9-5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 6-6"/>',
    upload: '<path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
    notes: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    pencil: '<path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    progress: '<path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 8v4l2.5 2.5"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    xCircle: '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    warning: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    minusCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h2M8 17h2M14 13h2M14 17h2"/>',
    arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    arrowDown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    minus: '<path d="M5 12h14"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>',
    dots: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    list: '<path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 9.2-9.2M17 6l3 3M15 8l2 2"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-4.1-4-7.4-9-7.4z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7" r="1"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
    form: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'
  };

  function icon(name, extraClass = '') {
    return `<svg class="icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;
  }
  /** Reemplaza cada <span data-icon="nombre"> por su SVG. */
  function hydrateIcons(root = document) {
    root.querySelectorAll('[data-icon]').forEach((el) => { el.outerHTML = icon(el.dataset.icon); });
  }

  // ---------- Formato ----------
  /** Convierte "2026-10-19 09:30:00" (formato de SQLite) en una fecha legible. */
  function formatDate(value) {
    if (!value) return '';
    const date = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  }
  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  }

  // ---------- Semáforo (HU-16, context/07 §4) ----------
  // El color nunca va solo: cada estado lleva ícono y texto (context/05 §1).
  const ESTADOS = {
    correcto:   { texto: 'Correcto',   icono: 'checkCircle' },
    preventivo: { texto: 'Preventivo', icono: 'warning' },
    critico:    { texto: 'Crítico',    icono: 'xCircle' },
    sin_datos:  { texto: 'Sin datos',  icono: 'help' },
    baja:       { texto: 'Baja',       icono: 'minusCircle' }
  };
  const MOTIVOS = {
    promedio: 'Por promedio',
    faltas: 'Por faltas',
    sin_derecho: 'Sin derecho en una materia (SD)'
  };
  function estadoTexto(estado) { return (ESTADOS[estado] || ESTADOS.sin_datos).texto; }
  function motivoTexto(motivo) { return MOTIVOS[motivo] || ''; }
  /** Clase CSS del estado: badge-correcto, badge-sin-datos… (public/css/semaforo.css). */
  function estadoClase(estado) { return 'estado-' + String(ESTADOS[estado] ? estado : 'sin_datos').replace('_', '-'); }
  /**
   * Insignia del semáforo.
   *   UI.badgeEstado('critico', { motivo: 'faltas' }) → <span class="badge badge-estado badge-critico">✕ Crítico</span>
   */
  function badgeEstado(estado, { motivo, titulo } = {}) {
    const e = ESTADOS[estado] || ESTADOS.sin_datos;
    const tip = titulo || motivoTexto(motivo);
    const key = ESTADOS[estado] ? estado : 'sin_datos';
    return `<span class="badge badge-estado badge-${key.replace('_', '-')}"${tip ? ` title="${escape(tip)}"` : ''}>` +
      `${icon(e.icono)}${escape(e.texto)}${tip ? `<span class="sr-only">. ${escape(tip)}</span>` : ''}</span>`;
  }
  /** Flecha de tendencia (M-05): ↑ mejora · ↓ empeora · – estable. Vacío si no hay historial. */
  function tendencia(valor) {
    const t = {
      mejora: { icono: 'arrowUp', texto: 'Mejoró desde la carga anterior' },
      empeora: { icono: 'arrowDown', texto: 'Empeoró desde la carga anterior' },
      estable: { icono: 'minus', texto: 'Sin cambios desde la carga anterior' }
    }[valor];
    if (!t) return '';
    return `<span class="tendencia tendencia-${valor}" title="${t.texto}">${icon(t.icono)}<span class="sr-only">${t.texto}</span></span>`;
  }

  // ---------- Códigos de actividad (context/05 §8) ----------
  const CODIGOS = {
    NE: { texto: 'No entregó', clase: 'codigo-gris' },
    SC: { texto: 'Sin calificar: el profesor no subió la calificación', clase: 'codigo-gris' },
    DA: { texto: 'Deshonestidad académica', clase: 'codigo-rojo' },
    SD: { texto: 'Sin derecho', clase: 'codigo-rojo' }
  };
  function chipCodigo(codigo) {
    const c = CODIGOS[codigo] || { texto: 'Código desconocido', clase: 'codigo-gris' };
    return `<span class="chip-codigo ${c.clase}" title="${escape(c.texto)}">${escape(codigo)}<span class="sr-only"> (${escape(c.texto)})</span></span>`;
  }

  /** "2026-10-06" → "6 oct" (con año si no es el actual). */
  function fechaCorta(value) {
    if (!value) return '';
    const d = new Date(String(value).slice(0, 10) + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return String(value);
    const opts = { day: 'numeric', month: 'short' };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString('es-MX', opts).replace('.', '');
  }

  // ---------- Lista de seguimiento elegida (M-03, compartida por Menú principal y Alumnos) ----------
  const LISTA_KEY = 'sema.lista';
  function getLista() {
    const v = store.get('sessionStorage', LISTA_KEY);
    return v && /^\d+$/.test(v) ? Number(v) : null;
  }
  function setLista(id) {
    if (id) store.set('sessionStorage', LISTA_KEY, String(id));
    else store.remove('sessionStorage', LISTA_KEY);
  }

  // ---------- Descargas con sesión (exportar, respaldo) ----------
  /** Descarga un archivo de la API con el token y respeta el nombre que manda el servidor. */
  async function download(path, fallbackName = 'descarga') {
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    let res;
    try { res = await fetch('/api' + path, { headers }); }
    catch { throw new Error('No se pudo contactar al servidor. Revisa que esté en ejecución.'); }
    if (!res.ok) {
      let data = null;
      try { data = await res.json(); } catch { /* sin cuerpo */ }
      if (res.status === 401 && data && data.code === 'AUTH_REQUIRED') { clearSession(data.error); location.replace('/'); }
      throw new Error((data && data.error) || `Error ${res.status}`);
    }
    const disp = res.headers.get('Content-Disposition') || '';
    const star = disp.match(/filename\*=UTF-8''([^;]+)/i);
    const plain = disp.match(/filename="?([^";]+)"?/i);
    const name = star ? decodeURIComponent(star[1]) : (plain ? plain[1] : fallbackName);
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return name;
  }

  // ---------- Botón ocupado ----------
  function setBusy(button, busy) {
    if (!button) return;
    if (busy) {
      if (button.dataset.busy) return;
      button.dataset.busy = '1';
      button.dataset.label = button.innerHTML;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.innerHTML = `<span class="spinner" aria-hidden="true"></span>${button.dataset.label}`;
    } else if (button.dataset.busy) {
      button.innerHTML = button.dataset.label;
      button.disabled = false;
      button.removeAttribute('aria-busy');
      delete button.dataset.busy;
      delete button.dataset.label;
    }
  }

  // ---------- Notificaciones ----------
  /**
   * Notificación breve. action opcional: { label: 'Ver alumnos', href: '#alumnos' }.
   */
  function toast(message, type = 'info', action) {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('role', 'status');
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = icon({ success: 'check', error: 'alert' }[type] || 'info') + `<span>${escape(message)}</span>`;
    if (action && action.href) {
      const link = document.createElement('a');
      link.className = 'toast-action';
      link.href = action.href;
      link.textContent = action.label;
      link.addEventListener('click', () => el.remove());
      el.appendChild(link);
    }
    stack.appendChild(el);
    setTimeout(() => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 220);
    }, type === 'error' || action ? 6000 : 3200);
  }

  // ---------- Modal base ----------
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function openDialog({ title, description = '', bodyHtml = '', footerHtml = '', as = 'div', onClose }) {
    const previousFocus = document.activeElement;
    const titleId = `dialog-title-${++uid}`;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <${as} class="modal" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
        <div class="modal-header">
          <h2 id="${titleId}">${escape(title)}</h2>
          ${description ? `<p>${escape(description)}</p>` : ''}
        </div>
        ${bodyHtml ? `<div class="modal-body">${bodyHtml}</div>` : ''}
        <div class="modal-footer">${footerHtml}</div>
      </${as}>`;
    const modal = overlay.firstElementChild;
    let closed = false;

    function close() {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey, true);
      overlay.remove();
      if (previousFocus && previousFocus.focus) previousFocus.focus();
      if (onClose) onClose();
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
      if (e.key !== 'Tab') return;
      const items = [...modal.querySelectorAll(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(overlay);
    return { el: modal, close };
  }

  /**
   * Diálogo de confirmación.
   *   if (await UI.confirm({ title: '¿Eliminar?', message: '...', confirmText: 'Eliminar', danger: true })) { ... }
   */
  function confirm({ title = '¿Estás seguro?', message = '', confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false } = {}) {
    return new Promise((resolve) => {
      const dialog = openDialog({
        title,
        description: message,
        footerHtml: `
          <button type="button" class="btn btn-outline" data-action="cancel">${escape(cancelText)}</button>
          <button type="button" class="btn ${danger ? 'btn-destructive' : 'btn-primary'}" data-action="ok">${escape(confirmText)}</button>`,
        onClose: () => resolve(false)
      });
      dialog.el.querySelector('[data-action="cancel"]').addEventListener('click', dialog.close);
      const ok = dialog.el.querySelector('[data-action="ok"]');
      ok.addEventListener('click', () => { resolve(true); dialog.close(); });
      ok.focus();
    });
  }

  function fieldHtml(field, value) {
    const id = `field-${field.name}-${++uid}`;
    const attrs = [
      `id="${id}"`,
      `name="${escape(field.name)}"`,
      field.required ? 'required' : '',
      field.maxlength ? `maxlength="${Number(field.maxlength)}"` : '',
      field.placeholder ? `placeholder="${escape(field.placeholder)}"` : ''
    ].filter(Boolean).join(' ');

    let control;
    if (field.type === 'textarea') {
      control = `<textarea class="input textarea" ${attrs} rows="${field.rows || 4}">${escape(value)}</textarea>`;
    } else if (field.type === 'select') {
      const options = (field.options || []).map((o) =>
        `<option value="${escape(o.value)}"${String(o.value) === String(value) ? ' selected' : ''}>${escape(o.label)}</option>`
      ).join('');
      control = `<div class="select-wrap"><select class="input select" ${attrs}>${options}</select></div>`;
    } else {
      control = `<input class="input" type="${escape(field.type || 'text')}" ${attrs} value="${escape(value)}">`;
    }
    return `
      <div class="field">
        <label for="${id}">${escape(field.label)}</label>
        ${control}
        ${field.hint ? `<p class="hint">${escape(field.hint)}</p>` : ''}
      </div>`;
  }

  /**
   * Formulario en un modal. Resuelve con lo que devuelva onSubmit (o con los
   * valores si no hay onSubmit), o con null si se cancela.
   * Si onSubmit lanza un error, el mensaje se muestra dentro del modal.
   *
   *   const guardado = await UI.formModal({
   *     title: 'Nuevo cliente',
   *     fields: [{ name: 'nombre', label: 'Nombre', required: true }],
   *     onSubmit: (values) => UI.api('/clientes', { method: 'POST', body: values })
   *   });
   */
  function formModal({ title, description = '', fields, values = {}, submitText = 'Guardar', danger = false, onSubmit }) {
    return new Promise((resolve) => {
      const dialog = openDialog({
        title,
        description,
        as: 'form',
        bodyHtml: `
          <div class="form">
            ${fields.map((f) => fieldHtml(f, values[f.name] ?? f.default ?? '')).join('')}
            <div class="alert alert-error" data-form-error role="alert" hidden></div>
          </div>`,
        footerHtml: `
          <button type="button" class="btn btn-outline" data-action="cancel">Cancelar</button>
          <button type="submit" class="btn ${danger ? 'btn-destructive' : 'btn-primary'}">${escape(submitText)}</button>`,
        onClose: () => resolve(null)
      });

      const form = dialog.el;
      const errorBox = form.querySelector('[data-form-error]');
      const submit = form.querySelector('[type="submit"]');
      form.querySelector('[data-action="cancel"]').addEventListener('click', dialog.close);

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorBox.hidden = true;
        const data = {};
        for (const f of fields) data[f.name] = String(form.elements[f.name].value).trim();

        if (!onSubmit) { resolve(data); dialog.close(); return; }
        setBusy(submit, true);
        try {
          const result = await onSubmit(data);
          resolve(result === undefined ? data : result);
          dialog.close();
        } catch (err) {
          errorBox.textContent = err.message;
          errorBox.hidden = false;
          setBusy(submit, false);
        }
      });

      const first = form.querySelector('input, textarea, select');
      if (first) first.focus();
    });
  }

  // Menús desplegables <details class="menu">: se cierran al hacer clic fuera o con Escape.
  if (typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
      document.querySelectorAll('details.menu[open]').forEach((m) => { if (!m.contains(e.target)) m.open = false; });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('details.menu[open]').forEach((m) => { m.open = false; m.querySelector('summary').focus(); });
    });
  }

  return {
    escape,
    getToken, getUser, setUser, setSession, clearSession, takeAuthMessage,
    api, upload,
    icon, hydrateIcons,
    formatDate, initials,
    badgeEstado, estadoTexto, estadoClase, motivoTexto, tendencia, chipCodigo, fechaCorta,
    getLista, setLista, download, openDialog,
    setBusy, toast, confirm, formModal
  };
})();
