# SEMA · Contexto breve para Codex (backend)

Actualizado: 3 de noviembre de 2026. Referencia inspeccionada: rama `develop`, commit `553c82a` (30 oct 2026). Antes de cada sesión, comprobar el estado actual de `develop` y actualizar solo los hechos que hayan cambiado.

## Decisión de tecnología y transición

**Python con FastAPI está autorizado para el backend.** Saraí, Product Owner, comunicó que se puede usar Python y que ella actualizará la información del proyecto. Esta autorización sustituye la parada por discrepancia técnica del prompt anterior. Al 3 nov 2026, `develop` (commit `553c82a`, confirmado de nuevo) y D-01 todavía describen **Node.js 20+, Express 4, SQLite (`better-sqlite3`)**. El código actual usa `server.js`, `routes/auth.js`, `lib/auth.js`, `lib/db.js`, `lib/schema.sql` y `node:test`. Coordinar la actualización de README, D-01, arquitectura, instrucciones de instalación y sprints con Saraí; el desfase documental **no detiene** la implementación autorizada. Si la rama cambia, adaptar el trabajo al estado nuevo.

Migrar el servidor a FastAPI manteniendo las rutas HTTP `/api`, JSON `camelCase`, SQLite `data/app.db` y el frontend actual. No arrancar Express y FastAPI como dos servidores finales separados. WebSockets y microservicios todavía no tienen casos de uso ni contratos definidos para #4, #12, #14 o #19: no introducirlos solo por el cambio de lenguaje; documentar necesidades concretas si surgen.

## Producto y contratos existentes

- Aplicación web local, monousuario y sin internet; API base `http://localhost:3000/api`; JSON `camelCase`; SQLite `data/app.db` (archivo generado, no versionado).
- Contratos funcionales de referencia: `context/00_Indice_y_Decisiones.md` (excepto su D-01 ya superada por la autorización de FastAPI), `04_Modelo_Datos.md`, `06_Especificacion_API.md`, `07_Reglas_Negocio_Indicadores.md`, `08_Formato_Excel_Importacion.md`, `Sprints.md`. Leer las secciones pertinentes; no cargar documentos completos en cada cambio. Referencias a archivos `.js` y `npm` describen el estado anterior y deben adaptarse a Python.
- Flujo Git: rama por issue desde `develop`, `feature/<n>-<descripcion>`, PR hacia `develop`, merge a cargo del Scrum Master. Los números de issue deben comprobarse en GitHub, ya que `context/Sprints.md` advierte que pueden diferir.
- Dependencia: #14 requiere esquema de BD (#3), lector (#12) y reglas de indicadores/nombres (#13, a cargo de Uziel). #19 depende de datos importados y de `resumenAlumno()`. La lógica JavaScript de #13 no se importa directamente en Python: acordar su interfaz y trasladar sus reglas una sola vez a Python con pruebas de paridad.
- Alcance de Sebastián indicado para esta entrega: #4 cuenta/JWT, #12 lector Excel, #14 previa/confirmación, #19 listado alumnos. `context/Sprints.md` también le asigna #20 detalle, fuera del alcance inmediato de este prompt.

## Reglas esenciales

- Materia: `Ponderado` es la calificación oficial; nunca promediar A1–A50 para sustituirlo. `SD` da estado crítico sin promedio numérico. `BT` es baja y no cuenta para promedio, faltas ni gráficas.
- Promedio general: media simple de las calificaciones numéricas de materias vigentes; `null` si no hay ninguna. Faltas totales: suma visible, **no** decide el semáforo. Estado de faltas: peor porcentaje respecto al límite de una materia; sin límite, regla fija. Estado final: peor entre promedio y faltas, con las excepciones de `SD`, `BT` y sin datos de `context/07`.
- Umbrales por defecto: promedio correcto ≥80, preventivo ≥70; faltas correcto <50%, preventivo <80%, crítico ≥80%; sin límite: 0–2 / 3–4 / ≥5. Leer umbrales de `configuracion`.
- No guardar ni registrar `Deuda del alumno`, `Último usuario que modifico` ni credenciales en claro. Nunca versionar archivos reales de Excel o bases con datos de alumnos; fixtures sintéticos o correctamente anonimizados.

## Archivos entregados (uso local, fuera de Git)

| Archivo | Hallazgo | Uso |
| --- | --- | --- |
| `Monitoreo de alumnos (2).xlsx` | Hoja `Salida`, 94 columnas, 3,664 filas de datos, dos encabezados `Modalidad`, `Ponderado` en columna 83 | Referencia local para #12 y #14; datos reales sensibles |
| `Matrículas.xlsx` | Hoja `Todos`, 173 filas de datos, `Matrícula` y `Nombre` | Lista de seguimiento para otra historia (#27); datos reales sensibles |
| `alumnosPrepa.db` | SQLite con 13 tablas SEMA, 7 filas de configuración y sin alumnos | Referencia de esquema, **no** base de datos de producción ni migración automática |
| `DB_Prepa.SQL` | SQL con las mismas 13 tablas e índices; añade valores iniciales de configuración | Referencia adicional; comparar contra `lib/schema.sql`, autoridad del repo |
| `data.db`, `data.db1` | Esquemas de OsenVistaSuite (`XP_PROC` y tablas con GUID), sin tablas académicas SEMA | Ajenos al backend SEMA; no importar |

El esquema de referencia `alumnosPrepa.db` tiene `PRAGMA user_version = 0` pese a contar con tablas SEMA. No reemplazar `data/app.db` con ese archivo ni asumir que su migración equivale a la del repo. La base oficial se creaba con `lib/db.js` / `lib/schema.sql` y `user_version=1` en la rama inspeccionada; la nueva capa Python debe conservar ese modelo y migrar sin borrar datos.

## Bitácora compacta para futuras sesiones

Mantener esta sección en 10–20 líneas y quitar entradas obsoletas. Al terminar cada issue, registrar: rama y commit, archivos cambiados, contratos afectados, pruebas y resultados, pendientes y decisiones aprobadas. En la próxima sesión: leer este archivo, `git status`, `git log -3`, el issue activo y solamente las secciones de `context/` necesarias. No copiar transcripciones, datos personales ni código entero a este archivo.

- [Aprobado] Backend Python/FastAPI por comunicación de Saraí. Ella actualizará la documentación; coordinar la transición y registrar los enlaces/commits cuando estén listos.
- [Pendiente] Definir caso de uso y contrato de WebSockets si el equipo los requiere en una historia futura.
- [Pendiente] Comprobar las dependencias #3 y #13 y los números reales de issue en el tablero.

- [Local] Transición FastAPI `d9caef9`; esquema v1, health y páginas; prueba base OK.
- [Local] #4 `c6ca200`; bcrypt/JWT persistente y reset; pruebas de arranque/login OK; frontend debe retirar setup/status.
- [Local] #12 `afca8ba`; lector puro y columnas prohibidas excluidas; Excel local 3664 filas/490 alumnos en 1.192 s.
- [Local] #14 `daf2b80`; previa/confirmación atómica y rollback; importación local en BD temporal <5 s; paridad #13 por revisar con Uziel.
- [Local] #19 en rama `feature/19-api-alumnos`; listado y prueba de 5000 alumnos en 0.142 s; detalles en `INFORME_AUDITORIA_BACKEND.md`.
- [Auditoría] Cinco ramas apiladas reubicadas sobre `origin/develop` 20ad569; pruebas aisladas 2/4/7/15/25 OK. Informe vigente: `INFORME_CIERRE_SPRINT_BACKEND.md`.
