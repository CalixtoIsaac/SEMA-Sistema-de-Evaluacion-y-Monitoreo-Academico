# Uziel Armando García Duarte · Base de datos y estructura

**Fecha de revisión:** lunes 9 de noviembre de 2026 · **Revisó:** Calixto Isaac (Scrum Master)
**Usuario de GitHub:** `Elreydelsubzero`

> Tus pendientes de código ya están en la rama **`main`** (PR #68). El Scrum Master los terminó como suplente para no atrasar la entrega. Lo que más importa ahora es **#44: probar SEMA.bat en un Windows limpio**.

---

## 1. Tareas completadas

| Issue | Estado | Nota |
|---|---|---|
| **#3** · Esquema de BD v1 | ✅ Integrado (PR #50) | |
| **#9** · Excel de prueba anonimizado | ✅ Integrado (PR #53) | La línea para regenerar los fixtures ya está en el README |
| **#22** · Semáforo de colores | ✅ Integrado (PR #58) | Suplente: Scrum Master |
| **#6** · SEMA.bat | ✅ PR #64 + ✅ ajuste en el PR #68 | Ahora exige **Python 3.12** (antes 3.10), prueba `py -3`, `py -3.13`, `py -3.12` y `python`, y vuelve a crear un `.venv` hecho con un Python anterior. Prueba estática en `tests/test_sema_bat.py` |
| **#38** · Alumnos con mayor riesgo | ✅ Integrado (PR #65) | El Menú principal ahora le pasa el `topRiesgo` de `/api/resumen` para respetar la lista elegida |
| **#42** · Exportar a Excel/CSV | ✅ Integrado (PR #66) | El botón **Exportar** de la vista Alumnos está en `main` (PR #68) |
| **#13** · Validar indicadores | ✅ Integrado (PR #68) | Casos de `context/07` §11, apellidos compuestos y la **decisión D-22**: sin calificaciones y 0 faltas → *Sin datos*. Falta que Saraí la confirme |
| **#26** · Índices y 5,000 alumnos | ✅ Integrado (PR #68) | **Migración v2** en `sema/db.py`, con 3 índices. Resultados en `docs/rendimiento-5000.md`: 3,710 filas en 1.2 s y el buscador en menos de 1 ms |
| **#31** · Alta manual | ✅ Integrado (PR #68) | `sema/manual.py`, catálogos y la pestaña **Formulario** |
| **#37** · Evolución del desempeño | ✅ Integrado (PR #68) | En `/api/resumen` y en el detalle del alumno |
| **#49** · Preferencias | ✅ Integrado (PR #68) | `PUT /api/cuenta/preferencias`. El botón ◐ y Perfil guardan el tema en la cuenta |

---

## 2. Pendientes

| Prioridad | Issue | Tarea | Pts | Nota |
|---|---|---|---|---|
| **1 · hoy** | — | `git checkout main && git pull` y revisar en el PR #68 el código de la tabla de arriba | — | Sobre todo `sema/db.py` (migración v2), `SEMA.bat` y `tests/test_indicators_contract.py` |
| **2** | **#44** | Probar en un Windows limpio | 2 | Instala Python 3.12 desde python.org marcando *Add to PATH*. Copia la carpeta a una ruta con espacios y acentos (`…\OneDrive\Escritorio\…`) y da doble clic en `SEMA.bat`. Comprueba que crea el `.venv`, abre el navegador y no se abre dos veces si ya está corriendo. Anota los tiempos y captura cualquier error |
| 3 | #26 | Correr `scripts\rendimiento_5000.py` en tu laptop y agregar tus tiempos a `docs/rendimiento-5000.md` | — | Los tiempos actuales son de un contenedor Linux |
| 3 | #3 | Confirmar que el diagrama de `context/04` corresponde a `schema.sql` más la migración v2, y marcar la casilla del issue | — | |
| 4 | **#47** | Corregir lo que salga en las pruebas con el cliente | 5 (compartido) | |

---

## 3. Cómo entregar
1. Rama nueva desde **`main`** actualizado (`test/44-windows-limpio` si hay cambios) y PR hacia `main` (D-23).
2. Antes de cada PR: `.\.venv\Scripts\python.exe -m pytest -q tests` y `npm test`.
3. Si #44 sale bien sin cambios, deja el resultado y las capturas como comentario en el issue.
