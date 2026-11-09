const Riesgo = (() => {
  const TOP = 10;

  const Orden = typeof OrdenBusqueda !== 'undefined'
    ? OrdenBusqueda
    : require('./orden-busqueda.js');

  const STATE_KEY = 'sema.alumnos.vista';

  const fmtProm = (v) => (
    v === null || v === undefined ? '—' : (Math.round(v * 10) / 10).toFixed(1)
  );

  function fila(a) {
    const motivo = a.motivoEstado === 'faltas' && a.faltasPeorMateria
      ? `Por faltas: ${a.faltasPeorMateria.materia}`
      : UI.motivoTexto(a.motivoEstado);

    return `
      <tr class="row-link" tabindex="0" data-matricula="${UI.escape(a.matricula)}">
        <td class="wrap"><span class="cell-name">${UI.escape(a.nombreMostrar || a.nombre)}</span><span class="mono only-mobile">${UI.escape(a.matricula)}</span></td>
        <td class="mono col-opt">${UI.escape(a.matricula)}</td>
        <td class="num"><span class="estado-num ${UI.estadoClase(a.estadoPromedio)}">${fmtProm(a.promedioGeneral)}</span></td>
        <td class="num"><span class="estado-num ${UI.estadoClase(a.estadoFaltas)}">${Number(a.faltasTotal || 0).toLocaleString('es-MX')}</span></td>
        <td>${UI.badgeEstado(a.estado, { titulo: motivo })}</td>
      </tr>`;
  }

  function topRiesgo(alumnos, limite = TOP) {
    const enRiesgo = alumnos.filter((a) => a.estado === 'critico' || a.estado === 'preventivo');
    return Orden.ordenarAlumnos(enRiesgo, { promedio: true, faltas: true }).slice(0, limite);
  }

  function esqueleto() {
    return `<div class="table-skeleton" aria-hidden="true">${'<div class="skeleton"></div>'.repeat(5)}</div>`;
  }

  function verTodos() {
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify({
        q: '',
        estado: 'todos',
        pagina: 1,
        promedio: true,
        faltas: true,
      }));
    } catch { /* sin almacenamiento */ }
    location.hash = '#alumnos';
  }

  function tabla(top) {
    return `
        <div class="table-wrap"><table class="data-table">
          <thead><tr>
            <th scope="col">Nombre</th><th scope="col" class="col-opt">Matrícula</th>
            <th scope="col" class="num">Promedio</th><th scope="col" class="num">Faltas</th>
            <th scope="col">Estado</th>
          </tr></thead>
          <tbody>${top.map(fila).join('')}</tbody>
        </table></div>`;
  }

  function enlazar(cuerpo) {
    const abrir = (tr) => {
      location.hash = `#alumnos/${encodeURIComponent(tr.dataset.matricula)}`;
    };
    cuerpo.addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-matricula]');
      if (tr) abrir(tr);
    });
    cuerpo.addEventListener('keydown', (e) => {
      const tr = e.target.closest('tr[data-matricula]');
      if (tr && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        abrir(tr);
      }
    });
  }

  function vacio() {
    return `<div class="empty-state">
          <span class="empty-icon">${UI.icon('checkCircle')}</span>
          <h3>Ningún alumno en riesgo</h3>
          <p class="muted">Nadie está en estado Crítico ni Preventivo.</p></div>`;
  }

  /**
   * Con `top` (topRiesgo de GET /api/resumen, #34) solo dibuja; sin él, consulta /alumnos.
   * El Menú principal pasa `top` para respetar la lista elegida (M-03).
   */
  async function mount(container, top) {
    if (Array.isArray(top)) {
      container.innerHTML = `
      <section class="card" aria-labelledby="riesgoTitulo">
        <div class="card-header">
          <h3 id="riesgoTitulo">Alumnos con mayor riesgo</h3>
          ${top.length ? '<button type="button" class="btn btn-ghost btn-sm" id="verTodos">Ver todos →</button>' : ''}
        </div>
        <div id="riesgoCuerpo">${top.length ? tabla(top) : vacio()}</div>
      </section>`;
      const ver = container.querySelector('#verTodos');
      if (ver) ver.addEventListener('click', verTodos);
      enlazar(container.querySelector('#riesgoCuerpo'));
      return;
    }
    container.innerHTML = `
      <section class="card" aria-labelledby="riesgoTitulo">
        <div class="card-header">
          <h3 id="riesgoTitulo">Alumnos con mayor riesgo</h3>
          <button type="button" class="btn btn-ghost btn-sm" id="verTodos" hidden>Ver todos →</button>
        </div>
        <div id="riesgoCuerpo">${esqueleto()}</div>
      </section>`;

    const cuerpo = container.querySelector('#riesgoCuerpo');
    container.querySelector('#verTodos').addEventListener('click', verTodos);

    try {
      const datos = await UI.api('/alumnos');
      if (!container.isConnected) return;
      if (!datos.alumnos.length) {
        container.innerHTML = '';
        return;
      }

      const lista = topRiesgo(datos.alumnos);
      if (!lista.length) {
        cuerpo.innerHTML = vacio();
        return;
      }

      container.querySelector('#verTodos').hidden = false;
      cuerpo.innerHTML = tabla(lista);
      enlazar(cuerpo);
    } catch (err) {
      if (!container.isConnected) return;
      cuerpo.innerHTML = `<div class="empty-state">
        <span class="empty-icon">${UI.icon('alert')}</span>
        <h3>No se pudo cargar</h3><p class="muted">${UI.escape(err.message)}</p>
        <button class="btn btn-outline" type="button" id="reintentar">${UI.icon('refresh')}Reintentar</button></div>`;
      container.querySelector('#reintentar').addEventListener('click', () => mount(container));
    }
  }

  return { mount, topRiesgo };
})();

if (typeof module !== 'undefined') module.exports = Riesgo;
