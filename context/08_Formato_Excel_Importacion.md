# 08 · Formato de los Excel e importación

## 1. Excel de monitoreo (archivo de la escuela)

Archivo de referencia: `Monitoreo_de_alumnos_2.xlsx` (**no se sube al repositorio**, contiene datos reales).

| Característica | Valor en el archivo de ejemplo |
|---|---|
| Hoja | `Salida` (se usa la **primera hoja** que tenga los encabezados obligatorios) |
| Encabezados | fila 1 · 94 columnas |
| Filas de datos | 3,664 (una por **alumno × materia**) |
| Alumnos distintos | 490 (cada uno con 5, 6, 7 o 10 materias) |
| Materias | 43 nombres / 46 claves · 141 CRN · 44 profesores |
| Periodo | `202660` · "2026 Ago - Dic" (uno solo) |
| Planes | `BAG_SR`, `BAI_S26` (Bachillerato General), `BAB_SR` (Bachillerato General Bilingüe) |
| Tipo de celdas | **todo es texto**, incluidos números y fechas (`DD-MM-YYYY`) |
| Tamaño | 1.2 MB |

> El Excel **no trae el semestre** del alumno. `# Grupo` es el grupo de la *clase* (un alumno aparece en 2 o 3 grupos distintos), no su salón. Por eso existe el Excel de lista.

### 1.1 Diccionario de columnas

**Obligatoria** = si falta, se rechaza el archivo. **Uso** = dónde se guarda (`tabla.columna`) o si se ignora.

| # | Columna | Ejemplo | Obligatoria | Uso |
|---|---|---|---|---|
| 1 | Campus | Veracruz | | `periodos.campus` |
| 2 | Año - periodo | 202660 | ✔ | `periodos.clave` |
| 3 | Nombre del periodo | 2026 Ago - Dic | | `periodos.nombre` |
| 4 | Parte periodo | 1 | | `periodos.parte` |
| 5 | **Modalidad** (1.ª) | Semestral | | `periodos.modalidad` |
| 6 | Matrícula | T09000001 | ✔ | `alumnos.matricula` |
| 7 | Nombre del alumno | Pérez López Mariana | ✔ | `alumnos.nombre` |
| 8 | Nombre de la materia | Cálculo diferencial | ✔ | `materias.nombre` |
| 9 | Nivel | Preparatoria | | `alumnos.nivel` |
| 10 | Clave de materia | BSMA3001 | ✔ | `materias.clave` |
| 11 | CRN | 16086 | ✔ | `cursos.crn` |
| 12 | # Grupo | 603 | | `cursos.grupo` |
| 13 | **Modalidad** (2.ª) | Teórica / Bachillerato Intercultural | | `cursos.modalidad_clase` |
| 14 | Estatus | RW · RE · RG · BT | | `inscripciones.estatus` (`BT` → `es_baja = 1`) |
| 15 | Descripción estatus | \*\*Inscrito por Web\*\* | | `inscripciones.estatus_descripcion` (quitar `*`) |
| 16 | Nómina | L09000001 | | `profesores.nomina` |
| 17 | Nombre del profesor | Hernández Mora  Luis␠ | | `profesores.nombre` (recortar espacios) |
| 18 | Límite de faltas | 12 | | `cursos.limite_faltas` |
| 19 | Faltas del alumno | 0 | ✔ | `inscripciones.faltas` |
| 20 | Límite de NE | 3 | | `cursos.limite_ne` |
| 21 | NE alumno | 0 | | `inscripciones.ne` |
| 22–28 | Dom, Lun, Mar, Mier, Jue, Vier, Sáb | SI / vacío | | `cursos.dias` (`"L,M,Mi,J,V"`) |
| 29–30 | Inicio, Fin | 10:30 · 11:29 | | `cursos.hora_inicio`, `cursos.hora_fin` |
| 31–32 | Edificio, Salón | (vacías) | | se ignoran |
| 33–82 | A1 … A50 | 70, 91, NE, "   " | (al menos A1) | `actividades` (solo celdas con contenido; en el ejemplo se usan A1–A10) |
| 83 | Ponderado | 69 / SD | ✔ | `inscripciones.calificacion` o `calificacion_codigo` |
| 84 | Calificación final actual | (vacía) | | se ignora por ahora (si algún día trae valor, sustituye al ponderado — decidir) |
| 85 | Motivo cf | (vacía) | | se ignora |
| 86 | Clave plan de estudios | BAG_SR | | `alumnos.plan_clave` |
| 87 | Descripción plan de estudios | Bachillerato General | | `alumnos.plan_descripcion` |
| 88 | Campus de admisión | Veracruz | | `alumnos.campus_admision` |
| 89 | Contar SC | 0 / 1 | | se ignora |
| 90 | Última actualización | 06-10-2026 | | `inscripciones.actualizado_escuela` (→ `2026-10-06`) |
| 91 | Último usuario que modifico | L09000009 | | **se ignora** |
| 92 | Última actividad actualizada | 14 | | `inscripciones.ultima_actividad` |
| 93 | Agenda asignada al CRN | 16086 | | se ignora (igual al CRN) |
| 94 | Deuda del alumno | 14371.65 | | **NO se importa** (dato financiero, D-14) |

### 1.2 Detalles que el lector debe manejar

