# SEMA · Sprints, Milestones, Labels e Issues (GitHub Project · Kanban)

Guía para cargar el tablero del repositorio `CalixtoIsaac/SEMA-Sistema-de-Evaluacion-y-Monitoreo-Academico`, **a mano** o **con un solo comando** (§8: `node scripts/github/crear-tablero.mjs`, que lee este documento).
Orden recomendado a mano: **1) Labels → 2) Milestones → 3) Project (columnas y campos) → 4) Issues**.

> Si editas este documento, conserva el formato de cada issue para que el script lo pueda leer: el título en una línea `#### N · ` seguido del título entre comillas invertidas, después la línea `**Labels:** … · **Asignado:** … · **Estimación:** N · **Épica:** EN` y luego el bloque de código `markdown` con el cuerpo.

- Sprints de **1 semana** (miércoles → martes), del **21 oct** al **1 dic 2026**. Si la fecha de entrega es otra, recorre las fechas; el contenido de cada sprint no cambia.
- Referencias: `HU-xx` = historia de `02_Product_Backlog.md`; `T-xx` = tarea técnica; `D-xx` = decisión de `00_Indice_y_Decisiones.md`; `M-xx` = mejora de diseño de `05_UI_UX.md` §11.

---

## 1. Columnas del tablero (campo **Status**)

| Columna | Significa | Quién mueve la tarjeta |
|---|---|---|
| 📋 **Backlog** | Todo lo que existe, aún sin sprint | Scrum Master |
| 🎯 **Por hacer** | Está en el sprint actual y nadie la ha empezado | Scrum Master (en la Planning) |
| 🚧 **En progreso** | Alguien trabaja en ella (máx. **2 por persona**) | El responsable |
| 👀 **En revisión** | Hay un Pull Request abierto hacia `develop` | El responsable al abrir el PR |
| ✅ **Validación PO** | El Scrum Master hizo *merge*; la PO revisa que cumpla los criterios | Automático al hacer *merge* |
| 🏁 **Hecho** | La PO lo validó y cerró el issue | Automático al cerrar el issue |

**Automatizaciones** (Project → ⋯ → *Workflows*):

1. *Auto-add to project*: issues y PR del repositorio → **Backlog**.
2. *Pull request merged* → **✅ Validación PO**.
3. *Item closed* → **🏁 Hecho**.
4. *Item reopened* → **🚧 En progreso**.

> Como los PR van a `develop` (y la rama por defecto es `main`), el `Closes #n` **no** cierra el issue al hacer *merge*: la PO lo cierra tras validarlo. Así se respeta la columna de validación.

## 2. Campos personalizados del Project

| Campo | Tipo | Valores |
|---|---|---|
| **Sprint** | Iteration | duración 1 semana, inicio 21/10/2026 (ver §4) |
| **Estimación** | Number | puntos: 1, 2, 3, 5, 8 |
| **Prioridad** | Single select | 🔴 Alta · 🟡 Media · 🟢 Baja |
| **Épica** | Single select | E1 Base · E2 Cuenta · E3 Carga de datos · E4 Listas · E5 Alumnos · E6 Resumen · E7 Configuración |

Vistas sugeridas: **Tablero** (Board agrupado por Status, filtro `sprint:@current`), **Backlog** (Table agrupada por Sprint), **Por persona** (Board agrupado por Assignees), **Roadmap** (por Sprint).

---

## 3. Labels

Repositorio → *Issues* → *Labels* → *New label*. (Borra o conserva los de GitHub; `bug`, `documentation` y `enhancement` se reemplazan por los de abajo).

| Label | Color | Descripción |
|---|---|---|
| `tipo: historia` | `1D76DB` | Historia de usuario (valor para el cliente) |
| `tipo: tarea` | `5319E7` | Tarea técnica sin valor visible directo |
| `tipo: bug` | `D73A4A` | Algo no funciona como dice la documentación |
| `tipo: docs` | `0075CA` | Documentación (context/, manual, README) |
| `tipo: diseño` | `F9D0C4` | Prototipos, wireframes, estilos |
| `área: frontend` | `C2E0C6` | public/ (HTML, CSS, JS, gráficas) |
| `área: backend` | `BFD4F2` | routes/, services/, API |
| `área: base de datos` | `FEF2C0` | lib/db.js, schema, migraciones, consultas |
| `área: excel` | `0E8A16` | Lectura e importación de archivos Excel |
| `área: infraestructura` | `BFDADC` | Repositorio, arranque, .bat, dependencias |
| `prioridad: alta` | `B60205` | Must · bloquea otras tareas o la entrega |
| `prioridad: media` | `FBCA04` | Should |
| `prioridad: baja` | `C5DEF5` | Could |
| `requiere cliente` | `E99695` | Necesita respuesta o validación del cliente (P-xx) |
| `propuesta` | `D4C5F9` | Mejora que el Scrum Master debe aprobar antes de hacerse |
| `bloqueado` | `000000` | No se puede avanzar; explicar en un comentario |

---

## 4. Sprints (campo Iteration **Sprint**)

| Sprint | Fechas | Objetivo del sprint | Milestone | Puntos |
|---|---|---|---|---|
| **Sprint 0** | 21 oct – 27 oct | Repositorio limpio, BD v1, login con cuenta por defecto, acceso directo y prototipos validados | v0.1 · Base del proyecto | 29 |
| **Sprint 1** | 28 oct – 3 nov | Cargar el Excel de monitoreo con previsualización y notificación | v0.2 · Carga de Excel | 25 |
| **Sprint 2** | 4 nov – 10 nov | Ver la tabla de alumnos con semáforo, buscador, orden y detalle | v0.3 · Monitoreo de alumnos | 23 |
| **Sprint 3** | 11 nov – 17 nov | Listas de seguimiento, formulario manual, perfil y preferencias | v0.4 · Seguimiento y cuenta | 27 |
| **Sprint 4** | 18 nov – 24 nov | Resumen administrativo con gráficas y evolución | v0.5 · Resumen administrativo | 24 |
| **Sprint 5** | 25 nov – 1 dic | Configuración, reportes, pruebas con el cliente y entrega | v1.0 · Entrega final | 22 |

**Ceremonias (cada sprint)**

| Ceremonia | Cuándo | Duración | Responsable |
|---|---|---|---|
| Sprint Planning | miércoles (día 1) | 45 min | Scrum Master |
| Daily | lunes a viernes (puede ser por mensaje: ayer / hoy / bloqueos) | 10 min | Todos |
| Sprint Review con el cliente | martes (último día) | 30 min | Product Owner |
| Retrospectiva | martes, después de la Review | 20 min | Scrum Master |
| Release `develop → main` + etiqueta `v0.x` | martes | — | Scrum Master |

---

## 5. Milestones

Repositorio → *Issues* → *Milestones* → *New milestone*.

