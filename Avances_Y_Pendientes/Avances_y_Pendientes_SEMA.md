# SEMA · Avances y pendientes del equipo

**Fecha:** miércoles 4 de noviembre de 2026 (día 3 del Sprint 2) · **Elaboró:** Calixto Isaac Galeana Medrano, Scrum Master
**Base revisada:** `develop` en `20ad569`, más 9 ramas sin integrar. Todas se probaron juntas: no hay conflictos, pasan las 25 pruebas de Python y las 16 de Node, y la prueba completa en el navegador funciona.

---

## 1. Decisiones

| ID | Decisión | Quién | Fecha |
|---|---|---|---|
| **D-01 (actualizada)** | El backend pasa de Node.js/Express a **Python + FastAPI + SQLite**. El frontend sigue en HTML/CSS/JS sin frameworks. Se mantiene el contrato `/api` de `context/06`. Node queda solo para herramientas de desarrollo (anonimizador de Excel). | **Aprobó: Calixto Isaac (Scrum Master)** · propuesta de Sebastián, avalada por Saraí (PO) | 4 nov 2026 |
| D-01a | Python 3.12 o superior en la computadora del cliente. SEMA.bat lo verifica e instala las dependencias. | Scrum Master | 4 nov 2026 |
| D-01b | Las reglas de indicadores (#13) se implementan **una sola vez**, en `sema/indicators.py`. Uziel las valida y completa sus pruebas. No habrá versión en JavaScript. | Scrum Master | 4 nov 2026 |

---

## 2. Avance del Sprint 1 (26 oct – 1 nov · 65 puntos)

| Estado | Puntos | Issues |
|---|---|---|
| ✅ Completado (integrado en `develop` o confirmado) | 13 | #1, #2, #3, #10, #11 |
| 🟦 Terminado y verificado, falta PR/merge | 24 | #4, #5, #7, #8, #9, #12, #14, #19 |
| ⬜ Pendiente (pasa al Sprint 2) | 28 | #6, #13, #15, #16, #17, #18, #20, #21, #22 |

**Avance real: 37 de 65 puntos (57 %) terminados; 13 de 65 (20 %) ya cerrados.**
El Scrum Master confirmó el 4 nov 2026 la protección de ramas (#2) y las tareas de Saraí #10 y #11.

### Detalle por issue

| # | Tarea | Responsable | Estado |
|---|---|---|---|
| 1 | Limpiar repo, renombrar a SEMA, paleta azul | Calixto | ✅ Integrado (`51b7af8`) |
| 2 | Proteger ramas, CODEOWNERS, plantilla de PR | Calixto | ✅ Completado · protección de ramas confirmada |
| 3 | Esquema de BD v1 y migraciones | Uziel | ✅ Integrado (PR #50) |
| 4 | Cuenta "Chuchito" y JWT | Sebastián | 🟦 Terminado · correcciones C1, C3 |
| 5 | Iniciar sesión | Matías | 🟦 Terminado · probado en navegador |
| 6 | SEMA.bat | Uziel | ⬜ Pendiente · **rehacer para Python** |
| 7 | Sidebar | Matías | 🟦 Terminado |
| 8 | Chart.js e Inter locales | Matías | 🟦 Terminado |
| 9 | Excel de prueba anonimizado | Uziel | 🟦 Terminado · 16/16 pruebas |
| 10 | Prototipos y validación con el cliente | Saraí | ✅ Completado (confirmado por el Scrum Master) |
| 11 | Presentar decisiones D-08 a D-20 | Saraí | ✅ Completado (confirmado por el Scrum Master) |
| 12 | Lector del Excel de monitoreo | Sebastián | 🟦 Terminado · **reasignar en GitHub** (aparece a nombre de Uziel) |
| 13 | Reglas de indicadores y nombres | Uziel | ⬜ Redefinido: validar `sema/indicators.py` |
| 14 | API de previa y confirmación | Sebastián | 🟦 Terminado |
| 15 | Zona para arrastrar el Excel | Matías | ⬜ Pendiente (backend listo) |
| 16 | Previsualización del Excel | Matías | ⬜ Pendiente (backend listo) |
| 17 | Notificación de carga | Matías | ⬜ Pendiente |
| 18 | Validar la carga con el Excel real y el cliente | Saraí | ⬜ Pendiente · posible en cuanto se integren #14, #15 y #16 |
| 19 | API de alumnos | Sebastián | 🟦 Terminado · corrección C2 |
| 20 | API del detalle del alumno | Sebastián | ⬜ **Pendiente (no se mencionó en su informe)** |
| 21 | Tabla de alumnos | Matías | ⬜ Pendiente (backend listo) |
| 22 | Semáforo de colores | Uziel | ⬜ Pendiente |

---

## 3. Correcciones generales

| # | Corrección | Responsable | Prioridad |
|---|---|---|---|
| G1 | Errores de validación con formato `{error, code}` (C1) | Sebastián | Alta, antes del PR |
| G2 | Tendencia contra el corte anterior del periodo (C2) | Sebastián | Alta, antes del PR |
| G3 | Límite de intentos solo para logins fallidos (C3) | Sebastián | Alta, antes del PR |
| G4 | Comandos de Windows en `RUN_BACKEND.md` (C4) | Sebastián | Alta, antes del PR |
| G5 | No integrar los informes de auditoría ni las evidencias de Codex (C5) | Sebastián | Alta, antes del PR |
| G6 | SEMA.bat para Python (#6) | Uziel | Alta |
| G7 | Registrar D-01 actualizada en `context/00_Indice_y_Decisiones.md` | Calixto | Alta, hoy |
| G8 | README, `context/03` y `context/06` a FastAPI (C7) | Sebastián | Media, después del merge |
| G9 | Ajustar el texto de los issues que mencionan Node (`multer`, `exceljs`, `npm run`, `routes/*.js`) y las fechas de `context/Sprints.md` para lo que se arrastra | Saraí (PO) | Media |
| G10 | Retirar Express (`server.js`, `routes/`, `lib/auth.js`, `lib/db.js`) (C8) | Sebastián | Media, PR aparte |
| G11 | Reasignar #12 a Sebastián en GitHub | Calixto | Hoy |
| G12 | Cambio de contraseña (#32): hoy no existe y la contraseña D-04 es pública en los documentos | Sebastián | Alta en el Sprint 2 |
| G13 | Corregir la URL del repo en el informe de Sebastián (`Calixtolsaac` → `CalixtoIsaac`) | Sebastián | Baja |

---

## 4. Pendientes del Sprint 2 (2–8 nov · 85 puntos + 28 arrastrados)

| Responsable | Arrastrado del Sprint 1 | Sprint 2 |
|---|---|---|
| **Sebastián** (backend) | #20 | #32 (prioridad), #27, #30, #34, #39, #41, #43 |
| **Matías** (frontend) | #15, #16, #17, #21 | #23, #25, #28, #29, #33, #35, #36, #41 |
| **Uziel** (BD y estructura) | #6, #13, #22 | #24, #26, #31, #37, #38, #42, #44, #49 |
| **Saraí** (PO) | #18 | #40, #45, #46 · aceptación de las historias integradas · G9 |
| **Calixto** (SM) | — | G7, G11 · revisar e integrar los PR · release v0.1–v0.3 · #48 |
| **Todos** | — | #47 corrección de errores y pulido visual |

> **Riesgo de calendario:** quedan 4 días (5 al 8 nov) para 28 puntos arrastrados y 85 del Sprint 2. Sugerencia para el Planning de hoy: proteger la ruta crítica **carga del Excel → tabla → detalle → resumen** (#15, #16, #17, #21, #20, #25, #34, #35, #6, #44) y mover a "Could" #36, #37, #42 y #43 si no da tiempo. Confirmarlo con Saraí.

---

## 5. Plan de integración (orden de merge)

| Paso | PR → `develop` | Autor | Cuándo |
|---|---|---|---|
| 1 | `feature/9-anonimizar-excel` | Uziel | Hoy |
| 2 | `feature/8-vendor-local` | Matías | Hoy |
| 3 | `feature/5-login` | Matías | Hoy |
| 4 | `feature/7-sidebar` | Matías | Hoy |
| 5 | `feature/19-api-alumnos` (incluye las 5 ramas apiladas: migración, #4, #12, #14, #19) | Sebastián | Cuando termine C1–C5 |
| 6 | Validación funcional de Saraí sobre `develop` | Saraí | Después del paso 5 |
| 7 | `chore/retirar-express` y documentación | Sebastián | Después del paso 6 |
| 8 | Release `develop` → `main` con etiqueta `v0.3` | Calixto | Cuando cierren v0.1–v0.3 |

Se probó el orden 1–5 en una copia: **sin conflictos**.
