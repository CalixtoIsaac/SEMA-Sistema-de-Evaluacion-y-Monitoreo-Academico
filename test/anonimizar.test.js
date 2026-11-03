'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../scripts/anonimizar-excel');

const ENC = ['Campus', 'Año - periodo', 'Nombre del periodo', 'Parte periodo', 'Modalidad', 'Matrícula', 'Nombre del alumno',
  'Nombre de la materia', 'Nivel', 'Clave de materia', 'CRN', '# Grupo', 'Modalidad', 'Estatus', 'Descripción estatus', 'Nómina',
  'Nombre del profesor', 'Límite de faltas', 'Faltas del alumno', 'Límite de NE', 'NE alumno', 'Dom', 'Lun', 'Mar', 'Mier', 'Jue',
  'Vier', 'Sáb', 'Inicio', 'Fin', 'Edificio', 'Salón',
  ...Array.from({ length: 50 }, (_, i) => 'A' + (i + 1)),
  'Ponderado', 'Calificación final actual', 'Motivo cf', 'Clave plan de estudios', 'Descripción plan de estudios',
  'Campus de admisión', 'Contar SC', 'Última actualización', 'Último usuario que modifico', 'Última actividad actualizada',
  'Agenda asignada al CRN', 'Deuda del alumno'];

const C = Object.fromEntries(ENC.map((h, i) => [h + (h === 'Modalidad' && i > 5 ? '2' : ''), i]));
const APELLIDOS = ['Quintanilla', 'Bermúdez', 'Zamudio', 'Echeverría', 'Olvera', 'Tlapa', 'Xicoténcatl', 'Barragán', 'Cervantes', 'Iturbide'];
const NOMBRES = ['Aurelio', 'Wendy', 'Bernardo', 'Citlali', 'Xiadani Dolores', 'Hipólito', 'Itzel', 'Octavio', 'Yazmín', 'Rubén Adolfo'];
const APE_REALES = APELLIDOS;
const NOM_REALES = NOMBRES;
const PROFES = [['L01000001', 'Xochitl Barragán  Hipólito '], ['L01000002', 'Olvera Tlapa  Bernardo '], ['L01000003', 'Zamudio Iturbide  Citlali ']];

function excelReal(){
    const filas = [];
    for(let a = 0; a < 80; a++) {
        const mat = 'T0' + String(1000000 + a);
        let nombre = `${APELLIDOS[a % 10]} ${APELLIDOS[(a * 3 + 1) % 10]} ${NOMBRES[(a * 7) % 10]}`;
        if(a % 10 === 3) nombre = `De la ${nombre}`;
        const perfil = a % 8 === 0 ? 'K' : a % 4 === 0 ? 'P' : 'C';
    const baja = a === 5 || a === 6;
    for (let m = 0; m < 5; m++) {
      const f = Array(94).fill('');
      const prof = PROFES[m % 3];
      f[C.Campus] = 'Veracruz'; f[C['Año - periodo']] = '202660'; f[C['Nombre del periodo']] = '2026 Ago - Dic';
      f[C['Parte periodo']] = '1'; f[C.Modalidad] = 'Semestral'; f[C.Matrícula] = mat; f[C['Nombre del alumno']] = nombre;
      f[C['Nombre de la materia']] = 'Materia ' + m; f[C.Nivel] = 'Preparatoria'; f[C['Clave de materia']] = 'BS' + (3000 + m);
      f[C.CRN] = String(16000 + m); f[C['# Grupo']] = '603'; f[C.Modalidad2] = 'Teórica';
      f[C.Estatus] = baja ? 'BT' : 'RW'; f[C['Descripción estatus']] = baja ? '**Baja total**' : '**Inscrito por Web**';
      f[C.Nómina] = prof[0]; f[C['Nombre del profesor']] = prof[1];
      f[C['Límite de faltas']] = '10'; f[C['Faltas del alumno']] = String(perfil === 'K' ? 9 : perfil === 'P' ? 6 : 1);
      f[C['Límite de NE']] = '3'; f[C['NE alumno']] = '0';
      f[C.Lun] = 'SI'; f[C.Mier] = 'SI'; f[C.Inicio] = '10:30'; f[C.Fin] = '11:29';
      const nota = perfil === 'K' ? 55 : perfil === 'P' ? 74 : 92;
      for (let k = 0; k < 6; k++) f[32 + k] = String(nota + k);
      f[32 + 6] = '   ';
      if (a === 10 && m === 0) f[32 + 1] = 'NE';
      if (a === 11 && m === 0) f[32 + 1] = 'SC';
      if (a === 12 && m === 0) f[32 + 1] = 'DA';
      f[C.Ponderado] = a === 14 && m === 0 ? 'SD' : String(nota);
      f[C['Clave plan de estudios']] = 'BAG_SR'; f[C['Descripción plan de estudios']] = 'Bachillerato General';
      f[C['Campus de admisión']] = 'Veracruz'; f[C['Contar SC']] = '0'; f[C['Última actualización']] = '06-10-2026';
      f[C['Último usuario que modifico']] = prof[0]; f[C['Última actividad actualizada']] = '6';
      f[C['Agenda asignada al CRN']] = f[C.CRN]; f[C['Deuda del alumno']] = String(1000 + a) + '.65';
      filas.push(f);
        }
    }

    return {encabezados: ENC, filas};
}

