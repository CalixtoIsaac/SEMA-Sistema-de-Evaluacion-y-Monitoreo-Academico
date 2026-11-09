"""Previa y aplicación atómica de monitoreo."""
import json
from pathlib import Path
import unicodedata
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from pydantic import BaseModel
from .auth import require_user
from .db import transaction
from .excel import parse, FormatError
from .indicators import summary, thresholds, split_name

router=APIRouter(prefix='/api/importaciones',dependencies=[Depends(require_user)])
MAX=15*1024*1024

def scalar(db,sql,args):
    row=db.execute(sql,args).fetchone()
    return row[0] if row else None

def existing(db,table,key,value):
    return scalar(db,f'SELECT id FROM {table} WHERE {key}=?',(value,))

def search_name(name,mat):
    s=unicodedata.normalize('NFD',name+' '+mat)
    return ''.join(c for c in s if unicodedata.category(c)!='Mn').lower()

@router.post('/monitoreo',status_code=201)
async def preview(request:Request,archivo:UploadFile=File(...)):
    if Path(archivo.filename or '').suffix.lower()!='.xlsx':raise HTTPException(415,'Solo se aceptan archivos .xlsx.')
    chunks=[];size=0
    while chunk:=await archivo.read(1024*1024):
        size+=len(chunk)
        if size>MAX:raise HTTPException(413,'El archivo supera 15 MB.')
        chunks.append(chunk)
    try:result=parse(b''.join(chunks))
    except FormatError as e:raise HTTPException(422,{'error':'Este archivo no tiene el formato del Excel de monitoreo.','code':'FORMATO','detalles':e.missing})
    rows=result['rows'];db=request.app.state.db
    if not rows:raise HTTPException(422,{'error':'El archivo no contiene filas válidas.','code':'FORMATO'})
    periods={r['periodo'] for r in rows}
    if len(periods)!=1:raise HTTPException(422,{'error':'El archivo debe contener un solo periodo.','code':'FORMATO'})
    p=rows[0];period_id=existing(db,'periodos','clave',p['periodo'])
    students={r['matricula'] for r in rows};courses={r['crn'] for r in rows}
    present=set()
    if period_id:
        present={(r['matricula'],r['crn']) for r in db.execute('SELECT a.matricula,c.crn FROM inscripciones i JOIN alumnos a ON a.id=i.alumno_id JOIN cursos c ON c.id=i.curso_id WHERE c.periodo_id=? AND i.origen=\'excel\'',(period_id,))}
    incoming={(r['matricula'],r['crn']) for r in rows}
    summary_out={'periodo':{'clave':p['periodo'],'nombre':p['periodo_nombre'] or p['periodo']},'totalFilas':result['total'],'filasValidas':len(rows),'filasOmitidas':result['omitted'],'alumnos':len(students),'alumnosNuevos':sum(existing(db,'alumnos','matricula',m) is None for m in students),'materias':len({r['materia_clave'] for r in rows}),'cursos':len(courses),'bajas':len({r['matricula'] for r in rows if r['es_baja']}),'periodoYaExiste':bool(period_id),'inscripcionesQueSeEliminarian':len(present-incoming)}
    with transaction(db):
        cur=db.execute('INSERT INTO importaciones(archivo,tipo,estado,total_filas,filas_validas,filas_omitidas,total_alumnos,total_materias,advertencias,datos_previa) VALUES (?,\'monitoreo\',\'previa\',?,?,?,?,?,?,?)',
            (Path(archivo.filename).name,result['total'],len(rows),result['omitted'],len(students),summary_out['materias'],json.dumps(result['warnings']),json.dumps(result,ensure_ascii=False)))
        ident=cur.lastrowid
    return {'importacion':{'id':ident,'archivo':Path(archivo.filename).name,'estado':'previa'},'resumen':summary_out,'columnas':result['columns'],'muestra':result['preview'][:20],'advertencias':result['warnings']}

def get_import(db,ident):
    row=db.execute('SELECT * FROM importaciones WHERE id=? AND tipo=\'monitoreo\'',(ident,)).fetchone()
    if not row:raise HTTPException(404,'Importación no encontrada.')
    return row

@router.get('/{ident}/muestra')
def sample(ident:int,request:Request,todas:int=0,pagina:int=Query(1,ge=1)):
    row=get_import(request.app.state.db,ident)
    if row['estado']!='previa':raise HTTPException(409,'La previa ya no está disponible.')
    data=json.loads(row['datos_previa']);start=(pagina-1)*50
    return {'columnas':data['columns'],'filas':data['preview'][start:start+50],'total':len(data['preview'])}

