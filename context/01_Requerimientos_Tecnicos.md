# 01 · Requerimientos técnicos

## 1. Objetivo

Que el líder de generación pueda, en pocos clics, **cargar el Excel de monitoreo de la escuela**, quedarse solo con los alumnos que le interesan (Excel de lista) y **ver de inmediato quién está en riesgo** por calificación o por faltas, con colores verde / amarillo / rojo.

## 2. Alcance

**Incluye**

- Aplicación web **local de un solo usuario** que se abre con un acceso directo (`.bat`).
- Login con una única cuenta y edición de usuario y contraseña (sin correo, D-17).
- Carga de datos por **Excel** (principal) y por **formulario** (secundario).
- Listas de seguimiento a partir de un Excel con Matrícula y Nombre.
- Tabla de alumnos con buscador, chips de estado, orden, semáforo y exportación.
- Detalle del alumno con calificaciones por actividad y faltas por materia.
- Resumen administrativo con gráficas, indicadores y alertas.
- Preferencias del usuario: tema claro/oscuro y formato de nombres.

**No incluye (fuera de alcance v1)**

- Varios usuarios o roles.
- Uso en red / servidor en internet.
- Envío de correos o notificaciones fuera de la app.
- Edición del Excel original o sincronización con el sistema escolar.
- Datos financieros (columna "Deuda del alumno") — ver D-14.

## 3. Requerimientos funcionales

| ID | Requerimiento | Prioridad |
|---|---|---|
| **RF-01** | **Acceso directo.** Un archivo `SEMA.bat` (y un acceso directo `.lnk` con ícono) instala dependencias si faltan, arranca el servidor (`npm start`) y abre el navegador en `http://localhost:3000`. Si el servidor ya está corriendo, solo abre el navegador. | Must |
| **RF-02** | **Login** con usuario y contraseña. Al iniciar sesión se redirige al Resumen Administrativo. Sesión de 8 h. | Must |
| **RF-03** | **Cuenta por defecto** `Chuchito` / `Administrador*Chuchito*123`, creada automáticamente si la base de datos no tiene usuarios. | Must |
| **RF-04** | **Perfil → Cuenta:** cambiar nombre y usuario (pide la contraseña actual) y cambiar contraseña. **No hay correo** (D-17). | Must |
| **RF-05** | **Sidebar** con: Menú principal (Resumen), Cargar datos, Alumnos, Perfil y Cerrar sesión. | Must |
| **RF-06** | **Resumen administrativo** con indicadores y gráficas (ver `05_UI_UX.md` §5). Sin datos: gráficas vacías, mensaje "Aún no hay datos en el sistema" y botón a Cargar datos. | Must |
| **RF-07** | **Cargar Excel de monitoreo** arrastrando o seleccionando el archivo (`.xlsx`, máx. 15 MB). | Must |
| **RF-08** | **Previsualización** antes de guardar: primeras filas, número de alumnos, materias y filas que se cargarán, periodo detectado y advertencias. Botones Confirmar / Cancelar. | Must |
| **RF-09** | **Notificación** "Datos cargados correctamente" (toast) al confirmar una carga. | Must |
| **RF-10** | **Formulario manual** para dar de alta un alumno y sus materias (actividades, faltas y calificación). | Should |
| **RF-11** | **Historial de cargas** (fecha, archivo, alumnos, filas, modo, estado). | Could |
| **RF-12** | **Excel de lista:** subir un Excel con Matrícula y Nombre (formato del cliente, `08` §2) para crear una lista de seguimiento con nombre (ej. "6.º semestre"). Reportar matrículas no encontradas y nombres distintos. | Must |
| **RF-13** | **Tabla de alumnos**: Nombre, Matrícula, Promedio general, Faltas (M-01), Estado (peor entre promedio y faltas, D-11). Muestra todos o solo los de una lista de seguimiento (M-03). **Chips de estado** con conteo para filtrar (M-02). | Must |
| **RF-14** | **Buscador** por nombre o matrícula, por palabras en cualquier orden y sin distinguir mayúsculas ni acentos (M-11), en la parte superior. | Must |
| **RF-15** | **Filtros de orden** `PROMEDIO [ ]` y `FALTAS [ ]`, de peor a mejor, combinables (ver regla en `07` §6). | Must |
| **RF-16** | **Detalle del alumno**: datos generales, motivo del estado, alertas (M-06) y, por cada materia, tabla Actividad 1…n · Promedio total · Faltas como "faltas / límite" (M-04), con colores. | Must |
| **RF-17** | **Umbrales configurables** de calificación y de % del límite de faltas (M-08). | Should |
| **RF-18** | **Evolución del desempeño**: tendencia por alumno y gráfica del grupo por carga (`07` §9) (M-05). | Should |
| **RF-19** | **Exportar reporte** de la tabla filtrada (alumnos en riesgo) a Excel o CSV (M-07). | Should |
| **RF-20** | **Respaldo**: descargar la base de datos y opción "borrar todos los datos" protegida con contraseña. | Could |
| **RF-21** | **Preferencia de tema** claro / oscuro / igual que el sistema en Perfil, guardada en la cuenta (M-13). | Should |
| **RF-22** | **Formato de nombres**: mostrar "Nombres Apellidos" (por defecto) o "Apellidos Nombres", con corrección manual por alumno (M-12, `07` §8). | Should |
| **RF-23** | **Paleta institucional azul** (M-10, `05` §3.1). | Should |

