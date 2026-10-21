# 07 · Reglas de negocio e indicadores

Todas estas reglas se implementan **una sola vez** en `lib/indicadores.js` (funciones puras) y se prueban en `test/indicadores.test.js`. Los umbrales se leen de la tabla `configuracion` (valores por defecto abajo) y se pueden cambiar en **Perfil → Umbrales** (M-08). Las referencias **D-xx** son decisiones de `00_Indice_y_Decisiones.md` §4.

---

## 1. Lectura de celdas del Excel

Todas las celdas del Excel de la escuela llegan como **texto**. Se interpretan con `parsearCalificacion(celda)`:

| Contenido de la celda | Resultado | Significado (D-12) | Valor en cálculos propios |
|---|---|---|---|
| vacía o solo espacios (`""`, `"   "`) | `{ vacio: true }` → no se guarda | Actividad aún no evaluada | no cuenta |
| número 0–100 (acepta `,` o `.` decimal) | `{ valor: 95 }` | Calificación | su valor |
| `NE` | `{ codigo: 'NE' }` | **No entregó** | **0** |
| `SC` | `{ codigo: 'SC' }` | **Sin calificar**: pasó la fecha y el profesor no subió la calificación | **0** |
| `DA` | `{ codigo: 'DA' }` | **Deshonestidad académica** | **0** |
| `SD` | `{ codigo: 'SD' }` | **Sin derecho** (también aparece en `Ponderado`) | materia en Crítico (§3.1) |
| cualquier otra cosa | `{ codigo: <texto> }` + **advertencia** en la previsualización | Desconocido | no cuenta |
| número fuera de 0–100 | se omite la celda + **advertencia** | — | — |

> "Valor en cálculos propios" solo se usa cuando SEMA calcula un promedio (altas manuales o materias sin ponderado, §3.1). Cuando el Excel trae `Ponderado`, ese valor ya es el oficial: en los datos reales los ponderados con `SC` son consistentes con contar el `SC` como 0 (ej.: actividades 100 ×6, SC, 80 → ponderado 68).

## 2. ¿Qué materias cuentan?

- Una inscripción con estatus **`BT` (Baja total)** se marca `es_baja = 1` y **no cuenta** para promedios, faltas ni gráficas (D-13).
- Si **todas** las inscripciones de un alumno son baja, su estado es **Baja** (gris).
- Los demás estatus (`RW` Inscrito por web, `RE` Inscripción administrativa, `RG` Cambio de grupo) cuentan normal.

## 3. Cálculos

### 3.1 Calificación de una materia
1. Si `Ponderado` es número → **esa es la calificación** (D-02). *No* se recalcula con las actividades.
2. Si `Ponderado` es `SD` → la materia no tiene número; se muestra "SD" y la materia queda en **Crítico**.
3. Si no hay ponderado (altas **manuales** sin calificación) → promedio simple de las actividades con valor, contando **`NE`, `SC` y `DA` como 0**. Las celdas vacías no cuentan.
4. Se redondea a **1 decimal** solo para mostrar; los estados se calculan con el valor sin redondear.

> Ejemplo real (primera fila del Excel): actividades 70, 91, 99, 100, 100, 38 → promedio simple 83, pero **Ponderado = 69** → la materia es **Crítico**. Por eso se usa el ponderado.

### 3.2 Promedio general del alumno
`promedioGeneral = promedio simple de las calificaciones numéricas de sus materias vigentes (no baja)`.
- Las materias `SD` **no entran** al promedio, pero sí al estado de faltas/calificación de la materia y a las alertas.
- Sin ninguna calificación numérica → `null` y estado **Sin datos** (gris).

### 3.3 Faltas
- `faltasMateria` = columna `Faltas del alumno` de esa inscripción.
- `limiteFaltas` = columna `Límite de faltas` de esa materia (en el Excel actual: 2, 5, 7, 10 o 12).
- `porcentajeFaltas = faltasMateria / limiteFaltas` (si `limiteFaltas` es 0 o vacío → `null`).
- `faltasTotal` = suma de faltas de las materias vigentes. Se muestra en la tabla y se usa para **ordenar** (§6), pero **no** decide el color (D-09).
- `faltasMaxPorcentaje` = el mayor `porcentajeFaltas` entre sus materias.

