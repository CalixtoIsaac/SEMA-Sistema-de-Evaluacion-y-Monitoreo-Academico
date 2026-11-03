"""Reglas puras de context/07, reutilizadas por importación y listado."""
SEVERITY={'sin_datos':0,'correcto':1,'preventivo':2,'critico':3}

def summary(items,u):
    if items and all(x['es_baja'] for x in items):
        return {'promedioGeneral':None,'faltasTotal':0,'faltasPeorMateria':None,'estadoPromedio':'sin_datos','estadoFaltas':'sin_datos','estado':'baja','motivoEstado':None,'materias':0,'materiasReprobando':0,'alertas':[]}
    active=[x for x in items if not x['es_baja']]
    nums=[x['calificacion'] for x in active if x['calificacion'] is not None]
    avg=sum(nums)/len(nums) if nums else None
    grade_state='sin_datos' if avg is None else ('correcto' if avg>=u['calificacion.correcto_min'] else 'preventivo' if avg>=u['calificacion.preventivo_min'] else 'critico')
    worst=None; falls_state='sin_datos'; total=0; alerts=set(); failing=0
    for x in active:
        f=x['faltas'] or 0; limit=x['limite_faltas']; total+=f
        pct=f/limit*100 if limit else None
        state=('critico' if f>=u['faltas.fijo_critico'] else 'preventivo' if f>=u['faltas.fijo_preventivo'] else 'correcto') if not limit else ('critico' if pct>=u['faltas.critico_pct'] else 'preventivo' if pct>=u['faltas.preventivo_pct'] else 'correcto')
        if SEVERITY[state]>SEVERITY[falls_state]:falls_state=state
        if worst is None or ((pct if pct is not None else f),f)>((worst['porcentaje'] if worst['porcentaje'] is not None else worst['faltas']),worst['faltas']):
            worst={'materia':x['materia'],'faltas':f,'limite':limit,'porcentaje':pct}
        if limit and f>=limit:alerts.add('faltas_limite')
        if x['limite_ne'] and x['ne']>=x['limite_ne']:alerts.add('muchos_ne')
        if x['calificacion_codigo']=='SD':alerts.add('sin_derecho')
        if x['calificacion'] is not None and x['calificacion']<u['calificacion.preventivo_min']:failing+=1
        if 'SC' in x.get('actividad_codigos',[]):alerts.add('sin_calificar')
        if 'DA' in x.get('actividad_codigos',[]):alerts.add('deshonestidad')
    if failing:alerts.add('reprobando')
    state=max((grade_state,falls_state),key=lambda s:SEVERITY[s])
    if 'sin_derecho' in alerts:state='critico';reason='sin_derecho'
    elif state=='sin_datos':reason=None
    elif SEVERITY[falls_state]>SEVERITY[grade_state]:reason='faltas'
    else:reason='promedio'
    return {'promedioGeneral':round(avg,2) if avg is not None else None,'faltasTotal':total,'faltasPeorMateria':worst,'estadoPromedio':grade_state,'estadoFaltas':falls_state,'estado':state,'motivoEstado':reason,'materias':len(active),'materiasReprobando':failing,'alertas':sorted(alerts)}

def thresholds(db):
    return {r['clave']:float(r['valor']) for r in db.execute('SELECT clave,valor FROM configuracion')}

def split_name(name):
    words=name.split()
    if len(words)<2:return '',name
    # Dos unidades de apellido; partículas se unen a la siguiente palabra.
    units=[];i=0
    while i<len(words):
        start=i
        while i<len(words)-1 and words[i].lower() in {'de','del','la','las','los','y','san','santa','mc','van','von'}:i+=1
        units.append(' '.join(words[start:i+1]));i+=1
    n=2 if len(units)>2 else 1
    return ' '.join(units[:n]),' '.join(units[n:])

def records_for_period(db,period,lista=None):
    sql='''SELECT i.alumno_id,i.es_baja,i.faltas,i.ne,i.calificacion,i.calificacion_codigo,
    c.limite_faltas,c.limite_ne,m.nombre AS materia,
    (SELECT group_concat(codigo) FROM actividades WHERE inscripcion_id=i.id AND codigo IN ('SC','DA')) AS codigos
    FROM inscripciones i JOIN cursos c ON c.id=i.curso_id JOIN materias m ON m.id=c.materia_id
    WHERE c.periodo_id=?'''
    args=[period]
    if lista is not None:
        sql+=' AND EXISTS (SELECT 1 FROM lista_alumnos l JOIN alumnos a ON a.matricula=l.matricula WHERE l.lista_id=? AND a.id=i.alumno_id)'
        args.append(lista)
    grouped={}
    for r in db.execute(sql,args):
        d=dict(r);d['actividad_codigos']=(d.pop('codigos') or '').split(',')
        grouped.setdefault(d.pop('alumno_id'),[]).append(d)
    return grouped
