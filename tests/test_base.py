from sema.main import create_app
from fastapi.testclient import TestClient

def test_base(tmp_path):
    app = create_app(tmp_path/'app.db')
    with TestClient(app) as c:
        assert c.get('/api/health').json()['app'] == 'SEMA'
        assert c.get('/').status_code == 200
        assert c.get('/app').status_code == 200
        assert app.state.db.execute('PRAGMA user_version').fetchone()[0] == 1
        assert app.state.db.execute('PRAGMA foreign_keys').fetchone()[0] == 1
    app.state.db.close()

def test_migration_preserves_existing_user(tmp_path):
    from sema.db import open_db, ROOT
    import sqlite3
    path=tmp_path/'existing.db'
    db=sqlite3.connect(path)
    db.executescript((ROOT/'lib/schema.sql').read_text())
    db.execute("INSERT INTO usuarios(nombre,usuario,password_hash) VALUES ('Ejemplo','existente','hash-ficticio')")
    db.commit();db.close()
    upgraded=open_db(path)
    assert upgraded.execute('PRAGMA user_version').fetchone()[0]==1
    assert upgraded.execute('SELECT usuario FROM usuarios').fetchone()[0]=='existente'
    upgraded.close()
