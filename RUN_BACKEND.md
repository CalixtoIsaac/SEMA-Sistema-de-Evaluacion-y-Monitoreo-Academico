# Backend FastAPI local

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m uvicorn sema.main:app --host 127.0.0.1 --port 3000
.venv/bin/python -m pytest -q tests
```

La base de desarrollo se crea en `data/app.db`. `DB_PATH` permite una base aislada
para pruebas. Un solo servidor FastAPI sirve `/`, `/app`, `public/` y `/api`.
El código Node permanece como referencia de transición; su retiro será un cambio separado.

Restablecimiento de la contraseña D-04:

```bash
.venv/bin/python -m scripts.reset_password
```

El secreto se conserva en `data/jwt.secret` (modo 0600), o se toma de
`JWT_SECRET` cuando tiene al menos 32 caracteres.

## Peticiones de ejemplo (valores ficticios)

```bash
curl -s http://127.0.0.1:3000/api/health
curl -s -X POST http://127.0.0.1:3000/api/auth/login -H 'Content-Type: application/json' -d '{"usuario":"UsuarioPrueba","password":"ClaveFicticia123"}'
curl -s -X POST http://127.0.0.1:3000/api/importaciones/monitoreo -H 'Authorization: Bearer TOKEN_FICTICIO' -F 'archivo=@/ruta/fixture-sintetico.xlsx'
curl -s -X POST http://127.0.0.1:3000/api/importaciones/7/confirmar -H 'Authorization: Bearer TOKEN_FICTICIO' -H 'Content-Type: application/json' -d '{"modo":"fusionar"}'
curl -s http://127.0.0.1:3000/api/alumnos?periodo=202660 -H 'Authorization: Bearer TOKEN_FICTICIO'
```

Use un token real obtenido mediante inicio de sesión local para las rutas protegidas.
