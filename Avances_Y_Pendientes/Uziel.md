# Uziel Armando García Duarte · Base de datos y estructura

**Fecha de revisión:** jueves 5 de noviembre de 2026 · **Revisó:** Calixto Isaac (Scrum Master)
**Usuario de GitHub:** `Elreydelsubzero`

> **Desde hoy:** toda rama nueva sale de `develop` actualizado y su PR va hacia `develop` (decisión D-21).

---

## 1. Tareas completadas

| Issue | Estado | Nota |
|---|---|---|
| **#3** · Esquema de BD v1 y migraciones | ✅ Integrado (PR #50) | `lib/schema.sql` sigue siendo tuyo. Cambios futuros: **migración v2** en `sema/db.py`, nunca editando la v1. |
| **#9** · Excel de prueba anonimizado | ✅ Integrado (PR #53) | Se usa en las pruebas del backend y del frontend. |
| **#22** · Semáforo de colores | ✅ Integrado (PR #58) | Lo hizo el Scrum Master como suplente: `public/css/semaforo.css` y `UI.badgeEstado()` en `ui-kit.js`. Revísalo para que lo conozcas: lo vas a usar en #37, #38 y #42. |

> **#24 (ordenar):** lo hizo Matías en `feature/24-ordenar`. El Scrum Master se lo reasigna en GitHub. Tú no lo hagas.

---

## 2. Correcciones y ajustes

- [ ] **#3:** confirma que el diagrama de `context/04` corresponde a `schema.sql` y marca esa casilla del issue.
- [ ] **#9:** agrega al README una línea: "Para regenerar los fixtures se necesita Node 20+: `node scripts/anonimizar-excel.js`". Avísale a Sebastián que `exceljs` debe quedarse en `package.json` (él está retirando Express).

---

## 3. Pendientes

### Arrastrado del Sprint 1 (urgente)

- [ ] **#6 · [HU-01] SEMA.bat para Python. Es lo más importante para la entrega.**
  - Verifica Python con `py -3 --version`. Si no está: "Instala Python 3.12 o superior desde python.org (marca *Add to PATH*)" y espera una tecla.
  - Si no existe `.venv`: `py -3 -m venv .venv` y `.venv\Scripts\python -m pip install -r requirements.txt`.
  - Si `http://127.0.0.1:3000/api/health` ya responde con `"app":"SEMA"`, solo abre el navegador.
  - Si no, arranca `.venv\Scripts\python -m uvicorn sema.main:app --host 127.0.0.1 --port 3000`, espera a que `/api/health` responda y abre `http://localhost:3000`.
  - Usa finales de línea CRLF. Prueba desde una ruta con espacios y acentos (por ejemplo `C:\Users\…\OneDrive\Escritorio\…`).
  - Ya no necesitas esperar al backend: FastAPI ya está en `develop`.

- [ ] **#13 · [T-05] Validar las reglas de indicadores** (`sema/indicators.py`, no reescribir en JavaScript)
  - [ ] Revisar `grade_state`, `fall_state`, `manual_grade`, `summary` y `split_name` contra `context/07` §3–§5 y §8.
  - [ ] Agregar a `tests/test_indicators_contract.py` los casos de `context/07` §11 que falten.
  - [ ] Decidir y documentar el caso ambiguo: un alumno **sin calificaciones y con 0 faltas**, en materias con límite, hoy sale `sin_datos`. ¿Debería ser `correcto` por faltas? (07 §4.3). Consúltalo con Saraí.
  - [ ] Revisar la lista de apellidos compuestos de `split_name` (Montes de Oca, Ponce de León…) contra los nombres reales del Excel, sin subir datos reales.

### Sprint 2
| Prioridad | Issue | Tarea | Pts | Nota |
|---|---|---|---|---|
| 1 | **#6** | SEMA.bat | 5 | **Hoy** |
| 2 | #13 | Validar indicadores | 5 | Viernes |
| 3 | #49 | Preferencias: tema y formato de nombres | 5 | `PUT /api/cuenta/preferencias` en Python. Coordina con Sebastián (#32 usa el mismo módulo) |
| 4 | #26 | Índices y prueba con 5,000 alumnos | 2 | Sebastián midió 0.14 s. Revisa los índices de `schema.sql` y documenta el resultado |
| 5 | **#44** | Pruebas en un Windows limpio | 2 | Instalar Python y probar SEMA.bat. **Sábado** |
| 6 | #38 | Tabla de alumnos con mayor riesgo | 2 | Usa `UI.badgeEstado()` |
| 7 | #31 | Alta manual de alumnos y materias | 5 | API en Python (`sema/manual.py`) |
| 8 | #37 | Evolución del desempeño por carga | 4 | Reutiliza la tendencia corregida. *Puede recortarse* |
| 9 | #42 | Exportar la tabla a Excel/CSV | 3 | `openpyxl`, que ya está en `requirements.txt`. *Puede recortarse* |

---

## 4. Cómo entregar
1. **Hoy:** rama `feature/6-sema-bat` desde `develop` y su PR.
2. #13: rama `test/13-validar-indicadores`, con las pruebas nuevas y la decisión del caso ambiguo escrita en `context/07`.
3. Antes de cada PR: `.\.venv\Scripts\python.exe -m pytest -q tests` y `npm test`.