| Milestone | Fecha límite | Descripción (copiar) |
|---|---|---|
| **v0.1 · Base del proyecto** | 27/10/2026 | Repositorio limpio y renombrado a SEMA, esquema de BD v1, cuenta por defecto Chuchito, acceso directo SEMA.bat, sidebar y prototipos validados por el cliente. |
| **v0.2 · Carga de Excel** | 03/11/2026 | El usuario sube el Excel de monitoreo (arrastrar o buscar), ve la previsualización con el número de alumnos y confirma; aparece "Datos cargados correctamente". |
| **v0.3 · Monitoreo de alumnos** | 10/11/2026 | Tabla de alumnos con promedio, faltas y estado en colores; buscador; orden por promedio/faltas; detalle por materia. |
| **v0.4 · Seguimiento y cuenta** | 17/11/2026 | Excel de lista para filtrar a los alumnos de un semestre; formulario manual; cambio de usuario y contraseña; preferencias de tema y formato de nombres. |
| **v0.5 · Resumen administrativo** | 24/11/2026 | Menú principal con indicadores y gráficas, estado vacío, evolución del desempeño e historial de cargas. |
| **v1.0 · Entrega final** | 01/12/2026 | Umbrales configurables, exportar reporte, respaldo, pruebas de aceptación con el cliente, manual de usuario y entrega. |

---

## 6. Issues

Formato de cada issue: título (copiar tal cual) · metadatos para llenar en la barra lateral · cuerpo dentro del bloque (copiar en la descripción).
Responsables por especialidad: **Calixto** (Scrum Master; apoyo reducido y suplente), **Matías** (frontend), **Sebastián** (backend / Excel), **Uziel** (BD / estructura), **Saraí** (PO).

### 🟦 Sprint 0 · v0.1 · Base del proyecto

#### 1 · `[T-01] Limpiar el repositorio, renombrar la plantilla a SEMA y aplicar la paleta azul`
**Labels:** `tipo: tarea` `área: infraestructura` `área: frontend` `prioridad: alta` · **Asignado:** Matías · **Estimación:** 3 · **Épica:** E1
```markdown
Dejar el repositorio listo para empezar a construir SEMA sobre la plantilla Express + SQLite.

- [ ] Borrar la carpeta duplicada `plantilla-express-sqlite/` (la raíz ya tiene el mismo código)
- [ ] Quitar el módulo de ejemplo *Notas*: `routes/notas.js`, `public/js/notas.js`, tabla `notas`, enlace del menú y tarjetas de `inicio.js`
- [ ] Cambiar "Mi Proyecto" por "SEMA" en `login.html`, `app.html` y `app.js`
- [ ] Paleta institucional azul en `theme.css`, claro y oscuro (M-10, tabla en `context/05` §3.1); revisar contraste del semáforo
- [ ] `package.json`: `name: "sema"`, descripción del sistema, scripts `start`, `dev` (con `OPEN_BROWSER=false`) y `test` (`node --test test/`)
- [ ] Agregar `.gitattributes` y las reglas nuevas de `.gitignore` de `context/03_Arquitectura_Convenciones.md` §6 (corrige que `git status` marque todos los archivos como modificados)
- [ ] Reescribir `README.md` con la descripción de SEMA y cómo arrancarlo
- [ ] Crear la rama `develop` desde `main`

Referencia: `context/03_Arquitectura_Convenciones.md`
```

#### 2 · `[T-01] Proteger ramas, agregar CODEOWNERS y plantilla de Pull Request`
**Labels:** `tipo: tarea` `área: infraestructura` `prioridad: alta` · **Asignado:** Calixto · **Estimación:** 1 · **Épica:** E1
```markdown
El Scrum Master es el único que acepta cambios en GitHub.

- [ ] `.github/CODEOWNERS` con `* @CalixtoIsaac`
- [ ] `.github/pull_request_template.md` (texto en `context/03` §5)
- [ ] Settings → Branches: proteger `main` y `develop` (requerir PR, 1 aprobación de Code Owners, sin push directo, sin borrar)
- [ ] Permitir solo *Squash and merge*
- [ ] Invitar a Saraí, Sebastián, Uziel y Matías como colaboradores con permiso *Write*
- [ ] Explicar al equipo el flujo de ramas `feature/<n°issue>-<descripcion>` y Conventional Commits
```

#### 3 · `[T-02] Crear el esquema de base de datos v1 y las migraciones`
**Labels:** `tipo: tarea` `área: base de datos` `prioridad: alta` · **Asignado:** Uziel · **Estimación:** 5 · **Épica:** E1
```markdown
Implementar el modelo de `context/04_Modelo_Datos.md`.

- [ ] `lib/schema.sql` con todas las tablas, CHECKs e índices del documento
- [ ] `lib/db.js` aplica el esquema según `PRAGMA user_version` (versión 1)
- [ ] Valores por defecto de `configuracion` (umbrales) insertados si no existen
- [ ] Al arrancar: borrar importaciones en estado `previa` con más de 24 h
- [ ] Probado: borrar `data/app.db`, arrancar y revisar las tablas con DB Browser for SQLite
- [ ] Actualizar el diagrama de `context/04` si algo cambió
```

#### 4 · `[T-03] Cuenta por defecto "Chuchito" y secreto JWT persistente`
**Labels:** `tipo: tarea` `área: backend` `prioridad: alta` · **Asignado:** Sebastián · **Estimación:** 3 · **Épica:** E2
```markdown
- [ ] Si la tabla `usuarios` está vacía al arrancar, crear: nombre "Administrador", usuario `Chuchito`, contraseña `Administrador*Chuchito*123` (bcrypt), `password_por_defecto = 1`
- [ ] Eliminar `GET /api/auth/status` y `POST /api/auth/setup`
- [ ] `GET /api/auth/me` devuelve `passwordPorDefecto`, `tema` y `formatoNombre` (no hay correo, D-17)
- [ ] Si no hay `JWT_SECRET` en `.env`, generar uno y guardarlo en `data/jwt.secret` (y reutilizarlo)
- [ ] El servidor escucha solo en `127.0.0.1`
- [ ] `scripts/reset-password.js` + `npm run reset-password`: vuelve la cuenta a las credenciales por defecto
- [ ] `GET /api/health` responde `{ status, app: "SEMA", version }`

Referencia: `context/06_Especificacion_API.md` §1–2
```

#### 5 · `[HU-02] Iniciar sesión con usuario y contraseña`
**Labels:** `tipo: historia` `área: frontend` `prioridad: alta` · **Asignado:** Matías · **Estimación:** 2 · **Épica:** E2
```markdown
**Como** líder de generación **quiero** entrar con usuario y contraseña **para** que una persona ajena no vea información confidencial.

- [ ] `login.html` solo muestra el formulario de inicio de sesión (sin "Crea tu cuenta")
- [ ] Con datos correctos redirige al Resumen administrativo (`/app#resumen`)
- [ ] Con datos incorrectos: "Usuario o contraseña incorrectos."
- [ ] Botón "Entrando…" mientras responde; Enter envía
- [ ] Sin sesión, `/app` regresa al login

Depende de: #4
```

#### 6 · `[HU-01] Acceso directo SEMA.bat que arranca el servidor y abre el navegador`
**Labels:** `tipo: historia` `área: infraestructura` `prioridad: alta` · **Asignado:** Uziel · **Estimación:** 5 · **Épica:** E1
```markdown
**Como** líder de generación **quiero** abrir SEMA con doble clic **para** no usar la terminal.

