@echo off
cd /d "%~dp0backend"
echo Starting Data OS API on http://localhost:4000 ...
call npm.cmd run dev
