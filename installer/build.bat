@echo off
rem Genera el instalador de SEMA en esta computadora (alternativa a GitHub Actions).
rem Requisitos: Python 3.12+ e Inno Setup 6 (https://jrsoftware.org/isdl.php).
rem Uso: installer\build.bat 1.0.0
setlocal
cd /d "%~dp0.."

set "VERSION=%~1"
if "%VERSION%"=="" set "VERSION=1.0.0"

if not exist ".venv\Scripts\python.exe" (
    py -3 -m venv .venv || goto error
)
".venv\Scripts\python.exe" -m pip install --disable-pip-version-check -q -r requirements.txt pyinstaller==6.11.1 || goto error
".venv\Scripts\python.exe" -m PyInstaller installer\sema.spec --noconfirm || goto error

set "ISCC=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if not exist "%ISCC%" set "ISCC=%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe"
if not exist "%ISCC%" (
    echo No se encontro Inno Setup 6. Instalalo desde https://jrsoftware.org/isdl.php
    goto error
)
"%ISCC%" /DMyAppVersion=%VERSION% installer\SEMA.iss || goto error

echo.
echo Listo: installer\Output\SEMA-Setup-%VERSION%.exe
pause
exit /b 0

:error
echo.
echo Ocurrio un error. Revisa los mensajes anteriores.
pause
exit /b 1