- [ ] `SEMA.bat` en la raíz (finales de línea CRLF) según `context/03` §3
- [ ] Instala dependencias si no existe `node_modules`; crea `.env` si no existe
- [ ] Al quedar listo el servidor, abre `http://localhost:3000` en el navegador predeterminado
- [ ] Si el puerto está ocupado por SEMA (responde `/api/health`), solo abre el navegador
- [ ] Si no hay Node.js: mensaje "Instala Node.js 20 o superior" y espera una tecla
- [ ] Ícono `public/img/sema.ico` + instrucciones para crear el acceso directo en el escritorio
- [ ] Probado en Windows 10/11 desde una carpeta con espacios y acentos en la ruta
```

#### 7 · `[T-10] Sidebar con Menú principal, Cargar datos, Alumnos y Perfil`
**Labels:** `tipo: tarea` `área: frontend` `prioridad: alta` · **Asignado:** Matías · **Estimación:** 2 · **Épica:** E1
```markdown
- [ ] Enlaces del sidebar: Menú principal (`#resumen`), Cargar datos (`#cargar`), Alumnos (`#alumnos`), Perfil (`#perfil`) + Cerrar sesión
- [ ] Una vista vacía por sección registrada en `VIEWS` de `app.js` ("Próximamente")
- [ ] Ruta con parámetro para el detalle: `#alumnos/<matricula>`
- [ ] Íconos nuevos en `ui-kit.js`: upload, users, user, chart
- [ ] Título del navegador `<Vista> · SEMA`

Referencia: `context/05_UI_UX.md` §2–3
```

#### 8 · `[T-07] Servir Chart.js y la fuente Inter de forma local (sin internet)`
**Labels:** `tipo: tarea` `área: frontend` `área: infraestructura` `prioridad: media` · **Asignado:** Matías · **Estimación:** 1 · **Épica:** E1
```markdown
- [ ] `public/vendor/chart.umd.min.js` (Chart.js 4.x, anotar la versión en el README)
- [ ] `public/vendor/inter/` con los `.woff2` y `@font-face` en `base.css`
- [ ] Quitar los `<link>` a Google Fonts
- [ ] Probado con el internet desconectado
```

#### 9 · `[T-06] Excel de prueba anonimizado para desarrollo`
**Labels:** `tipo: tarea` `área: excel` `área: base de datos` `prioridad: alta` · **Asignado:** Uziel · **Estimación:** 3 · **Épica:** E1
```markdown
El Excel real tiene datos personales de alumnos: **no se sube a GitHub**. El equipo trabaja con uno falso.

- [ ] `scripts/anonimizar-excel.js <entrada> <salida>` según `context/08` §3
- [ ] `test/fixtures/monitoreo-muestra.xlsx` (~30 alumnos, mismas 94 columnas, incluye BT, SD, NE, SC, DA y los tres estados)
- [ ] `test/fixtures/lista-muestra.xlsx` con el **formato del Excel del cliente** (hoja `Todos`, columnas `Matrícula` y `Nombre`, espacios al final en algunos nombres): 10 matrículas existentes + 2 inexistentes + 1 con nombre distinto
- [ ] El Excel de matrículas real del cliente tampoco se sube
- [ ] Revisar que no quede ningún nombre, matrícula, nómina ni deuda real
```

#### 10 · `[T-08] Prototipos de las vistas y validación con el cliente`
**Labels:** `tipo: diseño` `requiere cliente` `prioridad: alta` · **Asignado:** Saraí · **Estimación:** 3 · **Épica:** E1
```markdown
- [ ] Prototipos de: Login, Menú principal (con y sin datos), Cargar datos (subida + previsualización), Alumnos, Detalle del alumno, Perfil — partiendo de `context/05_UI_UX.md`
- [ ] Presentar al cliente y anotar cambios
- [ ] Incluir las mejoras aprobadas M-01 a M-04 y M-06 a M-13 (`context/05` §11) e incluir M-05 (evolución)
- [ ] Subir capturas finales a `context/prototipos/`
```

#### 11 · `[T-09] Presentar al equipo las decisiones del cliente (D-08 a D-20)`
**Labels:** `tipo: docs` `prioridad: alta` · **Asignado:** Saraí · **Estimación:** 1 · **Épica:** E1
```markdown
Las respuestas del cliente ya están en `context/00_Indice_y_Decisiones.md` §4.2.

- [ ] Explicarlas en la Sprint Planning, sobre todo las que cambian reglas: evolución del desempeño (M-05), faltas por % del límite (D-10), estado = peor entre promedio y faltas (D-11), códigos SC y DA (D-12) y cuenta sin correo (D-17)
- [ ] Confirmar con el cliente que los ejemplos de `context/07` §4.2 (tabla por límite de faltas) son lo que espera
- [ ] Explicar al cliente cómo se verá la evolución (`context/05` §12) y recomendarle subir el Excel cada 1–2 semanas
```

### 🟩 Sprint 1 · v0.2 · Carga de Excel

#### 12 · `[T-04] Lector del Excel de monitoreo (services/excel-monitoreo.js)`
**Labels:** `tipo: tarea` `área: excel` `área: backend` `prioridad: alta` · **Asignado:** Sebastián · **Estimación:** 5 · **Épica:** E3
```markdown
Convertir el Excel de la escuela en filas normalizadas, sin tocar la base de datos.

- [ ] Instalar `exceljs` y leer desde un `Buffer`
- [ ] Encontrar la hoja y la fila de encabezados; normalizar encabezados (sin acentos/mayúsculas)
- [ ] Resolver la columna `Modalidad` duplicada por posición (`context/08` §1.2)
- [ ] Validar columnas obligatorias → error con la lista de faltantes
- [ ] `lib/texto.js`: `normalizar()`, `parsearCalificacion()` (vacío, número, NE/SD/SC/DA), fechas `DD-MM-YYYY`
- [ ] Advertencias: filas sin matrícula, matrícula con formato raro, repetidas, números fuera de 0–100, códigos desconocidos
- [ ] Recortar espacios de nombres de alumnos y profesores
- [ ] No leer la columna "Deuda del alumno"
- [ ] Pruebas en `test/excel-monitoreo.test.js` con el fixture
- [ ] Con el Excel real (local): 3,664 filas, 490 alumnos, en < 3 s
```

#### 13 · `[T-05] Reglas de indicadores y separación de nombres con pruebas`
**Labels:** `tipo: tarea` `área: backend` `prioridad: alta` · **Asignado:** Uziel · **Estimación:** 5 · **Épica:** E5
```markdown
Funciones puras de `context/07_Reglas_Negocio_Indicadores.md`:

