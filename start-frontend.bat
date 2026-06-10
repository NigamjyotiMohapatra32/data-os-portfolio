@echo off
cd /d "%~dp0"
echo Starting Data OS frontend on http://localhost:3000 ...
call npm.cmd run dev
