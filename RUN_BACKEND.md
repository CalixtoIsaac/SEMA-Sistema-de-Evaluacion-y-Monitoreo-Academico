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
