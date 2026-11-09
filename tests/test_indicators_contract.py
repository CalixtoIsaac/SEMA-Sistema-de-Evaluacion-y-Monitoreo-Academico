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

# ---------- #13 · casos de context/07 §11 que faltaban y decisiones ----------

def test_caso_11_celda_con_espacios_no_se_guarda():
    from sema.excel import clean, grade
    avisos = []
    assert clean('   ') is None and grade(clean('   '), avisos, 2, 'A1') is None and avisos == []
    assert grade('95,5', avisos, 2, 'A1') == {'valor': 95.5}
    assert grade('101', avisos, 2, 'A1') is None and avisos[-1]['tipo'] == 'rango'
    assert grade('XX', avisos, 2, 'A1') == {'codigo': 'XX'} and avisos[-1]['tipo'] == 'codigo'

def test_caso_12_orden_por_promedio_y_faltas():
    from sema.exportar import ordenar
    a = lambda nombre, prom, faltas: {'nombreMostrar': nombre, 'matricula': nombre, 'promedioGeneral': prom, 'faltasTotal': faltas, 'estado': 'preventivo'}
    alumnos = [a('A', 70, 3), a('B', 70, 5), a('C', 65, 0), a('Ana', 70, 5), a('Z', None, 9)]
    assert [x['nombreMostrar'] for x in ordenar(alumnos, True, True)] == ['C', 'Ana', 'B', 'A', 'Z']
    # Empates con el valor redondeado a 1 decimal (lo que ve el usuario).
    assert [x['nombreMostrar'] for x in ordenar([a('B', 70.04, 0), a('A', 69.96, 0)], True, False)] == ['A', 'B']

def test_caso_13_busqueda_por_palabras_sin_acentos():
    from sema.exportar import coincide
    al = {'nombreMostrar': 'Mariana Pérez López', 'nombre': 'Pérez López Mariana', 'matricula': 'T09000001'}
    assert coincide(al, ['perez', 'mariana']) and coincide(al, ['lopez']) and coincide(al, ['t0900'])
    assert not coincide(al, ['perez', 'ana', 'ruiz'])

def test_casos_15_a_17_tendencia():
    from sema.students import trend
    assert trend({'estado': 'preventivo', 'promedio': 87}, {'estado': 'correcto', 'promedio': 85}, 2) == 'empeora'
    assert trend({'estado': 'preventivo', 'promedio': 77.5}, {'estado': 'preventivo', 'promedio': 75}, 2) == 'mejora'
    assert trend({'estado': 'preventivo', 'promedio': 76}, {'estado': 'preventivo', 'promedio': 75}, 2) == 'estable'
    # El estado manda sobre el promedio: sube 3 puntos pero cae a Crítico → Empeora.
    assert trend({'estado': 'critico', 'promedio': 88}, {'estado': 'correcto', 'promedio': 85}, 2) == 'empeora'
    # Mejora de estado aunque el promedio no cambie.
    assert trend({'estado': 'correcto', 'promedio': 80}, {'estado': 'preventivo', 'promedio': 80}, 2) == 'mejora'

def test_umbrales_configurados_cambian_los_estados():
    u = {**U, 'calificacion.correcto_min': 90, 'calificacion.preventivo_min': 85, 'faltas.preventivo_pct': 20, 'faltas.critico_pct': 40}
    assert grade_state(88, u) == 'preventivo' and grade_state(84.9, u) == 'critico'
    assert fall_state(1, 5, u) == 'preventivo' and fall_state(2, 5, u) == 'critico'

def test_promedio_general_excluye_bajas_y_sd_pero_cuenta_manuales():
    manual = item(None); manual['calificacion_manual'] = 60
    s = summary([item(90), item(95, baja=True), item(code='SD'), manual], U)
    assert s['promedioGeneral'] == 75 and s['materias'] == 3 and s['materiasReprobando'] == 1

def test_decision_sin_calificaciones_y_sin_faltas_es_sin_datos():
    """Caso ambiguo de context/07 §4.3 (ver la nota «Decisión #13» en ese documento):
    un alumno sin calificaciones numéricas y con 0 faltas queda en Sin datos, aunque
    sus materias tengan límite. Con al menos una falta, el estado es el de faltas."""
    assert summary([item(None, falls=0, limit=5)], U)['estado'] == 'sin_datos'
    assert summary([item(None, falls=0, limit=5)], U)['motivoEstado'] is None
    assert summary([item(None, falls=1, limit=5)], U)['estado'] == 'correcto'
    assert summary([item(None, falls=3, limit=5)], U)['estado'] == 'preventivo'
    assert summary([item(None, code='SD')], U)['estado'] == 'critico'

def test_apellidos_compuestos_y_particulas():
    casos = {
        'Ponce de León Ruiz Ana': ('Ponce de León Ruiz', 'Ana'),
        'Gutiérrez de Velasco Soto Luis': ('Gutiérrez de Velasco Soto', 'Luis'),
        'Ruiz de Velasco Cruz Eva': ('Ruiz de Velasco Cruz', 'Eva'),
        'Del Ángel Cruz Pedro': ('Del Ángel Cruz', 'Pedro'),
        'San Martín Ríos Ana Sofía': ('San Martín Ríos', 'Ana Sofía'),
        'Pérez López María de los Ángeles': ('Pérez López', 'María de los Ángeles'),
        'RUIZ SOTO DANIEL ALEJANDRO': ('RUIZ SOTO', 'DANIEL ALEJANDRO'),
        '  Pérez   López   Mariana  ': ('Pérez López', 'Mariana'),
        'Pérez Ana': ('Pérez', 'Ana'),
        'Ana': ('', 'Ana'),
    }
    for original, esperado in casos.items():
        assert split_name(original) == esperado, original
