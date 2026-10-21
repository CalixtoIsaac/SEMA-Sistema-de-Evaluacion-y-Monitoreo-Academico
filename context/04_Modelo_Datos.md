# 04 · Modelo de datos (SQLite)

## 1. Diagrama entidad-relación

```
usuarios                       configuracion (clave → valor)

periodos 1───* cursos *───1 materias
                 │  *
                 │  └───1 profesores
                 │
                 1
                 │
                 * inscripciones *───1 alumnos 1───* lista_alumnos *───1 listas
                 │  1                    1                (por matrícula)
                 │                       │
                 * actividades           * cortes_alumno *───1 importaciones
                                                                  1
                 inscripciones.importacion_id ────────────────────┘
```

**Lectura rápida:** un **alumno** tiene muchas **inscripciones**; cada inscripción es a un **curso** (CRN = materia + profesor + grupo + horario de un **periodo**) y tiene sus **actividades** (A1…A50). Cada carga de Excel es una **importación** y deja un **corte** por alumno para la gráfica de evolución. Las **listas** de seguimiento guardan matrículas.

Equivalencia con el Excel: **1 fila del Excel = 1 inscripción** (+ sus actividades).

## 2. Tablas

### `usuarios`
| Columna | Tipo | Regla |
|---|---|---|
| id | INTEGER PK | |
| nombre | TEXT NOT NULL | máx. 60 |
| usuario | TEXT NOT NULL UNIQUE COLLATE NOCASE | 3–30, `[a-zA-Z0-9._-]` |
| password_hash | TEXT NOT NULL | bcrypt costo 10 |
| password_por_defecto | INTEGER NOT NULL DEFAULT 1 | 1 mientras no se cambie (D-18) |
| tema | TEXT NOT NULL DEFAULT 'sistema' | `claro` / `oscuro` / `sistema` (M-13) |
| formato_nombre | TEXT NOT NULL DEFAULT 'nombres_apellidos' | `nombres_apellidos` / `apellidos_nombres` (M-12) |

> **Sin columna de correo** (D-17).
| creado_en / actualizado_en | TEXT | `datetime('now','localtime')` |

### `periodos`
| Columna | Tipo | Excel |
|---|---|---|
| id | INTEGER PK | |
| clave | TEXT NOT NULL UNIQUE | `Año - periodo` (ej. `202660`) |
| nombre | TEXT NOT NULL | `Nombre del periodo` (ej. `2026 Ago - Dic`) |
| parte | TEXT | `Parte periodo` |
| modalidad | TEXT | 1.ª columna `Modalidad` (ej. `Semestral`) |
| campus | TEXT | `Campus` |

### `alumnos`
| Columna | Tipo | Excel / regla |
|---|---|---|
| id | INTEGER PK | |
| matricula | TEXT NOT NULL UNIQUE | `Matrícula` (ej. `T09000001`), se guarda en mayúsculas sin espacios |
| nombre | TEXT NOT NULL | `Nombre del alumno` tal como viene ("Apellidos Nombres"), sin espacios al inicio/fin |
| apellidos | TEXT NOT NULL | calculado con `separarNombre()` (`07` §8) |
| nombres | TEXT NOT NULL | calculado con `separarNombre()` |
| nombre_corregido | INTEGER NOT NULL DEFAULT 0 | 1 si el usuario corrigió apellidos/nombres a mano: las cargas no lo sobrescriben |
| nombre_busqueda | TEXT NOT NULL | nombre + matrícula en minúsculas y sin acentos (para el buscador) |
| plan_clave | TEXT | `Clave plan de estudios` (ej. `BAG_SR`) |
| plan_descripcion | TEXT | `Descripción plan de estudios` |
| campus_admision | TEXT | `Campus de admisión` |
| nivel | TEXT | `Nivel` (ej. `Preparatoria`) |
| origen | TEXT NOT NULL DEFAULT 'excel' | `CHECK (origen IN ('excel','manual'))` |
| creado_en / actualizado_en | TEXT | |

### `materias`
| Columna | Tipo | Excel |
|---|---|---|
| id | INTEGER PK | |
| clave | TEXT NOT NULL UNIQUE | `Clave de materia` (ej. `BSMA3001`). Manuales: `MAN-<n>` |
| nombre | TEXT NOT NULL | `Nombre de la materia` |

> Ojo: el mismo nombre puede tener varias claves (ej. "Lengua adicional al Español V" = `BSOP1005` y `BSOP1010`). La llave es la **clave**, no el nombre.

