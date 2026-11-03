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
