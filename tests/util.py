"""Utilidades compartidas por las pruebas de la API."""
from pathlib import Path
from fastapi.testclient import TestClient
from sema.main import create_app
from sema.auth import INITIAL_PASSWORD

FIXTURES = Path(__file__).resolve().parents[1] / 'test/fixtures'
MONITOREO = FIXTURES / 'monitoreo-muestra.xlsx'
LISTA = FIXTURES / 'lista-muestra.xlsx'

def client(tmp_path):
    app = create_app(tmp_path/'app.db', tmp_path/'secret')
    return app, TestClient(app)

def login(c, password=INITIAL_PASSWORD, usuario='Chuchito'):
    r = c.post('/api/auth/login', json={'usuario': usuario, 'password': password})
    assert r.status_code == 200, r.text
    return {'Authorization': 'Bearer ' + r.json()['token']}

def cargar(c, h, data, modo='fusionar', nombre='x.xlsx'):
    p = c.post('/api/importaciones/monitoreo', headers=h, files={'archivo': (nombre, data)})
    assert p.status_code == 201, p.text
    r = c.post(f"/api/importaciones/{p.json()['importacion']['id']}/confirmar", headers=h, json={'modo': modo})
    assert r.status_code == 200, r.text
    return p.json()['importacion']['id']

def cargar_muestra(c, h):
    return cargar(c, h, MONITOREO.read_bytes(), nombre='monitoreo-muestra.xlsx')
