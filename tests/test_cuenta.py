"""#32 · API de cuenta (usuario y contraseña) y #49 · preferencias."""
from tests.util import client, login
from sema.auth import INITIAL_PASSWORD

def test_cambiar_usuario_devuelve_token_nuevo(tmp_path):
    app, c = client(tmp_path); h = login(c)
    r = c.put('/api/cuenta', headers=h, json={'nombre': 'Jesús Pérez', 'usuario': 'jperez', 'passwordActual': 'mala'})
    assert r.status_code == 401 and r.json()['code'] == 'BAD_PASSWORD'
    r = c.put('/api/cuenta', headers=h, json={'nombre': '  Jesús   Pérez ', 'usuario': 'jperez', 'passwordActual': INITIAL_PASSWORD})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body['user']['usuario'] == 'jperez' and body['user']['nombre'] == 'Jesús Pérez' and body['token']
    me = c.get('/api/auth/me', headers={'Authorization': 'Bearer ' + body['token']}).json()['user']
    assert me['usuario'] == 'jperez'
    assert c.post('/api/auth/login', json={'usuario': 'jperez', 'password': INITIAL_PASSWORD}).status_code == 200
    for usuario in ('ab', 'con espacio', 'x' * 31):
        r = c.put('/api/cuenta', headers=h, json={'nombre': 'A', 'usuario': usuario, 'passwordActual': INITIAL_PASSWORD})
        assert r.status_code == 400 and r.json()['code'] == 'VALIDACION'
    app.state.db.close()

def test_usuario_repetido_409(tmp_path):
    app, c = client(tmp_path); h = login(c)
    app.state.db.execute("INSERT INTO usuarios(nombre,usuario,password_hash) VALUES ('Otro','otro','x')")
    r = c.put('/api/cuenta', headers=h, json={'nombre': 'A', 'usuario': 'OTRO', 'passwordActual': INITIAL_PASSWORD})
    assert r.status_code == 409
    app.state.db.close()

def test_cambiar_password(tmp_path):
    app, c = client(tmp_path); h = login(c)
    assert c.get('/api/auth/me', headers=h).json()['user']['passwordPorDefecto'] is True
    put = lambda actual, nueva: c.put('/api/cuenta/password', headers=h, json={'passwordActual': actual, 'passwordNueva': nueva})
    assert put(INITIAL_PASSWORD, 'corta').status_code == 400
    assert put(INITIAL_PASSWORD, 'x' * 73).status_code == 400
    assert put(INITIAL_PASSWORD, 'ñ' * 37).status_code == 400  # 74 bytes: bcrypt solo admite 72
    assert put(INITIAL_PASSWORD, INITIAL_PASSWORD).status_code == 400
    assert put('incorrecta', 'NuevaClave2026').json()['code'] == 'BAD_PASSWORD'
    assert put(INITIAL_PASSWORD, 'NuevaClave2026').json() == {'status': 'ok'}
    assert c.post('/api/auth/login', json={'usuario': 'Chuchito', 'password': INITIAL_PASSWORD}).status_code == 401
    h2 = login(c, 'NuevaClave2026')
    assert c.get('/api/auth/me', headers=h2).json()['user']['passwordPorDefecto'] is False
    app.state.db.close()

def test_preferencias(tmp_path):
    app, c = client(tmp_path); h = login(c)
    r = c.put('/api/cuenta/preferencias', headers=h, json={'tema': 'oscuro'})
    assert r.status_code == 200 and r.json()['user']['tema'] == 'oscuro'
    r = c.put('/api/cuenta/preferencias', headers=h, json={'formatoNombre': 'apellidos_nombres'})
    assert r.json()['user'] == {**r.json()['user'], 'tema': 'oscuro', 'formatoNombre': 'apellidos_nombres'}
    assert c.put('/api/cuenta/preferencias', headers=h, json={'tema': 'azul'}).status_code == 400
    assert c.put('/api/cuenta/preferencias', headers=h, json={'formatoNombre': 'x'}).status_code == 400
    assert c.put('/api/cuenta/preferencias', headers=h, json={}).status_code == 400
    assert c.put('/api/cuenta/preferencias', json={'tema': 'claro'}).status_code == 401
    app.state.db.close()

def test_formato_de_nombre_aplica_al_listado(tmp_path):
    from tests.util import cargar_muestra
    app, c = client(tmp_path); h = login(c); cargar_muestra(c, h)
    c.put('/api/cuenta/preferencias', headers=h, json={'formatoNombre': 'apellidos_nombres'})
    a = next(x for x in c.get('/api/alumnos', headers=h).json()['alumnos'] if x['matricula'] == 'T90000001')
    assert a['nombreMostrar'] == 'Pérez Fuentes Karla Guadalupe'
    app.state.db.close()
