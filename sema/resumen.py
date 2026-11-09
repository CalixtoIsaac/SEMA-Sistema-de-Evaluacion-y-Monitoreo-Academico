"""Resumen administrativo del Menú principal (#34 · HU-18/19) y evolución del grupo (#37 · M-05).

Definiciones exactas en context/07 §10 y §9.3; contrato en context/06 §7.
"""
from fastapi import APIRouter, Depends, Request
from .auth import require_user
from .indicators import records_for_period, thresholds, grade_state
from .students import check_list, resolve_period, student_summaries, cut_imports, cuts_by_student
from .exportar import ordenar

router=APIRouter(prefix='/api/resumen',dependencies=[Depends(require_user)])

RANGOS=[('<60',0,60),('60-69',60,70),('70-79',70,80),('80-89',80,90),('90-100',90,101)]
TOP_RIESGO=10
TOP_MATERIAS=10
MIN_ALUMNOS_MATERIA=5

def empty(ultima=None):
    return {'vacio':True,'ultimaActualizacion':ultima,'periodo':None,'kpis':None,'porEstado':[],'porRango':[],
            'materiasBajas':[],'porEstadoFaltas':[],'topRiesgo':[],'evolucion':[],
            'tendencias':{'mejora':0,'estable':0,'empeora':0,'sinHistorial':0}}

def subject_averages(grouped,u):
    """Promedio de calificación por materia (mín. 5 alumnos vigentes), las 10 más bajas."""
    acc={}
    for items in grouped.values():
        for x in items:
            if x['es_baja']:continue
            value=x['calificacion'] if x['calificacion'] is not None else x.get('calificacion_manual')
            if value is None:continue
            m=acc.setdefault(x['materia_clave'],{'clave':x['materia_clave'],'nombre':x['materia'],'suma':0,'alumnos':0})
            m['suma']+=value;m['alumnos']+=1
    out=[]
    for m in acc.values():
        if m['alumnos']<MIN_ALUMNOS_MATERIA:continue
        avg=m['suma']/m['alumnos']
        out.append({'clave':m['clave'],'nombre':m['nombre'],'promedio':round(avg,1),'alumnos':m['alumnos'],'estado':grade_state(avg,u)})
    return sorted(out,key=lambda m:(m['promedio'],m['nombre']))[:TOP_MATERIAS]

def evolution(db,period_id,scope_ids):
    """Por corte (un corte por día, cronológico): promedio del grupo y % de alumnos en Crítico."""
    cuts=list(reversed(cut_imports(db,period_id)))
    out=[]
    for c,data in zip(cuts,cuts_by_student(db,[c['importacionId'] for c in cuts])):
        rows=[r for aid,r in data.items() if aid in scope_ids and r['estado']!='baja']
        if not rows:continue
        proms=[r['promedio'] for r in rows if r['promedio'] is not None]
        criticos=sum(r['estado']=='critico' for r in rows)
        out.append({'importacionId':c['importacionId'],'fecha':c['fecha'],
                    'promedio':round(sum(proms)/len(proms),1) if proms else None,
                    'porcentajeCritico':round(criticos/len(rows)*100,1),'alumnos':len(rows)})
    return out

@router.get('')
def resumen(request:Request,lista:int|None=None):
    db=request.app.state.db
    check_list(db,lista)
    row=db.execute("SELECT MAX(aplicado_en) FROM importaciones WHERE tipo='monitoreo' AND estado='aplicada'").fetchone()
    ultima=row[0] if row else None
    p=resolve_period(db)
    if not p:return empty(ultima)
    u=thresholds(db)
    alumnos,totales=student_summaries(db,p,lista,u)
    activos=[a for a in alumnos if a['estado']!='baja']
    if not activos:
        out=empty(ultima);out['periodo']={'clave':p['clave'],'nombre':p['nombre']}
        return out
    proms=[a['promedioGeneral'] for a in activos if a['promedioGeneral'] is not None]
    kpis={'alumnos':len(activos),'promedioGeneral':round(sum(proms)/len(proms),1) if proms else None,
          'critico':totales['critico'],'preventivo':totales['preventivo'],'correcto':totales['correcto'],
          'sinDatos':totales['sin_datos'],'bajas':totales['baja']}
    por_estado=[{'estado':k,'total':totales[k]} for k in ('correcto','preventivo','critico','sin_datos')]
    por_rango=[{'rango':label,'total':sum(lo<=v<hi for v in proms)} for label,lo,hi in RANGOS]
    faltas={k:0 for k in ('correcto','preventivo','critico')}
    for a in activos:
        if a['estadoFaltas'] in faltas:faltas[a['estadoFaltas']]+=1
    en_riesgo=[a for a in activos if a['estado'] in ('critico','preventivo')]
    top=ordenar(en_riesgo,True,True)[:TOP_RIESGO]
    tendencias={'mejora':0,'estable':0,'empeora':0,'sinHistorial':0}
    for a in activos:
        tendencias['sinHistorial' if a['tendencia']=='sin_historial' else a['tendencia']]+=1
    grouped=records_for_period(db,p['id'],lista)  # llaves = id de alumno del ámbito
    return {'vacio':False,'ultimaActualizacion':ultima,'periodo':{'clave':p['clave'],'nombre':p['nombre']},
            'kpis':kpis,'porEstado':por_estado,'porRango':por_rango,'materiasBajas':subject_averages(grouped,u),
            'porEstadoFaltas':[{'estado':k,'total':v} for k,v in faltas.items()],'topRiesgo':top,
            'evolucion':evolution(db,p['id'],set(grouped)),'tendencias':tendencias}
