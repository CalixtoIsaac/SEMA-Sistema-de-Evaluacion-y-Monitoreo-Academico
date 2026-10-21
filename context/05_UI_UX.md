# 05 · UI / UX

Base visual: la plantilla incluida (tarjetas, bordes suaves, tema claro/oscuro, UI kit `UI.*`) con la **paleta institucional azul** (M-10). Todas las pantallas usan las variables de `public/css/theme.css`; **ningún color se escribe directo en el código**.

Las mejoras de diseño M-01 a M-13 están **aprobadas** (§11); la evolución del desempeño (M-05) se detalla en §12. En los wireframes se indica entre corchetes la mejora que origina cada elemento, por ejemplo `[M-02]`.

---

## 1. Principios

1. **Lo urgente primero:** al abrir Alumnos o el Menú principal, el rojo debe saltar a la vista.
2. **El color nunca va solo:** cada estado lleva texto e ícono (accesibilidad y daltonismo).
3. **Un clic al detalle:** cualquier alumno que aparezca (tabla, top de riesgo) abre su detalle.
4. **Nunca una pantalla en blanco:** estados vacíos con mensaje y acción.
5. **Lenguaje del usuario:** "Cargar datos", "Alumnos", "Faltas"; nada de "importación", "registro" o "CRN" en textos visibles (salvo en el detalle técnico).
6. **Decir el porqué:** si un alumno está en rojo, el detalle explica si es por promedio o por faltas y en qué materia.

## 2. Mapa de navegación

```
Login ──► App
          ├── Menú principal (Resumen administrativo)   #resumen    (vista por defecto)
          ├── Cargar datos                              #cargar
          │     ├── pestaña Subir Excel (por defecto)
          │     ├── pestaña Formulario
          │     └── pestaña Historial
          ├── Alumnos                                   #alumnos
          │     └── Detalle del alumno                  #alumnos/T09000001
          └── Perfil                                    #perfil
                ├── Cuenta (usuario y contraseña)
                ├── Preferencias (tema y formato de nombres)   [M-12, M-13]
                ├── Umbrales                                   [M-08]
                └── Datos (respaldo / borrar)
```

## 3. Layout general

```
┌───────────────┬───────────────────────────────────────────────────────────┐
│ ◆ SEMA        │ ☰  Menú principal                               ◐ tema   │
│               ├───────────────────────────────────────────────────────────┤
│ GENERAL       │                                                           │
│ ⌂ Menú princ. │                  (contenido de la vista)                  │
│ ⇪ Cargar datos│                                                           │
│ 👥 Alumnos    │                                                           │
│ 👤 Perfil     │                                                           │
│               │                                                           │
│ ───────────── │                                                           │
│ (CH) Chuchito │                                                           │
│ ⎋ Cerrar ses. │                                                           │
└───────────────┴───────────────────────────────────────────────────────────┘
```

- Sidebar fija en escritorio; en pantallas < 900 px se oculta y se abre con ☰ (ya existe en la plantilla).
- El enlace activo se resalta (`aria-current="page"`).
- Título de pestaña del navegador: `<Vista> · SEMA`.
- Cambiar "Mi Proyecto" por **SEMA** en `login.html`, `app.html` y `app.js`; ícono `logo` por un birrete o gráfica con check.
- El botón ◐ de la barra superior es un **atajo**: cambia el tema y lo guarda como preferencia (el mismo valor que Perfil → Preferencias, M-13).

### 3.1 Paleta institucional (M-10)

Se cambia solo el acento; el semáforo (`--success-*`, `--warning-*`, `--danger-*`) no se toca.

| Variable | Tema claro | Tema oscuro |
|---|---|---|
| `--primary` | `#1d4ed8` | `#3b82f6` |
| `--primary-hover` | `#1e40af` | `#2563eb` |
| `--primary-soft` | `#eff6ff` | `rgba(59, 130, 246, 0.14)` |
| `--primary-text` | `#1d4ed8` | `#93c5fd` |
| `--ring` | `#3b82f6` | `#60a5fa` |
| `--focus-ring` | `0 0 0 3px rgba(59, 130, 246, 0.35)` | `0 0 0 3px rgba(96, 165, 250, 0.40)` |
| `--brand-gradient` | `linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)` | igual |
| `--glow-1` / `--glow-2` | `rgba(59,130,246,.16)` / `rgba(8,145,178,.12)` | igual |

