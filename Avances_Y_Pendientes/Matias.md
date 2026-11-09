# Matías Hernández Garrido · Frontend

**Fecha de revisión:** jueves 5 de noviembre de 2026 · **Revisó:** Calixto Isaac (Scrum Master)

> **Desde hoy:** toda rama nueva sale de `develop` actualizado y su PR va hacia `develop` (decisión D-21). Ya no uses ramas viejas.

---

## 1. Tareas completadas

| Issue | Estado | Nota |
|---|---|---|
| **#5** · [HU-02] Iniciar sesión | ✅ Integrado (PR #55) | |
| **#7** · [T-10] Sidebar | ✅ Integrado (PR #54) | |
| **#8** · [T-07] Chart.js e Inter locales | ✅ Integrado (PR #56) | |
| **#15** · [HU-05] Zona para arrastrar el Excel | ✅ Integrado (PR #58) | Lo hizo el Scrum Master como suplente para no atrasar el sprint. Código en `public/js/cargar.js`. |
| **#16** · [HU-06] Previsualización | ✅ Integrado (PR #58) | Igual que la anterior, en `public/js/cargar.js`. |
| **#17** · [HU-07] Notificación de carga | ✅ Integrado (PR #58) | `UI.toast()` ahora acepta un botón (`{ label, href }`). |
| **#21** · [HU-13] Tabla de alumnos | ✅ Integrado (PR #58) | Código en `public/js/alumnos.js`. Tus siguientes vistas parten de aquí. |
| **#24** · [HU-15] Ordenar de peor a mejor | 🟦 **Terminado en `feature/24-ordenar`, falta PR** | Revisado: se fusiona con `develop` sin conflictos y pasan 22/22 pruebas de Node. El issue está asignado a Uziel: el Scrum Master lo reasigna a ti. |

Las vistas de #15–#17 y #21 se probaron con `test/fixtures/monitoreo-muestra.xlsx`: 15 alumnos (8 en Correcto, 5 en Preventivo, 1 en Crítico y 1 baja), en tema claro y oscuro y a 390 px de ancho. **Léelas antes de seguir:** ahí están los patrones que vas a reutilizar (estados de carga, vacío y error, paginación y `sessionStorage`).

Herramientas nuevas del UI kit (`public/js/ui-kit.js`):
- `UI.upload(ruta, archivo)` para subir archivos.
- `UI.badgeEstado(estado, { motivo })`, `UI.estadoClase()` y `UI.tendencia()` para el semáforo.
- Íconos nuevos: `x`, `file`, `warning`, `checkCircle`, `xCircle`, `arrowUp`, `arrowDown`, `chevronLeft`, `chevronRight` y otros.

---

## 2. Correcciones

- [ ] **#23 · Mover `normalizar()` a `orden-busqueda.js`:** el issue pide que `normalizar()` viva en `public/js/orden-busqueda.js`, junto a `ordenarAlumnos()`, con pruebas en `test/orden-busqueda.test.js` (por ejemplo, "perez mariana" encuentra "Pérez López Mariana" y "munoz" encuentra "Muñoz"). Lo demás de #23 ya funciona en la tabla. Hazlo después de que se integre #24. Al moverla, escribe el rango de acentos como `/[̀-ͯ]/g`; hoy está con los caracteres literales, que funcionan pero no se ven al leer el código.
- [ ] **Menú principal:** `inicio.js` llama a `/api/resumen`, que todavía no existe (#34 de Sebastián). Es lo esperado por ahora.

---

## 3. Pendientes del Sprint 2

| Prioridad | Issue | Tarea | Pts | Depende de |
|---|---|---|---|---|
| 1 | **#24** | Abrir el PR de `feature/24-ordenar` | 3 | — · **hoy** |
| 2 | #23 | Buscador: mover `normalizar()` y sus pruebas | 2 | #24 |
| 3 | **#25** | Vista de detalle del alumno | 5 | **#20 de Sebastián**. Mientras llega, arma la vista con datos de ejemplo según `context/06` §6 |
| 4 | #33 | Vista Perfil: cuenta y contraseña | 3 | #32 |
| 5 | #35 | Tarjetas de indicadores y estado vacío del Menú principal | 2 | #34 |
| 6 | #36 | Gráficas del Menú principal con Chart.js | 5 | #34 |
| 7 | #41 | Umbrales configurables en Perfil (con Sebastián) | 3 | API de #41 |
| 8 | #28 | Cargar lista de seguimiento desde Alumnos | 3 | #27 · *puede recortarse* |
| 9 | #29 | Selector "Mostrar: Todos / lista" | 2 | #27 · *puede recortarse* |

**Ruta crítica:** #24 hoy → #25 en cuanto llegue #20 → #33 → #35/#36. Para la ficha del alumno en #25 ya existe la ruta `#alumnos/<matricula>`: hoy muestra la pantalla temporal "El detalle por materia llega en el Sprint 2" (función `mountDetalle` en `alumnos.js`). Reemplázala.

---

## 4. Cómo entregar
1. **Hoy:** abre el PR `feature/24-ordenar` → `develop`.
2. Cada issue nuevo en su propia rama, creada desde `develop` actualizado:
   ```
   git checkout develop
   git pull
   git checkout -b feature/25-detalle
   ```
3. Arrancar el servidor:
   ```
   .\.venv\Scripts\python.exe -m uvicorn sema.main:app --reload --host 127.0.0.1 --port 3000
   ```
4. Antes del PR: `npm test` y revisar la vista en tema claro y oscuro y en ancho de celular.
