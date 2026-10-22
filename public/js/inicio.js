/**
 * Vista de inicio (pantalla que aparece tras iniciar sesión).
 *
 * Por ahora muestra el saludo, las tarjetas de indicadores vacías ("—") y el
 * estado vacío. En el Sprint 1 se reemplaza por el Menú principal
 * (Resumen administrativo, context/05_UI_UX.md §5) con datos de /api/resumen.
 */
const Inicio = (() => {
  const CARDS = [
    { label: 'Alumnos',          icon: 'users', tone: 'tone-primary' },
    { label: 'Promedio general', icon: 'chart', tone: 'tone-info' },
    { label: 'Crítico',          icon: 'alert', tone: 'tone-danger' },
    { label: 'Preventivo',       icon: 'clock', tone: 'tone-warning' },
    { label: 'Correcto',         icon: 'check', tone: 'tone-success' }
  ];

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  function statCard(card) {
    return `
      <div class="card stat">
        <div>
          <p class="stat-label">${UI.escape(card.label)}</p>
          <p class="stat-value">—</p>
        </div>
        <span class="stat-icon ${card.tone}">${UI.icon(card.icon)}</span>
      </div>`;
  }

  function mount(container) {
    const user = UI.getUser() || {};
    const firstName = String(user.nombre || '').split(' ')[0];

    container.innerHTML = `
      <section class="page-header">
        <div>
          <h2>${greeting()}${firstName ? ', ' + UI.escape(firstName) : ''}</h2>
          <p class="muted">Sistema de Evaluación y Monitoreo Académico</p>
        </div>
      </section>

      <div class="stats">${CARDS.map(statCard).join('')}</div>

      <section class="card">
        <div class="empty-state">
          <span class="empty-icon">${UI.icon('inbox')}</span>
          <h3>Aún no hay datos en el sistema</h3>
          <p class="muted">Cuando cargues el Excel de monitoreo, aquí verás los indicadores y las gráficas.</p>
        </div>
      </section>`;
  }

  return { mount };
})();
