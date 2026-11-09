"""Umbrales configurables (#41 · M-08) · context/06 §9.

Los umbrales viven en la tabla `configuracion` con claves planas
(`calificacion.correcto_min`…); la API los expone anidados en camelCase.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from .auth import require_user
from .db import DEFAULT_CONFIG, transaction
from .students import resolve_period, student_summaries
from .indicators import thresholds

router=APIRouter(prefix='/api/configuracion',dependencies=[Depends(require_user)])

# (grupo, campo API, clave en BD, mínimo, máximo, entero)
CAMPOS=[
    ('calificacion','correctoMin','calificacion.correcto_min',1,100,False),
    ('calificacion','preventivoMin','calificacion.preventivo_min',0,99,False),
    ('faltas','preventivoPct','faltas.preventivo_pct',1,100,False),
    ('faltas','criticoPct','faltas.critico_pct',1,100,False),
    ('faltas','fijoPreventivo','faltas.fijo_preventivo',1,100,True),
    ('faltas','fijoCritico','faltas.fijo_critico',1,100,True),
    ('evolucion','umbralPuntos','evolucion.umbral_puntos',0.5,50,False),
]

def num(v):
    v=float(v)
    return int(v) if v.is_integer() else v

def nested(flat):
    out={}
    for grupo,campo,clave,*_ in CAMPOS:
        out.setdefault(grupo,{})[campo]=num(flat[clave])
    return out

def invalid(msg):
    return HTTPException(400,{'error':msg,'code':'VALIDACION'})

def parse(umbrales):
    """Convierte y valida los umbrales anidados → dict plano de claves de BD (context/06 §9)."""
    if not isinstance(umbrales,dict):raise invalid('Faltan los umbrales.')
    flat={}
    for grupo,campo,clave,lo,hi,entero in CAMPOS:
        try:
            v=umbrales[grupo][campo]
            if isinstance(v,bool):raise TypeError
            v=float(v)
        except (KeyError,TypeError,ValueError):
            raise invalid(f'Falta el valor «{grupo}.{campo}» o no es un número.')
        if not lo<=v<=hi:raise invalid(f'«{grupo}.{campo}» debe estar entre {num(lo)} y {num(hi)}.')
        if entero and not v.is_integer():raise invalid(f'«{grupo}.{campo}» debe ser un número entero.')
        flat[clave]=v
    if flat['calificacion.preventivo_min']>=flat['calificacion.correcto_min']:
        raise invalid('La calificación de Preventivo (amarillo) debe ser menor que la de Correcto (verde).')
    if flat['faltas.preventivo_pct']>=flat['faltas.critico_pct']:
        raise invalid('El % de faltas para Preventivo debe ser menor que el de Crítico.')
    if flat['faltas.fijo_preventivo']>=flat['faltas.fijo_critico']:
        raise invalid('Las faltas fijas para Preventivo deben ser menos que las de Crítico.')
    return flat

def response(db):
    return {'umbrales':nested(thresholds(db)),'porDefecto':nested(DEFAULT_CONFIG)}

@router.get('')
def get_config(request:Request):
    return response(request.app.state.db)

class Body(BaseModel):
    umbrales:dict

@router.put('')
def put_config(body:Body,request:Request):
    flat=parse(body.umbrales)
    db=request.app.state.db
    with transaction(db):
        db.executemany('INSERT INTO configuracion(clave,valor) VALUES (?,?) ON CONFLICT(clave) DO UPDATE SET valor=excluded.valor',
                       [(k,str(num(v))) for k,v in flat.items()])
    return response(db)

@router.post('/vista-previa')
def preview(body:Body,request:Request):
    flat=parse(body.umbrales)
    db=request.app.state.db
    p=resolve_period(db)
    totales={'correcto':0,'preventivo':0,'critico':0}
    if p:
        _,t=student_summaries(db,p,None,{**thresholds(db),**flat})
        totales={k:t[k] for k in totales}
    return {'totales':totales}
