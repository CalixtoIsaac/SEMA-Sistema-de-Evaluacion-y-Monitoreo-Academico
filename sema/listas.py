"""Listas de seguimiento (#27 · HU-10, #30 · HU-12) · context/06 §5 y context/08 §2."""
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from pydantic import BaseModel
from .auth import require_user
from .db import transaction
from .excel import parse_list, FormatError, key

router=APIRouter(prefix='/api/listas',dependencies=[Depends(require_user)])
MAX=15*1024*1024
MAX_MATRICULAS=10000

def invalid(msg):
    return HTTPException(400,{'error':msg,'code':'VALIDACION'})

def not_found():
    return HTTPException(404,{'error':'Lista no encontrada.','code':'NO_ENCONTRADO'})

def same_name(a,b):
    """Compara nombres sin mayúsculas, acentos ni espacios (context/08 §2.2, regla 5)."""
    return key(a).replace(' ','')==key(b).replace(' ','')

async def read_upload(archivo):
    if Path(archivo.filename or '').suffix.lower()!='.xlsx':raise HTTPException(415,'Solo se aceptan archivos .xlsx.')
    chunks=[];size=0
    while chunk:=await archivo.read(1024*1024):
        size+=len(chunk)
        if size>MAX:raise HTTPException(413,'El archivo supera 15 MB.')
        chunks.append(chunk)
    return b''.join(chunks)

@router.post('/previa')
async def preview(request:Request,archivo:UploadFile=File(...)):
    data=await read_upload(archivo)
    try:result=parse_list(data)
    except FormatError as e:
        raise HTTPException(422,{'error':'No se encontró la columna de matrícula en el Excel.','code':'FORMATO','detalles':e.missing})
    rows=result['rows']
    if not rows:raise HTTPException(422,{'error':'El archivo no tiene matrículas.','code':'FORMATO'})
    db=request.app.state.db
    sema={}
    for i in range(0,len(rows),500):  # lotes para no exceder el límite de parámetros de SQLite
        chunk=[r['matricula'] for r in rows[i:i+500]]
        for r in db.execute(f"SELECT matricula,nombre FROM alumnos WHERE matricula IN ({','.join('?'*len(chunk))})",chunk):
            sema[r['matricula']]=r['nombre']
    no_encontrados=[r for r in rows if r['matricula'] not in sema]
    distintos=[{'matricula':r['matricula'],'nombreExcel':r['nombre'],'nombreSema':sema[r['matricula']]}
               for r in rows if r['matricula'] in sema and r['nombre'] and not same_name(r['nombre'],sema[r['matricula']])]
    return {'archivo':Path(archivo.filename).name,'nombreSugerido':Path(archivo.filename).stem,'hoja':result['sheet'],
            'total':len(rows),'encontrados':len(rows)-len(no_encontrados),'noEncontrados':no_encontrados,
            'nombresDistintos':distintos,'matriculas':rows}

class Item(BaseModel):
    matricula:str
    nombre:str|None=None

class NewList(BaseModel):
    nombre:str
    descripcion:str=''
    archivo:str|None=None
    matriculas:list[Item]

class EditList(BaseModel):
    nombre:str|None=None
    descripcion:str|None=None
    archivo:str|None=None
    matriculas:list[Item]|None=None

def clean_name(nombre):
    nombre=' '.join((nombre or '').split())
    if not nombre or len(nombre)>60:raise invalid('El nombre de la lista es obligatorio (máximo 60 caracteres).')
    return nombre

def clean_items(items):
    out={}
    for it in items:
        mat=it.matricula.strip().upper()
        if not mat:continue
        if len(mat)>20:raise invalid(f'Matrícula no válida: {mat[:20]}…')
        out.setdefault(mat,' '.join((it.nombre or '').split()) or None)
    if not out:raise invalid('La lista debe tener al menos una matrícula.')
    if len(out)>MAX_MATRICULAS:raise invalid(f'Una lista admite hasta {MAX_MATRICULAS:,} matrículas.')
    return out

def list_row(db,ident):
    r=db.execute('''SELECT l.id,l.nombre,l.descripcion,l.archivo,l.creado_en,l.actualizado_en,
        COUNT(la.matricula) AS total,
        SUM(CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END) AS encontrados
        FROM listas l LEFT JOIN lista_alumnos la ON la.lista_id=l.id LEFT JOIN alumnos a ON a.matricula=la.matricula
        WHERE l.id=? GROUP BY l.id''',(ident,)).fetchone()
    if not r:raise not_found()
    return as_list(r)

