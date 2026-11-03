"""SQLite v1 del repositorio; migraciones posteriores son incrementales."""
import sqlite3
from contextlib import contextmanager
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = {
    'calificacion.correcto_min': '80', 'calificacion.preventivo_min': '70',
    'faltas.preventivo_pct': '50', 'faltas.critico_pct': '80',
    'faltas.fijo_preventivo': '3', 'faltas.fijo_critico': '5',
    'evolucion.umbral_puntos': '2',
}

def open_db(path=None):
    path = Path(path or os.environ.get('DB_PATH') or ROOT / 'data/app.db')
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path, timeout=30, isolation_level=None, check_same_thread=False)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    db.execute('PRAGMA journal_mode=WAL')
    db.execute('PRAGMA busy_timeout=30000')
    if db.execute('PRAGMA user_version').fetchone()[0] < 1:
        # El bloque v1 publicado se conserva en lib/schema.sql. No ejecutamos
        # los DROP de lib/db.js: una base existente no debe perder usuarios.
        schema = (ROOT / 'lib/schema.sql').read_text()
        db.executescript('BEGIN IMMEDIATE;\n' + schema + '\nPRAGMA user_version=1;\nCOMMIT;')
    with transaction(db):
        db.executemany('INSERT OR IGNORE INTO configuracion(clave,valor) VALUES (?,?)', DEFAULT_CONFIG.items())
        db.execute("DELETE FROM importaciones WHERE estado='previa' AND creado_en < datetime('now','localtime','-24 hours')")
    return db

@contextmanager
def transaction(db):
    db.execute('BEGIN IMMEDIATE')
    try:
        yield db
    except BaseException:
        db.execute('ROLLBACK')
        raise
    else:
        db.execute('COMMIT')
