"""Genera capturas técnicas de API con datos ficticios; requiere ImageMagick."""
from html import escape
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
import subprocess
from fastapi.testclient import TestClient
from openpyxl import Workbook
from sema.auth import INITIAL_PASSWORD
from sema.main import create_app

OUT=Path(__file__).resolve().parents[1]/'evidencias'
OUT.mkdir(exist_ok=True)

def workbook():
    book=Workbook();sheet=book.active
    sheet.append(['Año - periodo','Matrícula','Nombre del alumno','Nombre de la materia','Clave de materia','CRN','Faltas del alumno','A1','Ponderado','Límite de faltas','Estatus','Deuda del alumno','Último usuario que modifico'])
    sheet.append(['202660','T00000001','Pérez López Ana','Química','Q1','1',4,90,90,5,'RW','123','usuario-ficticio'])
    sheet.append(['202660','T00000002','Ruiz Soto Eva','Física','F1','2',0,85,85,5,'RW','456','usuario-ficticio'])
    stream=BytesIO();book.save(stream);return stream.getvalue()

def capture(filename,title,subtitle,blocks):
    parts=[f'<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#f2f6fb"/>',
           '<rect x="70" y="50" width="1140" height="620" rx="18" fill="white" stroke="#d8e4f1"/>',
           '<rect x="70" y="50" width="1140" height="78" rx="18" fill="#153a62"/>',
           f'<text x="105" y="100" font-size="30" font-weight="700" fill="white">{escape(title)}</text>',
           f'<text x="105" y="158" font-size="17" fill="#51677f">{escape(subtitle)}</text>']
    y=215
    for label,value,color in blocks:
        parts.extend([f'<rect x="105" y="{y-32}" width="1070" height="75" rx="10" fill="#f7fafc" stroke="#e1e8ef"/>',
                      f'<text x="130" y="{y}" font-size="19" font-weight="600" fill="#31516f">{escape(str(label))}</text>',
                      f'<text x="630" y="{y}" font-size="19" fill="{color}">{escape(str(value))}</text>'])
        y+=91
    parts.append('<text x="105" y="642" font-size="15" fill="#687b90">Evidencia técnica de respuestas HTTP · fixture sintético · no es la interfaz de producto</text></svg>')
    svg=OUT/filename.replace('.png','.svg');png=OUT/filename
    svg.write_text(''.join(parts))
    subprocess.run(['magick','-background','white',str(svg),str(png)],check=True)
    svg.unlink()

with TemporaryDirectory() as tmp:
    app=create_app(Path(tmp)/'app.db',Path(tmp)/'secret')
    client=TestClient(app)
    health=client.get('/api/health')
    status=client.get('/api/auth/status')
    login=client.post('/api/auth/login',json={'usuario':'Chuchito','password':INITIAL_PASSWORD})
    token=login.json()['token'];auth={'Authorization':'Bearer '+token}
    me=client.get('/api/auth/me',headers=auth)
    capture('01-login-api.png','Auditoría de acceso · SEMA','Respuestas reales del servidor local',[
        ('GET /api/health',str(health.status_code)+' · '+health.json()['app'],'#176a48'),
        ('POST /api/auth/login',str(login.status_code)+' · sesión emitida','#176a48'),
        ('GET /api/auth/me',str(me.status_code)+' · usuario vigente','#176a48'),
        ('GET /api/auth/status',str(status.status_code)+' · llamada pendiente del frontend','#a23636')])
    preview=client.post('/api/importaciones/monitoreo',headers=auth,files={'archivo':('sintetico.xlsx',workbook())})
    body=preview.json();ident=body['importacion']['id'];overview=body['resumen']
    assert 'Deuda del alumno' not in body['columnas'] and 'Último usuario que modifico' not in body['columnas']
    capture('02-previa.png','Previa de importación · datos ficticios','POST /api/importaciones/monitoreo · respuesta HTTP 201',[
        ('Estado',body['importacion']['estado'],'#176a48'),
        ('Filas válidas / alumnos',f"{overview['filasValidas']} / {overview['alumnos']}",'#153a62'),
        ('Muestra entregada',f"{len(body['muestra'])} filas",'#153a62'),
        ('Columnas prohibidas','excluidas de la respuesta','#176a48')])
    confirmed=client.post(f'/api/importaciones/{ident}/confirmar',headers=auth,json={'modo':'fusionar'})
    listing=client.get('/api/alumnos',headers=auth).json()
    assert confirmed.status_code==200 and len(listing['alumnos'])==2
    by_mat={row['matricula']:row for row in listing['alumnos']}
    capture('03-listado.png','Listado de alumnos · datos ficticios','GET /api/alumnos · respuesta HTTP 200',[
        ('Periodo',listing['periodo']['clave'],'#153a62'),
        ('T00000001 · Pérez López Ana',f"promedio {by_mat['T00000001']['promedioGeneral']} · {by_mat['T00000001']['estado']} por faltas",'#a23636'),
        ('T00000002 · Ruiz Soto Eva',f"promedio {by_mat['T00000002']['promedioGeneral']} · {by_mat['T00000002']['estado']}",'#176a48'),
        ('Totales',f"crítico {listing['totales']['critico']} · correcto {listing['totales']['correcto']}",'#153a62')])
    app.state.db.close()