@router.delete('/{ident}')
def discard(ident:int,request:Request):
    db=request.app.state.db
    with transaction(db):
        row=get_import(db,ident)
        if row['estado']!='previa':raise HTTPException(409,'La importación ya fue procesada.')
        db.execute("UPDATE importaciones SET estado='descartada',datos_previa=NULL WHERE id=?",(ident,))
    return {'status':'ok'}

class Confirm(BaseModel):modo:str

@router.post('/{ident}/confirmar')
def confirm(ident:int,body:Confirm,request:Request):
    if body.modo not in ('fusionar','reemplazar'):raise HTTPException(400,'Modo inválido.')
    db=request.app.state.db
    with transaction(db):
        imp=get_import(db,ident)
        if imp['estado']!='previa':raise HTTPException(409,'La importación ya fue procesada.')
        rows=json.loads(imp['datos_previa'])['rows']
        result=apply_rows(db,ident,rows,body.modo)
        db.execute("UPDATE importaciones SET estado='aplicada',modo=?,datos_previa=NULL,periodo_id=?,aplicado_en=datetime('now','localtime') WHERE id=?",(body.modo,result.pop('periodo_id'),ident))
        applied=db.execute('SELECT aplicado_en FROM importaciones WHERE id=?',(ident,)).fetchone()[0]
    return {'importacion':{'id':ident,'estado':'aplicada','aplicadoEn':applied},'resultado':result}

def apply_rows(db,ident,rows,mode):
    p=rows[0]
    db.execute('INSERT INTO periodos(clave,nombre,parte,modalidad,campus) VALUES (?,?,?,?,?) ON CONFLICT(clave) DO UPDATE SET nombre=excluded.nombre,parte=excluded.parte,modalidad=excluded.modalidad,campus=excluded.campus',(p['periodo'],p['periodo_nombre'] or p['periodo'],p['parte'],p['modalidad_periodo'],p['campus']))
    period=existing(db,'periodos','clave',p['periodo'])
    ids={};incoming=set();activities=0;applied_count=0
    for r in rows:
        mat=r['materia_clave'];student=r['matricula'];crn=r['crn']
        if mat not in ids:
            db.execute('INSERT INTO materias(clave,nombre) VALUES (?,?) ON CONFLICT(clave) DO UPDATE SET nombre=excluded.nombre',(mat,r['materia']))
            ids[mat]=existing(db,'materias','clave',mat)
        teacher=None
        if r['nomina']:
            db.execute('INSERT INTO profesores(nomina,nombre) VALUES (?,?) ON CONFLICT(nomina) DO UPDATE SET nombre=excluded.nombre',(r['nomina'],r['profesor'] or r['nomina']))
            teacher=existing(db,'profesores','nomina',r['nomina'])
        apellidos,nombres=split_name(r['nombre'] or '')
        db.execute('''INSERT INTO alumnos(matricula,nombre,apellidos,nombres,nombre_busqueda,campus_admision,nivel,plan_clave,plan_descripcion) VALUES (?,?,?,?,?,?,?,?,?)
         ON CONFLICT(matricula) DO UPDATE SET nombre=excluded.nombre,apellidos=CASE WHEN alumnos.nombre_corregido=1 THEN alumnos.apellidos ELSE excluded.apellidos END,nombres=CASE WHEN alumnos.nombre_corregido=1 THEN alumnos.nombres ELSE excluded.nombres END,nombre_busqueda=excluded.nombre_busqueda,campus_admision=excluded.campus_admision,nivel=excluded.nivel,plan_clave=excluded.plan_clave,plan_descripcion=excluded.plan_descripcion''',
         (student,r['nombre'] or student,apellidos,nombres,search_name(r['nombre'] or '',student),r['campus_admision'],r['nivel'],r['plan_clave'],r['plan_descripcion']))
        aid=existing(db,'alumnos','matricula',student)
        db.execute('''INSERT INTO cursos(periodo_id,crn,materia_id,profesor_id,limite_faltas,limite_ne,dias,hora_inicio,hora_fin,grupo,modalidad_clase) VALUES (?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(periodo_id,crn) DO UPDATE SET materia_id=excluded.materia_id,profesor_id=excluded.profesor_id,limite_faltas=excluded.limite_faltas,limite_ne=excluded.limite_ne,dias=excluded.dias,hora_inicio=excluded.hora_inicio,hora_fin=excluded.hora_fin,grupo=excluded.grupo,modalidad_clase=excluded.modalidad_clase''',
         (period,crn,ids[mat],teacher,r['limite_faltas'],r['limite_ne'],r['dias'],r['inicio'],r['fin'],r['grupo'],r['modalidad_clase']))
        cid=scalar(db,'SELECT id FROM cursos WHERE periodo_id=? AND crn=?',(period,crn))
        g=r['ponderado'] or {};value=g.get('valor');code=g.get('codigo')
        db.execute('''INSERT INTO inscripciones(alumno_id,curso_id,estatus,estatus_descripcion,faltas,ne,calificacion,calificacion_codigo,ultima_actividad,actualizado_escuela,origen,es_baja,importacion_id) VALUES (?,?,?,?,?,?,?,?,?,?,'excel',?,?)
         ON CONFLICT(alumno_id,curso_id) DO UPDATE SET estatus=excluded.estatus,estatus_descripcion=excluded.estatus_descripcion,faltas=excluded.faltas,ne=excluded.ne,calificacion=excluded.calificacion,calificacion_codigo=excluded.calificacion_codigo,ultima_actividad=excluded.ultima_actividad,actualizado_escuela=excluded.actualizado_escuela,es_baja=excluded.es_baja,importacion_id=excluded.importacion_id WHERE inscripciones.origen=?''',
         (aid,cid,r['estatus'],r['estatus_descripcion'],r['faltas'],r['ne'],value,code,r['ultima_actividad'],r['actualizado_escuela'],int(r['es_baja']),ident,'excel'))
        current=db.execute('SELECT id,origen FROM inscripciones WHERE alumno_id=? AND curso_id=?',(aid,cid)).fetchone()
        if current['origen']=='manual':
            continue
        iid=current['id'];applied_count+=1
        db.execute('DELETE FROM actividades WHERE inscripcion_id=?',(iid,))
        acts=[(iid,int(n),v.get('codigo'),v.get('valor')) for n,v in r['actividades'].items()]
        db.executemany('INSERT INTO actividades(inscripcion_id,numero,codigo,valor) VALUES (?,?,?,?)',acts)
        activities+=len(acts);incoming.add((aid,cid))
    deleted=0
    if mode=='reemplazar':
        old=db.execute("SELECT i.id,i.alumno_id,i.curso_id FROM inscripciones i JOIN cursos c ON c.id=i.curso_id WHERE c.periodo_id=? AND i.origen='excel'",(period,)).fetchall()
        remove=[(x['id'],) for x in old if (x['alumno_id'],x['curso_id']) not in incoming]
        db.executemany('DELETE FROM inscripciones WHERE id=?',remove);deleted=len(remove)
    # La misma función de indicadores alimenta cortes y GET /alumnos.
    from .indicators import records_for_period
    grouped=records_for_period(db,period)
    u=thresholds(db)
    for aid,items in grouped.items():
        s=summary(items,u)
        db.execute('INSERT INTO cortes_alumno(importacion_id,alumno_id,promedio,faltas_total,estado,estado_faltas,materias_criticas) VALUES (?,?,?,?,?,?,?)',
                   (ident,aid,s['promedioGeneral'],s['faltasTotal'],s['estado'],s['estadoFaltas'],s['materiasCriticas']))
    return {'periodo_id':period,'alumnos':len({r['matricula'] for r in rows}),'inscripciones':applied_count,'actividades':activities,'eliminadas':deleted}