- [ ] `estadoCalificacion(valor, umbrales)` (≥ 80 / 70–79.9 / < 70)
- [ ] `estadoFaltas(faltas, limite, umbrales)` por **% del límite de la materia** (< 50 % / 50–79 % / ≥ 80 %) y regla fija si no hay límite (§4.2)
- [ ] `calificacionMateria(inscripcion)` (ponderado / SD / promedio de actividades en manuales con NE, SC y DA = 0)
- [ ] `resumenAlumno(inscripciones, umbrales)` → promedioGeneral, faltasTotal, faltasPeorMateria, estadoPromedio, estadoFaltas, **estado = el peor de ambos**, motivo y alertas (§5)
- [ ] `ordenarAlumnos(lista, { promedio, faltas })`
- [ ] `lib/nombres.js → separarNombre()` con partículas y apellidos compuestos (§8)
- [ ] `test/indicadores.test.js` y `test/nombres.test.js` con los casos de `context/07` §11
```

#### 14 · `[HU-06] API de previsualización y confirmación de la importación`
**Labels:** `tipo: historia` `área: backend` `área: base de datos` `prioridad: alta` · **Asignado:** Sebastián · **Estimación:** 5 · **Épica:** E3
```markdown
- [ ] `multer` en memoria: solo `.xlsx`, máx. 15 MB (errores 413/415)
- [ ] `POST /api/importaciones/monitoreo` → guarda la previa y responde resumen, 20 filas de muestra y advertencias (422 si el formato no es válido)
- [ ] `GET /api/importaciones/:id/muestra` (todas las columnas, paginado)
- [ ] `POST /api/importaciones/:id/confirmar` con `modo: fusionar | reemplazar`, todo en una transacción (`context/04` §4)
- [ ] Al confirmar se guardan los `cortes_alumno` (promedio, faltas, estado, estado de faltas, materias en Crítico) usando `lib/indicadores.js`
- [ ] Apellidos y nombres con `separarNombre()`; no sobrescribir los corregidos a mano (`context/04` §4)
- [ ] `DELETE /api/importaciones/:id` descarta la previa
- [ ] Importar el Excel real completo en < 5 s

Depende de: #3, #12, #13 · Referencia: `context/06` §4
```

#### 15 · `[HU-05] Zona para arrastrar o seleccionar el Excel`
**Labels:** `tipo: historia` `área: frontend` `prioridad: alta` · **Asignado:** Matías · **Estimación:** 3 · **Épica:** E3
```markdown
**Como** líder de generación **quiero** arrastrar el Excel o buscarlo en mis documentos **para** cargar a todos los alumnos de una vez.

- [ ] Vista Cargar datos con pestañas "Subir Excel" (activa) y "Formulario"
- [ ] Componente dropzone (arrastrar, clic y teclado) — `context/05` §6
- [ ] Rechaza en el navegador archivos que no sean `.xlsx` o pesen más de 15 MB
- [ ] `UI.upload(ruta, formData)` en `ui-kit.js` (con token)
- [ ] Indicador "Leyendo archivo…" y mensajes claros para 413/415/422
```

#### 16 · `[HU-06] Previsualización del Excel antes de guardar`
**Labels:** `tipo: historia` `área: frontend` `prioridad: alta` · **Asignado:** Matías · **Estimación:** 5 · **Épica:** E3
```markdown
**Como** líder de generación **quiero** ver una vista previa **para** asegurarme de que subí el archivo correcto.

- [ ] Tarjetas: alumnos, materias, filas, periodo, avisos (desplegable)
- [ ] Tabla con 20 filas y botón "Ver todas las columnas" (scroll horizontal dentro de la tarjeta)
- [ ] Opciones Actualizar (fusionar) / Reemplazar; si se elige reemplazar y se eliminarían inscripciones, confirmar con `UI.confirm`
- [ ] Botones Cancelar (descarta) y Confirmar carga

Depende de: #14, #15
```

#### 17 · `[HU-07] Notificación "Datos cargados correctamente"`
**Labels:** `tipo: historia` `área: frontend` `prioridad: alta` · **Asignado:** Matías · **Estimación:** 1 · **Épica:** E3
```markdown
- [ ] Toast verde "Datos cargados correctamente · N alumnos" con botón "Ver alumnos"
- [ ] Toast rojo con el motivo si falla (no se guarda nada)
- [ ] La vista vuelve a la zona de carga lista para otro archivo
```

#### 18 · `[T-11] Validar la carga con el Excel real junto al cliente`
**Labels:** `tipo: tarea` `requiere cliente` `prioridad: media` · **Asignado:** Saraí · **Estimación:** 1 · **Épica:** E3
```markdown
- [ ] Demostrar en la Review la carga del Excel real (en la computadora local, sin subirlo)
- [ ] Confirmar con el cliente que el número de alumnos y la muestra son correctos
- [ ] Anotar diferencias o columnas que el cliente necesite y crear issues
```

### 🟨 Sprint 2 · v0.3 · Monitoreo de alumnos

#### 19 · `[HU-13] API de alumnos con promedio, faltas y estado`
**Labels:** `tipo: historia` `área: backend` `área: base de datos` `prioridad: alta` · **Asignado:** Sebastián · **Estimación:** 3 · **Épica:** E5
```markdown
- [ ] `services/alumnos.js` con una consulta que traiga inscripciones vigentes por alumno y use `resumenAlumno()`
- [ ] `GET /api/alumnos?lista=&periodo=` → `{ alumnos, totales, periodo }` con `nombreMostrar` según la preferencia, `faltasPeorMateria`, `motivoEstado` y `alertas` (`context/06` §6)
- [ ] Umbrales leídos de `configuracion`
- [ ] < 300 ms con 5,000 alumnos
```

#### 20 · `[HU-17] API del detalle del alumno`
**Labels:** `tipo: historia` `área: backend` `prioridad: alta` · **Asignado:** Sebastián · **Estimación:** 3 · **Épica:** E5
```markdown
- [ ] `GET /api/alumnos/:matricula` con datos generales, motivo del estado, alertas, listas, materias (actividades, calificación, faltas / límite y %, estados) y evolución con su tendencia (M-05)
- [ ] `PUT /api/alumnos/:matricula/nombre` para corregir apellidos / nombres (M-12)
- [ ] Materias ordenadas de peor a mejor; bajas al final
- [ ] 404 si no existe
```

#### 21 · `[HU-13] Tabla de alumnos`
**Labels:** `tipo: historia` `área: frontend` `prioridad: alta` · **Asignado:** Matías · **Estimación:** 3 · **Épica:** E5
```markdown
**Como** líder de generación **quiero** ver por cada alumno sus faltas y promedios **para** identificar a los alumnos en riesgo de reprobar.

- [ ] Columnas: Nombre, Matrícula, Promedio (1 decimal), Faltas (M-01), Estado (peor entre promedio y faltas, con motivo en tooltip)
- [ ] Chips de estado con conteo que filtran la tabla (M-02)
- [ ] Ícono ⚠ con tooltip si el alumno tiene alertas (M-06)
- [ ] Paginación de 50 y "Mostrando 1–50 de N"
- [ ] Fila clicable y con teclado → `#alumnos/<matricula>`
- [ ] Estados: cargando, vacío (botón Cargar datos), sin resultados, error con Reintentar
```

#### 22 · `[HU-16] Semáforo de colores (verde, amarillo, rojo)`
**Labels:** `tipo: historia` `área: frontend` `prioridad: alta` · **Asignado:** Uziel · **Estimación:** 2 · **Épica:** E5
```markdown
**Como** líder de generación **quiero** que el sistema use rojo, amarillo y verde según la calificación **para** que el monitoreo sea más intuitivo.