## 4. Login

```
            ┌───────────────────────────────┐
            │            ◆ SEMA              │
            │ Sistema de Evaluación y        │
            │ Monitoreo Académico            │
            │                                │
            │ Usuario     [ Chuchito       ] │
            │ Contraseña  [ ••••••••    👁 ] │
            │                                │
            │ [        Iniciar sesión       ]│
            │                                │
            │ ⚠ Usuario o contraseña         │
            │   incorrectos.                 │
            └───────────────────────────────┘
```

- Se elimina la pantalla "Crea tu cuenta" de la plantilla (la cuenta ya existe).
- Botón con estado "Entrando…" mientras responde.
- Enter envía el formulario; foco inicial en Usuario.
- El login usa el último tema guardado en el navegador (no hay sesión todavía para leer la preferencia).

## 5. Menú principal (Resumen administrativo)

```
Buenos días, Chuchito                       Mostrar: [Todos los alumnos ▾]   [M-03]
Última actualización: 20 oct 2026, 10:42

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Alumnos  │ │ Promedio │ │ Crítico  │ │Preventivo│ │ Correcto │
│   490    │ │   88.4   │ │  🔴 34   │ │  🟡 134  │ │  🟢 319  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘

┌── Alumnos por estado ──────┐ ┌── Distribución de promedios ──────────┐
│        (dona)   [M-09]     │ │ <60 ▌  60-69 ▌  70-79 ██  80-89 ███   │
│  🟢 319  🟡 134  🔴 34      │ │ 90-100 ████████                        │
└────────────────────────────┘ └────────────────────────────────────────┘
┌── Materias con menor promedio ─┐ ┌── Alumnos por estado de faltas ───┐
│ (materia A)          ████ 71   │ │ 🟢 338   🟡 119   🔴 30            │
│ (materia B)          █████ 76  │ │                                    │
└────────────────────────────────┘ └────────────────────────────────────┘
┌── Alumnos con mayor riesgo ───────────────────────────────── Ver todos →┐
│ Nombre                 Matrícula   Promedio   Faltas   Estado           │
│ ...                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
┌── Evolución del desempeño  [M-05, ver §12] ─────────────────────────────┐
│ (línea: promedio general y % en Crítico por carga)                      │
└─────────────────────────────────────────────────────────────────────────┘
```

Los números son los del Excel actual con las reglas de `07` (el estado general combina promedio y faltas); los nombres de materias son ilustrativos.

**Estado vacío (sin datos):**

```
┌───────────────────────────────────────────────────────────┐
│                     📥                                     │
│           Aún no hay datos en el sistema                   │
│   Carga el Excel de monitoreo para ver las gráficas.       │
│                [  ⇪ Cargar datos  ]                         │
└───────────────────────────────────────────────────────────┘
(las tarjetas muestran "—" y las gráficas aparecen vacías en gris)
```

- Aviso amarillo no bloqueante si la contraseña sigue siendo la de fábrica: "Estás usando la contraseña por defecto. **Cambiarla**" (D-18).
- Clic en un segmento de la dona (ej. Crítico) → abre Alumnos con ese chip de estado activo (M-09).
- Clic en una tarjeta de estado (Crítico, Preventivo, Correcto) → mismo comportamiento.

**Gráficas (Chart.js)**

| Gráfica | Tipo | Colores |
|---|---|---|
| Alumnos por estado | dona con total al centro | verde / amarillo / rojo / gris |
| Distribución de promedios | barras verticales por rango | cada barra con el color de su estado |
| Materias con menor promedio | barras horizontales, top 10 | color por estado de la materia |
| Alumnos por estado de faltas | barras | verde / amarillo / rojo |
| Evolución (M-05) | líneas (2 series) | `--primary` y `--danger-text` |

