"""#41 · [HU-23] Umbrales configurables (context/06 §9)."""
from tests.util import client, login, cargar_muestra

def umbrales(**cambios):
    u = {'calificacion': {'correctoMin': 80, 'preventivoMin': 70},
         'faltas': {'preventivoPct': 50, 'criticoPct': 80, 'fijoPreventivo': 3, 'fijoCritico': 5},
         'evolucion': {'umbralPuntos': 2}}
    for ruta, valor in cambios.items():
        grupo, campo = ruta.split('__')
        u[grupo][campo] = valor
    return u

def test_get_y_put(tmp_path):
    app, c = client(tmp_path); h = login(c)
    r = c.get('/api/configuracion', headers=h).json()
    assert r['umbrales'] == umbrales() and r['porDefecto'] == umbrales()
    r = c.put('/api/configuracion', headers=h, json={'umbrales': umbrales(calificacion__correctoMin=85, evolucion__umbralPuntos=1.5)})
    assert r.status_code == 200 and r.json()['umbrales']['calificacion']['correctoMin'] == 85
    assert c.get('/api/configuracion', headers=h).json()['umbrales']['evolucion']['umbralPuntos'] == 1.5
    assert c.get('/api/configuracion', headers=h).json()['porDefecto'] == umbrales()
    app.state.db.close()

def test_validaciones(tmp_path):
    app, c = client(tmp_path); h = login(c)
    malos = [umbrales(calificacion__preventivoMin=80), umbrales(faltas__preventivoPct=90),
             umbrales(faltas__fijoPreventivo=5), umbrales(faltas__fijoCritico=4.5),
             umbrales(calificacion__correctoMin=120), umbrales(calificacion__correctoMin='abc'),
             {'calificacion': {'correctoMin': 80}}]
    for u in malos:
        r = c.put('/api/configuracion', headers=h, json={'umbrales': u})
        assert r.status_code == 400 and r.json()['code'] == 'VALIDACION', u
    assert c.get('/api/configuracion', headers=h).json()['umbrales'] == umbrales()
    app.state.db.close()

def test_vista_previa_no_guarda_y_el_listado_usa_lo_guardado(tmp_path):
    app, c = client(tmp_path); h = login(c); cargar_muestra(c, h)
    base = c.get('/api/alumnos', headers=h).json()['totales']
    r = c.post('/api/configuracion/vista-previa', headers=h, json={'umbrales': umbrales()}).json()
    assert r['totales'] == {k: base[k] for k in ('correcto', 'preventivo', 'critico')}
    estricto = umbrales(calificacion__correctoMin=99, calificacion__preventivoMin=98)
    previa = c.post('/api/configuracion/vista-previa', headers=h, json={'umbrales': estricto}).json()['totales']
    assert previa['correcto'] == 0 and previa['critico'] > base['critico']
    assert c.get('/api/alumnos', headers=h).json()['totales'] == base  # no se guardó
    c.put('/api/configuracion', headers=h, json={'umbrales': estricto})
    assert c.get('/api/alumnos', headers=h).json()['totales']['correcto'] == 0
    app.state.db.close()
