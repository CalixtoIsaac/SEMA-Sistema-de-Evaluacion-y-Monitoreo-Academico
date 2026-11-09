"""#31 · [HU-08] Alta manual de alumnos y materias."""
from tests.util import client, login, cargar, cargar_muestra
from tests.test_imports import workbook

MATERIA = {'materiaNombre': 'Taller de lectura', 'actividades': [100, 'SC', 80, 'ne', None], 'faltas': 2, 'limiteFaltas': 10}

def test_sin_periodo_pide_cargar_excel(tmp_path):
    app, c = client(tmp_path); h = login(c)
    r = c.post('/api/alumnos', headers=h, json={'matricula': 'T1', 'apellidos': 'A', 'nombres': 'B', 'materias': [MATERIA]})
    assert r.status_code == 409 and r.json()['code'] == 'SIN_PERIODO'
    app.state.db.close()

def test_alta_manual_y_calculo(tmp_path):
    app, c = client(tmp_path); h = login(c); cargar_muestra(c, h)
    r = c.post('/api/alumnos', headers=h, json={'matricula': 't00000099', 'apellidos': 'De la O  Murillo', 'nombres': 'María José',
                                                'planClave': 'BAG_SR', 'materias': [MATERIA]})
    assert r.status_code == 201, r.text
    d = r.json()
    a, m = d['alumno'], d['materias'][0]
    assert a['matricula'] == 'T00000099' and a['origen'] == 'manual' and a['nombreMostrar'] == 'María José De la O Murillo'
    assert a['planDescripcion'] == 'Bachillerato General'  # se toma del catálogo de planes
    assert m['calificacion'] == 45 and m['calificacionCalculada'] and m['estado'] == 'critico'  # caso 8 de context/07 §11
    assert m['limiteFaltas'] == 10 and m['origen'] == 'manual' and m['clave'].startswith('MAN-')
    fila = next(x for x in c.get('/api/alumnos', headers=h).json()['alumnos'] if x['matricula'] == 'T00000099')
    assert fila['promedioGeneral'] == 45 and 'sin_calificar' in fila['alertas']
    dup = c.post('/api/alumnos', headers=h, json={'matricula': 'T00000099', 'apellidos': 'X', 'nombres': 'Y'})
    assert dup.status_code == 409 and dup.json()['code'] == 'MATRICULA_EXISTE'
    assert {x['clave'] for x in c.get('/api/materias', headers=h).json()['materias']} >= {m['clave']}
    assert c.get('/api/planes', headers=h).json()['planes'][0]['clave']
    assert c.get('/api/periodos', headers=h).json()['periodos'] == [{'clave': '202660', 'nombre': '2026 Ago - Dic', 'actual': True}]
    app.state.db.close()

def test_validaciones(tmp_path):
    app, c = client(tmp_path); h = login(c); cargar_muestra(c, h)
    base = {'matricula': 'T00000099', 'apellidos': 'Ruiz', 'nombres': 'Eva'}
    for materia in ({**MATERIA, 'actividades': [101]}, {**MATERIA, 'actividades': ['XX']}, {**MATERIA, 'calificacion': -1},
                    {**MATERIA, 'faltas': -1}, {'actividades': []}, {**MATERIA, 'materiaNombre': None, 'materiaClave': 'NOEXISTE'}):
        r = c.post('/api/alumnos', headers=h, json={**base, 'materias': [materia]})
        assert r.status_code == 400 and r.json()['code'] == 'VALIDACION', materia
    assert c.post('/api/alumnos', headers=h, json={**base, 'apellidos': ' '}).status_code == 400
    assert c.post('/api/alumnos', headers=h, json={**base, 'matricula': 'T 1'}).status_code == 400
    assert c.get('/api/alumnos/T00000099', headers=h).status_code == 404  # nada se guardó
    app.state.db.close()

def test_materias_en_alumno_del_excel_y_edicion(tmp_path):
    app, c = client(tmp_path); h = login(c); cargar_muestra(c, h)
    r = c.post('/api/alumnos/T90000001/materias', headers=h, json={**MATERIA, 'calificacion': 90})
    assert r.status_code == 201, r.text
    m = r.json()['materia']
    assert m['calificacion'] == 90 and not m['calificacionCalculada']
    assert c.post('/api/alumnos/T90000001/materias', headers=h, json=MATERIA).json()['code'] == 'MATERIA_REPETIDA'
    excel = next(x for x in c.get('/api/alumnos/T90000001', headers=h).json()['materias'] if x['origen'] == 'excel')
    assert c.put(f"/api/inscripciones/{excel['inscripcionId']}", headers=h, json=MATERIA).status_code == 409
    assert c.delete(f"/api/inscripciones/{excel['inscripcionId']}", headers=h).status_code == 409
    r = c.put(f"/api/inscripciones/{m['inscripcionId']}", headers=h, json={**MATERIA, 'calificacion': None, 'actividades': [70, 90], 'faltas': 5})
    assert r.json()['materia']['calificacion'] == 80 and r.json()['materia']['estadoFaltas'] == 'preventivo'
    assert c.delete('/api/alumnos/T90000001', headers=h).status_code == 409  # alumno del Excel
    assert c.delete(f"/api/inscripciones/{m['inscripcionId']}", headers=h).json() == {'status': 'ok'}
    assert c.delete(f"/api/inscripciones/{m['inscripcionId']}", headers=h).status_code == 404
    app.state.db.close()

def test_reemplazar_no_borra_lo_manual_y_eliminar(tmp_path):
    app, c = client(tmp_path); h = login(c)
    cargar(c, h, workbook([['202660', 'T00000001', 'Pérez López Ana', 'Física', 'F1', '1', 0, 90, 90, 5, 'RW']]))
    c.post('/api/alumnos', headers=h, json={'matricula': 'T00000050', 'apellidos': 'Ruiz', 'nombres': 'Eva', 'materias': [MATERIA]})
    cargar(c, h, workbook([['202660', 'T00000002', 'Soto Ruiz Leo', 'Física', 'F1', '1', 0, 90, 90, 5, 'RW']]), 'reemplazar')
    mats = {a['matricula'] for a in c.get('/api/alumnos', headers=h).json()['alumnos']}
    assert mats == {'T00000002', 'T00000050'}
    r = c.put('/api/alumnos/T00000050', headers=h, json={'planClave': 'MAN', 'planDescripcion': 'Plan manual'})
    assert r.json()['alumno']['planClave'] == 'MAN'
    assert c.put('/api/alumnos/T00000002', headers=h, json={'planClave': 'X'}).status_code == 409
    assert c.delete('/api/alumnos/T00000050', headers=h).json() == {'status': 'ok'}
    assert c.get('/api/alumnos/T00000050', headers=h).status_code == 404
    assert app.state.db.execute("SELECT COUNT(*) FROM cursos WHERE crn LIKE 'MAN-%'").fetchone()[0] == 0
    app.state.db.close()