Reglas: sin animaciones largas (≤ 300 ms), tooltips en español, etiquetas de eje legibles en tema oscuro (leer colores de las variables CSS en `graficas.js` y **redibujar al cambiar de tema**), nombres largos de materia recortados con "…" y completos en el tooltip.

## 6. Cargar datos

**Pestaña "Subir Excel" (principal):**

```
┌──────────────────────────────────────────────────────────────┐
│                         ⇪                                     │
│        Arrastra tu Excel aquí o haz clic para buscarlo        │
│                 Solo .xlsx · máximo 15 MB                     │
└──────────────────────────────────────────────────────────────┘
```

Arrastrando: borde punteado con `--ring` y fondo `--primary-soft`. Procesando: barra/spinner "Leyendo archivo…".

**Previsualización:**

```
Monitoreo_de_alumnos_2.xlsx · 2026 Ago - Dic                       [ ✕ Cancelar ]

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│  490     │ │   46     │ │  3,664   │ │ ⚠ 6 avisos   │
│ alumnos  │ │ materias │ │ filas    │ │ ver detalle ▾│
└──────────┘ └──────────┘ └──────────┘ └──────────────┘

Matrícula   Nombre                     Materia               Grupo  Faltas  Ponderado
T09000001   Mariana Pérez López        Cálculo diferencial   603    0       69
...  (20 filas)                                         [ Ver todas las columnas ]

¿Qué hacer con los datos que ya existen de este periodo?
(•) Actualizar: agrega y actualiza lo que viene en el archivo
( ) Reemplazar: deja solo lo que viene en el archivo

                                              [ Cancelar ] [ ✔ Confirmar carga ]
```

Al confirmar: toast verde **"Datos cargados correctamente · 490 alumnos"** con botón "Ver alumnos".

**Pestaña "Formulario":** dos pasos en la misma página.

```
Datos del alumno
Matrícula* [T0       ]  Apellidos* [                ]  Nombres* [                ]
Plan de estudios [Bachillerato General ▾]

Materias                                                  [ + Agregar materia ]
┌ Materia [Cálculo diferencial ▾]  Faltas [0]  Límite de faltas [12]           ┐
│ A1 [  ] A2 [  ] A3 [  ] … (+ actividad)   Calificación [   ] (vacía = promedio)│
└──────────────────────────────────────────────────────────────── 🗑 Quitar ───┘
                                                    [ Cancelar ] [ Guardar alumno ]
```

- Validación en línea (mensaje rojo bajo el campo).
- Actividades aceptan número 0–100 o los códigos `NE`, `SC`, `DA` (cuentan como 0, `07` §1).
- En el formulario se piden apellidos y nombres por separado, así no hay que adivinar el corte (M-12).

**Pestaña "Historial":** tabla de cargas (fecha, archivo, tipo, alumnos, filas, modo, estado).

## 7. Alumnos

```
Mostrar: [6.º semestre ▾] [M-03]  [ ⇪ Cargar lista ]                      [ ⤓ Exportar ] [M-07]

[🔍 Buscar por nombre o matrícula…        ] [M-11]   Ordenar (peor → mejor): [✓] PROMEDIO [ ] FALTAS
Estado: (Todos 173) (🔴 Crítico 15) (🟡 Preventivo 47) (🟢 Correcto 111) (⬇ Empeoraron)   [M-02, M-05]

┌────────────────────────────────┬────────────┬──────────┬────────┬──────────────────┐
│ Nombre                         │ Matrícula  │ Promedio │ Faltas │ Estado           │
│                                │            │          │ [M-01] │                  │
├────────────────────────────────┼────────────┼──────────┼────────┼──────────────────┤
│ Galilea Rascón              ⚠  │ T00000456  │   65.2   │  🔴 9  │ 🔴 Crítico        │
│ Calixto Kevin                  │ T00000234  │   74.8   │  🟡 3  │ 🟡 Preventivo     │
│ Antonio Armando                │ T00000123  │  100.0   │  🟢 0  │ 🟢 Correcto       │
└────────────────────────────────┴────────────┴──────────┴────────┴──────────────────┘
Mostrando 1–50 de 173                                         ‹ 1 2 3 4 ›
```