- [ ] `public/css/semaforo.css` con `.badge-correcto/preventivo/critico/sin-datos/baja` usando variables de `theme.css`
- [ ] `UI.badgeEstado(estado)` con texto + ícono
- [ ] Color de faltas según el % del límite de la materia (`context/07` §4.2)
- [ ] Contraste AA en tema claro y oscuro
- [ ] Mismos colores en tabla, detalle y gráficas (`context/07` §4.4)
```

#### 23 · `[HU-14] Buscador por nombre y matrícula`
**Labels:** `tipo: historia` `área: frontend` `prioridad: alta` · **Asignado:** Matías · **Estimación:** 2 · **Épica:** E5
```markdown
- [ ] Caja de búsqueda arriba de la tabla, filtra al teclear (debounce 150 ms)
- [ ] Búsqueda **por palabras** en cualquier orden (M-11): "perez mariana" encuentra "Pérez López Mariana"
- [ ] Sin distinguir mayúsculas ni acentos (`normalizar()` en `public/js/orden-busqueda.js`)
- [ ] "No hay alumnos que coincidan con «texto»" + Limpiar búsqueda
- [ ] La búsqueda se conserva al volver del detalle
```

#### 24 · `[HU-15] Ordenar de peor a mejor por PROMEDIO y/o FALTAS`
**Labels:** `tipo: historia` `área: frontend` `prioridad: alta` · **Asignado:** Uziel · **Estimación:** 3 · **Épica:** E5
```markdown
**Como** líder de generación **quiero** ordenar por promedio y/o faltas **para** ver primero a quienes necesitan atención.

- [ ] Casillas `PROMEDIO [ ]` y `FALTAS [ ]` al lado del buscador
- [ ] `ordenarAlumnos()` en `public/js/orden-busqueda.js` idéntica a `context/07` §6 (ambas → peor promedio, más faltas, alfabético)
- [ ] Sin datos / bajas al final
- [ ] Pruebas del orden con el caso 12 de `context/07` §11
- [ ] El orden alfabético usa el nombre como se muestra (preferencia de formato)
- [ ] Indicador ▲/▼ en el encabezado de la columna ordenada
```

#### 25 · `[HU-17] Vista de detalle del alumno`
**Labels:** `tipo: historia` `área: frontend` `prioridad: alta` · **Asignado:** Matías · **Estimación:** 5 · **Épica:** E5
```markdown
**Como** líder de generación **quiero** ver toda la información de un alumno **para** entender en qué materias está fallando.

- [ ] Encabezado: nombre, matrícula, plan, listas, promedio general, faltas totales, estado y **motivo** ("Crítico por faltas en …")
- [ ] Alertas (M-06): sin derecho, faltas al límite, muchos NE, SC, DA, materias reprobando
- [ ] Una tarjeta por materia con `Actividad 1…n | Promedio total | Faltas` (solo columnas con datos)
- [ ] Faltas como "4 / 5" con color por % del límite (M-04); NE/SD/SC/DA como chips con tooltip ("Sin calificar", "Deshonestidad académica"…)
- [ ] "← Volver a alumnos" conserva búsqueda, orden y página

Referencia: `context/05_UI_UX.md` §8 · Depende de: #20, #22
```

#### 26 · `[T-12] Índices y prueba de rendimiento con 5,000 alumnos`
**Labels:** `tipo: tarea` `área: base de datos` `prioridad: media` · **Asignado:** Uziel · **Estimación:** 2 · **Épica:** E5
```markdown
- [ ] Script que genere un Excel sintético de 5,000 alumnos × 7 materias
- [ ] Medir importación, `GET /api/alumnos` y búsqueda en el navegador
- [ ] Ajustar índices/consultas si se superan los límites de RNF-01
- [ ] Anotar resultados en el PR
```

### 🟧 Sprint 3 · v0.4 · Seguimiento y cuenta

#### 27 · `[HU-10] API del Excel de lista de seguimiento`
**Labels:** `tipo: historia` `área: backend` `área: excel` `prioridad: alta` · **Asignado:** Sebastián · **Estimación:** 5 · **Épica:** E4
```markdown
**Como** líder de generación **quiero** filtrar a los alumnos inscritos de último año **para** agilizar la búsqueda de su información.

- [ ] `services/excel-lista.js` con las reglas de `context/08` §2 (formato del cliente: hoja `Todos`, `Matrícula` + `Nombre`; encabezado en las primeras 10 filas, nombres de columna flexibles, recortar espacios, ignorar columnas vacías)
- [ ] `POST /api/listas/previa` → total, encontrados, no encontrados, nombres distintos
- [ ] `POST/GET/PUT/DELETE /api/listas` (`context/06` §5)
- [ ] Se guardan también las matrículas no encontradas
- [ ] Pruebas con `test/fixtures/lista-muestra.xlsx`

Probado también en local con el Excel de matrículas del cliente: 173 matrículas, 173 encontradas, 1 nombre distinto.
```

#### 28 · `[HU-10] Cargar una lista de seguimiento desde Alumnos`
**Labels:** `tipo: historia` `área: frontend` `prioridad: alta` · **Asignado:** Matías · **Estimación:** 3 · **Épica:** E4
```markdown
- [ ] Botón "Cargar lista" → modal con nombre de la lista (sugerido: nombre del archivo) + dropzone
- [ ] Previsualización con total, encontrados, tabla de no encontrados y tabla de nombres distintos
- [ ] Al guardar, la tabla de Alumnos muestra esa lista y aparece un toast
```

#### 29 · `[HU-11] Selector "Mostrar: Todos / lista"`
**Labels:** `tipo: historia` `área: frontend` `prioridad: alta` · **Asignado:** Matías · **Estimación:** 2 · **Épica:** E4
```markdown
- [ ] Selector arriba de la tabla de Alumnos (y en el Resumen en el Sprint 4, M-03)
- [ ] La lista elegida se recuerda (sessionStorage con try/catch)
- [ ] Los contadores de estado se recalculan para la lista
```

#### 30 · `[HU-12] Renombrar, reemplazar y eliminar listas`
**Labels:** `tipo: historia` `área: frontend` `área: backend` `prioridad: baja` · **Asignado:** Sebastián · **Estimación:** 2 · **Épica:** E4
```markdown
- [ ] Menú ⋯ junto al selector: Renombrar, Reemplazar con otro Excel, Eliminar (con `UI.confirm` peligro)
- [ ] Eliminar una lista no borra alumnos
```

#### 31 · `[HU-08] Alta manual de alumnos y materias (API + formulario)`
**Labels:** `tipo: historia` `área: frontend` `área: backend` `prioridad: media` · **Asignado:** Uziel · **Estimación:** 5 · **Épica:** E3
```markdown
**Como** líder de generación **quiero** agregar un alumno a mano **para** registrar casos que no vienen en el Excel.

- [ ] `POST/PUT/DELETE /api/alumnos`, `POST /api/alumnos/:matricula/materias`, `PUT/DELETE /api/inscripciones/:id` (solo `origen = manual`)
- [ ] `GET /api/materias` y `GET /api/planes` para los selectores
- [ ] Pestaña "Formulario" en Cargar datos (`context/05` §6): datos del alumno (matrícula, apellidos y nombres por separado) + materias con actividades (número, NE, SC o DA), faltas, límite y calificación opcional
- [ ] Matrícula repetida → ofrecer agregar materias al alumno existente
- [ ] Una carga de Excel no borra lo manual (probado con modo reemplazar)
```

#### 32 · `[HU-03] [HU-04] API de cuenta: usuario y contraseña`
**Labels:** `tipo: historia` `área: backend` `prioridad: alta` · **Asignado:** Sebastián · **Estimación:** 2 · **Épica:** E2
```markdown
- [ ] `PUT /api/cuenta` con nombre y usuario (pide `passwordActual`, devuelve token nuevo; sin correo, D-17)
- [ ] `PUT /api/cuenta/password` (mín. 8, máx. 72; pone `password_por_defecto = 0`)
- [ ] Validaciones y errores de `context/06` §3
```

#### 33 · `[HU-03] [HU-04] Vista Perfil: cuenta y contraseña`
**Labels:** `tipo: historia` `área: frontend` `prioridad: alta` · **Asignado:** Matías · **Estimación:** 3 · **Épica:** E2
```markdown
**Como** líder de generación **quiero** cambiar mi usuario y mi contraseña **para** personalizar y proteger mi acceso.

