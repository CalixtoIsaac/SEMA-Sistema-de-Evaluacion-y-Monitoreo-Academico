"""Reglas puras de context/07, reutilizadas por importación y listado."""
import unicodedata
from functools import lru_cache

SEVERITY={'sin_datos':0,'correcto':1,'preventivo':2,'critico':3}

def grade_state(value,u):
    if value is None: return 'sin_datos'
    if value>=u['calificacion.correcto_min']: return 'correcto'
    if value>=u['calificacion.preventivo_min']: return 'preventivo'
    return 'critico'

def fall_state(falls,limit,u):
    if not limit:
        if falls>=u['faltas.fijo_critico']: return 'critico'
        if falls>=u['faltas.fijo_preventivo']: return 'preventivo'
        return 'correcto'
    pct=falls/limit*100
    if pct>=u['faltas.critico_pct']: return 'critico'
    if pct>=u['faltas.preventivo_pct']: return 'preventivo'
    return 'correcto'

def manual_grade(activities):
    values=[a['valor'] if a.get('valor') is not None else 0 for a in activities
            if a.get('valor') is not None or a.get('codigo') in ('NE','SC','DA')]
    return sum(values)/len(values) if values else None

def unaccent(value):
    return ''.join(c for c in unicodedata.normalize('NFD',value) if unicodedata.category(c)!='Mn').lower()


def summary(items,u):
    if items and all(x['es_baja'] for x in items):
        return {'promedioGeneral':None,'faltasTotal':0,'faltasPeorMateria':None,'estadoPromedio':'sin_datos','estadoFaltas':'sin_datos','estado':'baja','motivoEstado':None,'materias':0,'materiasReprobando':0,'materiasCriticas':0,'alertas':[]}
    active=[x for x in items if not x['es_baja']]
    nums=[x['calificacion'] if x['calificacion'] is not None else x.get('calificacion_manual') for x in active if x['calificacion'] is not None or x.get('calificacion_manual') is not None]
    avg=sum(nums)/len(nums) if nums else None
    average_state=grade_state(avg,u)
    worst=None; worst_rank=(-1,-1); falls_state='sin_datos'; total=0; alerts=set(); failing=0; critical=0
    for x in active:
        f=x['faltas'] or 0; limit=x['limite_faltas']; total+=f
        pct=f/limit*100 if limit else None
        state=fall_state(f,limit,u)
        if SEVERITY[state]>SEVERITY[falls_state]:falls_state=state
        rank=(SEVERITY[state],pct if pct is not None else f)
        if rank>worst_rank:
            worst_rank=rank;worst={'materia':x['materia'],'faltas':f,'limite':limit,'porcentaje':pct}
        if limit and f>=limit:alerts.add('faltas_limite')
        if x['limite_ne'] and x['ne']>=x['limite_ne']:alerts.add('muchos_ne')
        if x['calificacion_codigo']=='SD':alerts.add('sin_derecho')
        value=x['calificacion'] if x['calificacion'] is not None else x.get('calificacion_manual')
        if value is not None and value<u['calificacion.preventivo_min']:failing+=1
        if state=='critico' or x['calificacion_codigo']=='SD' or (value is not None and value<u['calificacion.preventivo_min']):critical+=1
        if 'SC' in x.get('actividad_codigos',[]):alerts.add('sin_calificar')
        if 'DA' in x.get('actividad_codigos',[]):alerts.add('deshonestidad')
    if failing:alerts.add('reprobando')
    state=max((average_state,falls_state),key=lambda s:SEVERITY[s])
    if not nums and total==0 and 'sin_derecho' not in alerts:state='sin_datos'
    if 'sin_derecho' in alerts:state='critico';reason='sin_derecho'
    elif state=='sin_datos':reason=None
    elif SEVERITY[falls_state]>SEVERITY[average_state]:reason='faltas'
    else:reason='promedio'
    return {'materiasCriticas':critical,'promedioGeneral':round(avg,2) if avg is not None else None,'faltasTotal':total,'faltasPeorMateria':worst,'estadoPromedio':average_state,'estadoFaltas':falls_state,'estado':state,'motivoEstado':reason,'materias':len(active),'materiasReprobando':failing,'alertas':sorted(alerts)}

def thresholds(db):
    return {r['clave']:float(r['valor']) for r in db.execute('SELECT clave,valor FROM configuracion')}

COMPOUND_SURNAMES={('montes','de','oca'),('gutierrez','de','velasco'),('rubin','de','celis'),('ruiz','de','velasco'),('ponce','de','leon')}
PARTICLES={'de','del','la','las','los','y','san','santa','mc','van','von'}

@lru_cache(maxsize=8192)
def split_name(name):
    """context/07 §8: dos unidades de apellido; las partículas se unen a la palabra
    siguiente y los apellidos compuestos conocidos cuentan como una unidad."""
    words=name.split()
    if len(words)<2:return '',name
    plain=[unaccent(w) for w in words]  # una sola vez por nombre (#26)
    units=[];i=0
    while i<len(words):
        matched=next((len(c) for c in COMPOUND_SURNAMES if tuple(plain[i:i+len(c)])==c),0)
        if matched:
            units.append(' '.join(words[i:i+matched]));i+=matched;continue
        start=i
        while i<len(words)-1 and plain[i] in PARTICLES:i+=1
        units.append(' '.join(words[start:i+1]));i+=1
    n=2 if len(units)>2 else 1
    return ' '.join(units[:n]),' '.join(units[n:])

def records_for_period(db,period,lista=None):
    sql="""SELECT i.id AS inscripcion_id,i.alumno_id,i.origen,i.es_baja,i.faltas,i.ne,i.calificacion,i.calificacion_codigo,
    c.limite_faltas,c.limite_ne,m.nombre AS materia,m.clave AS materia_clave
    FROM inscripciones i JOIN cursos c ON c.id=i.curso_id JOIN materias m ON m.id=c.materia_id
    WHERE c.periodo_id=?"""
    args=[period]
    if lista is not None:
        sql+=' AND EXISTS (SELECT 1 FROM lista_alumnos l JOIN alumnos a ON a.matricula=l.matricula WHERE l.lista_id=? AND a.id=i.alumno_id)'
        args.append(lista)
    grouped={};by_id={}
    for r in db.execute(sql,args):
        d=dict(r);d['actividad_codigos']=[];d['actividad_valores']=[]
        by_id[d.pop('inscripcion_id')]=d
        grouped.setdefault(d.pop('alumno_id'),[]).append(d)
    if by_id:
        for a in db.execute("""SELECT a.inscripcion_id,a.codigo,a.valor FROM actividades a JOIN inscripciones i ON i.id=a.inscripcion_id JOIN cursos c ON c.id=i.curso_id WHERE c.periodo_id=? AND (a.codigo IN ('SC','DA') OR i.origen='manual')""",(period,)):
            d=by_id.get(a['inscripcion_id'])
            if d is None:continue
            if a['codigo']:d['actividad_codigos'].append(a['codigo'])
            if d['origen']=='manual':d['actividad_valores'].append({'valor':a['valor'],'codigo':a['codigo']})
        for d in by_id.values():
            values=d.pop('actividad_valores')
            d['calificacion_manual']=manual_grade(values) if d['origen']=='manual' and d['calificacion'] is None else None
    return grouped
