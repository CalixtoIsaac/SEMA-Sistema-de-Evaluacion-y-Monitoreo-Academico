/**
 * Vista "Alumnos" (context/05 §7).
 *
 *   #21 · HU-13  Tabla: Nombre · Matrícula · Promedio · Faltas · Estado, chips de estado
 *                con conteo (M-02), ⚠ alertas (M-06), paginación de 50 y fila clicable.
 *   #22 · HU-16  Semáforo con texto e ícono (UI.badgeEstado, css/semaforo.css).
 *   (+ búsqueda por palabras sin acentos, base de #23 · HU-14)
 *   #28/#29/#30  "Mostrar: Todos / lista", "Cargar lista" y menú ⋯ de la lista (listas.js).
 *   M-07         Exportar a Excel/CSV exactamente lo que se ve (#42).
 *   #25          El detalle vive en detalle.js.
 *
 * API: GET /api/alumnos?lista= → { alumnos, totales, periodo } (context/06 §6) · GET /api/listas
 * Búsqueda, filtro y página se conservan al volver del detalle (sessionStorage).
 */
const Alumnos = (() => {
  const PAGE_SIZE = 50;
  const STATE_KEY = 'sema.alumnos.vista';
  const CHIPS = [
    { key: 'todos',      label: 'Todos',      icon: null },
    { key: 'critico',    label: 'Crítico',    icon: 'xCircle' },
    { key: 'preventivo', label: 'Preventivo', icon: 'warning' },
    { key: 'correcto',   label: 'Correcto',   icon: 'checkCircle' },
    { key: 'empeora',    label: 'Empeoraron', icon: 'arrowDown' },
    { key: 'sin_datos',  label: 'Sin datos',  icon: 'help' },
    { key: 'baja',       label: 'Bajas',      icon: 'minusCircle' }
  ];
  const ALERTAS = {
    sin_derecho: 'Materia sin derecho (SD)',
    faltas_limite: 'Faltas al límite',
    muchos_ne: 'Muchos NE',
    sin_calificar: 'Actividades sin calificar (SC)',
    deshonestidad: 'Deshonestidad académica (DA)',
    reprobando: 'Materias reprobando',
    empeora: 'Bajó desde la última carga'
  };

  let root = null;
  let datos = null;
  let listas = [];
  let vista = loadState();
  let searchTimer = null;

  function loadState() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STATE_KEY));
      if (saved && typeof saved === 'object') return { q: '', estado: 'todos', pagina: 1, promedio: false, faltas: false, ...saved };
    } catch { /* sin almacenamiento */ }
    return { q: '', estado: 'todos', pagina: 1, promedio: false, faltas: false };
  }
  function saveState() {
    try { sessionStorage.setItem(STATE_KEY, JSON.stringify(vista)); } catch { /* sin almacenamiento */ }
  }

  // Sin acentos ni mayúsculas: "munoz" encuentra "Muñoz" (context/07 §7).
  const normalizar = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const fmt = (n) => Number(n || 0).toLocaleString('es-MX');
  const fmtProm = (v) => (v === null || v === undefined ? null : (Math.round(v * 10) / 10).toFixed(1));

  // ---------- Filtrado ----------
  function coincide(a, palabras) {
    if (!palabras.length) return true;
    const texto = a._busqueda || (a._busqueda = normalizar(`${a.nombreMostrar} ${a.nombre} ${a.matricula}`));
    return palabras.every((p) => texto.includes(p));
  }
  function filtrar() {
    const palabras = normalizar(vista.q).split(/\s+/).filter(Boolean);
    const porBusqueda = datos.alumnos.filter((a) => coincide(a, palabras));
    const conteo = { todos: porBusqueda.length, empeora: 0 };
    for (const a of porBusqueda) {
      conteo[a.estado] = (conteo[a.estado] || 0) + 1;
      if (a.tendencia === 'empeora') conteo.empeora += 1;
    }
    const filtrados = porBusqueda.filter((a) => vista.estado === 'todos'
      || (vista.estado === 'empeora' ? a.tendencia === 'empeora' : a.estado === vista.estado));
    // Primero se filtra y después se ordena (context/07 §6).
    const lista = OrdenBusqueda.ordenarAlumnos(filtrados, { promedio: vista.promedio, faltas: vista.faltas });
    return { lista, conteo };
  }

  // ---------- Render ----------
  function renderShell() {
    root.innerHTML = `
      <section class="page-header">
        <div>
          <h2>Alumnos</h2>
          <p class="muted period-tag" id="periodoTag">&nbsp;</p>
        </div>
        <div class="header-actions" id="headerActions"></div>
      </section>
      <div class="lista-bar" id="listaBar"></div>
      <div id="alumnosBody"></div>`;
  }

  function listaActual() {
    return listas.find((l) => l.id === UI.getLista()) || null;
  }

  // ---------- Listas de seguimiento (#28, #29, #30) ----------
  function renderListaBar() {
    const bar = root.querySelector('#listaBar');
    const actual = listaActual();
    bar.innerHTML = `
      ${listas.length ? `<label class="mostrar">
        <span>Mostrar:</span>
        <span class="select-wrap"><select class="input select" id="listaSel" aria-label="Mostrar alumnos de">
          <option value="">Todos los alumnos</option>
          ${listas.map((l) => `<option value="${l.id}" ${actual && l.id === actual.id ? 'selected' : ''}>${UI.escape(l.nombre)} (${fmt(l.encontrados)}${l.total !== l.encontrados ? ` de ${fmt(l.total)}` : ''})</option>`).join('')}
        </select></span>
      </label>` : ''}
      ${actual ? `<details class="menu" id="listaMenu">
        <summary class="btn btn-ghost btn-icon" aria-label="Opciones de la lista «${UI.escape(actual.nombre)}»" title="Opciones de la lista">${UI.icon('dots')}</summary>
        <div class="menu-items" role="menu">
          <button type="button" role="menuitem" data-accion="renombrar">${UI.icon('pencil')}Renombrar</button>
          <button type="button" role="menuitem" data-accion="reemplazar">${UI.icon('upload')}Reemplazar con otro Excel</button>
          <button type="button" role="menuitem" class="peligro" data-accion="eliminar">${UI.icon('trash')}Eliminar lista</button>
        </div>
      </details>` : ''}
      <button type="button" class="btn btn-outline btn-sm" id="cargarLista">${UI.icon('list')}Cargar lista</button>`;

    const sel = bar.querySelector('#listaSel');
    if (sel) sel.addEventListener('change', () => {
      UI.setLista(sel.value ? Number(sel.value) : null);
      vista.pagina = 1; saveState(); load();
    });
    bar.querySelector('#cargarLista').addEventListener('click', async () => {
      const lista = await Listas.cargar();
      if (!lista) return;
      UI.setLista(lista.id); vista.pagina = 1; saveState();
      UI.toast(`Lista «${lista.nombre}» guardada · ${fmt(lista.encontrados)} de ${fmt(lista.total)} alumnos encontrados`, 'success');
      load();
    });
    const menu = bar.querySelector('#listaMenu');
    if (menu) {
      menu.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-accion]');
        if (!b) return;
        menu.open = false;
        try {
          if (b.dataset.accion === 'renombrar') {
            const l = await Listas.renombrar(actual);
            if (l) { UI.toast('Lista renombrada', 'success'); load(); }
          } else if (b.dataset.accion === 'reemplazar') {
            const l = await Listas.cargar(actual);
            if (l) { UI.toast(`Lista «${l.nombre}» actualizada · ${fmt(l.total)} matrículas`, 'success'); load(); }
          } else if (await Listas.eliminar(actual)) {
            UI.setLista(null); UI.toast('Lista eliminada; los alumnos se conservan', 'success'); load();
          }
        } catch (err) { UI.toast(err.message, 'error'); }
      });
    }
  }

  // ---------- Exportar (M-07, #42) ----------
  function renderExportar() {
    const box = root.querySelector('#headerActions');
    if (!datos || !datos.alumnos.length) { box.innerHTML = ''; return; }
    box.innerHTML = `
      <details class="menu" id="exportMenu">
        <summary class="btn btn-outline">${UI.icon('download')}Exportar</summary>
        <div class="menu-items right" role="menu">
          <button type="button" role="menuitem" data-formato="xlsx">${UI.icon('file')}Excel (.xlsx)</button>
          <button type="button" role="menuitem" data-formato="csv">${UI.icon('file')}CSV</button>
        </div>
      </details>`;
    const menu = box.querySelector('#exportMenu');
    menu.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-formato]');
      if (!b) return;
      menu.open = false;
      // Mismos filtros, búsqueda y orden que la tabla (context/05 §7).
      const params = new URLSearchParams({ formato: b.dataset.formato, estado: vista.estado, q: vista.q.trim() });
      const orden = [vista.promedio && 'promedio', vista.faltas && 'faltas'].filter(Boolean).join(',');
      if (orden) params.set('orden', orden);
      if (listaActual()) params.set('lista', listaActual().id);
      try {
        const nombre = await UI.download(`/alumnos/exportar?${params}`, `SEMA_alumnos.${b.dataset.formato}`);
        UI.toast(`Descargado ${nombre}`, 'success');
      } catch (err) { UI.toast(err.message, 'error'); }
    });
  }

  function renderLoading() {
    root.querySelector('#alumnosBody').innerHTML = `
      <section class="card"><div class="table-skeleton" aria-busy="true" aria-label="Cargando alumnos">
        ${'<span class="skeleton"></span>'.repeat(8)}
      </div></section>`;
  }

  function renderError(err) {
    root.querySelector('#alumnosBody').innerHTML = `
      <section class="card"><div class="empty-state">
        <span class="empty-icon">${UI.icon('alert')}</span>
        <h3>No se pudo cargar</h3>
        <p class="muted">${UI.escape(err.message)}</p>
        <button class="btn btn-outline" type="button" id="retryBtn">${UI.icon('refresh')}Reintentar</button>
      </div></section>`;
    root.querySelector('#retryBtn').addEventListener('click', load);
  }

  function renderEmpty() {
    const actual = listaActual();
    if (actual) {
      root.querySelector('#alumnosBody').innerHTML = `
      <section class="card"><div class="empty-state">
        <span class="empty-icon">${UI.icon('list')}</span>
        <h3>Ningún alumno de «${UI.escape(actual.nombre)}» tiene datos en este periodo</h3>
        <p class="muted">La lista tiene ${fmt(actual.total)} matrículas; aparecerán cuando el Excel de monitoreo las incluya.</p>
        <button class="btn btn-outline" type="button" id="verTodosLista">Ver todos los alumnos</button>
      </div></section>`;
      root.querySelector('#verTodosLista').addEventListener('click', () => { UI.setLista(null); load(); });
      return;
    }
    root.querySelector('#alumnosBody').innerHTML = `
      <section class="card"><div class="empty-state">
        <span class="empty-icon">${UI.icon('inbox')}</span>
        <h3>Aún no hay alumnos en el sistema</h3>
        <p class="muted">Carga el Excel de monitoreo para ver a cada alumno con su promedio, faltas y estado.</p>
        <a class="btn btn-primary" href="#cargar">${UI.icon('upload')}Cargar datos</a>
      </div></section>`;
  }

  function renderData() {
    const body = root.querySelector('#alumnosBody');
    body.innerHTML = `
      <div class="toolbar">
        <label class="search">
          ${UI.icon('search')}
          <span class="sr-only">Buscar alumno</span>
          <input class="input" type="search" id="buscar" placeholder="Buscar por nombre o matrícula…" autocomplete="off" value="${UI.escape(vista.q)}">
        </label>
        <fieldset class="orden">
          <legend>Ordenar (peor → mejor):</legend>
          <label><input type="checkbox" id="ordenPromedio" ${vista.promedio ? 'checked' : ''}>Promedio</label>
          <label><input type="checkbox" id="ordenFaltas" ${vista.faltas ? 'checked' : ''}>Faltas</label>
        </fieldset>
      </div>
      <div class="chips" id="chips" role="group" aria-label="Filtrar por estado"></div>
      <section class="card">
        <div class="table-wrap" id="tabla"></div>
        <div class="table-footer" id="pie"></div>
      </section>`;

    const input = body.querySelector('#buscar');
    input.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { vista.q = input.value; vista.pagina = 1; saveState(); renderTable(); }, 150);
    });
    // Casillas de orden (#24)
    body.querySelector('#ordenPromedio').addEventListener('change', (e) => {
      vista.promedio = e.target.checked; vista.pagina = 1; saveState(); renderTable();
    });
    body.querySelector('#ordenFaltas').addEventListener('change', (e) => {
      vista.faltas = e.target.checked; vista.pagina = 1; saveState(); renderTable();
    });
    body.querySelector('#chips').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-estado]');
      if (!chip) return;
      // Un clic en el chip activo lo apaga (vuelve a "Todos").
      vista.estado = vista.estado === chip.dataset.estado ? 'todos' : chip.dataset.estado;
      vista.pagina = 1; saveState(); renderTable();
    });
    body.querySelector('#tabla').addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-matricula]');
      if (tr) abrir(tr.dataset.matricula);
    });
    body.querySelector('#tabla').addEventListener('keydown', (e) => {
      const tr = e.target.closest('tr[data-matricula]');
      if (tr && e.key === 'Enter') abrir(tr.dataset.matricula);
    });
    body.querySelector('#pie').addEventListener('click', (e) => {
      const b = e.target.closest('[data-page]');
      if (!b || b.disabled) return;
      vista.pagina = Number(b.dataset.page); saveState(); renderTable();
      body.querySelector('#tabla').scrollTop = 0;
      root.scrollIntoView({ block: 'start' });
    });
    renderTable();
  }

  function renderChips(conteo) {
    const visibles = CHIPS.filter((c) => ['todos', 'critico', 'preventivo', 'correcto'].includes(c.key)
      || conteo[c.key] > 0 || vista.estado === c.key);
    root.querySelector('#chips').innerHTML = visibles.map((c) => `
      <button type="button" class="chip-filtro" data-estado="${c.key}" aria-pressed="${vista.estado === c.key}">
        ${c.icon ? UI.icon(c.icon) : ''}${UI.escape(c.label)}<span class="chip-count">${fmt(conteo[c.key] || 0)}</span>
      </button>`).join('');
  }

  function celdaFaltas(a) {
    if (a.estado === 'baja') return '<span class="muted">—</span>';
    const peor = a.faltasPeorMateria;
    const tip = peor
      ? `Peor materia: ${peor.materia} · ${peor.faltas}${peor.limite ? ` / ${peor.limite}` : ''} faltas`
      : 'Sin faltas registradas';
    return `<span class="estado-num ${UI.estadoClase(a.estadoFaltas)}" title="${UI.escape(tip)}">${fmt(a.faltasTotal)}` +
      `<span class="sr-only">. ${UI.escape(UI.estadoTexto(a.estadoFaltas))}. ${UI.escape(tip)}</span></span>`;
  }

  function celdaPromedio(a) {
    const v = fmtProm(a.promedioGeneral);
    if (v === null) return '<span class="muted">—</span>';
    return `<span class="estado-num ${UI.estadoClase(a.estadoPromedio)}" title="Promedio: ${UI.escape(UI.estadoTexto(a.estadoPromedio))}">${v}</span>`;
  }

  function fila(a) {
    const alertas = (a.alertas || []).map((k) => ALERTAS[k] || k);
    const flag = alertas.length
      ? `<span class="alert-flag" title="${UI.escape(alertas.join(' · '))}">${UI.icon('warning')}<span class="sr-only">Alertas: ${UI.escape(alertas.join(', '))}</span></span>`
      : '';
    const motivo = a.motivoEstado === 'faltas' && a.faltasPeorMateria
      ? `Por faltas: ${a.faltasPeorMateria.materia}`
      : UI.motivoTexto(a.motivoEstado);
    return `
      <tr class="row-link${a.estado === 'baja' ? ' row-baja' : ''}" tabindex="0" data-matricula="${UI.escape(a.matricula)}">
        <td class="wrap"><span class="cell-name">${UI.escape(a.nombreMostrar || a.nombre)}${flag}</span><span class="mono only-mobile">${UI.escape(a.matricula)}</span></td>
        <td class="mono col-opt">${UI.escape(a.matricula)}</td>
        <td class="num">${celdaPromedio(a)}</td>
        <td class="num">${celdaFaltas(a)}</td>
        <td><span class="cell-estado">${UI.badgeEstado(a.estado, { titulo: motivo })}${UI.tendencia(a.tendencia)}</span></td>
      </tr>`;
  }

  function renderTable() {
    const { lista, conteo } = filtrar();
    renderChips(conteo);
    const total = lista.length;
    const paginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
    vista.pagina = Math.min(Math.max(1, vista.pagina), paginas);
    const desde = (vista.pagina - 1) * PAGE_SIZE;
    const pagina = lista.slice(desde, desde + PAGE_SIZE);
    const tabla = root.querySelector('#tabla');
    const pie = root.querySelector('#pie');

    if (!total) {
      const porTexto = vista.q.trim();
      tabla.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">${UI.icon('search')}</span>
          <h3>${porTexto ? `No hay alumnos que coincidan con «${UI.escape(porTexto)}»` : 'No hay alumnos con este estado'}</h3>
          <button class="btn btn-outline" type="button" id="limpiar">${porTexto ? 'Limpiar búsqueda' : 'Ver todos'}</button>
        </div>`;
      tabla.querySelector('#limpiar').addEventListener('click', () => {
        if (porTexto) { vista.q = ''; root.querySelector('#buscar').value = ''; } else vista.estado = 'todos';
        vista.pagina = 1; saveState(); renderTable();
      });
      pie.hidden = true;
      return;
    }

    tabla.innerHTML = `
      <table class="data-table">
        <thead><tr>
          <th scope="col">Nombre</th>
          <th scope="col" class="col-opt">Matrícula</th>
          <th scope="col" class="num" ${vista.promedio ? 'aria-sort="ascending"' : ''}>Promedio${vista.promedio ? ' <span class="orden-flecha" aria-hidden="true">▲</span>' : ''}</th>
          <th scope="col" class="num" ${vista.faltas ? 'aria-sort="descending"' : ''}>Faltas${vista.faltas ? ' <span class="orden-flecha" aria-hidden="true">▼</span>' : ''}</th>
          <th scope="col">Estado</th>
        </tr></thead>
        <tbody>${pagina.map(fila).join('')}</tbody>
      </table>`;

    pie.hidden = false;
    pie.innerHTML = `
      <span>Mostrando ${fmt(desde + 1)}–${fmt(desde + pagina.length)} de ${fmt(total)}</span>
      ${paginas > 1 ? `<nav class="pager" aria-label="Páginas">
        <button class="btn btn-ghost btn-icon btn-sm" type="button" data-page="${vista.pagina - 1}" ${vista.pagina === 1 ? 'disabled' : ''} aria-label="Página anterior">${UI.icon('chevronLeft')}</button>
        ${paginasVisibles(vista.pagina, paginas).map((p) => p === '…'
          ? '<span class="muted">…</span>'
          : `<button class="btn btn-ghost btn-sm" type="button" data-page="${p}" ${p === vista.pagina ? 'aria-current="page"' : ''}>${p}</button>`).join('')}
        <button class="btn btn-ghost btn-icon btn-sm" type="button" data-page="${vista.pagina + 1}" ${vista.pagina === paginas ? 'disabled' : ''} aria-label="Página siguiente">${UI.icon('chevronRight')}</button>
      </nav>` : ''}`;
  }

  function paginasVisibles(actual, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const set = new Set([1, total, actual, actual - 1, actual + 1]);
    const nums = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const out = [];
    nums.forEach((p, i) => { if (i && p - nums[i - 1] > 1) out.push('…'); out.push(p); });
    return out;
  }

  function abrir(matricula) {
    location.hash = `#alumnos/${encodeURIComponent(matricula)}`;
  }

  async function load() {
    renderLoading();
    try {
      listas = (await UI.api('/listas').catch(() => ({ listas: [] }))).listas || [];
      if (UI.getLista() && !listaActual()) UI.setLista(null);
      const actual = listaActual();
      datos = await UI.api('/alumnos' + (actual ? `?lista=${actual.id}` : ''));
      if (!root.isConnected) return;
      const p = datos.periodo;
      root.querySelector('#periodoTag').textContent = p ? `Periodo ${p.nombre}${actual ? ` · Lista «${actual.nombre}»` : ''}` : '';
      renderListaBar();
      renderExportar();
      if (!datos.alumnos.length) return renderEmpty();
      renderData();
    } catch (err) {
      if (root.isConnected) renderError(err);
    }
  }

  function mount(container, matricula) {
    root = container;
    vista = loadState(); // otra vista (p. ej. "Ver todos" del Menú) pudo cambiar el estado guardado
    if (matricula) return Detalle.mount(container, matricula);
    renderShell();
    load();
  }

  return { mount };
})();