"""#27 · [HU-10] API del Excel de lista de seguimiento y #30 · renombrar, reemplazar y eliminar."""
from io import BytesIO
from openpyxl import Workbook
from tests.util import client, login, cargar_muestra, LISTA

def xlsx(filas, titulo='Hoja1'):
    w = Workbook(); s = w.active; s.title = titulo
    for f in filas: s.append(f)
    b = BytesIO(); w.save(b); return b.getvalue()

def previa(c, h, data, nombre='Matrículas.xlsx'):
    return c.post('/api/listas/previa', headers=h, files={'archivo': (nombre, data)})

def test_previa_con_el_fixture(tmp_path):
    app, c = client(tmp_path); h = login(c); cargar_muestra(c, h)
    r = previa(c, h, LISTA.read_bytes(), 'lista-muestra.xlsx')
    assert r.status_code == 200, r.text
    p = r.json()
    assert p['nombreSugerido'] == 'lista-muestra' and p['hoja'] == 'Todos'
    assert p['total'] == 13 and p['encontrados'] + len(p['noEncontrados']) == 13
    assert all(m['nombre'] == m['nombre'].strip() for m in p['matriculas'] if m['nombre'])
    # Los espacios al final no cuentan como nombre distinto (context/08 §2.2).
    assert all(d['nombreExcel'].strip() == d['nombreExcel'] for d in p['nombresDistintos'])
    app.state.db.close()

def test_reglas_de_lectura(tmp_path):
    app, c = client(tmp_path); h = login(c); cargar_muestra(c, h)
    data = xlsx([['Lista de 6.º semestre'], [], ['No. de matrícula', 'Nombre completo', None],
                 [' t90000001 ', 'PEREZ  fuentes Karla guadalupe '], ['T90000001', 'Duplicada'],
                 ['T90000013', 'Otro Nombre'], ['X00000000', 'Nadie'], [None, None]])
    p = previa(c, h, data).json()
    assert p['total'] == 3 and p['encontrados'] == 2
    assert p['noEncontrados'] == [{'matricula': 'X00000000', 'nombre': 'Nadie'}]
    assert [d['matricula'] for d in p['nombresDistintos']] == ['T90000013']
    solo_mat = previa(c, h, xlsx([['MATRÍCULA'], ['T90000001']])).json()
    assert solo_mat['total'] == 1 and solo_mat['matriculas'][0]['nombre'] is None
    r = previa(c, h, xlsx([['Nombre'], ['Ana']]))
    assert r.status_code == 422 and r.json()['code'] == 'FORMATO'
    assert previa(c, h, b'x', 'lista.csv').status_code == 415
    app.state.db.close()

def test_crud_y_filtro_de_alumnos(tmp_path):
    app, c = client(tmp_path); h = login(c); cargar_muestra(c, h)
    items = [{'matricula': 'T90000001', 'nombre': 'Pérez'}, {'matricula': 'X00000000', 'nombre': 'No está'}]
    r = c.post('/api/listas', headers=h, json={'nombre': '6.º semestre', 'archivo': 'Matrículas.xlsx', 'matriculas': items})
    assert r.status_code == 201, r.text
    lista = r.json()['lista']
    assert (lista['total'], lista['encontrados']) == (2, 1)
    assert c.post('/api/listas', headers=h, json={'nombre': '6.º SEMESTRE', 'matriculas': items}).status_code == 409
    assert c.post('/api/listas', headers=h, json={'nombre': 'Vacía', 'matriculas': []}).status_code == 400
    assert c.get('/api/listas', headers=h).json()['listas'][0]['nombre'] == '6.º semestre'
    det = c.get(f"/api/listas/{lista['id']}", headers=h).json()
    assert {m['matricula']: m['encontrado'] for m in det['matriculas']} == {'T90000001': True, 'X00000000': False}
    alumnos = c.get(f"/api/alumnos?lista={lista['id']}", headers=h).json()['alumnos']
    assert [a['matricula'] for a in alumnos] == ['T90000001']
    # #30: renombrar, reemplazar contenido y eliminar (sin borrar alumnos).
    r = c.put(f"/api/listas/{lista['id']}", headers=h, json={'nombre': 'Último año'})
    assert r.json()['lista']['nombre'] == 'Último año'
    r = c.put(f"/api/listas/{lista['id']}", headers=h, json={'matriculas': [{'matricula': 'T90000013'}, {'matricula': 'T90000015'}], 'archivo': 'nueva.xlsx'})
    assert r.json()['lista']['total'] == 2 and r.json()['lista']['archivo'] == 'nueva.xlsx'
    assert len(c.get(f"/api/alumnos?lista={lista['id']}", headers=h).json()['alumnos']) == 2
    assert c.delete(f"/api/listas/{lista['id']}", headers=h).json() == {'status': 'ok', 'id': lista['id']}
    assert c.get(f"/api/listas/{lista['id']}", headers=h).status_code == 404
    assert len(c.get('/api/alumnos', headers=h).json()['alumnos']) == 15
    app.state.db.close()
