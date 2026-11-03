import os
import secrets
import time
import stat
from pathlib import Path
import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from .db import ROOT, transaction

INITIAL_PASSWORD = 'Administrador*Chuchito*123'
router = APIRouter(prefix='/api/auth')

def load_secret(path=None):
    env = os.environ.get('JWT_SECRET', '')
    if len(env) >= 32:
        return env
    path = Path(path or ROOT/'data/jwt.secret')
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError:
        pass
    else:
        with os.fdopen(fd, 'w') as f:
            f.write(secrets.token_hex(48))
    os.chmod(path, stat.S_IRUSR | stat.S_IWUSR)
    value = path.read_text().strip()
    if len(value) < 32:
        raise RuntimeError('El secreto JWT persistente es inválido')
    return value

def seed_user(db):
    # BEGIN IMMEDIATE serializa arranques concurrentes; el SELECT está dentro.
    with transaction(db):
        if db.execute('SELECT 1 FROM usuarios LIMIT 1').fetchone():
            return
        hashed = bcrypt.hashpw(INITIAL_PASSWORD.encode(), bcrypt.gensalt(rounds=10)).decode()
        db.execute('INSERT INTO usuarios(nombre,usuario,password_hash,password_por_defecto) VALUES (?,?,?,1)',
                   ('Administrador','Chuchito',hashed))

def public_user(row):
    return {'id':row['id'],'nombre':row['nombre'],'usuario':row['usuario'],
            'passwordPorDefecto':bool(row['password_por_defecto']), 'tema':row['tema'],
            'formatoNombre':row['formato_nombre']}

def require_user(request: Request):
    header = request.headers.get('authorization','')
    if not header.lower().startswith('bearer '):
        raise HTTPException(401, {'error':'Inicia sesión para continuar.','code':'AUTH_REQUIRED'})
    try:
        payload = jwt.decode(header[7:], request.app.state.jwt_secret, algorithms=['HS256'])
        user_id = int(payload['sub'])
    except (jwt.PyJWTError, ValueError, KeyError):
        raise HTTPException(401, {'error':'Sesión no válida o expirada.','code':'AUTH_REQUIRED'})
    row = request.app.state.db.execute('SELECT * FROM usuarios WHERE id=?',(user_id,)).fetchone()
    if not row:
        raise HTTPException(401, {'error':'La cuenta ya no existe.','code':'AUTH_REQUIRED'})
    return row

class Login(BaseModel):
    usuario: str
    password: str

@router.post('/login')
def login(body:Login, request:Request):
    key = request.client.host if request.client else 'local'
    now = time.monotonic()
    attempts = request.app.state.login_attempts
    hits = [t for t in attempts.get(key,[]) if now-t<900]
    if len(hits) >= 10:
        raise HTTPException(429, 'Demasiados intentos.')
    hits.append(now)
    attempts[key] = hits
    row = request.app.state.db.execute('SELECT * FROM usuarios WHERE usuario=?',(body.usuario.strip(),)).fetchone()
    if not row or not bcrypt.checkpw(body.password.encode(), row['password_hash'].encode()):
        raise HTTPException(401, 'Usuario o contraseña incorrectos.')
    token = jwt.encode({'sub':str(row['id']),'exp':int(time.time())+8*3600}, request.app.state.jwt_secret, algorithm='HS256')
    return {'token':token,'user':public_user(row)}

@router.get('/me')
def me(user=Depends(require_user)):
    return {'user':public_user(user)}
