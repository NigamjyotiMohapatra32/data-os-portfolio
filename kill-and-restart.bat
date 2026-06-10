@echo off
echo Killing all node.exe processes...
taskkill /F /IM node.exe /T 2>nul
echo Done killing. Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo Starting backend server...
start "Backend Server" cmd /k "cd /d %~dp0backend && npm.cmd run dev"
timeout /t 4 /nobreak >nul

echo Starting frontend dev server...
start "Frontend Server" cmd /k "cd /d %~dp0 && npm.cmd run dev"

echo Both servers launching!
echo Backend: http://localhost:4000  Frontend: http://localhost:3000
timeout /t 2 /nobreak >nul
