# -*- mode: python ; coding: utf-8 -*-
# Empaqueta SEMA (FastAPI + frontend estático) en dist/SEMA/SEMA.exe.
# Uso, desde la raíz del repositorio:
#   .venv\Scripts\python.exe -m PyInstaller installer\sema.spec --noconfirm
from pathlib import Path
from PyInstaller.utils.hooks import collect_submodules

ROOT = Path(SPECPATH).parent

datas = [
    (str(ROOT / 'public'), 'public'),
    (str(ROOT / 'lib' / 'schema.sql'), 'lib'),
]

hiddenimports = (
    collect_submodules('uvicorn')
    + collect_submodules('sema')
    + ['multipart', 'python_multipart']
)

a = Analysis(
    [str(ROOT / 'installer' / 'sema_entry.py')],
    pathex=[str(ROOT)],
    datas=datas,
    hiddenimports=hiddenimports,
    excludes=['pytest', 'httpx', 'tkinter', '_pytest'],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='SEMA',
    icon=str(ROOT / 'installer' / 'sema.ico'),
    console=True,   # La ventana muestra el estado; cerrarla detiene SEMA.
    upx=False,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    name='SEMA',
)
