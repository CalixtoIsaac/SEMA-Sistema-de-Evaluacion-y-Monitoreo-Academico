from io import BytesIO
from openpyxl import Workbook
from sema.excel import parse,FormatError

def make(rows):
    w=Workbook();s=w.active;s.title='Salida'
    for row in rows:s.append(row)
    b=BytesIO();w.save(b);return b.getvalue()

def test_reader():
    head=['Año - periodo','Matricula','Nombre del alumno','Nombre de la materia','Clave de materia','CRN','Faltas del alumno','A1','Ponderado','Modalidad','Modalidad','Deuda del alumno','Último usuario que modifico']
    r=['202660','T00000001','Pérez López Ana','Química','Q1','1','4','NE','SD','Semestral','Teórica','12345','secreto']
    out=parse(make([head,r,r[:1]+['T00000002']+r[2:]]))
    assert out['total']==2 and len(out['rows'])==2
    assert out['rows'][0]['modalidad_periodo']=='Semestral'
    assert out['rows'][0]['modalidad_clase']=='Teórica'
    assert out['rows'][0]['ponderado']=={'codigo':'SD'}
    assert 'Deuda del alumno' not in out['columns']
    assert 'secreto' not in str(out)
    assert '12345' not in str(out)

def test_missing():
    try:parse(make([['Matrícula'],['T00000001']]))
    except FormatError as e:assert any('Ponderado' in x for x in e.missing)
    else:assert False

def test_header_later_and_repeated_normalized():
    head=['Año - periodo','Matrícula','Nombre del alumno','Nombre de la materia','Clave de materia','CRN','Faltas del alumno','A1','Ponderado','Matricula']
    row=['202660','T00000001','Ruiz Soto Eva','Física','F1','1','1','90','80','T99999999']
    out=parse(make([['Reporte de prueba'],head,row]))
    assert len(out['rows'])==1
    assert out['rows'][0]['matricula']=='T00000001'
    assert out['columns'][-1]=='Matricula (2)'
