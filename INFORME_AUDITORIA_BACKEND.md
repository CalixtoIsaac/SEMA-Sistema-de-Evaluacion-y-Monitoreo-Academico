# Informe local de auditoría · backend SEMA · 3 nov 2026

## Estado de partida y ramas

`develop` y `origin/develop` apuntaban a `553c82a` (esquema SQLite v1); había dos archivos de instrucciones locales sin seguimiento. Express, `lib/schema.sql` y las pruebas Node eran la base. No había código de #13 integrado. Los issues [#4](https://github.com/CalixtoIsaac/SEMA-Sistema-de-Evaluacion-y-Monitoreo-Academico/issues/4), [#12](https://github.com/CalixtoIsaac/SEMA-Sistema-de-Evaluacion-y-Monitoreo-Academico/issues/12), [#14](https://github.com/CalixtoIsaac/SEMA-Sistema-de-Evaluacion-y-Monitoreo-Academico/issues/14) y [#19](https://github.com/CalixtoIsaac/SEMA-Sistema-de-Evaluacion-y-Monitoreo-Academico/issues/19) coinciden en número y propósito con el prompt. #12 aparece asignado en GitHub a otra persona; verificar reparto antes de integrar.

| Rama | Base | Commit | Diff para auditar |
| --- | --- | --- | --- |
| `chore/migracion-fastapi` | `553c82a` | `d9caef9` | `git show --stat d9caef9` |
| `feature/4-cuenta-jwt` | `d9caef9` | `c6ca200` | `git show --stat c6ca200` |
| `feature/12-lector-monitoreo` | `c6ca200` | `afca8ba` | `git show --stat afca8ba` |
| `feature/14-importacion-monitoreo` | `afca8ba` | `daf2b80` | `git show --stat daf2b80` |
| `feature/19-api-alumnos` | `daf2b80` | ver `git log -1` | `git diff daf2b80..HEAD --stat` |

Las ramas son apiladas: cada una depende de la anterior. Tras integrar la base en `develop`, reubicar las dependientes antes de PRs separados. No hubo push, merge ni PR.

## Cambios y contratos

- **Transición:** `sema/main.py`, `sema/db.py`, `requirements.txt`, `RUN_BACKEND.md`, `.gitignore`, `tests/test_base.py`, `context/CODEX_BACKEND.md`. FastAPI en `127.0.0.1:3000` sirve `/`, `/app`, `public/` y `/api/health`. `open_db` conserva esquema v1, FK, WAL y `user_version`; no ejecuta el `DROP usuarios` del arranque Node. Se verificó base nueva y copia temporal de una existente. Node sigue en el repositorio solo como referencia; el comando nuevo está en `RUN_BACKEND.md`.
- **#4:** `sema/auth.py`, `scripts/reset_password.py`, `tests/test_auth.py`. Si no existe cuenta, crea una sola con bcrypt costo 10. Login y `me` usan JSON `camelCase`, JWT HS256 con vencimiento de 8 h, usuario vigente y secreto persistente. Las rutas `status` y `setup` ya no están en FastAPI. Reset conserva datos académicos. El login HTML actual sigue llamando ambas rutas retiradas; Matías debe mostrar directamente el formulario de login y quitar el formulario setup en `public/js/login.js` y `public/login.html`.
- **#12:** `sema/excel.py`, `tests/test_excel.py`. Lector puro con `openpyxl`: encabezados normalizados, dos modalidades por posición, códigos, fechas, duplicados y avisos. Las dos columnas prohibidas se excluyen antes de construir filas, previa y JSON.
- **#14:** `sema/imports.py`, `sema/indicators.py`, `tests/test_imports.py`. Previa autenticada, límite 15 MB, 415/413/422, 20 filas; muestra paginada de 50; descarte; confirmación atómica con upserts, sustitución de actividades, reemplazo restringido a inscripciones Excel del periodo y cortes. Repetición da 409; un trigger de fallo verificó rollback. La lógica Python de indicadores y nombres se portó de `context/07` porque #13 no estaba integrada; Uziel debe revisar paridad y completar casos de apellidos compuestos.
- **#19:** `sema/students.py`, `tests/test_students.py`; reutiliza `summary()` de `sema/indicators.py`, devuelve contrato `AlumnoResumen`, filtros por periodo/lista, totales y tendencia. Consultas agrupadas sin una consulta por alumno. Búsqueda, filtro visual, orden y paginación quedan en el navegador según `context/06`.

## Verificación

Entorno: Linux Fedora kernel 7.1.12, x86_64, Python 3.14.7. Instalación en `.venv` con `requirements.txt` fijado. Comandos:

```bash
.venv/bin/python -m pytest -q tests
.venv/bin/python -m uvicorn sema.main:app --host 127.0.0.1 --port 3000
git diff --check
```

Pruebas finales: ver salida registrada al cierre de esta rama. Prueba final: 14 pruebas pasaron (advertencias de deprecación de FastAPI/Starlette en Python 3.14). La copia **temporal** de `alumnosPrepa.db` abrió con `user_version=1` y FK activas; `data/app.db` se creó desde `lib/schema.sql` y está ignorada por Git. Nunca se usó la base externa como base de la aplicación.

Excel real leído **solo localmente**, sin registrar filas: 3,664 filas válidas, 490 matrículas, 1.192 s de lectura; 92 columnas permitidas. En BD temporal: previa HTTP 1.211 s, confirmación 0.235 s, 490 alumnos y 3,664 inscripciones. GET `/api/alumnos` con 5,000 alumnos sintéticos: 0.142 s, código 200. Los tiempos son de una ejecución en la máquina descrita, no garantía de otras máquinas.

## Riesgos y pendientes de revisión

1. #13 no integrado: revisar paridad de indicadores y `split_name` con Uziel, especialmente apellidos compuestos, materias manuales y tendencia con varios cortes. El módulo Python actual es la única implementación usada por la API FastAPI.
2. La pantalla de login todavía depende de `status` y `setup`; requiere cambio de frontend antes de uso manual completo. No se modificó fuera del alcance backend.
3. La transición conserva Node para comparación. Saraí debe actualizar README, D-01, `context/03`, `06`, `08`, Sprints, comandos de instalación y referencia a `reset-password.js`; retirar Node después en un cambio separado.
4. El backend usa una conexión SQLite compartida en el proceso con escrituras serializadas. Revisar aislamiento de lecturas ante cargas simultáneas si la app deja de ser monousuario.
5. Se verificó 413 con carga sintética mayor a 15 MB, además de 415 y 422. Quedan variantes adicionales de encabezados y una migración v2 futura por probar; la v2 aún no existe.