## 4. Estados (semáforo)

### 4.1 Por calificación — `estadoCalificacion(valor)` (D-08)
| Estado | Regla | Clave de configuración |
|---|---|---|
| 🟢 **Correcto** | `valor ≥ 80` | `calificacion.correcto_min = 80` |
| 🟡 **Preventivo** | `70 ≤ valor < 80` | `calificacion.preventivo_min = 70` |
| 🔴 **Crítico** | `valor < 70` | — |

### 4.2 Por faltas — `estadoFaltas(faltas, limite)` (D-09, D-10)

Se aplica **a cada materia** con el **porcentaje de su propio límite**:

| Estado | Regla | Clave de configuración |
|---|---|---|
| 🟢 **Correcto** | `porcentaje < 50 %` | `faltas.preventivo_pct = 50` |
| 🟡 **Preventivo** | `50 % ≤ porcentaje < 80 %` | `faltas.critico_pct = 80` |
| 🔴 **Crítico** | `porcentaje ≥ 80 %` | — |

**Cómo queda con los límites reales del Excel**

| Límite de la materia | 🟢 Correcto | 🟡 Preventivo | 🔴 Crítico |
|---|---|---|---|
| 2 | 0 | 1 | 2 o más |
| 5 | 0–2 | 3 | 4 o más |
| 7 | 0–3 | 4–5 | 6 o más |
| 10 | 0–4 | 5–7 | 8 o más |
| 12 | 0–5 | 6–9 | 10 o más |

- **Materia sin límite** (`limiteFaltas` vacío o 0, solo en altas manuales): regla fija del brief → 0–2 Correcto · 3–4 Preventivo · 5+ Crítico (`faltas.fijo_preventivo = 3`, `faltas.fijo_critico = 5`).
- **Estado de faltas del alumno** = el **peor** estado de faltas entre sus materias vigentes.
- Con el Excel actual (487 alumnos con calificación): **338 Correcto · 119 Preventivo · 30 Crítico** por faltas.

```js
// Referencia (lib/indicadores.js)
function estadoFaltas(faltas, limite, u) {
  if (!limite) {
    return faltas >= u.fijoCritico ? 'critico' : faltas >= u.fijoPreventivo ? 'preventivo' : 'correcto';
  }
  const pct = (faltas / limite) * 100;
  return pct >= u.criticoPct ? 'critico' : pct >= u.preventivoPct ? 'preventivo' : 'correcto';
}
```

### 4.3 Estado general del alumno (columna "Estado") (D-11)
`estado = peor(estadoCalificacion(promedioGeneral), estadoFaltasAlumno)`

- Orden de gravedad: `critico (3) > preventivo (2) > correcto (1) > sin_datos (0)`; `baja` va aparte.
- Si `promedioGeneral` es `null`, el estado general es el de faltas; si tampoco hay faltas que evaluar, **Sin datos**.
- Una materia `SD` lleva al alumno a **Crítico** aunque su promedio sea bueno (la materia no tiene derecho).
- Con el Excel actual: **319 Correcto · 134 Preventivo · 34 Crítico** (solo por promedio serían 434 / 43 / 10: las faltas son la causa principal del riesgo).
- En el detalle del alumno se muestra **el motivo** del estado: "Crítico por faltas en Inglés Nivel 4 (4 / 5)" o "Crítico por promedio (68.9)".

### 4.4 Presentación
| Estado | Clave API | Etiqueta | Color (variables de `theme.css`) | Ícono |
|---|---|---|---|---|
| Correcto | `correcto` | Correcto | `--success-bg` / `--success-text` | ✓ check |
| Preventivo | `preventivo` | Preventivo | `--warning-bg` / `--warning-text` | ⚠ alerta |
| Crítico | `critico` | Crítico | `--danger-bg` / `--danger-text` | ✕ / ! |
| Sin datos | `sin_datos` | Sin datos | `--muted` / `--muted-foreground` | — |
| Baja | `baja` | Baja | `--muted` / `--muted-foreground` | ⌀ |

