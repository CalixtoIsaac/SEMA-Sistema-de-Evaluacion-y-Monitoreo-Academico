# Cierre de auditoría local · backend SEMA

> **Archivado (9 nov 2026, G5):** informe histórico de la migración a FastAPI. Ya no describe el estado actual del código.

Fecha: 3 de noviembre de 2026. Rama base remota observada: `origin/develop` en `20ad569`. Las cinco ramas locales se reubicaron sobre esa base; no se hizo merge a `develop` ni se abrió PR.

## Alcance y limitación de la skill

Se buscó `$auditar-sema-backend` en las skills disponibles y en el equipo, sin encontrar `SKILL.md`. La auditoría se ejecutó directamente contra el prompt local, `context/06`, `context/07`, `context/08`, el esquema SQLite y los issues publicados. Este informe no afirma haber aplicado instrucciones de esa skill ausente.

## Resultado por rama

| Rama | Auditoría | Pruebas aisladas | Correcciones |
| --- | --- | --- | --- |
| `chore/migracion-fastapi` | Aprobada | 2 pasan | Migración v1 atómica y conservación de cuentas existentes. |
| `feature/4-cuenta-jwt` | Aprobada para backend | 4 pasan | Intentos de login aislados por aplicación; bcrypt, JWT, secreto persistente y reset verificados. |
| `feature/12-lector-monitoreo` | Aprobada técnicamente | 7 pasan | Detección de encabezados en las primeras 10 filas y duplicados normalizados. |
| `feature/14-importacion-monitoreo` | Aprobada | 15 pasan | La carga ya no modifica inscripciones manuales; cortes de bajas y materias críticas; reglas Python verificadas con casos de #13. |
| `feature/19-api-alumnos` | Aprobada | 25 pasan | Listado de altas manuales, tendencias, totales y exclusión de campo interno verificados. |

Los commits exactos se consultan con `git log --oneline origin/develop..feature/19-api-alumnos`; las ramas son apiladas en el orden de la tabla. Para revisar cada diff: `git diff origin/develop..chore/migracion-fastapi`, luego `git diff chore/migracion-fastapi..feature/4-cuenta-jwt`, y así sucesivamente.

## Reglas del issue #13 y coordinación