const col = A.mapearColumnas(ENC);

test('columnas: encuentra las obligatorias aunque falten acentos, y avisa cuáles faltan', () => {
  assert.equal(col.matricula, C.Matrícula);
  assert.equal(col.actividades.length, 50);
  const sinAcentos = ENC.map((h) => h.replace('Matrícula', 'MATRICULA').replace('Año', 'Ano'));
  assert.equal(A.mapearColumnas(sinAcentos).matricula, C.Matrícula);
  assert.deepEqual(A.mapearColumnas(['Matrícula', 'CRN']).faltan.slice(0, 2), ['ano - periodo', 'nombre del alumno']);
  assert.throws(() => A.procesar({ encabezados: ['x'], filas: [] }), /Faltan encabezados/);
});
 
test('clasificación: casos raros y estados', () => {
  const g = A.agruparPorAlumno(excelReal().filas, col);
  assert.equal(g.size, 80);
  assert.equal(g.get('T01000005').flags.BT, true);
  assert.equal(g.get('T01000014').flags.SD, true);
  assert.equal(g.get('T01000014').estado, 'critico');
  assert.equal(g.get('T01000010').flags.NE, true);
  assert.equal(g.get('T01000011').flags.SC, true);
  assert.equal(g.get('T01000012').flags.DA, true);
  assert.equal(g.get('T01000001').estado, 'correcto');
  assert.equal(g.get('T01000004').estado, 'preventivo');
  assert.equal(g.get('T01000008').estado, 'critico');
});
 
test('un alumno con todas las filas BT queda como baja y no cuenta para el estado', () => {
  const filas = excelReal().filas.filter((f) => f[col.matricula] === 'T01000005');
  assert.equal(A.clasificarAlumno(filas, col).estado, 'baja');
});
 
test('selección: ~30 alumnos con todas sus filas y todos los casos cubiertos', () => {
  const r = A.procesar(excelReal(), { alumnos: 30, semilla: 1 });
  assert.equal(r.resumen.alumnos, 30);
  assert.equal(r.filasAnon.length, 30 * 5);
  assert.deepEqual(r.resumen.sinCandidato, []);
  for (const e of ['correcto', 'preventivo', 'critico']) assert.ok(r.resumen.estados[e] > 0, e);
  const c = (cond) => r.filasAnon.some(cond);
  assert.ok(c((f) => f[col.estatus] === 'BT'), 'BT');
  assert.ok(c((f) => f[col.ponderado] === 'SD'), 'SD');
  for (const k of ['NE', 'SC', 'DA']) assert.ok(c((f) => col.actividades.some((i) => f[i] === k)), k);
});
 
test('anonimización: nada del original queda, formatos T9/L9, deuda vacía y estructura intacta', () => {
  const orig = excelReal();
  const r = A.procesar(orig, { alumnos: 30, semilla: 7 });
  assert.equal(r.verificacion.ok, true, r.verificacion.problemas.join('\n'));
  assert.deepEqual(r.encabezados, ENC);                               
  assert.equal(r.encabezados.filter((h) => h === 'Modalidad').length, 2);
  for (const f of r.filasAnon) {
    assert.match(f[col.matricula], /^T9\d{7}$/);
    assert.match(f[col.nomina], /^L9\d{7}$/);
    assert.match(f[col.ultimoUsuario], /^L9\d{7}$/);
    assert.equal(f[col.deuda], '');
    assert.equal(f.length, 94);
  }
  const todo = JSON.stringify(r.filasAnon) + JSON.stringify(r.lista);
  for (const real of [...APE_REALES, ...NOM_REALES.map((n) => n.split(' ')[0]), 'T01000', 'L0100']) assert.ok(!todo.includes(real), real);
  const personales = [col.matricula, col.nombreAlumno, col.nomina, col.nombreProfesor, col.ultimoUsuario, col.deuda];
  const sinPersonales = (f) => JSON.stringify(f.map((v, i) => (personales.includes(i) ? '' : v)));
  const originales = new Set(orig.filas.map(sinPersonales));
  for (const f of r.filasAnon) assert.ok(originales.has(sinPersonales(f)));
});
 
test('anonimización: un alumno = un solo código en todas sus filas; códigos distintos entre alumnos y profesores', () => {
  const r = A.procesar(excelReal(), { alumnos: 30, semilla: 3 });
  const porMat = new Map();
  for (const f of r.filasAnon) { const s = porMat.get(f[col.matricula]) || new Set(); s.add(f[col.nombreAlumno]); porMat.set(f[col.matricula], s); }
  assert.equal(porMat.size, 30);
  for (const s of porMat.values()) assert.equal(s.size, 1);
  assert.equal(new Set([...porMat.values()].map((s) => [...s][0])).size, 30);
  const profes = new Map(r.filasAnon.map((f) => [f[col.nomina], f[col.nombreProfesor]]));
  assert.equal(profes.size, 3);
});
 
