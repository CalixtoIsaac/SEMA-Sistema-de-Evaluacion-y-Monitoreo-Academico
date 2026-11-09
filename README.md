# SEMA · Sistema de Evaluación y Monitoreo Académico

Sistema de seguimiento académico que permite monitorear las **calificaciones**, las **faltas** y la **evolución del desempeño** de los alumnos. Facilita la identificación temprana de alumnos en riesgo académico mediante indicadores, reportes y alertas configurables.

SEMA es una aplicación web **local y de un solo usuario**: corre en la computadora de la escuela, se abre con un acceso directo y funciona **sin internet**.

> **Estado:** Sprint 2 completo en código (pendiente de validación de la PO y pruebas con el cliente). El backend usa FastAPI + SQLite; el frontend conserva HTML, CSS y JavaScript sin frameworks. La documentación completa está en [`context/`](context/).

---

## ¿Qué hace?

| Necesidad del cliente | Cómo la resuelve SEMA |
|---|---|
| Filtrar a los alumnos de último año | **Listas de seguimiento**: se sube un Excel con Matrícula y Nombre y se elige «Mostrar: Todos / 6.º semestre». |
| Ver por alumno sus faltas y promedios | **Tabla de alumnos** con promedio, faltas y estado; buscador, orden de peor a mejor y **detalle por materia**. |
| Usar colores rojo, amarillo y verde | **Semáforo** en tabla, detalle y gráficas, siempre con texto e ícono. |

Además: carga del **Excel de monitoreo** de la escuela con previsualización, **Menú principal** con indicadores y gráficas, **evolución del desempeño** entre cargas, **alertas**, **umbrales configurables**, **exportación** a Excel/CSV y tema claro/oscuro.

### Semáforo

| Estado | Promedio | Faltas (% del límite de la materia) |
|---|---|---|
| ✓ Correcto | ≥ 80 | menos de 50 % |
| ! Preventivo | 70 – 79.9 | 50 % a 79 % |
| ✕ Crítico | < 70 | 80 % o más |

El estado del alumno es **el peor entre promedio y faltas**. La calificación oficial de cada materia es la columna **Ponderado** del Excel. Detalle en [`context/07_Reglas_Negocio_Indicadores.md`](context/07_Reglas_Negocio_Indicadores.md).

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Servidor | Python ≥ 3.12 · FastAPI · Uvicorn |
| Base de datos | SQLite (archivo `data/app.db`) |
| Autenticación | JWT · bcrypt |
| Frontend | HTML, CSS y JavaScript **sin frameworks** (módulos IIFE y UI kit propio) |
| Excel y gráficas | `openpyxl` · Chart.js y fuente Inter (servidos localmente desde `public/vendor/`) |
| Pruebas | `pytest` para backend · `node:test` para herramientas |

---

## Instalación y arranque

**Requisitos:** Python 3.12 o superior. Node.js 20 o superior solo se necesita para las herramientas auxiliares y sus pruebas (el backend ya no usa Node). SQLite no se instala aparte.

**En la computadora del cliente:** doble clic en `SEMA.bat`. La primera vez crea el entorno de Python e instala las dependencias; después arranca el servidor y abre el navegador.

```powershell
git clone https://github.com/CalixtoIsaac/SEMA-Sistema-de-Evaluacion-y-Monitoreo-Academico.git
cd SEMA-Sistema-de-Evaluacion-y-Monitoreo-Academico
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
npm install
npm run dev
```

Abre **http://localhost:3000**. La aplicación inicia sesión con la cuenta local definida en D-04; consulta [`context/00_Indice_y_Decisiones.md`](context/00_Indice_y_Decisiones.md).

Para iniciar el servidor en modo normal usa `npm start`. Ambos comandos de npm ejecutan FastAPI con el Python del entorno `.venv`.

| Script | Para qué |
|---|---|
| `npm run dev` | Desarrollo: ejecuta Uvicorn y recarga al guardar cambios. |
| `npm start` | Ejecuta el servidor FastAPI. |
| `.\.venv\Scripts\python.exe -m pytest -q tests` | Pruebas del backend. |
| `npm test` | Pruebas de herramientas auxiliares con `node:test`. |
| `.\.venv\Scripts\python.exe -m scripts.reset_password` | Restablece la contraseña de la cuenta local. |
| `.\.venv\Scripts\python.exe scripts\rendimiento_5000.py` | Prueba de rendimiento con 5,000 alumnos sintéticos ([resultados](docs/rendimiento-5000.md)). |
| `npm run anonimizar` | Regenera los fixtures de `test/fixtures/` a partir de un Excel real (local; requiere Node 20+). |

Para regenerar los fixtures se necesita Node 20+: `node scripts/anonimizar-excel.js`. El Excel real nunca se sube.

