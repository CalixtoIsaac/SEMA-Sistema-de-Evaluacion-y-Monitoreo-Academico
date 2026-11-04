# Uziel Armando García Duarte · Base de datos y estructura

**Fecha de revisión:** 4 de noviembre de 2026 · **Revisó:** Calixto Isaac (Scrum Master)
**Usuario de GitHub:** `Elreydelsubzero`

> **Decisión D-01 actualizada:** el backend pasa a **Python + FastAPI**, con aprobación del Scrum Master (4 nov 2026). Afecta a tres de tus tareas: **SEMA.bat (#6)**, las **reglas de indicadores (#13)** y las **API del Sprint 2** (#31, #42, #49). Abajo va el detalle.

---

## 1. Tareas completadas

| Issue | Tarea | Estado | Verificación |
|---|---|---|---|
| **#3** | [T-02] Esquema de base de datos v1 y migraciones | ✅ **Integrado en `develop`** (PR #50, `553c82a`) | `lib/schema.sql` con 13 tablas, índices y llaves foráneas. El backend FastAPI lo reutiliza directamente desde `sema/db.py`. |
| **#9** | [T-06] Excel de prueba anonimizado | ✅ Terminado en `feature/9-anonimizar-excel` (`dff786d`), **falta PR** | 16/16 pruebas de Node pasan. Fixtures revisados: matrículas `T9xxxxxxx`, nóminas `L9xxxxxxx`, nombres ficticios y "Deuda del alumno" vacía. El lector de Sebastián lo lee sin advertencias (115 filas, 15 alumnos). |

---

## 2. Correcciones y ajustes por el cambio de stack

- [ ] **#3 · Responsabilidad sobre el esquema:** `lib/schema.sql` sigue siendo tuyo. `lib/db.js` se retirará (Sebastián, C8) y la migración ahora vive en `sema/db.py`. Cualquier cambio futuro del esquema va como **migración v2** en `sema/db.py`, nunca editando la v1. Confirma que el diagrama de `context/04` corresponde a `schema.sql` y marca esa casilla del issue.
- [ ] **#9 · Anonimizador:** puede quedarse en Node (usa `exceljs`). Es una herramienta **solo de desarrollo** y el cliente no la necesita. Agrega una línea al README: "Para regenerar los fixtures se necesita Node 20+: `node scripts/anonimizar-excel.js`".
- [ ] **GitHub #12:** el issue #12 aparece asignado a ti, pero el lector lo hizo Sebastián (`sema/excel.py`). Reasígnalo a Sebastián. No hagas un segundo lector.

---

## 3. Pendientes

### Arrastrado del Sprint 1 (urgente)

- [ ] **#6 · [HU-01] SEMA.bat, rehecho para Python**
  - Verifica Python con `py -3 --version`. Si no está: "Instala Python 3.12 o superior desde python.org (marca *Add to PATH*)" y espera una tecla.
  - Si no existe `.venv`: `py -3 -m venv .venv` y `.venv\Scripts\python -m pip install -r requirements.txt`.
  - Crea `.env` si no existe.
  - Si `http://127.0.0.1:3000/api/health` ya responde con `"app":"SEMA"`, solo abre el navegador.
  - Si no, arranca `.venv\Scripts\python -m uvicorn sema.main:app --host 127.0.0.1 --port 3000`, espera a que `/api/health` responda y abre `http://localhost:3000`.
  - Usa finales de línea CRLF. Prueba desde una ruta con espacios y acentos (por ejemplo `C:\Users\…\OneDrive\Escritorio\…`).

- [ ] **#13 · [T-05] Reglas de indicadores, redefinido**
  Sebastián ya implementó estas reglas en Python (`sema/indicators.py`: `grade_state`, `fall_state`, `manual_grade`, `summary`, `split_name`), con pruebas en `tests/test_indicators_contract.py`. **No las reescribas en JavaScript.** Tu tarea ahora es **validar y completar**:
  - [ ] Revisar `sema/indicators.py` contra `context/07` §3–§5 y §8, y aprobar o comentar en el PR de Sebastián.
  - [ ] Agregar a `tests/test_indicators_contract.py` todos los casos de `context/07` §11 que falten.
  - [ ] Decidir y documentar este caso ambiguo: un alumno **sin calificaciones y con 0 faltas** en materias con límite hoy sale `sin_datos`. ¿Debe ser `correcto` por faltas? (07 §4.3)
  - [ ] Revisar la lista de apellidos compuestos de `split_name` (Montes de Oca, Ponce de León, etc.) con los nombres reales del Excel, sin subir datos reales.
  - `ordenarAlumnos()` se queda en el navegador (`context/06` §6); eso es tu #24.

- [ ] **#22 · [HU-16] Semáforo de colores**: `public/css/semaforo.css` y `UI.badgeEstado()`. No cambia con el stack.

### Sprint 2 (2–8 nov)
| Issue | Tarea | Pts | Nota por el cambio de stack |
|---|---|---|---|
| #24 | Ordenar de peor a mejor por promedio y/o faltas | 3 | JavaScript en el navegador (sin cambio) |
| #26 | Índices y prueba con 5,000 alumnos | 2 | Sebastián ya midió 0.14 s con 5,000 alumnos. Revisa los índices de `schema.sql` y documenta el resultado |
| #31 | Alta manual de alumnos y materias (API + formulario) | 5 | **La API va en Python** (`sema/students.py` o un módulo nuevo `sema/manual.py`) |
| #49 | Preferencias: tema y formato de nombres | 5 | `PUT /api/cuenta/preferencias` en Python. Coordina con Sebastián (#32 usa el mismo router `cuenta`) |
| #37 | Evolución del desempeño por carga (M-05) | 4 | Reutiliza la tendencia corregida de Sebastián (C2) |
| #38 | Tabla de alumnos con mayor riesgo | 2 | |
| #42 | Exportar la tabla a Excel/CSV | 3 | En Python con `openpyxl`, que ya está en `requirements.txt` |
| #44 | Pruebas en un Windows limpio | 2 | **Ahora incluye instalar Python** y probar el nuevo SEMA.bat |

---

## 4. Cómo entregar
1. **Hoy:** abre el PR `feature/9-anonimizar-excel` → `develop`, titulado "#9 Excel de prueba anonimizado".
2. Para #6: rama `feature/6-sema-bat`, después de que se integre el backend FastAPI.
3. Para #13: comenta y aprueba en el PR de Sebastián; tus pruebas nuevas van en `test/13-validar-indicadores`.
