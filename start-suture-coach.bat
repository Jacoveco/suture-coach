@echo off
cd /d "%~dp0"

echo ============================================
echo   Starting Suture Coach (REAL analysis mode)
echo ============================================
echo.
echo This uses your real ANTHROPIC_API_KEY from .env.local -
echo every photo/video you analyze will call the real Claude
echo API and cost real credits.
echo.
echo A new window will open and stay open while the app runs.
echo It will print two links once ready - something like:
echo   Local:    http://localhost:3000
echo   Network:  http://192.168.x.x:3000   (use this one on your phone)
echo.
echo To turn the app OFF again: either close that new window,
echo or double-click stop-suture-coach.bat.
echo.
pause

start "Suture Coach - close this window to stop the app" cmd /k "npm run dev:real"