### `profesores`
| Columna | Tipo | Excel |
|---|---|---|
| id | INTEGER PK | |
| nomina | TEXT NOT NULL UNIQUE | `Nómina` |
| nombre | TEXT NOT NULL | `Nombre del profesor` (recortar espacios dobles) |

### `cursos` (grupo-materia, CRN)
| Columna | Tipo | Excel |
|---|---|---|
| id | INTEGER PK | |
| periodo_id | INTEGER NOT NULL FK → periodos | |
| crn | TEXT NOT NULL | `CRN`. Manuales: `MAN-<n>` |
| materia_id | INTEGER NOT NULL FK → materias | |
| profesor_id | INTEGER FK → profesores | puede ser NULL (manual) |
| grupo | TEXT | `# Grupo` (ej. `601`, `F61`) |
| modalidad_clase | TEXT | 2.ª columna `Modalidad` (ej. `Teórica`) |
| limite_faltas | INTEGER | `Límite de faltas` |
| limite_ne | INTEGER | `Límite de NE` |
| dias | TEXT | ej. `L,M,J,V` a partir de `Dom`…`Sáb` = `SI` |
| hora_inicio / hora_fin | TEXT | `Inicio` / `Fin` (`HH:MM`) |
| | | `UNIQUE (periodo_id, crn)` |

### `inscripciones` (una fila del Excel)
| Columna | Tipo | Excel / regla |
|---|---|---|
| id | INTEGER PK | |
| alumno_id | INTEGER NOT NULL FK → alumnos ON DELETE CASCADE | |
| curso_id | INTEGER NOT NULL FK → cursos ON DELETE CASCADE | |
| estatus | TEXT | `Estatus` (`RW`, `RE`, `RG`, `BT`) |
| estatus_descripcion | TEXT | `Descripción estatus` |
| es_baja | INTEGER NOT NULL DEFAULT 0 | 1 si `estatus = 'BT'` |
| faltas | INTEGER NOT NULL DEFAULT 0 | `Faltas del alumno` |
| ne | INTEGER NOT NULL DEFAULT 0 | `NE alumno` |
| calificacion | REAL | `Ponderado` numérico (0–100). NULL si vacío o código |
| calificacion_codigo | TEXT | `SD` u otro código si `Ponderado` no es número |
| ultima_actividad | INTEGER | `Última actividad actualizada` |
| actualizado_escuela | TEXT | `Última actualización` convertido a `YYYY-MM-DD` |
| origen | TEXT NOT NULL DEFAULT 'excel' | `excel` / `manual` |
| importacion_id | INTEGER FK → importaciones ON DELETE SET NULL | última carga que la tocó |
| | | `UNIQUE (alumno_id, curso_id)` |

### `actividades`
| Columna | Tipo | Regla |
|---|---|---|
| inscripcion_id | INTEGER NOT NULL FK → inscripciones ON DELETE CASCADE | |
| numero | INTEGER NOT NULL | 1–50 (`A1`…`A50`) |
| valor | REAL | 0–100, NULL si es código |
| codigo | TEXT | `NE`, `SD`, `SC`, `DA` |
| | | `PRIMARY KEY (inscripcion_id, numero)` · `CHECK (valor IS NOT NULL OR codigo IS NOT NULL)` |

> Solo se guardan las celdas con contenido. Las celdas vacías o con espacios (`"   "`) **no** se guardan.

### `importaciones`
| Columna | Tipo | Regla |
|---|---|---|
| id | INTEGER PK | |
| tipo | TEXT NOT NULL | `monitoreo` / `lista` |
| archivo | TEXT NOT NULL | nombre original del archivo |
| estado | TEXT NOT NULL | `previa` → `aplicada` / `descartada` |
| modo | TEXT | `fusionar` / `reemplazar` |
| periodo_id | INTEGER FK → periodos | |
| total_filas, filas_validas, filas_omitidas | INTEGER | |
| total_alumnos, total_materias | INTEGER | |
| advertencias | TEXT | JSON `[{ fila, tipo, mensaje }]` |
| datos_previa | TEXT | JSON con las filas normalizadas (se borra al aplicar/descartar) |
| creado_en / aplicado_en | TEXT | |

> Las previas sin confirmar de más de 24 h se borran al arrancar el servidor.

