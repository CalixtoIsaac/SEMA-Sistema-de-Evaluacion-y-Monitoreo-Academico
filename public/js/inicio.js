/**
 * Menú principal · Resumen administrativo (context/05 §5).
 *
 *   #35 · HU-18/20  Saludo, última actualización, 5 tarjetas, estado vacío y aviso de
 *                   contraseña por defecto (D-18). Clic en tarjetas de estado → Alumnos (M-09).
 *   #36 · HU-19     Gráficas (graficas.js) y selector "Mostrar: Todos / lista" (M-03).
 *   #37 · HU-21     Evolución del desempeño por carga y "N empeoraron · N mejoraron" (M-05).
 *   #38 · HU-22     Alumnos con mayor riesgo (riesgo.js, con topRiesgo de la API).
 *
 * API: GET /api/resumen?lista= (context/06 §7) · GET /api/listas
 */
const Inicio = (() => {
  const ALUMNOS_KEY = 'sema.alumnos.vista';
  const fmt = (n) => Number(n || 0).toLocaleString('es-MX');
  const fmtProm = (v) => (v === null || v === undefined ? '—' : (Math.round(v * 10) / 10).toFixed(1));
  const ETIQUETA = { correcto: 'Correcto', preventivo: 'Preventivo', critico: 'Crítico', sin_datos: 'Sin datos' };

  let root = null;
  let listas = [];

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  /** Abre Alumnos con un chip de estado activo (M-09), conservando la lista elegida. */
  function irAAlumnos(estado) {
    let vista = {};
    try { vista = JSON.parse(sessionStorage.getItem(ALUMNOS_KEY)) || {}; } catch { /* sin almacenamiento */ }
    try {
      sessionStorage.setItem(ALUMNOS_KEY, JSON.stringify({ ...vista, q: '', estado, pagina: 1 }));
    } catch { /* sin almacenamiento */ }
    location.hash = '#alumnos';
  }

  function tarjetas(k) {
    const cards = [
      { label: 'Alumnos', valor: k ? fmt(k.alumnos) : '—', icon: 'users', tone: 'tone-primary', sub: k && k.bajas ? `${fmt(k.bajas)} con baja total` : '' },
      { label: 'Promedio general', valor: k ? fmtProm(k.promedioGeneral) : '—', icon: 'chart', tone: 'tone-info' },
      { label: 'Crítico', valor: k ? fmt(k.critico) : '—', icon: 'xCircle', tone: 'tone-danger', estado: 'critico' },
      { label: 'Preventivo', valor: k ? fmt(k.preventivo) : '—', icon: 'warning', tone: 'tone-warning', estado: 'preventivo' },
      { label: 'Correcto', valor: k ? fmt(k.correcto) : '—', icon: 'checkCircle', tone: 'tone-success', estado: 'correcto' }
    ];
    return cards.map((c) => {
      const tag = c.estado && k ? 'button' : 'div';
      const attrs = tag === 'button' ? ` type="button" data-estado="${c.estado}" aria-label="Ver alumnos en ${c.label}: ${c.valor}"` : '';
      return `
      <${tag} class="card stat"${attrs}>
        <div>
          <p class="stat-label">${UI.escape(c.label)}</p>
          <p class="stat-value">${UI.escape(c.valor)}</p>
          ${c.sub ? `<p class="stat-sub">${UI.escape(c.sub)}</p>` : ''}
        </div>
        <span class="stat-icon ${c.tone}">${UI.icon(c.icon)}</span>
      </${tag}>`;
    }).join('');
  }

  function selectorLista() {
    if (!listas.length) return '';
    const actual = UI.getLista();
    return `
      <label class="mostrar">
        <span>Mostrar:</span>
        <span class="select-wrap"><select class="input select" id="listaSel" aria-label="Mostrar alumnos de">
          <option value="">Todos los alumnos</option>
          ${listas.map((l) => `<option value="${l.id}" ${l.id === actual ? 'selected' : ''}>${UI.escape(l.nombre)} (${fmt(l.encontrados)})</option>`).join('')}
        </select></span>
      </label>`;
  }

  function avisoPassword() {
    const user = UI.getUser() || {};
    if (!user.passwordPorDefecto) return '';
    return `<div class="alert alert-warning aviso" role="status">${UI.icon('key')}
      <span>Estás usando la contraseña por defecto. <a href="#perfil">Cámbiala en Perfil</a> para proteger los datos.</span></div>`;
  }

  function header(datos) {
    const user = UI.getUser() || {};
    const firstName = String(user.nombre || '').split(' ')[0];
    const ultima = datos && datos.ultimaActualizacion
      ? `Última actualización: ${UI.escape(UI.formatDate(datos.ultimaActualizacion))}${datos.periodo ? ` · ${UI.escape(datos.periodo.nombre)}` : ''}`
      : 'Sistema de Evaluación y Monitoreo Académico';
    return `
      <section class="page-header">
        <div>
          <h2>${greeting()}${firstName ? ', ' + UI.escape(firstName) : ''}</h2>
          <p class="muted">${ultima}</p>
        </div>
        ${selectorLista()}
      </section>
      ${avisoPassword()}`;
  }

  function cardGrafica(id, titulo, extra = '') {
    return `
      <section class="card chart-card" aria-labelledby="${id}T">
        <div class="card-header"><h3 id="${id}T">${titulo}</h3>${extra}</div>
        <div class="card-body"><div class="chart-box"><canvas id="${id}" role="img" aria-label="${UI.escape(titulo)}"></canvas></div></div>
      </section>`;
  }

  function renderVacio(datos) {
    root.innerHTML = `
      ${header(datos)}
      <div class="stats">${tarjetas(null)}</div>
      <section class="card">
        <div class="empty-state">
          <span class="empty-icon">${UI.icon('inbox')}</span>
          <h3>${UI.getLista() ? 'Esta lista no tiene alumnos con datos' : 'Aún no hay datos en el sistema'}</h3>
          <p class="muted">${UI.getLista() ? 'Elige "Todos los alumnos" o revisa las matrículas de la lista.' : 'Carga el Excel de monitoreo para ver los indicadores y las gráficas.'}</p>
          ${UI.getLista() ? '' : `<a class="btn btn-primary" href="#cargar">${UI.icon('upload')}Cargar datos</a>`}
        </div>
      </section>`;
    enlazarHeader();
  }

  function render(d) {
    const evo = d.evolucion || [];
    const t = d.tendencias || {};
    root.innerHTML = `
      ${header(d)}
      <div class="stats" id="kpis">${tarjetas(d.kpis)}</div>
      <div class="charts">
        ${cardGrafica('gEstado', 'Alumnos por estado')}
        ${cardGrafica('gRango', 'Distribución de promedios')}
        ${cardGrafica('gMaterias', 'Materias con menor promedio', '<span class="muted small">mín. 5 alumnos</span>')}
        ${cardGrafica('gFaltas', 'Alumnos por estado de faltas')}
      </div>
      <div id="riesgo" class="seccion"></div>
      <section class="card seccion" aria-labelledby="evoT">
        <div class="card-header"><h3 id="evoT">Evolución del desempeño</h3>
          <span class="muted small">Se compara cada carga del periodo; útil desde la 3.ª</span></div>
        <div class="card-body">
          ${evo.length < 2
            ? `<div class="empty-state compact"><span class="empty-icon">${UI.icon('chart')}</span>
                 <p class="muted">La evolución aparecerá cuando cargues datos más de una vez.</p></div>`
            : `<div class="tendencias">
                 <button type="button" class="tend-btn" data-estado="empeora">${UI.tendencia('empeora')}<strong>${fmt(t.empeora)}</strong> empeoraron</button>
                 <span class="tend-btn sin-clic">${UI.tendencia('mejora')}<strong>${fmt(t.mejora)}</strong> mejoraron</span>
                 <span class="muted small">desde la última carga</span>
               </div>
               <div class="chart-box tall"><canvas id="gEvo" role="img" aria-label="Promedio general y porcentaje en Crítico por carga"></canvas></div>`}
        </div>
      </section>`;

    enlazarHeader();
    root.querySelector('#kpis').addEventListener('click', (e) => {
      const b = e.target.closest('[data-estado]');
      if (b) irAAlumnos(b.dataset.estado);
    });
    const emp = root.querySelector('.tend-btn[data-estado]');
    if (emp) emp.addEventListener('click', () => irAAlumnos('empeora'));

    const estados = d.porEstado.map((x) => ({ estado: x.estado, label: ETIQUETA[x.estado], valor: x.total }));
    Graficas.dona(root.querySelector('#gEstado'), estados, { onClick: irAAlumnos });

    const rangoEstado = (r) => (r === '80-89' || r === '90-100' ? 'correcto' : r === '70-79' ? 'preventivo' : 'critico');
    Graficas.barras(root.querySelector('#gRango'), {
      labels: d.porRango.map((x) => x.rango), valores: d.porRango.map((x) => x.total),
      estados: d.porRango.map((x) => rangoEstado(x.rango))
    });

    const mats = d.materiasBajas;
    const gm = root.querySelector('#gMaterias');
    if (mats.length) {
      gm.parentElement.style.height = `${Math.max(180, mats.length * 34 + 40)}px`;
      Graficas.barras(gm, {
        labels: mats.map((m) => m.nombre), valores: mats.map((m) => m.promedio), estados: mats.map((m) => m.estado),
        completos: mats.map((m) => `${m.nombre} · ${fmt(m.alumnos)} alumnos`), horizontal: true, eje: 'Promedio'
      });
    } else {
      gm.parentElement.outerHTML = '<p class="muted">Ninguna materia tiene 5 alumnos o más con calificación.</p>';
    }

    Graficas.barras(root.querySelector('#gFaltas'), {
      labels: d.porEstadoFaltas.map((x) => ETIQUETA[x.estado]), valores: d.porEstadoFaltas.map((x) => x.total),
      estados: d.porEstadoFaltas.map((x) => x.estado)
    });

    if (evo.length >= 2) {
      Graficas.lineas(root.querySelector('#gEvo'), {
        labels: evo.map((e) => UI.fechaCorta(e.fecha)),
        series: [
          { label: 'Promedio general', valores: evo.map((e) => e.promedio), color: 'linea', eje: 'y' },
          { label: '% en Crítico', valores: evo.map((e) => e.porcentajeCritico), color: 'critico', eje: 'y2', sufijo: ' %' }
        ]
      });
    }

    Riesgo.mount(root.querySelector('#riesgo'), d.topRiesgo);
  }

  function enlazarHeader() {
    const sel = root.querySelector('#listaSel');
    if (sel) sel.addEventListener('change', () => { UI.setLista(sel.value ? Number(sel.value) : null); load(); });
  }

  function renderLoading() {
    root.innerHTML = `
      ${header(null)}
      <div class="stats">${'<div class="card stat"><div><p class="stat-label">&nbsp;</p><p class="stat-value"><span class="skeleton"></span></p></div></div>'.repeat(5)}</div>
      <div class="charts">${'<section class="card"><div class="table-skeleton">' + '<span class="skeleton"></span>'.repeat(5) + '</div></section>'.repeat(1)}</div>`;
  }

  function renderError(err) {
    root.innerHTML = `
      ${header(null)}
      <section class="card"><div class="empty-state">
        <span class="empty-icon">${UI.icon('alert')}</span>
        <h3>No se pudo cargar</h3><p class="muted">${UI.escape(err.message)}</p>
        <button class="btn btn-outline" type="button" id="retryBtn">${UI.icon('refresh')}Reintentar</button>
      </div></section>`;
    root.querySelector('#retryBtn').addEventListener('click', load);
  }

  async function load() {
    renderLoading();
    try {
      const [ls] = await Promise.all([UI.api('/listas').catch(() => ({ listas: [] }))]);
      listas = ls.listas || [];
      if (UI.getLista() && !listas.some((l) => l.id === UI.getLista())) UI.setLista(null);
      const lista = UI.getLista();
      const d = await UI.api('/resumen' + (lista ? `?lista=${lista}` : ''));
      if (!root.isConnected) return;
      if (d.vacio) renderVacio(d); else render(d);
    } catch (err) {
      if (root.isConnected) renderError(err);
    }
  }

  function mount(container) {
    root = container;
    load();
  }

  return { mount };
})();
