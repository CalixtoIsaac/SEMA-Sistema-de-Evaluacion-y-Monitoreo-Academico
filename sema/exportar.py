
import csv
import io
import math
import re
from datetime import date
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from openpyxl import Workbook
from openpyxl.styles import Font

from .auth import require_user
from .indicators import unaccent
from .students import list_students

router = APIRouter(prefix='/api/alumnos', dependencies=[Depends(require_user)])

Columnas = ['Nombre', 'Matrícula', 'Promedio', "Faltas",
            'Estado', 'Materias reprobando']

Etiquetas = {'correcto': 'Correcto', 'preventivo': 'Preventivo', 'critico': 'Crítico',
             'sin_datos': 'Sin datos', 'baja': 'Baja'}

Filtros_Estado = {'todos', 'empeora', *Etiquetas}
Criterios_Orden = {'promedio', 'faltas'}
Sentidos = {'peor', 'mejor'}
Tipos = {
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'csv': 'text/csv; charset=utf-8',
}

def error(mensaje):
    return HTTPException(400, {'error': mensaje, 'code': 'VALIDACION'})

def r1(n):
    return None if n is None else math.floor(n * 10 + 0.5) / 10

def coincide(alumno, palabras):
    texto = unaccent(f"{alumno['nombreMostrar']} {alumno['nombre']} {alumno['matricula']}")
    return all(p in texto for p in palabras)

def clave_nombre(texto):
    return unaccent((texto or '').replace('ñ', 'n\uffff').replace('Ñ', 'n\uffff'))

def ordenar(alumnos, promedio, faltas, sentido='peor'):
    # 'peor': promedio menor→mayor y faltas mayor→menor; 'mejor': al revés.
    s = -1 if sentido == 'mejor' else 1
    def clave(a):
        sin_promedio = a['estado'] == 'baja' or a['promedioGeneral'] is None
        return (1 if sin_promedio else 0,
                s * (r1(a['promedioGeneral']) or 0) if promedio else 0,
                -s * a['faltasTotal'] if faltas else 0,
                clave_nombre(a['nombreMostrar']),
                a['matricula'])
    return sorted(alumnos, key=clave)

def celda(valor):
    if isinstance(valor, str) and valor[:1] in ('=', '+', '-', '@', '\t', '\r'):
        return "'" + valor
    return valor

def filas(alumnos):
    for a in alumnos:
        baja = a['estado'] == 'baja'
        yield[
            celda(a['nombreMostrar'] or a['nombre']),
            celda(a['matricula']),
            r1(a['promedioGeneral']),
            None if baja else a['faltasTotal'],
            Etiquetas.get(a['estado'], a['estado']),
            None if baja else a['materiasReprobando'],
        ]

def _xlsx(alumnos):
    libro = Workbook()
    hoja = libro.active
    hoja.title = 'Alumnos'
    hoja.append(Columnas)

    for c in hoja[1]:
        c.font = Font(bold=True)
    for fila in filas(alumnos):
        hoja.append(fila)
    for fila in hoja.iter_rows(min_row=2, min_col=3, max_col=3):
        fila[0].number_format = '0.0'
    hoja.freeze_panes = 'A2'
    for letra, ancho in zip('ABCDEF', (34, 12, 10, 8, 13, 20)):
        hoja.column_dimensions[letra].width = ancho
    salida = io.BytesIO()
    libro.save(salida)
    return salida.getvalue()

def _csv(alumnos):
    salida = io.StringIO()
    escritor = csv.writer(salida)
    escritor.writerow(Columnas)

    for fila in filas(alumnos):
        escritor.writerow(['' if v is None else v for v in fila])
    return salida.getvalue().encode('utf-8-sig')

def nombreArchivo(db, lista, extension):
    nombre = 'todos'
    if lista is not None:
        nombre = db.execute('SELECT nombre FROM listas WHERE id=?', (lista,)).fetchone()['nombre']
    ascii_ = re.sub(r'[^A-Za-z0-9]+', '-', unaccent(nombre)).strip('-') or 'lista'
    return (f'SEMA_alumnos_{ascii_}_{date.today().isoformat()}.{extension}',
            f'SEMA_alumnos_{nombre}_{date.today().isoformat()}.{extension}')

@router.get('/exportar')
def exportar(request: Request, lista: int | None = None, periodo: str | None = None,
             formato: str = 'xlsx', orden: str = '', sentido: str = 'peor', estado: str = 'todos', q: str = ''):

    if formato not in Tipos:
        raise error('El formato debe ser xlsx o csv.')
    if estado not in Filtros_Estado:
        raise error('El estado no es válido.')
    criterios = {c for c in orden.split(',') if c}
    if not criterios <= Criterios_Orden:
        raise error('El orden solo puede ser promedio, faltas o ambos.')
    if sentido not in Sentidos:
        raise error('El sentido del orden debe ser peor o mejor.')

    listado = list_students(request, lista=lista, periodo=periodo)
    palabras = unaccent(q).split()
    alumnos = [a for a in listado['alumnos'] if coincide(a, palabras)]
    if estado == 'empeora':
        alumnos = [a for a in alumnos if a['tendencia'] == 'empeora']
    elif estado != 'todos':
        alumnos = [a for a in alumnos if a['estado'] == estado]
    alumnos = ordenar(alumnos, 'promedio' in criterios, 'faltas' in criterios, sentido)

    contenido = _xlsx(alumnos) if formato == 'xlsx' else _csv(alumnos)
    simple, completo = nombreArchivo(request.app.state.db, lista, formato)
    return Response(contenido, media_type=Tipos[formato], headers={
        'Content-Disposition': f'attachment; filename="{simple}"; filename*=UTF-8\'\'{quote(completo)}',
        'Cache-Control': 'no-store',
    })
