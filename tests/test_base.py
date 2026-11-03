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
