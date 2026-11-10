"""Instalador .exe: rutas de datos y archivos que deben viajar dentro del ejecutable."""
import importlib
import os
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]


def test_desde_el_repo_los_datos_siguen_en_data(monkeypatch):
    monkeypatch.delenv('SEMA_DATA_DIR', raising=False)
    import sema.db as db
    db = importlib.reload(db)
    assert db.ROOT == RAIZ
    assert db.DATA_DIR == RAIZ / 'data'


def test_sema_data_dir_cambia_la_carpeta_de_datos(monkeypatch, tmp_path):
    monkeypatch.setenv('SEMA_DATA_DIR', str(tmp_path))
    import sema.db as db
    try:
        assert importlib.reload(db).DATA_DIR == tmp_path
    finally:
        monkeypatch.delenv('SEMA_DATA_DIR')
        importlib.reload(db)


def test_spec_incluye_frontend_y_esquema():
    spec = (RAIZ / 'installer/sema.spec').read_text(encoding='utf-8')
    assert "'public'" in spec and "'schema.sql'" in spec
    assert (RAIZ / 'installer/sema.ico').exists()


def test_iss_en_utf8_con_bom():
    # Sin BOM, Inno Setup lee el archivo como ANSI y rompe los acentos.
    assert (RAIZ / 'installer/SEMA.iss').read_bytes().startswith(b'\xef\xbb\xbf')
