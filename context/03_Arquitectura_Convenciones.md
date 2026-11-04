# 03 · Arquitectura y convenciones

## 1. Vista general

```
┌──────────────── Navegador (localhost:3000) ────────────────┐
│ login.html · app.html                                       │
│ public/js/*.js  (módulos IIFE: Resumen, CargarDatos, ...)   │
│ UI kit (UI.api, UI.toast, ...) · Chart.js (vendor)          │
└───────────────┬────────────────────────────────────────────┘
                │ fetch /api/*  (JSON · Authorization: Bearer <JWT>)
┌────────────────────── FastAPI + Uvicorn ────────────────────┐
│ sema/main.py → registra API, autenticación y archivos web   │
│ sema/imports.py · sema/students.py → importación y alumnos  │
│ sema/excel.py · sema/indicators.py · sema/db.py             │
└───────────────┬────────────────────────────────────────────┘
                │ sqlite3 (transacciones)
          data/app.db  (SQLite, WAL)   data/jwt.secret
```

**Reglas de capas**

1. `sema/main.py` registra las rutas y los manejadores de errores; los módulos del backend aplican autenticación antes de acceder a recursos protegidos.
2. `sema/imports.py` coordina la previa y confirmación transaccional; `sema/excel.py` lee y normaliza el archivo; `sema/db.py` administra SQLite.
3. `sema/indicators.py` contiene las reglas de estado y resumen, sin depender de la interfaz. Se prueban con `pytest`.
4. El frontend **nunca** calcula estados por su cuenta: usa el `estado` que manda la API (así tabla, detalle y gráficas coinciden).

## 2. Estructura de carpetas (objetivo)

```
SEMA-Sistema-de-Evaluacion-y-Monitoreo-Academico/
├── SEMA.bat                      # Acceso directo planeado; aún pendiente
├── sema/
│   ├── main.py                   # FastAPI: rutas, errores, archivos estáticos y arranque
│   ├── auth.py                   # Cuenta inicial, JWT y autenticación
│   ├── db.py                     # SQLite, esquema y transacciones
│   ├── excel.py                  # Lectura y normalización de Excel
│   ├── imports.py                # Previa y confirmación de importaciones
│   ├── indicators.py             # Reglas de negocio del semáforo
│   └── students.py               # API de alumnos
├── server.js                     # Backend Node legado, pendiente de retirar
├── package.json                  # name: "sema"
├── requirements.txt              # Dependencias Python
├── .env.example
├── .gitattributes                # finales de línea (ver §6)
├── .github/
│   ├── CODEOWNERS                # * @CalixtoIsaac
│   └── pull_request_template.md
├── lib/                          # Backend Node legado, pendiente de retirar
│   ├── db.js                     # conexión, PRAGMAs, migraciones (user_version)
│   ├── schema.sql                # CREATE TABLE … (ver 04_Modelo_Datos.md)
│   ├── auth.js                   # JWT, requireAuth, rateLimit, secreto persistente
│   ├── indicadores.js            # reglas: estadoCalificacion, estadoFaltas (% del límite), estado general, alertas, tendencia, ordenar
│   ├── nombres.js                # separarNombre(): apellidos / nombres, partículas y compuestos (07 §8)
│   ├── configuracion.js          # leer/guardar umbrales (tabla configuracion)
│   └── texto.js                  # normalizar(), quitar acentos, parsear números/códigos
├── services/                     # Backend Node legado, pendiente de retirar
│   ├── excel-monitoreo.js        # lee el Excel de la escuela → filas normalizadas
│   ├── excel-lista.js            # lee el Excel de lista (nombre + matrícula)
│   ├── importador.js             # previa → confirmar (transacción), cortes
│   ├── alumnos.js                # lista con indicadores, detalle, alta manual
│   ├── listas.js                 # listas de seguimiento
│   └── resumen.js                # datos del dashboard
├── routes/                       # Backend Node legado, pendiente de retirar
│   ├── auth.js                   # /api/auth
│   ├── cuenta.js                 # /api/cuenta (usuario, contraseña, preferencias)
│   ├── importaciones.js          # /api/importaciones
│   ├── listas.js                 # /api/listas
│   ├── alumnos.js                # /api/alumnos, /api/inscripciones
│   ├── resumen.js                # /api/resumen
│   ├── catalogos.js              # /api/materias, /api/periodos
│   └── configuracion.js          # /api/configuracion
├── public/
│   ├── login.html · app.html
│   ├── css/   theme.css · base.css · login.css · app.css · semaforo.css
│   ├── js/    theme.js · ui-kit.js · app.js · graficas.js
│   │          orden-busqueda.js · resumen.js · cargar-datos.js · alumnos.js
│   │          alumno-detalle.js · perfil.js
│   ├── vendor/ chart.umd.min.js · inter/ (fuente local)
│   └── img/   logo.svg · favicon.ico
├── scripts/
│   ├── reset-password.js         # npm run reset-password → vuelve a Chuchito / contraseña por defecto
│   ├── github/crear-tablero.mjs  # crea labels, milestones, Project e issues a partir de context/Sprints.md
│   └── anonimizar-excel.js       # genera test/fixtures a partir de un Excel real (local, no se sube el real)
├── tests/                        # Pruebas del backend (pytest)
├── test/
│   ├── *.test.js                 # Pruebas de herramientas auxiliares (node:test)
│   └── fixtures/                 # SOLO datos ficticios
├── data/                         # app.db, jwt.secret (ignorados por git)
└── context/                      # documentación del proyecto
```