1. **Columna `Modalidad` repetida** (posiciones 5 y 13). Mapear por **posición de aparición**: la 1.ª es del periodo, la 2.ª de la clase. Nunca construir un objeto `{ encabezado: valor }` sin resolver duplicados (la segunda pisaría a la primera).
2. **Encabezados normalizados** para buscarlos: minúsculas, sin acentos, sin espacios dobles (`"Matrícula"` → `"matricula"`, `"# Grupo"` → `"# grupo"`). Así no falla si el archivo trae "Matricula" sin acento.
3. **Celdas con solo espacios** (`"   "`, 5,532 en el ejemplo) = vacías.
4. **Códigos** en actividades y ponderado: `NE` No entregó (167), `SD` Sin derecho (4, dos en Ponderado), `SC` Sin calificar (5), `DA` Deshonestidad académica (1). Significado y valor en `07` §1 (D-12).
5. **Bajas (`BT`)**: 30 filas de 3 alumnos; dos de ellos sin ponderado. Se importan marcadas como baja.
6. **Fechas** como texto `DD-MM-YYYY`; si `exceljs` entrega un `Date`, convertir a `YYYY-MM-DD` local.
7. **Números**: si `exceljs` entrega número, usarlo; si entrega texto, `parsearCalificacion()`.
8. Filas totalmente vacías al final se ignoran. Fila sin matrícula o sin clave de materia → se omite con advertencia.
9. Matrícula con formato distinto a `^[A-Z]\d{8}$` → se importa con advertencia.
10. Fila repetida (misma matrícula + CRN) → gana la última y se reporta advertencia.

### 1.3 Proceso de importación

```
1. POST /api/importaciones/monitoreo  (archivo)
   ├─ multer: solo .xlsx, máx. 15 MB, en memoria
   ├─ excel-monitoreo.js: leer → validar encabezados → normalizar filas
   ├─ guardar importación en estado "previa" (datos_previa = JSON)
   └─ responder resumen + 20 filas de muestra + advertencias
2. El usuario revisa la previsualización y elige el modo (fusionar / reemplazar)
3. POST /api/importaciones/:id/confirmar
   └─ db.transaction: upsert periodo, materias, profesores, cursos, alumnos,
      (apellidos/nombres con separarNombre(), respetando correcciones manuales),
      inscripciones (+ actividades) → [reemplazar: borrar faltantes] → cortes_alumno
      → estado "aplicada" → borrar datos_previa
4. Frontend: toast "Datos cargados correctamente" + botón "Ver alumnos"
```

## 2. Excel de lista (seguimiento)

Archivo que prepara el profesor con los alumnos que le interesan (por ejemplo, los de 6.º semestre).

### 2.1 Formato real (archivo de ejemplo del cliente, D-16)

Archivo de referencia: `Matrículas.xlsx` (**no se sube al repositorio**, tiene datos reales).

| Característica | Valor |
|---|---|
| Hoja | `Todos` (única hoja) |
| Encabezados | fila 1: **`Matrícula`** (columna A) y **`Nombre`** (columna B) |
| Filas de datos | 173 · sin filas vacías · sin matrículas repetidas |
| Matrículas | todas con formato `T` + 8 dígitos, como texto |
| Nombres | "Apellidos Nombres", igual que el Excel de monitoreo; **117 de 173 traen espacios al final** |
| Columnas extra | el archivo declara 5 columnas, pero C–E están vacías (se ignoran) |
| Cruce con el Excel de monitoreo | **173 de 173 encontradas**; 1 nombre distinto (el Excel de monitoreo trae un segundo nombre que la lista no tiene) |

Ejemplo (datos ficticios):

| Matrícula | Nombre |
|---|---|
| T09000001 | Pérez López Mariana␠ |
| T09000002 | Ruiz Soto Daniel |

### 2.2 Reglas de lectura

Reglas de lectura:

1. Se usa la primera hoja (en el ejemplo, `Todos`). El encabezado puede estar en cualquiera de las **primeras 10 filas**: es la primera fila que tenga una celda que contenga `matr` y otra que contenga `nombre` (normalizado).
2. Se aceptan nombres de columna como "Matrícula", "Matricula", "MATRÍCULA", "No. de matrícula", "Nombre", "Nombre del alumno", "Nombre completo".
3. Si no hay columna de nombre pero sí de matrícula, se acepta (el nombre se toma de SEMA).
4. Matrículas: `trim()` + mayúsculas. Nombres: `trim()` y espacios dobles → uno. Duplicadas → se cuentan una vez.
   Columnas sin encabezado ni datos se ignoran.
5. Resultado de la previsualización: **total**, **encontradas** en SEMA, **no encontradas** (tabla con matrícula y nombre del Excel) y **nombres que no coinciden** (misma matrícula, nombre distinto → solo advertencia; **manda el nombre del Excel de monitoreo**). La comparación de nombres ignora mayúsculas, acentos y espacios.
6. Se guardan **todas** las matrículas (incluidas las no encontradas) en `lista_alumnos`.
7. Nombre sugerido para la lista: el nombre del archivo sin extensión (ej. "Matrículas"); el usuario lo puede cambiar (ej. "6.º semestre").

## 3. Archivo de prueba anonimizado (T-06)

`scripts/anonimizar-excel.js <entrada.xlsx> <salida.xlsx>` (se ejecuta en local con el Excel real, que **no** se sube):

- Toma ~30 alumnos al azar con todas sus filas, más los casos raros: al menos una fila `BT`, una con `SD` en Ponderado, una con `NE`, una con `SC`, una con `DA`, y alumnos en los tres estados.
- Reemplaza matrículas por `T9xxxxxxx`, nombres de alumnos y profesores por nombres ficticios, nóminas por `L9xxxxxxx` y **vacía** "Deuda del alumno".
- Conserva encabezados, orden de columnas, la `Modalidad` duplicada y el formato de texto.
- Genera también `lista-muestra.xlsx` con el **mismo formato del cliente** (hoja `Todos`, columnas `Matrícula` y `Nombre`, algunos nombres con espacio al final, columnas vacías extra) con 10 de esas matrículas + 2 que no existan + 1 con nombre distinto.
