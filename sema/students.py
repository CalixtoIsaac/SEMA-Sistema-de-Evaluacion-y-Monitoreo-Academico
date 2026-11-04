from collections import defaultdict
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
    cuts=defaultdict(list)
    for r in db.execute('''SELECT c.alumno_id,c.promedio,c.estado,i.aplicado_en,i.id AS importacion_id FROM cortes_alumno c JOIN importaciones i ON i.id=c.importacion_id WHERE i.periodo_id=? AND i.estado='aplicada' ORDER BY i.aplicado_en DESC,i.id DESC''',(p['id'],)):
        day=(r['aplicado_en'] or '')[:10]
        if len(cuts[r['alumno_id']])<2 and day not in {x[0] for x in cuts[r['alumno_id']]}:
            cuts[r['alumno_id']].append((day,dict(r)))
    u=thresholds(db)
    preference=db.execute('SELECT formato_nombre FROM usuarios ORDER BY id LIMIT 1').fetchone()[0]
    out=[]
    for aid,items in grouped.items():
        r=people[aid];s=summary(items,u)
        s.pop('materiasCriticas',None)
        history=cuts[aid]
        s['tendencia']=trend(history[0][1],history[1][1] if len(history)>1 else None,u['evolucion.umbral_puntos']) if history else 'sin_historial'
        if s['tendencia']=='empeora':s['alertas'].append('empeora')
        s.update({'matricula':r['matricula'],'nombre':r['nombre'],'apellidos':r['apellidos'],'nombres':r['nombres'],
                  'nombreMostrar':(' '.join((r['nombres'],r['apellidos'])).strip() if preference=='nombres_apellidos' else ' '.join((r['apellidos'],r['nombres'])).strip()),
                  'planClave':r['plan_clave'],'origen':r['origen']})
        totals[s['estado']]+=1;out.append(s)
    return {'alumnos':out,'totales':totals,'periodo':{'clave':p['clave'],'nombre':p['nombre']}}
