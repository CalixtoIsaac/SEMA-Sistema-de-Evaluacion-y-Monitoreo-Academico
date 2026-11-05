# SEMA · Avances y pendientes del equipo

**Fecha:** jueves 5 de noviembre de 2026 (día 4 del Sprint 2) · **Elaboró:** Calixto Isaac Galeana Medrano, Scrum Master
**Base revisada:** `develop` en `544ec23` (después del PR #62). Pasan las 29 pruebas de Python y las 16 de Node. La carga del Excel de prueba y la tabla de alumnos funcionan en el navegador.

> **Qué cambió desde el informe del 4 nov:** se integró todo el Sprint 1 que estaba en ramas (PR #53–#58 y #60). El Scrum Master hizo como suplente las vistas de carga y de alumnos (#15, #16, #17, #21) y el semáforo (#22), y también las correcciones C1, C2, C3 y C6 del backend (PR #58). `develop` y `main` se sincronizaron (PR #62) y se borraron las ramas viejas.

---

## 1. Decisiones

| ID | Decisión | Quién | Fecha |
|---|---|---|---|
| **D-01 (actualizada)** | El backend pasa de Node.js/Express a **Python + FastAPI + SQLite**. El frontend sigue en HTML/CSS/JS sin frameworks. Se mantiene el contrato `/api` de `context/06`. Node queda solo para herramientas de desarrollo (anonimizador de Excel y pruebas de JavaScript). **Ya registrada en `context/00`.** | Aprobó Calixto Isaac (Scrum Master) · propuesta de Sebastián, avalada por Saraí (PO) | 4 nov 2026 |
| D-01a | Python 3.12 o superior en la computadora del cliente. SEMA.bat lo verifica e instala las dependencias. | Scrum Master | 4 nov 2026 |
| D-01b | Las reglas de indicadores (#13) existen **una sola vez**, en `sema/indicators.py`. Uziel las valida y completa las pruebas. No habrá versión en JavaScript. | Scrum Master | 4 nov 2026 |
| **D-21 (nueva)** | **Flujo de ramas:** toda rama nueva sale de `develop` actualizado y su PR va hacia `develop`. Las features se fusionan con *squash*. `develop` → `main` solo al cerrar una versión y **siempre con "Create a merge commit"**. Así no se vuelven a separar las ramas. | Scrum Master | 5 nov 2026 |

---

## 2. Avance del Sprint 1 (26 oct – 1 nov · 65 puntos)

| Estado | Puntos | Issues |
|---|---|---|
| ✅ Integrado en `develop` | **51** | #1, #2, #3, #4, #5, #7, #8, #9, #10, #11, #12, #14, #15, #16, #17, #19, #21, #22 |
| ⬜ Pendiente (se arrastra al Sprint 2) | 14 | #6, #13, #18, #20 |

**Avance: 51 de 65 puntos (78 %)**, contra 13 de 65 (20 %) el 4 nov.

### Detalle por issue

| # | Tarea | Responsable | Estado |
|---|---|---|---|
| 1 | Limpiar repo, renombrar a SEMA, paleta azul | Calixto | ✅ Integrado |
| 2 | Proteger ramas, CODEOWNERS, plantilla de PR | Calixto | ✅ Integrado |
| 3 | Esquema de BD v1 y migraciones | Uziel | ✅ Integrado (PR #50) |
| 4 | Cuenta "Chuchito" y JWT | Sebastián | ✅ Integrado (PR #58) · C1 y C3 aplicadas |
| 5 | Iniciar sesión | Matías | ✅ Integrado (PR #55) |
| 6 | SEMA.bat | Uziel | ⬜ **Pendiente · rehacer para Python** |
| 7 | Sidebar | Matías | ✅ Integrado (PR #54) |
| 8 | Chart.js e Inter locales | Matías | ✅ Integrado (PR #56) |
| 9 | Excel de prueba anonimizado | Uziel | ✅ Integrado (PR #53) |
| 10 | Prototipos y validación con el cliente | Saraí | ✅ Completado |
| 11 | Presentar decisiones D-08 a D-20 | Saraí | ✅ Completado |
| 12 | Lector del Excel de monitoreo | Sebastián | ✅ Integrado (PR #58) · **reasignado en GitHub a Sebastián** |
| 13 | Reglas de indicadores y nombres | Uziel | ⬜ **Pendiente:** validar `sema/indicators.py` y completar pruebas |
| 14 | API de previa y confirmación | Sebastián | ✅ Integrado (PR #58) |
| 15 | Zona para arrastrar el Excel | Matías | ✅ Integrado (PR #58) · hecho por el Scrum Master como suplente |
| 16 | Previsualización del Excel | Matías | ✅ Integrado (PR #58) · hecho por el Scrum Master como suplente |
| 17 | Notificación de carga | Matías | ✅ Integrado (PR #58) · hecho por el Scrum Master como suplente |
| 18 | Validar la carga con el Excel real y el cliente | Saraí | ⬜ **Pendiente · ya se puede hacer** |
| 19 | API de alumnos | Sebastián | ✅ Integrado (PR #58) · C2 aplicada |
| 20 | API del detalle del alumno | Sebastián | ⬜ **Pendiente · bloquea #25** |
| 21 | Tabla de alumnos | Matías | ✅ Integrado (PR #58) · hecho por el Scrum Master como suplente |
| 22 | Semáforo de colores | Uziel | ✅ Integrado (PR #58) · hecho por el Scrum Master como suplente |

> Los issues integrados siguen abiertos hasta que Saraí los valide (`context/Sprints.md` §1). Los PR van a `develop`, así que `Closes #n` no los cierra solo.

---

## 3. Correcciones generales

| # | Corrección | Responsable | Estado |
|---|---|---|---|
| G1–G3 | C1 formato de errores, C2 tendencia, C3 límite de intentos | Sebastián | ✅ Hecho (PR #58, con pruebas) |
| G4 | Comandos de Windows en `RUN_BACKEND.md` (C4) | Sebastián | ✅ Hecho (PR #60) |
| G5 | **Quitar de `develop` los informes de auditoría y evidencias de Codex** (C5). Entraron con el PR #58: `INFORME_AUDITORIA_BACKEND.md`, `INFORME_CIERRE_SPRINT_BACKEND.md`, `context/CODEX_BACKEND.md`, `evidencias/` y `scripts/capturas_backend.py` | Sebastián | ⬜ Pendiente · en el PR de limpieza |
| G6 | SEMA.bat para Python (#6) | Uziel | ⬜ Pendiente · alta |
| G7 | Registrar D-01 actualizada en `context/00` | Calixto | ✅ Hecho |
| G8 | README y `context/03` a FastAPI (C7) | Sebastián | ✅ Hecho (PR #60) · **falta `context/06`**: 5 encabezados aún dicen `routes/*.js` |
| G9 | Ajustar el texto de los issues que mencionan Node y las fechas de `context/Sprints.md` | Saraí (PO) | ⬜ Pendiente · media |
| G10 | Retirar Express: `server.js`, `routes/`, `lib/auth.js`, `lib/db.js` y sus dependencias (C8) | Sebastián | ⬜ Pendiente · en el PR de limpieza |
| G11 | Reasignar #12 a Sebastián y #24 a Matías en GitHub | Calixto | ✅ Hecho |
| G12 | Cambio de contraseña (#32): la contraseña D-04 es pública en los documentos | Sebastián | ⬜ Pendiente · alta |
| G13 | URL del repo en el informe de Sebastián | Sebastián | Se resuelve sola al borrar los informes (G5) |
| G14 | Agregar `*.bundle` al `.gitignore` | Calixto | ⬜ Hoy |
| G15 | Release `develop` → `main` (v0.3) con "Create a merge commit". `main` aún no tiene los PR #60 y #62 | Calixto | ⬜ Cuando se integre el PR de limpieza |

---

## 4. Pendientes del Sprint 2 (2–8 nov · 85 puntos + 14 arrastrados)

**Avance del Sprint 2:** ningún issue integrado todavía. #24 está terminado en `feature/24-ordenar` (Matías): se fusiona sin conflictos y pasan sus pruebas (22/22 de Node). La búsqueda de #23 ya funciona dentro de la tabla.

| Responsable | Arrastrado del Sprint 1 | Sprint 2 |
|---|---|---|
| **Sebastián** (backend) | #20 | **#32**, #34, #27, #30, #39, #41, #43 · PR de limpieza (G5, G8, G10) |
| **Matías** (frontend) | — | **#24 (PR)**, #23, #25, #35, #36, #33, #28, #29, #41 |
| **Uziel** (BD y estructura) | **#6**, #13 | #26, #31, #37, #38, #42, #44, #49 |
| **Saraí** (PO) | **#18** | Validar y cerrar los issues integrados · #40, #45, #46 · G9 |
| **Calixto** (SM) | — | G14, G15 · revisar e integrar los PR · #48 |
| **Todos** | — | #47 corrección de errores y pulido visual |

> **Riesgo de calendario:** quedan 4 días (jueves 5 a domingo 8 nov) para 14 puntos arrastrados y 85 del Sprint 2. **Ruta crítica para entregar:** #20 → #25 (detalle), #34 → #35/#36 (Menú principal), #32 → #33 (contraseña), #6 → #44 (instalar en Windows) y #45/#48 (aceptación y entrega).
> **Propuesta de recorte (confirmar con Saraí):** pasar a "Could" #30, #37, #39, #42 y #43, y dejar #28/#29 (listas) solo si #27 queda listo el viernes.

### Calendario sugerido

| Día | Meta |
|---|---|
| **Jue 5** | PR #24 · #20 · PR de limpieza · #6 · #18 con el cliente |
| **Vie 6** | #25 · #32 + #33 · #34 · #13 · release v0.3 → `main` |
| **Sáb 7** | #35 + #36 · #41 · #49 · #26 · #44 en Windows limpio |
| **Dom 8** | #45 aceptación · #46 manual · #47 pulido · #48 release v1.0 |

---

## 5. Cómo trabajar desde hoy (D-21)

1. Antes de empezar cualquier issue: `git checkout develop && git pull`, y luego `git checkout -b feature/<n>-<nombre>`.
2. Un PR por issue, siempre con base `develop`. En el texto va `Closes #n` y cómo se probó.
3. Antes de abrir el PR deben pasar `.venv\Scripts\python.exe -m pytest -q tests` y `npm test`.
4. Cada PR necesita una aprobación de otro integrante. Revisen los PR de los demás el mismo día.
5. Al fusionar, borren la rama.