## 5. Alertas (M-06)

Se muestran como insignias en el encabezado del detalle y como ícono ⚠ en la tabla (tooltip con la lista).

| Clave | Alerta | Condición |
|---|---|---|
| `sin_derecho` | Materia sin derecho | alguna materia con `Ponderado = SD` |
| `faltas_limite` | Faltas al límite | `faltasMateria ≥ limiteFaltas` en alguna materia |
| `muchos_ne` | Muchos NE | `NE alumno ≥ Límite de NE` en alguna materia |
| `sin_calificar` | Actividades sin calificar | alguna actividad `SC` (es responsabilidad del profesor; se muestra en gris informativo) |
| `deshonestidad` | Deshonestidad académica | alguna actividad `DA` (insignia roja) |
| `reprobando` | N materias reprobando | número de materias con calificación < `calificacion.preventivo_min` |
| `empeora` | Bajó desde la última carga | tendencia `empeora` (§9) |

## 6. Ordenamiento de la tabla de alumnos — `ordenarAlumnos(lista, { promedio, faltas })`

| Casillas marcadas | Criterio 1 | Criterio 2 | Criterio 3 |
|---|---|---|---|
| Ninguna | nombre A→Z | matrícula | — |
| `PROMEDIO` | promedio **menor → mayor** | nombre A→Z | — |
| `FALTAS` | faltasTotal **mayor → menor** | nombre A→Z | — |
| `PROMEDIO` + `FALTAS` | promedio **menor → mayor** | faltasTotal **mayor → menor** | nombre A→Z |

- Los alumnos con promedio `null` (Sin datos) y los de Baja van **al final**.
- Los empates de promedio se comparan con el valor **redondeado a 1 decimal** (lo que ve el usuario).
- "Nombre A→Z" usa el nombre **tal como se muestra** según la preferencia de formato (§8), con `localeCompare(b, 'es', { sensitivity: 'base' })`.
- Los chips de estado (M-02) **filtran** antes de ordenar.

```js
// Referencia (lib/indicadores.js y public/js/orden-busqueda.js)
function ordenarAlumnos(alumnos, { promedio = false, faltas = false } = {}) {
  const r1 = (n) => (n == null ? null : Math.round(n * 10) / 10);
  const alFinal = (a) => (a.estado === 'baja' || a.promedioGeneral == null ? 1 : 0);
  const porNombre = (a, b) => a.nombreMostrar.localeCompare(b.nombreMostrar, 'es', { sensitivity: 'base' })
                           || a.matricula.localeCompare(b.matricula);
  return [...alumnos].sort((a, b) =>
    (alFinal(a) - alFinal(b))
    || (promedio ? r1(a.promedioGeneral) - r1(b.promedioGeneral) : 0)
    || (faltas ? b.faltasTotal - a.faltasTotal : 0)
    || porNombre(a, b));
}
```

## 7. Búsqueda (M-11)
- `normalizar(texto)` = minúsculas, sin acentos (`NFD` + quitar diacríticos), espacios múltiples → uno, sin espacios al inicio/fin.
- El texto buscado se divide en **palabras**; un alumno coincide si **todas** las palabras aparecen en `normalizar(nombre + ' ' + matricula)`, en cualquier orden.
- Ejemplos: "perez mariana" encuentra "Pérez López Mariana"; "t0900" encuentra la matrícula `T09000001`; "LOPEZ" encuentra "Pérez López Mariana".

## 8. Formato de nombres (M-12)

El Excel trae los nombres como **"Apellidos Nombres"** (ej. "Pérez López Mariana") y no separa unos de otros. Para mostrarlos como **"Nombres Apellidos"** se separan al importar con `separarNombre()` en `lib/nombres.js`:

