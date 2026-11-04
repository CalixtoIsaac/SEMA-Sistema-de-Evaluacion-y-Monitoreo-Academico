"""Lector puro de monitoreo. Nunca conserva columnas financieras ni auditoría."""
from datetime import date, datetime
from io import BytesIO
import re
import unicodedata
from openpyxl import load_workbook

FORBIDDEN = {'deuda del alumno', 'ultimo usuario que modifico'}
REQUIRED = ['Año - periodo','Matrícula','Nombre del alumno','Nombre de la materia',
            'Clave de materia','CRN','Faltas del alumno','A1','Ponderado']
FIELDS = {'Campus':'campus','Año - periodo':'periodo','Nombre del periodo':'periodo_nombre',
 'Parte periodo':'parte','Matrícula':'matricula','Nombre del alumno':'nombre',
 'Nombre de la materia':'materia','Nivel':'nivel','Clave de materia':'materia_clave',
 'CRN':'crn','# Grupo':'grupo','Estatus':'estatus','Descripción estatus':'estatus_descripcion',
 'Nómina':'nomina','Nombre del profesor':'profesor','Límite de faltas':'limite_faltas',
 'Faltas del alumno':'faltas','Límite de NE':'limite_ne','NE alumno':'ne',
 'Inicio':'inicio','Fin':'fin','Ponderado':'ponderado',
 'Clave plan de estudios':'plan_clave','Descripción plan de estudios':'plan_descripcion',
 'Campus de admisión':'campus_admision','Última actualización':'actualizado_escuela',
 'Última actividad actualizada':'ultima_actividad'}
CODES={'NE','SC','DA','SD'}

class FormatError(Exception):
    def __init__(self, missing):
        self.missing=missing
        super().__init__('Formato de monitoreo inválido')

def key(s):
    s=unicodedata.normalize('NFD',str(s or ''))
    return ' '.join(''.join(c for c in s if unicodedata.category(c)!='Mn').lower().split())

def clean(v):
    if v is None: return None
    if isinstance(v,(datetime,date)): return v.strftime('%Y-%m-%d')
    s=' '.join(str(v).split())
    return s or None

def number(v, warnings, row, column, integer=False):
    if v is None: return None
    try:
        n=float(str(v).replace(',','.'))
        if n<0 or n>100 or (integer and not n.is_integer()): raise ValueError
        return int(n) if integer else n
    except ValueError:
        warnings.append({'fila':row,'tipo':'rango','mensaje':f'Valor inválido en {column}'})
        return None

def grade(v, warnings, row, column):
    if v is None: return None
    s=str(v).upper()
    if s in CODES: return {'codigo':s}
    try:
        n=float(s.replace(',','.'))
        if 0<=n<=100: return {'valor':n}
        warnings.append({'fila':row,'tipo':'rango','mensaje':f'Calificación fuera de rango en {column}'})
        return None
    except ValueError:
        warnings.append({'fila':row,'tipo':'codigo','mensaje':f'Código desconocido en {column}'})
        return {'codigo':s}

def parse(data:bytes):
    try:
        wb=load_workbook(BytesIO(data),read_only=True,data_only=True)
    except Exception as e:
        raise FormatError(['No es un archivo XLSX legible']) from e
    selected=None
    missing=REQUIRED
    for ws in wb.worksheets:
        it=ws.iter_rows(values_only=True)
        for header_row,header in enumerate(it,1):
            if header_row>10: break
            names=[clean(x) or '' for x in header]
            keys=[key(x) for x in names]
            absent=[x for x in REQUIRED if key(x) not in keys]
            if len(absent)<len(missing): missing=absent
            if not absent:
                selected=(ws,names,keys,it,header_row)
                break
        if selected: break
    if not selected:
        wb.close()
        raise FormatError([f'Falta la columna «{x}»' for x in missing])
    ws,names,keys,it,header_row=selected
    allowed=[i for i,k in enumerate(keys) if k and k not in FORBIDDEN]
    columns=[]
    seen={}
    for i in allowed:
        label=names[i]
        normalized=keys[i]
        seen[normalized]=seen.get(normalized,0)+1
        columns.append(label if seen[normalized]==1 else f'{label} ({seen[normalized]})')
    indices={}
    for i,k in enumerate(names):
        if key(k) not in FORBIDDEN: indices.setdefault(key(k),i)
    modalities=[i for i,k in enumerate(keys) if k=='modalidad']
    warnings=[]; rows=[]; previews=[]; duplicates={}; total=0; omitted=0
    for rownum,cells in enumerate(it,header_row+1):
        if not any(clean(v) for i,v in enumerate(cells) if i in allowed): continue
        total+=1
        def val(label):
            i=indices.get(key(label))
            return clean(cells[i]) if i is not None and i<len(cells) else None
        record={field:val(label) for label,field in FIELDS.items()}
        record['matricula']=(record['matricula'] or '').upper()
        record['modalidad_periodo']=clean(cells[modalities[0]]) if modalities else None
        record['modalidad_clase']=clean(cells[modalities[1]]) if len(modalities)>1 else None
        record['profesor']=clean(record['profesor'])
        record['estatus_descripcion']=(record['estatus_descripcion'] or '').replace('*','').strip()
        record['es_baja']=record['estatus']=='BT'
        record['faltas']=number(record['faltas'],warnings,rownum,'Faltas del alumno',True) or 0
        record['ne']=number(record['ne'],warnings,rownum,'NE alumno',True) or 0
        for k in ('limite_faltas','limite_ne','ultima_actividad'):
            record[k]=number(record[k],warnings,rownum,k,True)
        d=record['actualizado_escuela']
        if d:
            try: record['actualizado_escuela']=datetime.strptime(d,'%d-%m-%Y').date().isoformat()
            except ValueError: pass
        record['ponderado']=grade(record['ponderado'],warnings,rownum,'Ponderado')
        acts={}
        for n in range(1,51):
            g=grade(val(f'A{n}'),warnings,rownum,f'A{n}')
            if g is not None: acts[str(n)]=g
        record['actividades']=acts
        record['dias']=','.join(code for label,code in [('Dom','D'),('Lun','L'),('Mar','M'),('Mier','Mi'),('Jue','J'),('Vier','V'),('Sáb','S')] if (val(label) or '').upper()=='SI')
        if not record['matricula'] or not record['materia_clave'] or not record['materia'] or not record['crn'] or not record['periodo']:
            omitted+=1; warnings.append({'fila':rownum,'tipo':'omitida','mensaje':'Fila sin identificador obligatorio'}); continue
        if not re.fullmatch(r'[A-Z]\d{8}',record['matricula']):
            warnings.append({'fila':rownum,'tipo':'matricula','mensaje':'Matrícula atípica'})
        identity=(record['matricula'],record['crn'])
        preview={columns[j]:clean(cells[i]) if i<len(cells) else None for j,i in enumerate(allowed)}
        if identity in duplicates:
            pos=duplicates[identity]
            rows[pos]=record; previews[pos]=preview
            warnings.append({'fila':rownum,'tipo':'duplicado','mensaje':'Matrícula y CRN repetidos; se conserva la última fila'})
        else:
            duplicates[identity]=len(rows); rows.append(record); previews.append(preview)
    sheet=ws.title
    wb.close()
    return {'rows':rows,'preview':previews,'columns':columns,'warnings':warnings,
            'total':total,'omitted':omitted,'sheet':sheet,'duplicates':total-omitted-len(rows)}
