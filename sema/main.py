from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from .db import ROOT, open_db

load_dotenv(ROOT / '.env')

def create_app(db_path=None, secret_path=None):
    app = FastAPI(title='SEMA', version='0.1.0')
    app.state.db = open_db(db_path)
    app.state.secret_path = secret_path
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
