# 06 · Especificación de la API

- **Base:** `http://localhost:3000/api` · JSON en UTF-8 · nombres de campos en `camelCase`.
- **Autenticación:** todas las rutas salvo `GET /health` y `POST /auth/login` requieren `Authorization: Bearer <token>`.
- **Errores:** siempre `{ "error": "Mensaje para el usuario", "code"?: "CODIGO", "detalles"?: [...] }`.

| Código | Cuándo |
|---|---|
| 400 | Datos inválidos (validación) |
| 401 | Sin sesión, sesión expirada o contraseña actual incorrecta (`code: AUTH_REQUIRED` / `BAD_PASSWORD`) |
| 404 | No existe el recurso |
| 409 | Conflicto (usuario o nombre de lista repetido, importación ya aplicada) |
| 413 | Archivo de más de 15 MB |
| 415 | Archivo que no es `.xlsx` |
| 422 | El Excel no tiene el formato esperado (`detalles`: columnas faltantes) |
| 429 | Demasiados intentos |
| 500 | Error interno |

**Objetos comunes**

```jsonc
// Estado (ver 07_Reglas_Negocio_Indicadores.md §4)
"correcto" | "preventivo" | "critico" | "sin_datos" | "baja"

// AlumnoResumen (filas de la tabla)
{
  "matricula": "T09000001",
  "nombre": "Pérez López Mariana",   // como viene en el Excel
  "apellidos": "Pérez López",
  "nombres": "Mariana",
  "nombreMostrar": "Mariana Pérez López",   // según la preferencia formato_nombre (M-12)
  "planClave": "BAG_SR",
  "promedioGeneral": 74.83,          // null si no hay calificaciones
  "estadoPromedio": "preventivo",
  "faltasTotal": 7,                  // suma: se muestra y se usa para ordenar
  "faltasPeorMateria": { "materia": "Inglés Nivel 4", "faltas": 4, "limite": 5, "porcentaje": 80 },
  "estadoFaltas": "critico",         // peor materia por % del límite (D-09, D-10)
  "estado": "critico",               // peor entre estadoPromedio y estadoFaltas (D-11)
  "motivoEstado": "faltas",          // "promedio" | "faltas" | "sin_derecho"
  "materias": 7,
  "materiasReprobando": 1,
  "alertas": ["faltas_limite"],      // sin_derecho | faltas_limite | muchos_ne | sin_calificar | deshonestidad | reprobando | empeora
  "tendencia": "empeora",            // M-05: mejora | estable | empeora | sin_historial
  "origen": "excel"
}
```

---

## 1. Sistema

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/health` | `{ "status": "online", "app": "SEMA", "version": "0.1.0", "timestamp": "…" }` (lo usa `SEMA.bat` para saber si ya está corriendo) |

## 2. Autenticación — `routes/auth.js`

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/auth/login` | `{ usuario, password }` | `200 { token, user }` · `401` "Usuario o contraseña incorrectos." · `429` |
| GET | `/auth/me` | — | `{ user }` |

`user = { id, nombre, usuario, passwordPorDefecto, tema, formatoNombre }` (sin correo, D-17)

> Se eliminan `GET /auth/status` y `POST /auth/setup` de la plantilla: la cuenta por defecto se crea al arrancar (T-03).

## 3. Cuenta — `routes/cuenta.js`

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| PUT | `/cuenta` | `{ nombre, usuario, passwordActual }` | `{ user, token }` (token nuevo porque cambia el usuario) · `401 BAD_PASSWORD` · `409` |
| PUT | `/cuenta/password` | `{ passwordActual, passwordNueva }` | `{ status: "ok" }` · `400` si < 8 o > 72 caracteres |
| PUT | `/cuenta/preferencias` | `{ tema?: "claro" \| "oscuro" \| "sistema", formatoNombre?: "nombres_apellidos" \| "apellidos_nombres" }` | `{ user }` · `400` valor no válido (M-12, M-13; no pide contraseña) |

