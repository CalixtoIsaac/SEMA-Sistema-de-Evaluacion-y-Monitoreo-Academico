/**
 * Perfil (context/05 §9).
 *
 *   #33 · HU-03/04  Tarjetas Cuenta y Contraseña (validación en línea, toast, menú actualizado).
 *   #49 · HU-26     Preferencias: tema y formato de nombres (se guardan al elegir).
 *   #41 · HU-23     Umbrales con vista previa del conteo y restaurar valores por defecto.
 *   #43 · HU-25     Datos: descargar respaldo y borrar los datos académicos.
 *
 * API: PUT /api/cuenta · /cuenta/password · /cuenta/preferencias · GET/PUT /api/configuracion
 *      POST /api/configuracion/vista-previa · GET /api/datos/respaldo · DELETE /api/datos
 */
const Perfil = (() => {
  let root = null;
  let previewTimer = null;
  const fmt = (n) => Number(n || 0).toLocaleString('es-MX');

  function campo({ id, label, type = 'text', value = '', hint = '', attrs = '' }) {
    return `
      <div class="field">
        <label for="${id}">${label}</label>
        <input class="input" id="${id}" name="${id}" type="${type}" value="${UI.escape(value)}" ${attrs}>
        <p class="field-error" id="${id}Error" role="alert" hidden></p>
        ${hint ? `<p class="hint">${hint}</p>` : ''}
      </div>`;
  }

  function setError(form, name, msg) {
    const el = form.querySelector(`#${name}Error`);
    const input = form.querySelector(`#${name}`);
    if (!el) return;
    el.textContent = msg || '';
    el.hidden = !msg;
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  function clearErrors(form) {
    form.querySelectorAll('.field-error').forEach((el) => { el.hidden = true; el.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.setAttribute('aria-invalid', 'false'));
  }

  // ---------- Cuenta (#33) ----------
  function cuentaCard(user) {
    return `
      <section class="card" aria-labelledby="cuentaT">
        <div class="card-header"><h3 id="cuentaT">${UI.icon('user')} Cuenta</h3></div>
        <form class="card-body form" id="cuentaForm" novalidate>
          ${campo({ id: 'nombre', label: 'Nombre', value: user.nombre, attrs: 'maxlength="80" required autocomplete="name"' })}
          ${campo({ id: 'usuario', label: 'Usuario', value: user.usuario, attrs: 'maxlength="30" required autocomplete="username"', hint: 'Con este usuario inicias sesión. De 3 a 30 caracteres, sin espacios.' })}
          ${campo({ id: 'cuentaPassword', label: 'Contraseña actual', type: 'password', attrs: 'required autocomplete="current-password"', hint: 'Necesaria para confirmar el cambio.' })}
          <div class="form-actions"><button type="submit" class="btn btn-primary">Guardar cambios</button></div>
        </form>
      </section>`;
  }

  function enlazarCuenta() {
    const form = root.querySelector('#cuentaForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors(form);
      const body = {
        nombre: form.nombre.value.trim(),
        usuario: form.usuario.value.trim(),
        passwordActual: form.cuentaPassword.value
      };
      let ok = true;
      if (!body.nombre) { setError(form, 'nombre', 'Escribe tu nombre.'); ok = false; }
      if (body.usuario.length < 3 || /\s/.test(body.usuario)) { setError(form, 'usuario', 'De 3 a 30 caracteres, sin espacios.'); ok = false; }
      if (!body.passwordActual) { setError(form, 'cuentaPassword', 'Escribe tu contraseña actual.'); ok = false; }
      if (!ok) return;
      const btn = form.querySelector('[type="submit"]');
      UI.setBusy(btn, true);
      try {
        const r = await UI.api('/cuenta', { method: 'PUT', body });
        UI.setSession(r.token, r.user);
        window.dispatchEvent(new CustomEvent('sema:user', { detail: r.user }));
        form.cuentaPassword.value = '';
        UI.toast('Cuenta actualizada', 'success');
      } catch (err) {
        if (err.data && err.data.code === 'BAD_PASSWORD') setError(form, 'cuentaPassword', err.message);
        else if (err.status === 409) setError(form, 'usuario', err.message);
        else UI.toast(err.message, 'error');
      } finally {
        UI.setBusy(btn, false);
      }
    });
  }

  // ---------- Contraseña (#33) ----------
  function passwordCard(user) {
    return `
      <section class="card" aria-labelledby="passT">
        <div class="card-header"><h3 id="passT">${UI.icon('key')} Contraseña</h3></div>
        <form class="card-body form" id="passForm" novalidate>
          ${user.passwordPorDefecto ? '<div class="alert alert-warning">Sigues usando la contraseña por defecto. Cámbiala para proteger los datos.</div>' : ''}
          ${campo({ id: 'passActual', label: 'Contraseña actual', type: 'password', attrs: 'required autocomplete="current-password"' })}
          ${campo({ id: 'passNueva', label: 'Contraseña nueva', type: 'password', attrs: 'required minlength="8" maxlength="72" autocomplete="new-password"', hint: 'Entre 8 y 72 caracteres.' })}
          ${campo({ id: 'passConfirma', label: 'Confirmar contraseña nueva', type: 'password', attrs: 'required autocomplete="new-password"' })}
          <div class="form-actions"><button type="submit" class="btn btn-primary">Cambiar contraseña</button></div>
        </form>
      </section>`;
  }

  function enlazarPassword() {
    const form = root.querySelector('#passForm');
    const validarConfirma = () => {
      const c = form.passConfirma.value;
      setError(form, 'passConfirma', c && c !== form.passNueva.value ? 'No coincide con la contraseña nueva.' : '');
    };
    form.passConfirma.addEventListener('input', validarConfirma);
    form.passNueva.addEventListener('input', () => {
      const v = form.passNueva.value;
      const bytes = new TextEncoder().encode(v).length;
      setError(form, 'passNueva', v && v.length < 8 ? `Faltan ${8 - v.length} caracteres.` : bytes > 72 ? 'Es demasiado larga (máximo 72).' : '');
      if (form.passConfirma.value) validarConfirma();
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors(form);
      const actual = form.passActual.value;
      const nueva = form.passNueva.value;
      let ok = true;
      if (!actual) { setError(form, 'passActual', 'Escribe tu contraseña actual.'); ok = false; }
      if (nueva.length < 8 || new TextEncoder().encode(nueva).length > 72) { setError(form, 'passNueva', 'Debe tener entre 8 y 72 caracteres.'); ok = false; }
      if (nueva !== form.passConfirma.value) { setError(form, 'passConfirma', 'No coincide con la contraseña nueva.'); ok = false; }
      if (!ok) return;
      const btn = form.querySelector('[type="submit"]');
      UI.setBusy(btn, true);
      try {
        await UI.api('/cuenta/password', { method: 'PUT', body: { passwordActual: actual, passwordNueva: nueva } });
        const user = { ...(UI.getUser() || {}), passwordPorDefecto: false };
        UI.setUser(user);
        form.reset();
        const aviso = form.querySelector('.alert-warning');
        if (aviso) aviso.remove();
        UI.toast('Contraseña cambiada', 'success');
      } catch (err) {
        if (err.data && err.data.code === 'BAD_PASSWORD') setError(form, 'passActual', err.message);
        else if (err.status === 400) setError(form, 'passNueva', err.message);
        else UI.toast(err.message, 'error');
      } finally {
        UI.setBusy(btn, false);
      }
    });
  }

  // ---------- Preferencias (#49) ----------
  function segmented(name, opciones, actual, legend) {
    return `
      <fieldset class="segmented-field">
        <legend>${legend}</legend>
        <div class="segmented" role="radiogroup">
          ${opciones.map((o) => `
            <label class="segmented-opt">
              <input type="radio" name="${name}" value="${o.value}" ${o.value === actual ? 'checked' : ''}>
              <span>${o.icon ? UI.icon(o.icon) : ''}${UI.escape(o.label)}</span>
            </label>`).join('')}
        </div>
      </fieldset>`;
  }

  function prefsCard(user) {
    return `
      <section class="card" aria-labelledby="prefT">
        <div class="card-header"><h3 id="prefT">${UI.icon('palette')} Preferencias</h3><span class="muted small">Se guardan al elegir</span></div>
        <div class="card-body form" id="prefs">
          ${segmented('tema', [
            { value: 'claro', label: 'Claro' }, { value: 'oscuro', label: 'Oscuro' }, { value: 'sistema', label: 'Igual que el sistema' }
          ], user.tema || 'sistema', 'Tema')}
          ${segmented('formatoNombre', [
            { value: 'nombres_apellidos', label: 'Nombres Apellidos' }, { value: 'apellidos_nombres', label: 'Apellidos Nombres' }
          ], user.formatoNombre || 'nombres_apellidos', 'Mostrar nombres')}
          <p class="hint" id="ejemploNombre"></p>
        </div>
      </section>`;
  }

  function ejemploNombre(formato) {
    const el = root.querySelector('#ejemploNombre');
    if (el) el.textContent = `Ejemplo: ${formato === 'apellidos_nombres' ? 'Pérez López Mariana (como en el Excel)' : 'Mariana Pérez López'}. Aplica en la tabla, el detalle, el Menú principal y la exportación.`;
  }

  function enlazarPrefs(user) {
    const box = root.querySelector('#prefs');
    ejemploNombre(user.formatoNombre);
    box.addEventListener('change', async (e) => {
      const input = e.target;
      if (input.name !== 'tema' && input.name !== 'formatoNombre') return;
      const anterior = (UI.getUser() || {})[input.name];
      if (input.name === 'tema' && window.SemaTheme) SemaTheme.setPreference(input.value);
      if (input.name === 'formatoNombre') ejemploNombre(input.value);
      try {
        const { user: u } = await UI.api('/cuenta/preferencias', { method: 'PUT', body: { [input.name]: input.value } });
        UI.setUser(u);
        UI.toast('Preferencia guardada', 'success');
      } catch (err) {
        UI.toast(err.message, 'error');
        const prev = box.querySelector(`input[name="${input.name}"][value="${anterior}"]`);
        if (prev) prev.checked = true;
        if (input.name === 'tema' && window.SemaTheme && anterior) SemaTheme.setPreference(anterior);
      }
    });
    // El botón ◐ de la barra superior también cambia el tema: reflejarlo aquí.
    window.addEventListener('sema:preferencias', (e) => {
      const r = root && root.querySelector(`#prefs input[name="tema"][value="${e.detail.tema}"]`);
      if (r) r.checked = true;
    });
  }

  // ---------- Umbrales (#41) ----------
  const CAMPOS_UMBRAL = [
    ['calificacion', 'correctoMin', 'Verde desde', 'calificación', 1, 100, 0.1],
    ['calificacion', 'preventivoMin', 'Amarillo desde', 'calificación', 0, 99, 0.1],
    ['faltas', 'preventivoPct', 'Amarillo desde', '% del límite', 1, 100, 1],
    ['faltas', 'criticoPct', 'Rojo desde', '% del límite', 1, 100, 1],
    ['faltas', 'fijoPreventivo', 'Amarillo desde', 'faltas', 1, 100, 1],
    ['faltas', 'fijoCritico', 'Rojo desde', 'faltas', 1, 100, 1],
    ['evolucion', 'umbralPuntos', 'Cambio mínimo de promedio', 'puntos', 0.5, 50, 0.5]
  ];

  function inputUmbral(grupo, campo, label, unidad, min, max, step, valor) {
    const id = `u_${grupo}_${campo}`;
    return `
      <div class="field umbral">
        <label for="${id}">${label}</label>
        <div class="umbral-input"><input class="input" type="number" id="${id}" data-grupo="${grupo}" data-campo="${campo}"
          min="${min}" max="${max}" step="${step}" value="${valor}" inputmode="decimal" required><span class="muted small">${unidad}</span></div>
      </div>`;
  }

  function umbralesCard(cfg) {
    const u = cfg.umbrales;
    const f = (g, c) => {
      const d = CAMPOS_UMBRAL.find((x) => x[0] === g && x[1] === c);
      return inputUmbral(g, c, d[2], d[3], d[4], d[5], d[6], u[g][c]);
    };
    return `
      <section class="card perfil-ancho" aria-labelledby="umbT">
        <div class="card-header"><h3 id="umbT">${UI.icon('sliders')} Umbrales del semáforo</h3></div>
        <form class="card-body" id="umbralesForm" novalidate>
          <div class="umbrales-grid">
            <fieldset><legend>Calificación <span class="muted small">(abajo del amarillo = rojo)</span></legend>${f('calificacion', 'correctoMin')}${f('calificacion', 'preventivoMin')}</fieldset>
            <fieldset><legend>Faltas · % del límite de cada materia</legend>${f('faltas', 'preventivoPct')}${f('faltas', 'criticoPct')}</fieldset>
            <fieldset><legend>Materias sin límite de faltas</legend>${f('faltas', 'fijoPreventivo')}${f('faltas', 'fijoCritico')}</fieldset>
            <fieldset><legend>Evolución del desempeño</legend>${f('evolucion', 'umbralPuntos')}</fieldset>
          </div>
          <div class="alert alert-error" id="umbralesError" role="alert" hidden></div>
          <div class="vista-previa" id="vistaPrevia" aria-live="polite"></div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" id="restaurar">${UI.icon('refresh')}Restaurar por defecto</button>
            <button type="submit" class="btn btn-primary">Guardar umbrales</button>
          </div>
        </form>
      </section>`;
  }

  function leerUmbrales(form) {
    const u = {};
    form.querySelectorAll('input[data-grupo]').forEach((i) => {
      (u[i.dataset.grupo] = u[i.dataset.grupo] || {})[i.dataset.campo] = i.value === '' ? null : Number(i.value);
    });
    return u;
  }

  function validarUmbrales(u) {
    for (const [g, c, label, unidad, min, max] of CAMPOS_UMBRAL) {
      const v = u[g][c];
      if (v === null || Number.isNaN(v)) return `Falta «${label}» (${unidad}).`;
      if (v < min || v > max) return `«${label}» (${unidad}) debe estar entre ${min} y ${max}.`;
    }
    if (u.calificacion.preventivoMin >= u.calificacion.correctoMin) return 'El amarillo de calificación debe ser menor que el verde.';
    if (u.faltas.preventivoPct >= u.faltas.criticoPct) return 'El % de faltas para amarillo debe ser menor que el de rojo.';
    if (u.faltas.fijoPreventivo >= u.faltas.fijoCritico) return 'Las faltas fijas para amarillo deben ser menos que las de rojo.';
    if (!Number.isInteger(u.faltas.fijoPreventivo) || !Number.isInteger(u.faltas.fijoCritico)) return 'Las faltas fijas deben ser números enteros.';
    return '';
  }

  function enlazarUmbrales(cfg) {
    const form = root.querySelector('#umbralesForm');
    const errorBox = form.querySelector('#umbralesError');
    const previa = form.querySelector('#vistaPrevia');

    async function vistaPrevia() {
      const u = leerUmbrales(form);
      const msg = validarUmbrales(u);
      errorBox.textContent = msg; errorBox.hidden = !msg;
      if (msg) { previa.innerHTML = ''; return; }
      try {
        const { totales: t } = await UI.api('/configuracion/vista-previa', { method: 'POST', body: { umbrales: u } });
        if (!root.isConnected) return;
        previa.innerHTML = t.correcto + t.preventivo + t.critico
          ? `<span class="muted">Con estos valores habría:</span>
             ${UI.badgeEstado('critico')} <strong>${fmt(t.critico)}</strong>
             ${UI.badgeEstado('preventivo')} <strong>${fmt(t.preventivo)}</strong>
             ${UI.badgeEstado('correcto')} <strong>${fmt(t.correcto)}</strong>`
          : '<span class="muted">La vista previa aparece cuando hay alumnos cargados.</span>';
      } catch (err) {
        errorBox.textContent = err.message; errorBox.hidden = false;
      }
    }

    form.addEventListener('input', () => { clearTimeout(previewTimer); previewTimer = setTimeout(vistaPrevia, 300); });
    form.querySelector('#restaurar').addEventListener('click', () => {
      form.querySelectorAll('input[data-grupo]').forEach((i) => { i.value = cfg.porDefecto[i.dataset.grupo][i.dataset.campo]; });
      vistaPrevia();
      UI.toast('Valores por defecto puestos. Guarda para aplicarlos.', 'info');
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = leerUmbrales(form);
      const msg = validarUmbrales(u);
      errorBox.textContent = msg; errorBox.hidden = !msg;
      if (msg) return;
      const btn = form.querySelector('[type="submit"]');
      UI.setBusy(btn, true);
      try {
        await UI.api('/configuracion', { method: 'PUT', body: { umbrales: u } });
        UI.toast('Umbrales guardados. Los estados se recalcularon.', 'success');
      } catch (err) {
        errorBox.textContent = err.message; errorBox.hidden = false;
      } finally {
        UI.setBusy(btn, false);
      }
    });
    vistaPrevia();
  }

  // ---------- Datos (#43) ----------
  function datosCard() {
    return `
      <section class="card perfil-ancho" aria-labelledby="datosT">
        <div class="card-header"><h3 id="datosT">${UI.icon('database')} Datos</h3></div>
        <div class="card-body datos-acciones">
          <div>
            <p><strong>Respaldo</strong></p>
            <p class="muted small">Descarga una copia completa de la base de datos (alumnos, listas, cuenta y umbrales). Guárdala en una memoria o en la nube.</p>
            <button type="button" class="btn btn-outline" id="respaldo">${UI.icon('download')}Descargar respaldo</button>
          </div>
          <div>
            <p><strong>Borrar datos académicos</strong></p>
            <p class="muted small">Quita alumnos, materias, listas e historial de cargas. Tu cuenta y los umbrales se conservan. No se puede deshacer.</p>
            <button type="button" class="btn btn-outline btn-peligro" id="borrarDatos">${UI.icon('trash')}Borrar todos los datos académicos</button>
          </div>
        </div>
      </section>`;
  }

  function enlazarDatos() {
    root.querySelector('#respaldo').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      UI.setBusy(btn, true);
      try {
        const nombre = await UI.download('/datos/respaldo', 'sema-respaldo.db');
        UI.toast(`Respaldo descargado: ${nombre}`, 'success');
      } catch (err) { UI.toast(err.message, 'error'); }
      finally { UI.setBusy(btn, false); }
    });
    root.querySelector('#borrarDatos').addEventListener('click', async () => {
      const r = await UI.formModal({
        title: '¿Borrar todos los datos académicos?',
        description: 'Se eliminarán alumnos, materias, listas e historial. Te recomendamos descargar un respaldo antes. Esta acción no se puede deshacer.',
        fields: [
          { name: 'confirmacion', label: 'Escribe BORRAR para confirmar', required: true, placeholder: 'BORRAR' },
          { name: 'passwordActual', label: 'Contraseña actual', type: 'password', required: true }
        ],
        submitText: 'Borrar datos',
        danger: true,
        onSubmit: (v) => {
          if (v.confirmacion !== 'BORRAR') throw new Error('Escribe BORRAR, en mayúsculas.');
          return UI.api('/datos', { method: 'DELETE', body: v });
        }
      });
      if (r) {
        UI.setLista(null);
        UI.toast('Datos académicos borrados', 'success');
      }
    });
  }

  // ---------- Montaje ----------
  async function mount(container) {
    root = container;
    let user = UI.getUser() || {};
    root.innerHTML = `
      <section class="page-header"><div><h2>Perfil</h2><p class="muted">Tu cuenta, preferencias y la configuración del semáforo.</p></div></section>
      <section class="card"><div class="table-skeleton" aria-busy="true">${'<span class="skeleton"></span>'.repeat(6)}</div></section>`;
    let cfg;
    try {
      const [me, c] = await Promise.all([UI.api('/auth/me'), UI.api('/configuracion')]);
      user = me.user; cfg = c;
      UI.setUser(user);
    } catch (err) {
      if (!root.isConnected) return;
      root.innerHTML = `<section class="card"><div class="empty-state"><span class="empty-icon">${UI.icon('alert')}</span>
        <h3>No se pudo cargar</h3><p class="muted">${UI.escape(err.message)}</p>
        <button class="btn btn-outline" type="button" id="retryBtn">${UI.icon('refresh')}Reintentar</button></div></section>`;
      root.querySelector('#retryBtn').addEventListener('click', () => mount(container));
      return;
    }
    if (!root.isConnected) return;
    root.innerHTML = `
      <section class="page-header"><div><h2>Perfil</h2><p class="muted">Tu cuenta, preferencias y la configuración del semáforo.</p></div></section>
      <div class="perfil-grid">
        ${cuentaCard(user)}
        ${passwordCard(user)}
        ${prefsCard(user)}
        ${umbralesCard(cfg)}
        ${datosCard()}
      </div>`;
    enlazarCuenta();
    enlazarPassword();
    enlazarPrefs(user);
    enlazarUmbrales(cfg);
    enlazarDatos();
  }

  return { mount };
})();
