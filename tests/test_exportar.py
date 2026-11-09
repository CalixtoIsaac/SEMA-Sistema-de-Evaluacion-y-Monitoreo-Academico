"""GET /api/alumnos/exportar (HU-24 · #42). Alumnos ficticios."""
import csv
import io
 
import pytest
from fastapi.testclient import TestClient
from openpyxl import load_workbook
 
from sema.auth import INITIAL_PASSWORD
from sema.main import create_app
from tests.test_imports import workbook
 
FILAS = [
    # periodo, matrícula, nombre, materia, clave, crn, faltas, A1, ponderado, límite, estatus
    ['202660', 'T00000001', 'Pérez López Ana', 'Química', 'Q1', '1', 0, 90, 90, 5, 'RW'],
    ['202660', 'T00000002', 'Muñoz Ruiz Beto', 'Química', 'Q1', '2', 0, 75, 75, 5, 'RW'],
    ['202660', 'T00000003', 'Murillo Soto Carla', 'Química', 'Q1', '3', 4, 60, 60, 5, 'RW'],
    ['202660', 'T00000004', 'Munoz Vega Dani', 'Química', 'Q1', '4', 0, 85, 85, 5, 'RW'],
    ['202660', 'T00000005', 'Soto Ruiz =cmd', 'Química', 'Q1', '5', 0, 95, 95, 5, 'RW'],
    ['202660', 'T00000006', 'Zeta Luna Luis', 'Química', 'Q1', '6', 0, 50, 50, 5, 'BT'],
]
 
 
@pytest.fixture
def cliente(tmp_path):
    app = create_app(tmp_path / 'app.db', tmp_path / 'secret')
    c = TestClient(app)
    token = c.post('/api/auth/login', json={'usuario': 'Chuchito', 'password': INITIAL_PASSWORD}).json()['token']
    c.headers.update({'Authorization': 'Bearer ' + token})
    p = c.post('/api/importaciones/monitoreo', files={'archivo': ('x.xlsx', workbook(FILAS))}).json()
    assert c.post(f"/api/importaciones/{p['importacion']['id']}/confirmar", json={'modo': 'fusionar'}).status_code == 200
    yield c
    app.state.db.close()
 
 
def tabla(respuesta):
    hoja = load_workbook(io.BytesIO(respuesta.content)).active
    return [list(f) for f in hoja.iter_rows(values_only=True)]
 
 
def nombres(respuesta):
    return [f[0] for f in tabla(respuesta)[1:]]
 
 
def test_requiere_sesion(cliente):
    cliente.headers.pop('Authorization')
    assert cliente.get('/api/alumnos/exportar').status_code == 401
 
 
def test_xlsx_por_defecto(cliente):
    r = cliente.get('/api/alumnos/exportar')
    assert r.status_code == 200
    assert r.headers['content-type'].startswith('application/vnd.openxmlformats')
    assert 'attachment; filename="SEMA_alumnos_todos_' in r.headers['content-disposition']
    filas = tabla(r)
    assert filas[0] == ['Nombre', 'Matrícula', 'Promedio', 'Faltas', 'Estado', 'Materias reprobando']
    assert len(filas) == 7
    ana = next(f for f in filas if f[1] == 'T00000001')
    assert ana == ['Ana Pérez López', 'T00000001', 90, 0, 'Correcto', 0]
    carla = next(f for f in filas if f[1] == 'T00000003')
    assert carla[2:] == [60, 4, 'Crítico', 1]
 
 
def test_orden_por_defecto_es_por_nombre_con_la_enie_despues_de_la_n(cliente):
    r = cliente.get('/api/alumnos/exportar', params={'formato': 'csv'})
    nombres_csv = [f[0] for f in csv.reader(io.StringIO(r.content.decode('utf-8-sig')))][1:]
    # Los símbolos van primero (como localeCompare en la tabla); la baja, al final.
    assert nombres_csv == ["'=cmd Soto Ruiz", 'Ana Pérez López', 'Beto Muñoz Ruiz', 'Carla Murillo Soto',
                           'Dani Munoz Vega', 'Luis Zeta Luna']
 
 
def test_formato_apellidos_nombres(cliente):
    cliente.app.state.db.execute("UPDATE usuarios SET formato_nombre='apellidos_nombres'")
    primeros = nombres(cliente.get('/api/alumnos/exportar'))
    # Munoz (n) va antes que Muñoz (ñ), y los dos antes que Murillo
    assert primeros.index('Munoz Vega Dani') < primeros.index('Muñoz Ruiz Beto') < primeros.index('Murillo Soto Carla')
 
 
