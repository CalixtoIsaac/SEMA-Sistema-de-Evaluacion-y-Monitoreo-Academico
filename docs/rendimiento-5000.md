# Rendimiento con 5,000 alumnos (#26 · T-12)

**Fecha:** 9 nov 2026 · **Cómo se midió:** `scripts/rendimiento_5000.py` (API, Excel sintético con datos ficticios) y `scripts/rendimiento_busqueda.js` (búsqueda y orden del navegador). Contenedor Linux de desarrollo; en una laptop con Windows los tiempos pueden variar ±50 %.

## RNF-01

| Requisito | Resultado | ✔ |
|---|---|---|
| Importar el Excel actual (≈3,700 filas) en < 5 s | **1.2 s** (530 alumnos × 7 materias = 3,710 filas, 30 columnas) · el Excel real trae 94 columnas, se estima **≈3 s** | ✔ |
| Buscador < 200 ms al teclear con 5,000 alumnos | **0.4 ms** por tecla (primera búsqueda 6 ms; ordenar los 5,000: 8 ms) | ✔ |

## 5,000 alumnos × 7 materias (35,000 filas · 4.3 MB)

| Operación | Antes | Después |
|---|---|---|
| Previsualizar (`POST /api/importaciones/monitoreo`) | 13.3 s | **9.4 s** |
| Confirmar (`POST …/confirmar`, fusionar) | 4.4 s | **3.0 s** |
| `GET /api/alumnos` | 0.74 s | 0.81 s |
| `GET /api/resumen` | 0.99 s | 1.01 s |
| `GET /api/alumnos/{matricula}` | 0.33 s | 0.41 s |
| `GET /api/alumnos/exportar` (xlsx) | 0.68 s | 0.89 s |

Las consultas de lectura quedan por debajo de 1 s con 10 veces el volumen real; la variación entre corridas es de ±20 %.

## Cambios

1. **Lector del Excel** (`sema/excel.py`): la posición de cada columna se calcula una sola vez por archivo. Antes se normalizaba el nombre de la columna en cada celda (77 veces por fila), ~40 % del tiempo de lectura.
2. **Separación de nombres** (`sema/indicators.py`): `split_name` quita acentos una vez por nombre y guarda en caché los resultados (cada alumno aparece una vez por materia).
3. **Migración v2** (`sema/db.py`, sin editar `lib/schema.sql`):
   - `idx_importaciones_periodo (periodo_id, tipo, estado, aplicado_en)`: cortes del periodo para la tendencia y la evolución.
   - `idx_cortes_alumno (alumno_id)`: evolución del detalle.
   - `idx_actividades_codigo (codigo) WHERE codigo IS NOT NULL`: alertas SC/DA.

El resto del tiempo de previsualización lo consume `openpyxl` al leer el XML del archivo; reducirlo exigiría otra biblioteca, y no hace falta para el volumen real.
