/**
 * Pestaña "Formulario" de Cargar datos (#31 · HU-08, context/05 §6).
 *
 * Alta manual de un alumno con sus materias, o materias nuevas para un alumno que ya
 * existe (desde el detalle con "Agregar materia", o si la matrícula ya está registrada).
 * Actividades: número 0–100 o NE, SC, DA (cuentan como 0). Calificación vacía = promedio.
 *
 * API: POST /api/alumnos · POST /api/alumnos/:matricula/materias · GET /api/materias · GET /api/planes
 */
const Formulario = (() => {
  const FORM_KEY = 'sema.form.matricula';
  const ACTIVIDADES_INICIALES = 6;
  let root = null;
  let materias = [];
  let existente = null; // alumno al que se agregan materias
  let uid = 0;

  function bloqueMateria() {
    const n = ++uid;
    return `
      <fieldset class="materia-form" data-materia="${n}">
        <legend class="sr-only">Materia ${n}</legend>
        <div class="materia-form-fila">
          <div class="field grow">
            <label for="mat${n}">Materia *</label>
            <input class="input" id="mat${n}" name="materia" list="catMaterias" maxlength="120" placeholder="Elige o escribe una materia nueva" required>
            <p class="field-error" role="alert" hidden></p>
          </div>
          <div class="field corto">
            <label for="fal${n}">Faltas</label>
            <input class="input" id="fal${n}" name="faltas" type="number" min="0" max="999" step="1" value="0" inputmode="numeric">
          </div>
          <div class="field corto">
            <label for="lim${n}">Límite de faltas</label>
            <input class="input" id="lim${n}" name="limite" type="number" min="0" max="999" step="1" placeholder="Sin límite" inputmode="numeric">
          </div>
          <button type="button" class="btn btn-ghost btn-icon quitar" data-quitar aria-label="Quitar materia" title="Quitar materia">${UI.icon('trash')}</button>
        </div>
        <div class="actividades" role="group" aria-label="Actividades">
          ${Array.from({ length: ACTIVIDADES_INICIALES }, (_, i) => actividad(n, i + 1)).join('')}
          <button type="button" class="btn btn-ghost btn-sm" data-mas>${UI.icon('plus')}Actividad</button>
        </div>
        <div class="materia-form-fila">
          <div class="field corto">
            <label for="cal${n}">Calificación</label>
            <input class="input" id="cal${n}" name="calificacion" type="number" min="0" max="100" step="0.1" placeholder="Promedio" inputmode="decimal">
          </div>
          <p class="hint grow">Vacía = promedio de las actividades (NE, SC y DA cuentan 0; las celdas vacías no cuentan).</p>
        </div>
        <p class="field-error materia-error" role="alert" hidden></p>
      </fieldset>`;
  }

  function actividad(n, i) {
    return `<label class="actividad"><span>A${i}</span><input class="input" name="act" maxlength="5" autocomplete="off" aria-label="Actividad ${i}" data-n="${i}"></label>`;
  }

  function valorActividad(raw) {
    const v = raw.trim().toUpperCase();
    if (!v) return null;
    if (['NE', 'SC', 'DA'].includes(v)) return v;
    const n = Number(v.replace(',', '.'));
    if (Number.isNaN(n) || n < 0 || n > 100) throw new Error(`«${raw}» no es válido: usa un número de 0 a 100 o NE, SC, DA.`);
    return n;
  }

  function leerMateria(fs) {
    const err = fs.querySelector('.materia-error');
    const errMat = fs.querySelector('input[name="materia"] + .field-error');
    err.hidden = true; errMat.hidden = true;
    const nombre = fs.querySelector('[name="materia"]').value.trim();
    if (!nombre) { errMat.textContent = 'Elige o escribe la materia.'; errMat.hidden = false; throw new Error('materia'); }
    const actividades = [];
    try {
      fs.querySelectorAll('[name="act"]').forEach((i) => { actividades[Number(i.dataset.n) - 1] = valorActividad(i.value); });
    } catch (e) { err.textContent = e.message; err.hidden = false; throw e; }
    while (actividades.length && actividades[actividades.length - 1] == null) actividades.pop();
    const cat = materias.find((m) => m.nombre.toLowerCase() === nombre.toLowerCase() || m.clave.toLowerCase() === nombre.toLowerCase());
    const limite = fs.querySelector('[name="limite"]').value;
    const cal = fs.querySelector('[name="calificacion"]').value;
    return {
      ...(cat ? { materiaClave: cat.clave } : { materiaNombre: nombre }),
      actividades: Array.from(actividades, (x) => (x === undefined ? null : x)),
      faltas: Number(fs.querySelector('[name="faltas"]').value || 0),
      limiteFaltas: limite === '' ? null : Number(limite),
      calificacion: cal === '' ? null : Number(cal)
    };
  }

  function render(planes) {
    root.innerHTML = `
      <form class="card" id="manualForm" novalidate>
        <div class="card-header"><h3>${existente ? `Agregar materias a ${UI.escape(existente.nombreMostrar)}` : 'Datos del alumno'}</h3>
          ${existente ? '<button type="button" class="btn btn-ghost btn-sm" id="otroAlumno">Capturar otro alumno</button>' : ''}</div>
        <div class="card-body form">
          ${existente ? `<p class="muted"><span class="mono">${UI.escape(existente.matricula)}</span> · ${UI.escape(existente.planDescripcion || existente.planClave || 'Sin plan')}</p>` : `
          <div class="form-grid">
            <div class="field"><label for="fMat">Matrícula *</label>
              <input class="input" id="fMat" name="matricula" maxlength="20" required placeholder="T00000000" autocomplete="off">
              <p class="field-error" role="alert" hidden></p></div>
            <div class="field"><label for="fApe">Apellidos *</label>
              <input class="input" id="fApe" name="apellidos" maxlength="120" required>
              <p class="field-error" role="alert" hidden></p></div>
            <div class="field"><label for="fNom">Nombres *</label>
              <input class="input" id="fNom" name="nombres" maxlength="120" required>
              <p class="field-error" role="alert" hidden></p></div>
            <div class="field"><label for="fPlan">Plan de estudios</label>
              <input class="input" id="fPlan" name="plan" list="catPlanes" maxlength="30" placeholder="Clave del plan (opcional)">
            </div>
          </div>`}
        </div>
        <div class="card-header sub"><h3>Materias</h3>
          <button type="button" class="btn btn-outline btn-sm" id="agregar">${UI.icon('plus')}Agregar materia</button></div>
        <div class="card-body" id="materiasBox">${bloqueMateria()}</div>
        <div class="card-body">
          <div class="alert alert-error" id="formError" role="alert" hidden></div>
          <div class="form-actions">
            <a class="btn btn-outline" href="${existente ? `#alumnos/${encodeURIComponent(existente.matricula)}` : '#cargar'}">Cancelar</a>
            <button type="submit" class="btn btn-primary">${UI.icon('check')}${existente ? 'Guardar materias' : 'Guardar alumno'}</button>
          </div>
        </div>
      </form>
      <datalist id="catMaterias">${materias.map((m) => `<option value="${UI.escape(m.nombre)}">${UI.escape(m.clave)}</option>`).join('')}</datalist>
      <datalist id="catPlanes">${planes.map((p) => `<option value="${UI.escape(p.clave)}">${UI.escape(p.descripcion || '')}</option>`).join('')}</datalist>`;

    const form = root.querySelector('#manualForm');
    const box = form.querySelector('#materiasBox');
    form.querySelector('#agregar').addEventListener('click', () => {
      box.insertAdjacentHTML('beforeend', bloqueMateria());
      box.lastElementChild.querySelector('[name="materia"]').focus();
    });
    box.addEventListener('click', (e) => {
      const q = e.target.closest('[data-quitar]');
      if (q) {
        if (box.querySelectorAll('.materia-form').length === 1) return UI.toast('El alumno necesita al menos una materia.', 'info');
        q.closest('.materia-form').remove();
      }
      const mas = e.target.closest('[data-mas]');
      if (mas) {
        const n = mas.parentElement.querySelectorAll('[name="act"]').length + 1;
        if (n > 50) return UI.toast('Máximo 50 actividades.', 'info');
        mas.insertAdjacentHTML('beforebegin', actividad(0, n));
        mas.previousElementSibling.querySelector('input').focus();
      }
    });
    const otro = form.querySelector('#otroAlumno');
    if (otro) otro.addEventListener('click', () => { existente = null; render(planes); });
    form.addEventListener('submit', (e) => { e.preventDefault(); guardar(form, planes); });
  }

  function errorCampo(form, name, msg) {
    const input = form.querySelector(`[name="${name}"]`);
    const el = input && input.parentElement.querySelector('.field-error');
    if (!el) return;
    el.textContent = msg; el.hidden = !msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  async function guardar(form, planes) {
    const errorBox = form.querySelector('#formError');
    errorBox.hidden = true;
    let ok = true;
    const datos = {};
    if (!existente) {
      ['matricula', 'apellidos', 'nombres'].forEach((n) => errorCampo(form, n, ''));
      datos.matricula = form.matricula.value.trim().toUpperCase();
      datos.apellidos = form.apellidos.value.trim();
      datos.nombres = form.nombres.value.trim();
      datos.planClave = form.plan.value.trim() || null;
      if (!datos.matricula || /\s/.test(datos.matricula)) { errorCampo(form, 'matricula', 'Escribe la matrícula, sin espacios.'); ok = false; }
      if (!datos.apellidos) { errorCampo(form, 'apellidos', 'Escribe los apellidos.'); ok = false; }
      if (!datos.nombres) { errorCampo(form, 'nombres', 'Escribe los nombres.'); ok = false; }
    }
    const lista = [];
    form.querySelectorAll('.materia-form').forEach((fs) => {
      try { lista.push(leerMateria(fs)); } catch { ok = false; }
    });
    if (!ok) { const inv = form.querySelector('[aria-invalid="true"], .field-error:not([hidden])'); if (inv) inv.scrollIntoView({ block: 'center' }); return; }

    const btn = form.querySelector('[type="submit"]');
    UI.setBusy(btn, true);
    try {
      let matricula;
      if (existente) {
        matricula = existente.matricula;
        for (const m of lista) await UI.api(`/alumnos/${encodeURIComponent(matricula)}/materias`, { method: 'POST', body: m });
        UI.toast(`${lista.length === 1 ? 'Materia agregada' : `${lista.length} materias agregadas`} a ${existente.nombreMostrar}`, 'success');
      } else {
        const r = await UI.api('/alumnos', { method: 'POST', body: { ...datos, materias: lista } });
        matricula = r.alumno.matricula;
        UI.toast(`Alumno ${r.alumno.nombreMostrar} guardado`, 'success', { label: 'Ver detalle', href: `#alumnos/${encodeURIComponent(matricula)}` });
      }
      location.hash = `#alumnos/${encodeURIComponent(matricula)}`;
    } catch (err) {
      UI.setBusy(btn, false);
      if (err.data && err.data.code === 'MATRICULA_EXISTE') {
        const si = await UI.confirm({
          title: 'Esa matrícula ya está registrada',
          message: `¿Quieres agregar estas materias al alumno ${datos.matricula}?`,
          confirmText: 'Agregar materias'
        });
        if (si) {
          try {
            existente = (await UI.api(`/alumnos/${encodeURIComponent(datos.matricula)}`)).alumno;
            for (const m of lista) await UI.api(`/alumnos/${encodeURIComponent(existente.matricula)}/materias`, { method: 'POST', body: m });
            UI.toast(`Materias agregadas a ${existente.nombreMostrar}`, 'success');
            location.hash = `#alumnos/${encodeURIComponent(existente.matricula)}`;
          } catch (e2) { errorBox.textContent = e2.message; errorBox.hidden = false; }
        } else {
          errorCampo(form, 'matricula', 'Esta matrícula ya existe.');
        }
        return;
      }
      errorBox.textContent = err.message;
      errorBox.hidden = false;
    }
  }

  async function mount(container) {
    root = container;
    existente = null;
    root.innerHTML = `<section class="card"><div class="table-skeleton" aria-busy="true">${'<span class="skeleton"></span>'.repeat(5)}</div></section>`;
    let pendiente = null;
    // Se usa una sola vez: viene de "Agregar materia" en el detalle.
    try { pendiente = sessionStorage.getItem(FORM_KEY); sessionStorage.removeItem(FORM_KEY); } catch { /* nada */ }
    try {
      const [m, p, a] = await Promise.all([
        UI.api('/materias'), UI.api('/planes'),
        pendiente ? UI.api(`/alumnos/${encodeURIComponent(pendiente)}`).catch(() => null) : Promise.resolve(null)
      ]);
      materias = m.materias;
      existente = a ? a.alumno : null;
      if (!root.isConnected) return;
      render(p.planes);
    } catch (err) {
      if (!root.isConnected) return;
      root.innerHTML = `<section class="card"><div class="empty-state"><span class="empty-icon">${UI.icon('alert')}</span>
        <h3>No se pudo cargar</h3><p class="muted">${UI.escape(err.message)}</p></div></section>`;
    }
  }

  return { mount };
})();
