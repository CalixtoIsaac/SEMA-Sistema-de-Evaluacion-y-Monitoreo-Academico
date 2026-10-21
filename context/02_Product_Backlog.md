# 02 · Product Backlog

**Usuario principal:** líder de generación (profesor/coordinador que da seguimiento a sus alumnos).
**Prioridad:** MoSCoW (Must · Should · Could · Won't). **Estimación:** puntos de historia (1, 2, 3, 5, 8).
Las historias **HU-10, HU-13 y HU-16** vienen de `User_Stories.md` (historias originales del cliente).

---

## Resumen por épica

| Épica | Nombre | Historias | Puntos | Sprint |
|---|---|---|---|---|
| E1 | Base del proyecto y arranque | HU-01 + T-01…T-03, T-06…T-08 | 5 + técnicas | 0 |
| E2 | Acceso y cuenta | HU-02, HU-03, HU-04 | 8 | 0 · 3 |
| E3 | Carga de datos | HU-05 … HU-09 | 17 | 1 · 3 · 4 |
| E4 | Listas de seguimiento | HU-10 … HU-12 | 9 | 3 |
| E5 | Monitoreo de alumnos | HU-13 … HU-17 | 17 | 2 |
| E6 | Resumen administrativo | HU-18 … HU-22 | 15 | 4 |
| E7 | Configuración, preferencias y reportes | HU-23 … HU-26 | 11 | 3 · 5 |

---

## E1 · Base del proyecto y arranque

### HU-01 · Abrir SEMA con un acceso directo — *Must · 5 pts*
**Como** líder de generación **quiero** abrir SEMA con doble clic **para** no tener que usar la terminal.

- [ ] Existe `SEMA.bat` en la raíz; al ejecutarlo instala dependencias si no existe `node_modules`, crea `.env` si falta y ejecuta `npm start`.
- [ ] Cuando el servidor está listo, se abre el navegador predeterminado en `http://localhost:3000`.
- [ ] Si el puerto ya está ocupado por SEMA, solo abre el navegador (no muestra error).
- [ ] Si Node.js no está instalado, la ventana muestra "Instala Node.js 20 o superior" y espera una tecla.
- [ ] Hay un acceso directo con ícono de SEMA para el escritorio y su instrucción en el manual.

### Tareas técnicas de la épica

| ID | Tarea | Responsable |
|---|---|---|
| T-01 | Limpieza del repositorio: borrar la carpeta duplicada `plantilla-express-sqlite/`, quitar el módulo de ejemplo *Notas*, renombrar "Mi Proyecto" → "SEMA" y `package.json` → `sema`, aplicar la paleta institucional azul (M-10, `05` §3.1), agregar `.gitattributes` (finales de línea), `CODEOWNERS` y proteger `main`/`develop`. | Scrum Master |
| T-02 | Esquema de base de datos v1 según `04_Modelo_Datos.md` (con `PRAGMA user_version` para migraciones). | Base de datos |
| T-03 | Usuario por defecto `Chuchito` y secreto JWT persistente en `data/jwt.secret`; script `npm run reset-password`. | Backend |
| T-06 | Excel de prueba **anonimizado** en `test/fixtures/monitoreo-muestra.xlsx` (mismas columnas, nombres y matrículas falsos, ~200 filas, incluye NE/SD/SC/DA/BT) y Excel de lista con el formato del cliente. | Base de datos |
| T-07 | Copiar Chart.js y la fuente Inter a `public/vendor/` (funcionamiento sin internet). | Frontend |
| T-08 | Prototipos de vistas (Login, Resumen, Cargar datos, Alumnos, Detalle, Perfil) y validación con el cliente. | Product Owner |

---

## E2 · Acceso y cuenta

### HU-02 · Iniciar sesión — *Must · 3 pts*
**Como** líder de generación **quiero** entrar con usuario y contraseña **para** que una persona ajena no vea información confidencial.

- [ ] La primera vez, la cuenta `Chuchito` / `Administrador*Chuchito*123` ya existe (no se pide crear cuenta).
- [ ] Con datos correctos se redirige al **Resumen administrativo**.
- [ ] Con datos incorrectos aparece "Usuario o contraseña incorrectos." (sin decir cuál falló).
- [ ] Tras 10 intentos fallidos en 15 min se bloquea temporalmente con mensaje claro.
- [ ] Sin sesión, cualquier URL interna regresa al login.

### HU-03 · Cambiar usuario — *Must · 3 pts*
**Como** líder de generación **quiero** cambiar mi nombre de usuario **para** personalizar mi acceso.

- [ ] En Perfil → Cuenta se editan nombre y usuario (**no hay correo**, D-17).
- [ ] Guardar pide la contraseña actual.
- [ ] Validaciones: usuario 3–30 caracteres (letras, números, `.`, `-`, `_`) y que no esté vacío.
- [ ] Al guardar se muestra un toast y el nombre se actualiza en el sidebar sin cerrar sesión.

### HU-04 · Cambiar contraseña — *Must · 2 pts*
**Como** líder de generación **quiero** cambiar mi contraseña **para** dejar de usar la que viene por defecto.

- [ ] Pide contraseña actual, nueva y confirmación; mínimo 8 caracteres.
- [ ] Mientras siga la contraseña por defecto, el Resumen muestra un aviso "Cambia tu contraseña" (D-18).
- [ ] Si se olvida la contraseña: `npm run reset-password` (documentado en el manual).

---

## E3 · Carga de datos

### HU-05 · Subir el Excel de monitoreo — *Must · 3 pts*
**Como** líder de generación **quiero** arrastrar el Excel o buscarlo en mis documentos **para** cargar a todos los alumnos de una vez.

- [ ] Zona de arrastre con texto "Arrastra tu Excel aquí o haz clic para buscarlo".
- [ ] Acepta solo `.xlsx` de hasta 15 MB; otro tipo muestra error sin enviar nada.
- [ ] Mientras se procesa se muestra un indicador de carga.
- [ ] Si faltan columnas obligatorias: "Este archivo no tiene el formato del Excel de monitoreo" + lista de columnas faltantes.

### HU-06 · Previsualizar antes de guardar — *Must · 5 pts*
**Como** líder de generación **quiero** ver una vista previa del archivo **para** asegurarme de que subí el correcto.

- [ ] Tarjetas: **alumnos** que se cargarán, materias, filas, periodo detectado (ej. "2026 Ago - Dic").
- [ ] Tabla con las primeras 20 filas (Matrícula, Nombre, Materia, Grupo, Faltas, Ponderado) y opción "Ver todas las columnas".
- [ ] Advertencias: filas omitidas, bajas (BT), materias "SD", códigos desconocidos, matrículas con formato raro.
- [ ] Opción de modo: **Actualizar (fusionar)** / **Reemplazar periodo**; marcada por defecto "Actualizar" (D-15).
- [ ] Botones **Confirmar carga** y **Cancelar**. Cancelar no guarda nada.

### HU-07 · Notificación de carga — *Must · 1 pt*
**Como** líder de generación **quiero** ver una notificación al terminar **para** saber que todo salió bien.

- [ ] Toast verde "Datos cargados correctamente · 490 alumnos" y botón "Ver alumnos".
- [ ] Si falla, toast rojo con el motivo; no se guarda nada (transacción).

### HU-08 · Formulario manual — *Should · 5 pts*
**Como** líder de generación **quiero** agregar un alumno a mano **para** registrar casos que no vienen en el Excel.

- [ ] Datos del alumno: matrícula (obligatoria, única), apellidos, nombres, plan de estudios.
- [ ] Agregar materias: materia (lista o nueva), actividades (número, NE, SC, DA o vacío), faltas, límite de faltas y calificación (si se deja vacía se calcula el promedio de actividades con NE/SC/DA = 0).
- [ ] Si la matrícula ya existe, se ofrece agregar materias a ese alumno.
- [ ] Los registros manuales quedan marcados como "Manual" y una carga de Excel no los borra.

### HU-09 · Historial de cargas — *Could · 3 pts*
**Como** líder de generación **quiero** ver las cargas anteriores **para** saber qué tan actualizados están los datos.

- [ ] Tabla: fecha, archivo, tipo, alumnos, filas, modo, estado.
- [ ] El Resumen muestra "Última actualización: <fecha>".

---

## E4 · Listas de seguimiento

### HU-10 · Crear lista desde un Excel — *Must · 5 pts* · **(historia original del cliente)**
**Como** líder de generación **quiero** filtrar a los alumnos inscritos de último año **para** agilizar la búsqueda de información de dichos alumnos.

- [ ] En Alumnos → "Cargar lista" se sube un Excel con columnas Matrícula y Nombre (formato del cliente, `08` §2) y se le pone nombre (ej. "6.º semestre").
- [ ] Previsualización: total de filas, encontrados en SEMA, **no encontrados** (con su matrícula y nombre) y **nombres distintos** (misma matrícula, nombre diferente).
- [ ] Con el Excel de ejemplo del cliente: 173 matrículas, 173 encontradas, 1 nombre distinto.
- [ ] Las matrículas no encontradas se guardan; si después se cargan esos alumnos, aparecen solos en la lista.
- [ ] Al confirmar, la tabla muestra solo esa lista.

### HU-11 · Cambiar entre listas — *Must · 2 pts*
**Como** líder de generación **quiero** elegir qué lista ver **para** alternar entre todos los alumnos y mi grupo.

- [ ] Selector "Mostrar: Todos los alumnos / <lista>" arriba de la tabla y en el Resumen (M-03).
- [ ] La selección se recuerda al volver a la vista.

### HU-12 · Administrar listas — *Could · 2 pts*
- [ ] Renombrar, reemplazar con otro Excel y eliminar (con confirmación) una lista.

---

## E5 · Monitoreo de alumnos

### HU-13 · Tabla de alumnos con promedio y faltas — *Must · 5 pts* · **(historia original del cliente)**
**Como** líder de generación **quiero** ver por cada alumno sus faltas y promedios **para** identificar a los alumnos en riesgo de reprobar.

- [ ] Columnas: Nombre · Matrícula · Promedio general · Faltas (M-01) · Estado.
- [ ] Promedio con 1 decimal según `07` §3. Faltas = suma, con el color del peor estado de faltas por materia (% del límite, D-10).
- [ ] Estado = el peor entre promedio y faltas (D-11), con el motivo en un tooltip.
- [ ] Chips de estado con conteo que filtran la tabla (M-02).
- [ ] Ícono ⚠ si el alumno tiene alertas (M-06).
- [ ] Nombres en el formato elegido en Preferencias (M-12).
- [ ] Paginación de 50 filas y contador "Mostrando 1–50 de 490".
- [ ] Clic en una fila abre el detalle del alumno.

### HU-14 · Buscador — *Must · 2 pts*
- [ ] Caja de búsqueda arriba de la tabla; filtra por nombre o matrícula al teclear.
- [ ] Busca **por palabras** en cualquier orden (M-11): "perez mariana" encuentra "Pérez López Mariana".
- [ ] No distingue mayúsculas ni acentos ("munoz" encuentra "Muñoz").
- [ ] Sin resultados: "No hay alumnos que coincidan con «texto»".

### HU-15 · Ordenar de peor a mejor — *Must · 3 pts*
**Como** líder de generación **quiero** ordenar por promedio y/o faltas **para** ver primero a quienes necesitan atención.

- [ ] Casillas `PROMEDIO [ ]` y `FALTAS [ ]` al lado del buscador.
- [ ] Solo Promedio: de menor a mayor promedio.
- [ ] Solo Faltas: de mayor a menor número de faltas.
- [ ] Ambas: peor promedio primero; si empatan, más faltas primero; si empatan, orden alfabético.
- [ ] Ninguna: orden alfabético.

### HU-16 · Semáforo de colores — *Must · 2 pts* · **(historia original del cliente)**
**Como** líder de generación **quiero** que el sistema use rojo, amarillo y verde según la calificación **para** que el monitoreo sea más intuitivo.

- [ ] Correcto (verde ≥ 80), Preventivo (amarillo 70–79.9), Crítico (rojo < 70), Baja (gris), con texto e ícono además del color (D-08).
- [ ] Faltas por % del límite de cada materia: < 50 % verde, 50–79 % amarillo, ≥ 80 % rojo (D-10).
- [ ] Los mismos colores en tabla, detalle y gráficas.
- [ ] Los umbrales salen de `configuracion` (por defecto los de `07` §4).

### HU-17 · Detalle del alumno — *Must · 5 pts*
**Como** líder de generación **quiero** ver toda la información de un alumno **para** entender en qué materias está fallando.

- [ ] Encabezado: nombre, matrícula, plan de estudios, promedio general, faltas totales, estado con su **motivo**, listas a las que pertenece.
- [ ] Alertas (M-06): sin derecho, faltas al límite, muchos NE, actividades SC, deshonestidad académica (DA), materias reprobando.
- [ ] Una tarjeta por materia: profesor, grupo, horario; tabla `Actividad 1 … n | Promedio total | Faltas` con color en promedio y faltas; faltas como "4 / 5" (M-04).
- [ ] Códigos NE (No entregó), SD (Sin derecho), SC (Sin calificar), DA (Deshonestidad académica) se muestran con su etiqueta y tooltip.
- [ ] Botón "Corregir nombre" (apellidos / nombres) para los nombres que se separaron mal (M-12).
- [ ] Materias ordenadas de peor a mejor promedio.
- [ ] Botón "Volver a alumnos" que conserva búsqueda y filtros.

---

## E6 · Resumen administrativo

### HU-18 · Indicadores principales — *Must · 3 pts*
- [ ] Tarjetas: alumnos monitoreados, promedio general, alumnos en Crítico, en Preventivo, en Correcto y última carga.
- [ ] Clic en una tarjeta de estado abre Alumnos filtrado (M-09).

### HU-19 · Gráficas de desempeño — *Must · 5 pts*
- [ ] Distribución por estado (dona), distribución de promedios por rango (barras), materias con menor promedio (barras horizontales, top 10), alumnos por estado de faltas (barras).
- [ ] Todas respetan el selector de lista (M-03).
- [ ] Clic en un segmento de la dona abre Alumnos con ese estado (M-09).

### HU-20 · Estado vacío — *Must · 1 pt*
- [ ] Sin datos: gráficas vacías con el mensaje "Aún no hay datos en el sistema" y botón **Cargar datos**.

### HU-21 · Evolución del desempeño — *Should · 4 pts* (M-05)
**Como** líder de generación **quiero** saber qué alumnos van empeorando entre una carga y otra **para** actuar antes de que lleguen a rojo.

- [ ] Cada carga confirmada guarda un corte por alumno (`07` §9.1).
- [ ] Tendencia por alumno: Empeora / Mejora / Estable / Sin historial según `07` §9.2 (umbral 2 puntos, configurable).
- [ ] Menú principal: línea del promedio general y del % en Crítico por carga + "N empeoraron · N mejoraron" (clic → Alumnos filtrado).
- [ ] Alumnos: flecha de tendencia junto al promedio y chip "Empeoraron".
- [ ] Detalle: tendencia, mini-gráfica del promedio por carga y faltas nuevas desde la última carga.
- [ ] Con una sola carga: "La evolución aparecerá cuando cargues datos más de una vez".

### HU-22 · Alumnos con mayor riesgo — *Should · 2 pts*
- [ ] Tabla de los 10 alumnos con peor promedio/faltas (entre Crítico y Preventivo) con enlace a su detalle.

---

## E7 · Configuración y reportes

### HU-23 · Umbrales configurables — *Should · 3 pts* (M-08)
- [ ] En Perfil → Umbrales: límites de calificación (verde/amarillo), % del límite de faltas (amarillo/rojo), regla fija para materias sin límite y cambio mínimo de la evolución, con vista previa del resultado.
- [ ] Botón "Restaurar valores por defecto".

### HU-24 · Exportar reporte — *Should · 3 pts* (M-07)
- [ ] Botón "Exportar" en Alumnos que descarga la tabla visible (con filtros y orden) en `.xlsx`/`.csv`.

### HU-25 · Respaldo y borrado de datos — *Could · 2 pts*
- [ ] Descargar respaldo de la base de datos.
- [ ] "Borrar todos los datos académicos" pide contraseña y confirmación; no borra la cuenta.

### HU-26 · Preferencias: tema y formato de nombres — *Should · 3 pts* (M-12, M-13)
**Como** líder de generación **quiero** elegir el tema de la aplicación y cómo se muestran los nombres **para** trabajar cómodo.

- [ ] Perfil → Preferencias: Tema (Claro / Oscuro / Igual que el sistema) y Mostrar nombres (Nombres Apellidos / Apellidos Nombres).
- [ ] Se guardan en la cuenta al elegir (toast) y se aplican al iniciar sesión; el botón ◐ de la barra superior cambia la misma preferencia.
- [ ] Al importar se separan apellidos y nombres con las reglas de `07` §8; una corrección manual no se sobrescribe.
- [ ] El formato de nombres aplica a tabla, detalle, gráficas, top de riesgo y exportación.

---

## Won't (v1)
- Varios usuarios y roles · Correo en la cuenta / recuperación de contraseña por correo · Datos financieros · App de escritorio con Electron / `.exe` empaquetado.

---

## Definition of Ready (para entrar a un sprint)
- La historia tiene criterios de aceptación y estimación.
- Las decisiones que la afectan están registradas en `00` §4.
- Si tiene interfaz, existe prototipo validado por la PO.

## Definition of Done
- Cumple todos los criterios de aceptación.
- PR revisado y aceptado por el Scrum Master; sin conflictos con `develop`.
- Pruebas (`npm test`) pasan; reglas nuevas tienen prueba.
- Funciona con el Excel de prueba y en tema claro y oscuro.
- Sin `console.log` de depuración; documentación de `context/` actualizada si cambió algo.
- La PO lo validó (columna "Validación PO" del tablero).
