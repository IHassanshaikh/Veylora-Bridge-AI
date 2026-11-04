@echo off
echo ========================================================
echo   TrustBridge AI - PayPal AI Hackathon 2026 Launcher
echo ========================================================
start "TrustBridge Backend (FastAPI :8000)" cmd /k "%~dp0run_backend.bat"
start "TrustBridge Frontend (Next.js :3000)" cmd /k "%~dp0run_frontend.bat"
echo Services launching in background windows.
echo Frontend: http://localhost:3000
echo Backend API Docs: http://localhost:8000/docs
echo Interactive Target Store: http://localhost:3000/demo-store