### `cortes_alumno` (evolución)
| Columna | Tipo | Regla |
|---|---|---|
| importacion_id | INTEGER NOT NULL FK → importaciones ON DELETE CASCADE | |
| alumno_id | INTEGER NOT NULL FK → alumnos ON DELETE CASCADE | |
| promedio | REAL | promedio general en esa carga |
| faltas_total | INTEGER | |
| estado | TEXT | estado general: `correcto` / `preventivo` / `critico` / `sin_datos` / `baja` |
| estado_faltas | TEXT | estado de faltas del alumno en esa carga |
| materias_criticas | INTEGER | materias en Crítico en esa carga |
| | | `PRIMARY KEY (importacion_id, alumno_id)` |

> La tendencia (M-05, `07` §9) se calcula al consultar comparando cortes del mismo periodo; no se guarda.

### `listas` y `lista_alumnos`
| Tabla | Columna | Tipo | Regla |
|---|---|---|---|
| listas | id | INTEGER PK | |
| | nombre | TEXT NOT NULL UNIQUE COLLATE NOCASE | ej. "6.º semestre" |
| | descripcion | TEXT DEFAULT '' | |
| | archivo | TEXT | nombre del Excel de origen |
| | creado_en / actualizado_en | TEXT | |
| lista_alumnos | lista_id | INTEGER NOT NULL FK → listas ON DELETE CASCADE | |
| | matricula | TEXT NOT NULL | se une con `alumnos.matricula` |
| | nombre_excel | TEXT | el nombre como venía en el Excel de lista |
| | | | `PRIMARY KEY (lista_id, matricula)` |

> Se guarda la **matrícula** (no el `alumno_id`) para que, si el alumno se carga después, aparezca solo en la lista.

### `configuracion`
| clave | valor por defecto | Significado |
|---|---|---|
| `calificacion.correcto_min` | `80` | desde aquí es verde |
| `calificacion.preventivo_min` | `70` | desde aquí es amarillo; abajo es rojo |
| `faltas.preventivo_pct` | `50` | % del límite de la materia desde el que es amarillo (D-10) |
| `faltas.critico_pct` | `80` | % del límite de la materia desde el que es rojo (D-10) |
| `faltas.fijo_preventivo` | `3` | materias sin límite: desde aquí es amarillo |
| `faltas.fijo_critico` | `5` | materias sin límite: desde aquí es rojo ("+4") |
| `evolucion.umbral_puntos` | `2` | cambio mínimo de promedio para Mejora/Empeora (M-05) |

> Ya no existen `faltas.modo` ni `estado.combinar_faltas`: las faltas siempre son por materia (D-09) y el estado general siempre combina promedio y faltas (D-11).

## 3. SQL (`lib/schema.sql`)

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  usuario TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  password_por_defecto INTEGER NOT NULL DEFAULT 1,
  tema TEXT NOT NULL DEFAULT 'sistema' CHECK (tema IN ('claro','oscuro','sistema')),
  formato_nombre TEXT NOT NULL DEFAULT 'nombres_apellidos'
    CHECK (formato_nombre IN ('nombres_apellidos','apellidos_nombres')),
  creado_en TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS periodos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clave TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  parte TEXT, modalidad TEXT, campus TEXT
);

CREATE TABLE IF NOT EXISTS alumnos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matricula TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  nombres TEXT NOT NULL,
  nombre_corregido INTEGER NOT NULL DEFAULT 0,
  nombre_busqueda TEXT NOT NULL,
  plan_clave TEXT, plan_descripcion TEXT, campus_admision TEXT, nivel TEXT,
  origen TEXT NOT NULL DEFAULT 'excel' CHECK (origen IN ('excel','manual')),
  creado_en TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS materias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clave TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profesores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nomina TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cursos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id INTEGER NOT NULL REFERENCES periodos(id) ON DELETE CASCADE,
  crn TEXT NOT NULL,
  materia_id INTEGER NOT NULL REFERENCES materias(id),
  profesor_id INTEGER REFERENCES profesores(id),
  grupo TEXT, modalidad_clase TEXT,
  limite_faltas INTEGER, limite_ne INTEGER,
  dias TEXT, hora_inicio TEXT, hora_fin TEXT,
  UNIQUE (periodo_id, crn)
);

CREATE TABLE IF NOT EXISTS importaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL CHECK (tipo IN ('monitoreo','lista')),
  archivo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'previa' CHECK (estado IN ('previa','aplicada','descartada')),
  modo TEXT CHECK (modo IN ('fusionar','reemplazar')),
  periodo_id INTEGER REFERENCES periodos(id),
  total_filas INTEGER, filas_validas INTEGER, filas_omitidas INTEGER,
  total_alumnos INTEGER, total_materias INTEGER,
  advertencias TEXT NOT NULL DEFAULT '[]',
  datos_previa TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  aplicado_en TEXT
);

