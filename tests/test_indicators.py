from sema.indicators import summary,split_name
U={'calificacion.correcto_min':80,'calificacion.preventivo_min':70,'faltas.preventivo_pct':50,'faltas.critico_pct':80,'faltas.fijo_preventivo':3,'faltas.fijo_critico':5}
def item(grade=None,code=None,f=0,limit=5,baja=False):
    return {'calificacion':grade,'calificacion_codigo':code,'calificacion_manual':None,'faltas':f,'limite_faltas':limit,'limite_ne':3,'ne':0,'es_baja':baja,'materia':'Materia','actividad_codigos':[]}

def test_parity_context_07():
    s=summary([item(90,f=2,limit=12),item(70,f=4,limit=5)],U)
    assert s['promedioGeneral']==80 and s['estado']=='critico' and s['motivoEstado']=='faltas'
    s=summary([item(90),item(code='SD')],U)
    assert s['promedioGeneral']==90 and s['estado']=='critico' and 'sin_derecho' in s['alertas']
    assert summary([item(90,baja=True)],U)['estado']=='baja'
    assert summary([item()],U)['promedioGeneral'] is None
    assert summary([item(80,f=5,limit=None)],U)['estadoFaltas']=='critico'
    assert split_name('De la O Murillo María José')==('De la O Murillo','María José')

def test_compound_name():
    assert split_name('Torres Montes de Oca Luis')==('Torres Montes de Oca','Luis')
