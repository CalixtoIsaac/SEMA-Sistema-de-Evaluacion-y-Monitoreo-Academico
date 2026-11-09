from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from .db import ROOT, open_db
from .auth import router as auth_router, load_secret, seed_user
from .imports import router as imports_router
from .students import router as students_router
from .exportar import router as exportar_router
from .cuenta import router as cuenta_router
from .resumen import router as resumen_router

load_dotenv(ROOT / '.env')

def create_app(db_path=None, secret_path=None):
    app = FastAPI(title='SEMA', version='0.1.0')
    app.state.db = open_db(db_path)
    @app.exception_handler(HTTPException)
    def http_error(request: Request, exc: HTTPException):
        return JSONResponse(status_code=exc.status_code, content=exc.detail if isinstance(exc.detail,dict) else {'error':exc.detail})
    @app.exception_handler(RequestValidationError)
    def validation_error(request: Request, exc: RequestValidationError):
        # Contrato context/06: errores como {error, code}; el 422 queda reservado al formato del Excel.
        return JSONResponse(status_code=400, content={'error':'Datos incompletos o inválidos.','code':'VALIDACION'})
    app.state.secret_path = secret_path
    app.state.jwt_secret = load_secret(secret_path)
    app.state.login_attempts = {}
    seed_user(app.state.db)
    app.include_router(auth_router)
    app.include_router(cuenta_router)
    app.include_router(imports_router)
    # /api/alumnos/exportar va antes que /api/alumnos/{matricula} para que no lo capture el detalle.
    app.include_router(exportar_router)
    app.include_router(students_router)
    app.include_router(resumen_router)
    @app.get('/api/health')
    def health():
        return {'status':'online','app':'SEMA','version':'0.1.0','timestamp':datetime.now(timezone.utc).isoformat()}
    @app.get('/')
    def login_page(): return FileResponse(ROOT / 'public/login.html')
    @app.get('/app')
    def app_page(): return FileResponse(ROOT / 'public/app.html')
    app.mount('/', StaticFiles(directory=ROOT / 'public'), name='public')
    return app

app = create_app()
