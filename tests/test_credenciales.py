"""D-04 · Cuenta por defecto JesusSanJuan y migración desde la cuenta anterior (Chuchito)."""
import sqlite3
import bcrypt
from fastapi.testclient import TestClient
from sema.main import create_app
from sema.auth import INITIAL_USER, INITIAL_PASSWORD, LEGACY_USER

VIEJA = 'Administrador*Chuchito*123'


def _base_con(tmp_path, usuario, password, por_defecto):
    """Crea una base como la dejaba la versión anterior y la modifica."""
    app = create_app(tmp_path / 'app.db', tmp_path / 's')
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=4)).decode()
    app.state.db.execute('UPDATE usuarios SET usuario=?,password_hash=?,password_por_defecto=?',
                         (usuario, hashed, por_defecto))
    app.state.db.close()


def test_credenciales_por_defecto(tmp_path):
    assert INITIAL_USER == 'JesusSanJuan' and INITIAL_PASSWORD == 'ContraseñaJesus123*'
    c = TestClient(create_app(tmp_path / 'app.db', tmp_path / 's'))
    r = c.post('/api/auth/login', json={'usuario': 'JesusSanJuan', 'password': 'ContraseñaJesus123*'})
    assert r.status_code == 200 and r.json()['user']['passwordPorDefecto']


def test_migra_chuchito_sin_personalizar(tmp_path):
    _base_con(tmp_path, LEGACY_USER, VIEJA, 1)
    c = TestClient(create_app(tmp_path / 'app.db', tmp_path / 's'))
    assert c.post('/api/auth/login', json={'usuario': INITIAL_USER, 'password': INITIAL_PASSWORD}).status_code == 200
    assert c.post('/api/auth/login', json={'usuario': LEGACY_USER, 'password': VIEJA}).status_code == 401


def test_no_toca_una_cuenta_personalizada(tmp_path):
    _base_con(tmp_path, LEGACY_USER, 'MiClavePropia2026', 0)
    c = TestClient(create_app(tmp_path / 'app.db', tmp_path / 's'))
    assert c.post('/api/auth/login', json={'usuario': LEGACY_USER, 'password': 'MiClavePropia2026'}).status_code == 200
    filas = sqlite3.connect(tmp_path / 'app.db').execute('SELECT usuario FROM usuarios').fetchall()
    assert filas == [(LEGACY_USER,)]