- [ ] Tarjeta Cuenta (nombre, usuario, contraseña actual) y tarjeta Contraseña
- [ ] Validación en línea; toast al guardar
- [ ] El sidebar muestra el nuevo nombre/usuario sin cerrar sesión
```

#### 49 · `[HU-26] Preferencias: tema claro/oscuro y formato de nombres`
**Labels:** `tipo: historia` `área: frontend` `área: backend` `prioridad: media` · **Asignado:** Uziel · **Estimación:** 5 · **Épica:** E7
```markdown
**Como** líder de generación **quiero** elegir el tema de la aplicación y cómo se muestran los nombres **para** trabajar cómodo. Mejoras aprobadas M-12 y M-13.

- [ ] `PUT /api/cuenta/preferencias` (`tema`, `formatoNombre`) y columnas `usuarios.tema` / `usuarios.formato_nombre`
- [ ] Tarjeta "Preferencias" en Perfil: Tema (Claro / Oscuro / Igual que el sistema) y Mostrar nombres (Nombres Apellidos / Apellidos Nombres), se guardan al elegir
- [ ] `theme.js` + `app.js`: aplicar el tema de la cuenta al iniciar sesión, sin parpadeo; el botón ◐ cambia la misma preferencia; las gráficas se redibujan
- [ ] `nombreMostrar` en tabla, detalle, top de riesgo, gráficas y exportación
- [ ] Modal "Corregir nombre" en el detalle (apellidos / nombres) con `PUT /api/alumnos/:matricula/nombre`
- [ ] Probado con los 15 nombres con partículas del Excel real (en local)

Referencia: `context/05` §9, `context/07` §8 · Depende de: #13, #33
```

### 🟪 Sprint 4 · v0.5 · Resumen administrativo

#### 34 · `[HU-18] [HU-19] API del Resumen administrativo`
**Labels:** `tipo: historia` `área: backend` `prioridad: alta` · **Asignado:** Sebastián · **Estimación:** 5 · **Épica:** E6
```markdown
- [ ] `GET /api/resumen?lista=` con kpis, porEstado, porRango, materiasBajas, porEstadoFaltas, topRiesgo, evolucion (`context/06` §7)
- [ ] Definiciones exactas de `context/07` §10
- [ ] `vacio: true` cuando no hay datos
```

#### 35 · `[HU-18] [HU-20] Tarjetas de indicadores y estado vacío del Menú principal`
**Labels:** `tipo: historia` `área: frontend` `prioridad: alta` · **Asignado:** Matías · **Estimación:** 2 · **Épica:** E6
```markdown
- [ ] Saludo, "Última actualización" y 5 tarjetas (alumnos, promedio, crítico, preventivo, correcto)
- [ ] Sin datos: gráficas vacías, "Aún no hay datos en el sistema" y botón **Cargar datos**
- [ ] Aviso "Estás usando la contraseña por defecto" con enlace a Perfil (D-18)
- [ ] Clic en las tarjetas de estado → Alumnos filtrado (M-09)
```

#### 36 · `[HU-19] Gráficas del Menú principal con Chart.js`
**Labels:** `tipo: historia` `área: frontend` `prioridad: alta` · **Asignado:** Matías · **Estimación:** 5 · **Épica:** E6
```markdown
- [ ] `public/js/graficas.js`: helpers que leen colores de las variables CSS y se redibujan al cambiar de tema
- [ ] Dona por estado · barras por rango de promedio · barras horizontales de materias con menor promedio · barras por estado de faltas
- [ ] Selector "Mostrar: Todos / lista" (M-03)
- [ ] Tooltips en español; nombres largos recortados
- [ ] Clic en la dona → Alumnos con ese chip de estado activo (M-09)
```

#### 37 · `[HU-21] Evolución del desempeño por carga (M-05)`
**Labels:** `tipo: historia` `área: frontend` `área: backend` `prioridad: media` · **Asignado:** Uziel · **Estimación:** 4 · **Épica:** E6
```markdown
Mejora aprobada M-05. Explicación en `context/05_UI_UX.md` §12; criterios en `context/07` §9.

- [ ] `tendencia(cortes, umbral)` en `lib/indicadores.js`: Empeora / Mejora / Estable / Sin historial (mismo periodo, última carga de cada día, el estado manda sobre el promedio, umbral 2 puntos)
- [ ] `tendencia` en `GET /api/alumnos` y `GET /api/alumnos/:matricula`; `evolucion` y `tendencias` en `GET /api/resumen`
- [ ] Menú principal: línea del promedio general y % en Crítico por carga + "N empeoraron · N mejoraron" (clic → Alumnos filtrado)
- [ ] Alumnos: flecha de tendencia junto al promedio y chip "⬇ Empeoraron"
- [ ] Detalle: línea de tendencia, mini-gráfica del promedio por carga y faltas nuevas desde la última carga
- [ ] Con una sola carga: "La evolución aparecerá cuando cargues datos más de una vez"
- [ ] Pruebas con los casos 15–17 de `context/07` §11
```

#### 38 · `[HU-22] Tabla de alumnos con mayor riesgo`
**Labels:** `tipo: historia` `área: frontend` `prioridad: media` · **Asignado:** Uziel · **Estimación:** 2 · **Épica:** E6
```markdown
- [ ] Top 10 con orden promedio + faltas; cada fila abre el detalle
- [ ] "Ver todos →" abre Alumnos con ambas casillas de orden marcadas
```

#### 39 · `[HU-09] Historial de cargas`
**Labels:** `tipo: historia` `área: frontend` `área: backend` `prioridad: baja` · **Asignado:** Sebastián · **Estimación:** 3 · **Épica:** E3
```markdown
- [ ] `GET /api/importaciones` y pestaña "Historial" en Cargar datos
- [ ] Columnas: fecha, archivo, tipo, alumnos, filas, modo, estado
```

#### 40 · `[T-13] Validación del Menú principal con el cliente`
**Labels:** `tipo: tarea` `requiere cliente` `prioridad: media` · **Asignado:** Saraí · **Estimación:** 3 · **Épica:** E6
```markdown
- [ ] Mostrar las gráficas con el Excel real y preguntar si son las relevantes
- [ ] Registrar gráficas que el cliente quiera agregar o quitar (crear issues)
- [ ] Iniciar el borrador del manual de usuario con capturas de las vistas terminadas
```

### 🟥 Sprint 5 · v1.0 · Entrega final

#### 41 · `[HU-23] Umbrales configurables en Perfil`
**Labels:** `tipo: historia` `área: backend` `área: frontend` `prioridad: media` · **Asignado:** Sebastián, Matías · **Estimación:** 3 · **Épica:** E7
```markdown
Mejora aprobada M-08.

