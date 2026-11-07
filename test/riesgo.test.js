// Pruebas de "Alumnos con mayor riesgo" (#38 · HU-22): qué alumnos entran y en qué orden.
const test = require('node:test');
const assert = require('node:assert/strict');
const { topRiesgo } = require('../public/js/riesgo.js');
 
const alumno = (nombre, estado, promedio, faltas) => ({
  nombreMostrar: nombre, matricula: `T9${nombre}`, estado, promedioGeneral: promedio, faltasTotal: faltas
});
const nombres = (lista) => lista.map((a) => a.nombreMostrar);
 
test('solo entran los Crítico y Preventivo', () => {
  const lista = [
    alumno('Ana', 'correcto', 95, 0), alumno('Beto', 'preventivo', 75, 2),
    alumno('Carla', 'critico', 60, 9), alumno('Dani', 'sin_datos', null, 0), alumno('Eva', 'baja', null, 0)
  ];
  assert.deepEqual(nombres(topRiesgo(lista)), ['Carla', 'Beto']);
});
 
test('orden: peor promedio primero; con empate, más faltas; luego nombre', () => {
  const lista = [
    alumno('Ana', 'preventivo', 72, 3), alumno('Beto', 'preventivo', 72, 8),
    alumno('Carla', 'critico', 55, 0), alumno('Abel', 'preventivo', 72, 8)
  ];
  assert.deepEqual(nombres(topRiesgo(lista)), ['Carla', 'Abel', 'Beto', 'Ana']);
});
 
test('muestra como máximo 10', () => {
  const lista = Array.from({ length: 25 }, (_, i) => alumno(`A${String(i).padStart(2, '0')}`, 'preventivo', 70 + (i % 9), i));
  assert.equal(topRiesgo(lista).length, 10);
  assert.equal(topRiesgo(lista, 3).length, 3);
});
 
test('sin alumnos en riesgo devuelve una lista vacía y no modifica la original', () => {
  const lista = [alumno('Beto', 'correcto', 90, 0), alumno('Ana', 'correcto', 95, 0)];
  assert.deepEqual(topRiesgo(lista), []);
  assert.deepEqual(nombres(lista), ['Beto', 'Ana']);
});
 