# 03 · Arquitectura y convenciones

## 1. Vista general

```
┌──────────────── Navegador (localhost:3000) ────────────────┐
│ login.html · app.html                                       │
│ public/js/*.js  (módulos IIFE: Resumen, CargarDatos, ...)   │
│ UI kit (UI.api, UI.toast, ...) · Chart.js (vendor)          │
└───────────────┬────────────────────────────────────────────┘
                │ fetch /api/*  (JSON · Authorization: Bearer <JWT>)
┌───────────────▼──────────────── Node.js + Express ─────────┐
│ routes/      → valida la petición y responde (capa HTTP)    │
│ services/    → casos de uso: importar, listar alumnos, ...  │
│ lib/         → db, auth, indicadores (reglas puras), config │
└───────────────┬────────────────────────────────────────────┘
                │ better-sqlite3 (síncrono, transacciones)
          data/app.db  (SQLite, WAL)   data/jwt.secret
```

**Reglas de capas**

1. `routes/` **no** escribe SQL complejo ni reglas de negocio: llama a `services/`.
2. `services/` usa `lib/db.js` y `lib/indicadores.js`. Las consultas viven en el servicio con `db.prepare(...)` al cargar el módulo.
3. `lib/indicadores.js` contiene **funciones puras** (sin base de datos ni Express): reciben números y umbrales y devuelven estados. Se prueban con `node:test`.
4. El frontend **nunca** calcula estados por su cuenta: usa el `estado` que manda la API (así tabla, detalle y gráficas coinciden).

## 2. Estructura de carpetas (objetivo)

```
SEMA-Sistema-de-Evaluacion-y-Monitoreo-Academico/
├── SEMA.bat                      # Acceso directo: instala, arranca y abre el navegador
├── server.js                     # Express: seguridad, rutas, estáticos, arranque
├── package.json                  # name: "sema"
├── .env.example
├── .gitattributes                # finales de línea (ver §6)
├── .github/
│   ├── CODEOWNERS                # * @CalixtoIsaac
│   └── pull_request_template.md
├── lib/
│   ├── db.js                     # conexión, PRAGMAs, migraciones (user_version)
│   ├── schema.sql                # CREATE TABLE … (ver 04_Modelo_Datos.md)
│   ├── auth.js                   # JWT, requireAuth, rateLimit, secreto persistente
│   ├── indicadores.js            # reglas: estadoCalificacion, estadoFaltas (% del límite), estado general, alertas, tendencia, ordenar
│   ├── nombres.js                # separarNombre(): apellidos / nombres, partículas y compuestos (07 §8)
│   ├── configuracion.js          # leer/guardar umbrales (tabla configuracion)
│   └── texto.js                  # normalizar(), quitar acentos, parsear números/códigos
├── services/
│   ├── excel-monitoreo.js        # lee el Excel de la escuela → filas normalizadas
│   ├── excel-lista.js            # lee el Excel de lista (nombre + matrícula)
│   ├── importador.js             # previa → confirmar (transacción), cortes
│   ├── alumnos.js                # lista con indicadores, detalle, alta manual
│   ├── listas.js                 # listas de seguimiento
│   └── resumen.js                # datos del dashboard
├── routes/
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
├── test/
│   ├── indicadores.test.js
│   ├── nombres.test.js
│   ├── excel-monitoreo.test.js
│   └── fixtures/monitoreo-muestra.xlsx · lista-muestra.xlsx   # SOLO datos ficticios
├── data/                         # app.db, jwt.secret (ignorados por git)
└── context/                      # documentación del proyecto
```

> **Tema (M-13):** `theme.js` sigue aplicando el tema desde `localStorage` antes de pintar (evita el parpadeo). Al iniciar sesión, `app.js` lee `user.tema` de `/api/auth/me`, lo aplica y lo guarda en `localStorage`; Perfil y el botón ◐ lo cambian con `PUT /api/cuenta/preferencias`.

> **Limpieza pendiente (T-01):** hoy la raíz y la carpeta `plantilla-express-sqlite/` tienen el mismo código. Se borra la carpeta duplicada y el módulo de ejemplo *Notas* (`routes/notas.js`, `public/js/notas.js`, tabla `notas`).

## 3. Arranque y acceso directo

`SEMA.bat` (guardado con finales de línea CRLF):

```bat
@echo off
title SEMA - Sistema de Evaluacion y Monitoreo Academico
cd /d "%~dp0"
where node >nul 2>nul || (echo Instala Node.js 20 o superior desde https://nodejs.org & pause & exit /b 1)
if not exist node_modules (echo Instalando dependencias, solo la primera vez... & call npm install --omit=dev || (pause & exit /b 1))
if not exist .env copy .env.example .env >nul
call npm start
pause
```

En `server.js`:

- Escuchar en `127.0.0.1` (no en toda la red).
- Al quedar listo, si `OPEN_BROWSER` no es `false`, abrir `http://localhost:PORT` (`start "" <url>` en Windows con `child_process`).
- Si el puerto está ocupado (`EADDRINUSE`), consultar `GET /api/health`; si responde SEMA, abrir el navegador y salir con código 0.
- `npm run dev` pone `OPEN_BROWSER=false` para no abrir pestañas en cada reinicio.

Secreto JWT: si `JWT_SECRET` no está en `.env`, se genera uno y se guarda en `data/jwt.secret` (así la sesión no se cierra al reiniciar).

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

- `'use strict'` implícito (CommonJS) · `const`/`let`, nunca `var` · `async/await`.
- SQL siempre con parámetros (`?` o `@nombre`). Nunca concatenar datos del usuario.
- Todo dato que venga del usuario o del Excel se inserta en HTML con `UI.escape()`.
- Errores de la API: `{ "error": "mensaje para el usuario" }` + código HTTP correcto (ver `06`).
- Números del Excel: pasar siempre por `lib/texto.js → parsearCalificacion()` (maneja `"  "`, `NE`, `SD`, …).
- Nada de `console.log` en el código entregado; usar `console.error` solo para errores reales del servidor.
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
- [ ] npm test pasa
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

- `npm test` → `node --test test/`.
- Obligatorio probar: `lib/indicadores.js` (todos los umbrales, % del límite de faltas, estado combinado, tendencia y empates de orden), `lib/nombres.js` (partículas y compuestos) y `services/excel-monitoreo.js` (columnas faltantes, celdas con espacios, códigos NE/SD/SC/DA, BT, columna `Modalidad` duplicada).
- Prueba de rendimiento manual con el Excel real (no se sube): importar < 5 s.
