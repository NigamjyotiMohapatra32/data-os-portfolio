@echo off
echo Killing all node.exe processes...
taskkill /F /IM node.exe /T 2>nul
echo Done killing. Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo Starting backend server...
start "Backend Server" cmd /k "cd /d C:\Users\user\Desktop\Data-OS-Portfolio\backend && node src/index.js"
timeout /t 4 /nobreak >nul

echo Starting frontend dev server...
start "Frontend Server" cmd /k "cd /d C:\Users\user\Desktop\Data-OS-Portfolio && npm run dev"

echo Both servers launching!
timeout /t 2 /nobreak >nul
