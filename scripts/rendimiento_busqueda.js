/**
 * #26 · Rendimiento de la búsqueda y el orden del navegador con 5,000 alumnos (RNF-01: < 200 ms).
 *   node scripts/rendimiento_busqueda.js
 * Usa las mismas funciones que la vista Alumnos (public/js/orden-busqueda.js, #23).
 */
const { normalizar, ordenarAlumnos } = require('../public/js/orden-busqueda.js');

const APELLIDOS = ['Pérez', 'López', 'García', 'Hernández', 'Martínez', 'Muñoz', 'Gómez', 'Díaz', 'Cruz', 'Ruiz', 'Ríos', 'Silva'];
const NOMBRES = ['Ana', 'Luis', 'María José', 'Diego', 'Karla', 'Mateo', 'Regina', 'Santiago'];
const ESTADOS = ['correcto', 'preventivo', 'critico', 'sin_datos', 'baja'];
let semilla = 7;
const azar = (n) => { semilla = (semilla * 16807) % 2147483647; return semilla % n; };

const alumnos = Array.from({ length: 5000 }, (_, i) => {
  const ap = `${APELLIDOS[azar(12)]} ${APELLIDOS[azar(12)]}`;
  const no = NOMBRES[azar(8)];
  return {
    matricula: `T${String(90000000 + i).padStart(8, '0')}`,
    nombre: `${ap} ${no}`, nombreMostrar: `${no} ${ap}`,
    promedioGeneral: azar(10) ? 50 + azar(5000) / 100 : null,
    faltasTotal: azar(30), estado: ESTADOS[azar(5)]
  };
});

function filtrar(q, cache) {
  const palabras = normalizar(q).split(/\s+/).filter(Boolean);
  return alumnos.filter((a) => {
    const texto = cache ? (a._b || (a._b = normalizar(`${a.nombreMostrar} ${a.nombre} ${a.matricula}`)))
      : normalizar(`${a.nombreMostrar} ${a.nombre} ${a.matricula}`);
    return palabras.every((p) => texto.includes(p));
  });
}

function medir(nombre, fn, veces = 20) {
  fn();
  const t = process.hrtime.bigint();
  let r;
  for (let i = 0; i < veces; i++) r = fn();
  const ms = Number(process.hrtime.bigint() - t) / 1e6 / veces;
  console.log(`${nombre.padEnd(52)} ${ms.toFixed(1).padStart(7)} ms  (${r.length} filas)`);
  return ms;
}

console.log('5,000 alumnos sintéticos\n');
const peor = Math.max(
  medir('Primera búsqueda "perez mar" (sin caché)', () => filtrar('perez mar', false), 5),
  medir('Búsqueda "perez mar" (con caché, como la vista)', () => filtrar('perez mar', true)),
  medir('Búsqueda + orden promedio y faltas', () => ordenarAlumnos(filtrar('muñoz', true), { promedio: true, faltas: true })),
  medir('Orden de los 5,000 (promedio y faltas)', () => ordenarAlumnos(alumnos, { promedio: true, faltas: true }))
);
console.log(`\nPeor caso: ${peor.toFixed(1)} ms · RNF-01 pide < 200 ms ${peor < 200 ? '✔' : '✘'}`);