def as_list(r):
    return {'id':r['id'],'nombre':r['nombre'],'descripcion':r['descripcion'],'archivo':r['archivo'],
            'total':r['total'] or 0,'encontrados':r['encontrados'] or 0,'creadoEn':r['creado_en'],'actualizadoEn':r['actualizado_en']}

def save_items(db,ident,items):
    db.execute('DELETE FROM lista_alumnos WHERE lista_id=?',(ident,))
    db.executemany('INSERT INTO lista_alumnos(lista_id,matricula,nombre_excel) VALUES (?,?,?)',[(ident,m,n) for m,n in items.items()])

def log_import(db,archivo,total):
    """La carga de una lista queda en el historial de cargas (#39)."""
    db.execute("INSERT INTO importaciones(archivo,tipo,estado,total_filas,filas_validas,total_alumnos,aplicado_en) VALUES (?,'lista','aplicada',?,?,?,datetime('now','localtime'))",
               (archivo or 'Lista sin archivo',total,total,total))

def name_taken(db,nombre,ident=None):
    return db.execute('SELECT 1 FROM listas WHERE nombre=? COLLATE NOCASE AND id<>?',(nombre,ident or 0)).fetchone()

@router.post('',status_code=201)
def create(body:NewList,request:Request):
    nombre=clean_name(body.nombre);items=clean_items(body.matriculas)
    db=request.app.state.db
    with transaction(db):
        if name_taken(db,nombre):raise HTTPException(409,{'error':'Ya existe una lista con ese nombre.','code':'NOMBRE_REPETIDO'})
        ident=db.execute('INSERT INTO listas(nombre,descripcion,archivo) VALUES (?,?,?)',(nombre,(body.descripcion or '').strip()[:200],body.archivo)).lastrowid
        save_items(db,ident,items)
        if body.archivo:log_import(db,body.archivo,len(items))
    return {'lista':list_row(db,ident)}

@router.get('')
def index(request:Request):
    db=request.app.state.db
    rows=db.execute('''SELECT l.id,l.nombre,l.descripcion,l.archivo,l.creado_en,l.actualizado_en,
        COUNT(la.matricula) AS total,SUM(CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END) AS encontrados
        FROM listas l LEFT JOIN lista_alumnos la ON la.lista_id=l.id LEFT JOIN alumnos a ON a.matricula=la.matricula
        GROUP BY l.id ORDER BY l.nombre COLLATE NOCASE''').fetchall()
    return {'listas':[as_list(r) for r in rows]}

@router.get('/{ident}')
def show(ident:int,request:Request):
    db=request.app.state.db
    lista=list_row(db,ident)
    rows=db.execute('''SELECT la.matricula,la.nombre_excel,a.id IS NOT NULL AS encontrado FROM lista_alumnos la
        LEFT JOIN alumnos a ON a.matricula=la.matricula WHERE la.lista_id=? ORDER BY la.matricula''',(ident,))
    return {'lista':lista,'matriculas':[{'matricula':r['matricula'],'nombreExcel':r['nombre_excel'],'encontrado':bool(r['encontrado'])} for r in rows]}

@router.put('/{ident}')
def update(ident:int,body:EditList,request:Request):
    db=request.app.state.db
    with transaction(db):
        list_row(db,ident)
        if body.nombre is not None:
            nombre=clean_name(body.nombre)
            if name_taken(db,nombre,ident):raise HTTPException(409,{'error':'Ya existe una lista con ese nombre.','code':'NOMBRE_REPETIDO'})
            db.execute('UPDATE listas SET nombre=? WHERE id=?',(nombre,ident))
        if body.descripcion is not None:
            db.execute('UPDATE listas SET descripcion=? WHERE id=?',(body.descripcion.strip()[:200],ident))
        if body.matriculas is not None:
            items=clean_items(body.matriculas)
            save_items(db,ident,items)
            db.execute('UPDATE listas SET archivo=COALESCE(?,archivo) WHERE id=?',(body.archivo,ident))
            if body.archivo:log_import(db,body.archivo,len(items))
        db.execute("UPDATE listas SET actualizado_en=datetime('now','localtime') WHERE id=?",(ident,))
    return {'lista':list_row(db,ident)}

@router.delete('/{ident}')
def delete(ident:int,request:Request):
    db=request.app.state.db
    with transaction(db):
        list_row(db,ident)
        # ON DELETE CASCADE borra lista_alumnos; los alumnos no se tocan.
        db.execute('DELETE FROM listas WHERE id=?',(ident,))
    return {'status':'ok','id':ident}