- [ ] `GET/PUT /api/configuracion` y `POST /api/configuracion/vista-previa`
- [ ] Tarjeta "Umbrales" en Perfil: calificación (verde/amarillo), % del límite de faltas (amarillo/rojo), regla fija para materias sin límite y cambio mínimo de la evolución (M-05)
- [ ] Vista previa del conteo por estado
- [ ] Restaurar valores por defecto
- [ ] Validación: amarillo < verde; % preventivo < % crítico; fijo preventivo < fijo crítico
```

#### 42 · `[HU-24] Exportar la tabla de alumnos a Excel/CSV`
**Labels:** `tipo: historia` `área: backend` `área: excel` `prioridad: media` · **Asignado:** Uziel · **Estimación:** 3 · **Épica:** E7
```markdown
Mejora aprobada M-07.

- [ ] `GET /api/alumnos/exportar` con los mismos filtros (lista, chips de estado), búsqueda y orden de la vista, y el formato de nombres elegido
- [ ] Botón "Exportar" en Alumnos; archivo `SEMA_alumnos_<lista>_<fecha>.xlsx`
- [ ] Columnas: Nombre, Matrícula, Promedio, Faltas, Estado, Materias reprobando
```

#### 43 · `[HU-25] Respaldo y borrado de datos`
**Labels:** `tipo: historia` `área: backend` `área: base de datos` `propuesta` `prioridad: baja` · **Asignado:** Sebastián · **Estimación:** 2 · **Épica:** E7
```markdown
- [ ] `GET /api/datos/respaldo` (`db.backup()`)
- [ ] `DELETE /api/datos` con contraseña y confirmación "BORRAR" (conserva la cuenta)
- [ ] Tarjeta "Datos" en Perfil
```

#### 44 · `[T-14] Pruebas en una computadora con Windows limpia`
**Labels:** `tipo: tarea` `área: infraestructura` `prioridad: alta` · **Asignado:** Uziel · **Estimación:** 2 · **Épica:** E1
```markdown
- [ ] Instalar Node.js LTS, copiar la carpeta, ejecutar `SEMA.bat` y crear el acceso directo
- [ ] Recorrer el flujo completo: login → cargar Excel → lista → alumnos → detalle → perfil
- [ ] Probar sin internet
- [ ] Documentar problemas encontrados y su solución en el README
```

#### 45 · `[T-15] Pruebas de aceptación con el cliente`
**Labels:** `tipo: tarea` `requiere cliente` `prioridad: alta` · **Asignado:** Saraí · **Estimación:** 3 · **Épica:** E7
```markdown
- [ ] Checklist con los criterios de aceptación de todas las HU Must
- [ ] Sesión con el cliente usando su Excel real
- [ ] Registrar resultados (aprobado / cambios) y crear issues `tipo: bug` si aplica
```

#### 46 · `[T-16] Manual de usuario`
**Labels:** `tipo: docs` `prioridad: alta` · **Asignado:** Saraí · **Estimación:** 3 · **Épica:** E7
```markdown
- [ ] `context/Manual_de_Usuario.pdf` con capturas: instalación, acceso directo, login, cargar Excel, listas, alumnos, detalle, perfil
- [ ] Sección "Problemas comunes" (olvidé mi contraseña → `npm run reset-password`, el navegador no abre, etc.)
- [ ] Explicación del semáforo y de los umbrales
```

#### 47 · `[T-17] Corrección de errores y pulido visual`
**Labels:** `tipo: bug` `área: frontend` `área: backend` `prioridad: alta` · **Asignado:** Todos · **Estimación:** 5 · **Épica:** E7
```markdown
- [ ] Atender los bugs abiertos de la Review del Sprint 4 y de #45
- [ ] Revisión de accesibilidad: foco visible, teclado, contraste, textos alternativos
- [ ] Revisión de tema oscuro en todas las vistas
- [ ] Quitar código muerto y `console.log`
```

#### 48 · `[T-18] Release v1.0 y entrega del producto`
**Labels:** `tipo: tarea` `área: infraestructura` `prioridad: alta` · **Asignado:** Calixto · **Estimación:** 1 · **Épica:** E7
```markdown
- [ ] PR `develop → main`, etiqueta `v1.0.0` y *release* con notas
- [ ] Verificar que no hay datos reales en el repositorio (`git log` de archivos `.xlsx`)
- [ ] Paquete de entrega (.zip sin `node_modules` ni `data/`) + manual
- [ ] Entrega al cliente (Saraí) y cierre del Project
```

---

## 7. Resumen de carga por persona

| Sprint | Calixto | Matías | Sebastián | Uziel | Saraí | Total |
|---|---|---|---|---|---|---|
| 0 | 1 (#2) | 8 (#1, #5, #7, #8) | 3 (#4) | 13 (#3, #6, #9) | 4 (#10, #11) | **29** |
| 1 | — | 9 (#15, #16, #17) | 10 (#12, #14) | 5 (#13) | 1 (#18) | **25** |
| 2 | — | 10 (#21, #23, #25) | 6 (#19, #20) | 7 (#22, #24, #26) | — (valida) | **23** |
| 3 | — | 8 (#28, #29, #33) | 9 (#27, #30, #32) | 10 (#31, #49) | — (valida) | **27** |
| 4 | — | 7 (#35, #36) | 8 (#34, #39) | 6 (#37, #38) | 3 (#40) | **24** |
| 5 | 1 (#48) | apoyo en #41 | 5 (#41, #43) | 5 (#42, #44) | 6 (#45, #46) | **22** (incluye #47 = 5, compartido) |

> Si en la Planning alguien queda con más de ~10 puntos, el Scrum Master reasigna (las tareas pueden reacomodarse). El único issue con `propuesta` es #43 (respaldo, Could): se hace solo si queda tiempo en el Sprint 5.

---

## 8. Crear todo desde la terminal

**Sí: casi todo este documento se puede crear con comandos**, usando GitHub CLI (`gh`) y el script `scripts/github/crear-tablero.mjs`. El script **lee este mismo `Sprints.md`**, así que si cambias un issue, un label o un milestone aquí y lo vuelves a ejecutar, crea solo lo que falta.

| Parte del documento | ¿Por terminal? | Cómo |
|---|---|---|
| §3 Labels (16) | ✅ | `gh label create` |
| §5 Milestones (6) | ✅ | `gh api …/milestones` |
| Project (tablero) y enlace con el repositorio | ✅ | `gh project create` · `gh project link` |
| §1 Columnas (campo Status) | ✅ | API GraphQL `updateProjectV2Field` |
| §2 Campos Sprint (iteraciones), Estimación, Prioridad, Épica | ✅ | API GraphQL `createProjectV2Field` |
| §6 Issues (49) con labels, milestone y responsables | ✅ | `gh issue create` |
| Poner cada issue en el tablero con su sprint, estimación, prioridad, épica y columna | ✅ | `gh project item-add` + API GraphQL |
| §1 Automatizaciones (*Workflows*) | ❌ | A mano (§8.3): GitHub no permite configurarlas por API |
| §2 Vistas (Tablero, Backlog, Por persona, Roadmap) | ❌ | A mano (§8.3) |
| §4 Ceremonias | — | No son configuración de GitHub |

### 8.1 Antes de empezar (una sola vez)

1. Instalar GitHub CLI (en Windows): `winget install --id GitHub.cli` y volver a abrir la terminal.
2. Iniciar sesión y dar permiso de proyectos:
   ```bash
   gh auth login
   gh auth refresh -s project
   ```
3. **Invitar al equipo** al repositorio (si no, no se les pueden asignar issues). Cambia `USUARIO` por el usuario de GitHub de cada uno:
   ```bash
   gh api -X PUT repos/CalixtoIsaac/SEMA-Sistema-de-Evaluacion-y-Monitoreo-Academico/collaborators/USUARIO -f permission=push
   ```
   Cada persona debe **aceptar la invitación** (le llega por correo o en github.com/notifications).
4. Abrir `scripts/github/crear-tablero.mjs` y llenar `CONFIG.usuarios` con el usuario de GitHub de Matías, Sebastián, Uziel y Saraí. Si alguno queda vacío, sus issues se crean sin asignar y se asignan después.

### 8.2 Ejecutar

Desde la carpeta del proyecto (PowerShell, CMD o Git Bash):

```bash
cd "C:\Users\isaac\OneDrive\Documentos\SEMA-Sistema-de-Evaluación-y-Monitoreo-Académico"

