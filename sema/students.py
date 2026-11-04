from fastapi import APIRouter, Depends, HTTPException, Request
from .auth import require_user
from .indicators import records_for_period, summary, thresholds, SEVERITY

router=APIRouter(prefix='/api/alumnos',dependencies=[Depends(require_user)])

def trend(current,previous,threshold):
    if previous is None:return 'sin_historial'
    a,b=SEVERITY.get(current['estado'],0),SEVERITY.get(previous['estado'],0)
    delta=(current['promedio']-previous['promedio']) if current['promedio'] is not None and previous['promedio'] is not None else 0
    if a>b or delta<=-threshold:return 'empeora'
    if a<b or delta>=threshold:return 'mejora'
    return 'estable'

@router.get('')
def list_students(request:Request,lista:int|None=None,periodo:str|None=None):
    db=request.app.state.db
    if lista is not None and not db.execute('SELECT 1 FROM listas WHERE id=?',(lista,)).fetchone():
        raise HTTPException(404,'Lista no encontrada.')
    if periodo:
        p=db.execute('SELECT * FROM periodos WHERE clave=?',(periodo,)).fetchone()
        if not p:raise HTTPException(404,'Periodo no encontrado.')
    else:
        p=db.execute('SELECT * FROM periodos ORDER BY clave DESC LIMIT 1').fetchone()
    totals={k:0 for k in ('correcto','preventivo','critico','sin_datos','baja')}
    if not p:return {'alumnos':[],'totales':totals,'periodo':None}
    grouped=records_for_period(db,p['id'],lista)
    if not grouped:return {'alumnos':[],'totales':totals,'periodo':{'clave':p['clave'],'nombre':p['nombre']}}
    # Una consulta delimitada por periodo, incluso cuando hay más de 999 alumnos.
    people={r['id']:r for r in db.execute('''SELECT DISTINCT a.id,a.matricula,a.nombre,a.apellidos,a.nombres,a.plan_clave,a.origen FROM alumnos a JOIN inscripciones i ON i.alumno_id=a.id JOIN cursos c ON c.id=i.curso_id WHERE c.periodo_id=?''',(p['id'],)) if r['id'] in grouped}
    # C2 (context/07 §9.2): se compara contra el corte anterior DEL PERIODO.
    # Un corte por día: la última importación aplicada de cada día. Se toman los dos días más recientes.
    days={}
    for r in db.execute("SELECT id,aplicado_en FROM importaciones WHERE periodo_id=? AND estado='aplicada' ORDER BY aplicado_en DESC,id DESC",(p['id'],)):
        day=(r['aplicado_en'] or '')[:10]
        if day not in days:days[day]=r['id']
        if len(days)==2:break
    cut_ids=list(days.values())
    cuts=[{},{}]
    for n,imp in enumerate(cut_ids):
        for r in db.execute('SELECT alumno_id,promedio,estado FROM cortes_alumno WHERE importacion_id=?',(imp,)):
            cuts[n][r['alumno_id']]=dict(r)
    u=thresholds(db)
    preference=db.execute('SELECT formato_nombre FROM usuarios ORDER BY id LIMIT 1').fetchone()[0]
    out=[]
    for aid,items in grouped.items():
        r=people[aid];s=summary(items,u)
        s.pop('materiasCriticas',None)
        current=cuts[0].get(aid)
        s['tendencia']=trend(current,cuts[1].get(aid),u['evolucion.umbral_puntos']) if current else 'sin_historial'
        if s['tendencia']=='empeora':s['alertas'].append('empeora')
        s.update({'matricula':r['matricula'],'nombre':r['nombre'],'apellidos':r['apellidos'],'nombres':r['nombres'],
                  'nombreMostrar':(' '.join((r['nombres'],r['apellidos'])).strip() if preference=='nombres_apellidos' else ' '.join((r['apellidos'],r['nombres'])).strip()),
                  'planClave':r['plan_clave'],'origen':r['origen']})
        totals[s['estado']]+=1;out.append(s)
    return {'alumnos':out,'totales':totals,'periodo':{'clave':p['clave'],'nombre':p['nombre']}}
