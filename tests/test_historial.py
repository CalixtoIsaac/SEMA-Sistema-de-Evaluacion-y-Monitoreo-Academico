"""#39 · [HU-09] Historial de cargas."""
from tests.util import client, login, cargar_muestra, MONITOREO

def test_historial(tmp_path):
    app, c = client(tmp_path); h = login(c)
    assert c.get('/api/importaciones', headers=h).json() == {'importaciones': []}
    cargar_muestra(c, h)
    descartada = c.post('/api/importaciones/monitoreo', headers=h, files={'archivo': ('otro.xlsx', MONITOREO.read_bytes())}).json()
    abierta = c.post('/api/importaciones/monitoreo', headers=h, files={'archivo': ('abierta.xlsx', MONITOREO.read_bytes())}).json()
    c.delete(f"/api/importaciones/{descartada['importacion']['id']}", headers=h)
    c.post('/api/listas', headers=h, json={'nombre': 'L', 'archivo': 'lista.xlsx', 'matriculas': [{'matricula': 'T90000001'}]})
    todas = c.get('/api/importaciones', headers=h).json()['importaciones']
    assert [(x['tipo'], x['archivo'], x['estado']) for x in todas] == [
        ('lista', 'lista.xlsx', 'aplicada'), ('monitoreo', 'otro.xlsx', 'descartada'), ('monitoreo', 'monitoreo-muestra.xlsx', 'aplicada')]
    aplicada = todas[-1]
    assert aplicada['modo'] == 'fusionar' and aplicada['totalAlumnos'] == 15 and aplicada['totalFilas'] == 115
    assert aplicada['periodo']['clave'] == '202660' and aplicada['aplicadoEn']
    assert abierta['importacion']['id'] not in [x['id'] for x in todas]
    assert len(c.get('/api/importaciones?tipo=lista', headers=h).json()['importaciones']) == 1
    assert c.get('/api/importaciones?tipo=otro', headers=h).status_code == 400
    app.state.db.close()