1. Se recortan espacios (el Excel de lista trae espacios al final en 117 de 173 nombres) y se dividen en palabras.
2. Las **partículas** `de`, `del`, `la`, `las`, `los`, `y`, `san`, `santa`, `mc`, `van`, `von` se unen a la palabra siguiente: "De la O", "Del Ángel", "San Martín".
3. Apellidos **compuestos conocidos** se unen como uno solo (lista editable en `lib/nombres.js`): "Montes de Oca", "Gutiérrez de Velasco", "Rubín de Celis", "Ruiz de Velasco", "Ponce de León"…
4. Las **dos primeras unidades** son los apellidos; el resto, los nombres. Si solo hay dos unidades: 1 apellido + 1 nombre.
5. Se guardan `apellidos` y `nombres` además del `nombre` original. Si el alumno ya tiene una corrección manual (`nombre_corregido = 1`), una nueva carga no la sobrescribe.

| Original | Apellidos | Nombres | Se muestra (Nombres Apellidos) |
|---|---|---|---|
| Pérez López Mariana | Pérez López | Mariana | Mariana Pérez López |
| Ruiz Soto Daniel Alejandro | Ruiz Soto | Daniel Alejandro | Daniel Alejandro Ruiz Soto |
| De la O Murillo María José | De la O · Murillo | María José | María José De la O Murillo |
| Torres Montes de Oca Luis | Torres · Montes de Oca | Luis | Luis Torres Montes de Oca |

- En el Excel actual 15 de 490 nombres (3 %) tienen partículas; son los únicos con riesgo de cortarse mal. Para esos casos el detalle del alumno tiene **"Corregir nombre"** (apellidos / nombres).
- El formato se elige en **Perfil → Preferencias** (M-13): *Nombres Apellidos* (por defecto) o *Apellidos Nombres* (como en el Excel). Aplica a tabla, detalle, gráficas y exportación.
- La búsqueda usa siempre el nombre completo, así que funciona igual con cualquier formato.

## 9. Evolución del desempeño (M-05)

### 9.1 ¿Qué se compara?
- Cada vez que se **confirma una carga del Excel de monitoreo** se guarda un **corte** por alumno (`cortes_alumno`): promedio general, faltas totales, estado general, estado de faltas y número de materias en Crítico.
- Solo se comparan cortes del **mismo periodo** (ej. "2026 Ago - Dic"); al cambiar de periodo la evolución empieza de nuevo.
- Si hay **varias cargas el mismo día**, solo cuenta la última de ese día (evita ruido por subir el mismo archivo dos veces).
- Se compara el **corte actual contra el anterior** (tendencia reciente). En el detalle también se muestra el cambio contra el **primer corte** del periodo.

### 9.2 Criterios de tendencia — `tendencia(cortes)`

| Tendencia | Se cumple si (comparado con el corte anterior) | Se muestra |
|---|---|---|
| ⬇ **Empeora** | el **estado general bajó** (Correcto → Preventivo, Preventivo → Crítico, Correcto → Crítico) **o** el promedio bajó **2 puntos o más** | flecha roja ↓ |
| ⬆ **Mejora** | el estado general **subió** **o** el promedio subió **2 puntos o más**, y el estado **no** bajó | flecha verde ↑ |
| ➡ **Estable** | ninguna de las anteriores | guion gris |
| — **Sin historial** | hay menos de 2 cortes, o el alumno no estaba en el corte anterior | nada |

- **El estado manda sobre el promedio:** si un alumno sube 3 puntos de promedio pero pasa a Crítico por faltas, su tendencia es **Empeora**.
- El umbral de **2 puntos** está en `evolucion.umbral_puntos` (configurable en Umbrales). Se eligió porque los ponderados vienen en enteros y un cambio de 1 punto suele ser solo una actividad nueva calificada.
- **Faltas:** en el detalle se muestra cuántas faltas nuevas tuvo desde la carga anterior ("+3 faltas desde el 6 oct"). Las faltas no generan tendencia por sí solas: cuando suben lo suficiente cambian el estado, y eso ya cuenta como Empeora.

