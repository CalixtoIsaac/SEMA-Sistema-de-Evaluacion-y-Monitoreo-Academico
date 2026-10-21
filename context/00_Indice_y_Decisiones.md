# SEMA · Índice de contexto y decisiones

> **SEMA — Sistema de Evaluación y Monitoreo Académico.** Sistema de seguimiento académico que permite monitorear las calificaciones, las faltas y la evolución del desempeño estudiantil. Facilita la identificación temprana de alumnos en riesgo académico mediante indicadores, reportes y alertas configurables.

Esta carpeta es la **fuente de verdad** del proyecto. Antes de abrir un Pull Request, revisa que tu cambio respete lo que dicen estos documentos; si no lo respeta, primero se actualiza el documento (con aprobación del Scrum Master) y después el código.

---

## 1. Documentos

| # | Documento | Para qué sirve | Dueño principal |
|---|---|---|---|
| — | `User_Stories.md` / `.pdf` | Historias de usuario originales del cliente | Product Owner |
| 00 | `00_Indice_y_Decisiones.md` | Este índice, glosario y registro de decisiones | Scrum Master |
| 01 | `01_Requerimientos_Tecnicos.md` | Requerimientos funcionales y no funcionales, stack, alcance | Scrum Master |
| 02 | `02_Product_Backlog.md` | Épicas, historias de usuario, criterios de aceptación y prioridad | Product Owner |
| 03 | `03_Arquitectura_Convenciones.md` | Estructura de carpetas, capas, convenciones de código y de Git | Scrum Master / Estructura |
| 04 | `04_Modelo_Datos.md` | Tablas SQLite, relaciones, índices y reglas de integridad | Base de datos |
| 05 | `05_UI_UX.md` | Pantallas, wireframes, semáforo de colores, componentes y mejoras aprobadas | Frontend / PO |
| 06 | `06_Especificacion_API.md` | Endpoints REST, cuerpos, respuestas y errores | Backend |
| 07 | `07_Reglas_Negocio_Indicadores.md` | Cálculo de promedios, estados (verde/amarillo/rojo), faltas, orden, nombres y evolución | Backend / PO |
| 08 | `08_Formato_Excel_Importacion.md` | Diccionario de columnas del Excel de monitoreo y del Excel de lista | Backend / BD |
| — | `Sprints.md` | Iteraciones, milestones, labels e issues para el GitHub Project (Kanban) | Scrum Master |

---

## 2. Equipo

| Rol | Nombre | Responsabilidad |
|---|---|---|
| Product Owner | Saraí Cecilio Rascón | Comunicación con el cliente, mostrar prototipos de vistas para validación constante, entrega del producto final |
| Scrum Master | Calixto Isaac Galeana Medrano | Elegir tecnologías, generar Sprints, dar seguimiento y supervisar que los cambios se alineen al producto; **único que acepta cambios en GitHub** |
| Backend | Sebastián Huesca Ramírez | API, procesamiento de Excel, cálculo de indicadores |
| Base de datos y estructura | Uziel Armando García Duarte | Modelo de datos, estructura del programa |
| Frontend (apoyo en Back) | Calixto Isaac Galeana Medrano | Interfaz, gráficas; apoyo a Sebastián en backend |

> Las tareas pueden reacomodarse; esta es la especialización de cada integrante.

---

## 3. Glosario

| Término | Significado en SEMA |
|---|---|
| **Usuario / líder de generación** | La persona que usa el sistema (profesor o coordinador que da seguimiento a un grupo de alumnos). Hay **una sola cuenta**. |
| **Excel de monitoreo** | El archivo grande que exporta la escuela (hoja `Salida`): una fila por **alumno × materia**, con faltas, actividades A1–A50 y calificación ponderada. |
| **Excel de lista (seguimiento)** | Archivo pequeño que prepara el profesor con **Matrícula y Nombre** de los alumnos que le interesan (por ejemplo, los de 6.º semestre). |
| **Lista de seguimiento** | El conjunto de alumnos que se creó a partir de un Excel de lista. Sirve para filtrar la tabla de alumnos y el Menú principal. |
| **Inscripción** | Un alumno inscrito en una materia/grupo (CRN) durante un periodo. Equivale a una fila del Excel de monitoreo. |
| **CRN** | Identificador del grupo-materia (la clase concreta con su profesor y horario). |
| **Ponderado** | Calificación actual de la materia **ya ponderada** por la escuela. Es el valor oficial; **no** es el promedio simple de A1–A50. |
| **Promedio general** | Promedio de los ponderados de todas las materias vigentes del alumno. |
| **Estado / semáforo** | Correcto (verde), Preventivo (amarillo), Crítico (rojo). Ver `07_Reglas_Negocio_Indicadores.md`. |
| **% del límite de faltas** | Faltas de una materia ÷ "Límite de faltas" de esa materia. Decide el color de las faltas. |
| **Carga / importación** | Cada vez que el usuario sube un Excel. Se guarda un registro con fecha y resumen. |
| **Corte** | La foto de los indicadores de cada alumno en una carga. Permite medir la evolución. |
| **Tendencia** | Si un alumno **mejora, se mantiene o empeora** entre dos cortes (ver `07` §9). |

