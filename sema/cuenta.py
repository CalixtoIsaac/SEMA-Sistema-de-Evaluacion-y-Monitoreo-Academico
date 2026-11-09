"""Cuenta del usuario: datos (#32), contraseña (#32) y preferencias (#49) · context/06 §3."""
import time
import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from .auth import require_user, public_user
from .db import transaction

router=APIRouter(prefix='/api/cuenta')

TEMAS={'claro','oscuro','sistema'}
FORMATOS={'nombres_apellidos','apellidos_nombres'}

def invalid(msg):
    return HTTPException(400,{'error':msg,'code':'VALIDACION'})

def check_password(user,password):
    if not password or not bcrypt.checkpw(password.encode(),user['password_hash'].encode()):
        raise HTTPException(401,{'error':'La contraseña actual no es correcta.','code':'BAD_PASSWORD'})

def new_token(request,user_id):
    return jwt.encode({'sub':str(user_id),'exp':int(time.time())+8*3600},request.app.state.jwt_secret,algorithm='HS256')

class Account(BaseModel):
    nombre:str
    usuario:str
    passwordActual:str

@router.put('')
def update_account(body:Account,request:Request,user=Depends(require_user)):
    nombre=' '.join(body.nombre.split());usuario=body.usuario.strip()
    if not nombre or len(nombre)>80:raise invalid('El nombre es obligatorio (máximo 80 caracteres).')
    if not 3<=len(usuario)<=30 or any(c.isspace() for c in usuario):
        raise invalid('El usuario debe tener de 3 a 30 caracteres y no llevar espacios.')
    check_password(user,body.passwordActual)
    db=request.app.state.db
    with transaction(db):
        if db.execute('SELECT 1 FROM usuarios WHERE usuario=? AND id<>?',(usuario,user['id'])).fetchone():
            raise HTTPException(409,{'error':'Ese usuario ya está en uso.','code':'USUARIO_REPETIDO'})
        db.execute("UPDATE usuarios SET nombre=?,usuario=?,actualizado_en=datetime('now','localtime') WHERE id=?",(nombre,usuario,user['id']))
    row=db.execute('SELECT * FROM usuarios WHERE id=?',(user['id'],)).fetchone()
    return {'user':public_user(row),'token':new_token(request,user['id'])}

class Password(BaseModel):
    passwordActual:str
    passwordNueva:str

@router.put('/password')
def change_password(body:Password,request:Request,user=Depends(require_user)):
    nueva=body.passwordNueva
    # bcrypt solo usa los primeros 72 bytes: se valida en bytes, no en caracteres.
    if len(nueva)<8 or len(nueva.encode())>72:
        raise invalid('La contraseña nueva debe tener entre 8 y 72 caracteres.')
    check_password(user,body.passwordActual)
    if bcrypt.checkpw(nueva.encode(),user['password_hash'].encode()):
        raise invalid('La contraseña nueva debe ser distinta de la actual.')
    hashed=bcrypt.hashpw(nueva.encode(),bcrypt.gensalt(rounds=10)).decode()
    db=request.app.state.db
    with transaction(db):
        db.execute("UPDATE usuarios SET password_hash=?,password_por_defecto=0,actualizado_en=datetime('now','localtime') WHERE id=?",(hashed,user['id']))
    return {'status':'ok'}

class Preferences(BaseModel):
    tema:str|None=None
    formatoNombre:str|None=None

@router.put('/preferencias')
def preferences(body:Preferences,request:Request,user=Depends(require_user)):
    if body.tema is None and body.formatoNombre is None:raise invalid('No hay preferencias para guardar.')
    if body.tema is not None and body.tema not in TEMAS:raise invalid('El tema debe ser claro, oscuro o sistema.')
    if body.formatoNombre is not None and body.formatoNombre not in FORMATOS:
        raise invalid('El formato de nombres no es válido.')
    db=request.app.state.db
    with transaction(db):
        if body.tema is not None:db.execute('UPDATE usuarios SET tema=? WHERE id=?',(body.tema,user['id']))
        if body.formatoNombre is not None:db.execute('UPDATE usuarios SET formato_nombre=? WHERE id=?',(body.formatoNombre,user['id']))
    row=db.execute('SELECT * FROM usuarios WHERE id=?',(user['id'],)).fetchone()
    return {'user':public_user(row)}
