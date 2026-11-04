#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const quitarAcentos = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const normalizar = (t) => quitarAcentos(t ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

function texto(v) {

    if(v === null || v === undefined) return '';
    if(typeof v === 'object') {
        if(v instanceof Date) return v.toISOString().slice(0, 10);
        if(Array.isArray(v.richText)) return v.richText.map((p) => texto(p.text)).join('');
        if('result' in v) return texto(v.result);
        if('text' in v) return texto(v.text);
        return '';

    }

    return String(v);
}

function crearAzar(semilla){

    let a = semilla >>> 0;
    const r  = () => {

        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    r.entero = (n) => Math.floor(r() * n);
    r.elegir = (arr) => arr[r.entero(arr.length)];
    r.barajar = (arr) => {
        const c = [...arr];
        for (let i = c.length - 1; i > 0; i--) { const j = r.entero(i + 1); [c[i], c[j]] = [c[j], c[i]]; }
    return c;
    };

    return r;
}

//columnas

const OBLIGATORIAS = ['ano - periodo', 'matricula', 'nombre del alumno', 'nombre de la materia',
  'clave de materia', 'crn', 'faltas del alumno', 'ponderado'];

function mapearColumnas(cabeceras) {

    const norm = cabeceras.map((h) => normalizar(texto(h)));
    const faltan = OBLIGATORIAS.filter((h) => !norm.includes(h));

    if(faltan.length) return { faltan };
    const i = (n) => norm.indexOf(n);

    return {
     matricula: i('matricula'), nombreAlumno: i('nombre del alumno'), nomina: i('nomina'),
     nombreProfesor: i('nombre del profesor'), estatus: i('estatus'), ponderado: i('ponderado'),
     faltas: i('faltas del alumno'), limiteFaltas: i('limite de faltas'),
     ultimoUsuario: i('ultimo usuario que modifico'), deuda: i('deuda del alumno'), motivoCf: i('motivo cf'),
     actividades: norm.map((n, k) => (/^a\d{1,2}$/.test(n) ? k : -1)).filter((k) => k >= 0),
    };
}

const val = (fila, i) => (i < 0 ? '' : texto(fila[i]));
const claveMatricula = (fila, col) => val(fila, col.matricula).trim().toUpperCase();

//Clasificación de alumnos.

const GRAV = {sin_datos: 0, correcto: 1, preventivo: 2, critico: 3};
const peor = (a, b) => (GRAV[a] >= GRAV[b] ? a : b);
const numero = (t) => {
    
    const s = String(t).trim().replace(',', '.');
    return /^\d+(\.\d+)?$/.test(s) ? parseFloat(s) : null;
};

function estadoFaltas(faltas, limite) {

    if(!limite) return faltas >= 5 ? 'critico' : faltas >= 3 ? 'preventivo' : 'correcto';
    return faltas * 100 >= 80 * limite ? 'critico' : faltas * 100 >= 50 * limite ? 'preventivo' : 'correcto';

}

function clasificarAlumno(filas, col) {

    const flags = { BT: false, SD: false, NE: false, SC: false, DA: false };
    const notas = [];

    let estFaltas = 'correcto';
    let vigentes = 0;
    for(const fila of filas) {
        for (const k of col.actividades) {

            const c = val(fila, k).trim().toUpperCase();
            if(c === 'NE' || c === 'SC' || c === 'DA') flags[c] = true;
        }

        if(val(fila, col.estatus).trim().toUpperCase() === 'BT') { flags.BT = true; continue; }
        vigentes++;
        const p = val(fila, col.ponderado).trim().toUpperCase();
        if(p === 'SD') flags.SD = true;
        else { const n = numero(p); if (n != null) notas.push(n); }
        estFaltas = peor(estFaltas, estadoFaltas(parseInt(val(fila, col.faltas), 10) || 0, parseInt(val(fila, col.limiteFaltas), 10) || 0));
    }

    if(!vigentes) return { flags, estado : 'baja'};
    const prom = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
    const estProm = prom === null ? 'sin_datos' : prom >= 80 ? 'correcto' : prom >= 70 ? 'preventivo' : 'critico';
    return { flags, estado: flags.SD ? 'critico' : peor(estProm, estFaltas) };

}

function agruparPorAlumno(filas, col) {

    const porMatricula = new Map();
    for(const fila of filas) {
        const m = claveMatricula(fila, col);
        if(!m) continue;
        if(!porMatricula.has(m)) porMatricula.set(m, []);
        porMatricula.get(m).push(fila);
    }

    const grupos = new Map();
    for(const [m, fs_] of porMatricula) grupos.set(m, { filas: fs_, ...clasificarAlumno(fs_, col) });
    return grupos;
}

const REQUISITOS = [
  ['una baja (BT)', (a) => a.flags.BT], ['un SD en Ponderado', (a) => a.flags.SD],
  ['un NE', (a) => a.flags.NE], ['un SC', (a) => a.flags.SC], ['un DA', (a) => a.flags.DA],
  ['estado Crítico', (a) => a.estado === 'critico'], ['estado Preventivo', (a) => a.estado === 'preventivo'],
  ['estado Correcto', (a) => a.estado === 'correcto'],
];

function elegirAlumnos(grupos, n, azar) {

    const todos = azar.barajar([...grupos.keys()]);
    const elegidos = [];
    const sinCandidato = [];
    for(const [desc, cond] of REQUISITOS) {
        if(elegidos.some((m) => cond(grupos.get(m)))) continue;
        const candidatos = todos.filter((m) => !elegidos.includes(m) && cond(grupos.get(m)));
        if(candidatos.length) elegidos.push(azar.elegir(candidatos));
        else sinCandidato.push(desc);

    }

    for(const m of todos) {
        if(elegidos.length >= n) break;
        if(!elegidos.includes(m)) elegidos.push(m);
    }

    return { elegidos, sinCandidato };
}

const APELLIDOS = ['García', 'Hernández', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez',
  'Cruz', 'Flores', 'Gómez', 'Morales', 'Vázquez', 'Jiménez', 'Reyes', 'Torres', 'Díaz', 'Mendoza', 'Ortiz', 'Castillo',
  'Aguilar', 'Rojas', 'Luna', 'Salazar', 'Domínguez', 'Fuentes', 'Ríos', 'Silva', 'Navarro'];
const NOMBRES = ['Daniel', 'José Manuel', 'Diego', 'Carlos', 'Emiliano', 'Santiago', 'Mateo', 'Sebastián', 'Iván', 'Mariana',
  'Ana Sofía', 'Valeria', 'Camila', 'Regina', 'Daniela', 'Fernanda', 'Ximena', 'Paola', 'Karla', 'Luis Ángel'];
const SEGUNDOS = ['Alejandro', 'Isabel', 'Antonio', 'Guadalupe', 'Andrés', 'Eduardo', 'Patricia', 'Javier'];
const PARTICULA = /^(de|del|la|las|los|y|san|santa|mc|van|von)$/;
const PARTICULAS_FICTICIAS = ['De la', 'Del', 'De los', 'San', 'De'];

function crearAnonimizador(azar, nombres = new Set()) {

    const mapas = { mat : new Map(), nom: new Map(), alumno: new Map(), profesor: new Map() };
    const usados = new Set();
    const siguiente = (mapa, prefijo, clave) => {
        if(!mapa.has(clave)) mapa.set(clave, prefijo + String(mapa.size + 1).padStart(7, '0'));
        return mapa.get(clave);
    

    };

    const nuevoNombre = (conParticula, soloUnNombre = false) => {
        
        for(let intento = 0; intento < 200; intento++){
            
            const part = conParticula ? azar.elegir(PARTICULAS_FICTICIAS) : '';
            const base = azar.elegir(NOMBRES);
            const nombre = base +(!soloUnNombre && azar() < 0.4 ? ' ' + azar.elegir(SEGUNDOS) : '');
            const completo = [part, azar.elegir(APELLIDOS), azar.elegir(APELLIDOS), nombre].filter(Boolean).join(' ');
            const k = normalizar(completo);
            if(!usados.has(k) && !nombres.has(k)) {usados.add(k); return completo;}
        }

        throw new Error('No se puede generar un nombre ficticio único');
    };

    const conParticula = (original) => normalizar(original).split(' ').some((p) => PARTICULA.test(p));
    return {
        
    matricula: (m) => siguiente(mapas.mat, 'T9', m),
    nomina: (n) => siguiente(mapas.nom, 'L9', n),
    nombreAlumno(m, original) {
      if (!mapas.alumno.has(m)) mapas.alumno.set(m, nuevoNombre(conParticula(original)));
      return mapas.alumno.get(m);
        
        },

        nombreProfesor(nomina, original) {

            if(!mapas.profesor.has(nomina)){
                const partes = nuevoNombre(false, true).split(' ');
                const apellidos = partes.slice(0, 2).join(' ');
                const nombre = partes.slice(2).join(' ');
                mapas.profesor.set(nomina, apellidos + (original.includes('  ') ? '  ' : ' ') + nombre + (/\s$/.test(original) ? ' ' : ''));

            }

        return mapas.profesor.get(nomina);
        },

        nombreSuelto: () => nuevoNombre(false),
    };
}

function anonimizarFila(fila, col, ctx) {

    const f = [...fila];
    const poner = (i, v) => { if (i >= 0) f[i] = v; };
    const mat = claveMatricula(fila, col);
    poner(col.matricula, ctx.matricula(mat));
    poner(col.nombreAlumno, ctx.nombreAlumno(mat, val(fila, col.nombreAlumno)));
    const nomina = val(fila, col.nomina).trim().toUpperCase();
    const nombreProf = val(fila, col.nombreProfesor);

    if(nomina) {
        poner(col.nomina, ctx.nomina(nomina));
        poner(col.nombreProfesor, ctx.nombreProfesor(nomina, nombreProf));

    } else if(nombreProf.trim()){
      poner(col.nombreProfesor, ctx.nombreProfesor('sin-nomina:' + normalizar(nombreProf), nombreProf));
    }

    const ultimo = val(fila, col.ultimoUsuario).trim().toUpperCase();

    if(ultimo) poner(col.ultimoUsuario, ctx.nomina(ultimo));
    poner(col.deuda, '');
    return f;
}

const FICTICIA = /^(T9|L9)\d{7}$/;

function verificarSinDatosReales(filasOriginales, filasAnon, col) {

    const ids = new Set();
    const nombres = new Set();

    for(const f of filasOriginales) {
        for(const v of [val(f, col.matricula), val(f, col.nomina), val(f, col.ultimoUsuario)]) {
            const t = v.trim().toUpperCase();
            if(t && !FICTICIA.test(t)) ids.add(t);
        }

        for(const v of [val(f, col.nombreAlumno), val(f, col.nombreProfesor)]) 
            { const t = normalizar(v); if(t) nombres.add(t); }
    }

    const problemas = [];
    filasAnon.forEach((f, r) => {
        f.forEach((c, i) => {
            const t = texto(c);
            if(!t.trim()) return;
            const n = normalizar(t);
            if(ids.has(t.trim().toUpperCase())) problemas.push(`fila ${r + 2}, columna ${i + 1}: aparece una matrícula o nómina real`);
            else if(nombres.has(n) || (n.length >= 12 && [...nombres].some((x) => x.length >= 12 && n.includes(x)))) {
                problemas.push(`fila ${r + 2}, columna ${i + 1}: aparece un nombre real`);

            }

        });

        if(col.deuda >= 0 && val(f, col.deuda).trim() !== '') problemas.push(`fila ${r + 2}: la deuda no está vacía`);
    });

    return { ok: problemas.length === 0, problemas };
}

//Lista de seguimiento.

function construirLista(alumnos, ctx, azar) {

    if(alumnos.length < 11) throw new Error('Se necesitan al menos 11 alumnos para armar la lista de muestra');

    const barajados = azar.barajar(alumnos);
    const existentes = barajados.slice(0, 10).map((a) => ({...a}));
    const resto = barajados.slice(10);
    const base = resto.find((a) => a.nombre.split(' ').length >= 4) || resto[0];
    const palabras = base.nombre.split(' ');
    const distinto = { matricula: base.matricula, nombre: palabras.slice(0, -1).join(' ') };
    const inexistentes = ['T98000001', 'T98000002'].map((m) => ({ matricula: m, nombre: ctx.nombreSuelto() }));
    const filas = azar.barajar([...existentes, distinto, ...inexistentes]).map((a, i) => [a.matricula, i % 3 === 0 ? a.nombre : a.nombre + ' ']);
    return [['Matrícula', 'Nombre'], ...filas];
}

//Proceso completo (sin leer, ni escribir archivos).
function procesar({encabezados, filas}, {alumnos = 30, semilla = 2026} = {}){

    const col = mapearColumnas(encabezados);

    if(col.faltan) throw new Error('Faltan encabezados obligatorios: ' + col.faltan.join(', '));

    const azar = crearAzar(semilla);
    const grupos = agruparPorAlumno(filas, col);
    const {elegidos, sinCandidato} = elegirAlumnos(grupos, alumnos, azar);
    const sel = new Set(elegidos);
    const filasSel = filas.filter((f) => sel.has(claveMatricula(f, col)));
    const nombresReales = new Set();
    for(const f of filas) for(const v of[val(f, col.nombreAlumno), val(f, col.nombreProfesor)]) {const t = normalizar(v); 
        if(t) nombresReales.add(t);}

    const ctx = crearAnonimizador(azar, nombresReales);
    const filasAnon = filasSel.map((f) => anonimizarFila(f, col, ctx));
    const vistos = new Map();
    for(const f of filasAnon) vistos.set(claveMatricula(f, col), 
    { matricula: val(f, col.matricula), nombre: val(f, col.nombreAlumno) });

    const lista = construirLista([...vistos.values()], ctx, azar);
    const estados = {};
    for(const m of elegidos) estados[grupos.get(m).estado] = (estados[grupos.get(m).estado] || 0) + 1;
    return {
        encabezados, filasAnon, lista, verificacion: verificarSinDatosReales(filas, filasAnon, col),
    resumen: { alumnos: elegidos.length, filas: filasSel.length, estados, sinCandidato },
    };
}

//Lectura y escritura del Excel.

const valorCelda = (v) => (v == null ? '' : typeof v === 'string' || typeof v === 'number' ? v : texto(v));

async function leerExcel(ruta) {
    
    const Exceljs = require('exceljs');
    const wb = new Exceljs.Workbook();
    await wb.xlsx.readFile(ruta);

    for(const ws of wb.worksheets) {
        const encabezados = [];
        ws.getRow(1).eachCell({includeEmpty: true}, (c, i) => {encabezados[i - 1] = texto(c.value); });
        for(let i = 0; i < encabezados.length; i++) if(encabezados[i] === undefined) encabezados[i] = '';
        const col = mapearColumnas(encabezados);
        if(col.faltan) continue;
        const filas = [];
        for(let r = 2; r <= ws.rowCount; r++){
            const fila = encabezados.map((_, i) => valorCelda(ws.getRow(r).getCell(i + 1).value));
            if(fila.every((v) => texto(v).trim() === '')) continue;
            filas.push(fila);

        }

        const estilos = encabezados.map((_, i ) => JSON.parse(JSON.stringify(ws.getRow(1).getCell(i + 1).style || {})));
        const anchos = encabezados.map((_, i ) => ws.getColumn(i + 1).width);
        return { hoja: ws.name, encabezados, filas, estilos, anchos };
    }
    throw new Error('Ninguna hoja tiene los encabezados obligatorios: ' + OBLIGATORIAS.join(', '));

}

function libroNuevo(ExcelJS){
    const wb = new ExcelJS.Workbook();
    wb.creator = 'equipo';
    wb.lastModifiedBy = 'equipo';
    wb.created = new Date();
    wb.modified = new Date();
    return wb;
}

async function escribirMonitoreo(ruta,{hoja, encabezados, filas, estilos, anchos}) {
    const ExcelJS = require('exceljs');
    const wb = libroNuevo(ExcelJS);
    const ws = wb.addWorksheet(hoja);
    ws.addRow(encabezados);
    ws.getRow(1).eachCell({ includeEmpty: true }, (c, i) => { if (estilos[i - 1]) c.style = estilos[i - 1]; });
    anchos.forEach((w, i) => { if (w) ws.getColumn(i + 1).width = w; });
    for (const f of filas) ws.addRow(f);
    await wb.xlsx.writeFile(ruta);
}

async function escribirLista(ruta, filas){
    const ExcelJS = require('exceljs');
    const wb = libroNuevo(ExcelJS);
    const ws = wb.addWorksheet('Todos');
    filas.forEach((f) => ws.addRow(f));
    ws.getColumn(1).width = 14;
    ws.getColumn(2).width = 40;
    for(let r = 1; r <= filas.length; r++) for (const c of [3, 4, 5]) ws.getCell(r, c).font = { name: 'Calibri', size: 11 };
    await wb.xlsx.writeFile(ruta);
}

//linea de comandos.

function leerArgumentos(argv) {
    const pos = [];
    const op = {alumnos: 30, semilla: 2026};
    for(let i = 0; i < argv.length; i++){
    if (argv[i] === '--alumnos') op.alumnos = parseInt(argv[++i], 10);
    else if (argv[i] === '--semilla') op.semilla = parseInt(argv[++i], 10);
    else pos.push(argv[i]);
    }

    return {pos, op};
}

async function principal(argv) {
    const {pos, op} = leerArgumentos(argv);
    if(pos.length !== 2 || !(op.alumnos > 0) || Number.isNaN(op.semilla)) {
        console.error('Uso: node scripts/anonimizar-excel.js <entrada.xlsx> <salida.xlsx> [--alumnos 30] [--semilla 2026]');
        return 1;
    }

    const [entrada, salida] = pos;
    if (path.resolve(entrada) === path.resolve(salida)) { console.error('La salida no puede ser el mismo archivo que la entrada.'); return 1; }
    if (!fs.existsSync(entrada)) { console.error('No existe el archivo: ' + entrada); return 1; }

    const datos = await leerExcel(entrada);
    const col = mapearColumnas(datos.encabezados);
    const r = procesar(datos, op);
    if (col.motivoCf >= 0 && datos.filas.some((f) => val(f, col.motivoCf).trim())) {
        console.warn('AVISO: "Motivo cf" trae texto libre en el archivo real. Revísalo a mano: puede contener datos personales.');
    }
    if (!r.verificacion.ok) {
        console.error('\nERROR: quedaron datos reales en el resultado. NO lo subas a GitHub:');
        r.verificacion.problemas.slice(0, 20).forEach((p) => console.error('  - ' + p));
        return 1;
    }

    fs.mkdirSync(path.dirname(path.resolve(salida)), { recursive: true });
    await escribirMonitoreo(salida, { hoja: datos.hoja, encabezados: datos.encabezados, filas: r.filasAnon, estilos: datos.estilos, anchos: datos.anchos });
    const rutaLista = path.join(path.dirname(path.resolve(salida)), 'lista-muestra.xlsx');
    await escribirLista(rutaLista, r.lista);

    console.log(`Alumnos: ${r.resumen.alumnos} · Filas: ${r.resumen.filas} · Estados: ${JSON.stringify(r.resumen.estados)}`);
    if (r.resumen.sinCandidato.length) console.warn('AVISO: el archivo real no tiene: ' + r.resumen.sinCandidato.join(', '));
    console.log('Generado: ' + salida + '\nGenerado: ' + rutaLista);
    console.log('Revisión: no quedó ninguna matrícula, nómina, nombre ni deuda del archivo real.');
    return 0;
}

 
module.exports = {
  normalizar, texto, crearAzar, mapearColumnas, clasificarAlumno, agruparPorAlumno, elegirAlumnos,
  crearAnonimizador, anonimizarFila, verificarSinDatosReales, construirLista, procesar,
};
 
if (require.main === module) {
  principal(process.argv.slice(2)).then((c) => { process.exitCode = c; }, (e) => { console.error('ERROR: ' + e.message); process.exitCode = 1; });
}