def test_filtro_por_estado(cliente):
    assert nombres(cliente.get('/api/alumnos/exportar', params={'estado': 'critico'})) == ['Carla Murillo Soto']
    assert nombres(cliente.get('/api/alumnos/exportar', params={'estado': 'baja'})) == ['Luis Zeta Luna']
    assert nombres(cliente.get('/api/alumnos/exportar', params={'estado': 'empeora'})) == []
 
 
def test_busqueda_sin_acentos_y_por_palabras(cliente):
    r = cliente.get('/api/alumnos/exportar', params={'q': 'munoz'})
    assert sorted(nombres(r)) == ['Beto Muñoz Ruiz', 'Dani Munoz Vega']
    assert nombres(cliente.get('/api/alumnos/exportar', params={'q': 'ruiz beto'})) == ['Beto Muñoz Ruiz']
    assert nombres(cliente.get('/api/alumnos/exportar', params={'q': 't00000003'})) == ['Carla Murillo Soto']
    assert nombres(cliente.get('/api/alumnos/exportar', params={'q': 'nadie'})) == []
 
 
def test_orden_promedio_y_faltas(cliente):
    r = cliente.get('/api/alumnos/exportar', params={'orden': 'promedio,faltas', 'estado': 'todos'})
    promedios = [f[2] for f in tabla(r)[1:]]
    assert promedios == [60, 75, 85, 90, 95, None]          # menor→mayor, la baja (sin promedio) al final
    r = cliente.get('/api/alumnos/exportar', params={'orden': 'faltas'})
    assert nombres(r)[0] == 'Carla Murillo Soto'             # 4 faltas, la mayor
 
 
def test_csv_con_bom_y_sin_formulas(cliente):
    r = cliente.get('/api/alumnos/exportar', params={'formato': 'csv'})
    assert r.headers['content-type'].startswith('text/csv')
    assert r.content.startswith(b'\xef\xbb\xbf')
    filas = list(csv.reader(io.StringIO(r.content.decode('utf-8-sig'))))
    assert filas[0][0] == 'Nombre'
    peligroso = next(f for f in filas if f[1] == 'T00000005')
    assert peligroso[0].startswith("'=")                   # no se ejecuta como fórmula
    assert next(f for f in filas if f[1] == 'T00000006')[3:] == ['', 'Baja', '']
 
 
def test_xlsx_no_trae_formulas(cliente):
    hoja = load_workbook(io.BytesIO(cliente.get('/api/alumnos/exportar').content)).active
    assert all(c.data_type != 'f' for fila in hoja.iter_rows() for c in fila)
 
 
def test_nombre_de_archivo_con_lista(cliente):
    db = cliente.app.state.db
    db.execute("INSERT INTO listas(nombre) VALUES ('6.º semestre')")
    db.execute("INSERT INTO lista_alumnos(lista_id,matricula) VALUES (1,'T00000001')")
    r = cliente.get('/api/alumnos/exportar', params={'lista': 1})
    assert nombres(r) == ['Ana Pérez López']
    cd = r.headers['content-disposition']
    assert 'SEMA_alumnos_6-semestre_' in cd and cd.count('.xlsx') == 2
 
 
@pytest.mark.parametrize('params, codigo', [
    ({'formato': 'pdf'}, 400), ({'estado': 'rojo'}, 400), ({'orden': 'nombre'}, 400),
    ({'lista': 999}, 404), ({'periodo': '209999'}, 404),
])
def test_errores(cliente, params, codigo):
    r = cliente.get('/api/alumnos/exportar', params=params)
    assert r.status_code == codigo and 'error' in r.json()
 
 
def test_sin_datos_exporta_solo_encabezados(tmp_path):
    app = create_app(tmp_path / 'app.db', tmp_path / 'secret')
    c = TestClient(app)
    token = c.post('/api/auth/login', json={'usuario': 'Chuchito', 'password': INITIAL_PASSWORD}).json()['token']
    r = c.get('/api/alumnos/exportar', headers={'Authorization': 'Bearer ' + token})
    assert r.status_code == 200 and len(tabla(r)) == 1
    app.state.db.close()
 