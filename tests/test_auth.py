import bcrypt
import jwt
from fastapi.testclient import TestClient
from sema.main import create_app
from sema.auth import INITIAL_PASSWORD
from scripts.reset_password import reset

def test_auth(tmp_path):
    db_path,secret = tmp_path/'app.db',tmp_path/'jwt.secret'
    app=create_app(db_path,secret)
    c=TestClient(app)
    row=app.state.db.execute('SELECT * FROM usuarios').fetchone()
    assert row['usuario']=='Chuchito' and row['password_por_defecto']==1
    assert row['password_hash'] != INITIAL_PASSWORD
    assert bcrypt.checkpw(INITIAL_PASSWORD.encode(),row['password_hash'].encode())
    assert c.post('/api/auth/login',json={'usuario':'Chuchito','password':'mal'}).status_code==401
    login=c.post('/api/auth/login',json={'usuario':'Chuchito','password':INITIAL_PASSWORD})
    assert login.status_code==200
    token=login.json()['token']
    assert c.get('/api/auth/me',headers={'Authorization':'Bearer '+token}).json()['user']['passwordPorDefecto']
    assert c.get('/api/auth/me',headers={'Authorization':'Bearer malo'}).status_code==401
    assert c.get('/api/auth/status').status_code==404
    assert c.post('/api/auth/setup',json={}).status_code in (404,405)
    expired=jwt.encode({'sub':str(row['id']),'exp':1},app.state.jwt_secret,algorithm='HS256')
    assert c.get('/api/auth/me',headers={'Authorization':'Bearer '+expired}).status_code==401
    app.state.db.close()
    app2=create_app(db_path,secret)
    assert app2.state.jwt_secret==app.state.jwt_secret
    assert app2.state.db.execute('SELECT count(*) FROM usuarios').fetchone()[0]==1
    assert TestClient(app2).get('/api/auth/me',headers={'Authorization':'Bearer '+token}).status_code==200
    reset(app2.state.db)
    assert app2.state.db.execute('SELECT count(*) FROM alumnos').fetchone()[0]==0
    app2.state.db.close()

def test_rate_limit_scoped_to_application(tmp_path):
    app=create_app(tmp_path/'one.db',tmp_path/'one.secret')
    c=TestClient(app)
    for _ in range(10):
        assert c.post('/api/auth/login',json={'usuario':'Chuchito','password':'incorrecta'}).status_code==401
    assert c.post('/api/auth/login',json={'usuario':'Chuchito','password':INITIAL_PASSWORD}).status_code==429
    app.state.db.close()
    other=create_app(tmp_path/'two.db',tmp_path/'two.secret')
    assert TestClient(other).post('/api/auth/login',json={'usuario':'Chuchito','password':INITIAL_PASSWORD}).status_code==200
    other.state.db.close()