# ---------- Historial de cargas (#39 · HU-09) ----------

@router.get('')
def history(request:Request,tipo:str|None=None,limite:int=Query(200,ge=1,le=1000)):
    """Cargas aplicadas o descartadas, de la más reciente a la más antigua. Las previas
    abiertas no se listan: todavía no son una carga."""
    if tipo is not None and tipo not in ('monitoreo','lista'):
        raise HTTPException(400,{'error':'El tipo debe ser monitoreo o lista.','code':'VALIDACION'})
    sql="""SELECT i.id,i.tipo,i.archivo,i.estado,i.modo,i.total_alumnos,i.total_filas,i.filas_omitidas,i.creado_en,i.aplicado_en,
           p.clave AS periodo_clave,p.nombre AS periodo_nombre
           FROM importaciones i LEFT JOIN periodos p ON p.id=i.periodo_id WHERE i.estado<>'previa'"""
    args=[]
    if tipo:sql+=' AND i.tipo=?';args.append(tipo)
    sql+=' ORDER BY COALESCE(i.aplicado_en,i.creado_en) DESC,i.id DESC LIMIT ?';args.append(limite)
    return {'importaciones':[{'id':r['id'],'tipo':r['tipo'],'archivo':r['archivo'],'estado':r['estado'],'modo':r['modo'],
            'totalAlumnos':r['total_alumnos'],'totalFilas':r['total_filas'],'filasOmitidas':r['filas_omitidas'],
            'periodo':{'clave':r['periodo_clave'],'nombre':r['periodo_nombre']} if r['periodo_clave'] else None,
            'creadoEn':r['creado_en'],'aplicadoEn':r['aplicado_en']} for r in request.app.state.db.execute(sql,args)]}
