from fastapi.testclient import TestClient
from sema.main import create_app
from sema.auth import INITIAL_PASSWORD
from tests.test_imports import workbook

def test_listing(tmp_path):
    app=create_app(tmp_path/'app.db',tmp_path/'secret');c=TestClient(app)
    assert c.get('/api/alumnos').status_code==401
    t=c.post('/api/auth/login',json={'usuario':'Chuchito','password':INITIAL_PASSWORD}).json()['token'];h={'Authorization':'Bearer '+t}
    assert c.get('/api/alumnos',headers=h).json()['periodo'] is None
    data=workbook([['202660','T00000001','Pérez López Ana','Química','Q1','1',4,90,90,5,'RW'],['202660','T00000001','Pérez López Ana','Física','F1','2',0,80,80,5,'RW']])
    p=c.post('/api/importaciones/monitoreo',headers=h,files={'archivo':('x.xlsx',data)}).json()
    assert c.post(f"/api/importaciones/{p['importacion']['id']}/confirmar",headers=h,json={'modo':'fusionar'}).status_code==200
    result=c.get('/api/alumnos',headers=h).json();a=result['alumnos'][0]
    assert a['promedioGeneral']==85 and a['faltasTotal']==4 and a['estado']=='critico' and a['motivoEstado']=='faltas'
    assert a['faltasPeorMateria']['porcentaje']==80
    assert result['totales']['critico']==1
    assert c.get('/api/alumnos?lista=999',headers=h).status_code==404
    app.state.db.close()

def test_period_and_list(tmp_path):
    app=create_app(tmp_path/'app.db',tmp_path/'secret');c=TestClient(app)
    t=c.post('/api/auth/login',json={'usuario':'Chuchito','password':INITIAL_PASSWORD}).json()['token'];h={'Authorization':'Bearer '+t}
    for period,mat in [('202660','T00000001'),('202710','T00000002')]:
        data=workbook([[period,mat,'Ruiz Soto Eva','Física','F1','1',0,80,80,5,'RW']])
        p=c.post('/api/importaciones/monitoreo',headers=h,files={'archivo':('x.xlsx',data)}).json()
        assert c.post(f"/api/importaciones/{p['importacion']['id']}/confirmar",headers=h,json={'modo':'fusionar'}).status_code==200
    assert c.get('/api/alumnos',headers=h).json()['periodo']['clave']=='202710'
    db=app.state.db
    db.execute("INSERT INTO listas(nombre) VALUES ('Grupo')")
    db.execute("INSERT INTO lista_alumnos(lista_id,matricula) VALUES (1,'T00000001')")
    assert len(c.get('/api/alumnos?periodo=202660&lista=1',headers=h).json()['alumnos'])==1
    assert not c.get('/api/alumnos?periodo=202710&lista=1',headers=h).json()['alumnos']
    db.close()

def test_threshold_and_sd(tmp_path):
    app=create_app(tmp_path/'app.db',tmp_path/'secret');c=TestClient(app)
    t=c.post('/api/auth/login',json={'usuario':'Chuchito','password':INITIAL_PASSWORD}).json()['token'];h={'Authorization':'Bearer '+t}
    data=workbook([['202660','T00000001','Ruiz Soto Eva','Física','F1','1',0,90,'SD',5,'RW']])
    p=c.post('/api/importaciones/monitoreo',headers=h,files={'archivo':('x.xlsx',data)}).json()
    c.post(f"/api/importaciones/{p['importacion']['id']}/confirmar",headers=h,json={'modo':'fusionar'})
    a=c.get('/api/alumnos',headers=h).json()['alumnos'][0]
    assert a['estado']=='critico' and a['promedioGeneral'] is None and 'sin_derecho' in a['alertas']
    db=app.state.db
    db.execute("UPDATE inscripciones SET calificacion=75,calificacion_codigo=NULL")
    db.execute("UPDATE configuracion SET valor='75' WHERE clave='calificacion.correcto_min'")
    assert c.get('/api/alumnos',headers=h).json()['alumnos'][0]['estadoPromedio']=='correcto'
    db.close()

def test_manual_grade_in_listing(tmp_path):
    app=create_app(tmp_path/'app.db',tmp_path/'secret');c=TestClient(app)
    token=c.post('/api/auth/login',json={'usuario':'Chuchito','password':INITIAL_PASSWORD}).json()['token']
    db=app.state.db
    db.execute("INSERT INTO periodos(clave,nombre) VALUES ('202660','Prueba')")
    db.execute("INSERT INTO materias(clave,nombre) VALUES ('Q1','Química')")
    db.execute("INSERT INTO cursos(crn,periodo_id,materia_id) VALUES ('1',1,1)")
    db.execute("INSERT INTO alumnos(matricula,nombre,apellidos,nombres,nombre_busqueda,origen) VALUES ('T00000001','Ruiz Soto Eva','Ruiz Soto','Eva','ruiz soto eva','manual')")
    db.execute("INSERT INTO inscripciones(alumno_id,curso_id,origen) VALUES (1,1,'manual')")
    db.executemany('INSERT INTO actividades(inscripcion_id,numero,valor,codigo) VALUES (1,?,?,?)',[(1,100,None),(2,None,'SC'),(3,80,None),(4,None,'NE')])
    row=c.get('/api/alumnos',headers={'Authorization':'Bearer '+token}).json()['alumnos'][0]
    assert row['promedioGeneral']==45 and row['estado']=='critico'
    assert 'sin_calificar' in row['alertas']
    assert 'materiasCriticas' not in row
    db.close()


def test_tendencia_contract():
    from sema.students import trend
    assert trend({'estado':'preventivo','promedio':87},{'estado':'correcto','promedio':85},2)=='empeora'
    assert trend({'estado':'preventivo','promedio':77.5},{'estado':'preventivo','promedio':75},2)=='mejora'
    assert trend({'estado':'preventivo','promedio':76},{'estado':'preventivo','promedio':75},2)=='estable'
    assert trend({'estado':'correcto','promedio':85},None,2)=='sin_historial'