El [issue #13](https://github.com/CalixtoIsaac/SEMA-Sistema-de-Evaluacion-y-Monitoreo-Academico/issues/13) continúa abierto y asignado a Uziel; no hay una implementación suya integrada en `origin/develop`. La única lógica usada por FastAPI está en `sema/indicators.py`. Las pruebas `tests/test_indicators_contract.py` contrastan los casos de `context/07` §11: límites de promedio (80/70), faltas por porcentaje y regla fija, `Ponderado` oficial, `SD`, cálculo manual con `NE`/`SC`, bajas, alertas y nombres con partículas y apellidos compuestos. `tests/test_students.py` añade tendencia y promedio manual a través de la API. Falta comparar con código futuro de Uziel cuando se integre; no se afirma paridad binaria con una versión JavaScript inexistente en la rama base. `ordenarAlumnos()` pertenece al navegador según `context/06` §6 y no se duplicó en el backend.

## Login de Matías y asignación de #12

La API de #4 responde `200` en login y `/auth/me`; `/auth/status` responde `404` como exige el contrato. `public/js/login.js` de Matías todavía llama `/auth/status` al cargar y deja el formulario de inicio oculto tras ese error. Para completar el flujo visual debe quitar esa consulta y el formulario de creación de cuenta, mostrando directamente el formulario de login. No se modificó su frontend. Esta dependencia visual queda pendiente aunque el backend de #4 pase su auditoría.

[GitHub #12](https://github.com/CalixtoIsaac/SEMA-Sistema-de-Evaluacion-y-Monitoreo-Academico/issues/12) muestra como asignado a `Elreydelsubzero`, mientras `context/Sprints.md` en `origin/develop` asigna #12 a Sebastián. El usuario incluyó expresamente #12 en este trabajo; la rama técnica se conserva. El equipo debe corregir la asignación y evitar una segunda implementación del lector al integrar.

## Funcionamiento de importación y listado

- Previa autenticada, 20 filas iniciales, muestra paginada de 50, 415/413/422, columnas prohibidas excluidas y ninguna escritura académica antes de confirmar.
- Confirmación `fusionar` y `reemplazar` transaccional; reemplazo limitado a inscripciones Excel del periodo. Una segunda confirmación da 409. Pruebas de rollback por fallo inducido, bajas, correcciones de nombre y preservación de inscripción manual.
- Listado autenticado por periodo y lista, `Ponderado`, `SD`, faltas por peor materia, umbrales de `configuracion`, promedio manual, totales y tendencia. Búsqueda, orden visual, filtros y paginación siguen siendo tarea del navegador.
- Ensayo con Excel real **solo en directorio local externo y BD temporal**: previa 1.222 s, confirmación 0.348 s, 3,664 inscripciones y 490 alumnos. `GET /api/alumnos` después de esa carga: 490 filas, suma de totales 490, 0.051 s. No se registraron filas reales ni se copió esa BD a `data/app.db`.
- Ensayo con 5,000 alumnos sintéticos: `GET /api/alumnos` 200, 5,000 filas, 0.137 s. Entorno: Linux x86_64, Python 3.14.7; tiempos de una ejecución local.

Comandos de verificación:

```bash
.venv/bin/python -m pytest -q tests
(script retirado en la limpieza del 9 nov 2026)
git diff --check origin/develop..feature/19-api-alumnos
```

Las 25 pruebas de la rama final pasaron; se observan advertencias de deprecación de dependencias con Python 3.14. No se incorporaron archivos `.xlsx`, bases SQLite, secretos ni datos reales a commits. `data/app.db` es la base de desarrollo creada desde `lib/schema.sql` y está ignorada.

## Capturas técnicas con fixture ficticio

Las imágenes son **vistas de evidencia generadas a partir de respuestas HTTP reales de TestClient**, no capturas de la interfaz de producto. Se intentó capturar el navegador local; Firefox headless falló al crear el framebuffer y el navegador de automatización no estaba disponible. El script reproducible usa una BD temporal y dos matrículas ficticias.

- Las capturas técnicas de esta auditoría se retiraron del repositorio en la limpieza del 9 nov 2026 (G5).

## Pendientes de integración

1. Matías: retirar `/auth/status` y `/auth/setup` del login y verificarlo en navegador.
2. Saraí y Uziel: conciliar la asignación de #12 y revisar el port Python de las reglas del #13 cuando exista su código.
3. Saraí: actualizar README y decisiones de stack/arranque. El servidor Node quedó como referencia de transición; su retiro es un cambio separado.
4. El acceso SQLite usa una conexión compartida con escrituras serializadas; reevaluar aislamiento de lecturas si la aplicación deja de ser local y monousuario.

## Estado de publicación remota

El 3 nov 2026 se intentó publicar primero `chore/migracion-fastapi`; Git devolvió `fatal: could not read Username for 'https://github.com'`. La prueba SSH devolvió `Permission denied (publickey)`. La integración de GitHub disponible en el entorno no estaba conectada. **No se subió ninguna rama**. No se usó `--force`, no se hizo merge y no se abrió PR.

Cuando haya autenticación, publicar y verificar en este orden, sin omitir ramas intermedias:

```bash
git push -u origin chore/migracion-fastapi
git push -u origin feature/4-cuenta-jwt
git push -u origin feature/12-lector-monitoreo
git push -u origin feature/14-importacion-monitoreo
git push -u origin feature/19-api-alumnos
```

Antes de reanudar, comprobar que `origin/develop` no haya avanzado y repetir las pruebas si cambia la base o se modifica alguna rama.