## 4. Importaciones (Excel de monitoreo) — `routes/importaciones.js`

### `POST /importaciones/monitoreo`
`multipart/form-data` con el campo **`archivo`** (.xlsx, máx. 15 MB). Crea una importación en estado `previa`.

```jsonc
// 201
{
  "importacion": { "id": 7, "archivo": "Monitoreo_de_alumnos_2.xlsx", "estado": "previa" },
  "resumen": {
    "periodo": { "clave": "202660", "nombre": "2026 Ago - Dic" },
    "totalFilas": 3664, "filasValidas": 3664, "filasOmitidas": 0,
    "alumnos": 490, "alumnosNuevos": 490, "materias": 46, "cursos": 141, "bajas": 3,
    "periodoYaExiste": false,
    "inscripcionesQueSeEliminarian": 0      // solo si se elige "reemplazar"
  },
  "columnas": ["Matrícula", "Nombre del alumno", "Nombre de la materia", "# Grupo", "Faltas del alumno", "Ponderado"],
  "muestra": [ { "Matrícula": "T09000001", "Nombre del alumno": "Pérez López Mariana", "…": "…" } ],  // 20 filas
  "advertencias": [ { "fila": 812, "tipo": "codigo", "mensaje": "Ponderado con código SD" } ]
}
// 422
{ "error": "Este archivo no tiene el formato del Excel de monitoreo.", "code": "FORMATO",
  "detalles": ["Falta la columna «Ponderado»"] }
```

### `GET /importaciones/:id/muestra?todas=1&pagina=1`
Filas de la previa con **todas** las columnas (para "Ver todas las columnas"), 50 por página: `{ columnas, filas, total }`.

### `POST /importaciones/:id/confirmar`
Cuerpo `{ "modo": "fusionar" | "reemplazar" }`. Aplica la importación en una transacción.

```jsonc
// 200
{ "importacion": { "id": 7, "estado": "aplicada", "aplicadoEn": "2026-10-20 10:42:11" },
  "resultado": { "alumnos": 490, "inscripciones": 3664, "actividades": 22184, "eliminadas": 0 } }
// 409 si ya estaba aplicada o descartada
```

### `DELETE /importaciones/:id`
Descarta una importación en estado `previa`. `{ status: "ok" }`.

### `GET /importaciones?tipo=monitoreo`
Historial: `{ importaciones: [{ id, tipo, archivo, estado, modo, totalAlumnos, totalFilas, creadoEn, aplicadoEn }] }`.

