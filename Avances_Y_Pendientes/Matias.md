# Matías Hernández Garrido · Frontend

**Fecha de revisión:** 4 de noviembre de 2026 · **Revisó:** Calixto Isaac (Scrum Master)

> **Decisión D-01 actualizada:** el backend pasa a **Python + FastAPI** (aprobado por el Scrum Master, 4 nov 2026). **Para ti no cambia nada:** el frontend sigue siendo HTML/CSS/JS sin frameworks y las rutas `/api/...` mantienen el mismo contrato (`context/06`). FastAPI sirve `public/` igual que Express.

---

## 1. Tareas completadas (falta PR a `develop`)

Las tres ramas se probaron **en un navegador real contra el servidor FastAPI**, con todas las ramas del equipo juntas y sin conflictos.

| Issue | Rama | Verificación |
|---|---|---|
| **#5** · [HU-02] Iniciar sesión | `feature/5-login` (`c6a6efa`) | ✅ Solo hay formulario de acceso (sin "Crea tu cuenta"). Con datos incorrectos muestra "Usuario o contraseña incorrectos.". Enter envía el formulario, aparece "Entrando…", redirige a `/app#resumen`, y sin sesión `/app` regresa al login. Ya no llama a `/auth/status` ni a `/auth/setup`. **Esto resuelve el pendiente que señalaba el informe de Sebastián.** |
| **#7** · [T-10] Sidebar | `feature/7-sidebar` (`000f797`) | ✅ Menú principal, Cargar datos, Alumnos y Perfil. Navegación por `#vista/parámetro` lista para `#alumnos/<matricula>`. |
| **#8** · [T-07] Chart.js e Inter locales | `feature/8-vendor-local` (`deb2709`) | ✅ La aplicación no carga ningún recurso externo: funciona sin internet. |

---

## 2. Correcciones

No hay correcciones bloqueantes.

- [ ] **Errores del servidor:** cuando Sebastián haga su corrección C1, los errores de validación llegarán como `400 { error, code: "VALIDACION" }`. Verifica que `UI.api` muestre `error` en los toasts de las vistas nuevas.
- [ ] **Menú principal:** `inicio.js` llama a `/api/resumen`, que todavía no existe (#34 de Sebastián), y por eso muestra "Aún no hay datos" aunque haya datos cargados. Es lo esperado por ahora; no lo cambies.

---

## 3. Pendientes

### Arrastrado del Sprint 1 (urgente). El backend ya está listo para estas vistas.
| Issue | Tarea | Pts | API que usa |
|---|---|---|---|
| #15 | [HU-05] Zona para arrastrar o seleccionar el Excel | 3 | `POST /api/importaciones/monitoreo` (413/415/422) |
| #16 | [HU-06] Previsualización del Excel antes de guardar | 5 | respuesta de la previa, `GET /api/importaciones/:id/muestra`, `POST …/confirmar`, `DELETE …/:id` |
| #17 | [HU-07] Notificación "Datos cargados correctamente" | 1 | `resultado.alumnos` de la confirmación |
| #21 | [HU-13] Tabla de alumnos | 3 | `GET /api/alumnos` (estado, `motivoEstado`, `alertas`, totales) |

Para probar sin datos reales, usa `test/fixtures/monitoreo-muestra.xlsx` de Uziel (#9): 15 alumnos, con 8 en Correcto, 5 en Preventivo, 1 en Crítico y 1 baja.

### Sprint 2 (2–8 nov)
| Issue | Tarea | Pts | Depende de |
|---|---|---|---|
| #23 | Buscador por nombre y matrícula | 2 | #21 |
| #25 | Vista de detalle del alumno | 5 | **#20 de Sebastián (pendiente)** |
| #28 | Cargar una lista de seguimiento desde Alumnos | 3 | #27 |
| #29 | Selector "Mostrar: Todos / lista" | 2 | #27 |
| #33 | Vista Perfil: cuenta y contraseña | 3 | #32 |
| #35 | Tarjetas de indicadores y estado vacío del Menú principal | 2 | #34 |
| #36 | Gráficas del Menú principal con Chart.js | 5 | #34 |
| #41 | Umbrales configurables en Perfil (junto con Sebastián) | 3 | #41 API |

**Orden sugerido:** #15 → #16 → #17 → #21 → #23. Mientras tanto Sebastián termina #20, #32 y #34.

---

## 4. Cómo entregar
1. **Hoy:** abre tres PR hacia `develop`, uno por rama: `feature/8-vendor-local`, `feature/5-login` y `feature/7-sidebar`. No chocan entre sí.
2. Para arrancar el servidor sin Node, mientras Uziel termina SEMA.bat:
   ```
   py -3 -m venv .venv
   .venv\Scripts\python -m pip install -r requirements.txt
   .venv\Scripts\python -m uvicorn sema.main:app --host 127.0.0.1 --port 3000
   ```
   (Requiere que ya esté integrado el PR del backend de Sebastián.)
3. Ramas nuevas desde `develop` actualizado: `feature/15-dropzone`, `feature/16-previa`, etc.
