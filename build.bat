@echo off
echo ============================================
echo  Data OS Portfolio - Production Build
echo ============================================
cd /d "%~dp0"
echo Running npm build...
call npm.cmd run build
if %errorlevel% neq 0 (
  echo.
  echo BUILD FAILED. Check errors above.
  pause
  exit /b 1
)
echo.
echo BUILD COMPLETE! dist/ folder is ready.
echo You can now deploy the dist/ folder to Netlify.
pause