---

## 4. Decisiones del proyecto

Todas las decisiones están **cerradas**; no hay preguntas pendientes. No se cambian sin aviso al Scrum Master; si una cambia, se actualiza esta tabla y el documento afectado.

### 4.1 Técnicas y de equipo

| ID | Decisión | Motivo / detalle |
|---|---|---|
| D-01 | Stack: **Node.js 20+ · Express · SQLite (`better-sqlite3`) · HTML/CSS/JS sin frameworks** (plantilla ya incluida en el repositorio). | Elegido por el Scrum Master; corre local sin instalar servidores de base de datos. |
| D-02 | La calificación de una materia es la columna **`Ponderado`** del Excel. | En los datos reales el ponderado difiere del promedio simple de actividades (ej.: actividades promedian 83 y el ponderado es 69). |
| D-03 | Las reglas de estado y los umbrales viven en **un solo módulo** (`lib/indicadores.js`) y en la tabla `configuracion`. | Que el frontend, la tabla y las gráficas siempre coincidan. |
| D-04 | Credenciales iniciales: usuario **`Chuchito`**, contraseña **`Administrador*Chuchito*123`**. Se crean automáticamente al primer arranque. | Requerimiento del cliente. |
| D-05 | El sistema funciona **sin internet** (fuentes y librerías de gráficas se sirven desde `public/vendor/`). | Se usa en una computadora de la escuela con un acceso directo. |
| D-06 | **Nunca** se suben Excel con datos reales de alumnos a GitHub. Para pruebas se usan Excel anonimizados en `test/fixtures/`. | Los archivos tienen nombres y matrículas de menores de edad. Aplica también al Excel de matrículas del cliente. |
| D-07 | Solo el Scrum Master hace *merge* a `develop` y `main` (rama protegida + `CODEOWNERS`). | Requerimiento del equipo. |

### 4.2 Respuestas del cliente y del Scrum Master

| ID | Tema | Decisión final | Dónde se aplica |
|---|---|---|---|
| D-08 | Umbral de calificación | **Correcto ≥ 80 · Preventivo 70–79.9 · Crítico < 70.** | `07` §4.1 |
| D-09 | Faltas por materia o total | **Por materia.** El estado de faltas del alumno es el **peor** de sus materias. La suma de faltas solo se muestra y se usa para ordenar. | `07` §4.2 |
| D-10 | Regla de faltas | **Por porcentaje del "Límite de faltas" de cada materia:** Correcto < 50 % · Preventivo 50 %–79 % · Crítico ≥ 80 %. Si una materia no tiene límite (alta manual), se usa la regla fija 0–2 / 3–4 / 5+. Sustituye a la regla fija del brief. | `07` §4.2 |
| D-11 | Columna Estado | **El peor entre el estado por promedio y el estado por faltas.** | `07` §4.3 |
| D-12 | Códigos del Excel | **NE** = No entregó · **SD** = Sin derecho (materia en rojo) · **SC** = Sin calificar (pasó la fecha y el profesor no subió la calificación; cuenta como **0** en la actividad) · **DA** = Deshonestidad académica (cuenta como **0** y genera alerta). | `07` §1, §3, §5 |
| D-13 | Bajas (BT) | Se muestran en gris como "Baja" y **no cuentan** en promedios ni gráficas. | `07` §2 |
| D-14 | "Deuda del alumno" | **No se importa** (dato financiero, fuera del alcance académico). | `08` §1.1 |
| D-15 | Volver a subir un Excel del mismo periodo | Se pregunta en la previsualización; la opción marcada por defecto es **"Actualizar (fusionar)"**. | `04` §4, `05` §6 |
| D-16 | Formato del Excel de lista | Archivo de ejemplo del cliente: hoja `Todos`, encabezados **`Matrícula`** y **`Nombre`** en la fila 1. Se sigue aceptando cualquier columna que contenga "matr" y "nombre". | `08` §2 |
| D-17 | Cuenta del usuario | En Perfil el usuario puede **cambiar su usuario y su contraseña**. **No hay campo de correo.** Recuperación de contraseña con `npm run reset-password`. | `01` RF-04, `04`, `06` §3 |
| D-18 | Contraseña por defecto | Aviso no bloqueante en el Menú principal hasta que se cambie. | `05` §5 |
| D-19 | "Lógica de descuentos" en el brief | Era texto accidental de otro proyecto. Backend = API + Excel + indicadores. | — |
| D-20 | Mejoras de diseño | Aprobadas **todas: M-01 a M-13**, incluida M-05 (evolución del desempeño) tras su explicación. | `05` §11–12 · `07` §9 |
