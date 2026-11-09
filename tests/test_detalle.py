"""#20 · [HU-17] API del detalle del alumno y corrección de nombre (M-12)."""
from tests.util import client, login, cargar, cargar_muestra
from tests.test_imports import workbook

def test_detalle_con_materias_ordenadas_y_motivo(tmp_path):
    app, c = client(tmp_path); h = login(c); cargar_muestra(c, h)
    assert c.get('/api/alumnos/T90000015').status_code == 401
    d = c.get('/api/alumnos/t90000015', headers=h).json()  # la matrícula no distingue mayúsculas
    a = d['alumno']
    assert a['matricula'] == 'T90000015' and a['estado'] == 'critico' and a['motivoEstado'] == 'sin_derecho'
    assert 'SD' in a['motivoTexto'] and 'sin_derecho' in a['alertas']
    assert a['planDescripcion'] and a['periodo']['clave'] == '202660' and a['listas'] == []
    estados = [m['estado'] for m in d['materias'] if not m['esBaja']]
    orden = {'critico': 0, 'preventivo': 1, 'correcto': 2, 'sin_datos': 3}
    assert estados == sorted(estados, key=orden.get), 'materias de peor a mejor'
    sd = [m for m in d['materias'] if m['calificacionCodigo'] == 'SD']
    assert sd and sd[0]['estadoCalificacion'] == 'critico'
    m = d['materias'][0]
    assert {'actividades', 'faltas', 'limiteFaltas', 'porcentajeFaltas', 'estadoFaltas', 'profesor', 'crn'} <= set(m)
    assert len(d['evolucion']) == 1 and a['tendencia'] == 'sin_historial'
    app.state.db.close()

def test_detalle_bajas_al_final_y_404(tmp_path):
    app, c = client(tmp_path); h = login(c)
    cargar(c, h, workbook([
        ['202660', 'T00000001', 'Pérez López Ana', 'Química', 'Q1', '1', 0, 95, 95, 5, 'BT'],
        ['202660', 'T00000001', 'Pérez López Ana', 'Física', 'F1', '2', 4, 90, 90, 5, 'RW'],
        ['202660', 'T00000001', 'Pérez López Ana', 'Historia', 'H1', '3', 0, 100, 100, 5, 'RW'],
    ]))
    d = c.get('/api/alumnos/T00000001', headers=h).json()
    assert [m['nombre'] for m in d['materias']] == ['Física', 'Historia', 'Química']
    assert d['materias'][-1]['esBaja'] is True
    assert d['alumno']['motivoTexto'] == 'Crítico por faltas en Física (4 / 5)'
    assert d['materias'][0]['porcentajeFaltas'] == 80
    r = c.get('/api/alumnos/T99999999', headers=h)
    assert r.status_code == 404 and r.json()['code'] == 'NO_ENCONTRADO'
    app.state.db.close()

def test_evolucion_y_faltas_nuevas(tmp_path):
    app, c = client(tmp_path); h = login(c); db = app.state.db
    fila = lambda faltas, cal: ['202660', 'T00000001', 'Pérez López Ana', 'Física', 'F1', '1', faltas, cal, cal, 10, 'RW']
    i1 = cargar(c, h, workbook([fila(0, 85)]))
    i2 = cargar(c, h, workbook([fila(6, 87)]))
    db.execute("UPDATE importaciones SET aplicado_en='2026-10-06 10:00:00' WHERE id=?", (i1,))
    db.execute("UPDATE importaciones SET aplicado_en='2026-10-20 10:00:00' WHERE id=?", (i2,))
    d = c.get('/api/alumnos/T00000001', headers=h).json()
    assert [e['fecha'] for e in d['evolucion']] == ['2026-10-06', '2026-10-20']
    assert d['alumno']['tendencia'] == 'empeora'  # Correcto → Preventivo por faltas (context/07 caso 15)
    assert d['faltasNuevas'] == {'faltas': 6, 'desde': '2026-10-06', 'estadoAnterior': 'correcto', 'promedioAnterior': 85.0}
    db.close()

def test_corregir_nombre_se_conserva_en_nuevas_cargas(tmp_path):
    app, c = client(tmp_path); h = login(c)
    data = workbook([['202660', 'T00000001', 'De la O Murillo María José', 'Física', 'F1', '1', 0, 90, 90, 5, 'RW']])
    cargar(c, h, data)
    r = c.put('/api/alumnos/T00000001/nombre', headers=h, json={'apellidos': ' De la O  Murillo ', 'nombres': 'María José'})
    assert r.status_code == 200 and r.json()['alumno']['nombreCorregido'] is True
    assert r.json()['alumno']['nombreMostrar'] == 'María José De la O Murillo'
    cargar(c, h, data)
    a = c.get('/api/alumnos', headers=h).json()['alumnos'][0]
    assert (a['apellidos'], a['nombres']) == ('De la O Murillo', 'María José')
    assert c.put('/api/alumnos/T00000001/nombre', headers=h, json={'apellidos': '', 'nombres': 'X'}).status_code == 400
    assert c.put('/api/alumnos/T99999999/nombre', headers=h, json={'apellidos': 'A', 'nombres': 'B'}).status_code == 404
    app.state.db.close()

def test_exportar_no_lo_captura_el_detalle(tmp_path):
    app, c = client(tmp_path); h = login(c); cargar_muestra(c, h)
    r = c.get('/api/alumnos/exportar?formato=csv', headers=h)
    assert r.status_code == 200 and r.headers['content-type'].startswith('text/csv')
    app.state.db.close()
