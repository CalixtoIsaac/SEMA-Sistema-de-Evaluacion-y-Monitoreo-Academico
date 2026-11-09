"""Alta y edición manual de alumnos y materias (#31 · HU-08) · context/06 §6.

Lo manual se guarda con origen = 'manual': una carga del Excel (incluso en modo
reemplazar) no lo borra ni lo sobrescribe.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from .auth import require_user
from .db import transaction
from .imports import search_name
from .indicators import thresholds
from .students import resolve_period, student_detail, subject_rows, not_found

router=APIRouter(prefix='/api',dependencies=[Depends(require_user)])
CODIGOS={'NE','SC','DA'}

def invalid(msg):
    return HTTPException(400,{'error':msg,'code':'VALIDACION'})

class MateriaManual(BaseModel):
    materiaClave:str|None=None
    materiaNombre:str|None=None
    actividades:list[float|int|str|None]=[]
    calificacion:float|None=None
    faltas:int=0
    limiteFaltas:int|None=None

class NuevoAlumno(BaseModel):
    matricula:str
    apellidos:str
    nombres:str
    planClave:str|None=None
    planDescripcion:str|None=None
    periodo:str|None=None
    materias:list[MateriaManual]=[]

class EditAlumno(BaseModel):
    planClave:str|None=None
    planDescripcion:str|None=None

def words(s,limit,label,required=True):
    s=' '.join((s or '').split())
    if required and not s:raise invalid(f'{label} es obligatorio.')
    if len(s)>limit:raise invalid(f'{label} admite hasta {limit} caracteres.')
    return s or None

def parse_activities(values):
    if len(values)>50:raise invalid('Una materia admite hasta 50 actividades.')
    out=[]
    for n,v in enumerate(values,1):
        if v is None or (isinstance(v,str) and not v.strip()):continue
        if isinstance(v,str):
            code=v.strip().upper()
            if code in CODIGOS:out.append((n,code,None));continue
            try:v=float(code.replace(',','.'))
            except ValueError:raise invalid(f'Actividad {n}: usa un número de 0 a 100 o NE, SC, DA.')
        if not 0<=float(v)<=100:raise invalid(f'Actividad {n}: el valor debe estar entre 0 y 100.')
        out.append((n,None,float(v)))
    return out

def validate_subject(m:MateriaManual):
    if m.calificacion is not None and not 0<=m.calificacion<=100:raise invalid('La calificación debe estar entre 0 y 100.')
    if not 0<=m.faltas<=999:raise invalid('Las faltas deben ser un número de 0 a 999.')
    if m.limiteFaltas is not None and not 0<=m.limiteFaltas<=999:raise invalid('El límite de faltas debe ser de 0 a 999.')
    if not (m.materiaClave or '').strip() and not (m.materiaNombre or '').strip():raise invalid('Elige una materia o escribe su nombre.')
    return parse_activities(m.actividades)

def subject_id(db,m:MateriaManual):
    clave=(m.materiaClave or '').strip()
    if clave:
        row=db.execute('SELECT id FROM materias WHERE clave=?',(clave,)).fetchone()
        if not row:raise invalid(f'La materia {clave} no existe.')
        return row['id']
    nombre=words(m.materiaNombre,120,'El nombre de la materia')
    row=db.execute('SELECT id FROM materias WHERE nombre=? COLLATE NOCASE',(nombre,)).fetchone()
    if row:return row['id']
    n=db.execute("SELECT COUNT(*) FROM materias WHERE clave LIKE 'MAN-%'").fetchone()[0]+1
    while db.execute('SELECT 1 FROM materias WHERE clave=?',(f'MAN-{n}',)).fetchone():n+=1
    return db.execute('INSERT INTO materias(clave,nombre) VALUES (?,?)',(f'MAN-{n}',nombre)).lastrowid

def period_for(db,clave=None):
    p=resolve_period(db,clave)
    if not p:raise HTTPException(409,{'error':'Primero carga un Excel de monitoreo: las materias manuales se registran en su periodo.','code':'SIN_PERIODO'})
    return p

def insert_subject(db,student_id,period_id,m:MateriaManual):
    acts=validate_subject(m)
    mid=subject_id(db,m)
    if db.execute('''SELECT 1 FROM inscripciones i JOIN cursos c ON c.id=i.curso_id
                     WHERE i.alumno_id=? AND c.periodo_id=? AND c.materia_id=?''',(student_id,period_id,mid)).fetchone():
        raise HTTPException(409,{'error':'El alumno ya tiene esa materia en el periodo.','code':'MATERIA_REPETIDA'})
    crn=f'MAN-{student_id}-{mid}'
    db.execute('INSERT INTO cursos(periodo_id,crn,materia_id,limite_faltas) VALUES (?,?,?,?) ON CONFLICT(periodo_id,crn) DO UPDATE SET limite_faltas=excluded.limite_faltas',
               (period_id,crn,mid,m.limiteFaltas or None))
    cid=db.execute('SELECT id FROM cursos WHERE periodo_id=? AND crn=?',(period_id,crn)).fetchone()[0]
    iid=db.execute("INSERT INTO inscripciones(alumno_id,curso_id,estatus,faltas,calificacion,origen) VALUES (?,?,'MAN',?,?,'manual')",
                   (student_id,cid,m.faltas,m.calificacion)).lastrowid
    db.executemany('INSERT INTO actividades(inscripcion_id,numero,codigo,valor) VALUES (?,?,?,?)',[(iid,n,c,v) for n,c,v in acts])
    return iid

def student_row(db,matricula):
    a=db.execute('SELECT * FROM alumnos WHERE matricula=?',(matricula.strip().upper(),)).fetchone()
    if not a:raise not_found()
    return a

def subject_out(db,iid):
    r=db.execute('SELECT i.alumno_id,c.periodo_id FROM inscripciones i JOIN cursos c ON c.id=i.curso_id WHERE i.id=?',(iid,)).fetchone()
    return next(m for m in subject_rows(db,r['alumno_id'],r['periodo_id'],thresholds(db)) if m['inscripcionId']==iid)

@router.post('/alumnos',status_code=201)
def create_student(body:NuevoAlumno,request:Request):
    matricula=body.matricula.strip().upper()
    if not matricula or len(matricula)>20 or any(c.isspace() for c in matricula):
        raise invalid('La matrícula es obligatoria, sin espacios (máximo 20 caracteres).')
    apellidos=words(body.apellidos,120,'Apellidos');nombres=words(body.nombres,120,'Nombres')
    plan=words(body.planClave,30,'La clave del plan',False);desc=words(body.planDescripcion,120,'La descripción del plan',False)
    db=request.app.state.db
    with transaction(db):
        if db.execute('SELECT 1 FROM alumnos WHERE matricula=?',(matricula,)).fetchone():
            raise HTTPException(409,{'error':'Ya existe un alumno con esa matrícula. Puedes agregarle materias.','code':'MATRICULA_EXISTE','matricula':matricula})
        p=period_for(db,body.periodo) if body.materias else None
        if desc is None and plan:
            row=db.execute('SELECT plan_descripcion FROM alumnos WHERE plan_clave=? AND plan_descripcion IS NOT NULL LIMIT 1',(plan,)).fetchone()
            desc=row[0] if row else None
        nombre=f'{apellidos} {nombres}'
        # Apellidos y nombres vienen separados: se marca como corregido para que una carga no los vuelva a cortar.
        aid=db.execute("""INSERT INTO alumnos(matricula,nombre,apellidos,nombres,nombre_corregido,nombre_busqueda,origen,plan_clave,plan_descripcion)
                          VALUES (?,?,?,?,1,?,'manual',?,?)""",(matricula,nombre,apellidos,nombres,search_name(nombre,matricula),plan,desc)).lastrowid
        for m in body.materias:insert_subject(db,aid,p['id'],m)
    return student_detail(db,matricula)

@router.put('/alumnos/{matricula}')
def edit_student(matricula:str,body:EditAlumno,request:Request):
    db=request.app.state.db
    with transaction(db):
        a=student_row(db,matricula)
        if a['origen']!='manual':raise HTTPException(409,{'error':'Solo se pueden editar los alumnos dados de alta a mano.','code':'NO_MANUAL'})
        db.execute("UPDATE alumnos SET plan_clave=?,plan_descripcion=?,actualizado_en=datetime('now','localtime') WHERE id=?",
                   (words(body.planClave,30,'La clave del plan',False),words(body.planDescripcion,120,'La descripción del plan',False),a['id']))
    return student_detail(db,matricula)

@router.delete('/alumnos/{matricula}')
def delete_student(matricula:str,request:Request):
    db=request.app.state.db
    with transaction(db):
        a=student_row(db,matricula)
        if a['origen']!='manual':raise HTTPException(409,{'error':'Los alumnos del Excel no se pueden eliminar; se actualizan con cada carga.','code':'NO_MANUAL'})
        if db.execute("SELECT 1 FROM inscripciones WHERE alumno_id=? AND origen='excel'",(a['id'],)).fetchone():
            raise HTTPException(409,{'error':'El alumno ya tiene materias del Excel; no se puede eliminar.','code':'NO_MANUAL'})
        courses=[r[0] for r in db.execute("SELECT curso_id FROM inscripciones WHERE alumno_id=?",(a['id'],))]
        db.execute('DELETE FROM alumnos WHERE id=?',(a['id'],))
        for cid in courses:db.execute("DELETE FROM cursos WHERE id=? AND crn LIKE 'MAN-%' AND NOT EXISTS (SELECT 1 FROM inscripciones WHERE curso_id=?)",(cid,cid))
    return {'status':'ok'}

@router.post('/alumnos/{matricula}/materias',status_code=201)
def add_subject(matricula:str,body:MateriaManual,request:Request,periodo:str|None=None):
    db=request.app.state.db
    with transaction(db):
        a=student_row(db,matricula)
        iid=insert_subject(db,a['id'],period_for(db,periodo)['id'],body)
    return {'materia':subject_out(db,iid)}

def manual_enrollment(db,ident):
    r=db.execute('SELECT i.*,c.crn,c.periodo_id FROM inscripciones i JOIN cursos c ON c.id=i.curso_id WHERE i.id=?',(ident,)).fetchone()
    if not r:raise HTTPException(404,{'error':'Materia no encontrada.','code':'NO_ENCONTRADO'})
    if r['origen']!='manual':raise HTTPException(409,{'error':'Solo se pueden editar las materias capturadas a mano.','code':'NO_MANUAL'})
    return r

@router.put('/inscripciones/{ident}')
def edit_subject(ident:int,body:MateriaManual,request:Request):
    db=request.app.state.db
    with transaction(db):
        r=manual_enrollment(db,ident)
        acts=validate_subject(body)
        mid=subject_id(db,body)
        current=db.execute('SELECT materia_id FROM cursos WHERE id=?',(r['curso_id'],)).fetchone()[0]
        if mid!=current:
            # Cambio de materia: se reubica la inscripción en el curso manual de la nueva materia.
            if db.execute('SELECT 1 FROM inscripciones i JOIN cursos c ON c.id=i.curso_id WHERE i.alumno_id=? AND c.periodo_id=? AND c.materia_id=? AND i.id<>?',
                          (r['alumno_id'],r['periodo_id'],mid,ident)).fetchone():
                raise HTTPException(409,{'error':'El alumno ya tiene esa materia en el periodo.','code':'MATERIA_REPETIDA'})
            crn=f"MAN-{r['alumno_id']}-{mid}"
            db.execute('INSERT INTO cursos(periodo_id,crn,materia_id) VALUES (?,?,?) ON CONFLICT(periodo_id,crn) DO NOTHING',(r['periodo_id'],crn,mid))
            cid=db.execute('SELECT id FROM cursos WHERE periodo_id=? AND crn=?',(r['periodo_id'],crn)).fetchone()[0]
            db.execute('UPDATE inscripciones SET curso_id=? WHERE id=?',(cid,ident))
            db.execute("DELETE FROM cursos WHERE id=? AND crn LIKE 'MAN-%' AND NOT EXISTS (SELECT 1 FROM inscripciones WHERE curso_id=?)",(r['curso_id'],r['curso_id']))
        else:
            cid=r['curso_id']
        db.execute('UPDATE cursos SET limite_faltas=? WHERE id=?',(body.limiteFaltas or None,cid))
        db.execute('UPDATE inscripciones SET faltas=?,calificacion=? WHERE id=?',(body.faltas,body.calificacion,ident))
        db.execute('DELETE FROM actividades WHERE inscripcion_id=?',(ident,))
        db.executemany('INSERT INTO actividades(inscripcion_id,numero,codigo,valor) VALUES (?,?,?,?)',[(ident,n,c,v) for n,c,v in acts])
    return {'materia':subject_out(db,ident)}

@router.delete('/inscripciones/{ident}')
def delete_subject(ident:int,request:Request):
    db=request.app.state.db
    with transaction(db):
        r=manual_enrollment(db,ident)
        db.execute('DELETE FROM inscripciones WHERE id=?',(ident,))
        db.execute("DELETE FROM cursos WHERE id=? AND crn LIKE 'MAN-%' AND NOT EXISTS (SELECT 1 FROM inscripciones WHERE curso_id=?)",(r['curso_id'],r['curso_id']))
    return {'status':'ok'}
