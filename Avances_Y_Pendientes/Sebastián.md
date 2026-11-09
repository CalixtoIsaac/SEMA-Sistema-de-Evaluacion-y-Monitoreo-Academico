# Sebastián Huesca Ramírez · Backend

**Fecha de revisión:** jueves 5 de noviembre de 2026 · **Revisó:** Calixto Isaac (Scrum Master)

> **Desde hoy:** toda rama nueva sale de `develop` actualizado y su PR va hacia `develop` (decisión D-21). Tus ramas anteriores (`chore/migracion-fastapi`, `feature/4`, `/12`, `/14` y `/19`) **ya se integraron y se borraron**. Si tenías algo sin subir en ellas, pásalo a una rama nueva creada desde `develop`.

---

## 1. Tareas completadas

| Issue | Estado | Nota |
|---|---|---|
| **#4** · Cuenta "Chuchito" y JWT | ✅ Integrado (PR #58) | |
| **#12** · Lector del Excel de monitoreo | ✅ Integrado (PR #58) | El Scrum Master te reasigna el issue en GitHub |
| **#14** · API de previa y confirmación | ✅ Integrado (PR #58) | |
| **#19** · API de alumnos | ✅ Integrado (PR #58) | |
| Migración a FastAPI | ✅ Integrado (PR #58 y #60) | |

### Correcciones del informe anterior

| | Estado |
|---|---|
| **C1** · Errores de validación `400 {error, code:"VALIDACION"}` | ✅ Hecho por el Scrum Master (PR #58), con prueba |
| **C2** · Tendencia contra el corte anterior del periodo | ✅ Hecho por el Scrum Master (PR #58), con prueba |
| **C3** · Límite de intentos solo para logins fallidos | ✅ Hecho por el Scrum Master (PR #58), con prueba |
| **C4** · `RUN_BACKEND.md` para Windows | ✅ Hecho (PR #60) |
| **C6** · Prueba con el Excel de Uziel | ✅ Hecho por el Scrum Master (PR #58) |
| **C7** · README y `context/03` a FastAPI | ✅ Hecho (PR #60) · falta `context/06` (abajo) |

Las pruebas están en `tests/test_correcciones_sprint1.py`. **Revisa los cambios en `sema/auth.py`, `sema/main.py` y `sema/students.py`** antes de tocar esos archivos, para no deshacerlos.

---

## 2. Pendiente: PR de limpieza (hoy)

Rama `chore/limpieza-backend` desde `develop`:

- [ ] **C5 · Quitar los archivos de auditoría.** Entraron a `develop` con el PR #58: `INFORME_AUDITORIA_BACKEND.md`, `INFORME_CIERRE_SPRINT_BACKEND.md`, `context/CODEX_BACKEND.md`, `evidencias/` y `scripts/capturas_backend.py`. Si quieres conservarlos, muévelos a `docs/backend/`. Con esto también se resuelve la URL mal escrita del informe (C9).
- [ ] **C7 · `context/06_Especificacion_API.md`:** cambia los encabezados que aún dicen `routes/cuenta.js`, `routes/listas.js`, `routes/resumen.js`, `routes/catalogos.js` y `routes/configuracion.js` por el módulo de Python que vas a usar (por ejemplo `sema/cuenta.py`).
- [ ] **C8 · Retirar Express:** borra `server.js`, `routes/`, `lib/auth.js` y `lib/db.js`, y quita `express`, `better-sqlite3`, `bcryptjs`, `jsonwebtoken` y `dotenv` de `dependencies`. **Conserva** `lib/schema.sql`, que usa `sema/db.py`, y `exceljs`, que usa el anonimizador de Uziel (puede pasar a `devDependencies`). Revisa que `npm test` siga pasando, porque `test/base.test.js` puede depender de Express.
- [ ] El `package.json` usa rutas de Windows (`.venv\\Scripts\\python.exe`). Está bien porque el equipo y el cliente usan Windows; solo menciónalo en `RUN_BACKEND.md`.

---

## 3. Pendientes

### Arrastrado del Sprint 1 (urgente: bloquea a Matías)
- [ ] **#20 · [HU-17] API del detalle del alumno**
  - `GET /api/alumnos/{matricula}`: datos generales, `motivoTexto`, alertas, listas, materias con actividades, calificación, faltas/límite/% y estados, y `evolucion` con su tendencia. Usa la tendencia ya corregida (C2) de `sema/students.py`.
  - `PUT /api/alumnos/{matricula}/nombre` (marca `nombre_corregido = 1`).
  - Materias de peor a mejor, bajas al final; `404` si no existe; errores con `{error, code}`.
  - Pruebas con `test/fixtures/monitoreo-muestra.xlsx`.

### Sprint 2, en Python dentro de `sema/`
| Prioridad | Issue | Tarea | Pts | Nota |
|---|---|---|---|---|
| 1 | **#20** | API del detalle | 3 | **Hoy** |
| 2 | **#32** | API de cuenta: usuario y contraseña | 2 | La contraseña D-04 es pública. Desbloquea #33 de Matías |
| 3 | **#34** | API del Resumen administrativo | 5 | `inicio.js` ya llama a `/api/resumen`. Desbloquea #35 y #36 |
| 4 | #41 | Umbrales configurables (con Matías) | 3 | Validaciones de `context/06` §9 |
| 5 | #27 | API del Excel de lista de seguimiento | 5 | Reutiliza `key()` y `clean()` de `sema/excel.py` |
| 6 | #39 | Historial de cargas | 3 | *Puede recortarse* |
| 7 | #30 | Renombrar, reemplazar y eliminar listas | 2 | *Puede recortarse* |
| 8 | #43 | Respaldo y borrado de datos | 2 | *Puede recortarse* |

Coordina con Uziel: su #49 (`PUT /api/cuenta/preferencias`) va en el mismo módulo `cuenta` que tu #32.

---

## 4. Cómo entregar
1. **Hoy:** PR `chore/limpieza-backend` → `develop`, y después `feature/20-api-detalle` → `develop`.
2. Un PR por issue, con base `develop`, `Closes #n` y el resultado de las pruebas.
3. Antes de cada PR: `.\.venv\Scripts\python.exe -m pytest -q tests` y `npm test`.
4. En la revisión de #20, explica brevemente `sema/indicators.py` al equipo (Uziel lo está validando en #13).
