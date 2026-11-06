// Pruebas del orden de la tabla de alumnos (#24), con los casos de context/07 §6 y §11.
const test = require('node:test');
const assert = require('node:assert/strict');
const { ordenarAlumnos } = require('../public/js/orden-busqueda.js');

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