"""SQLite v1 del repositorio; migraciones posteriores son incrementales."""
import sqlite3
from contextlib import contextmanager
from pathlib import Path
import os
import threading

_write_lock = threading.RLock()

import sys

def _resource_root():
    # Empaquetado con PyInstaller (instalador .exe): public/ y lib/ viajan dentro
    # del ejecutable y se extraen en sys._MEIPASS. Desde el repo, es la raíz.
    if getattr(sys, 'frozen', False):
        return Path(getattr(sys, '_MEIPASS', Path(sys.executable).parent))
    return Path(__file__).resolve().parents[1]

def _data_dir():
    # Carpeta escribible para app.db, jwt.secret y .env.
    # - SEMA_DATA_DIR la fuerza (pruebas, instalaciones especiales).
    # - Instalado (.exe): %LOCALAPPDATA%\SEMA, así los datos sobreviven a
    #   actualizaciones y desinstalaciones, y no se necesita ser administrador.
    # - Desde el repo (git clone / SEMA.bat): data/ como siempre.
    env = os.environ.get('SEMA_DATA_DIR')
    if env:
        return Path(env)
    if getattr(sys, 'frozen', False):
        base = os.environ.get('LOCALAPPDATA') or Path.home() / 'AppData' / 'Local'
        return Path(base) / 'SEMA'
    return Path(__file__).resolve().parents[1] / 'data'

ROOT = _resource_root()
DATA_DIR = _data_dir()
DEFAULT_CONFIG = {
    'calificacion.correcto_min': '80', 'calificacion.preventivo_min': '70',
    'faltas.preventivo_pct': '50', 'faltas.critico_pct': '80',
    'faltas.fijo_preventivo': '3', 'faltas.fijo_critico': '5',
    'evolucion.umbral_puntos': '2',
}

MIGRATION_V2 = '''
CREATE INDEX IF NOT EXISTS idx_importaciones_periodo ON importaciones (periodo_id, tipo, estado, aplicado_en);
CREATE INDEX IF NOT EXISTS idx_cortes_alumno ON cortes_alumno (alumno_id);
CREATE INDEX IF NOT EXISTS idx_actividades_codigo ON actividades (codigo) WHERE codigo IS NOT NULL;
'''

def open_db(path=None):
    path = Path(path or os.environ.get('DB_PATH') or DATA_DIR / 'app.db')
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path, timeout=30, isolation_level=None, check_same_thread=False)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    db.execute('PRAGMA journal_mode=WAL')
    db.execute('PRAGMA busy_timeout=30000')
    if db.execute('PRAGMA user_version').fetchone()[0] < 1:
        # El bloque v1 publicado se conserva en lib/schema.sql. No ejecutamos
        # los DROP de lib/db.js: una base existente no debe perder usuarios.
        schema = (ROOT / 'lib/schema.sql').read_text(encoding='utf-8')
        db.executescript('BEGIN IMMEDIATE;\n' + schema + '\nPRAGMA user_version=1;\nCOMMIT;')
    if db.execute('PRAGMA user_version').fetchone()[0] < 2:
        # Migración v2 (#26): índices para los cortes por periodo y la evolución.
        # lib/schema.sql (v1) no se edita; los cambios de esquema van aquí.
        db.executescript('BEGIN IMMEDIATE;\n' + MIGRATION_V2 + '\nPRAGMA user_version=2;\nCOMMIT;')
    with transaction(db):
        db.executemany('INSERT OR IGNORE INTO configuracion(clave,valor) VALUES (?,?)', DEFAULT_CONFIG.items())
        db.execute("DELETE FROM importaciones WHERE estado='previa' AND creado_en < datetime('now','localtime','-24 hours')")
    return db

@contextmanager
def transaction(db):
    with _write_lock:
        db.execute('BEGIN IMMEDIATE')
        try:
            yield db
        except BaseException:
            db.execute('ROLLBACK')
            raise
        else:
            db.execute('COMMIT')
