@echo off
echo Stopping any running Node servers on ports 3000 and 4000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr LISTENING') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4000 " ^| findstr LISTENING') do taskkill /PID %%a /F 2>nul
timeout /t 2 /nobreak >nul

echo Starting backend server...
start "Backend Server" cmd /k "cd /d %~dp0backend && npm.cmd run dev"
timeout /t 3 /nobreak >nul

echo Starting frontend dev server...
start "Frontend Server" cmd /k "cd /d %~dp0 && npm.cmd run dev"

echo Done! Backend: http://localhost:4000  Frontend: http://localhost:3000
timeout /t 2 /nobreak >nul