# 1) Simulación: muestra todo lo que haría, sin cambiar nada en GitHub
node scripts/github/crear-tablero.mjs --dry-run

# 2) Crear de verdad (tarda 2–3 minutos por la pausa entre issues)
node scripts/github/crear-tablero.mjs
```

Qué hace, en orden:

1. Revisa que `Sprints.md` esté bien escrito: cada issue con su línea de *Labels · Asignado · Estimación · Épica*, labels y milestones que existan en las tablas, responsables conocidos. Si algo falla, se detiene **antes** de tocar GitHub.
2. Crea o actualiza los **16 labels** (§3).
3. Crea los **6 milestones** que falten (§5), con fecha límite a las 23:59 del día indicado (hora del centro de México).
4. Crea el Project **"SEMA · Tablero Scrum"** (o usa el que ya exista con ese nombre) y lo enlaza al repositorio.
5. Pone las columnas de §1 en el campo **Status** y crea los campos **Sprint** (6 iteraciones de 7 días desde el 21/10/2026), **Estimación**, **Prioridad** y **Épica** (§2).
6. Crea los **49 issues** en orden (#1 … #49) con su título, cuerpo, labels, milestone y responsables. Los agrega al Project con su Sprint, Estimación, Prioridad y Épica. Los del Sprint 0 quedan en **Por hacer** y los demás en **Backlog**.
7. Si GitHub les dio números distintos a los de este documento (pasa cuando el repositorio ya tiene issues o PR), corrige las referencias como "Depende de: #4" dentro de los issues.

**Volver a ejecutarlo es seguro:** no duplica issues (los reconoce por título), labels ni milestones, y **no mueve de columna** las tarjetas que ya existen.

| Opción | Para qué |
|---|---|
| `--dry-run` | Ver qué haría, sin cambiar nada |
| `--actualizar-campos` | Volver a poner Sprint, Estimación, Prioridad y Épica a los issues que ya existen (por ejemplo, si cambiaste un issue de sprint en este documento o si el campo Sprint se creó a mano). Nunca cambia la columna |
| Variables `SEMA_REPO`, `SEMA_OWNER`, `SEMA_PROYECTO` | Usar otro repositorio, dueño o nombre de Project sin editar el script |

> **Números de issue:** si el repositorio ya tiene issues o Pull Requests, GitHub no empezará en #1 y los números no coincidirán con este documento. El script ajusta las referencias dentro de los issues, pero las tablas de este documento (§7) seguirán usando la numeración original: búscalos por su clave (`[HU-xx]` / `[T-xx]`).

### 8.3 Lo que se hace a mano en GitHub (5 minutos)

En el Project → **⋯ → Workflows**:

1. *Auto-add to project*: filtro `is:issue,pr is:open` del repositorio → Status **Backlog**.
2. *Pull request merged* → Status **Validación PO**.
3. *Item closed* → Status **Hecho**.
4. *Item reopened* → Status **En progreso**.

En el Project → **+ New view**:

| Vista | Diseño | Configuración |
|---|---|---|
| Tablero | Board | Agrupar por Status · filtro `sprint:@current` |
| Backlog | Table | Agrupar por Sprint · columnas Estimación, Prioridad, Épica, Assignees |
| Por persona | Board | Agrupar por Assignees (*Column by*: Assignees) |
| Roadmap | Roadmap | Fechas por Sprint |

Solo si el script mostró un aviso ⚠:

- **Columnas (Status):** Project → ⋯ → *Settings* → campo **Status** → deja las opciones Backlog, Por hacer, En progreso, En revisión, Validación PO y Hecho.
- **Sprint:** *Settings* → *+ New field* → tipo **Iteration**, nombre `Sprint`, inicio **21/10/2026**, duración **1 semana**, 6 iteraciones llamadas `Sprint 0` … `Sprint 5`. Después ejecuta `node scripts/github/crear-tablero.mjs --actualizar-campos`.

### 8.4 Comandos sueltos (si prefieres hacerlo paso a paso)

```bash
R=CalixtoIsaac/SEMA-Sistema-de-Evaluacion-y-Monitoreo-Academico

# Un label
gh label create "tipo: historia" --color 1D76DB --description "Historia de usuario" --force -R $R

# Un milestone (fecha en UTC: 28-oct 05:59Z = 27-oct 23:59 en CDMX)
gh api -X POST repos/$R/milestones -f title="v0.1 · Base del proyecto" -f due_on="2026-10-28T05:59:59Z"

# El Project y su enlace con el repositorio (anota el número que devuelve)
gh project create --owner CalixtoIsaac --title "SEMA · Tablero Scrum"
gh project link 1 --owner CalixtoIsaac --repo $R

# Campos (el de tipo Iteration solo por API GraphQL o a mano)
gh project field-create 1 --owner CalixtoIsaac --name "Estimación" --data-type NUMBER
gh project field-create 1 --owner CalixtoIsaac --name "Prioridad" --data-type SINGLE_SELECT --single-select-options "🔴 Alta,🟡 Media,🟢 Baja"

# Un issue (el cuerpo va en un archivo) y agregarlo al Project
gh issue create -R $R --title "[T-01] Limpiar el repositorio…" --body-file cuerpo.md \
  --label "tipo: tarea" --label "prioridad: alta" --milestone "v0.1 · Base del proyecto" --assignee CalixtoIsaac
gh project item-add 1 --owner CalixtoIsaac --url https://github.com/$R/issues/1

# Poner un valor (los IDs salen de: gh project field-list 1 --owner CalixtoIsaac --format json)
gh project item-edit --id <ITEM_ID> --project-id <PROJECT_ID> --field-id <FIELD_ID> --number 3
```

> En PowerShell cambia `R=…` por `$R = "…"` y el `\` del final de línea por un acento grave `` ` ``.

### 8.5 Código del script

Se guarda en `scripts/github/crear-tablero.mjs`. Se incluye aquí como referencia; **el archivo es el que se ejecuta**.

<details>
<summary>Ver <code>scripts/github/crear-tablero.mjs</code></summary>

```javascript
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
  inicioSprints: '2026-10-21', // miércoles de inicio del Sprint 0
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
  // Columna del tablero para los issues del Sprint 0 (los demás quedan en la primera columna: Backlog)
  estadoSprintActual: 'Por hacer',
  sprintActual: 0
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
```

</details>
