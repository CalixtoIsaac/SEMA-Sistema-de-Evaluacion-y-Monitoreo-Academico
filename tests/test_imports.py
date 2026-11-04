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

def test_manual_enrollment_unchanged(tmp_path):
    app=create_app(tmp_path/'app.db',tmp_path/'secret')
    c=TestClient(app)
    token=c.post('/api/auth/login',json={'usuario':'Chuchito','password':INITIAL_PASSWORD}).json()['token']
    h={'Authorization':'Bearer '+token}
    db=app.state.db
    with db:
        db.execute("INSERT INTO periodos(clave,nombre) VALUES ('202660','Prueba')")
        db.execute("INSERT INTO materias(clave,nombre) VALUES ('Q1','Química')")
        db.execute("INSERT INTO cursos(crn,periodo_id,materia_id) VALUES ('1',1,1)")
        db.execute("INSERT INTO alumnos(matricula,nombre,apellidos,nombres,nombre_busqueda,origen) VALUES ('T00000001','Pérez López Ana','Pérez López','Ana','perez lopez ana','manual')")
        db.execute("INSERT INTO inscripciones(alumno_id,curso_id,faltas,calificacion,origen) VALUES (1,1,2,95,'manual')")
        db.execute("INSERT INTO actividades(inscripcion_id,numero,valor) VALUES (1,1,95)")
    row=['202660','T00000001','Pérez López Ana','Química','Q1','1',4,40,40,5,'RW']
    p=c.post('/api/importaciones/monitoreo',headers=h,files={'archivo':('x.xlsx',workbook([row]))})
    assert p.status_code==201,p.text
    ident=p.json()['importacion']['id']
    applied=c.post(f'/api/importaciones/{ident}/confirmar',headers=h,json={'modo':'reemplazar'})
    assert applied.status_code==200,applied.text
    record=db.execute('SELECT origen,faltas,calificacion FROM inscripciones WHERE id=1').fetchone()
    assert tuple(record)==('manual',2,95)
    assert db.execute('SELECT valor FROM actividades WHERE inscripcion_id=1').fetchone()[0]==95
    db.close()

def test_all_baja_cut_and_pagination(tmp_path):
    app=create_app(tmp_path/'app.db',tmp_path/'secret');c=TestClient(app)
    token=c.post('/api/auth/login',json={'usuario':'Chuchito','password':INITIAL_PASSWORD}).json()['token']
    h={'Authorization':'Bearer '+token}
    rows=[['202660',f'T{i:08d}','Ruiz Soto Eva','Física','F1',str(i),0,80,None,5,'BT'] for i in range(52)]
    p=c.post('/api/importaciones/monitoreo',headers=h,files={'archivo':('x.xlsx',workbook(rows))})
    assert p.status_code==201,p.text
    ident=p.json()['importacion']['id']
    assert len(p.json()['muestra'])==20
    sample=c.get(f'/api/importaciones/{ident}/muestra?todas=1&pagina=2',headers=h).json()
    assert sample['total']==52 and len(sample['filas'])==2
    assert c.post(f'/api/importaciones/{ident}/confirmar',headers=h,json={'modo':'fusionar'}).status_code==200
    assert app.state.db.execute("SELECT count(*) FROM cortes_alumno WHERE estado='baja' AND materias_criticas=0").fetchone()[0]==52
    app.state.db.close()

def test_upload_errors(tmp_path):
    app=create_app(tmp_path/'app.db',tmp_path/'secret');c=TestClient(app)
    token=c.post('/api/auth/login',json={'usuario':'Chuchito','password':INITIAL_PASSWORD}).json()['token'];h={'Authorization':'Bearer '+token}
    assert c.post('/api/importaciones/monitoreo',headers=h,files={'archivo':('bad.txt',b'x')}).status_code==415
    assert c.post('/api/importaciones/monitoreo',headers=h,files={'archivo':('bad.xlsx',b'x')}).status_code==422
    assert c.post('/api/importaciones/monitoreo',headers=h,files={'archivo':('large.xlsx',b'x'*(15*1024*1024+1))}).status_code==413
    app.state.db.close()
