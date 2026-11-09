# Matías Hernández Garrido · Frontend

**Fecha de revisión:** lunes 9 de noviembre de 2026 · **Revisó:** Calixto Isaac (Scrum Master)

> Las vistas que te faltaban del Sprint 2 ya están en la rama **`main`** (PR #68). El Scrum Master las hizo como suplente para no atrasar la entrega. Tu trabajo ahora es **revisarlas en el PR #68, entenderlas y probarlas**, porque vas a dar soporte y corregir lo que salga en las pruebas con el cliente.

---

## 1. Tareas completadas

| Issue | Estado | Nota |
|---|---|---|
| **#5** · Iniciar sesión | ✅ Integrado (PR #55) | |
| **#7** · Sidebar | ✅ Integrado (PR #54) | |
| **#8** · Chart.js e Inter locales | ✅ Integrado (PR #56) | |
| **#15, #16, #17** · Carga del Excel | ✅ Integrado (PR #58) | Suplente: Scrum Master |
| **#21** · Tabla de alumnos | ✅ Integrado (PR #58) | Suplente: Scrum Master |
| **#24** · Ordenar de peor a mejor | ✅ Integrado (PR #61) | Hecho por ti |
| **#25** · Vista de detalle del alumno | ✅ Integrado (PR #68) | `public/js/detalle.js` |
| **#28, #29** · Cargar lista y selector "Mostrar" | ✅ Integrado (PR #68) | `public/js/listas.js` y `alumnos.js`. El selector también está en el Menú principal |
| **#33** · Vista Perfil: cuenta y contraseña | ✅ Integrado (PR #68) | `public/js/perfil.js` |
| **#35, #36** · Tarjetas y gráficas del Menú principal | ✅ Integrado (PR #68) | `public/js/inicio.js` y `public/js/graficas.js` |
| **#41** · Umbrales en Perfil (con Sebastián) | ✅ Integrado (PR #68) | Vista previa del conteo y "Restaurar por defecto" |
| Extras | ✅ Integrado (PR #68) | Botón **Exportar** (Excel/CSV), menú ⋯ de la lista, pestañas **Formulario** e **Historial** en Cargar datos |

### Qué revisar en el código

- **`graficas.js`:** los colores salen de las variables `--chart-*` de `theme.css` y las gráficas se vuelven a dibujar al cambiar de tema. No escribas colores fijos en las gráficas.
- **`app.js`:** cada vista recibe un contenedor nuevo. Si una petición vieja termina tarde, `root.isConnected` es `false` y ya no pinta encima. Usa esa comprobación en todas tus vistas.
- **`ui-kit.js`** tiene herramientas nuevas:
  - `UI.download()` descarga archivos de la API con la sesión.
  - `UI.chipCodigo()` muestra los códigos NE, SC, DA y SD.
  - `UI.fechaCorta()` formatea fechas cortas.
  - `UI.getLista()` / `UI.setLista()` guardan la lista elegida.
  - `UI.formModal({ danger: true })` pinta el botón de confirmar como acción peligrosa.
  - Los menús `<details class="menu">` se cierran solos al hacer clic fuera o con Escape.
- **`.table-wrap`** ahora es `position: relative`. Sin eso, los textos `.sr-only` de las celdas hacían que la página se saliera del ancho en celular.

---

## 2. Pendientes

| Prioridad | Issue | Tarea | Pts | Nota |
|---|---|---|---|---|
| **1 · hoy** | — | `git checkout main && git pull` y revisar en el PR #68 las vistas de la tabla de arriba | — | Prueba cada vista en tema claro y oscuro y a 390 px |
| — | ~~#23~~ | ✅ Terminado por ti en `feature/23-buscador`. Se pasó a `chore/cierre-sprint2` (sobre `main`) y `scripts/rendimiento_busqueda.js` ya usa tu `normalizar()` | 2 | Borra `feature/23-buscador` cuando se integre |
| — | `feature/25-detalle` | **No se integra:** la vista final de #25 ya está en `main`, conectada a la API. Toma de tu versión lo que te sirva para #47 y borra la rama | — | |
| 3 | **#47** | Correcciones y pulido visual de lo que salga en las pruebas con el cliente (#40, #45) | 5 (compartido) | |

---

## 3. Cómo entregar
1. Cada corrección en su propia rama, creada desde **`main`** actualizado (D-23), y el PR hacia `main`:
   ```
   git checkout main
   git pull
   git checkout -b fix/47-<nombre>
   ```
2. Arrancar el servidor: `npm run dev`
3. Antes del PR: `npm test` y revisar la vista en tema claro y oscuro y en ancho de celular.
