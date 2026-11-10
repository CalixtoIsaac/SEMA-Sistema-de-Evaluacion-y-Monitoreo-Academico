"""Arranque de SEMA para el instalador (.exe) y para `python -m sema`.

Hace lo mismo que SEMA.bat pero sin depender de Python instalado:
1. Si SEMA ya está abierto, solo abre el navegador.
2. Si el puerto está ocupado por otro programa, busca uno libre.
3. Arranca el servidor y abre el navegador cuando /api/health responde.
"""
import os
import socket
import sys
import threading
import time
import urllib.request
import webbrowser

HOST = '127.0.0.1'


def _health_ok(port, timeout=1.0):
    try:
        with urllib.request.urlopen(f'http://{HOST}:{port}/api/health', timeout=timeout) as r:
            return r.status == 200 and b'SEMA' in r.read()
    except Exception:
        return False


def _port_free(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind((HOST, port))
            return True
        except OSError:
            return False


def _open_when_ready(port, url):
    for _ in range(120):
        if _health_ok(port):
            webbrowser.open(url)
            return
        time.sleep(0.5)


def main():
    try:
        sys.stdout.reconfigure(line_buffering=True)
    except (AttributeError, ValueError):
        pass
    from .db import ROOT, DATA_DIR
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    # Carga .env antes de leer PORT (sema.main también lo hace al importarse).
    from dotenv import load_dotenv
    load_dotenv(ROOT / '.env')
    load_dotenv(DATA_DIR / '.env')

    try:
        port = int(os.environ.get('PORT') or 3000)
    except ValueError:
        port = 3000
    open_browser = os.environ.get('SEMA_NO_BROWSER') != '1'

    if _health_ok(port):
        print('SEMA ya está abierto. Abriendo el navegador...')
        if open_browser:
            webbrowser.open(f'http://localhost:{port}')
        return 0

    if not _port_free(port):
        for candidate in range(port + 1, port + 50):
            if _port_free(candidate):
                print(f'El puerto {port} está ocupado por otro programa; SEMA usará el {candidate}.')
                port = candidate
                break
        else:
            print(f'No hay un puerto libre entre {port} y {port + 49}.')
            return 1

    url = f'http://localhost:{port}'
    print('SEMA · Sistema de Evaluación y Monitoreo Académico')
    print(f'Abierto en {url}')
    print(f'Datos guardados en {DATA_DIR}')
    print('Para cerrar SEMA, cierra esta ventana.\n')

    if open_browser:
        threading.Thread(target=_open_when_ready, args=(port, url), daemon=True).start()

    import uvicorn
    from .main import app
    # Se pasa el objeto app (no el texto "sema.main:app") para que funcione empaquetado.
    uvicorn.run(app, host=HOST, port=port, log_level='warning')
    return 0


def run():
    try:
        code = main()
    except Exception as exc:  # Mostrar el error en vez de cerrar la ventana de golpe.
        import traceback
        traceback.print_exc()
        print(f'\nOcurrió un error al iniciar SEMA: {exc}')
        code = 1
    if code and getattr(sys, 'frozen', False) and sys.stdin and sys.stdin.isatty():
        input('Presiona Enter para cerrar...')
    sys.exit(code)
