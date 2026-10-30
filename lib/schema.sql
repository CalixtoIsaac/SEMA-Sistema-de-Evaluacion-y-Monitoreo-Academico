
PRAGMA foreign_keys = ON;
 
CREATE TABLE IF NOT EXISTS alumnos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matricula TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  nombres TEXT NOT NULL,
  nombre_corregido INTEGER NOT NULL DEFAULT 0,
  nombre_busqueda TEXT NOT NULL,
  campus_admision TEXT,
  nivel TEXT,
  origen TEXT NOT NULL DEFAULT 'excel' CHECK (origen IN ('excel','manual')),
  creado_en TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  plan_clave TEXT,
  plan_descripcion TEXT
);
 
CREATE TABLE IF NOT EXISTS periodos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clave TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  parte TEXT,
  modalidad TEXT,
  campus TEXT
);
 
CREATE TABLE IF NOT EXISTS profesores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nomina TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL
);
 
CREATE TABLE IF NOT EXISTS materias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clave TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL
);
 
CREATE TABLE IF NOT EXISTS cursos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crn TEXT NOT NULL,
  limite_faltas INTEGER,
  limite_ne INTEGER,
  dias TEXT,
  hora_inicio TEXT,
  hora_fin TEXT,
  grupo TEXT,
  modalidad_clase TEXT,
  periodo_id INTEGER NOT NULL REFERENCES periodos(id) ON DELETE CASCADE,
  profesor_id INTEGER REFERENCES profesores(id),
  materia_id INTEGER NOT NULL REFERENCES materias(id),
  UNIQUE (periodo_id, crn)
);
 
CREATE TABLE IF NOT EXISTS importaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  archivo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'previa' CHECK (estado IN ('previa','aplicada','descartada')),
  tipo TEXT NOT NULL CHECK (tipo IN ('monitoreo','lista')),
  modo TEXT CHECK (modo IN ('fusionar','reemplazar')),
  total_filas INTEGER,
  filas_validas INTEGER,
  filas_omitidas INTEGER,
  total_alumnos INTEGER,
  total_materias INTEGER,
  advertencias TEXT NOT NULL DEFAULT '[]',
  datos_previa TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  aplicado_en TEXT,
  periodo_id INTEGER REFERENCES periodos(id)
);
 
CREATE TABLE IF NOT EXISTS inscripciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  estatus TEXT,
  estatus_descripcion TEXT,
  faltas INTEGER NOT NULL DEFAULT 0 CHECK (faltas >= 0),
  ne INTEGER NOT NULL DEFAULT 0 CHECK (ne >= 0),
  calificacion REAL CHECK (calificacion IS NULL OR calificacion BETWEEN 0 AND 100),
  calificacion_codigo TEXT,
  ultima_actividad INTEGER,
  actualizado_escuela TEXT,
  origen TEXT NOT NULL DEFAULT 'excel' CHECK (origen IN ('excel','manual')),
  es_baja INTEGER NOT NULL DEFAULT 0,
  importacion_id INTEGER REFERENCES importaciones(id) ON DELETE SET NULL,
  UNIQUE (alumno_id, curso_id)
);
 
CREATE TABLE IF NOT EXISTS actividades (
  inscripcion_id INTEGER NOT NULL REFERENCES inscripciones(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL CHECK (numero BETWEEN 1 AND 50),
  codigo TEXT,
  valor REAL CHECK (valor IS NULL OR valor BETWEEN 0 AND 100),
  PRIMARY KEY (inscripcion_id, numero),
  CHECK (valor IS NOT NULL OR codigo IS NOT NULL)
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
 
CREATE TABLE IF NOT EXISTS cortes_alumno (
  importacion_id INTEGER NOT NULL REFERENCES importaciones(id) ON DELETE CASCADE,
  alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  promedio REAL,
  faltas_total INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL,
  estado_faltas TEXT,
  materias_criticas INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (importacion_id, alumno_id)
);
 
CREATE INDEX IF NOT EXISTS idx_inscripciones_alumno ON inscripciones (alumno_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_curso  ON inscripciones (curso_id);
CREATE INDEX IF NOT EXISTS idx_cursos_materia       ON cursos (materia_id);
CREATE INDEX IF NOT EXISTS idx_lista_alumnos_mat    ON lista_alumnos (matricula);
CREATE INDEX IF NOT EXISTS idx_alumnos_busqueda     ON alumnos (nombre_busqueda);