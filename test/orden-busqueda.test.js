// Pruebas del orden (#24) y de la búsqueda (#23) de la tabla de alumnos, con los casos de context/07 §6 y §11.
const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizar, ordenarAlumnos } = require('../public/js/orden-busqueda.js');

const alumno = (nombreMostrar, promedioGeneral, faltasTotal, extra = {}) => ({
  nombreMostrar, matricula: `T9${nombreMostrar}`, promedioGeneral, faltasTotal, estado: 'correcto', ...extra
});
const nombres = (lista) => lista.map((a) => a.nombreMostrar);

test('caso 12: promedio y faltas → C, D, B, A', () => {
  const A = alumno('Ana', 70, 3);
  const B = alumno('Beto', 70, 5);
  const C = alumno('Carla', 65, 0);
  const D = alumno('Abel', 70, 5); // su nombre va antes que el de B
  assert.deepEqual(nombres(ordenarAlumnos([A, B, C, D], { promedio: true, faltas: true })), ['Carla', 'Abel', 'Beto', 'Ana']);
});

test('sin casillas: alfabético sin importar acentos ni mayúsculas', () => {
  const lista = [alumno('Óscar', 90, 0), alumno('ana', 80, 0), alumno('Bruno', 70, 0)];
  assert.deepEqual(nombres(ordenarAlumnos(lista)), ['ana', 'Bruno', 'Óscar']);
});

test('solo faltas: de más a menos faltas', () => {
  const lista = [alumno('Ana', 90, 1), alumno('Beto', 90, 8), alumno('Carla', 90, 4)];
  assert.deepEqual(nombres(ordenarAlumnos(lista, { faltas: true })), ['Beto', 'Carla', 'Ana']);
});

test('promedio: empate con el valor redondeado a 1 decimal → por nombre', () => {
  const lista = [alumno('Beto', 70.04, 0), alumno('Ana', 69.96, 0)];
  assert.deepEqual(nombres(ordenarAlumnos(lista, { promedio: true })), ['Ana', 'Beto']);
});

test('sin datos y bajas van al final', () => {
  const lista = [
    alumno('Ana', null, 0, { estado: 'sin_datos' }),
    alumno('Beto', 60, 2),
    alumno('Abel', null, 0, { estado: 'baja' }),
    alumno('Carla', 95, 0)
  ];
  assert.deepEqual(nombres(ordenarAlumnos(lista, { promedio: true })), ['Beto', 'Carla', 'Abel', 'Ana']);
});

test('no modifica la lista original', () => {
  const lista = [alumno('Beto', 90, 0), alumno('Ana', 80, 0)];
  ordenarAlumnos(lista);
  assert.deepEqual(nombres(lista), ['Beto', 'Ana']);
});
// ---------- Búsqueda (#23 · context/07 §7) ----------
// Igual que en alumnos.js: todas las palabras deben aparecer, en cualquier orden.
const coincide = (texto, consulta) => {
  const palabras = normalizar(consulta).split(' ').filter(Boolean);
  return palabras.every((p) => normalizar(texto).includes(p));
};

test('normalizar quita acentos, mayúsculas y espacios de más', () => {
  assert.equal(normalizar('  Pérez   LÓPEZ  Muñoz '), 'perez lopez munoz');
  assert.equal(normalizar(null), '');
});

test('"perez mariana" encuentra "Pérez López Mariana"', () => {
  assert.ok(coincide('Pérez López Mariana T09000001', 'perez mariana'));
});

test('"munoz" encuentra "Muñoz" y "LOPEZ" encuentra "López"', () => {
  assert.ok(coincide('Ana Muñoz', 'munoz'));
  assert.ok(coincide('Pérez López Mariana', 'LOPEZ'));
});

test('la matrícula se busca por partes: "t0900" encuentra T09000001', () => {
  assert.ok(coincide('Pérez López Mariana T09000001', 't0900'));
});

test('si falta una palabra, no coincide', () => {
  assert.ok(!coincide('Pérez López Mariana', 'perez sofia'));
});