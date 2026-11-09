# Backend FastAPI local

En PowerShell, crea el entorno e instala las dependencias:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Inicia la aplicación desde la raíz del repositorio:

```powershell
npm run dev
```

El comando usa el Python de `.venv`, inicia FastAPI en `127.0.0.1:3000` y recarga
al guardar cambios. Para ejecución normal usa `npm start`. La aplicación sirve
`/`, `/app`, `public/` y `/api`; los datos se guardan en `data/app.db`.
`DB_PATH` permite usar otra base para pruebas. El código Node permanece durante
la transición y ya no es el servidor de la aplicación.

Pruebas del backend y restablecimiento de la contraseña:

```powershell
.\.venv\Scripts\python.exe -m pytest -q tests
.\.venv\Scripts\python.exe -m scripts.reset_password
```

El secreto JWT persistente se guarda localmente en `data\jwt.secret`. También
puede configurarse `JWT_SECRET` con al menos 32 caracteres.

## Peticiones de ejemplo

```powershell
$login = @{ usuario = "USUARIO"; password = "CONTRASENA" } | ConvertTo-Json
$token = (Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/auth/login" -Method Post -ContentType "application/json" -Body $login).token
curl.exe -X POST http://127.0.0.1:3000/api/importaciones/monitoreo -H "Authorization: Bearer $token" -F "archivo=@test\fixtures\monitoreo-muestra.xlsx"
curl.exe http://127.0.0.1:3000/api/alumnos -H "Authorization: Bearer $token"
```

Use un token real obtenido mediante inicio de sesión local para las rutas protegidas.