## 5. Listas de seguimiento — `routes/listas.js`

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/listas/previa` | multipart `archivo` | `{ total, encontrados, noEncontrados: [{ matricula, nombre }], nombresDistintos: [{ matricula, nombreExcel, nombreSema }], matriculas: [{ matricula, nombre }] }` · `422` si no hay columna de matrícula |
| POST | `/listas` | `{ nombre, descripcion?, archivo?, matriculas: [{ matricula, nombre }] }` | `201 { lista }` · `409` nombre repetido |
| GET | `/listas` | — | `{ listas: [{ id, nombre, descripcion, total, encontrados, creadoEn }] }` |
| GET | `/listas/:id` | — | `{ lista, matriculas: [{ matricula, nombreExcel, encontrado }] }` |
| PUT | `/listas/:id` | `{ nombre?, descripcion?, matriculas? }` | `{ lista }` (si trae `matriculas`, reemplaza el contenido) |
| DELETE | `/listas/:id` | — | `{ status: "ok", id }` (no borra alumnos) |

## 6. Alumnos — `routes/alumnos.js`

### `GET /alumnos`
| Parámetro | Ejemplo | Efecto |
|---|---|---|
| `lista` | `3` | solo alumnos de esa lista |
| `periodo` | `202660` | por defecto, el periodo más reciente |

Respuesta: `{ alumnos: AlumnoResumen[], totales: { correcto, preventivo, critico, sin_datos, baja }, periodo }`.

> La búsqueda, el filtro por estado, el orden y la paginación se hacen **en el navegador** (≤ 5,000 filas), reutilizando la función de orden documentada en `07` §6 (`public/js/orden-busqueda.js` replica solo las funciones de orden y búsqueda; los estados siempre vienen del servidor).

### `GET /alumnos/:matricula`
```jsonc
{
  "alumno": { "matricula": "T09000001", "nombre": "Pérez López Mariana",
              "apellidos": "Pérez López", "nombres": "Mariana", "nombreMostrar": "Mariana Pérez López",
              "nombreCorregido": false,
              "planClave": "BAG_SR", "planDescripcion": "Bachillerato General",
              "nivel": "Preparatoria", "origen": "excel",
              "promedioGeneral": 81.4, "estadoPromedio": "correcto",
              "faltasTotal": 7, "estadoFaltas": "critico", "estado": "critico",
              "motivoEstado": "faltas", "motivoTexto": "Crítico por faltas en Inglés Nivel 4 (4 / 5)",
              "alertas": ["faltas_limite", "sin_calificar"], "listas": [{ "id": 3, "nombre": "6.º semestre" }],
              "tendencia": "empeora" },
  "materias": [{
    "inscripcionId": 120, "clave": "BSMA3001", "nombre": "Cálculo diferencial",
    "crn": "16086", "grupo": "603", "profesor": "Hernández Mora Luis",
    "dias": "L,M,Mi,J,V", "horaInicio": "10:30", "horaFin": "11:29",
    "actividades": [ { "numero": 1, "valor": 70 }, { "numero": 4, "codigo": "NE" } ],
    "calificacion": 69, "calificacionCodigo": null, "estadoCalificacion": "critico",
    "faltas": 0, "limiteFaltas": 12, "porcentajeFaltas": 0, "estadoFaltas": "correcto",
    "ne": 0, "limiteNe": 3, "esBaja": false, "estatus": "RW", "origen": "excel"
  }],
  "evolucion": [ { "importacionId": 5, "fecha": "2026-10-06", "promedio": 83.0, "faltasTotal": 4, "estado": "correcto" },
                 { "importacionId": 7, "fecha": "2026-10-20", "promedio": 81.4, "faltasTotal": 7, "estado": "critico" } ]
  // M-05: arreglo con un solo elemento si solo hay un corte (tendencia = sin_historial)
}
```
`404` si la matrícula no existe.

### Alta y edición manual

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/alumnos` | `{ matricula, apellidos, nombres, planClave?, planDescripcion?, materias?: MateriaManual[] }` | `201 { alumno }` · `409` matrícula existente |
| PUT | `/alumnos/:matricula` | `{ planClave?, planDescripcion? }` (solo manuales) | `{ alumno }` |
| PUT | `/alumnos/:matricula/nombre` | `{ apellidos, nombres }` | `{ alumno }` — corrección manual (M-12); también para alumnos del Excel; marca `nombre_corregido = 1` |
| DELETE | `/alumnos/:matricula` | — | `{ status: "ok" }` (solo `origen = manual`; los de Excel → `409`) |
| POST | `/alumnos/:matricula/materias` | `MateriaManual` | `201 { materia }` |
| PUT | `/inscripciones/:id` | `MateriaManual` | `{ materia }` (solo manuales) |
| DELETE | `/inscripciones/:id` | — | `{ status: "ok" }` (solo manuales) |

```jsonc
// MateriaManual
{ "materiaClave": "BSMA3001",      // o materiaNombre para crear una materia nueva (clave MAN-n)
  "materiaNombre": "Cálculo diferencial",
  "actividades": [95, 80, "NE", "SC", 100, null],   // posición = número de actividad; null = vacía
  "calificacion": null,                 // null → promedio de actividades (NE, SC y DA = 0)
  "faltas": 2, "limiteFaltas": 12 }
```

### `GET /alumnos/exportar?lista=3&formato=xlsx&orden=promedio,faltas&estado=critico&q=perez` (M-07)
Descarga (`Content-Disposition: attachment`) de la tabla con los mismos filtros, búsqueda y orden que la vista. Usa el formato de nombres de la preferencia.

