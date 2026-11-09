"""Respaldo y borrado de datos (#43 · HU-25) · context/06 §10."""
import os
import sqlite3
import tempfile
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel
from starlette.background import BackgroundTask
from .auth import require_user
from .cuenta import check_password
from .db import transaction, _write_lock

router=APIRouter(prefix='/api/datos')

# Del más dependiente al menos dependiente; la cuenta y la configuración se conservan.
TABLAS_ACADEMICAS=['cortes_alumno','actividades','inscripciones','cursos','importaciones',
                   'lista_alumnos','listas','alumnos','periodos','materias','profesores']

@router.get('/respaldo')
def backup(request:Request,user=Depends(require_user)):
    fd,path=tempfile.mkstemp(prefix='sema-respaldo-',suffix='.db')
    os.close(fd)
    dest=sqlite3.connect(path)
    try:
        # El candado de escritura evita respaldar a la mitad de una importación.
        with _write_lock:
            request.app.state.db.backup(dest)
    finally:
        dest.close()
    return FileResponse(path,media_type='application/vnd.sqlite3',filename=f'sema-respaldo-{date.today().isoformat()}.db',
                        headers={'Cache-Control':'no-store'},background=BackgroundTask(os.remove,path))

class Borrar(BaseModel):
    passwordActual:str
    confirmacion:str

@router.delete('')
def wipe(body:Borrar,request:Request,user=Depends(require_user)):
    if body.confirmacion!='BORRAR':
        raise HTTPException(400,{'error':'Escribe BORRAR (en mayúsculas) para confirmar.','code':'VALIDACION'})
    check_password(user,body.passwordActual)
    db=request.app.state.db
    with transaction(db):
        for tabla in TABLAS_ACADEMICAS:
            db.execute(f'DELETE FROM {tabla}')
    return {'status':'ok'}
