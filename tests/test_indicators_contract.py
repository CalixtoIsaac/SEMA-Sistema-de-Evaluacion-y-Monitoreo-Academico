"""Casos de paridad con context/07 §11 e issue #13, con alumnos ficticios."""
from sema.indicators import grade_state,fall_state,manual_grade,summary,split_name
U={'calificacion.correcto_min':80,'calificacion.preventivo_min':70,'faltas.preventivo_pct':50,'faltas.critico_pct':80,'faltas.fijo_preventivo':3,'faltas.fijo_critico':5}

def item(grade=None,code=None,falls=0,limit=5,baja=False):
    return {'calificacion':grade,'calificacion_codigo':code,'calificacion_manual':None,'faltas':falls,'limite_faltas':limit,'limite_ne':3,'ne':0,'es_baja':baja,'materia':'Materia','actividad_codigos':[]}

def test_threshold_boundaries():
    assert [grade_state(v,U) for v in (80,79.9,70,69.99)]==['correcto','preventivo','preventivo','critico']
    assert [fall_state(f,5,U) for f in (2,3,4)]==['correcto','preventivo','critico']
    assert [fall_state(f,12,U) for f in (5,6,9,10)]==['correcto','preventivo','preventivo','critico']
    assert fall_state(1,2,U)=='preventivo'
    assert [fall_state(f,None,U) for f in (2,3,5)]==['correcto','preventivo','critico']

def test_official_grade_and_manual_calculation():
    s=summary([item(90,falls=2,limit=12),item(70,falls=4,limit=5)],U)
    assert s['promedioGeneral']==80 and s['estado']=='critico' and s['motivoEstado']=='faltas'
    assert manual_grade([{'valor':100},{'codigo':'SC'},{'valor':80},{'codigo':'NE'}])==45
    assert manual_grade([{'codigo':'SD'}]) is None
    s=summary([item(90),item(code='SD')],U)
    assert s['promedioGeneral']==90 and s['estado']=='critico' and 'sin_derecho' in s['alertas']

def test_exclusions_and_alerts():
    assert summary([item(90,baja=True)],U)['estado']=='baja'
    assert summary([item()],U)['estado']=='sin_datos'
    v=item(90);v['actividad_codigos']=['DA','SC'];v['ne']=3
    alerts=summary([v],U)['alertas']
    assert 'deshonestidad' in alerts and 'sin_calificar' in alerts and 'muchos_ne' in alerts
    assert summary([item(80,falls=5,limit=5)],U)['materiasCriticas']==1

def test_names():
    assert split_name('De la O Murillo María José')==('De la O Murillo','María José')
    assert split_name('Torres Montes de Oca Luis')==('Torres Montes de Oca','Luis')
    assert split_name('Rubín de Celis Soto Ana')==('Rubín de Celis Soto','Ana')
