"""#43 · [HU-25] Respaldo y borrado de datos."""
import sqlite3
from tests.util import client, login, cargar_muestra
from sema.auth import INITIAL_PASSWORD

def test_respaldo(tmp_path):
    app, c = client(tmp_path); h = login(c); cargar_muestra(c, h)
    assert c.get('/api/datos/respaldo').status_code == 401
    r = c.get('/api/datos/respaldo', headers=h)
    assert r.status_code == 200 and 'sema-respaldo-' in r.headers['content-disposition']
    assert r.content[:16] == b'SQLite format 3\x00'
    copia = tmp_path / 'copia.db'; copia.write_bytes(r.content)
    db = sqlite3.connect(copia)
    assert db.execute('SELECT COUNT(*) FROM alumnos').fetchone()[0] == 15
    db.close(); app.state.db.close()

def test_borrar_conserva_cuenta_y_configuracion(tmp_path):
    app, c = client(tmp_path); h = login(c); cargar_muestra(c, h); db = app.state.db
    c.post('/api/listas', headers=h, json={'nombre': 'L', 'matriculas': [{'matricula': 'T90000001'}]})
    db.execute("UPDATE configuracion SET valor='85' WHERE clave='calificacion.correcto_min'")
    borrar = lambda **b: c.request('DELETE', '/api/datos', headers=h, json=b)
    assert borrar(passwordActual=INITIAL_PASSWORD, confirmacion='borrar').status_code == 400
    assert borrar(passwordActual='mala', confirmacion='BORRAR').status_code == 401
    assert db.execute('SELECT COUNT(*) FROM alumnos').fetchone()[0] == 15
    assert borrar(passwordActual=INITIAL_PASSWORD, confirmacion='BORRAR').json() == {'status': 'ok'}
    for tabla in ('alumnos', 'inscripciones', 'actividades', 'importaciones', 'listas', 'periodos', 'cortes_alumno'):
        assert db.execute(f'SELECT COUNT(*) FROM {tabla}').fetchone()[0] == 0, tabla
    assert db.execute('SELECT COUNT(*) FROM usuarios').fetchone()[0] == 1
    assert db.execute("SELECT valor FROM configuracion WHERE clave='calificacion.correcto_min'").fetchone()[0] == '85'
    assert c.get('/api/resumen', headers=h).json()['vacio'] is True
    db.close()
