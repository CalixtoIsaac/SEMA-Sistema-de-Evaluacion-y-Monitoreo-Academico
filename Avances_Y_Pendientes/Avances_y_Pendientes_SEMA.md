# SEMA · Avances y pendientes del equipo

**Fecha:** lunes 9 de noviembre de 2026 · **Elaboró:** Calixto Isaac Galeana Medrano, Scrum Master
**Base revisada:** `develop` (hasta el PR #66) + rama **`feature/sprint2-pendientes`** (20 commits, pendiente de PR).

> **Estado:** el **código de los dos sprints está terminado**. Lo que se arrastraba del Sprint 1 (#6, #13, #20) y todo el desarrollo del Sprint 2 están en `feature/sprint2-pendientes`, con 85 pruebas de Python y 23 de Node aprobadas, probados en el navegador (tema claro y oscuro, ancho de celular) con el Excel de muestra y con la base real de 490 alumnos. Falta: **abrir e integrar el PR**, que Saraí valide los issues, las pruebas con el cliente y en un Windows limpio, el manual y el release v1.0.

---

## 1. Decisiones

| ID | Decisión | Quién | Fecha |
|---|---|---|---|
| **D-01 (actualizada)** | El backend pasa de Node.js/Express a **Python + FastAPI + SQLite**. El frontend sigue en HTML/CSS/JS sin frameworks. Se mantiene el contrato `/api` de `context/06`. Node queda solo para herramientas de desarrollo (anonimizador de Excel y pruebas de JavaScript). **Ya registrada en `context/00`.** | Aprobó Calixto Isaac (Scrum Master) · propuesta de Sebastián, avalada por Saraí (PO) | 4 nov 2026 |
| D-01a | Python 3.12 o superior en la computadora del cliente. SEMA.bat lo verifica e instala las dependencias. **Aplicado en SEMA.bat** (#6). | Scrum Master | 4 nov 2026 |
| D-01b | Las reglas de indicadores (#13) existen **una sola vez**, en `sema/indicators.py`. No habrá versión en JavaScript. | Scrum Master | 4 nov 2026 |
| **D-21** | **Flujo de ramas:** toda rama nueva sale de `develop` actualizado y su PR va hacia `develop`. Las features se fusionan con *squash*. `develop` → `main` solo al cerrar una versión y **siempre con "Create a merge commit"**. | Scrum Master | 5 nov 2026 |
| **D-22 (nueva, por confirmar con la PO)** | **Caso ambiguo de #13:** un alumno sin calificaciones numéricas y con 0 faltas queda en **Sin datos**, aunque sus materias tengan límite de faltas. Con al menos una falta, el estado es el de faltas. Anotado en `context/07` §4.3 con su prueba. | Scrum Master · **falta el visto bueno de Saraí** | 9 nov 2026 |
| **D-23 (nueva)** | El PR del Sprint 2 se integra con **"Create a merge commit"** (excepción a D-21) para conservar los commits separados por issue. | Scrum Master | 9 nov 2026 |

---

## 2. Avance del Sprint 1 (26 oct – 1 nov · 65 puntos)

| Estado | Puntos | Issues |
|---|---|---|
| ✅ Integrado en `develop` | 51 | #1, #2, #3, #4, #5, #7, #8, #9, #10, #11, #12, #14, #15, #16, #17, #19, #21, #22 |
| 🟦 Terminado en `feature/sprint2-pendientes` (falta PR) | 13 | #6, #13, #20 |
| ⬜ Pendiente | 1 | #18 (validación con el cliente) |

**Código: 64 de 65 puntos (98 %).**

---

## 3. Avance del Sprint 2 (2 – 8 nov · 85 puntos)

| Estado | Puntos | Issues |
|---|---|---|
| ✅ Integrado en `develop` | 8 | #24 (PR #61), #38 (PR #65), #42 (PR #66) · SEMA.bat inicial (PR #64) |
| 🟦 Terminado en `feature/sprint2-pendientes` (falta PR) | 58 | #25, #26, #27, #28, #29, #30, #31, #32, #33, #34, #35, #36, #37, #39, #41, #43, #49 |
| ⬜ Pendiente | 19 | #23 (2), #40 (3), #44 (2), #45 (3), #46 (3), #47 (5), #48 (1) |

**Código: 66 de 85 puntos (78 %).** Lo que falta ya no es desarrollo, salvo #23 (ajuste pequeño) y #47 (correcciones que salgan de las pruebas).

### Detalle de lo terminado hoy

| # | Tarea | Responsable | Estado |
|---|---|---|---|
| 6 | SEMA.bat exige Python 3.12 y rehace un `.venv` viejo | Uziel | 🟦 Sobre su PR #64 · ajuste del Scrum Master |
| 13 | Pruebas completas de indicadores + caso ambiguo (D-22) | Uziel | 🟦 Hecho por el Scrum Master como suplente |
| 20 | API del detalle y corrección de nombre | Sebastián | 🟦 Hecho por el Scrum Master como suplente |
| 25 | Vista de detalle del alumno | Matías | 🟦 Hecho por el Scrum Master como suplente |
| 26 | Índices v2 y prueba con 5,000 alumnos (`docs/rendimiento-5000.md`) | Uziel | 🟦 Hecho por el Scrum Master como suplente |
| 27, 30 | API de listas de seguimiento (previa, crear, renombrar, reemplazar, eliminar) | Sebastián | 🟦 Hecho por el Scrum Master como suplente |
| 28, 29 | Cargar lista y selector "Mostrar" en Alumnos y Menú principal | Matías | 🟦 Hecho por el Scrum Master como suplente |
| 31 | Alta manual: API, catálogos y pestaña Formulario | Uziel | 🟦 Hecho por el Scrum Master como suplente |
| 32 | API de cuenta y contraseña | Sebastián | 🟦 Hecho por el Scrum Master como suplente |
| 33 | Vista Perfil: cuenta y contraseña | Matías | 🟦 Hecho por el Scrum Master como suplente |
| 34 | API del Resumen administrativo | Sebastián | 🟦 Hecho por el Scrum Master como suplente |
| 35, 36 | Menú principal: tarjetas, estado vacío y gráficas | Matías | 🟦 Hecho por el Scrum Master como suplente |
| 37 | Evolución del desempeño por carga (API y gráfica) | Uziel | 🟦 Hecho por el Scrum Master como suplente |
| 39 | Historial de cargas (API y pestaña) | Sebastián | 🟦 Hecho por el Scrum Master como suplente |
| 41 | Umbrales configurables con vista previa | Sebastián, Matías | 🟦 Hecho por el Scrum Master como suplente |
| 43 | Respaldo y borrado de datos | Sebastián | 🟦 Hecho por el Scrum Master como suplente |
| 49 | Preferencias: tema y formato de nombres | Uziel | 🟦 Hecho por el Scrum Master como suplente |
| — | Botón Exportar en Alumnos (frontend de #42) | Uziel | 🟦 Hecho por el Scrum Master |
| — | Arreglos: una vista ya no pinta sobre otra al cambiar rápido; la tabla no se sale en celular; el navegador ya no usa JS/CSS viejos tras actualizar | — | 🟦 Hecho por el Scrum Master |

> Los issues siguen abiertos hasta que Saraí los valide (`context/Sprints.md` §1). Los PR van a `develop`, así que `Closes #n` no los cierra solo.

---

## 4. Correcciones generales

| # | Corrección | Responsable | Estado |
|---|---|---|---|
| G1–G4 | C1 errores, C2 tendencia, C3 intentos, C4 `RUN_BACKEND.md` | Sebastián | ✅ Hecho (PR #58 y #60) |
| G5 | Informes de auditoría de Codex | Sebastián | 🟦 Archivados en `docs/backend/`; `evidencias/` y `scripts/capturas_backend.py` borrados |
| G6 | SEMA.bat para Python (#6) | Uziel | 🟦 Python 3.12 (falta probar en Windows limpio, #44) |
| G7 | D-01 actualizada en `context/00` | Calixto | ✅ Hecho |
| G8 | README y `context/03`, `04` y `06` a FastAPI | Sebastián | 🟦 Hecho (encabezados de `context/06` y campos nuevos) |
| G9 | Ajustar el texto de los issues que mencionan Node y las fechas de `context/Sprints.md` | Saraí (PO) | ⬜ Pendiente · media |
| G10 | Retirar Express y sus dependencias | Sebastián | 🟦 Hecho (`server.js`, `routes/`, `lib/auth.js`, `lib/db.js`, `test/base.test.js`) |
| G11 | Reasignar #12 y #24 en GitHub | Calixto | ✅ Hecho |
| G12 | Cambio de contraseña (#32) | Sebastián | 🟦 Hecho · **cambien la contraseña por defecto en la computadora del cliente** |
| G13 | URL del repo en el informe | — | ✅ Resuelto al archivar los informes |
| G14 | `*.bundle` en `.gitignore` | Calixto | 🟦 Hecho |
| G15 | Release `develop` → `main` (v1.0) con "Create a merge commit" | Calixto | ⬜ Después de integrar el PR y de las pruebas con el cliente |

---

## 5. Pendientes para la entrega

| Prioridad | Responsable | Tarea | Issue |
|---|---|---|---|
| **1 · hoy** | Calixto | Subir `feature/sprint2-pendientes`, abrir el PR hacia `develop` (merge commit, D-23) y conseguir una aprobación | — |
| **1 · hoy** | Sebastián, Matías, Uziel | Revisar en el PR el código de sus issues (tabla del §3) y aprobar. Cada uno debe poder explicar su parte | — |
| 2 | Saraí | Validar y cerrar los issues terminados; confirmar D-22 | #6–#49 |
| 2 | Uziel | Probar SEMA.bat en un Windows limpio (Python 3.12, ruta con espacios y acentos) | **#44** |
| 2 | Saraí | Validar la carga con el Excel real junto al cliente | **#18** |
| 3 | Saraí | Validación del Menú principal y pruebas de aceptación con el cliente | **#40, #45** |
| 3 | Matías | Mover `normalizar()` a `orden-busqueda.js` con sus pruebas | **#23** |
| 3 | Todos | Corregir lo que salga de las pruebas y pulido visual | **#47** |
| 4 | Saraí | Manual de usuario (Perfil, listas, formulario, respaldo) | **#46** |
| 4 | Saraí | Actualizar issues y fechas de `context/Sprints.md` | G9 |
| 5 | Calixto | Release v1.0 `develop` → `main` y entrega | **#48**, G15 |

---

## 6. Cómo trabajar desde hoy (D-21)

1. Antes de empezar cualquier issue: `git checkout develop && git pull`, y luego `git checkout -b feature/<n>-<nombre>`.
2. Un PR por issue, siempre con base `develop`. En el texto va `Closes #n` y cómo se probó.
3. Antes de abrir el PR deben pasar `.venv\Scripts\python.exe -m pytest -q tests` y `npm test`.
4. Cada PR necesita una aprobación de otro integrante. Revisen los PR de los demás el mismo día.
5. Al fusionar, borren la rama.
6. Si después de actualizar la app se ve igual que antes, recarguen con **Ctrl + F5** (desde el commit `4b1570d` ya no debería pasar).
