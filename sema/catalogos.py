"""Catálogos para los selectores del formulario manual (#31) · context/06 §8."""
from fastapi import APIRouter, Depends, Request
from .auth import require_user

router=APIRouter(prefix='/api',dependencies=[Depends(require_user)])

@router.get('/materias')
def materias(request:Request):
    rows=request.app.state.db.execute('SELECT clave,nombre FROM materias ORDER BY nombre COLLATE NOCASE')
    return {'materias':[dict(r) for r in rows]}

@router.get('/periodos')
def periodos(request:Request):
    rows=request.app.state.db.execute('SELECT clave,nombre FROM periodos ORDER BY clave DESC').fetchall()
    return {'periodos':[{'clave':r['clave'],'nombre':r['nombre'],'actual':i==0} for i,r in enumerate(rows)]}

@router.get('/planes')
def planes(request:Request):
    rows=request.app.state.db.execute('''SELECT plan_clave AS clave,MAX(plan_descripcion) AS descripcion FROM alumnos
        WHERE plan_clave IS NOT NULL AND plan_clave<>'' GROUP BY plan_clave ORDER BY plan_clave''')
    return {'planes':[dict(r) for r in rows]}