CREATE TABLE IF NOT EXISTS inscripciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  estatus TEXT, estatus_descripcion TEXT,
  es_baja INTEGER NOT NULL DEFAULT 0,
  faltas INTEGER NOT NULL DEFAULT 0 CHECK (faltas >= 0),
  ne INTEGER NOT NULL DEFAULT 0 CHECK (ne >= 0),
  calificacion REAL CHECK (calificacion IS NULL OR calificacion BETWEEN 0 AND 100),
  calificacion_codigo TEXT,
  ultima_actividad INTEGER,
  actualizado_escuela TEXT,
  origen TEXT NOT NULL DEFAULT 'excel' CHECK (origen IN ('excel','manual')),
  importacion_id INTEGER REFERENCES importaciones(id) ON DELETE SET NULL,
  UNIQUE (alumno_id, curso_id)
);

CREATE TABLE IF NOT EXISTS actividades (
  inscripcion_id INTEGER NOT NULL REFERENCES inscripciones(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL CHECK (numero BETWEEN 1 AND 50),
  valor REAL CHECK (valor IS NULL OR valor BETWEEN 0 AND 100),
  codigo TEXT,
  PRIMARY KEY (inscripcion_id, numero),
  CHECK (valor IS NOT NULL OR codigo IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS cortes_alumno (
  importacion_id INTEGER NOT NULL REFERENCES importaciones(id) ON DELETE CASCADE,
  alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  promedio REAL, faltas_total INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL,
  estado_faltas TEXT,
  materias_criticas INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (importacion_id, alumno_id)
);

CREATE TABLE IF NOT EXISTS listas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE COLLATE NOCASE,
  descripcion TEXT NOT NULL DEFAULT '',
  archivo TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS lista_alumnos (
  lista_id INTEGER NOT NULL REFERENCES listas(id) ON DELETE CASCADE,
  matricula TEXT NOT NULL,
  nombre_excel TEXT,
  PRIMARY KEY (lista_id, matricula)
);

CREATE INDEX IF NOT EXISTS idx_inscripciones_alumno ON inscripciones (alumno_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_curso  ON inscripciones (curso_id);
CREATE INDEX IF NOT EXISTS idx_cursos_materia       ON cursos (materia_id);
CREATE INDEX IF NOT EXISTS idx_lista_alumnos_mat    ON lista_alumnos (matricula);
CREATE INDEX IF NOT EXISTS idx_alumnos_busqueda     ON alumnos (nombre_busqueda);
```

## 4. Reglas de integridad y carga

1. **Upsert por llaves naturales:** `periodos.clave`, `alumnos.matricula`, `materias.clave`, `profesores.nomina`, `cursos (periodo_id, crn)`, `inscripciones (alumno_id, curso_id)`. Se usa `INSERT … ON CONFLICT(...) DO UPDATE`.
2. Al actualizar una inscripción, sus `actividades` se **borran y se vuelven a insertar** (el Excel siempre trae el estado completo).
3. **Modo reemplazar:** dentro de la misma transacción se borran las inscripciones `origen='excel'` del periodo que **no** vinieron en el archivo. Las `manual` nunca se borran.
4. Toda la importación corre en `db.transaction(...)`: o se guarda todo o nada.
5. Al terminar se calculan y guardan los `cortes_alumno` de esa importación.
6. Los alumnos sin inscripciones vigentes (por reemplazo) se conservan; no aparecen en la tabla mientras no tengan materias.
7. **No se guarda** la columna `Deuda del alumno` ni `Último usuario que modifico` (D-14).
8. En el upsert de `alumnos`, si `nombre_corregido = 1` no se tocan `apellidos` ni `nombres` (sí se actualiza `nombre`).
9. Si se suben dos cargas el mismo día, ambas guardan cortes, pero la evolución solo usa la última de ese día (`07` §9.1).

## 5. Migraciones

`lib/db.js` lee `PRAGMA user_version`. Versión 1 = este esquema. Cada cambio futuro agrega un bloque `if (version < N) { …; db.pragma('user_version = N') }`. Nunca se edita un bloque ya publicado en `main`.

## 6. Volumen esperado

Con el Excel actual: 1 periodo · 490 alumnos · 46 materias · 44 profesores · 141 cursos · 3,664 inscripciones · ~22,000 actividades. Todo cabe holgadamente en SQLite (< 10 MB).
