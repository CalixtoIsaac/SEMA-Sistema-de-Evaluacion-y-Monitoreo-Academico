/**
 * Vista "Cargar datos" (context/05 §6).
 *
 *   #15 · HU-05  Zona para arrastrar o seleccionar el Excel de monitoreo
 *   #16 · HU-06  Previsualización antes de guardar (resumen, 20 filas, advertencias, modo)
 *   #17 · HU-07  Notificación "Datos cargados correctamente · N alumnos"
 *   #31 · HU-08  Pestaña "Formulario" (formulario.js)
 *   #39 · HU-09  Pestaña "Historial" de cargas (GET /api/importaciones)
 *
 * API (context/06): POST /importaciones/monitoreo · GET /importaciones/:id/muestra
 *                   POST /importaciones/:id/confirmar · DELETE /importaciones/:id
 */
const Cargar = (() => {
  const MAX_BYTES = 15 * 1024 * 1024;
  // Columnas que se ven por defecto en la previa (HU-06).
  const COLUMNAS_CORTAS = [
    ['Matrícula', 'Matrícula'],
    ['Nombre del alumno', 'Nombre', 'wrap'],
    ['Nombre de la materia', 'Materia', 'wrap'],
    ['# Grupo', 'Grupo'],
    ['Faltas del alumno', 'Faltas', 'num'],
    ['Ponderado', 'Ponderado', 'num']
  ];
  const TIPOS_AVISO = {
    omitida: 'Filas omitidas',
    rango: 'Valores fuera de rango',
    codigo: 'Códigos desconocidos',
    matricula: 'Matrículas con formato raro',
    duplicado: 'Filas repetidas'
  };

  let root = null;
  // Estado de la previa en curso (se descarta si el usuario sale de la vista).
  let previa = null;

  const fmt = (n) => Number(n || 0).toLocaleString('es-MX');

  // ---------- Paso 1: zona de arrastre ----------
  function renderDropzone(error) {
    previa = null;
    root.innerHTML = `
      <p class="muted tab-intro">Sube el Excel de monitoreo que descargas de la plataforma escolar.</p>
      <div class="dropzone" id="dropzone" role="button" tabindex="0"
           aria-describedby="dropzoneHint" aria-label="Seleccionar el Excel de monitoreo">
        <span class="dropzone-icon">${UI.icon('upload')}</span>
        <p class="dropzone-title">Arrastra tu Excel aquí o <u>haz clic para buscarlo</u></p>
        <p class="muted" id="dropzoneHint">Solo .xlsx · máximo 15 MB</p>
      </div>
      <input type="file" id="fileInput" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>
      <div id="uploadError" style="margin-top:16px"></div>`;

    const zone = root.querySelector('#dropzone');
    const input = root.querySelector('#fileInput');

    zone.addEventListener('click', () => { if (!zone.classList.contains('busy')) input.click(); });
    zone.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !zone.classList.contains('busy')) { e.preventDefault(); input.click(); }
    });
    input.addEventListener('change', () => { if (input.files[0]) handleFile(input.files[0]); input.value = ''; });

    ['dragenter', 'dragover'].forEach((type) => zone.addEventListener(type, (e) => {
      e.preventDefault();
      if (!zone.classList.contains('busy')) zone.classList.add('dragging');
    }));
    ['dragleave', 'dragend'].forEach((type) => zone.addEventListener(type, (e) => {
      if (!zone.contains(e.relatedTarget)) zone.classList.remove('dragging');
    }));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragging');
      if (zone.classList.contains('busy')) return;
      const files = e.dataTransfer.files;
      if (files.length > 1) return showError({ message: 'Arrastra un solo archivo a la vez.' });
      if (files[0]) handleFile(files[0]);
    });

    if (error) showError(error);
  }

  function showError(err) {
    const box = root.querySelector('#uploadError');
    if (!box) return;
    const detalles = err.data && Array.isArray(err.data.detalles) ? err.data.detalles : [];
    box.innerHTML = `
      <div class="alert alert-error" role="alert">
        <strong>${UI.escape(err.message)}</strong>
        ${detalles.length ? `<span>Revisa que sea el archivo de monitoreo correcto:</span><ul>${detalles.map((d) => `<li>${UI.escape(d)}</li>`).join('')}</ul>` : ''}
      </div>`;
  }

  function setZoneBusy(busy, fileName) {
    const zone = root.querySelector('#dropzone');
    if (!zone) return;
    zone.classList.toggle('busy', busy);
    zone.setAttribute('aria-busy', String(busy));
    if (busy) {
      zone.innerHTML = `
        <span class="spinner" aria-hidden="true"></span>
        <p class="dropzone-title">Leyendo archivo…</p>
        <p class="muted">${UI.escape(fileName)}</p>`;
    }
  }

  async function handleFile(file) {
    root.querySelector('#uploadError').innerHTML = '';
    // Validación en el navegador: no se envía nada si no es .xlsx o pesa más de 15 MB.
    if (!/\.xlsx$/i.test(file.name)) {
      return showError({ message: 'Solo se aceptan archivos .xlsx. Si tu archivo es .xls o .csv, ábrelo en Excel y guárdalo como "Libro de Excel (.xlsx)".' });
    }
    if (file.size > MAX_BYTES) {
      return showError({ message: `El archivo pesa ${(file.size / 1048576).toFixed(1)} MB y el máximo es 15 MB.` });
    }
    setZoneBusy(true, file.name);
    try {
      const data = await UI.upload('/importaciones/monitoreo', file);
      if (!root.isConnected) { discardQuietly(data.importacion.id); return; }
      previa = { ...data, filasCargadas: data.muestra, todasLasColumnas: false, pagina: 1 };
      renderPreview();
    } catch (err) {
      if (!root.isConnected) return;
      renderDropzone(err);
    }
  }

  // ---------- Paso 2: previsualización ----------
  function avisosAgrupados(advertencias) {
    const grupos = {};
    for (const a of advertencias) grupos[a.tipo] = (grupos[a.tipo] || 0) + 1;
    return grupos;
  }

  function renderPreview() {
    const { importacion, resumen, advertencias } = previa;
    const totalAvisos = advertencias.length;
    const grupos = avisosAgrupados(advertencias);

    root.innerHTML = `
      <div class="preview-head">
        <div class="preview-file">
          <span class="stat-icon tone-primary">${UI.icon('file')}</span>
          <div>
            <h2>${UI.escape(importacion.archivo)}</h2>
            <p class="muted">Periodo detectado: <strong>${UI.escape(resumen.periodo.nombre)}</strong>
              ${resumen.periodoYaExiste ? ' · ya hay datos de este periodo' : ' · periodo nuevo'}</p>
          </div>
        </div>
        <button class="btn btn-outline" type="button" data-action="cancel">${UI.icon('x')}Cancelar</button>
      </div>

      <div class="stats stats-preview">
        ${stat('Alumnos', fmt(resumen.alumnos), 'users', 'tone-primary', resumen.alumnosNuevos ? `${fmt(resumen.alumnosNuevos)} nuevos` : 'ninguno nuevo')}
        ${stat('Materias', fmt(resumen.materias), 'notes', 'tone-info', `${fmt(resumen.cursos)} grupos`)}
        ${stat('Filas', fmt(resumen.filasValidas), 'chart', 'tone-info', resumen.filasOmitidas ? `${fmt(resumen.filasOmitidas)} omitidas` : `de ${fmt(resumen.totalFilas)} en el archivo`)}
        ${stat('Bajas', fmt(resumen.bajas), 'minusCircle', 'tone-warning', resumen.bajas === 1 ? 'alumno con todas sus materias en BT' : 'alumnos en BT')}
        ${totalAvisos
          ? `<button type="button" class="card stat" data-action="toggle-avisos" aria-expanded="false" aria-controls="avisos">
               <div><p class="stat-label">Avisos</p><p class="stat-value">${fmt(totalAvisos)}</p><p class="stat-sub">ver detalle ▾</p></div>
               <span class="stat-icon tone-warning">${UI.icon('warning')}</span>
             </button>`
          : stat('Avisos', '0', 'check', 'tone-success', 'todo en orden')}
      </div>

      ${totalAvisos ? `
      <section class="card" id="avisos" hidden style="margin-bottom:16px">
        <div class="card-header">
          <h3>Avisos del archivo</h3>
          <span class="muted" style="font-size:13px">${Object.entries(grupos).map(([t, n]) => `${UI.escape(TIPOS_AVISO[t] || t)}: ${n}`).join(' · ')}</span>
        </div>
        <ul class="warning-list">
          ${advertencias.slice(0, 200).map((a) => `<li><span class="warning-row">Fila ${UI.escape(a.fila)}</span><span>${UI.escape(a.mensaje)}</span></li>`).join('')}
          ${advertencias.length > 200 ? `<li><span class="muted">… y ${fmt(advertencias.length - 200)} avisos más</span></li>` : ''}
        </ul>
      </section>` : ''}

      <section class="card" style="margin-bottom:16px">
        <div class="card-header">
          <h3>Vista previa</h3>
          <button class="btn btn-ghost btn-sm" type="button" data-action="toggle-cols" aria-pressed="${previa.todasLasColumnas}">
            ${previa.todasLasColumnas ? 'Ver menos columnas' : 'Ver todas las columnas'}
          </button>
        </div>
        <div class="table-wrap" id="previewTable">${tablaPrevia()}</div>
        <div class="table-footer">
          <span id="previewCount">Mostrando ${fmt(previa.filasCargadas.length)} de ${fmt(resumen.filasValidas)} filas</span>
          ${previa.filasCargadas.length < resumen.filasValidas
            ? '<button class="btn btn-outline btn-sm" type="button" data-action="more">Ver más filas</button>' : ''}
        </div>
      </section>

      <section class="card">
        <div class="card-header"><h3>¿Qué hacer con los datos que ya existen de este periodo?</h3></div>
        <div class="card-body">
          <div class="mode-options" role="radiogroup">
            <label class="mode-option">
              <input type="radio" name="modo" value="fusionar" checked>
              <div><strong>Actualizar</strong><span>Agrega y actualiza lo que viene en el archivo. No borra nada.</span></div>
            </label>
            <label class="mode-option">
              <input type="radio" name="modo" value="reemplazar">
              <div><strong>Reemplazar</strong><span>Deja solo lo que viene en el archivo.${resumen.inscripcionesQueSeEliminarian
                ? ` Se quitarían <strong style="display:inline">${fmt(resumen.inscripcionesQueSeEliminarian)}</strong> materias de alumnos que ya no aparecen.` : ''}
                Lo que capturaste a mano no se borra.</span></div>
            </label>
          </div>
        </div>
      </section>

      <div class="actions-bar">
        <button class="btn btn-outline" type="button" data-action="cancel">Cancelar</button>
        <button class="btn btn-primary" type="button" data-action="confirm">${UI.icon('check')}Confirmar carga</button>
      </div>`;

    root.querySelectorAll('[data-action="cancel"]').forEach((b) => b.addEventListener('click', cancel));
    root.querySelector('[data-action="confirm"]').addEventListener('click', confirmar);
    root.querySelector('[data-action="toggle-cols"]').addEventListener('click', () => {
      previa.todasLasColumnas = !previa.todasLasColumnas;
      renderPreview();
    });
    const more = root.querySelector('[data-action="more"]');
    if (more) more.addEventListener('click', () => verMas(more));
    const avisosBtn = root.querySelector('[data-action="toggle-avisos"]');
    if (avisosBtn) avisosBtn.addEventListener('click', () => {
      const box = root.querySelector('#avisos');
      box.hidden = !box.hidden;
      avisosBtn.setAttribute('aria-expanded', String(!box.hidden));
      avisosBtn.querySelector('.stat-sub').textContent = box.hidden ? 'ver detalle ▾' : 'ocultar ▴';
    });
  }

  function stat(label, value, icon, tone, sub) {
    return `
      <div class="card stat">
        <div>
          <p class="stat-label">${UI.escape(label)}</p>
          <p class="stat-value">${UI.escape(value)}</p>
          ${sub ? `<p class="stat-sub">${UI.escape(sub)}</p>` : ''}
        </div>
        <span class="stat-icon ${tone}">${UI.icon(icon)}</span>
      </div>`;
  }

  function tablaPrevia() {
    const cols = previa.todasLasColumnas
      ? previa.columnas.map((c) => [c, c, /^(A\d+|Ponderado|Faltas del alumno|NE alumno|Límite de faltas|Límite de NE)$/.test(c) ? 'num' : ''])
      : COLUMNAS_CORTAS;
    const head = cols.map(([, label, cls]) => `<th scope="col" class="${cls || ''}">${UI.escape(label)}</th>`).join('');
    const body = previa.filasCargadas.map((fila) => `<tr>${cols.map(([key, , cls]) => {
      const v = fila[key];
      return `<td class="${cls || ''}">${v === null || v === undefined || v === '' ? '<span class="muted">—</span>' : UI.escape(v)}</td>`;
    }).join('')}</tr>`).join('');
    return `<table class="data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }

  async function verMas(button) {
    UI.setBusy(button, true);
    try {
      // La muestra del servidor va en páginas de 50 filas.
      const next = Math.floor(previa.filasCargadas.length / 50) + 1;
      const data = await UI.api(`/importaciones/${previa.importacion.id}/muestra?pagina=${next}`);
      const start = previa.filasCargadas.length - (next - 1) * 50;
      previa.filasCargadas = previa.filasCargadas.concat(data.filas.slice(start));
      renderPreview();
    } catch (err) {
      UI.toast(err.message, 'error');
      UI.setBusy(button, false);
    }
  }

  async function cancel() {
    if (!previa) return renderDropzone();
    const id = previa.importacion.id;
    previa = null;
    try { await UI.api(`/importaciones/${id}`, { method: 'DELETE' }); } catch { /* la previa caduca sola en 24 h */ }
    UI.toast('Carga cancelada. No se guardó nada.', 'info');
    renderDropzone();
  }

  function discardQuietly(id) {
    UI.api(`/importaciones/${id}`, { method: 'DELETE' }).catch(() => {});
  }

  async function confirmar(e) {
    const button = e.currentTarget;
    const modo = root.querySelector('input[name="modo"]:checked').value;
    const { resumen } = previa;
    if (modo === 'reemplazar' && resumen.inscripcionesQueSeEliminarian > 0) {
      const ok = await UI.confirm({
        title: '¿Reemplazar los datos del periodo?',
        message: `Se quitarán ${fmt(resumen.inscripcionesQueSeEliminarian)} materias de alumnos que no vienen en este archivo. Esta acción no se puede deshacer.`,
        confirmText: 'Reemplazar',
        danger: true
      });
      if (!ok) return;
    }
    root.querySelectorAll('button').forEach((b) => { if (b !== button) b.disabled = true; });
    UI.setBusy(button, true);
    try {
      const data = await UI.api(`/importaciones/${previa.importacion.id}/confirmar`, { method: 'POST', body: { modo } });
      previa = null;
      // #17 · HU-07
      UI.toast(`Datos cargados correctamente · ${fmt(data.resultado.alumnos)} alumnos`, 'success',
        { label: 'Ver alumnos', href: '#alumnos' });
      if (root.isConnected) renderDropzone();
    } catch (err) {
      // La confirmación es una sola transacción: si falla, no se guardó nada.
      UI.toast(`No se guardó nada: ${err.message}`, 'error');
      if (err.status === 409 || err.status === 404) { previa = null; renderDropzone(); return; }
      root.querySelectorAll('button').forEach((b) => { b.disabled = false; });
      UI.setBusy(button, false);
    }
  }

  // ---------- Historial (#39) ----------
  const ESTADOS_CARGA = { aplicada: ['Aplicada', 'badge-success'], descartada: ['Descartada', ''], previa: ['En revisión', 'badge-info'] };
  const MODOS = { fusionar: 'Actualizar', reemplazar: 'Reemplazar' };

  async function renderHistorial(panel) {
    panel.innerHTML = `<section class="card"><div class="table-skeleton" aria-busy="true">${'<span class="skeleton"></span>'.repeat(5)}</div></section>`;
    try {
      const { importaciones } = await UI.api('/importaciones');
      if (!panel.isConnected) return;
      if (!importaciones.length) {
        panel.innerHTML = `<section class="card"><div class="empty-state">
          <span class="empty-icon">${UI.icon('history')}</span><h3>Todavía no hay cargas</h3>
          <p class="muted">Aquí verás cada Excel de monitoreo y cada lista que cargues.</p>
          <a class="btn btn-primary" href="#cargar">${UI.icon('upload')}Subir Excel</a></div></section>`;
        return;
      }
      panel.innerHTML = `
        <section class="card">
          <div class="table-wrap"><table class="data-table">
            <thead><tr>
              <th scope="col">Fecha</th><th scope="col">Archivo</th><th scope="col">Tipo</th>
              <th scope="col" class="num">Alumnos</th><th scope="col" class="num col-opt">Filas</th>
              <th scope="col" class="col-opt">Modo</th><th scope="col">Estado</th>
            </tr></thead>
            <tbody>${importaciones.map((i) => {
              const [txt, cls] = ESTADOS_CARGA[i.estado] || [i.estado, ''];
              return `<tr>
                <td>${UI.escape(UI.formatDate(i.aplicadoEn || i.creadoEn))}</td>
                <td class="wrap"><span class="cell-name">${UI.escape(i.archivo)}</span>${i.periodo ? `<span class="muted small">${UI.escape(i.periodo.nombre)}</span>` : ''}</td>
                <td>${i.tipo === 'lista' ? 'Lista' : 'Monitoreo'}</td>
                <td class="num">${i.totalAlumnos == null ? '—' : fmt(i.totalAlumnos)}</td>
                <td class="num col-opt">${i.totalFilas == null ? '—' : fmt(i.totalFilas)}</td>
                <td class="col-opt">${UI.escape(MODOS[i.modo] || '—')}</td>
                <td><span class="badge ${cls}">${txt}</span></td>
              </tr>`;
            }).join('')}</tbody>
          </table></div>
          <div class="table-footer"><span>${fmt(importaciones.length)} ${importaciones.length === 1 ? 'carga' : 'cargas'}</span></div>
        </section>`;
    } catch (err) {
      if (!panel.isConnected) return;
      panel.innerHTML = `<section class="card"><div class="empty-state"><span class="empty-icon">${UI.icon('alert')}</span>
        <h3>No se pudo cargar</h3><p class="muted">${UI.escape(err.message)}</p>
        <button class="btn btn-outline" type="button" id="retryBtn">${UI.icon('refresh')}Reintentar</button></div></section>`;
      panel.querySelector('#retryBtn').addEventListener('click', () => renderHistorial(panel));
    }
  }

  const TABS = [
    { key: 'excel', label: 'Subir Excel', icon: 'upload', href: '#cargar' },
    { key: 'formulario', label: 'Formulario', icon: 'form', href: '#cargar/formulario' },
    { key: 'historial', label: 'Historial', icon: 'history', href: '#cargar/historial' }
  ];

  function mount(container, param) {
    // Si había una previa abierta y el usuario cambió de vista, se descarta.
    if (previa) discardQuietly(previa.importacion.id);
    const tab = TABS.some((t) => t.key === param) ? param : 'excel';
    container.innerHTML = `
      <section class="page-header">
        <div><h2>Cargar datos</h2></div>
      </section>
      <nav class="tabs" aria-label="Formas de cargar datos">
        ${TABS.map((t) => `<a class="tab" href="${t.href}" ${t.key === tab ? 'aria-current="page"' : ''}>${UI.icon(t.icon)}${t.label}</a>`).join('')}
      </nav>
      <div id="cargarPanel"></div>`;
    const panel = container.querySelector('#cargarPanel');
    if (tab === 'formulario') return Formulario.mount(panel);
    if (tab === 'historial') return renderHistorial(panel);
    root = panel;
    renderDropzone();
  }

  return { mount };
})();
