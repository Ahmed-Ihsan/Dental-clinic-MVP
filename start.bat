@echo off
echo Starting Dental Clinic App...
echo.

echo [1/2] Starting Backend...
start "Dental Backend" cmd /k "cd /d %~dp0backend && venv\bin\python.exe app.py"

echo [2/2] Starting Frontend...
start "Dental Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
pause