## 4. Requerimientos no funcionales

| ID | Requerimiento |
|---|---|
| **RNF-01 Rendimiento** | Importar el Excel actual (≈3,700 filas × 94 columnas, 1.2 MB) en **menos de 5 s**. La tabla de alumnos responde al teclear en el buscador en **< 200 ms** con 5,000 alumnos. |
| **RNF-02 Portabilidad** | Windows 10/11 con Node.js 20 LTS o superior. Sin servidores externos: la base de datos es el archivo `data/app.db`. |
| **RNF-03 Sin internet** | Todo (fuente Inter, Chart.js) se sirve desde `public/vendor/`. La app debe funcionar con el cable desconectado. |
| **RNF-04 Seguridad** | Contraseñas con bcrypt; JWT firmado con un secreto que se genera solo en `data/jwt.secret`; consultas SQL con parámetros; escape de HTML en toda la interfaz; límite de intentos de login; el servidor escucha solo en `127.0.0.1`. |
| **RNF-05 Privacidad** | No se suben datos reales a GitHub, ni el Excel de monitoreo ni el de matrículas (`.gitignore` bloquea `*.xlsx`, `*.xls`, `*.csv` fuera de `test/fixtures/`). No se importa información financiera. |
| **RNF-06 Usabilidad** | Español, lenguaje sencillo. El color nunca es la única señal: cada estado lleva texto ("Crítico") e ícono. Contraste AA. Funciona a 1366×768 y en tema claro y oscuro. |
| **RNF-07 Confiabilidad** | Las importaciones se hacen en **una transacción**: si algo falla, no se guarda nada. Errores con mensaje claro y sin perder lo ya cargado. |
| **RNF-08 Mantenibilidad** | Reglas de negocio en funciones puras (`lib/indicadores.js`) con pruebas `node:test`. Convenciones de `03_Arquitectura_Convenciones.md`. |

## 5. Stack tecnológico

| Capa | Tecnología | Estado |
|---|---|---|
| Runtime | Node.js ≥ 20 (recomendado 22 LTS) | Ya en la plantilla |
| Servidor | Express 4 | Ya en la plantilla |
| Base de datos | SQLite con `better-sqlite3` (modo WAL, llaves foráneas activas) | Ya en la plantilla |
| Autenticación | `jsonwebtoken` (HS256, 8 h) + `bcryptjs` | Ya en la plantilla |
| Configuración | `dotenv` | Ya en la plantilla |
| Frontend | HTML + CSS + JavaScript sin frameworks, módulos IIFE, UI kit propio | Ya en la plantilla |
| **Subida de archivos** | **`multer`** (memoria, límite 15 MB, solo `.xlsx`) | **Agregar** |
| **Lectura de Excel** | **`exceljs`** (lee `.xlsx` desde un buffer) | **Agregar** |
| **Gráficas** | **Chart.js 4** (archivo `chart.umd.min.js` copiado a `public/vendor/`) | **Agregar** |
| Pruebas | `node:test` + `node:assert` (incluidos en Node) | Agregar scripts |

> Si el cliente necesitara subir `.xls` (formato viejo) o `.csv`, se cambiaría `exceljs` por SheetJS (`xlsx`) instalado desde `cdn.sheetjs.com` (la versión del registro npm está desactualizada). Decisión del Scrum Master.

## 6. Flujo general

```
SEMA.bat ──► npm start ──► servidor en 127.0.0.1:3000 ──► abre el navegador
                                                              │
                                                       Login (Chuchito)
                                                              │
                                                Resumen administrativo
                                    ┌──────────────┬──────────┴───────┬────────────┐
                               Cargar datos     Alumnos           Perfil      Cerrar sesión
                          (Excel / formulario) (tabla, lista,    (cuenta,
                                   │            filtros) ──► Detalle  preferencias,
                           Previsualización                 del alumno  umbrales)
                                   │
                         Confirmar ──► toast "Datos cargados correctamente"
```

## 7. Supuestos

- El Excel de monitoreo mantiene los mismos encabezados que el archivo de ejemplo (`Monitoreo_de_alumnos_2.xlsx`, hoja `Salida`). Ver `08_Formato_Excel_Importacion.md`.
- El Excel de monitoreo **no trae el semestre** del alumno; por eso existe el Excel de lista (ejemplo del cliente: 173 matrículas, todas presentes en el Excel de monitoreo).
- Una sola persona usa la app en una sola computadora.
- El cliente puede subir el Excel varias veces durante el periodo; cada carga actualiza los datos y guarda un corte para la evolución.