---

## Estructura del proyecto

```
├── sema/                 # API FastAPI, autenticación, SQLite, Excel e indicadores
├── lib/schema.sql        # esquema SQLite v1 (las migraciones nuevas van en sema/db.py)
├── SEMA.bat              # acceso directo: instala, arranca y abre el navegador
├── public/               # login.html, app.html, css/, js/, vendor/
├── scripts/              # utilidades y herramientas auxiliares
├── tests/                # pruebas Python del backend
├── test/                 # pruebas Node y fixtures con datos FICTICIOS
├── data/                 # app.db y jwt.secret locales
├── docs/                 # resultados de rendimiento e informes históricos
└── context/              # documentación del proyecto (fuente de verdad)
```

El frontend nunca calcula estados; usa los que manda la API. Más detalle en [`context/03_Arquitectura_Convenciones.md`](context/03_Arquitectura_Convenciones.md).

---

## Documentación (`context/`)

| Documento | Contenido |
|---|---|
| [`00_Indice_y_Decisiones.md`](context/00_Indice_y_Decisiones.md) | Índice, equipo, glosario y decisiones D-01 a D-20 |
| [`01_Requerimientos_Tecnicos.md`](context/01_Requerimientos_Tecnicos.md) | Alcance, requerimientos funcionales y no funcionales, stack |
| [`02_Product_Backlog.md`](context/02_Product_Backlog.md) | Épicas, historias de usuario y criterios de aceptación |
| [`03_Arquitectura_Convenciones.md`](context/03_Arquitectura_Convenciones.md) | Carpetas, capas, convenciones de código y flujo de Git |
| [`04_Modelo_Datos.md`](context/04_Modelo_Datos.md) | Tablas SQLite, relaciones e integridad |
| [`05_UI_UX.md`](context/05_UI_UX.md) | Pantallas, semáforo, componentes y mejoras aprobadas |
| [`06_Especificacion_API.md`](context/06_Especificacion_API.md) | Endpoints, cuerpos, respuestas y errores |
| [`07_Reglas_Negocio_Indicadores.md`](context/07_Reglas_Negocio_Indicadores.md) | Promedios, estados, faltas, orden, nombres y evolución |
| [`08_Formato_Excel_Importacion.md`](context/08_Formato_Excel_Importacion.md) | Columnas del Excel de monitoreo y del Excel de lista |
| [`Sprints.md`](context/Sprints.md) | Sprints, milestones, labels e issues del tablero |

> **Regla de oro:** si un cambio contradice estos documentos, primero se actualiza el documento (con aprobación del Scrum Master) y después el código.

---

## Plan de trabajo

Scrum con **2 sprints de 1 semana** (lunes a viernes). Planning el lunes; Review con el cliente, Retrospectiva y release a `main` el viernes.

| Sprint | Fechas | Entregas |
|---|---|---|
| **Sprint 1** | 26 – 30 oct 2026 | v0.1 Base del proyecto · v0.2 Carga de Excel · v0.3 Monitoreo de alumnos |
| **Sprint 2** | 2 – 6 nov 2026 | v0.4 Seguimiento y cuenta · v0.5 Resumen administrativo · **v1.0 Entrega final** |

Tablero: GitHub Project «SEMA · Tablero Scrum» (Backlog → Por hacer → En progreso → En revisión → Validación PO → Hecho).

---

## Cómo contribuir

1. Toma un issue asignado a ti en el tablero (máximo 2 en progreso por persona).
2. Crea una rama desde `develop`: `feature/<n°issue>-<descripcion-corta>` (también `fix/`, `docs/`, `chore/`).
3. Commits con [Conventional Commits](https://www.conventionalcommits.org/es/) en español: `feat(alumnos): ordenar por promedio y faltas`.
4. Abre un Pull Request hacia **`develop`** con `Closes #<n°>` y llena la plantilla.
5. Solo el **Scrum Master** revisa y hace *Squash and merge*. Después, la Product Owner valida y cierra el issue.

Antes de abrir el PR: probaste con `test/fixtures/monitoreo-muestra.xlsx`, `npm test` pasa, revisaste tema claro y oscuro, y actualizaste `context/` si cambió una regla o un endpoint.

> ⚠️ **Nunca subas Excel con datos reales de alumnos** (son menores de edad). Para pruebas usa solo los archivos anonimizados de `test/fixtures/`.

---

## Equipo

| Rol | Integrante |
|---|---|
| Product Owner | Saraí Cecilio Rascón |
| Scrum Master | Calixto Isaac Galeana Medrano |
| Backend | Sebastián Huesca Ramírez |
| Base de datos y estructura | Uziel Armando García Duarte |
| Frontend | Matías Hernández Garrido |
