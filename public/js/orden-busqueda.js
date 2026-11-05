/**
 * Orden de la tabla de alumnos (#24 · HU-15), igual que context/07 §6.
 *
 *   Ninguna casilla      → nombre A→Z, luego matrícula
 *   PROMEDIO             → promedio menor → mayor, luego nombre
 *   FALTAS               → faltas mayor → menor, luego nombre
 *   PROMEDIO + FALTAS    → promedio menor → mayor, faltas mayor → menor, luego nombre
 *
 * Los alumnos sin promedio (Sin datos) y las bajas van siempre al final.
 */
const OrdenBusqueda = (() => {
  // Se compara con 1 decimal, que es lo que ve el usuario en la tabla.
  const redondear = (n) => (n === null || n === undefined ? null : Math.round(n * 10) / 10);
  const alFinal = (a) => (a.estado === 'baja' || a.promedioGeneral === null || a.promedioGeneral === undefined ? 1 : 0);
  const porNombre = (a, b) =>
    String(a.nombreMostrar || '').localeCompare(String(b.nombreMostrar || ''), 'es', { sensitivity: 'base' })
    || String(a.matricula || '').localeCompare(String(b.matricula || ''));

  function ordenarAlumnos(alumnos, { promedio = false, faltas = false } = {}) {
    return [...alumnos].sort((a, b) =>
      (alFinal(a) - alFinal(b))
      || (promedio ? redondear(a.promedioGeneral) - redondear(b.promedioGeneral) : 0)
      || (faltas ? (b.faltasTotal || 0) - (a.faltasTotal || 0) : 0)
      || porNombre(a, b));
  }

  return { ordenarAlumnos };
})();

// Permite usar este archivo en las pruebas de Node (npm test).
if (typeof module !== 'undefined') module.exports = OrdenBusqueda;