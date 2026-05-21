@echo off
netstat -aon | findstr ":3000 " | findstr LISTENING > "%~dp0port-status.txt"
netstat -aon | findstr ":4000 " | findstr LISTENING >> "%~dp0port-status.txt"
echo Port check complete. Results in port-status.txt
