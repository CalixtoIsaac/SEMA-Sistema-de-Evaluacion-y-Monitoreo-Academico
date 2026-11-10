/**
 * Pantalla de inicio de sesión.
 * La cuenta por defecto (JesusSanJuan) la crea el servidor al arrancar,
 * así que aquí solo se muestra el formulario para entrar.
 */
(() => {
  const $ = (id) => document.getElementById(id);
  const alertBox = $('authAlert');
  const DESTINO = '/app#resumen';

  // Si ya hay sesión, directo al Menú principal (app.js la valida con el servidor).
  if (UI.getToken()) {
    location.replace(DESTINO);
    return;
  }

  UI.hydrateIcons(document);

  function showAlert(message, type = 'error') {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.hidden = false;
  }
  function hideAlert() { alertBox.hidden = true; }

  // Mensaje pendiente, por ejemplo: "Tu sesión expiró".
  const pendingMessage = UI.takeAuthMessage();
  if (pendingMessage) showAlert(pendingMessage, 'info');

  // Botón para mostrar / ocultar la contraseña
  document.querySelectorAll('[data-toggle-password]').forEach((btn) => {
    const input = $(btn.dataset.togglePassword);
    const update = () => {
      const visible = input.type === 'text';
      btn.innerHTML = UI.icon(visible ? 'eyeOff' : 'eye');
      btn.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
    };
    btn.addEventListener('click', () => {
      input.type = input.type === 'password' ? 'text' : 'password';
      update();
      input.focus();
    });
    update();
  });

  // Enviar el formulario (con el botón o con Enter)
  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const form = e.currentTarget;
    const button = form.querySelector('[type="submit"]');
    const data = new FormData(form);

    UI.setBusy(button, true);
    button.innerHTML = '<span class="spinner" aria-hidden="true"></span>Entrando…';

    try {
      const { token, user } = await UI.api('/auth/login', {
        method: 'POST',
        body: { usuario: data.get('usuario'), password: data.get('password') }
      });
      UI.setSession(token, user);
      location.replace(DESTINO);
    } catch (err) {
      UI.setBusy(button, false);
      showAlert(err.status === 401 ? 'Usuario o contraseña incorrectos.' : err.message);
      $('loginPass').value = '';
      $('loginPass').focus();
    }
  });
})();
