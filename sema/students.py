"""Alumnos: listado (#19), detalle (#20) y corrección de nombre (M-12).

Las funciones auxiliares (periodo actual, cortes, nombre a mostrar y resúmenes)
también las usan el Resumen administrativo (#34) y la exportación (#42).
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from .auth import require_user
from .db import transaction
from .indicators import (records_for_period, summary, thresholds, SEVERITY,
                         grade_state, fall_state, manual_grade, unaccent)

router=APIRouter(prefix='/api/alumnos',dependencies=[Depends(require_user)])

ESTADOS=('correcto','preventivo','critico','sin_datos','baja')
ETIQUETAS={'correcto':'Correcto','preventivo':'Preventivo','critico':'Crítico','sin_datos':'Sin datos','baja':'Baja'}

def trend(current,previous,threshold):
    if previous is None:return 'sin_historial'
    a,b=SEVERITY.get(current['estado'],0),SEVERITY.get(previous['estado'],0)
    delta=(current['promedio']-previous['promedio']) if current['promedio'] is not None and previous['promedio'] is not None else 0
    if a>b or delta<=-threshold:return 'empeora'
    if a<b or delta>=threshold:return 'mejora'
    return 'estable'

def not_found(msg='Alumno no encontrado.'):
    return HTTPException(404,{'error':msg,'code':'NO_ENCONTRADO'})

def resolve_period(db,periodo=None):
    """Periodo pedido o, por defecto, el más reciente. 404 si se pidió uno que no existe."""
    if periodo:
        p=db.execute('SELECT * FROM periodos WHERE clave=?',(periodo,)).fetchone()
        if not p:raise HTTPException(404,'Periodo no encontrado.')
        return p
    return db.execute('SELECT * FROM periodos ORDER BY clave DESC LIMIT 1').fetchone()

def check_list(db,lista):
    if lista is not None and not db.execute('SELECT 1 FROM listas WHERE id=?',(lista,)).fetchone():
        raise HTTPException(404,'Lista no encontrada.')

def name_format(db):
    row=db.execute('SELECT formato_nombre FROM usuarios ORDER BY id LIMIT 1').fetchone()
    return row[0] if row else 'nombres_apellidos'

def display_name(row,preference):
    parts=(row['nombres'],row['apellidos']) if preference=='nombres_apellidos' else (row['apellidos'],row['nombres'])
    return ' '.join(x for x in parts if x).strip() or row['nombre']

def cut_imports(db,period_id,limit=None):
    """Cortes del periodo (context/07 §9.1): la última importación aplicada de cada día,
    del más reciente al más antiguo."""
    days={}
    for r in db.execute("SELECT id,aplicado_en FROM importaciones WHERE periodo_id=? AND tipo='monitoreo' AND estado='aplicada' ORDER BY aplicado_en DESC,id DESC",(period_id,)):
        day=(r['aplicado_en'] or '')[:10]
        if day not in days:days[day]={'importacionId':r['id'],'fecha':day,'aplicadoEn':r['aplicado_en']}
        if limit and len(days)==limit:break
    return list(days.values())

def cuts_by_student(db,import_ids):
    out=[]
    for imp in import_ids:
        out.append({r['alumno_id']:dict(r) for r in db.execute('SELECT alumno_id,promedio,faltas_total,estado,estado_faltas FROM cortes_alumno WHERE importacion_id=?',(imp,))})
    return out

def student_summaries(db,period,lista=None,u=None):
    """AlumnoResumen[] y totales del periodo (y de la lista, si se indica)."""
    totals={k:0 for k in ESTADOS}
    grouped=records_for_period(db,period['id'],lista)
    if not grouped:return [],totals
    u=u or thresholds(db)
    # Una consulta delimitada por periodo, incluso cuando hay más de 999 alumnos.
    people={r['id']:r for r in db.execute('''SELECT DISTINCT a.id,a.matricula,a.nombre,a.apellidos,a.nombres,a.plan_clave,a.origen FROM alumnos a JOIN inscripciones i ON i.alumno_id=a.id JOIN cursos c ON c.id=i.curso_id WHERE c.periodo_id=?''',(period['id'],)) if r['id'] in grouped}
    # C2 (context/07 §9.2): se compara contra el corte anterior DEL PERIODO.
    cuts=cuts_by_student(db,[c['importacionId'] for c in cut_imports(db,period['id'],2)])+[{},{}]
    preference=name_format(db)
    out=[]
    for aid,items in grouped.items():
        r=people[aid];s=summary(items,u)
        s.pop('materiasCriticas',None)
        current=cuts[0].get(aid)
        s['tendencia']=trend(current,cuts[1].get(aid),u['evolucion.umbral_puntos']) if current else 'sin_historial'
        if s['tendencia']=='empeora':s['alertas'].append('empeora')
        s.update({'matricula':r['matricula'],'nombre':r['nombre'],'apellidos':r['apellidos'],'nombres':r['nombres'],
                  'nombreMostrar':display_name(r,preference),'planClave':r['plan_clave'],'origen':r['origen']})
        totals[s['estado']]+=1;out.append(s)
    return out,totals

@router.get('')
def list_students(request:Request,lista:int|None=None,periodo:str|None=None):
    db=request.app.state.db
    check_list(db,lista)
    p=resolve_period(db,periodo)
    if not p:return {'alumnos':[],'totales':{k:0 for k in ESTADOS},'periodo':None}
    out,totals=student_summaries(db,p,lista)
    return {'alumnos':out,'totales':totals,'periodo':{'clave':p['clave'],'nombre':p['nombre']}}

# ---------- Detalle (#20 · HU-17) ----------

def fmt1(n):
    return f'{n:.1f}'.rstrip('0').rstrip('.') if n is not None else ''

def motivo_texto(s):
    estado=ETIQUETAS.get(s['estado'],s['estado'])
    if s['estado']=='baja':return 'Todas sus materias están dadas de baja'
    if s['motivoEstado']=='sin_derecho':return f'{estado}: sin derecho en una materia (SD)'
    if s['motivoEstado']=='faltas' and s['faltasPeorMateria']:
        w=s['faltasPeorMateria']
        return f"{estado} por faltas en {w['materia']} ({w['faltas']} / {w['limite']})" if w['limite'] else f"{estado} por faltas en {w['materia']} ({w['faltas']} faltas)"
    if s['motivoEstado']=='promedio' and s['promedioGeneral'] is not None:
        return f"{estado} por promedio ({fmt1(s['promedioGeneral'])})"
    return 'Sin datos suficientes para evaluar'

def subject_rows(db,student_id,period_id,u):
    rows=db.execute('''SELECT i.id,i.estatus,i.faltas,i.ne,i.calificacion,i.calificacion_codigo,i.origen,i.es_baja,
        c.crn,c.grupo,c.dias,c.hora_inicio,c.hora_fin,c.limite_faltas,c.limite_ne,m.clave,m.nombre,p.nombre AS profesor
        FROM inscripciones i JOIN cursos c ON c.id=i.curso_id JOIN materias m ON m.id=c.materia_id
        LEFT JOIN profesores p ON p.id=c.profesor_id
        WHERE i.alumno_id=? AND c.periodo_id=?''',(student_id,period_id)).fetchall()
    acts={}
    if rows:
        marks=','.join('?'*len(rows))
        for a in db.execute(f'SELECT inscripcion_id,numero,codigo,valor FROM actividades WHERE inscripcion_id IN ({marks}) ORDER BY numero',[r['id'] for r in rows]):
            item={'numero':a['numero']}
            if a['valor'] is not None:item['valor']=a['valor']
            if a['codigo']:item['codigo']=a['codigo']
            acts.setdefault(a['inscripcion_id'],[]).append(item)
    out=[]
    for r in rows:
        actividades=acts.get(r['id'],[])
        value=r['calificacion']
        if value is None and r['origen']=='manual':value=manual_grade(actividades)
        pct=(r['faltas']/r['limite_faltas']*100) if r['limite_faltas'] else None
        estado_cal='critico' if r['calificacion_codigo']=='SD' else grade_state(value,u)
        estado_faltas=fall_state(r['faltas'],r['limite_faltas'],u)
        out.append({'inscripcionId':r['id'],'clave':r['clave'],'nombre':r['nombre'],'crn':r['crn'],'grupo':r['grupo'],
            'profesor':r['profesor'],'dias':r['dias'],'horaInicio':r['hora_inicio'],'horaFin':r['hora_fin'],
            'actividades':actividades,'calificacion':round(value,2) if value is not None else None,
            'calificacionCodigo':r['calificacion_codigo'],'calificacionCalculada':r['calificacion'] is None and value is not None,
            'estadoCalificacion':estado_cal,'faltas':r['faltas'],'limiteFaltas':r['limite_faltas'],
            'porcentajeFaltas':round(pct,1) if pct is not None else None,'estadoFaltas':estado_faltas,
            'estado':max((estado_cal,estado_faltas),key=lambda s:SEVERITY[s]),
            'ne':r['ne'],'limiteNe':r['limite_ne'],'esBaja':bool(r['es_baja']),'estatus':r['estatus'],'origen':r['origen']})
    # De peor a mejor (estado, luego calificación más baja); bajas al final.
    def rank(m):
        cal=m['calificacion'] if m['calificacion'] is not None else 101
        return (1 if m['esBaja'] else 0,-SEVERITY[m['estado']],cal,-(m['porcentajeFaltas'] or 0),unaccent(m['nombre']))
    return sorted(out,key=rank)

def student_detail(db,matricula):
    a=db.execute('SELECT * FROM alumnos WHERE matricula=?',(matricula.strip().upper(),)).fetchone()
    if not a:raise not_found()
    # Periodo del alumno: el más reciente en el que tiene inscripciones.
    p=db.execute('''SELECT p.* FROM periodos p JOIN cursos c ON c.periodo_id=p.id JOIN inscripciones i ON i.curso_id=c.id
                    WHERE i.alumno_id=? ORDER BY p.clave DESC LIMIT 1''',(a['id'],)).fetchone()
    u=thresholds(db)
    preference=name_format(db)
    listas=[dict(r) for r in db.execute('SELECT l.id,l.nombre FROM listas l JOIN lista_alumnos la ON la.lista_id=l.id WHERE la.matricula=? ORDER BY l.nombre',(a['matricula'],))]
    alumno={'matricula':a['matricula'],'nombre':a['nombre'],'apellidos':a['apellidos'],'nombres':a['nombres'],
            'nombreMostrar':display_name(a,preference),'nombreCorregido':bool(a['nombre_corregido']),
            'planClave':a['plan_clave'],'planDescripcion':a['plan_descripcion'],'nivel':a['nivel'],'origen':a['origen'],
            'listas':listas,'periodo':{'clave':p['clave'],'nombre':p['nombre']} if p else None}
    if not p:
        alumno.update(summary([],u));alumno.pop('materiasCriticas',None)
        alumno.update({'estado':'sin_datos','motivoTexto':motivo_texto({'estado':'sin_datos','motivoEstado':None}),'tendencia':'sin_historial'})
        return {'alumno':alumno,'materias':[],'evolucion':[],'faltasNuevas':None}
    items=records_for_period(db,p['id']).get(a['id'],[])
    s=summary(items,u);s.pop('materiasCriticas',None)
    cuts=list(reversed(cut_imports(db,p['id'])))  # cronológico
    history=cuts_by_student(db,[c['importacionId'] for c in cuts])
    evolucion=[]
    for c,data in zip(cuts,history):
        row=data.get(a['id'])
        if row:evolucion.append({'importacionId':c['importacionId'],'fecha':c['fecha'],'promedio':row['promedio'],
                                 'faltasTotal':row['faltas_total'],'estado':row['estado']})
    # La tendencia compara el último corte del periodo con el anterior (el alumno debe estar en ambos).
    last=history[-1].get(a['id']) if history else None
    prev=history[-2].get(a['id']) if len(history)>1 else None
    s['tendencia']=trend(last,prev,u['evolucion.umbral_puntos']) if last else 'sin_historial'
    if s['tendencia']=='empeora':s['alertas'].append('empeora')
    faltas_nuevas=None
    if last and prev:
        faltas_nuevas={'faltas':last['faltas_total']-prev['faltas_total'],'desde':cuts[-2]['fecha'],
                       'estadoAnterior':prev['estado'],'promedioAnterior':prev['promedio']}
    alumno.update(s);alumno['motivoTexto']=motivo_texto(s)
    return {'alumno':alumno,'materias':subject_rows(db,a['id'],p['id'],u),'evolucion':evolucion,'faltasNuevas':faltas_nuevas}

@router.get('/{matricula}')
def detail(matricula:str,request:Request):
    return student_detail(request.app.state.db,matricula)

class NameFix(BaseModel):
    apellidos:str
    nombres:str

@router.put('/{matricula}/nombre')
def fix_name(matricula:str,body:NameFix,request:Request):
    apellidos=' '.join(body.apellidos.split());nombres=' '.join(body.nombres.split())
    if not apellidos or not nombres or len(apellidos)>120 or len(nombres)>120:
        raise HTTPException(400,{'error':'Escribe los apellidos y los nombres (máximo 120 caracteres cada uno).','code':'VALIDACION'})
    db=request.app.state.db
    with transaction(db):
        cur=db.execute("UPDATE alumnos SET apellidos=?,nombres=?,nombre_corregido=1,actualizado_en=datetime('now','localtime') WHERE matricula=?",
                       (apellidos,nombres,matricula.strip().upper()))
        if not cur.rowcount:raise not_found()
    return student_detail(db,matricula)
