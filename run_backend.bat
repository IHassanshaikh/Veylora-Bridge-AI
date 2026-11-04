@echo off
echo Starting TrustBridge AI Backend on port 8000...
cd /d "%~dp0\backend"
call venv\Scripts\activate.bat
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

