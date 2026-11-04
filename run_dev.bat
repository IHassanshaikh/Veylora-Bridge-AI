@echo off
echo ========================================================
echo   Starting Veylora Bridge AI (Backend + Frontend)
echo ========================================================

start "Veylora Backend (Port 8000)" cmd /k "cd /d %~dp0backend && .\venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

start "Veylora Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev -- -p 3000"

echo Servers launched in separate terminal windows!
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000

