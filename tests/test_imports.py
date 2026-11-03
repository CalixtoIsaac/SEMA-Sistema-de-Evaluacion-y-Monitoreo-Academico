from io import BytesIO
from openpyxl import Workbook
from fastapi.testclient import TestClient
from sema.main import create_app
from sema.auth import INITIAL_PASSWORD

def workbook(rows):
    w=Workbook();s=w.active
    s.append(['Año - periodo','Matrícula','Nombre del alumno','Nombre de la materia','Clave de materia','CRN','Faltas del alumno','A1','Ponderado','Límite de faltas','Estatus'])
    for row in rows:s.append(row)
    b=BytesIO();w.save(b);return b.getvalue()

def test_flow(tmp_path):
    app=create_app(tmp_path/'app.db',tmp_path/'secret')
    c=TestClient(app)
    assert c.post('/api/importaciones/monitoreo',files={'archivo':('x.xlsx',b'no')}).status_code==401
    token=c.post('/api/auth/login',json={'usuario':'Chuchito','password':INITIAL_PASSWORD}).json()['token']
    headers={'Authorization':'Bearer '+token}
    data=workbook([['202660','T00000001','Pérez López Ana','Química','Q1','1',4,90,90,5,'RW'],['202660','T00000001','Pérez López Ana','Física','F1','2',0,80,'SD',5,'BT']])
    p=c.post('/api/importaciones/monitoreo',headers=headers,files={'archivo':('x.xlsx',data)})
    assert p.status_code==201,p.text
    ident=p.json()['importacion']['id'];db=app.state.db
    assert db.execute('SELECT count(*) FROM alumnos').fetchone()[0]==0
    assert c.get(f'/api/importaciones/{ident}/muestra',headers=headers).json()['total']==2
    assert c.post(f'/api/importaciones/{ident}/confirmar',headers=headers,json={'modo':'fusionar'}).status_code==200
    assert db.execute('SELECT count(*) FROM inscripciones').fetchone()[0]==2
    assert db.execute('SELECT count(*) FROM cortes_alumno').fetchone()[0]==1
    assert c.post(f'/api/importaciones/{ident}/confirmar',headers=headers,json={'modo':'fusionar'}).status_code==409
    p2=c.post('/api/importaciones/monitoreo',headers=headers,files={'archivo':('x.xlsx',data)})
    assert c.delete(f"/api/importaciones/{p2.json()['importacion']['id']}",headers=headers).status_code==200
    app.state.db.close()

def test_replace_and_rollback(tmp_path):
    app=create_app(tmp_path/'app.db',tmp_path/'secret');c=TestClient(app,raise_server_exceptions=False)
    token=c.post('/api/auth/login',json={'usuario':'Chuchito','password':INITIAL_PASSWORD}).json()['token'];h={'Authorization':'Bearer '+token}
    def stage(rows):
        p=c.post('/api/importaciones/monitoreo',headers=h,files={'archivo':('x.xlsx',workbook(rows))})
        assert p.status_code==201,p.text
        return p.json()['importacion']['id']
    a=['202660','T00000001','Pérez López Ana','Química','Q1','1',0,90,90,5,'RW']
    b=['202660','T00000002','Ruiz Soto Eva','Química','Q1','1',0,90,90,5,'RW']
    ident=stage([a,b]);assert c.post(f'/api/importaciones/{ident}/confirmar',headers=h,json={'modo':'fusionar'}).status_code==200
    db=app.state.db
    db.execute("UPDATE alumnos SET apellidos='Corregido',nombre_corregido=1 WHERE matricula='T00000001'")
    ident=stage([a]);assert c.post(f'/api/importaciones/{ident}/confirmar',headers=h,json={'modo':'reemplazar'}).json()['resultado']['eliminadas']==1
    assert db.execute('SELECT count(*) FROM inscripciones').fetchone()[0]==1
    assert db.execute("SELECT apellidos FROM alumnos WHERE matricula='T00000001'").fetchone()[0]=='Corregido'
    ident=stage([a]);db.execute("CREATE TRIGGER fail_cut BEFORE INSERT ON cortes_alumno BEGIN SELECT RAISE(FAIL,'fallo'); END")
    r=c.post(f'/api/importaciones/{ident}/confirmar',headers=h,json={'modo':'fusionar'})
    assert r.status_code==500
    assert db.execute('SELECT estado FROM importaciones WHERE id=?',(ident,)).fetchone()[0]=='previa'
    db.execute('DROP TRIGGER fail_cut');db.close()
