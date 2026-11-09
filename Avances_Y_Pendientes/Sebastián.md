# Sebastián Huesca Ramírez · Backend

**Fecha de revisión:** lunes 9 de noviembre de 2026 · **Revisó:** Calixto Isaac (Scrum Master)

> Las APIs que te faltaban y el PR de limpieza ya están en la rama **`main`** (PR #68). El Scrum Master las hizo como suplente para no atrasar la entrega. Tu trabajo ahora es **revisarlas en el PR #68, entenderlas y poder explicarlas**, porque vas a dar soporte al backend en las pruebas con el cliente.

---

## 1. Tareas completadas

| Issue | Estado | Nota |
|---|---|---|
| **#4, #12, #14, #19** · Cuenta, lector del Excel, importación y alumnos | ✅ Integrado (PR #58) | |
| Migración a FastAPI y C1–C4, C6, C7 | ✅ Integrado (PR #58 y #60) | |
| **#20** · API del detalle y corrección de nombre | ✅ Integrado (PR #68) | `sema/students.py`. Trae además `faltasNuevas` y la evolución por corte |
| **#32** · API de cuenta y contraseña | ✅ Integrado (PR #68) | `sema/cuenta.py`. Cambiar el usuario devuelve un token nuevo; la contraseña se valida en bytes (máximo 72, límite de bcrypt) |
| **#34** · API del Resumen administrativo | ✅ Integrado (PR #68) | `sema/resumen.py` |
| **#41** · Umbrales configurables | ✅ Integrado (PR #68) | `sema/configuracion.py`, con vista previa |
| **#27, #30** · Listas de seguimiento | ✅ Integrado (PR #68) | `sema/listas.py` y `parse_list()` en `sema/excel.py` |
| **#39** · Historial de cargas | ✅ Integrado (PR #68) | `GET /api/importaciones` en `sema/imports.py`. Las listas también quedan registradas |
| **#43** · Respaldo y borrado | ✅ Integrado (PR #68) | `sema/datos.py`. El respaldo usa `sqlite3.backup()` con el candado de escritura |
| **PR de limpieza** (C5, C7, C8) | ✅ Integrado (PR #68) | Informes en `docs/backend/`; `context/06` con módulos de Python; Express retirado y `exceljs` en `devDependencies` |

### Qué revisar en el código

- **`sema/main.py`:** `exportar` se registra **antes** que `students`, porque si no, `/api/alumnos/exportar` lo captura `/api/alumnos/{matricula}`. Además, todo lo que no es `/api` responde con `Cache-Control: no-cache`.
- **`sema/students.py`:** tiene funciones compartidas por el resumen, la exportación y los umbrales:
  - `resolve_period()` obtiene el periodo actual.
  - `cut_imports()` arma los cortes, uno por día.
  - `student_summaries()` calcula los resúmenes de alumnos.
  - `display_name()` aplica el formato de nombres.
- **`sema/manual.py`:** las materias manuales usan cursos `MAN-<alumno>-<materia>`. Una carga en modo reemplazar no las borra (está probado).
- **Pruebas nuevas, una por issue:** `test_detalle.py`, `test_cuenta.py`, `test_resumen.py`, `test_configuracion.py`, `test_listas.py`, `test_historial.py`, `test_datos.py` y `test_manual.py`.

---

## 2. Pendientes

| Prioridad | Tarea | Nota |
|---|---|---|
| **1 · hoy** | `git checkout main && git pull` y revisar en el PR #68 el código de la tabla de arriba | Corre `pytest` (85 pruebas) y prueba los endpoints en `http://127.0.0.1:3000/docs` |
| 2 | Acompañar a Saraí en la validación con el Excel real (#18) | Si el Excel real trae columnas o códigos nuevos, ajusta `sema/excel.py` y agrega la prueba |
| 3 | **#47** · Corregir los errores de backend que salgan en las pruebas con el cliente | 5 pts compartidos |

---

## 3. Cómo entregar
1. Rama nueva desde **`main`** actualizado para cada corrección (`fix/<n>-<nombre>`), según D-23.
2. Un PR por issue, con base **`main`**, `Closes #n` y el resultado de las pruebas.
3. Antes de cada PR: `.\.venv\Scripts\python.exe -m pytest -q tests` y `npm test`.
