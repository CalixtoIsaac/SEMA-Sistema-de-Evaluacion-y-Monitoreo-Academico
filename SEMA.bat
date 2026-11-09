@echo off
setlocal

rem === Segundo plano: espera a que el servidor responda y abre el navegador ===

if /i "%~1"=="esperar" goto esperar_y_abrir

title SEMA - Sistema de Evaluacion y Monitoreo Academico
cd /d "%~dp0"

rem --- Ajustes ---

rem ARRANQUE vacio = se detecta solo. Para forzarlo, quita "rem" y escribe el comando
rem sin la palabra python. Ejemplo: -m uvicorn sema.main:app --host 127.0.0.1 --port 3000
rem set "ARRANQUE=-m uvicorn sema.main:app --host 127.0.0.1 --port 3000"

set "ARRANQUE="
set "PUERTO=3000"
set "ABRIR_NAVEGADOR=1"

rem --- 1. Buscar Python 3.12 o superior (RNF-02, requirements.txt) ---

set "PY="
set "VERSION_OK=import sys; sys.exit(0 if sys.version_info >= (3, 12) else 1)"
py -3 -c "%VERSION_OK%" >nul 2>nul
if not errorlevel 1 set "PY=py -3"
if not defined PY (
    py -3.13 -c "%VERSION_OK%" >nul 2>nul
    if not errorlevel 1 set "PY=py -3.13"
)
if not defined PY (
    py -3.12 -c "%VERSION_OK%" >nul 2>nul
    if not errorlevel 1 set "PY=py -3.12"
)
if not defined PY (
    python -c "%VERSION_OK%" >nul 2>nul
    if not errorlevel 1 set "PY=python"
)
if not defined PY goto sin_python

rem --- 2. Entorno virtual (solo la primera vez) ---

rem Un .venv creado con un Python anterior a 3.12 se vuelve a crear.
if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" -c "%VERSION_OK%" >nul 2>nul
    if errorlevel 1 (
        echo El entorno de Python es anterior a 3.12. Se va a crear de nuevo...
        rmdir /s /q ".venv"
    )
)
if not exist ".venv\Scripts\python.exe" (
    echo Creando el entorno de Python, solo la primera vez...
    %PY% -m venv .venv
    if errorlevel 1 goto error
)

rem --- 3. Dependencias (solo la primera vez) ---
if not exist ".venv\instalado.txt" (
    if not exist "requirements.txt" (
        echo No se encontro requirements.txt
        goto error
    )
    echo Instalando dependencias, solo la primera vez...
    ".venv\Scripts\python.exe" -m pip install --disable-pip-version-check -r requirements.txt
    if errorlevel 1 goto error
    echo ok> ".venv\instalado.txt"
)

rem --- 4. Archivo .env ---

if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo Se ha creado el archivo .env a partir de .env.example

    ) else (
        echo No se encontro el archivo .env ni .env.example
        goto error
    )
)

rem 5. --- Puerto: usa PORT del .env si existe ---

for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
    if /i "%%a"=="PORT" set "PUERTO=%%b"
)

set "URL=http://localhost:%PUERTO%"
set "SALUD=http://127.0.0.1:%PUERTO%/api/health"

rem --- 6. Si SEMA ya esta abierto, solo abrir el navegador ---

curl.exe -s -f -m 2 "%SALUD%" >nul 2>nul
if not errorlevel 1 (
    echo SEMA ya esta abierto. Abriendo el navegador...
    start "" "%URL%"
    exit /b 0
)

rem --- 7. Archivo de arranque del backend ---

if not defined ARRANQUE if exist "sema\main.py" set "ARRANQUE=-m uvicorn sema.main:app --host 127.0.0.1 --port %PUERTO%"
if not defined ARRANQUE if exist "sema\__main__.py" set "ARRANQUE=-m sema"
if not defined ARRANQUE if exist "server.py" set "ARRANQUE=server.py"
if not defined ARRANQUE if exist "app.py" set "ARRANQUE=app.py"
if not defined ARRANQUE if exist "main.py" set "ARRANQUE=main.py"

if not defined ARRANQUE goto sin_arranque

rem --- 8. Abrir el navegador cuando el servidor este listo ---

if "%ABRIR_NAVEGADOR%"=="1" start "" /min "%~f0" esperar

rem --- 9. Arrancar el servidor ---

".venv\Scripts\python.exe" %ARRANQUE%
if errorlevel 1 goto error
goto fin

:sin_python
echo.
echo Instala Python 3.12 o superior desde https://www.python.org/downloads/
echo  Durante la instalacion marca la casilla "Add python.exe to PATH".
echo.
pause
exit /b 1

:sin_arranque
echo.
echo No se encontro el archivo de arranque del backend.
echo Pidele a Backend el comando y escribelo en ARRANQUE, al inicio de este archivo.
echo.
pause
exit /b 1

:error
echo.
echo Ocurrio un error. Revisa los mensajes anteriores.
echo.
pause
exit /b 1

:fin
pause
exit /b 0

:esperar_y_abrir
for /l %%i in (1, 1, 60) do (
    curl.exe -s -f -m 1 "%SALUD%" >nul 2>nul
    if not errorlevel 1 (
        start "" "%URL%"
        exit
    )
    timeout /t 1 /nobreak >nul
)
exit