- Columnas: Nombre · Matrícula · Promedio total · **Faltas** (M-01) · Estado.
- **Faltas** muestra la suma de faltas con el color del **peor estado de faltas** del alumno (por % del límite de cada materia, `07` §4.2). Tooltip: "Peor materia: Inglés Nivel 4 · 4 / 5 faltas".
- **Estado** = el peor entre promedio y faltas (D-11). Tooltip con el motivo.
- ⚠ junto al nombre si tiene alertas (M-06); tooltip con la lista.
- **Chips de estado** (M-02): filtran la tabla; muestran el conteo de la lista actual; se pueden combinar con búsqueda y orden. Un clic en el chip activo lo apaga.
- Nombres en el formato elegido en Preferencias (M-12); por defecto "Nombres Apellidos".
- Fila completa clicable y navegable con teclado (Enter); cursor de mano; hover con `--muted`.
- Casillas de orden según `07` §6; al marcar, el encabezado correspondiente muestra ▲/▼.
- Búsqueda en vivo por palabras (debounce 150 ms). Búsqueda, chips, orden, página y lista se conservan al volver del detalle (en memoria y `sessionStorage`).
- **Exportar** (M-07) descarga exactamente lo que se ve (lista, búsqueda, chips y orden).
- Sin resultados: "No hay alumnos que coincidan con «texto»" + botón "Limpiar búsqueda".
- Sin datos: mismo estado vacío que el Menú principal, con botón a Cargar datos.

**Modal "Cargar lista":** nombre de la lista (se propone el nombre del archivo o de la hoja) + zona de arrastre → previsualización (total, encontrados, **no encontrados** y **nombres distintos** en tablas) → Guardar lista. Con el Excel de ejemplo del cliente: 173 matrículas, 173 encontradas, 1 nombre distinto.

## 8. Detalle del alumno

```
← Volver a alumnos

┌──────────────────────────────────────────────────────────────────────────┐
│ (MP)  Mariana Pérez López                    ✎ Corregir nombre  🔴 Crítico │
│       T09000001 · Bachillerato General (BAG_SR) · Listas: 6.º semestre    │
│       Crítico por faltas en Inglés Nivel 4 (4 / 5)                        │
│                                                                          │
│   Promedio general  81.4    Faltas totales  7    Materias  7             │
│   [M-06] ⚠ Faltas al límite · ⚠ 1 materia reprobando · ⓘ 1 actividad SC │
│   [M-05] ↓ Empeora desde la carga del 6 oct (Correcto → Crítico)        │
└──────────────────────────────────────────────────────────────────────────┘

Materia: Cálculo diferencial                                      🔴 69
Prof. Hernández Mora Luis · Grupo 603 · L–V 10:30–11:29
┌────┬────┬────┬─────┬─────┬────┬────────────────┬────────────┐
│ A1 │ A2 │ A3 │ A4  │ A5  │ A6 │ Promedio total │ Faltas     │
├────┼────┼────┼─────┼─────┼────┼────────────────┼────────────┤
│ 70 │ 91 │ 99 │ 100 │ 100 │ 38 │     🔴 69       │ 🟢 0 / 12  │  [M-04]
└────┴────┴────┴─────┴─────┴────┴────────────────┴────────────┘

Materia: Inglés Nivel 4                                           🟡 77
...                                                   Faltas: 🔴 4 / 5
```

