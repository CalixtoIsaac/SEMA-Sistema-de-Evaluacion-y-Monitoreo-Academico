"""Pruebas de las correcciones C1, C2, C3 y C6 (revisión del 4 nov 2026)."""
from pathlib import Path
from fastapi.testclient import TestClient
from sema.main import create_app
from sema.auth import INITIAL_PASSWORD
from tests.test_imports import workbook

FIXTURE = Path(__file__).resolve().parents[1] / 'test/fixtures/monitoreo-muestra.xlsx'

def login(c):
    t = c.post('/api/auth/login', json={'usuario': 'Chuchito', 'password': INITIAL_PASSWORD}).json()['token']
    return {'Authorization': 'Bearer ' + t}

def cargar(c, h, data, modo='fusionar'):
    p = c.post('/api/importaciones/monitoreo', headers=h, files={'archivo': ('x.xlsx', data)}).json()
    r = c.post(f"/api/importaciones/{p['importacion']['id']}/confirmar", headers=h, json={'modo': modo})
    assert r.status_code == 200
    return p['importacion']['id']

def test_c1_validacion_con_formato_error_code(tmp_path):
    app = create_app(tmp_path/'a.db', tmp_path/'s'); c = TestClient(app)
    r = c.post('/api/auth/login', json={'usuario': 'Chuchito'})
    assert r.status_code == 400 and r.json() == {'error': 'Datos incompletos o inválidos.', 'code': 'VALIDACION'}
    h = login(c)
    r = c.get('/api/alumnos?lista=abc', headers=h)
    assert r.status_code == 400 and r.json()['code'] == 'VALIDACION'
    r = c.post('/api/importaciones/1/confirmar', headers=h, json={})
    assert r.status_code == 400 and r.json()['code'] == 'VALIDACION'
    app.state.db.close()

def test_c3_logins_correctos_no_cuentan(tmp_path):
    app = create_app(tmp_path/'a.db', tmp_path/'s'); c = TestClient(app)
    for _ in range(11):
        assert c.post('/api/auth/login', json={'usuario': 'Chuchito', 'password': INITIAL_PASSWORD}).status_code == 200
    # Un login correcto limpia los fallidos anteriores.
    for _ in range(9):
        assert c.post('/api/auth/login', json={'usuario': 'Chuchito', 'password': 'x'}).status_code == 401
    assert c.post('/api/auth/login', json={'usuario': 'Chuchito', 'password': INITIAL_PASSWORD}).status_code == 200
    for _ in range(9):
        assert c.post('/api/auth/login', json={'usuario': 'Chuchito', 'password': 'x'}).status_code == 401
    app.state.db.close()

def test_c2_tendencia_contra_corte_anterior_del_periodo(tmp_path):
    app = create_app(tmp_path/'a.db', tmp_path/'s'); c = TestClient(app); h = login(c); db = app.state.db
    ana = ['202660', 'T00000001', 'Pérez López Ana', 'Física', 'F1', '1', 0, 90, 90, 5, 'RW']
    eva = ['202660', 'T00000002', 'Ruiz Soto Eva', 'Física', 'F1', '1', 0, 90, 90, 5, 'RW']
    ana_baja = ana[:7] + [60, 60] + ana[9:]
    dias = ['2026-10-26 10:00:00', '2026-10-27 10:00:00', '2026-10-28 10:00:00']
    i1 = cargar(c, h, workbook([ana, eva]))                 # carga 1: ambos
    i2 = cargar(c, h, workbook([eva]), 'reemplazar')         # carga 2: Ana ausente
    i3 = cargar(c, h, workbook([ana_baja, eva]), 'reemplazar')  # carga 3: ambos
    for imp, dia in zip((i1, i2, i3), dias):
        db.execute('UPDATE importaciones SET aplicado_en=? WHERE id=?', (dia, imp))
    alumnos = {a['matricula']: a for a in c.get('/api/alumnos', headers=h).json()['alumnos']}
    assert alumnos['T00000001']['tendencia'] == 'sin_historial'
    assert alumnos['T00000002']['tendencia'] == 'estable'
    # Dos cargas el mismo día: cuenta la última de ese día como corte.
    db.execute('UPDATE importaciones SET aplicado_en=? WHERE id=?', ('2026-10-28 09:00:00', i2))
    db.execute('UPDATE importaciones SET aplicado_en=? WHERE id=?', ('2026-10-27 09:00:00', i1))
    alumnos = {a['matricula']: a for a in c.get('/api/alumnos', headers=h).json()['alumnos']}
    assert alumnos['T00000001']['tendencia'] == 'empeora' and 'empeora' in alumnos['T00000001']['alertas']
    db.close()

def test_c6_excel_de_prueba_de_uziel(tmp_path):
    app = create_app(tmp_path/'a.db', tmp_path/'s'); c = TestClient(app); h = login(c)
    p = c.post('/api/importaciones/monitoreo', headers=h, files={'archivo': ('monitoreo-muestra.xlsx', FIXTURE.read_bytes())})
    assert p.status_code == 201, p.text
    r = p.json()['resumen']
    assert (r['filasValidas'], r['alumnos'], r['materias'], r['cursos'], r['bajas']) == (115, 15, 37, 78, 1)
    assert p.json()['advertencias'] == []
    c.post(f"/api/importaciones/{p.json()['importacion']['id']}/confirmar", headers=h, json={'modo': 'fusionar'})
    lista = c.get('/api/alumnos', headers=h).json()
    assert len(lista['alumnos']) == 15
    app.state.db.close()
