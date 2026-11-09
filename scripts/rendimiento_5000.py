"""#26 · Prueba de rendimiento con 5,000 alumnos × 7 materias (RNF-01).

Genera un Excel sintético con el formato de monitoreo (datos ficticios), lo
importa dos veces en una base temporal y mide los endpoints principales.

    .venv\\Scripts\\python.exe scripts\\rendimiento_5000.py            (Windows)
    python scripts/rendimiento_5000.py --alumnos 5000 --materias 7

La búsqueda del navegador (< 200 ms al teclear) se mide aparte con
`node scripts/rendimiento_busqueda.js`.
"""
import argparse
import random
import sys
import tempfile
import time
from io import BytesIO
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from openpyxl import Workbook  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sema.main import create_app  # noqa: E402
from sema.auth import INITIAL_PASSWORD  # noqa: E402

COLUMNAS = ['Campus', 'Año - periodo', 'Nombre del periodo', 'Parte periodo', 'Modalidad', 'Matrícula',
            'Nombre del alumno', 'Nombre de la materia', 'Nivel', 'Clave de materia', 'CRN', '# Grupo',
            'Estatus', 'Límite de faltas', 'Faltas del alumno', 'Límite de NE', 'NE alumno', 'Ponderado',
            *[f'A{n}' for n in range(1, 13)]]
APELLIDOS = ['Pérez', 'López', 'García', 'Hernández', 'Martínez', 'Rodríguez', 'Gómez', 'Díaz', 'Cruz', 'Ruiz',
             'Torres', 'Flores', 'Ríos', 'Silva', 'Vázquez', 'Montes de Oca', 'De la O', 'Ponce de León']
NOMBRES = ['Ana', 'Luis', 'María José', 'Diego', 'Karla', 'Mateo', 'Regina', 'Santiago', 'Camila', 'Valeria']

def excel(alumnos, materias, semilla, desfase=0):
    rnd = random.Random(semilla)
    wb = Workbook(write_only=True)
    ws = wb.create_sheet('Salida')
    ws.append(COLUMNAS)
    for i in range(alumnos):
        nombre = f'{rnd.choice(APELLIDOS)} {rnd.choice(APELLIDOS)} {rnd.choice(NOMBRES)}'
        for m in range(materias):
            limite = rnd.choice([2, 5, 7, 10, 12])
            acts = [rnd.choice([rnd.randint(50, 100)] * 8 + ['NE', 'SC']) for _ in range(12)]
            ws.append(['Veracruz', '202660', '2026 Ago - Dic', '1', 'Semestral', f'T{90000000 + i:08d}', nombre,
                       f'Materia sintética {m + 1}', 'Preparatoria', f'SIN{m + 1:04d}', str(20000 + m * 10 + i % 10),
                       str(600 + i % 10), 'RW', limite, min(limite, max(0, rnd.randint(-2, limite) + desfase)), 3,
                       rnd.randint(0, 3), min(100, max(0, rnd.randint(55, 100) - desfase * 2)), *acts])
    b = BytesIO()
    wb.save(b)
    return b.getvalue()

def medir(nombre, fn, resultados):
    t = time.perf_counter()
    r = fn()
    ms = (time.perf_counter() - t) * 1000
    resultados.append((nombre, ms))
    print(f'{nombre:<45} {ms:>9.0f} ms')
    return r

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--alumnos', type=int, default=5000)
    ap.add_argument('--materias', type=int, default=7)
    args = ap.parse_args()
    filas = args.alumnos * args.materias
    print(f'Generando {args.alumnos:,} alumnos × {args.materias} materias = {filas:,} filas…')
    datos1 = excel(args.alumnos, args.materias, 1)
    datos2 = excel(args.alumnos, args.materias, 2, desfase=1)
    print(f'Excel: {len(datos1) / 1024 / 1024:.1f} MB\n')
    with tempfile.TemporaryDirectory() as d:
        app = create_app(Path(d) / 'app.db', Path(d) / 'secret')
        c = TestClient(app)
        h = {'Authorization': 'Bearer ' + c.post('/api/auth/login', json={'usuario': 'Chuchito', 'password': INITIAL_PASSWORD}).json()['token']}
        res = []
        for n, data in ((1, datos1), (2, datos2)):
            p = medir(f'Carga {n} · previsualizar (POST monitoreo)', lambda: c.post('/api/importaciones/monitoreo', headers=h, files={'archivo': ('sintetico.xlsx', data)}), res)
            assert p.status_code == 201, p.text
            ident = p.json()['importacion']['id']
            r = medir(f'Carga {n} · confirmar (fusionar)', lambda: c.post(f'/api/importaciones/{ident}/confirmar', headers=h, json={'modo': 'fusionar'}), res)
            assert r.status_code == 200, r.text
        lista = medir('GET /api/alumnos', lambda: c.get('/api/alumnos', headers=h), res).json()
        assert len(lista['alumnos']) == args.alumnos
        medir('GET /api/resumen', lambda: c.get('/api/resumen', headers=h), res)
        medir('GET /api/alumnos/{matricula}', lambda: c.get('/api/alumnos/T90002500', headers=h), res)
        medir('GET /api/alumnos/exportar (xlsx)', lambda: c.get('/api/alumnos/exportar?orden=promedio,faltas', headers=h), res)
        app.state.db.close()
    total = sum(ms for n, ms in res if n.startswith('Carga 1'))
    print(f'\nImportación completa de la carga 1: {total / 1000:.1f} s (RNF-01 pide < 5 s para ≈3,700 filas)')

if __name__ == '__main__':
    main()
