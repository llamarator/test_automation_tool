@echo off
REM ===============================
REM Script para iniciar backend y frontend
REM ===============================

REM --- Backend ---
echo Iniciando backend...
start cmd /k "cd backend && python main.py"

REM --- Frontend ---
echo Iniciando frontend...
start cmd /k "cd frontend && npm run dev"

echo ===============================
echo Todo iniciado correctamente 🚀
echo Backend en http://127.0.0.1:8000
echo Frontend en http://localhost:5173
echo ===============================
pause