- Una tarjeta por materia, ordenadas de peor a mejor (las bajas al final, en gris, con etiqueta "Baja").
- Solo se muestran las columnas de actividad que tienen datos (A1…An).
- Actividades < 70 en texto rojo. Códigos como chips con tooltip: `NE` "No entregó" (gris), `SC` "Sin calificar: el profesor no subió la calificación" (gris), `DA` "Deshonestidad académica" (rojo), `SD` "Sin derecho" (rojo).
- **Faltas como "faltas / límite"** con el color del % del límite (M-04). Tooltip: "80 % del límite".
- Línea de **motivo** del estado bajo los datos generales (`07` §4.3).
- **Corregir nombre** abre un modal con Apellidos / Nombres (para los nombres con partículas, M-12).
- En pantallas angostas la tabla de actividades hace scroll horizontal **dentro de la tarjeta** (la página no).
- "Promedio total" = ponderado de la escuela; tooltip "Calificación ponderada del sistema escolar".

## 9. Perfil

```
Cuenta                                  Contraseña
Nombre   [Administrador        ]        Actual     [••••••••]
Usuario  [Chuchito             ]        Nueva      [••••••••]
Contraseña actual [••••••••]            Confirmar  [••••••••]
[ Guardar cambios ]                     [ Cambiar contraseña ]

Preferencias  [M-12, M-13]
Tema:               ( ) Claro   ( ) Oscuro   (•) Igual que el sistema
Mostrar nombres:    (•) Nombres Apellidos  — Mariana Pérez López
                    ( ) Apellidos Nombres  — Pérez López Mariana
(se guardan al elegir; toast "Preferencia guardada")

Umbrales  [M-08]
Calificación:  Verde desde [80]   Amarillo desde [70]          (abajo = rojo)
Faltas (% del límite de cada materia):  Amarillo desde [50] %   Rojo desde [80] %
Materias sin límite:                     Amarillo desde [3] faltas   Rojo desde [5]
Evolución [M-05]:                        Cambio mínimo de promedio [2] puntos
Vista previa: con estos valores hay 🔴 34 · 🟡 134 · 🟢 319
[ Restaurar por defecto ]  [ Guardar umbrales ]

Datos
[ ⤓ Descargar respaldo ]   [ 🗑 Borrar todos los datos académicos ]
```

- **Sin campo de correo** (D-17). Cambiar el usuario pide la contraseña actual.
- **Tema** (M-13): se guarda en la cuenta (`usuarios.tema`) y en el navegador (para que la página no parpadee al cargar). El botón ◐ de la barra superior cambia la misma preferencia. "Igual que el sistema" sigue la configuración de Windows (`prefers-color-scheme`).
- **Mostrar nombres** (M-12) aplica a tabla, detalle, gráficas, top de riesgo y exportación.

## 10. Componentes y estados

| Componente | Dónde | Notas |
|---|---|---|
| `badge-estado` | tabla, detalle, top riesgo | `<span class="badge badge-critico">✕ Crítico</span>`; clases `badge-correcto/preventivo/critico/sin-datos/baja` en `semaforo.css` |
| `chip-filtro` | Alumnos | botón con conteo y `aria-pressed` (M-02) |
| `chip-codigo` | detalle | NE, SC, DA, SD con tooltip |
| `tendencia` | tabla, detalle (M-05) | ↑ verde · ↓ rojo · – gris, con texto oculto para lectores de pantalla |
| `stat` (tarjeta KPI) | Menú principal, previsualización | ya existe en la plantilla |
| `dropzone` | Cargar datos, Cargar lista | nuevo; teclado: Enter/Espacio abre el selector |
| `data-table` | Alumnos, previsualización, detalle | encabezado fijo, filas clicables, `tabular-nums` en números |
| `segmented` | Preferencias | grupo de opciones (tema, formato de nombres) |
| `empty-state` | todas | ícono + título + texto + botón |
| `UI.toast` | todas | éxito / error / info (ya existe) |
| `UI.confirm` | eliminar lista, reemplazar periodo, borrar datos | ya existe; `danger: true` en acciones destructivas |
| Skeleton | mientras carga la API | ya existe (`.skeleton`) |

**Estados obligatorios por vista:** cargando (skeleton) · vacío · con datos · error ("No se pudo cargar. **Reintentar**").

## 11. Mejoras de diseño aprobadas

