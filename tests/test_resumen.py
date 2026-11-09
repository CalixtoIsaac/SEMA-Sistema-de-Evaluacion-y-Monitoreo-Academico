"""#34 · API del Resumen administrativo y #37 · evolución del grupo (context/07 §9.3 y §10)."""
from tests.util import client, login, cargar, cargar_muestra
from tests.test_imports import workbook

def test_resumen_vacio(tmp_path):
    app, c = client(tmp_path); h = login(c)
    assert c.get('/api/resumen').status_code == 401
    r = c.get('/api/resumen', headers=h).json()
    assert r['vacio'] is True and r['kpis'] is None and r['porEstado'] == [] and r['topRiesgo'] == []
    app.state.db.close()

def test_resumen_con_la_muestra(tmp_path):
    app, c = client(tmp_path); h = login(c); cargar_muestra(c, h)
    r = c.get('/api/resumen', headers=h).json()
    alumnos = c.get('/api/alumnos', headers=h).json()
    activos = [a for a in alumnos['alumnos'] if a['estado'] != 'baja']
    k = r['kpis']
    assert r['vacio'] is False and r['ultimaActualizacion']
    assert k['alumnos'] == len(activos) == 14 and k['bajas'] == 1
    assert (k['critico'], k['preventivo'], k['correcto']) == (alumnos['totales']['critico'], alumnos['totales']['preventivo'], alumnos['totales']['correcto'])
    proms = [a['promedioGeneral'] for a in activos if a['promedioGeneral'] is not None]
    assert k['promedioGeneral'] == round(sum(proms) / len(proms), 1)
    assert sum(x['total'] for x in r['porRango']) == len(proms)
    assert [x['rango'] for x in r['porRango']] == ['<60', '60-69', '70-79', '80-89', '90-100']
    assert sum(x['total'] for x in r['porEstadoFaltas']) == 14
    assert all(m['alumnos'] >= 5 for m in r['materiasBajas']) and len(r['materiasBajas']) <= 10
    assert [m['promedio'] for m in r['materiasBajas']] == sorted(m['promedio'] for m in r['materiasBajas'])
    top = r['topRiesgo']
    assert len(top) == 6 and all(a['estado'] in ('critico', 'preventivo') for a in top)
    assert top[0]['matricula'] == 'T90000015'  # el de menor promedio primero
    assert len(r['evolucion']) == 1 and r['tendencias']['sinHistorial'] == 14
    app.state.db.close()

def test_resumen_por_lista_y_lista_inexistente(tmp_path):
    app, c = client(tmp_path); h = login(c); cargar_muestra(c, h)
    db = app.state.db
    ident = db.execute("INSERT INTO listas(nombre) VALUES ('Dos')").lastrowid
    db.executemany('INSERT INTO lista_alumnos(lista_id,matricula) VALUES (?,?)', [(ident, 'T90000015'), (ident, 'T90000001')])
    r = c.get(f'/api/resumen?lista={ident}', headers=h).json()
    assert r['kpis']['alumnos'] == 2 and r['kpis']['critico'] == 1
    assert c.get('/api/resumen?lista=999', headers=h).status_code == 404
    app.state.db.close()

def test_evolucion_del_grupo_y_tendencias(tmp_path):
    app, c = client(tmp_path); h = login(c); db = app.state.db
    ana = lambda cal: ['202660', 'T00000001', 'Pérez López Ana', 'Física', 'F1', '1', 0, cal, cal, 10, 'RW']
    eva = lambda cal: ['202660', 'T00000002', 'Ruiz Soto Eva', 'Física', 'F1', '1', 0, cal, cal, 10, 'RW']
    i1 = cargar(c, h, workbook([ana(85), eva(75)]))
    i2 = cargar(c, h, workbook([ana(60), eva(78)]))
    i3 = cargar(c, h, workbook([ana(62), eva(80)]))  # mismo día que i2: solo cuenta el último
    for imp, dia in ((i1, '2026-10-06 09:00:00'), (i2, '2026-10-20 09:00:00'), (i3, '2026-10-20 18:00:00')):
        db.execute('UPDATE importaciones SET aplicado_en=? WHERE id=?', (dia, imp))
    r = c.get('/api/resumen', headers=h).json()
    assert r['evolucion'] == [
        {'importacionId': i1, 'fecha': '2026-10-06', 'promedio': 80.0, 'porcentajeCritico': 0.0, 'alumnos': 2},
        {'importacionId': i3, 'fecha': '2026-10-20', 'promedio': 71.0, 'porcentajeCritico': 50.0, 'alumnos': 2},
    ]
    assert r['tendencias'] == {'mejora': 1, 'estable': 0, 'empeora': 1, 'sinHistorial': 0}
    db.close()