> **Tema (M-13):** `theme.js` sigue aplicando el tema desde `localStorage` antes de pintar (evita el parpadeo). Al iniciar sesión, `app.js` lee `user.tema` de `/api/auth/me`, lo aplica y lo guarda en `localStorage`; Perfil y el botón ◐ lo cambian con `PUT /api/cuenta/preferencias`.

> **Limpieza (T-01, hecha):** se borró la carpeta duplicada `plantilla-express-sqlite/` y el módulo de ejemplo *Notas* (`routes/notas.js`, `public/js/notas.js`, tabla `notas`).

## 3. Arranque y acceso directo

En Windows, prepara el entorno Python desde la raíz del repositorio:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
npm run dev
```

`npm start` ejecuta FastAPI sin recarga; ambos comandos sirven la aplicación en
`127.0.0.1:3000`. El acceso directo `SEMA.bat` sigue pendiente.

Secreto JWT: si no se define `JWT_SECRET`, se genera uno y se guarda en
`data/jwt.secret` (así la sesión no se cierra al reiniciar).

## 4. Convenciones de código

| Elemento | Convención | Ejemplo |
|---|---|---|
| Idioma | Español para dominio, mensajes y comentarios | `promedioGeneral`, "Alumno no encontrado." |
| Archivos | `kebab-case` | `alumno-detalle.js` |
| Variables y funciones JS | `camelCase` | `calcularEstadoFaltas()` |
| Módulos de vista (frontend) | `PascalCase`, IIFE con `mount(contenedor)` | `const Alumnos = (() => { … })();` |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_FILE_MB` |
| Tablas y columnas SQL | `snake_case`, tablas en plural | `inscripciones.limite_faltas` |
| Rutas API | sustantivos en plural, minúsculas | `/api/alumnos/:matricula` |
| JSON de la API | `camelCase` | `{ promedioGeneral, faltasTotal }` |
| CSS | clases `kebab-case`; colores **solo** con variables de `theme.css` | `.badge-critico` · `var(--danger-text)` |

**Reglas obligatorias**

- Python: seguir las convenciones del proyecto y usar tipos explícitos donde aporten claridad. JavaScript del frontend: `const`/`let`, nunca `var`.
- SQL siempre con parámetros (`?` o `@nombre`). Nunca concatenar datos del usuario.
- Todo dato que venga del usuario o del Excel se inserta en HTML con `UI.escape()`.
- Errores de la API: `{ "error": "mensaje para el usuario" }` + código HTTP correcto (ver `06`).
- Números del Excel: normalizarlos en `sema/excel.py` antes de calcular indicadores.
- Reportar errores de servidor con el manejo de excepciones de FastAPI; evitar salidas de depuración en producción.
- Funciones de más de ~50 líneas se dividen. Un archivo = una responsabilidad.
- Formato: 2 espacios, comillas simples, punto y coma, máximo ~110 caracteres por línea (EditorConfig).

## 5. Flujo de trabajo en Git

```
main      ●───────────────●──────────────●   (entregas: v0.1, v0.2 … v1.0, protegida)
           \             /              /
develop     ●──●──●──●──●──●──●──●──●──●     (integración, protegida)
              \    /      \    /
feature/12-…   ●──●        ●──●               (una rama por issue)
```

- **Ramas:** `feature/<n°issue>-<descripcion-corta>`, `fix/<n°issue>-…`, `docs/…`, `chore/…`. Ej.: `feature/14-previsualizar-excel`.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/es/) en español, en presente:
  - `feat(alumnos): ordenar por promedio y faltas`
  - `fix(importacion): ignorar celdas con espacios`
  - `docs(context): actualizar reglas de faltas`
  - Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`. Ámbitos: `auth`, `cuenta`, `importacion`, `listas`, `alumnos`, `detalle`, `resumen`, `config`, `ui`, `db`, `infra`.
- **Pull Requests** hacia `develop`, con `Closes #<n°>` en la descripción, capturas si hay cambios visuales y la plantilla llena.
- **Solo el Scrum Master** aprueba y hace *merge* (*Squash and merge*). Reglas de protección en `main` y `develop`: requerir PR, 1 aprobación de *Code Owners*, sin *push* directo.
- Al cerrar cada sprint: PR `develop → main` y etiqueta `v0.<n°sprint>` con notas de la versión.

**Plantilla de PR (`.github/pull_request_template.md`)**

```markdown
## ¿Qué cambia?
## Issue
Closes #
## ¿Cómo probarlo?
1.
## Capturas (si aplica)
## Checklist
- [ ] Probé con test/fixtures/monitoreo-muestra.xlsx
- [ ] `.\.venv\Scripts\python.exe -m pytest -q tests` pasa
- [ ] `npm test` pasa
- [ ] Revisé tema claro y oscuro
- [ ] Actualicé context/ si cambió una regla o un endpoint
```

## 6. Finales de línea y archivos ignorados

Hoy `git status` marca todos los archivos como modificados aunque no cambió su contenido: es un problema de finales de línea (CRLF/LF) entre Windows y el repositorio. Se corrige con `.gitattributes`:

```gitattributes
* text=auto eol=lf
*.bat text eol=crlf
*.xlsx binary
*.png binary
*.ico binary
```

Agregar a `.gitignore`:

```gitignore
# Datos reales de alumnos: NUNCA al repositorio
*.xlsx
*.xls
*.csv
!test/fixtures/*.xlsx
data/jwt.secret
```

## 7. Pruebas

- `.\.venv\Scripts\python.exe -m pytest -q tests` → pruebas de autenticación, Excel, importaciones, indicadores y alumnos.
- `npm test` → `node --test` para pruebas de herramientas auxiliares.
- Prueba de rendimiento manual con el Excel real (no se sube): importar < 5 s.