| ID | Mejora | Dónde se aplica | Estado |
|---|---|---|---|
| M-01 | Columna **Faltas** en la tabla de alumnos | §7 | ✅ Aprobada |
| M-02 | **Chips de estado** con conteo, como filtro | §7 | ✅ Aprobada |
| M-03 | Selector **"Mostrar: Todos / lista"** en Alumnos y en el Menú principal | §5, §7 | ✅ Aprobada |
| M-04 | Faltas como **"faltas / límite"** con color por % del límite | §8 | ✅ Aprobada |
| M-05 | **Evolución del desempeño** (tendencia por alumno y del grupo) | §5, §7, §8, §12 · `07` §9 | ✅ Aprobada |
| M-06 | **Alertas** (sin derecho, faltas al límite, muchos NE, SC, DA, materias reprobando) | §7, §8 · `07` §5 | ✅ Aprobada |
| M-07 | **Exportar** la tabla filtrada a Excel/CSV | §7 | ✅ Aprobada |
| M-08 | **Umbrales configurables** en Perfil | §9 | ✅ Aprobada |
| M-09 | Clic en la dona o en las tarjetas de estado → Alumnos filtrado | §5 | ✅ Aprobada |
| M-10 | **Paleta institucional azul** | §3.1 | ✅ Aprobada |
| M-11 | Búsqueda **por palabras** | §7 · `07` §7 | ✅ Aprobada |
| M-12 | Mostrar nombres como **"Nombres Apellidos"** (con preferencia para volver a "Apellidos Nombres" y corrección manual) | §7–9 · `07` §8 | ✅ Aprobada |
| M-13 | **Tema claro / oscuro como preferencia** del usuario en Perfil | §9 | ✅ Aprobada |

## 12. M-05 · Evolución del desempeño (aprobada)

**Qué es:** cada vez que el usuario sube el Excel de monitoreo, SEMA guarda una "foto" (corte) de cada alumno. Comparando una foto con la anterior se sabe si el alumno **mejora, se mantiene o empeora**. Los criterios exactos están en `07` §9; en resumen:

- **Empeora:** su estado general bajó de color (por ejemplo, de verde a amarillo) **o** su promedio bajó 2 puntos o más.
- **Mejora:** su estado subió de color **o** su promedio subió 2 puntos o más, sin bajar de color.
- **Estable:** ninguna de las dos.
- **Sin historial:** solo hay una carga.
- El color manda: si sube el promedio pero cae a rojo por faltas, cuenta como Empeora.

**Dónde aparece:**

| Lugar | Qué se ve |
|---|---|
| **Menú principal** | Tarjeta "Evolución del desempeño": línea del promedio general del grupo y línea del % de alumnos en Crítico por fecha de carga. Debajo: "⬇ 12 empeoraron · ⬆ 20 mejoraron desde la última carga" (clic → Alumnos filtrado). Con una sola carga: "La evolución aparecerá cuando cargues datos más de una vez". |
| **Alumnos** | Flecha junto al promedio (↑ verde, ↓ rojo, – gris) y chip extra **"⬇ Empeoraron"** junto a los chips de estado. |
| **Detalle del alumno** | Línea "↓ Empeora desde la carga del 6 oct (Correcto → Crítico)", mini-gráfica del promedio por carga, faltas nuevas desde la última carga ("+3 faltas") y, en cada materia, la flecha comparando su ponderado con la carga anterior. |
| **Perfil → Umbrales** | "Cambio mínimo de promedio: 2 puntos". |

**Por qué sirve:** un alumno puede seguir en verde y venir cayendo carga tras carga; el semáforo solo no lo muestra. La tendencia permite actuar **antes** de que llegue a rojo.

**Requisito de uso:** se compara dentro del mismo periodo y es útil a partir de la 3.ª carga; se recomienda subir el Excel cada semana o cada dos semanas.

**Trabajo:** issue #37 (Sprint 4, 4 puntos). La tabla `cortes_alumno` ya está en el modelo desde el Sprint 0, así que cada carga guarda su corte desde el principio.
