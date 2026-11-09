/**
 * Listas de seguimiento en la vista Alumnos (context/05 §7).
 *
 *   #28 · HU-10  Modal "Cargar lista": nombre + zona de arrastre → previa (total, encontrados,
 *                no encontrados y nombres distintos) → Guardar.
 *   #30 · HU-12  Menú ⋯: Renombrar, Reemplazar con otro Excel, Eliminar.
 *
 * API: POST /api/listas/previa · POST/PUT/DELETE /api/listas (context/06 §5)
 */
const Listas = (() => {
  const MAX_BYTES = 15 * 1024 * 1024;
  const fmt = (n) => Number(n || 0).toLocaleString('es-MX');

  function tablaSimple(titulo, cols, filas, vacio) {
    if (!filas.length) return `<p class="muted small">${UI.icon('checkCircle')} ${vacio}</p>`;
    return `
      <details class="previa-lista" ${filas.length <= 8 ? 'open' : ''}>
        <summary><strong>${titulo}</strong> <span class="badge">${fmt(filas.length)}</span></summary>
        <div class="table-wrap mini"><table class="data-table">
          <thead><tr>${cols.map((c) => `<th scope="col">${c[0]}</th>`).join('')}</tr></thead>
          <tbody>${filas.map((f) => `<tr>${cols.map((c) => `<td class="${c[2] || ''}">${UI.escape(f[c[1]] || '—')}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>
      </details>`;
  }

  /**
   * Abre el modal. Con `lista` reemplaza su contenido (#30); sin ella crea una nueva (#28).
   * Resuelve con la lista guardada o null si se cancela.
   */
  function cargar(lista = null) {
    return new Promise((resolve) => {
      let previa = null;
      let guardada = null;
      const dialog = UI.openDialog({
        title: lista ? `Reemplazar «${lista.nombre}»` : 'Cargar lista de seguimiento',
        description: lista
          ? 'Las matrículas de la lista se cambian por las del nuevo Excel. Los alumnos no se borran.'
          : 'Sube un Excel con una columna de matrícula (y opcionalmente el nombre) para filtrar a esos alumnos.',
        as: 'form',
        bodyHtml: `
          <div class="form">
            ${lista ? '' : `<div class="field">
              <label for="listaNombre">Nombre de la lista</label>
              <input class="input" id="listaNombre" name="nombre" maxlength="60" required placeholder="Ej. 6.º semestre">
              <p class="hint">Se propone el nombre del archivo; puedes cambiarlo.</p>
            </div>`}
            <div class="dropzone small" id="listaZona" role="button" tabindex="0" aria-label="Seleccionar el Excel de la lista">
              <span class="dropzone-icon">${UI.icon('upload')}</span>
              <p class="dropzone-title">Arrastra el Excel aquí o <u>haz clic para buscarlo</u></p>
              <p class="muted small">Solo .xlsx · máximo 15 MB</p>
            </div>
            <input type="file" id="listaArchivo" accept=".xlsx" hidden>
            <div id="listaPrevia"></div>
            <div class="alert alert-error" data-form-error role="alert" hidden></div>
          </div>`,
        footerHtml: `
          <button type="button" class="btn btn-outline" data-action="cancel">Cancelar</button>
          <button type="submit" class="btn btn-primary" disabled>${UI.icon('check')}Guardar lista</button>`,
        onClose: () => resolve(guardada)
      });
      const form = dialog.el;
      form.classList.add('modal-wide');
      const zona = form.querySelector('#listaZona');
      const input = form.querySelector('#listaArchivo');
      const nombre = form.querySelector('#listaNombre');
      const errorBox = form.querySelector('[data-form-error]');
      const submit = form.querySelector('[type="submit"]');
      const previaBox = form.querySelector('#listaPrevia');
      form.querySelector('[data-action="cancel"]').addEventListener('click', dialog.close);

      function error(msg) { errorBox.textContent = msg; errorBox.hidden = !msg; }

      async function leer(file) {
        error('');
        if (!/\.xlsx$/i.test(file.name)) return error('Solo se aceptan archivos .xlsx.');
        if (file.size > MAX_BYTES) return error('El archivo supera 15 MB.');
        zona.classList.add('busy');
        zona.innerHTML = `<span class="spinner" aria-hidden="true"></span><p class="dropzone-title">Leyendo ${UI.escape(file.name)}…</p>`;
        try {
          previa = await UI.upload('/listas/previa', file);
          if (nombre && !nombre.value.trim()) nombre.value = previa.nombreSugerido.slice(0, 60);
          zona.hidden = true;
          previaBox.innerHTML = `
            <div class="previa-resumen">
              <span>${UI.icon('file')} <strong>${UI.escape(previa.archivo)}</strong></span>
              <button type="button" class="btn btn-ghost btn-sm" id="otroArchivo">Elegir otro</button>
            </div>
            <div class="stats stats-preview">
              <div class="card stat"><div><p class="stat-label">Matrículas</p><p class="stat-value">${fmt(previa.total)}</p></div></div>
              <div class="card stat"><div><p class="stat-label">Encontradas</p><p class="stat-value estado-correcto">${fmt(previa.encontrados)}</p></div></div>
              <div class="card stat"><div><p class="stat-label">No encontradas</p><p class="stat-value ${previa.noEncontrados.length ? 'estado-preventivo' : ''}">${fmt(previa.noEncontrados.length)}</p></div></div>
            </div>
            ${tablaSimple('No encontradas en SEMA', [['Matrícula', 'matricula', 'mono'], ['Nombre en el Excel', 'nombre', 'wrap']], previa.noEncontrados, 'Todas las matrículas están en SEMA.')}
            ${tablaSimple('Nombres distintos', [['Matrícula', 'matricula', 'mono'], ['En la lista', 'nombreExcel', 'wrap'], ['En SEMA (manda este)', 'nombreSema', 'wrap']], previa.nombresDistintos, 'Los nombres coinciden con los de SEMA.')}
            ${previa.noEncontrados.length ? '<p class="hint">Las no encontradas también se guardan: aparecerán cuando cargues un Excel de monitoreo que las incluya.</p>' : ''}`;
          previaBox.querySelector('#otroArchivo').addEventListener('click', () => {
            previa = null; previaBox.innerHTML = ''; zona.hidden = false; restaurarZona(); submit.disabled = true;
          });
          submit.disabled = false;
        } catch (err) {
          restaurarZona();
          error(err.data && err.data.detalles ? `${err.message} ${err.data.detalles.join(' ')}` : err.message);
        }
      }

      const zonaHtml = zona.innerHTML;
      function restaurarZona() { zona.classList.remove('busy'); zona.innerHTML = zonaHtml; }

      zona.addEventListener('click', () => { if (!zona.classList.contains('busy')) input.click(); });
      zona.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !zona.classList.contains('busy')) { e.preventDefault(); input.click(); }
      });
      input.addEventListener('change', () => { if (input.files[0]) leer(input.files[0]); input.value = ''; });
      ['dragenter', 'dragover'].forEach((t) => zona.addEventListener(t, (e) => { e.preventDefault(); zona.classList.add('dragging'); }));
      ['dragleave', 'dragend'].forEach((t) => zona.addEventListener(t, () => zona.classList.remove('dragging')));
      zona.addEventListener('drop', (e) => {
        e.preventDefault(); zona.classList.remove('dragging');
        if (e.dataTransfer.files[0]) leer(e.dataTransfer.files[0]);
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!previa) return;
        error('');
        const body = { matriculas: previa.matriculas, archivo: previa.archivo };
        if (!lista) {
          body.nombre = nombre.value.trim();
          if (!body.nombre) { nombre.focus(); return error('Escribe un nombre para la lista.'); }
        }
        UI.setBusy(submit, true);
        try {
          const r = lista
            ? await UI.api(`/listas/${lista.id}`, { method: 'PUT', body })
            : await UI.api('/listas', { method: 'POST', body });
          guardada = r.lista;
          dialog.close();
        } catch (err) {
          error(err.message);
          UI.setBusy(submit, false);
        }
      });
      (nombre || zona).focus();
    });
  }

  async function renombrar(lista) {
    const r = await UI.formModal({
      title: 'Renombrar lista',
      fields: [{ name: 'nombre', label: 'Nombre', required: true, maxlength: 60 }],
      values: { nombre: lista.nombre },
      submitText: 'Guardar',
      onSubmit: (v) => UI.api(`/listas/${lista.id}`, { method: 'PUT', body: { nombre: v.nombre } })
    });
    return r ? r.lista : null;
  }

  async function eliminar(lista) {
    const ok = await UI.confirm({
      title: `¿Eliminar la lista «${lista.nombre}»?`,
      message: 'Solo se borra la lista; los alumnos y sus datos se conservan.',
      confirmText: 'Eliminar lista', danger: true
    });
    if (!ok) return false;
    await UI.api(`/listas/${lista.id}`, { method: 'DELETE' });
    return true;
  }

  return { cargar, renombrar, eliminar };
})();