## 7. Resumen — `routes/resumen.js`

### `GET /resumen?lista=3`
```jsonc
{
  "vacio": false,
  "ultimaActualizacion": "2026-10-20 10:42:11",
  "kpis": { "alumnos": 490, "promedioGeneral": 88.4, "critico": 34, "preventivo": 134, "correcto": 319, "sinDatos": 3 },
  "porEstado":   [ { "estado": "correcto", "total": 319 }, { "estado": "preventivo", "total": 134 }, { "estado": "critico", "total": 34 } ],
  "porRango":    [ { "rango": "<60", "total": 2 }, { "rango": "60-69", "total": 8 }, { "rango": "70-79", "total": 43 },
                   { "rango": "80-89", "total": 120 }, { "rango": "90-100", "total": 314 } ],
  "materiasBajas": [ { "clave": "BSXX0000", "nombre": "…", "promedio": 71.3, "alumnos": 181, "estado": "preventivo" } ],
  "porEstadoFaltas": [ { "estado": "correcto", "total": 338 }, { "estado": "preventivo", "total": 119 }, { "estado": "critico", "total": 30 } ],
  "topRiesgo":   [ /* 10 AlumnoResumen */ ],
  // M-05 (con menos de 2 cortes: evolucion con un punto y tendencias en sinHistorial):
  "evolucion":   [ { "importacionId": 5, "fecha": "2026-10-06", "promedio": 87.9, "porcentajeCritico": 5.8 } ],
  "tendencias":  { "mejora": 20, "estable": 440, "empeora": 12, "sinHistorial": 15 }
}
```
Sin datos: `{ "vacio": true, "kpis": null, … arreglos vacíos }`.
*(KPIs y estados calculados con el Excel actual; rangos, materias y evolución son ilustrativos.)*

## 8. Catálogos — `routes/catalogos.js`

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/materias` | `{ materias: [{ clave, nombre }] }` (para el formulario manual) |
| GET | `/periodos` | `{ periodos: [{ clave, nombre, actual }] }` |
| GET | `/planes` | `{ planes: [{ clave, descripcion }] }` |

## 9. Configuración — `routes/configuracion.js` (M-08)

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/configuracion` | — | `{ umbrales: { calificacion: { correctoMin: 80, preventivoMin: 70 }, faltas: { preventivoPct: 50, criticoPct: 80, fijoPreventivo: 3, fijoCritico: 5 }, evolucion: { umbralPuntos: 2 } }, porDefecto: {…} }` |
| PUT | `/configuracion` | `{ umbrales }` | `{ umbrales }` · `400` si `preventivoMin ≥ correctoMin`, `preventivoPct ≥ criticoPct`, `fijoPreventivo ≥ fijoCritico` o valores fuera de rango |
| POST | `/configuracion/vista-previa` | `{ umbrales }` | `{ totales: { correcto, preventivo, critico } }` (sin guardar) |

## 10. Datos *(Could)*

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/datos/respaldo` | — | descarga `sema-respaldo-YYYY-MM-DD.db` (usar `db.backup()`) |
| DELETE | `/datos` | `{ passwordActual, confirmacion: "BORRAR" }` | `{ status: "ok" }` — borra datos académicos, listas e importaciones; conserva cuenta y configuración |

## 11. Ejemplo de uso desde el frontend

```js
// Subir archivo (UI.api envía JSON, para archivos usar FormData)
const fd = new FormData();
fd.append('archivo', input.files[0]);
const previa = await UI.upload('/importaciones/monitoreo', fd);   // agregar UI.upload al ui-kit
// Confirmar
await UI.api(`/importaciones/${previa.importacion.id}/confirmar`, { method: 'POST', body: { modo: 'fusionar' } });
UI.toast(`Datos cargados correctamente · ${previa.resumen.alumnos} alumnos`, 'success');
```
