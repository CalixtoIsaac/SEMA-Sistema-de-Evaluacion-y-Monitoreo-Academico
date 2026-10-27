#!/usr/bin/env node
/**
 * Crea en GitHub todo lo que describe context/Sprints.md:
 * labels, milestones, el Project (Kanban) con sus campos e iteraciones,
 * y los issues con su sprint, estimación, prioridad, épica y estado.
 *
 * Lee context/Sprints.md, así que si cambias el documento y vuelves a
 * ejecutarlo, crea solo lo que falta (no duplica issues por título).
 *
 * Uso (desde la raíz del repositorio):
 *   node scripts/github/crear-tablero.mjs --dry-run   # solo muestra lo que haría
 *   node scripts/github/crear-tablero.mjs             # lo hace
 *   node scripts/github/crear-tablero.mjs --actualizar-campos  # vuelve a llenar Sprint/Estimación/Prioridad/Épica
 *
 * Requisitos: Node 20+, GitHub CLI (gh) con sesión iniciada y permiso de proyectos:
 *   gh auth login
 *   gh auth refresh -s project
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Configuración: revisa estos valores antes de ejecutar
// ---------------------------------------------------------------------------
const CONFIG = {
  repo: process.env.SEMA_REPO || 'CalixtoIsaac/SEMA-Sistema-de-Evaluacion-y-Monitoreo-Academico',
  owner: process.env.SEMA_OWNER || 'CalixtoIsaac',
  proyecto: process.env.SEMA_PROYECTO || 'SEMA · Tablero Scrum',
  inicioSprints: '2026-10-26', // lunes de inicio del Sprint 1
  duracionSprint: 7, // días
  // Usuario de GitHub de cada integrante (tal como aparece en "Asignado:" de Sprints.md).
  // Déjalo vacío ('') si aún no aceptó la invitación al repositorio: el issue se crea sin asignar.
  usuarios: {
    'Calixto': 'CalixtoIsaac',
    'Matías': '',
    'Sebastián': '',
    'Uziel': '',
    'Saraí': ''
  },
  // Columna del tablero para los issues del Sprint 1 (los demás quedan en la primera columna: Backlog)
  estadoSprintActual: 'Por hacer',
  sprintActual: 1
};

const DRY_RUN = process.argv.includes('--dry-run');
// Con --actualizar-campos, a los issues que ya existían se les vuelven a poner Sprint, Estimación,
// Prioridad y Épica (nunca se toca su columna/Status, para no mover tarjetas ya trabajadas).
const ACTUALIZAR_CAMPOS = process.argv.includes('--actualizar-campos');
const AQUI = dirname(fileURLToPath(import.meta.url));
const SPRINTS_MD = join(AQUI, '..', '..', 'context', 'Sprints.md');

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const tmp = mkdtempSync(join(tmpdir(), 'sema-tablero-'));
process.on('exit', () => rmSync(tmp, { recursive: true, force: true }));

function log(...a) { console.log(...a); }
function aviso(msg) { console.warn(`⚠  ${msg}`); }
function dormir(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }

/** Ejecuta gh y devuelve stdout (texto). Lanza error con el stderr de gh. */
function gh(args, { permitirError = false } = {}) {
  if (DRY_RUN) return '';
  try {
    return execFileSync('gh', args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    if (permitirError) return null;
    const detalle = (err.stderr || err.message || '').toString().trim();
    throw new Error(`gh ${args.slice(0, 3).join(' ')} … falló:\n${detalle}`);
  }
}
function ghJson(args, opciones) {
  const out = gh(args, opciones);
  return out ? JSON.parse(out) : null;
}
/** Llama a la API GraphQL enviando { query, variables } como cuerpo JSON. */
function graphql(query, variables = {}, { permitirError = false } = {}) {
  if (DRY_RUN) return null;
  const archivo = join(tmp, `gql-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(archivo, JSON.stringify({ query, variables }), 'utf8');
  const res = ghJson(['api', 'graphql', '--input', archivo], { permitirError });
  if (res && res.errors) {
    if (permitirError) return null;
    throw new Error('GraphQL: ' + res.errors.map((e) => e.message).join(' | '));
  }
  return res ? res.data : null;
}
const sinMarcas = (t) => t.replace(/\*\*/g, '').replace(/`/g, '').trim();
const sumarDias = (iso, dias) => {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

// ---------------------------------------------------------------------------
// 1. Leer context/Sprints.md
// ---------------------------------------------------------------------------
function seccion(md, numero) {
  const inicio = md.search(new RegExp(`^## ${numero}\\. `, 'm'));
  if (inicio < 0) throw new Error(`No encontré la sección "## ${numero}." en Sprints.md`);
  const resto = md.slice(inicio + 3);
  const fin = resto.search(/^## \d+\. /m);
  return fin < 0 ? resto : resto.slice(0, fin);
}
function filasTabla(texto) {
  return texto.split('\n')
    .filter((l) => /^\|/.test(l) && !/^\|\s*-/.test(l))
    .slice(1) // encabezado
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
}

function leerSprintsMd() {
  const md = readFileSync(SPRINTS_MD, 'utf8').replace(/\r\n/g, '\n');

  // §1 Columnas del tablero
  const columnas = filasTabla(seccion(md, 1)).map(([col, significado]) => ({
    nombre: sinMarcas(col).replace(/^\S+\s+/, ''), // quita el emoji: "📋 Backlog" → "Backlog"
    descripcion: sinMarcas(significado)
  })).filter((c) => c.nombre);

  // §2 Campos personalizados
  const campos = {};
  for (const [nombre, tipo, valores] of filasTabla(seccion(md, 2))) {
    campos[sinMarcas(nombre)] = { tipo: sinMarcas(tipo), valores: valores.split('·').map((v) => sinMarcas(v)) };
  }

  // §3 Labels
  const labels = filasTabla(seccion(md, 3)).map(([nombre, color, descripcion]) => ({
    nombre: sinMarcas(nombre), color: sinMarcas(color), descripcion: sinMarcas(descripcion)
  }));

  // §4 Sprints
  const sprints = filasTabla(seccion(md, 4))
    .filter((f) => /Sprint \d/.test(f[0]))
    .map((f, i) => ({
      titulo: sinMarcas(f[0]),
      objetivo: sinMarcas(f[2]),
      milestone: sinMarcas(f[3]),
      inicio: sumarDias(CONFIG.inicioSprints, i * CONFIG.duracionSprint)
    }));

  // §5 Milestones
  const milestones = filasTabla(seccion(md, 5)).map(([titulo, fecha, descripcion]) => {
    const [d, m, a] = sinMarcas(fecha).split('/');
    return { titulo: sinMarcas(titulo), fecha: `${a}-${m}-${d}`, descripcion: sinMarcas(descripcion) };
  });

  // §6 Issues
  const textoIssues = seccion(md, 6);
  const encabezadosSprint = [...textoIssues.matchAll(/^### .*?Sprint (\d+) · (.+)$/gm)]
    .map((m) => ({ pos: m.index, sprint: Number(m[1]), milestone: m[2].trim() }));
  const reIssue = /^#### (\d+) · `(.+?)`\n\*\*Labels:\*\* (.+?) · \*\*Asignado:\*\* (.+?) · \*\*Estimación:\*\* (\d+) · \*\*Épica:\*\* (E\d+)\n```markdown\n([\s\S]*?)\n```/gm;
  const issues = [];
  for (const m of textoIssues.matchAll(reIssue)) {
    const enc = encabezadosSprint.filter((e) => e.pos < m.index).pop();
    if (!enc) throw new Error(`El issue ${m[1]} no está debajo de ningún "### … Sprint N"`);
    issues.push({
      n: Number(m[1]),
      titulo: m[2].trim(),
      labels: [...m[3].matchAll(/`([^`]+)`/g)].map((x) => x[1]),
      asignados: m[4].split(',').map((x) => x.trim()),
      estimacion: Number(m[5]),
      epica: m[6],
      cuerpo: m[7],
      sprint: enc.sprint,
      milestone: enc.milestone
    });
  }
  const declarados = (textoIssues.match(/^#### \d+ · /gm) || []).length;
  if (declarados !== issues.length) {
    throw new Error(`Sprints.md tiene ${declarados} issues, pero solo ${issues.length} tienen el formato esperado. Revisa la línea de Labels/Asignado/Estimación/Épica.`);
  }
  issues.sort((a, b) => a.n - b.n);
  return { columnas, campos, labels, sprints, milestones, issues };
}

// ---------------------------------------------------------------------------
// 2. Pasos
// ---------------------------------------------------------------------------
function verificarGh() {
  if (DRY_RUN) return;
  // gh escribe el estado de la sesión en stdout o stderr según la versión: se leen ambos
  const r = spawnSync('gh', ['auth', 'status'], { encoding: 'utf8' });
  if (r.error) throw new Error('No encontré GitHub CLI (gh). Instálalo desde https://cli.github.com/ y vuelve a abrir la terminal.');
  if (r.status !== 0) throw new Error('GitHub CLI no tiene sesión. Ejecuta: gh auth login');
  if (!/project/.test(`${r.stdout}${r.stderr}`)) {
    aviso('Tu sesión de gh podría no tener permiso de proyectos. Si algo falla con el Project, ejecuta: gh auth refresh -s project');
  }
}

function crearLabels(labels) {
  log(`\n▶ Labels (${labels.length})`);
  for (const l of labels) {
    log(`  · ${l.nombre}`);
    gh(['label', 'create', l.nombre, '--color', l.color, '--description', l.descripcion, '--force', '-R', CONFIG.repo]);
  }
}

function crearMilestones(milestones) {
  log(`\n▶ Milestones (${milestones.length})`);
  const existentes = DRY_RUN ? [] : ghJson(['api', `repos/${CONFIG.repo}/milestones?state=all&per_page=100`]);
  for (const m of milestones) {
    if (existentes.some((e) => e.title === m.titulo)) { log(`  = ${m.titulo} (ya existe)`); continue; }
    // Fecha límite: fin del día en hora del centro de México (UTC-6) → 05:59:59Z del día siguiente
    const dueOn = `${sumarDias(m.fecha, 1)}T05:59:59Z`;
    log(`  + ${m.titulo} · vence ${m.fecha}`);
    gh(['api', '-X', 'POST', `repos/${CONFIG.repo}/milestones`,
      '-f', `title=${m.titulo}`, '-f', `due_on=${dueOn}`, '-f', `description=${m.descripcion}`]);
  }
}

function obtenerProyecto() {
  log(`\n▶ Project "${CONFIG.proyecto}"`);
  if (DRY_RUN) return { id: 'PVT_dry', number: 0 };
  const lista = ghJson(['project', 'list', '--owner', CONFIG.owner, '--format', 'json', '--limit', '100']);
  let p = (lista.projects || []).find((x) => x.title === CONFIG.proyecto);
  if (p) {
    log(`  = ya existe (#${p.number})`);
  } else {
    p = ghJson(['project', 'create', '--owner', CONFIG.owner, '--title', CONFIG.proyecto, '--format', 'json']);
    log(`  + creado (#${p.number})`);
  }
  gh(['project', 'link', String(p.number), '--owner', CONFIG.owner, '--repo', CONFIG.repo], { permitirError: true });
  return { id: p.id, number: p.number };
}

const Q_CAMPOS = `query($id: ID!) { node(id: $id) { ... on ProjectV2 { fields(first: 50) { nodes {
  ... on ProjectV2FieldCommon { id name dataType }
  ... on ProjectV2SingleSelectField { options { id name } }
  ... on ProjectV2IterationField { configuration { iterations { id title startDate } completedIterations { id title startDate } } }
} } } } }`;

function leerCampos(proyecto) {
  if (DRY_RUN) return [];
  return graphql(Q_CAMPOS, { id: proyecto.id }).node.fields.nodes.filter((f) => f && f.id);
}

const COLORES = ['GRAY', 'BLUE', 'YELLOW', 'ORANGE', 'GREEN', 'PURPLE', 'RED', 'PINK'];
const COLOR_PRIORIDAD = { alta: 'RED', media: 'YELLOW', baja: 'GREEN' };

function configurarCampos(proyecto, datos) {
  log('\n▶ Campos del Project');
  let campos = leerCampos(proyecto);
  const buscar = (nombre) => campos.find((f) => f.name === nombre);

  // Status → columnas del Kanban
  const status = buscar('Status');
  const nombresColumnas = datos.columnas.map((c) => c.nombre);
  const actuales = status ? (status.options || []).map((o) => o.name) : [];
  if (status && actuales.join('|') !== nombresColumnas.join('|')) {
    log(`  ~ Status: ${nombresColumnas.join(' → ')}`);
    const ok = graphql(`mutation($input: UpdateProjectV2FieldInput!) { updateProjectV2Field(input: $input) { clientMutationId } }`, {
      input: {
        fieldId: status.id,
        singleSelectOptions: datos.columnas.map((c, i) => ({ name: c.nombre, description: c.descripcion, color: COLORES[i % COLORES.length] }))
      }
    }, { permitirError: true });
    if (ok === null && !DRY_RUN) aviso('No pude cambiar las columnas de Status por API. Hazlo a mano (ver §8.3 de Sprints.md).');
  } else {
    log(`  = Status (${DRY_RUN ? nombresColumnas.join(' → ') : 'ya tiene las columnas'})`);
  }

  const crear = (input) => graphql(`mutation($input: CreateProjectV2FieldInput!) { createProjectV2Field(input: $input) { projectV2Field { ... on ProjectV2FieldCommon { id } } } }`,
    { input: { projectId: proyecto.id, ...input } }, { permitirError: true });

  // Sprint (iteraciones)
  if (!buscar('Sprint')) {
    log(`  + Sprint: ${datos.sprints.length} iteraciones de ${CONFIG.duracionSprint} días desde ${CONFIG.inicioSprints}`);
    const ok = crear({
      name: 'Sprint', dataType: 'ITERATION',
      iterationConfiguration: {
        startDate: CONFIG.inicioSprints, duration: CONFIG.duracionSprint,
        iterations: datos.sprints.map((s) => ({ title: s.titulo, startDate: s.inicio, duration: CONFIG.duracionSprint }))
      }
    });
    if (ok === null && !DRY_RUN) aviso('No pude crear el campo Sprint por API. Créalo a mano (ver §8.3) y vuelve a ejecutar el script para asignar los sprints.');
  } else log('  = Sprint (ya existe)');

  if (!buscar('Estimación')) { log('  + Estimación (número)'); crear({ name: 'Estimación', dataType: 'NUMBER' }); }
  else log('  = Estimación (ya existe)');

  for (const nombre of ['Prioridad', 'Épica']) {
    if (buscar(nombre)) { log(`  = ${nombre} (ya existe)`); continue; }
    const valores = datos.campos[nombre].valores;
    log(`  + ${nombre}: ${valores.join(' · ')}`);
    crear({
      name: nombre, dataType: 'SINGLE_SELECT',
      singleSelectOptions: valores.map((v, i) => ({
        name: v, description: '',
        color: nombre === 'Prioridad' ? (COLOR_PRIORIDAD[Object.keys(COLOR_PRIORIDAD).find((k) => v.toLowerCase().includes(k))] || 'GRAY') : COLORES[i % COLORES.length]
      }))
    });
  }
  campos = leerCampos(proyecto);
  return campos;
}

function opcion(campo, predicado) {
  if (!campo || !campo.options) return null;
  return campo.options.find((o) => predicado(o.name)) || null;
}
function iteracion(campo, titulo) {
  if (!campo || !campo.configuration) return null;
  return [...campo.configuration.iterations, ...campo.configuration.completedIterations].find((i) => i.title === titulo) || null;
}

function crearIssues(datos, proyecto, campos) {
  log(`\n▶ Issues (${datos.issues.length})`);
  const existentes = DRY_RUN ? [] : ghJson(['issue', 'list', '-R', CONFIG.repo, '--state', 'all', '--limit', '1000', '--json', 'number,title,url']);
  const porTitulo = new Map(existentes.map((e) => [e.title, e]));
  const mapa = new Map(); // número en Sprints.md → número real en GitHub
  const creados = [];

  const campo = (n) => campos.find((f) => f.name === n);
  const fStatus = campo('Status'), fSprint = campo('Sprint'), fEst = campo('Estimación'), fPrio = campo('Prioridad'), fEpica = campo('Épica');

  for (const it of datos.issues) {
    let real = porTitulo.get(it.titulo);
    const yaExistia = Boolean(real);
    const asignados = it.asignados.flatMap((a) => (a === 'Todos' ? Object.values(CONFIG.usuarios) : [CONFIG.usuarios[a]])).filter(Boolean);
    const sinUsuario = it.asignados.filter((a) => a !== 'Todos' && !CONFIG.usuarios[a]);

    if (real) {
      log(`  = #${real.number} ${it.titulo} (ya existe)`);
    } else {
      const archivo = join(tmp, `issue-${it.n}.md`);
      writeFileSync(archivo, it.cuerpo, 'utf8');
      const args = ['issue', 'create', '-R', CONFIG.repo, '--title', it.titulo, '--body-file', archivo, '--milestone', it.milestone];
      for (const l of it.labels) args.push('--label', l);
      for (const u of asignados) args.push('--assignee', u);
      log(`  + [${it.n}] ${it.titulo}  · Sprint ${it.sprint} · ${it.estimacion} pts${asignados.length ? ' · @' + asignados.join(', @') : ''}${sinUsuario.length ? ` (sin usuario: ${sinUsuario.join(', ')})` : ''}`);
      if (!DRY_RUN) {
        const url = gh(args);
        real = { number: Number(url.split('/').pop()), url, title: it.titulo };
        creados.push({ it, real });
        dormir(Number(process.env.SEMA_PAUSA ?? 1200)); // evita el límite de creación de contenido de GitHub
      }
    }
    if (DRY_RUN) { mapa.set(it.n, it.n); continue; }
    mapa.set(it.n, real.number);
    if (yaExistia && !ACTUALIZAR_CAMPOS) continue;

    // Agregar al Project y llenar campos
    const item = ghJson(['project', 'item-add', String(proyecto.number), '--owner', CONFIG.owner, '--url', real.url, '--format', 'json']);
    const valores = [];
    const prioridad = it.labels.find((l) => l.startsWith('prioridad:'));
    const nombreEstado = it.sprint === CONFIG.sprintActual ? CONFIG.estadoSprintActual : datos.columnas[0].nombre;
    const oStatus = opcion(fStatus, (n) => n === nombreEstado);
    const oPrio = prioridad && opcion(fPrio, (n) => n.toLowerCase().includes(prioridad.split(':')[1].trim()));
    const oEpica = opcion(fEpica, (n) => n.startsWith(it.epica + ' '));
    const iSprint = iteracion(fSprint, `Sprint ${it.sprint}`);
    if (oStatus && !yaExistia) valores.push({ fieldId: fStatus.id, value: { singleSelectOptionId: oStatus.id } });
    if (iSprint) valores.push({ fieldId: fSprint.id, value: { iterationId: iSprint.id } });
    if (fEst) valores.push({ fieldId: fEst.id, value: { number: it.estimacion } });
    if (oPrio) valores.push({ fieldId: fPrio.id, value: { singleSelectOptionId: oPrio.id } });
    if (oEpica) valores.push({ fieldId: fEpica.id, value: { singleSelectOptionId: oEpica.id } });
    if (valores.length) {
      const mutaciones = valores.map((v, i) => `c${i}: updateProjectV2ItemFieldValue(input: { projectId: $p, itemId: $item, fieldId: "${v.fieldId}", value: $v${i} }) { clientMutationId }`).join('\n');
      const decl = valores.map((_, i) => `$v${i}: ProjectV2FieldValue!`).join(', ');
      const vars = { p: proyecto.id, item: item.id };
      valores.forEach((v, i) => { vars[`v${i}`] = v.value; });
      graphql(`mutation($p: ID!, $item: ID!, ${decl}) { ${mutaciones} }`, vars);
    }
  }

  // Si GitHub asignó números distintos a los del documento, corrige las referencias "#n" en los cuerpos
  const distintos = [...mapa].filter(([doc, real]) => doc !== real);
  if (!DRY_RUN && distintos.length && creados.length) {
    log(`\n▶ Ajustando referencias: los números reales no coinciden con Sprints.md (ej. #${distintos[0][0]} → #${distintos[0][1]})`);
    for (const { it, real } of creados) {
      if (!/#\d+/.test(it.cuerpo)) continue;
      const nuevo = it.cuerpo.replace(/#(\d+)\b/g, (m, n) => (mapa.has(Number(n)) ? `#${mapa.get(Number(n))}` : m));
      if (nuevo === it.cuerpo) continue;
      const archivo = join(tmp, `issue-${it.n}-v2.md`);
      writeFileSync(archivo, nuevo, 'utf8');
      gh(['issue', 'edit', String(real.number), '-R', CONFIG.repo, '--body-file', archivo]);
      log(`  ~ #${real.number}`);
    }
  }
  return mapa;
}

// ---------------------------------------------------------------------------
// 3. Ejecutar
// ---------------------------------------------------------------------------
try {
  const datos = leerSprintsMd();
  log(`SEMA · crear tablero ${DRY_RUN ? '(simulación, no se cambia nada)' : ''}`);
  log(`Repositorio: ${CONFIG.repo} · Project: ${CONFIG.proyecto}`);
  log(`Leído de Sprints.md: ${datos.labels.length} labels, ${datos.milestones.length} milestones, ${datos.sprints.length} sprints, ${datos.issues.length} issues, ${datos.columnas.length} columnas`);

  for (const it of datos.issues) {
    if (!datos.milestones.some((m) => m.titulo === it.milestone)) throw new Error(`El issue ${it.n} usa el milestone "${it.milestone}", que no está en la tabla de §5`);
    for (const l of it.labels) if (!datos.labels.some((x) => x.nombre === l)) throw new Error(`El issue ${it.n} usa el label "${l}", que no está en la tabla de §3`);
    for (const a of it.asignados) if (a !== 'Todos' && !(a in CONFIG.usuarios)) throw new Error(`El issue ${it.n} está asignado a "${a}", que no está en CONFIG.usuarios`);
  }

  verificarGh();
  crearLabels(datos.labels);
  crearMilestones(datos.milestones);
  const proyecto = obtenerProyecto();
  const campos = configurarCampos(proyecto, datos);
  crearIssues(datos, proyecto, campos);

  log('\n✔ Listo.');
  log('Falta hacer a mano en GitHub (la API no lo permite): automatizaciones (Workflows) y vistas del Project. Ver §8.3 de Sprints.md.');
} catch (err) {
  console.error(`\n✖ ${err.message}`);
  process.exit(1);
}