### 9.3 Indicadores de evolución del grupo (Menú principal)
| Indicador | Definición |
|---|---|
| Línea "Promedio general" | promedio de `cortes_alumno.promedio` de los alumnos del ámbito, por corte |
| Línea "% en Crítico" | alumnos en Crítico ÷ alumnos con corte, por corte |
| "Empeoraron desde la última carga" | alumnos con tendencia Empeora (clic → Alumnos filtrado por esa tendencia) |
| "Mejoraron desde la última carga" | alumnos con tendencia Mejora |

> Al inicio del semestre el ponderado se basa en pocas actividades y cambia mucho; la evolución es útil a partir de la **3.ª carga**. Se recomienda al usuario subir el Excel cada semana o cada dos semanas (texto de ayuda junto a la gráfica).

## 10. Indicadores del Menú principal (Resumen administrativo)

Todos se calculan sobre el **ámbito** elegido (todos los alumnos o una lista, M-03) y solo con materias vigentes.

| Indicador | Definición |
|---|---|
| Alumnos monitoreados | alumnos con al menos una materia vigente |
| Promedio general | promedio de los `promedioGeneral` de los alumnos (no de las materias) |
| Alumnos en Crítico / Preventivo / Correcto | conteo por estado general (§4.3) |
| Distribución por estado | conteo de Correcto / Preventivo / Crítico / Sin datos (clic → Alumnos filtrado, M-09) |
| Distribución de promedios | alumnos por rango: `< 60`, `60–69`, `70–79`, `80–89`, `90–100` |
| Materias con menor promedio | promedio de `calificacion` por materia (mín. 5 alumnos), las 10 más bajas |
| Alumnos por estado de faltas | conteo por estado de faltas del alumno (§4.2) |
| Alumnos con mayor riesgo | los 10 primeros con `ordenarAlumnos(…, { promedio: true, faltas: true })` entre los de estado Crítico y Preventivo |
| Evolución | §9.3 |
| Última actualización | `aplicado_en` de la última importación de tipo `monitoreo` |

## 11. Casos de prueba mínimos

| # | Entrada | Esperado |
|---|---|---|
| 1 | calificación 80 / 79.9 / 70 / 69.99 | Correcto / Preventivo / Preventivo / Crítico |
| 2 | límite 5 y faltas 2 / 3 / 4 | Correcto / Preventivo / Crítico |
| 3 | límite 12 y faltas 5 / 6 / 9 / 10 | Correcto / Preventivo / Preventivo / Crítico |
| 4 | límite 2 y faltas 1 | Preventivo |
| 5 | sin límite y faltas 2 / 3 / 5 | Correcto / Preventivo / Crítico |
| 6 | materias 90 (2 de 12 faltas) y 70 (4 de 5 faltas) | promedio 80 → Correcto por promedio; faltas Crítico → **estado general Crítico** |
| 7 | Ponderado `"SD"` | materia Crítico, fuera del promedio, alerta `sin_derecho`, estado general Crítico |
| 8 | alta manual con actividades 100, `SC`, 80, `NE` | calificación 45 (SC y NE = 0) |
| 9 | actividad `DA` | alerta `deshonestidad` |
| 10 | todas las inscripciones `BT` | estado Baja, fuera de indicadores |
| 11 | celda `"   "` | vacía, no se guarda |
| 12 | ordenar ambos: A(70, 3 faltas), B(70, 5), C(65, 0), D(70, 5, nombre anterior a B) | C, D, B, A |
| 13 | búsqueda "perez mariana" | encuentra "Pérez López Mariana" |
| 14 | `separarNombre("De la O Murillo María José")` | apellidos "De la O Murillo", nombres "María José" |
| 15 | cortes: Correcto 85 → Preventivo 87 | tendencia Empeora (bajó el estado) |
| 16 | cortes: 75 → 77.5 (mismo estado) | tendencia Mejora |
| 17 | cortes: 75 → 76 | tendencia Estable |
