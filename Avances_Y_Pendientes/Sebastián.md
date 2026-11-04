# Sebastián Huesca Ramírez · Backend

**Fecha de revisión:** 4 de noviembre de 2026 · **Revisó:** Calixto Isaac (Scrum Master)
**Ramas revisadas:** `chore/migracion-fastapi` → `feature/4-cuenta-jwt` → `feature/12-lector-monitoreo` → `feature/14-importacion-monitoreo` → `feature/19-api-alumnos` (`e78da50`)

> **Decisión D-01 actualizada:** el cambio de stack a **Python + FastAPI** queda **aprobado por el Scrum Master** (4 nov 2026). Todo el backend nuevo se escribe en `sema/` (Python). Las referencias a `routes/*.js`, `multer`, `exceljs` y `npm run …` de los issues se leen como su equivalente en Python.

---

## 1. Resumen

| | |
|---|---|
| Pruebas | **25/25 pasan** (verificado de nuevo por el Scrum Master) |
| Integración con el resto del equipo | Sin conflictos con las ramas de Matías (#5, #7, #8) ni de Uziel (#9) |
| Prueba completa | Servidor FastAPI + login de Matías + Excel de prueba de Uziel: 115 filas, 15 alumnos, 1 baja, 0 advertencias; listado correcto |
| Privacidad | Sin bases de datos, Excel ni secretos en sus commits |
| Estado | **Listo para PR después de las correcciones C1–C3** |

---

## 2. Tareas completadas (código terminado y verificado, falta integrar a `develop`)

| Issue | Tarea | Resultado |
|---|---|---|
| **#4** | [T-03] Cuenta por defecto "Chuchito" y secreto JWT | ✅ Cuenta inicial con bcrypt, `/auth/status` y `/auth/setup` eliminados, `/auth/me` con `passwordPorDefecto`, `tema` y `formatoNombre`, secreto en `data/jwt.secret`, servidor en `127.0.0.1`, `scripts/reset_password.py`, `/api/health`. **Pendiente: C1 y C3.** |
| **#12** | [T-04] Lector del Excel de monitoreo | ✅ Encabezados desplazados (primeras 10 filas), `Modalidad` duplicada por posición, columnas obligatorias, códigos NE/SD/SC/DA, fechas `DD-MM-YYYY`, advertencias, sin "Deuda del alumno". Excel real: 3,664 filas y 490 alumnos en 1.2 s (meta < 3 s). |
| **#14** | [HU-06] API de previsualización y confirmación | ✅ `.xlsx` de máximo 15 MB (413/415/422), previa con 20 filas, muestra paginada, confirmar `fusionar`/`reemplazar` en una sola transacción, `cortes_alumno`, no sobrescribe nombres corregidos ni inscripciones manuales, `DELETE` descarta. Previa + confirmación en 1.6 s (meta < 5 s). |
| **#19** | [HU-13] API de alumnos | ✅ `GET /api/alumnos?lista=&periodo=` con `nombreMostrar`, `faltasPeorMateria`, `motivoEstado`, `alertas`, totales y umbrales de `configuracion`. 5,000 alumnos en 0.14 s (meta < 300 ms). **Pendiente: C2.** |
| extra | Migración a FastAPI (`chore/migracion-fastapi`) | ✅ Un solo servidor sirve `/`, `/app`, `public/` y `/api`. Reutiliza `lib/schema.sql` de Uziel sin borrar cuentas. |

---

## 3. Correcciones obligatorias antes del PR

Hazlas en `feature/19-api-alumnos`, que es la punta de la pila.

- [ ] **C1 · Formato de errores de validación** (`sema/main.py`)
  Cuando falta un campo o llega un tipo inválido (login vacío, `?lista=abc`, `confirmar` sin `modo`), FastAPI responde `422 {"detail":[…]}`. El contrato (`context/06`) pide `{ "error": "…", "code"?: "…" }`, y el 422 está reservado para el formato del Excel. El frontend de Matías lee `err.message` y no mostraría nada.
  → Agregar un `@app.exception_handler(RequestValidationError)` que responda `400 {"error":"Datos incompletos o inválidos.","code":"VALIDACION"}` y una prueba para él.

- [ ] **C2 · Tendencia contra el corte anterior del periodo** (`sema/students.py`, líneas 32–36)
  Hoy se toman los 2 últimos cortes de cada alumno. Según `context/07` §9.2, se compara contra el **corte anterior del periodo**, y si el alumno no estaba en esa carga la tendencia es `sin_historial`.
  → Calcular primero los dos últimos días con importación aplicada del periodo (la última carga de cada día) y comparar cada alumno solo contra esas dos. Prueba: alumno presente en las cargas 1 y 3 pero ausente en la 2 → `sin_historial`.

- [ ] **C3 · El límite de intentos cuenta los logins correctos** (`sema/auth.py`, líneas 75–79)
  El login correcto número 11 en 15 minutos responde 429.
  → Registrar el intento solo cuando la contraseña falla, y limpiar el contador después de un login correcto. Prueba: 11 logins correctos seguidos → todos 200.

## 4. Correcciones a la documentación y limpieza

- [ ] **C4 · `RUN_BACKEND.md` para Windows:** el cliente usa Windows. Agregar `py -m venv .venv`, `.venv\Scripts\python -m pip install -r requirements.txt` y `.venv\Scripts\python -m uvicorn sema.main:app --host 127.0.0.1 --port 3000`. Indicar la versión mínima de Python (el código necesita 3.10 o superior; se recomienda 3.12).
- [ ] **C5 · No subir a `develop` los archivos de auditoría:** `INFORME_AUDITORIA_BACKEND.md` (obsoleto, lo dice el propio informe), `INFORME_CIERRE_SPRINT_BACKEND.md`, `context/CODEX_BACKEND.md`, `evidencias/*.png` y `scripts/capturas_backend.py`. Borrarlos de la rama o moverlos a `docs/backend/`.
- [ ] **C6 · Prueba con el Excel de Uziel:** después de integrar #9, agregar una prueba con `test/fixtures/monitoreo-muestra.xlsx`. Resultado esperado: 115 filas, 15 alumnos, 37 materias, 78 cursos, 1 baja y 0 advertencias.
- [ ] **C7 · Actualizar la documentación técnica a FastAPI:** `README.md` (sección de arranque), `context/03_Arquitectura_Convenciones.md` (capas y carpetas `sema/`) y `context/06_Especificacion_API.md` (cambiar `routes/*.js` por los módulos `sema/*.py`). D-01 lo registra el Scrum Master.
- [ ] **C8 · Retirar Express (PR aparte, después del merge):** borrar `server.js`, `routes/`, `lib/auth.js` y `lib/db.js`, y quitar `express`, `better-sqlite3` y `bcryptjs` de las dependencias de producción. **Conservar** `lib/schema.sql`, que usa `sema/db.py`, y `exceljs`, que usa el anonimizador de Uziel en desarrollo. Rama sugerida: `chore/retirar-express`.
- [ ] **C9 · Corregir en el informe la URL del repositorio:** `Calixtolsaac` → `CalixtoIsaac`.

**Menor:** el parámetro `todas` de `GET /importaciones/:id/muestra` se ignora. La muestra ya trae todas las columnas permitidas, así que basta con documentarlo.

> En la revisión del PR, Sebastián explicará brevemente `sema/imports.py` y `sema/indicators.py`. Así todo el equipo puede dar mantenimiento al código generado con Codex.

---

## 5. Pendientes

### Arrastrado del Sprint 1 (urgente: el sprint cerró el 1 nov)
- [ ] **#20 · [HU-17] API del detalle del alumno**. No se entregó y bloquea la vista de detalle de Matías (#25).
  - `GET /api/alumnos/:matricula`: datos generales, `motivoTexto`, alertas, listas, materias con actividades, calificación, faltas/límite/% y estados, y `evolucion` con su tendencia. Usar la misma lógica corregida de C2.
  - `PUT /api/alumnos/:matricula/nombre` (marca `nombre_corregido = 1`).
  - Materias ordenadas de peor a mejor y bajas al final; `404` si no existe.

### Sprint 2 (2–8 nov), en Python dentro de `sema/`
| Issue | Tarea | Pts | Nota |
|---|---|---|---|
| #32 | API de cuenta: usuario y contraseña | 2 | **Prioridad alta:** hoy no hay forma de cambiar la contraseña por defecto (D-04 es pública) |
| #27 | API del Excel de lista de seguimiento | 5 | Reutilizar `key()` y `clean()` de `sema/excel.py` |
| #30 | Renombrar, reemplazar y eliminar listas | 2 | |
| #34 | API del Resumen administrativo | 5 | Matías ya llama a `/api/resumen` desde `inicio.js` |
| #39 | Historial de cargas (`GET /api/importaciones`) | 3 | |
| #41 | Umbrales configurables (junto con Matías) | 3 | Validaciones de `context/06` §9 |
| #43 | Respaldo y borrado de datos | 2 | |

---

## 6. Cómo entregar

1. Hacer C1, C2, C3, C4, C5 y C9 en `feature/19-api-alumnos`, correr `pytest -q tests` y hacer push.
2. Abrir **un solo PR**: `feature/19-api-alumnos` → `develop`, titulado "Backend FastAPI: #4, #12, #14, #19". En el texto, la lista de correcciones y el resultado de las pruebas.
3. **No borrar** las ramas intermedias hasta que el PR se integre.
4. Después del merge: C6, C7 y C8 en PR aparte, y luego #20 y #32.