test('nombres: conserva la partícula y las manías del Excel (doble espacio y espacio al final en profesores)', () => {
  const r = A.procesar(excelReal(), { alumnos: 80, semilla: 5 });
  const conParticula = r.filasAnon.filter((f) => /^(De la|Del|De los|San|De) /.test(f[col.nombreAlumno]));
  const mats = new Set(conParticula.map((f) => f[col.matricula]));
  assert.equal(mats.size, 8);
  for (const f of r.filasAnon) {
    assert.match(f[col.nombreProfesor], /\S  \S/);
    assert.match(f[col.nombreProfesor], / $/);
  }
});
 
test('es determinista: misma semilla = mismo resultado; otra semilla = otro', () => {
  const a = JSON.stringify(A.procesar(excelReal(), { semilla: 11 }));
  assert.equal(JSON.stringify(A.procesar(excelReal(), { semilla: 11 })), a);
  assert.notEqual(JSON.stringify(A.procesar(excelReal(), { semilla: 12 })), a);
});
 
test('la revisión final detecta un dato real que se haya colado', () => {
  const orig = excelReal();
  const r = A.procesar(orig, { alumnos: 30, semilla: 2 });
  const malas = r.filasAnon.map((f) => [...f]);
  malas[0][col.matricula] = 'T01000001';
  malas[1][col.nombreAlumno] = orig.filas[0][col.nombreAlumno];
  malas[2][col.deuda] = '1000.65';
  const v = A.verificarSinDatosReales(orig.filas, malas, col);
  assert.equal(v.ok, false);
  assert.equal(v.problemas.length, 3);
  assert.ok(!v.problemas.join(' ').includes('T01000001')); 
});

test('lista de muestra: formato del cliente, 10 existentes + 2 inexistentes + 1 con nombre distinto', () => {
  const r = A.procesar(excelReal(), { alumnos: 30, semilla: 4 });
  assert.deepEqual(r.lista[0], ['Matrícula', 'Nombre']);
  const datos = r.lista.slice(1);
  assert.equal(datos.length, 13);
  const alumnos = new Map(r.filasAnon.map((f) => [f[col.matricula], f[col.nombreAlumno]]));
  const existentes = datos.filter(([m]) => alumnos.has(m));
  assert.equal(existentes.length, 11);                                      // 10 iguales + 1 con nombre distinto
  assert.equal(existentes.filter(([m, n]) => A.normalizar(n) === A.normalizar(alumnos.get(m))).length, 10);
  const distinto = existentes.find(([m, n]) => A.normalizar(n) !== A.normalizar(alumnos.get(m)));
  assert.ok(alumnos.get(distinto[0]).startsWith(distinto[1].trim()));       // al nombre de la lista le falta una parte
  assert.deepEqual(datos.filter(([m]) => !alumnos.has(m)).map(([m]) => m).sort(), ['T98000001', 'T98000002']);
  assert.ok(datos.some(([, n]) => n.endsWith(' ')) && datos.some(([, n]) => !n.endsWith(' ')));
  assert.equal(new Set(datos.map(([m]) => m)).size, 13);
});
 
test('pide mínimo 11 alumnos para armar la lista', () => {
  assert.throws(() => A.procesar(excelReal(), { alumnos: 8, semilla: 1 }), /al menos 11 alumnos/);
});
 
test('elegirAlumnos: un alumno que cubre varios casos no genera avisos falsos', () => {
  const mk = (flags, estado) => ({ flags: { BT: false, SD: false, NE: false, SC: false, DA: false, ...flags }, estado, filas: [] });
  const grupos = new Map([
    ['T1', mk({ BT: true, SD: true, NE: true, SC: true, DA: true }, 'critico')],   // el único con casos raros
    ['T2', mk({}, 'correcto')], ['T3', mk({}, 'preventivo')], ['T4', mk({}, 'correcto')],
  ]);
  const r = A.elegirAlumnos(grupos, 30, A.crearAzar(1));
  assert.deepEqual(r.sinCandidato, []);
  assert.deepEqual([...r.elegidos].sort(), ['T1', 'T2', 'T3', 'T4']);
});
 
test('elegirAlumnos: avisa de los casos que el archivo realmente no tiene', () => {
  const mk = (estado) => ({ flags: { BT: false, SD: false, NE: false, SC: false, DA: false }, estado, filas: [] });
  const r = A.elegirAlumnos(new Map([['T1', mk('correcto')], ['T2', mk('correcto')]]), 30, A.crearAzar(1));
  assert.deepEqual(r.sinCandidato, ['una baja (BT)', 'un SD en Ponderado', 'un NE', 'un SC', 'un DA', 'estado Crítico', 'estado Preventivo']);
  assert.equal(r.elegidos.length, 2);
});
