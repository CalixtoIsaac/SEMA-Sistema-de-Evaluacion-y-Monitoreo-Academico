/**
 * Detalle del alumno (context/05 §8).
 *
 *   #25 · HU-17  Encabezado (nombre, matrícula, plan, listas, promedio, faltas, estado y motivo),
 *                alertas (M-06), una tarjeta por materia con A1…An | Promedio total | Faltas (M-04).
 *   #37 · HU-21  Tendencia, faltas nuevas y mini-gráfica del promedio por carga (M-05).
 *   #49 · HU-26  "Corregir nombre" (apellidos / nombres, M-12).
 *   #31 · HU-08  Materias manuales: agregar y eliminar.
 *
 * API: GET /api/alumnos/:matricula · PUT /api/alumnos/:matricula/nombre (context/06 §6)
 */
const Detalle = (() => {
  const fmt = (n) => Number(n || 0).toLocaleString('es-MX');
  const fmt1 = (v) => (v === null || v === undefined ? '—' : (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, ''));
  const ALERTAS = {
    sin_derecho: ['Materia sin derecho (SD)', 'danger'],
    faltas_limite: ['Faltas al límite', 'danger'],
    muchos_ne: ['Muchos NE', 'warning'],
    sin_calificar: ['Actividades sin calificar (SC)', 'muted'],
    deshonestidad: ['Deshonestidad académica (DA)', 'danger'],
    empeora: ['Bajó desde la última carga', 'warning']
  };
  const DIAS = { L: 'Lun', M: 'Mar', Mi: 'Mié', J: 'Jue', V: 'Vie', S: 'Sáb', D: 'Dom' };

  let root = null;
  let matricula = null;

  function alertas(a) {
    const out = (a.alertas || []).filter((k) => k !== 'reprobando').map((k) => {
      const [texto, tono] = ALERTAS[k] || [k, 'muted'];
      return `<span class="alerta alerta-${tono}">${UI.icon(tono === 'muted' ? 'info' : 'warning')}${UI.escape(texto)}</span>`;
    });
    if (a.materiasReprobando) {
      out.splice(0, 0, `<span class="alerta alerta-danger">${UI.icon('warning')}${a.materiasReprobando} ${a.materiasReprobando === 1 ? 'materia reprobando' : 'materias reprobando'}</span>`);
    }
    return out.length ? `<div class="alertas">${out.join('')}</div>` : '';
  }

  function lineaTendencia(d) {
    const a = d.alumno;
    const f = d.faltasNuevas;
    if (!f || a.tendencia === 'sin_historial') {
      return d.evolucion.length < 2
        ? '<p class="muted small">La evolución aparecerá cuando cargues datos más de una vez.</p>'
        : '';
    }
    const textos = { mejora: 'Mejora', empeora: 'Empeora', estable: 'Estable' };
    const cambioEstado = f.estadoAnterior !== a.estado
      ? ` (${UI.estadoTexto(f.estadoAnterior)} → ${UI.estadoTexto(a.estado)})`
      : (f.promedioAnterior != null && a.promedioGeneral != null ? ` (${fmt1(f.promedioAnterior)} → ${fmt1(a.promedioGeneral)})` : '');
    const faltas = f.faltas > 0 ? ` · <strong>+${fmt(f.faltas)}</strong> ${f.faltas === 1 ? 'falta' : 'faltas'}` : '';
    return `<p class="linea-tendencia tendencia-txt-${a.tendencia}">${UI.tendencia(a.tendencia)}
      <span><strong>${textos[a.tendencia]}</strong> desde la carga del ${UI.escape(UI.fechaCorta(f.desde))}${UI.escape(cambioEstado)}${faltas}</span></p>`;
  }

  function encabezado(d) {
    const a = d.alumno;
    const plan = a.planDescripcion ? `${UI.escape(a.planDescripcion)}${a.planClave ? ` (${UI.escape(a.planClave)})` : ''}` : UI.escape(a.planClave || 'Sin plan');
    const listas = a.listas.length ? ` · Listas: ${a.listas.map((l) => UI.escape(l.nombre)).join(', ')}` : '';
    return `
      <section class="card detalle-head">
        <div class="card-body">
          <div class="detalle-top">
            <span class="avatar lg" aria-hidden="true">${UI.escape(UI.initials(a.nombres ? `${a.nombres} ${a.apellidos}` : a.nombre))}</span>
            <div class="detalle-id">
              <h2>${UI.escape(a.nombreMostrar)}</h2>
              <p class="muted"><span class="mono">${UI.escape(a.matricula)}</span> · ${plan}${listas}${a.origen === 'manual' ? ' · <span class="badge">Alta manual</span>' : ''}</p>
              <p class="motivo">${UI.escape(a.motivoTexto)}</p>
            </div>
            <div class="detalle-acciones">
              <button type="button" class="btn btn-ghost btn-sm" id="corregirNombre">${UI.icon('pencil')}Corregir nombre</button>
              ${UI.badgeEstado(a.estado, { motivo: a.motivoEstado })}
            </div>
          </div>
          <div class="detalle-cifras">
            <div><span class="stat-label">Promedio general</span><span class="cifra ${UI.estadoClase(a.estadoPromedio)}">${fmt1(a.promedioGeneral)}</span></div>
            <div><span class="stat-label">Faltas totales</span><span class="cifra ${UI.estadoClase(a.estadoFaltas)}">${a.estado === 'baja' ? '—' : fmt(a.faltasTotal)}</span></div>
            <div><span class="stat-label">Materias</span><span class="cifra">${fmt(a.materias)}</span></div>
            ${d.evolucion.length >= 2 ? '<div class="mini-evo"><span class="stat-label">Promedio por carga</span><div class="chart-box mini"><canvas id="miniEvo" role="img" aria-label="Promedio por carga"></canvas></div></div>' : ''}
          </div>
          ${alertas(a)}
          ${lineaTendencia(d)}
        </div>
      </section>`;
  }

  function celdaActividad(act) {
    if (!act) return '<td class="num muted">·</td>';
    if (act.codigo) return `<td class="num">${UI.chipCodigo(act.codigo)}</td>`;
    return `<td class="num${act.valor < 70 ? ' estado-critico' : ''}">${fmt1(act.valor)}</td>`;
  }

  function horario(m) {
    const dias = (m.dias || '').split(',').filter(Boolean).map((x) => DIAS[x] || x);
    const rango = dias.length > 1 && dias.join(',') === 'Lun,Mar,Mié,Jue,Vie' ? 'L–V' : dias.join(' ');
    return [rango, m.horaInicio && m.horaFin ? `${m.horaInicio}–${m.horaFin}` : ''].filter(Boolean).join(' ');
  }

  function tarjetaMateria(m) {
    const porNumero = Object.fromEntries(m.actividades.map((x) => [x.numero, x]));
    // Solo las columnas de actividad con datos (A1…An).
    const numeros = m.actividades.map((x) => x.numero).sort((a, b) => a - b);
    const pct = m.porcentajeFaltas != null ? `${fmt1(m.porcentajeFaltas)} % del límite` : 'Materia sin límite de faltas';
    const cal = m.calificacionCodigo
      ? UI.chipCodigo(m.calificacionCodigo)
      : `<span class="estado-num ${UI.estadoClase(m.estadoCalificacion)}" title="${m.calificacionCalculada ? 'Promedio de las actividades (NE, SC y DA cuentan 0)' : 'Calificación ponderada del sistema escolar'}">${fmt1(m.calificacion)}</span>`;
    const faltas = `<span class="estado-num ${UI.estadoClase(m.estadoFaltas)}" title="${pct}">${fmt(m.faltas)}${m.limiteFaltas ? ` / ${fmt(m.limiteFaltas)}` : ''}<span class="sr-only">. ${pct}</span></span>`;
    const meta = [m.profesor ? `Prof. ${UI.escape(m.profesor)}` : '', m.grupo ? `Grupo ${UI.escape(m.grupo)}` : '', UI.escape(horario(m)),
      m.ne ? `NE: ${fmt(m.ne)}${m.limiteNe ? ` / ${fmt(m.limiteNe)}` : ''}` : ''].filter(Boolean).join(' · ');
    return `
      <section class="card materia${m.esBaja ? ' materia-baja' : ''}">
        <div class="card-header">
          <div class="materia-titulo">
            <h3>${UI.escape(m.nombre)}</h3>
            <p class="muted small">${meta || UI.escape(m.clave)}</p>
          </div>
          <div class="materia-estado">
            ${m.esBaja ? '<span class="badge badge-baja">Baja</span>' : UI.badgeEstado(m.estado)}
            ${m.origen === 'manual' ? `<button type="button" class="btn btn-ghost btn-icon btn-sm" data-borrar="${m.inscripcionId}" aria-label="Eliminar la materia manual ${UI.escape(m.nombre)}" title="Eliminar materia manual">${UI.icon('trash')}</button>` : ''}
          </div>
        </div>
        <div class="table-wrap materia-tabla"><table class="data-table">
          <thead><tr>
            ${numeros.map((n) => `<th scope="col" class="num">A${n}</th>`).join('')}
            <th scope="col" class="num">Promedio total</th><th scope="col" class="num">Faltas</th>
          </tr></thead>
          <tbody><tr>
            ${numeros.map((n) => celdaActividad(porNumero[n])).join('')}
            <td class="num">${cal}</td><td class="num">${faltas}</td>
          </tr></tbody>
        </table></div>
      </section>`;
  }

  function render(d) {
    root.innerHTML = `
      <a href="#alumnos" class="btn btn-ghost btn-sm volver">${UI.icon('chevronLeft')}Volver a alumnos</a>
      ${encabezado(d)}
      <div class="materias-head">
        <h3>Materias${d.alumno.periodo ? ` <span class="muted small">· ${UI.escape(d.alumno.periodo.nombre)}</span>` : ''}</h3>
        <button type="button" class="btn btn-outline btn-sm" id="agregarMateria">${UI.icon('plus')}Agregar materia</button>
      </div>
      ${d.materias.length ? d.materias.map(tarjetaMateria).join('') : `<section class="card"><div class="empty-state compact"><p class="muted">Sin materias en el periodo.</p></div></section>`}`;

    document.title = `${d.alumno.nombreMostrar} · SEMA`;
    root.querySelector('#corregirNombre').addEventListener('click', () => corregirNombre(d.alumno));
    root.querySelector('#agregarMateria').addEventListener('click', () => {
      try { sessionStorage.setItem('sema.form.matricula', d.alumno.matricula); } catch { /* sin almacenamiento */ }
      location.hash = '#cargar/formulario';
    });
    root.querySelectorAll('[data-borrar]').forEach((b) => b.addEventListener('click', () => borrarMateria(b.dataset.borrar)));
    const mini = root.querySelector('#miniEvo');
    if (mini) {
      Graficas.lineas(mini, {
        labels: d.evolucion.map((e) => UI.fechaCorta(e.fecha)),
        series: [{ label: 'Promedio', valores: d.evolucion.map((e) => e.promedio), color: 'linea' }]
      });
    }
  }

  async function corregirNombre(a) {
    const r = await UI.formModal({
      title: 'Corregir nombre',
      description: `Así aparece en el Excel: «${a.nombre}». Separa los apellidos de los nombres; una nueva carga no cambiará tu corrección.`,
      fields: [
        { name: 'apellidos', label: 'Apellidos', required: true, maxlength: 120 },
        { name: 'nombres', label: 'Nombres', required: true, maxlength: 120 }
      ],
      values: { apellidos: a.apellidos, nombres: a.nombres },
      onSubmit: (v) => UI.api(`/alumnos/${encodeURIComponent(a.matricula)}/nombre`, { method: 'PUT', body: v })
    });
    if (r) { UI.toast('Nombre corregido', 'success'); render(r); }
  }

  async function borrarMateria(id) {
    const ok = await UI.confirm({ title: '¿Eliminar esta materia?', message: 'Se borra la materia capturada a mano con sus actividades y faltas.', confirmText: 'Eliminar', danger: true });
    if (!ok) return;
    try {
      await UI.api(`/inscripciones/${id}`, { method: 'DELETE' });
      UI.toast('Materia eliminada', 'success');
      load();
    } catch (err) { UI.toast(err.message, 'error'); }
  }

  async function load() {
    root.innerHTML = `
      <a href="#alumnos" class="btn btn-ghost btn-sm volver">${UI.icon('chevronLeft')}Volver a alumnos</a>
      <section class="card"><div class="table-skeleton" aria-busy="true" aria-label="Cargando alumno">${'<span class="skeleton"></span>'.repeat(6)}</div></section>`;
    try {
      const d = await UI.api(`/alumnos/${encodeURIComponent(matricula)}`);
      if (root.isConnected) render(d);
    } catch (err) {
      if (!root.isConnected) return;
      root.innerHTML = `
        <a href="#alumnos" class="btn btn-ghost btn-sm volver">${UI.icon('chevronLeft')}Volver a alumnos</a>
        <section class="card"><div class="empty-state">
          <span class="empty-icon">${UI.icon(err.status === 404 ? 'search' : 'alert')}</span>
          <h3>${err.status === 404 ? `No existe un alumno con la matrícula ${UI.escape(matricula)}` : 'No se pudo cargar'}</h3>
          <p class="muted">${UI.escape(err.status === 404 ? 'Revisa la matrícula o vuelve a la lista.' : err.message)}</p>
          ${err.status === 404 ? '' : `<button class="btn btn-outline" type="button" id="retryBtn">${UI.icon('refresh')}Reintentar</button>`}
        </div></section>`;
      const retry = root.querySelector('#retryBtn');
      if (retry) retry.addEventListener('click', load);
    }
  }

  function mount(container, mat) {
    root = container;
    matricula = mat;
    load();
  }

  return { mount };
})();
