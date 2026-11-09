"""#6 · [HU-01] Revisión estática de SEMA.bat (la prueba real va en #44, en un Windows limpio)."""
from pathlib import Path

BAT = Path(__file__).resolve().parents[1] / 'SEMA.bat'

def test_exige_python_312():
    texto = BAT.read_text(encoding='utf-8')
    assert 'sys.version_info >= (3, 12)' in texto
    assert '(3, 10)' not in texto and 'Python 3.10' not in texto
    assert 'Instala Python 3.12 o superior' in texto

def test_finales_de_linea_crlf():
    datos = BAT.read_bytes()
    assert datos.count(b'\n') == datos.count(b'\r\n'), 'cmd.exe necesita CRLF'

def test_arranca_uvicorn_y_revisa_health():
    texto = BAT.read_text(encoding='utf-8')
    assert '-m uvicorn sema.main:app --host 127.0.0.1' in texto
    assert '/api/health' in texto
